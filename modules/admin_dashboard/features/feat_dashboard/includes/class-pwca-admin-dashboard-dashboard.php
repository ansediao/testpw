<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Dashboard 子模块
 * 处理主页面产品同步功能和视图渲染
 */
final class Pwca_Admin_Dashboard_Dashboard {
	private const PWCA_BIND_SECRET_KEY = 'o93aVh9I+M0yOvFB7JtFB2ejgBg4dIvBUHoM1zpGUQc=';
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
		add_action( 'admin_init', array( $this, 'handle_sync_request' ) );
		add_action( 'admin_init', array( $this, 'handle_connect_callback' ) );
		add_action( 'wp_ajax_pwca_get_bind_entry_url', array( $this, 'handle_get_bind_entry_url' ) );
		add_action( 'wp_ajax_pwca_disconnect_store', array( $this, 'handle_disconnect_store' ) );
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
			'admin_page_url'       => admin_url( 'admin.php' ),
			'store_url'            => home_url( '/' ),
			'rest_product_base'    => trailingslashit( rest_url( 'pw/v1/product-data' ) ),
			'save_token_nonce'     => wp_create_nonce( 'pw_save_token_nonce' ),
			'connect_nonce'        => wp_create_nonce( 'pwca_get_bind_entry_url' ),
			'disconnect_nonce'     => wp_create_nonce( 'pwca_disconnect_store' ),
			'clear_cache_nonce'    => wp_create_nonce( 'pw_clear_cache_nonce' ),
			'cache_status_nonce'   => wp_create_nonce( 'pw_cache_status_nonce' ),
			'current_token'        => get_option( 'pw_api_token', '' ),
			'current_store_id'     => get_option( 'pw_store_id', '' ),
			'has_connected_token'  => '' !== (string) get_option( 'pw_api_token', '' ) ? 1 : 0,
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

	public function handle_get_bind_entry_url() {
		check_ajax_referer( 'pwca_get_bind_entry_url', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( '权限不足' );
			return;
		}

		$callback_page = isset( $_POST['callback_page'] ) ? sanitize_text_field( wp_unslash( $_POST['callback_page'] ) ) : 'pw-dashboard';
		$callback_tab  = isset( $_POST['callback_tab'] ) ? sanitize_text_field( wp_unslash( $_POST['callback_tab'] ) ) : '';
		$callback_page = in_array( $callback_page, array( 'pw-dashboard', 'pw-dashboard-settings' ), true ) ? $callback_page : 'pw-dashboard';

		$callback_args = array(
			'page' => $callback_page,
		);
		if ( 'pw-dashboard-settings' === $callback_page && '' !== $callback_tab ) {
			$callback_args['tab'] = $callback_tab;
		}

		$callback_url = add_query_arg( $callback_args, admin_url( 'admin.php' ) );
		$store_url    = home_url();
		$timestamp    = (string) time();
		$sign_source  = sprintf( 'callback=%s&store_url=%s&timestamp=%s', $callback_url, $store_url, $timestamp );
		$sign         = hash_hmac( 'sha256', $sign_source, self::PWCA_BIND_SECRET_KEY );

		$bind_url = add_query_arg(
			array(
				'callback'  => $callback_url,
				'store_url' => $store_url,
				'timestamp' => $timestamp,
				'sign'      => $sign,
			),
			'https://www.promowares.xyz/api/store/bind-entry'
		);

		wp_send_json_success(
			array(
				'url' => $bind_url,
			)
		);
	}

	public function handle_disconnect_store() {
		check_ajax_referer( 'pwca_disconnect_store', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( '权限不足' );
			return;
		}

		delete_option( 'pw_store_id' );
		delete_option( 'pw_api_token' );

		set_transient(
			'pwca_dashboard_messages',
			array(
				array(
					'type' => 'success',
					'text' => 'Store disconnected successfully',
				),
			),
			30
		);

		wp_send_json_success( 'Store disconnected successfully' );
	}

	public function handle_connect_callback() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$state_raw = isset( $_GET['state'] ) ? wp_unslash( $_GET['state'] ) : '';
		$state     = $this->parse_connect_state( $state_raw );

		$page = isset( $_GET['page'] ) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : '';
		if ( '' === $page && isset( $state['page'] ) ) {
			$page = (string) $state['page'];
		}

		$valid_pages = array( 'pw-dashboard', 'pw-dashboard-settings' );
		if ( ! in_array( $page, $valid_pages, true ) ) {
			return;
		}

		$has_connect_result = isset( $_GET['success'] ) || isset( $_GET['store_id'] ) || isset( $_GET['token'] ) || isset( $_GET['error'] );
		if ( ! $has_connect_result ) {
			return;
		}

		$success_raw = isset( $_GET['success'] ) ? sanitize_text_field( wp_unslash( $_GET['success'] ) ) : '';
		$store_id    = isset( $_GET['store_id'] ) ? sanitize_text_field( wp_unslash( $_GET['store_id'] ) ) : '';
		$token       = isset( $_GET['token'] ) ? sanitize_text_field( wp_unslash( $_GET['token'] ) ) : '';
		$error       = isset( $_GET['error'] ) ? sanitize_text_field( wp_unslash( $_GET['error'] ) ) : '';
		$tab         = isset( $_GET['tab'] ) ? sanitize_text_field( wp_unslash( $_GET['tab'] ) ) : '';
		if ( '' === $tab && isset( $state['tab'] ) ) {
			$tab = sanitize_text_field( (string) $state['tab'] );
		}
		$is_success  = in_array( strtolower( $success_raw ), array( '1', 'true', 'success', 'yes' ), true );
		$has_error   = '' !== $error;

		$messages = array();
		if ( $is_success && ! $has_error && $store_id !== '' && $token !== '' ) {
			update_option( 'pw_store_id', $store_id );
			update_option( 'pw_api_token', $token );
			$messages[] = array(
				'type' => 'success',
				'text' => 'Store connected successfully',
			);
		} else {
			$message_text = $error !== '' ? $error : 'Store connection failed';
			$messages[]   = array(
				'type' => 'error',
				'text' => $message_text,
			);
		}

		if ( 'pw-dashboard-settings' === $page ) {
			set_transient( 'pwca_settings_messages', $messages, 30 );
		} else {
			set_transient( 'pwca_dashboard_messages', $messages, 30 );
		}

		$redirect_args = array(
			'page' => $page,
		);
		if ( 'pw-dashboard-settings' === $page && $tab !== '' ) {
			$redirect_args['tab'] = $tab;
		}
		$redirect_url = add_query_arg( $redirect_args, admin_url( 'admin.php' ) );
		wp_safe_redirect( $redirect_url );
		exit;
	}

	private function parse_connect_state( $state_raw ) {
		$state_raw = is_string( $state_raw ) ? trim( $state_raw ) : '';
		if ( '' === $state_raw ) {
			return array();
		}

		$candidates   = array( $state_raw, rawurldecode( $state_raw ) );
		$base64_state = strtr( $state_raw, '-_', '+/' );
		$padding      = strlen( $base64_state ) % 4;
		if ( 0 !== $padding ) {
			$base64_state .= str_repeat( '=', 4 - $padding );
		}
		$decoded_base64 = base64_decode( $base64_state, true );
		if ( false !== $decoded_base64 && '' !== $decoded_base64 ) {
			$candidates[] = $decoded_base64;
		}

		foreach ( $candidates as $candidate ) {
			$parsed = json_decode( (string) $candidate, true );
			if ( ! is_array( $parsed ) ) {
				continue;
			}

			$result = array();
			if ( isset( $parsed['page'] ) ) {
				$result['page'] = sanitize_text_field( (string) $parsed['page'] );
			}
			if ( isset( $parsed['tab'] ) ) {
				$result['tab'] = sanitize_text_field( (string) $parsed['tab'] );
			}
			if ( ! empty( $result ) ) {
				return $result;
			}
		}

		foreach ( $candidates as $candidate ) {
			$parsed = array();
			parse_str( (string) $candidate, $parsed );
			if ( ! is_array( $parsed ) ) {
				continue;
			}

			$result = array();
			if ( isset( $parsed['page'] ) ) {
				$result['page'] = sanitize_text_field( (string) $parsed['page'] );
			}
			if ( isset( $parsed['tab'] ) ) {
				$result['tab'] = sanitize_text_field( (string) $parsed['tab'] );
			}
			if ( ! empty( $result ) ) {
				return $result;
			}
		}

		if ( false !== strpos( $state_raw, '|' ) ) {
			$parts  = explode( '|', $state_raw );
			$result = array();
			if ( isset( $parts[0] ) && '' !== trim( $parts[0] ) ) {
				$result['page'] = sanitize_text_field( trim( $parts[0] ) );
			}
			if ( isset( $parts[1] ) && '' !== trim( $parts[1] ) ) {
				$result['tab'] = sanitize_text_field( trim( $parts[1] ) );
			}
			if ( ! empty( $result ) ) {
				return $result;
			}
		}

		return array();
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
