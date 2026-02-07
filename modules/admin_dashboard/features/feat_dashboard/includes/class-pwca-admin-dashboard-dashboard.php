<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Dashboard 子模块
 * 处理主页面产品同步功能和视图渲染
 */
final class Pwca_Admin_Dashboard_Dashboard {
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
		// Dashboard 功能通过主模块页面渲染，这里处理 POST 请求
		add_action( 'admin_init', array( $this, 'handle_sync_request' ) );
	}

	/**
	 * 渲染主页面
	 */
	public static function render_main_page() {
		$instance = self::$instance;
		if ( ! $instance ) {
			return;
		}

		$view_model = $instance->get_main_page_view_model();
		$instance->render_view( 'main-page.php', array( 'view_model' => $view_model ) );
	}

	/**
	 * 获取主页面视图模型
	 */
	private function get_main_page_view_model() {
		return array(
			'ajax_url'             => admin_url( 'admin-ajax.php' ),
			'rest_product_base'    => trailingslashit( rest_url( 'pw/v1/product-data' ) ),
			'save_token_nonce'     => wp_create_nonce( 'pw_save_token_nonce' ),
			'clear_cache_nonce'    => wp_create_nonce( 'pw_clear_cache_nonce' ),
			'cache_status_nonce'   => wp_create_nonce( 'pw_cache_status_nonce' ),
			'current_token'        => get_option( 'pw_api_token', '' ),
			'api_mock_mode'        => (int) get_option( 'pw_api_mock_mode', 0 ),
			'save_mock_mode_nonce' => wp_create_nonce( 'pw_save_mock_mode_nonce' ),
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
	 * 渲染 Dashboard Tab
	 */
	public static function render_dashboard_tab() {
		$instance = self::$instance;
		if ( ! $instance ) {
			return;
		}

		$path = $instance->module_path . 'views' . DIRECTORY_SEPARATOR . 'dashboard.php';
		if ( file_exists( $path ) ) {
			require $path;
		}
	}

	public function handle_sync_request() {
		if ( 'POST' !== $_SERVER['REQUEST_METHOD'] ) {
			return;
		}

		if ( ! isset( $_POST['pwca_sync_products'] ) ) {
			return;
		}

		$messages = $this->process_sync_request();
		
		// 将消息存储到 transient 以便在页面显示
		if ( ! empty( $messages ) ) {
			set_transient( 'pwca_dashboard_messages', $messages, 30 );
		}
	}

	private function process_sync_request() {
		if ( ! isset( $_POST['pwca_sync_products_nonce'] ) ) {
			return array(
				array( 'type' => 'error', 'text' => 'Security verification failed' ),
			);
		}

		$nonce = sanitize_text_field( wp_unslash( $_POST['pwca_sync_products_nonce'] ) );
		if ( ! wp_verify_nonce( $nonce, 'pwca_sync_products' ) ) {
			return array(
				array( 'type' => 'error', 'text' => 'Security verification failed' ),
			);
		}

		if ( ! class_exists( 'Pwca_Integration_Promowares' ) ) {
			return array(
				array( 'type' => 'error', 'text' => 'Promowares sync module unavailable' ),
			);
		}

		if ( ! method_exists( 'Pwca_Integration_Promowares', 'schedule_product_import' ) ) {
			return array(
				array( 'type' => 'error', 'text' => 'Product import feature unavailable' ),
			);
		}

		return Pwca_Integration_Promowares::schedule_product_import();
	}

	public static function get_messages() {
		$messages = get_transient( 'pwca_dashboard_messages' );
		if ( false !== $messages ) {
			delete_transient( 'pwca_dashboard_messages' );
			return $messages;
		}
		return array();
	}
}
