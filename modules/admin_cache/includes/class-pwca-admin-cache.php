<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Admin_Cache {

	private $module_path;
	private $module_url;
	private $page_hook = '';

	public static function bootstrap( $module_path, $module_url ) {
		$instance = new self( $module_path, $module_url );
		$instance->register();
	}

	private function __construct( $module_path, $module_url ) {
		$this->module_path = trailingslashit( (string) $module_path );
		$this->module_url  = trailingslashit( (string) $module_url );
	}

	public function register() {
		add_action( 'wp_ajax_pw_clear_product_cache', array( $this, 'handle_clear_product_cache' ) );
		add_action( 'wp_ajax_pw_get_cache_status', array( $this, 'handle_get_cache_status' ) );
	}

	public function register_menu_page() {
		if ( ! $this->is_woocommerce_active() ) {
			return;
		}

		$this->page_hook = add_submenu_page(
			'pw-dashboard',
			'Product Data Cache',
			'Product Data Cache',
			'manage_options',
			'pw-cache-manager',
			array( $this, 'render_page' )
		);
	}

	public function enqueue_assets( $hook ) {
		if ( ! $this->should_load_assets( (string) $hook ) ) {
			return;
		}

		wp_enqueue_style(
			'pwca-admin-cache',
			$this->module_url . 'assets/scss/pwca-admin-cache.css',
			array(),
			null
		);

		wp_enqueue_script(
			'pwca-admin-cache',
			$this->module_url . 'assets/js/pwca-admin-cache.js',
			array(),
			null,
			true
		);
	}

	public function render_page() {
		$view_model = $this->get_view_model();
		$this->render_view( 'main-page.php', array( 'view_model' => $view_model ) );
	}

	public function handle_clear_product_cache() {
		if ( ! $this->verify_ajax_nonce( 'pw_clear_cache_nonce', 'nonce' ) ) {
			wp_send_json_error( 'Security verification failed' );
			return;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( 'Insufficient permissions' );
			return;
		}

		$api        = $this->get_api_client();
		$product_id = isset( $_POST['product_id'] ) ? (int) $_POST['product_id'] : 0;

		if ( $product_id > 0 ) {
			$result = $api->clear_cached_product_data( $product_id );
			if ( $result ) {
				wp_send_json_success( "Cache cleared for product ID {$product_id}" );
				return;
			}

			wp_send_json_error( "Failed to clear cache for product ID {$product_id}" );
			return;
		}

		$cleared_count = $api->clear_all_cached_product_data();
		wp_send_json_success( "Cleared cache data for {$cleared_count} products" );
	}

	public function handle_get_cache_status() {
		if ( ! $this->verify_ajax_nonce( 'pw_cache_status_nonce', 'nonce' ) ) {
			wp_send_json_error( 'Security verification failed' );
			return;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( 'Insufficient permissions' );
			return;
		}

		global $wpdb;

		$cache_count = (int) $wpdb->get_var(
			"SELECT COUNT(*) FROM {$wpdb->postmeta} WHERE meta_key = '_pw_aggregated_data_cache'"
		);

		$expired_count = (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$wpdb->postmeta} pm1
				INNER JOIN {$wpdb->postmeta} pm2 ON pm1.post_id = pm2.post_id
				WHERE pm1.meta_key = '_pw_aggregated_data_cache'
				AND pm2.meta_key = '_pw_aggregated_data_cache_time'
				AND pm2.meta_value < %d",
				time() - 30 * 60
			)
		);

		$latest_cache = $wpdb->get_var(
			"SELECT MAX(meta_value) FROM {$wpdb->postmeta} WHERE meta_key = '_pw_aggregated_data_cache_time'"
		);

		$latest_cache_time = $latest_cache ? date( 'Y-m-d H:i:s', (int) $latest_cache ) : 'None';

		wp_send_json_success(
			array(
				'total'        => (int) $cache_count,
				'expired'      => (int) $expired_count,
				'last_updated' => $latest_cache_time,
				'ttl'          => 30,
			)
		);
	}

	private function get_view_model() {
		return array(
			'ajax_url'           => admin_url( 'admin-ajax.php' ),
			'rest_product_base'  => trailingslashit( rest_url( 'pw/v1/product-data' ) ),
			'clear_cache_nonce'  => wp_create_nonce( 'pw_clear_cache_nonce' ),
			'cache_status_nonce' => wp_create_nonce( 'pw_cache_status_nonce' ),
		);
	}

	private function is_woocommerce_active() {
		if ( class_exists( 'WooCommerce' ) ) {
			return true;
		}

		$active_plugins = apply_filters( 'active_plugins', get_option( 'active_plugins', array() ) );

		return in_array( 'woocommerce/woocommerce.php', (array) $active_plugins, true );
	}

	private function should_load_assets( $hook ) {
		if ( $hook === $this->page_hook ) {
			return true;
		}

		$page = isset( $_GET['page'] ) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : '';

		return $page === 'pw-cache-manager';
	}

	private function render_view( $relative_path, array $data ) {
		$path = $this->module_path . 'views' . DIRECTORY_SEPARATOR . $relative_path;
		if ( ! file_exists( $path ) ) {
			return;
		}

		foreach ( $data as $key => $value ) {
			${$key} = $value;
		}

		require $path;
	}

	private function verify_ajax_nonce( $action, $field ) {
		if ( ! isset( $_POST[ $field ] ) ) {
			return false;
		}

		return wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST[ $field ] ) ), $action );
	}

	private function get_api_client() {
		return new Pw_Admin_Promowares_Api();
	}
}