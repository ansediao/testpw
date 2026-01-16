<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Front_Cart_Context {
	public function is_cart_context() {
		return $this->is_cart_page() || $this->is_custom_cart_page();
	}

	public function is_cart_page() {
		return function_exists( 'is_cart' ) && is_cart();
	}

	public function is_custom_cart_page() {
		if ( function_exists( 'is_page' ) && is_page( 'custom-cart' ) ) {
			return true;
		}

		global $wp;
		$request = isset( $wp->request ) ? (string) $wp->request : '';
		if ( $request === '' ) {
			return false;
		}

		return strpos( $request, 'custom-cart' ) !== false;
	}

	public function is_checkout_context() {
		return ( function_exists( 'is_checkout' ) && is_checkout() ) || ( function_exists( 'is_page' ) && is_page( 'custom-checkout' ) );
	}

	public function is_cart_or_checkout_context() {
		return $this->is_cart_context() || $this->is_checkout_context();
	}
}

