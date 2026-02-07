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
	}

	private function load_dependencies() {
		require_once $this->module_path . '/includes/class-pwca-admin-orders-loader.php';
	}

	private function load_submodules() {
		$loader = new Pwca_Admin_Orders_Loader( $this->module_path, $this->module_url );
		$loader->load();
	}
}
