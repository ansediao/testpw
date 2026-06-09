<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Public_Checkout_Redirect {
	private $context;

	public function __construct( Pwca_Public_Checkout_Context $context ) {
		$this->context = $context;
	}

	public function register() {
		add_action( 'template_redirect', array( $this, 'redirect_to_custom_checkout_when_needed' ) );
	}

	public function redirect_to_custom_checkout_when_needed() {
		if ( $this->context->is_custom_checkout_page() || wp_doing_ajax() ) {
			return;
		}

		if ( ! function_exists( 'is_checkout' ) || ! is_checkout() ) {
			return;
		}

		if ( ! function_exists( 'WC' ) || ! WC()->cart ) {
			return;
		}

		if ( ! $this->cart_has_sync_product() ) {
			return;
		}

		$redirect_url = home_url( '/custom-checkout/' );
		wp_safe_redirect( $redirect_url );
		exit;
	}

	private function cart_has_sync_product() {
		foreach ( WC()->cart->get_cart() as $cart_item ) {
			$product_id = isset( $cart_item['product_id'] ) ? intval( $cart_item['product_id'] ) : 0;
			if ( $product_id <= 0 ) {
				continue;
			}

			$meta_value = get_post_meta( $product_id, 'pw_isSyncProduct', true );
			if ( (string) $meta_value === '1' ) {
				return true;
			}
		}

		return false;
	}
}

