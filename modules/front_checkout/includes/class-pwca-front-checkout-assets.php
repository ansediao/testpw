<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Public_Checkout_Assets {
	private $context;
	private $module_path;
	private $module_url;
	private $plugin_root_path;
	private $plugin_root_url;

	public function __construct( Pwca_Public_Checkout_Context $context, $module_path, $module_url ) {
		$this->context     = $context;
		$this->module_path = $module_path;
		$this->module_url  = $module_url;
	}

	public function register() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
	}

	public function enqueue_assets() {
		if ( ! $this->context->is_checkout_context() ) {
			return;
		}

		$this->enqueue_styles();
	}

	private function enqueue_styles() {
		$css_path = $this->module_path . '/assets/scss/pwca-custom-checkout.css';
		if ( ! is_readable( $css_path ) ) {
			return;
		}

		wp_enqueue_style( 'pwca-custom-checkout', $this->module_url . 'assets/scss/pwca-custom-checkout.css', array(), filemtime( $css_path ), 'all' );
	}
}
