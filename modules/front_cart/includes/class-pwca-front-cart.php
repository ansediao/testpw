<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Front_Cart {
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
		require_once $this->module_path . '/includes/class-pwca-front-cart-context.php';
		require_once $this->module_path . '/includes/class-pwca-front-cart-assets.php';
		require_once $this->module_path . '/includes/class-pwca-front-cart-handler.php';
		require_once $this->module_path . '/includes/class-pwca-front-cart-design-column.php';
		require_once $this->module_path . '/includes/class-pwca-front-cart-admin-actions.php';
		require_once $this->module_path . '/includes/class-pwca-front-cart-quantity.php';
	}

	private function register() {
		$context = new Pwca_Front_Cart_Context();

		( new Pwca_Front_Cart_Assets( $context, $this->module_path, $this->module_url ) )->register();
		( new Pwca_Front_Cart_Handler( $context ) )->register();
		( new Pwca_Front_Cart_Design_Column( $context ) )->register();
		( new Pwca_Front_Cart_Admin_Actions( $context ) )->register();
		( new Pwca_Front_Cart_Quantity( $context ) )->register();
	}
}
