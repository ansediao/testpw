<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Public_Product {
	private $module_path;
	private $module_url;

	public static function bootstrap( $module_path, $module_url ) {
		$instance              = new self();
		$instance->module_path = untrailingslashit( $module_path );
		$instance->module_url  = trailingslashit( $module_url );

		$instance->load_dependencies();
		$instance->register();
	}

	private function load_dependencies() {
		require_once $this->module_path . '/includes/class-pwca-front-product-context.php';
		require_once $this->module_path . '/includes/class-pwca-front-product-assets.php';
		require_once $this->module_path . '/includes/class-pwca-front-product-mount.php';
		require_once $this->module_path . '/includes/class-pwca-front-product-woo-adjustments.php';
		require_once $this->module_path . '/includes/class-pwca-front-product-composite.php';
		require_once $this->module_path . '/includes/class-pwca-front-product-inquiry.php';
	}

	private function register() {
		$context = new Pwca_Front_Product_Context();

		( new Pwca_Public_Product_Assets( $context, $this->module_path, $this->module_url ) )->register();
		( new Pwca_Front_Product_Mount( $context ) )->register();
		( new Pwca_Public_Product_Woo_Adjustments( $context ) )->register();
		( new Pwca_Front_Product_Composite( $context ) )->register();
		( new Pwca_Front_Product_Inquiry( $context, $this->module_path ) )->register();
	}
}

