<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Public_Checkout {
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
		require_once $this->module_path . '/includes/class-pwca-front-checkout-context.php';
		require_once $this->module_path . '/includes/class-pwca-front-checkout-assets.php';
		require_once $this->module_path . '/includes/class-pwca-front-checkout-redirect.php';
		require_once $this->module_path . '/includes/class-pwca-front-checkout-template-override.php';
	}

	private function register() {
		$context = new Pwca_Public_Checkout_Context();

		( new Pwca_Public_Checkout_Assets( $context, $this->module_path, $this->module_url ) )->register();
		( new Pwca_Public_Checkout_Redirect( $context ) )->register();
		( new Pwca_Public_Checkout_Template_Override( $this->get_plugin_root_path() ) )->register();
	}

	private function get_plugin_root_path() {
		return untrailingslashit( dirname( dirname( $this->module_path ) ) );
	}
}
