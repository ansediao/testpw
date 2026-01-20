<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Integration_Shipping_Checkout_Validation {
	private $context;

	public function __construct( Pwca_Integration_Shipping_Context $context ) {
		$this->context = $context;
	}

	public function register() {
		add_action( 'woocommerce_checkout_process', array( $this, 'validate_shipping_selection' ) );
	}

	public function validate_shipping_selection() {
		if ( ! $this->context->is_custom_checkout_page() ) {
			return;
		}

		if ( ! function_exists( 'WC' ) || ! WC()->cart || ! WC()->session ) {
			return;
		}

		if ( ! WC()->cart->needs_shipping() ) {
			return;
		}

		$chosen_methods = WC()->session->get( 'chosen_shipping_methods' );
		if ( ! is_array( $chosen_methods ) ) {
			$chosen_methods = array();
		}

		$uses_pwca_method = false;
		foreach ( $chosen_methods as $method_id ) {
			if ( is_string( $method_id ) && strpos( $method_id, 'pwca_shipping_method' ) !== false ) {
				$uses_pwca_method = true;
				break;
			}
		}

		if ( ! $uses_pwca_method ) {
			return;
		}

		$service = WC()->session->get( 'pwca_selected_shipping_service' );
		$cost    = WC()->session->get( 'pwca_selected_shipping_cost' );

		if ( ! $service || $cost === null || $cost === false ) {
			wc_add_notice( __( 'Please click "Calculate Shipping" and select a shipping option before placing your order.', 'woocommerce' ), 'error' );
		}
	}
}

