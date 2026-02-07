<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Admin Dashboard 主模块类
 * 负责协调各子模块的加载和注册
 */
final class Pwca_Admin_Dashboard {
	private static $instance = null;
	private $module_path;
	private $module_url;
	private $page_hooks = array();

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
		$this->load_dependencies();
		$this->load_submodules();
		$this->register();
	}

	private function load_dependencies() {
		require_once $this->module_path . 'includes/class-pwca-admin-dashboard-loader.php';
	}

	private function load_submodules() {
		$loader = new Pwca_Admin_Dashboard_Loader( $this->module_path, $this->module_url );
		$loader->load();
	}

	private function register() {
		add_action( 'admin_menu', array( $this, 'register_menu_pages' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
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

	/**
	 * 渲染主页面 - 委托给 Dashboard 子模块
	 */
	public function render_main_page() {
		if ( class_exists( 'Pwca_Admin_Dashboard_Dashboard' ) ) {
			Pwca_Admin_Dashboard_Dashboard::render_main_page();
		}
	}

	/**
	 * 渲染设置页面 - 委托给 Settings 子模块
	 */
	public function render_settings_page() {
		if ( class_exists( 'Pwca_Admin_Dashboard_Settings' ) ) {
			Pwca_Admin_Dashboard_Settings::render_settings_page();
		}
	}

	/**
	 * 渲染当前 Tab - 根据当前 tab 委托给对应的子模块
	 */
	public static function render_current_tab( $current_tab ) {
		switch ( $current_tab ) {
			case 'dashboard':
				if ( class_exists( 'Pwca_Admin_Dashboard_Dashboard' ) ) {
					Pwca_Admin_Dashboard_Dashboard::render_dashboard_tab();
				}
				break;
			case 'settings':
				if ( class_exists( 'Pwca_Admin_Dashboard_Settings' ) ) {
					Pwca_Admin_Dashboard_Settings::render_settings_tab();
				}
				break;
			case 'status':
				if ( class_exists( 'Pwca_Admin_Dashboard_Status' ) ) {
					Pwca_Admin_Dashboard_Status::render_status_tab();
				}
				break;
			case 'product_request':
				if ( class_exists( 'Pwca_Admin_Dashboard_Product_Request' ) ) {
					Pwca_Admin_Dashboard_Product_Request::render_product_request_tab();
				}
				break;
			case 'support':
				if ( class_exists( 'Pwca_Admin_Dashboard_Support' ) ) {
					Pwca_Admin_Dashboard_Support::render_support_tab();
				}
				break;
		}
	}

	public function get_page_hooks() {
		return $this->page_hooks;
	}

	public function get_module_path() {
		return $this->module_path;
	}

	public function get_module_url() {
		return $this->module_url;
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
}
