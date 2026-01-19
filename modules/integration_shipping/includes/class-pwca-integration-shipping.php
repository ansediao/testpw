<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Integration_Shipping {
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
		require_once $this->module_path . '/includes/class-pwca-integration-shipping-context.php';
		require_once $this->module_path . '/includes/class-pwca-integration-shipping-assets.php';
		require_once $this->module_path . '/includes/class-pwca-integration-shipping-shipping.php';
		require_once $this->module_path . '/includes/class-pwca-integration-shipping-shipping-ajax.php';
	}

	private function register() {
		$context = new Pwca_Integration_Shipping_Context();

		( new Pwca_Integration_Shipping_Assets( $context, $this->module_path, $this->module_url ) )->register();
		( new Pwca_Integration_Shipping_Shipping() )->register();
		( new Pwca_Integration_Shipping_Shipping_Ajax() )->register();
	}
}

