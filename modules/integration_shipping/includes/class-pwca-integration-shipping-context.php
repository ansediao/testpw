<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Integration_Shipping_Context {
	public function is_checkout_context() {
		return ( function_exists( 'is_checkout' ) && is_checkout() ) || $this->is_custom_checkout_page();
	}

	public function is_custom_checkout_page() {
		if ( function_exists( 'is_page' ) && is_page( 'custom-checkout' ) ) {
			return true;
		}

		global $wp;
		$request = isset( $wp->request ) ? (string) $wp->request : '';
		if ( $request === '' ) {
			return false;
		}

		return strpos( $request, 'custom-checkout' ) !== false;
	}
}

