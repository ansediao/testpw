<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Settings 子模块
 * 处理设置页面的表单保存和视图渲染
 */
final class Pwca_Admin_Dashboard_Settings {
	private static $instance = null;
	private $module_path;
	private $module_url;

	public static function bootstrap( $module_path, $module_url ) {
		if ( null === self::$instance ) {
			self::$instance = new self( $module_path, $module_url );
			self::$instance->init();
		}
		return self::$instance;
	}

	private function __construct( $module_path, $module_url ) {
		$this->module_path = trailingslashit( (string) $module_path );
		$this->module_url  = trailingslashit( (string) $module_url );
	}

	private function init() {
		$this->register();
	}

	private function register() {
		add_action( 'admin_init', array( $this, 'handle_settings_save' ) );
	}

	/**
	 * 渲染设置页面
	 */
	public static function render_settings_page() {
		$instance = self::$instance;
		if ( ! $instance ) {
			return;
		}

		$view_model = $instance->get_settings_page_view_model();
		$instance->render_view( 'settings-page.php', array( 'view_model' => $view_model ) );
	}

	/**
	 * 获取设置页面视图模型
	 */
	private function get_settings_page_view_model() {
		return array(
			'ajax_url'              => admin_url( 'admin-ajax.php' ),
			'admin_page_url'        => admin_url( 'admin.php' ),
			'store_url'             => home_url( '/' ),
			'rest_product_base'     => trailingslashit( rest_url( 'pwca/v1/product-data' ) ),
			'save_token_nonce'      => wp_create_nonce( 'pw_save_token_nonce' ),
			'clear_cache_nonce'     => wp_create_nonce( 'pw_clear_cache_nonce' ),
			'cache_status_nonce'    => wp_create_nonce( 'pw_cache_status_nonce' ),
			'product_request_nonce' => wp_create_nonce( 'pw_product_request_nonce' ),
		);
	}

	/**
	 * 渲染视图
	 */
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

	/**
	 * 渲染 Settings Tab
	 */
	public static function render_settings_tab() {
		$instance = self::$instance;
		if ( ! $instance ) {
			return;
		}

		$path = $instance->module_path . 'views' . DIRECTORY_SEPARATOR . 'settings.php';
		if ( file_exists( $path ) ) {
			require $path;
		}
	}

	public function handle_settings_save() {
		if ( 'POST' !== $_SERVER['REQUEST_METHOD'] ) {
			return;
		}

		if ( ! isset( $_POST['pwca_save_settings'] ) ) {
			return;
		}

		$messages = $this->process_settings_save();
		
		// 将消息存储到 transient 以便在页面显示
		if ( ! empty( $messages ) ) {
			set_transient( 'pwca_settings_messages', $messages, 30 );
		}
	}

	private function process_settings_save() {
		if ( ! isset( $_POST['pwca_settings_nonce'] ) ) {
			return array(
				array( 'type' => 'error', 'text' => 'Security verification failed' ),
			);
		}

		$nonce = sanitize_text_field( wp_unslash( $_POST['pwca_settings_nonce'] ) );
		if ( ! wp_verify_nonce( $nonce, 'pwca_settings' ) ) {
			return array(
				array( 'type' => 'error', 'text' => 'Security verification failed' ),
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
			array( 'type' => 'success', 'text' => 'Settings saved' ),
		);
	}

	public static function get_messages() {
		$messages = get_transient( 'pwca_settings_messages' );
		if ( false !== $messages ) {
			delete_transient( 'pwca_settings_messages' );
			return $messages;
		}
		return array();
	}

	public static function get_settings_data() {
		return array(
			'disable_ssl'    => (int) get_option( 'pw_disable_ssl', 0 ),
			'api_key'        => (string) get_option( 'pw_api_key', '' ),
			'api_secret'     => (string) get_option( 'pw_api_secret', '' ),
			'customize_text' => (string) get_option( 'pw_customize_text', 'Customize' ),
			'customize_color'=> (string) get_option( 'pw_customize_color', '#000000' ),
		);
	}
}
