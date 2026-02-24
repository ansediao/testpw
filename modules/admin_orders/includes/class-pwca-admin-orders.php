<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Admin Orders 模块主类
 * 负责加载所有子模块
 */
final class Pwca_Admin_Orders {
	private $module_path;
	private $module_url;

	public static function bootstrap( $module_path, $module_url ) {
		$instance = new self();
		$instance->module_path = untrailingslashit( $module_path );
		$instance->module_url  = trailingslashit( $module_url );

		$instance->load_dependencies();
		$instance->load_submodules();
		$instance->register_hooks();
	}

	private function load_dependencies() {
		require_once $this->module_path . '/includes/class-pwca-admin-orders-loader.php';
	}

	private function load_submodules() {
		$loader = new Pwca_Admin_Orders_Loader( $this->module_path, $this->module_url );
		$loader->load();
	}

	private function register_hooks() {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
	}

	public function enqueue_assets( $hook ) {
		if ( ! $this->should_load_assets( (string) $hook ) ) {
			return;
		}

		$css_path = $this->module_path . '/assets/scss/pwca-admin-orders.css';
		if ( file_exists( $css_path ) ) {
			wp_enqueue_style(
				'pwca-admin-orders',
				$this->module_url . 'assets/scss/pwca-admin-orders.css',
				array(),
				null
			);
		}
	}

	private function should_load_assets( $hook ) {
		$screen = $this->get_current_screen_object();
		if ( ! $screen ) {
			return false;
		}

		$context = $this->get_screen_context( $screen );
		return $this->is_order_admin_screen( $context );
	}

	private function get_current_screen_object() {
		if ( ! function_exists( 'get_current_screen' ) ) {
			return null;
		}

		$screen = get_current_screen();
		if ( ! $screen || ! is_object( $screen ) ) {
			return null;
		}

		return $screen;
	}

	private function get_screen_context( $screen ) {
		return array(
			'id'        => isset( $screen->id ) ? (string) $screen->id : '',
			'base'      => isset( $screen->base ) ? (string) $screen->base : '',
			'post_type' => isset( $screen->post_type ) ? (string) $screen->post_type : '',
		);
	}

	private function is_order_admin_screen( array $context ) {
		if ( $context['id'] === 'shop_order' && $context['base'] === 'post' ) {
			return true;
		}

		if ( $context['post_type'] === 'shop_order' && in_array( $context['base'], array( 'post', 'edit' ), true ) ) {
			return true;
		}

		if ( $context['id'] === 'woocommerce_page_wc-orders' ) {
			return true;
		}

		if ( strpos( $context['id'], 'wc-orders' ) !== false ) {
			return true;
		}

		return false;
	}
}
