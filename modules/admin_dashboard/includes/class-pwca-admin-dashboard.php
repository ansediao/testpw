<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Admin_Dashboard {
	private $module_path;
	private $module_url;
	private $page_hooks = array();

	public static function bootstrap( $module_path, $module_url ) {
		$instance = new self( $module_path, $module_url );
		$instance->register();
	}

	private function __construct( $module_path, $module_url ) {
		$this->module_path = trailingslashit( (string) $module_path );
		$this->module_url  = trailingslashit( (string) $module_url );
	}

	public function register() {
		add_action( 'admin_menu', array( $this, 'register_menu_pages' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		add_action( 'wp_ajax_pw_submit_product_request', array( $this, 'handle_product_request_submission' ) );
	}

	public function register_menu_pages() {
		if ( ! $this->is_woocommerce_active() ) {
			return;
		}

		$this->page_hooks['pw-dashboard'] = add_menu_page(
			'Promoware',
			'Promoware',
			'read',
			'pw-dashboard',
			array( $this, 'render_main_page' ),
			'dashicons-admin-generic',
			55
		);

		$this->page_hooks['pw-dashboard-settings'] = add_submenu_page(
			'pw-dashboard',
			'Dashboard',
			'Dashboard',
			'read',
			'pw-dashboard-settings',
			array( $this, 'render_settings_page' )
		);
	}

	public function enqueue_assets( $hook ) {
		if ( ! $this->should_load_assets( (string) $hook ) ) {
			return;
		}

		wp_enqueue_style(
			'pwca-admin-dashboard',
			$this->module_url . 'assets/scss/pwca-admin-dashboard.css',
			array( 'wp-color-picker' ),
			null
		);

		wp_enqueue_script(
			'pwca-admin-dashboard',
			$this->module_url . 'assets/js/pwca-admin-dashboard.js',
			array( 'wp-color-picker' ),
			null,
			true
		);
	}

	public function render_main_page() {
		$view_model = $this->get_main_page_view_model();
		$this->render_view( 'main-page.php', array( 'view_model' => $view_model ) );
	}

	public function render_settings_page() {
		$view_model = $this->get_settings_page_view_model();
		$this->render_view( 'settings-page.php', array( 'view_model' => $view_model ) );
	}

	private function is_woocommerce_active() {
		if ( class_exists( 'WooCommerce' ) ) {
			return true;
		}

		$active_plugins = apply_filters( 'active_plugins', get_option( 'active_plugins', array() ) );
		return in_array( 'woocommerce/woocommerce.php', (array) $active_plugins, true );
	}

	private function should_load_assets( $hook ) {
		if ( in_array( $hook, $this->page_hooks, true ) ) {
			return true;
		}

		$page = isset( $_GET['page'] ) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : '';
		return in_array( $page, array( 'pw-dashboard', 'pw-dashboard-settings' ), true );
	}

	private function get_main_page_view_model() {
		$messages = $this->maybe_schedule_product_import();

		return array(
			'ajax_url'           => admin_url( 'admin-ajax.php' ),
			'rest_product_base'  => trailingslashit( rest_url( 'pw/v1/product-data' ) ),
			'save_token_nonce'   => wp_create_nonce( 'pw_save_token_nonce' ),
			'clear_cache_nonce'  => wp_create_nonce( 'pw_clear_cache_nonce' ),
			'cache_status_nonce' => wp_create_nonce( 'pw_cache_status_nonce' ),
			'current_token'      => get_option( 'pw_api_token', '' ),
			'messages'           => $messages,
		);
	}

	private function maybe_schedule_product_import() {
		if ( 'POST' !== $_SERVER['REQUEST_METHOD'] ) {
			return array();
		}

		if ( ! isset( $_POST['pwca_sync_products'] ) ) {
			return array();
		}

		if ( ! isset( $_POST['pwca_sync_products_nonce'] ) ) {
			return array(
				array( 'type' => 'error', 'text' => '安全验证失败' ),
			);
		}

		$nonce = sanitize_text_field( wp_unslash( $_POST['pwca_sync_products_nonce'] ) );
		if ( ! wp_verify_nonce( $nonce, 'pwca_sync_products' ) ) {
			return array(
				array( 'type' => 'error', 'text' => '安全验证失败' ),
			);
		}

		if ( ! class_exists( 'Pwca_Integration_Promowares' ) ) {
			return array(
				array( 'type' => 'error', 'text' => 'Promowares 同步模块不可用' ),
			);
		}

		if ( ! method_exists( 'Pwca_Integration_Promowares', 'schedule_product_import' ) ) {
			return array(
				array( 'type' => 'error', 'text' => '产品导入功能不可用' ),
			);
		}

		return Pwca_Integration_Promowares::schedule_product_import();
	}

	private function get_settings_page_view_model() {
		$current_tab = $this->get_current_tab();

		return array(
			'ajax_url'           => admin_url( 'admin-ajax.php' ),
			'rest_product_base'  => trailingslashit( rest_url( 'pw/v1/product-data' ) ),
			'save_token_nonce'   => wp_create_nonce( 'pw_save_token_nonce' ),
			'clear_cache_nonce'  => wp_create_nonce( 'pw_clear_cache_nonce' ),
			'cache_status_nonce' => wp_create_nonce( 'pw_cache_status_nonce' ),
			'product_request_nonce' => wp_create_nonce( 'pw_product_request_nonce' ),
			'current_tab'        => $current_tab,
			'tabs'               => $this->get_tabs(),
			'settings'           => $this->get_settings_view_model( $current_tab ),
		);
	}

	private function get_current_tab() {
		$tab = isset( $_GET['tab'] ) ? sanitize_text_field( wp_unslash( $_GET['tab'] ) ) : 'dashboard';
		$tabs = $this->get_tabs();
		if ( isset( $tabs[ $tab ] ) ) {
			return $tab;
		}

		return 'dashboard';
	}

	private function get_tabs() {
		return array(
			'dashboard'       => 'Dashboard',
			'settings'        => 'Settings',
			'status'          => 'Status',
			'product_request' => 'Product Requirement',
			'support'         => 'Support',
		);
	}

	private function get_settings_view_model( $current_tab ) {
		if ( 'settings' !== $current_tab ) {
			return array();
		}

		$messages = array();

		if ( isset( $_POST['pwca_save_settings'] ) ) {
			$messages = $this->save_settings_from_post();
		}

		return array(
			'messages'       => $messages,
			'disable_ssl'    => (int) get_option( 'pw_disable_ssl', 0 ),
			'api_key'        => (string) get_option( 'pw_api_key', '' ),
			'api_secret'     => (string) get_option( 'pw_api_secret', '' ),
			'customize_text' => (string) get_option( 'pw_customize_text', 'Customize' ),
			'customize_color'=> (string) get_option( 'pw_customize_color', '#000000' ),
		);
	}

	private function save_settings_from_post() {
		if ( ! isset( $_POST['pwca_settings_nonce'] ) ) {
			return array(
				array( 'type' => 'error', 'text' => '安全验证失败' ),
			);
		}

		$nonce = sanitize_text_field( wp_unslash( $_POST['pwca_settings_nonce'] ) );
		if ( ! wp_verify_nonce( $nonce, 'pwca_settings' ) ) {
			return array(
				array( 'type' => 'error', 'text' => '安全验证失败' ),
			);
		}

		$disable_ssl     = isset( $_POST['pw_disable_ssl'] ) ? 1 : 0;
		$api_key         = isset( $_POST['pw_api_key'] ) ? sanitize_text_field( wp_unslash( $_POST['pw_api_key'] ) ) : '';
		$api_secret      = isset( $_POST['pw_api_secret'] ) ? sanitize_text_field( wp_unslash( $_POST['pw_api_secret'] ) ) : '';
		$customize_text  = isset( $_POST['pw_customize_text'] ) ? sanitize_text_field( wp_unslash( $_POST['pw_customize_text'] ) ) : 'Customize';
		$customize_color = isset( $_POST['pw_customize_color'] ) ? sanitize_hex_color( wp_unslash( $_POST['pw_customize_color'] ) ) : '#000000';

		update_option( 'pw_disable_ssl', $disable_ssl );
		update_option( 'pw_api_key', $api_key );
		update_option( 'pw_api_secret', $api_secret );
		update_option( 'pw_customize_text', $customize_text );
		update_option( 'pw_customize_color', $customize_color );

		return array(
			array( 'type' => 'success', 'text' => '设置已保存' ),
		);
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

	public function handle_product_request_submission() {
		if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), 'pw_product_request_nonce' ) ) {
			wp_send_json_error( __( 'Security check failed!', 'pw-admin' ) );
			return;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( __( 'Permission denied!', 'pw-admin' ) );
			return;
		}

		$description  = isset( $_POST['pw_product_description'] ) ? sanitize_textarea_field( wp_unslash( $_POST['pw_product_description'] ) ) : '';
		$product_link = isset( $_POST['pw_product_link'] ) ? esc_url_raw( wp_unslash( $_POST['pw_product_link'] ) ) : '';
		$image_url    = '';

		if ( isset( $_FILES['pw_product_image'] ) && ! empty( $_FILES['pw_product_image']['name'] ) ) {
			if ( ! function_exists( 'wp_handle_upload' ) ) {
				require_once ABSPATH . 'wp-admin/includes/file.php';
			}

			$uploaded_file     = $_FILES['pw_product_image'];
			$upload_overrides  = array( 'test_form' => false );
			$movefile          = wp_handle_upload( $uploaded_file, $upload_overrides );

			if ( $movefile && ! isset( $movefile['error'] ) ) {
				$image_url = $movefile['url'];
			}
		}

		if ( '' === $description && '' === $product_link && '' === $image_url ) {
			wp_send_json_error( __( 'Please fill in at least one field.', 'pw-admin' ) );
			return;
		}

		if ( class_exists( 'Flamingo_Inbound_Message' ) ) {
			$this->save_product_request_to_flamingo( $description, $product_link, $image_url );
			wp_send_json_success( __( 'Your product request has been submitted successfully!', 'pw-admin' ) );
			return;
		}

		wp_send_json_success( __( 'Your product request has been saved successfully!', 'pw-admin' ) );
	}

	private function save_product_request_to_flamingo( $description, $product_link, $image_url ) {
		$current_user = wp_get_current_user();
		$from_name    = $current_user->display_name ? $current_user->display_name : 'Admin User';
		$from_email   = $current_user->user_email ? $current_user->user_email : get_option( 'admin_email' );

		$flamingo_fields = array(
			'product_description' => $description,
			'product_link'        => $product_link,
			'product_image'       => $image_url,
			'request_type'        => 'Product Request',
			'request_source'      => 'Admin Dashboard',
			'submitted_by'        => $from_name,
		);

		$request_subject = __( 'Product Request from Admin Dashboard', 'pw-admin' );
		$post_data       = array(
			'post_type'   => 'flamingo_inbound',
			'post_status' => 'publish',
			'post_title'  => $request_subject,
		);

		$post_id = wp_insert_post( $post_data );
		if ( ! $post_id || is_wp_error( $post_id ) ) {
			return;
		}

		update_post_meta( $post_id, '_from', $from_name . ' <' . $from_email . '>' );
		update_post_meta( $post_id, '_from_name', $from_name );
		update_post_meta( $post_id, '_from_email', $from_email );
		update_post_meta( $post_id, '_subject', $request_subject );
		update_post_meta( $post_id, '_fields', $flamingo_fields );
	}
}
