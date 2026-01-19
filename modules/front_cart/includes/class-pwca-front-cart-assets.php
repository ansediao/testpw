<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Front_Cart_Assets {
	private $context;
	private $module_path;
	private $module_url;

	public function __construct( Pwca_Front_Cart_Context $context, $module_path, $module_url ) {
		$this->context     = $context;
		$this->module_path = $module_path;
		$this->module_url  = $module_url;
	}

	public function register() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		add_action( 'wp_footer', array( $this, 'render_modal_html' ) );
	}

	public function enqueue_assets() {
		if ( ! $this->context->is_cart_or_checkout_context() ) {
			return;
		}

		$this->enqueue_styles();
		$this->enqueue_scripts();
	}

	private function enqueue_styles() {
		if ( $this->context->is_cart_context() ) {
			wp_enqueue_style( 'pwca-custom-cart', $this->module_url . 'assets/scss/pwca-custom-cart.css', array(), '1.0.0', 'all' );
			wp_enqueue_style( 'pwca-cart-modal', $this->module_url . 'assets/scss/pwca-cart-modal.css', array(), '1.0.0', 'all' );
			wp_enqueue_style( 'pwca-cart-quantity-controls', $this->module_url . 'assets/scss/pwca-cart-quantity-controls.css', array(), '1.0.0', 'all' );
		}
	}

	private function enqueue_scripts() {
		if ( $this->context->is_cart_context() ) {
			wp_enqueue_script( 'pwca-cart-modal', $this->module_url . 'assets/js/pwca-cart-modal.js', array( 'jquery' ), '1.0.0', true );
			wp_enqueue_script( 'pwca-cart-design-column', $this->module_url . 'assets/js/pwca-cart-design-column.js', array( 'jquery' ), '1.0.0', true );
			wp_enqueue_script( 'pwca-cart-quantity-controls', $this->module_url . 'assets/js/pwca-cart-quantity-controls.js', array( 'jquery' ), '1.0.0', true );
			wp_enqueue_script( 'pwca-cart-admin-actions', $this->module_url . 'assets/js/pwca-cart-admin-actions.js', array( 'jquery' ), '1.0.0', true );
		}

		if ( $this->context->is_cart_or_checkout_context() ) {
			wp_enqueue_script( 'pwca-cart-url-images', $this->module_url . 'assets/js/pwca-cart-url-images.js', array(), '1.0.0', true );
		}
	}

	public function render_modal_html() {
		if ( ! $this->context->is_cart_context() ) {
			return;
		}

		$view_path = $this->module_path . '/views/cart-modal.php';
		if ( is_readable( $view_path ) ) {
			include $view_path;
		}
	}
}
