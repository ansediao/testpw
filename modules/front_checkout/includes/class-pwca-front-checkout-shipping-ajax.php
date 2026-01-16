<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Front_Checkout_Shipping_Ajax {
	public function register() {
		add_action( 'wp_ajax_pwca_get_shipping_options', array( $this, 'get_shipping_options' ) );
		add_action( 'wp_ajax_nopriv_pwca_get_shipping_options', array( $this, 'get_shipping_options' ) );

		add_action( 'wp_ajax_pwca_update_shipping_cost', array( $this, 'update_shipping_cost' ) );
		add_action( 'wp_ajax_nopriv_pwca_update_shipping_cost', array( $this, 'update_shipping_cost' ) );

		add_action( 'wp_ajax_pwca_clear_shipping_selection', array( $this, 'clear_shipping_selection' ) );
		add_action( 'wp_ajax_nopriv_pwca_clear_shipping_selection', array( $this, 'clear_shipping_selection' ) );
	}

	public function get_shipping_options() {
		if ( ! $this->verify_nonce() ) {
			wp_send_json_error( __( 'Security check failed', 'woocommerce' ) );
			return;
		}

		if ( ! $this->is_cart_available() ) {
			wp_send_json_error( __( 'Cart not available', 'woocommerce' ) );
			return;
		}

		$weight       = $this->get_cart_weight_or_default();
		$country_code = $this->get_customer_country_or_default();

		if ( ! class_exists( 'Pw_Admin_Promowares_Api' ) ) {
			wp_send_json_error( __( 'Shipping service unavailable', 'woocommerce' ) );
			return;
		}

		$shipping_options = Pw_Admin_Promowares_Api::calculate_shipping_options( $country_code, $weight, 'PK1792' );
		if ( is_wp_error( $shipping_options ) ) {
			wp_send_json_error( __( 'Unable to calculate shipping costs. Please try again later.', 'woocommerce' ) );
			return;
		}

		if ( ! is_array( $shipping_options ) || ! isset( $shipping_options['code'] ) || intval( $shipping_options['code'] ) !== 200 ) {
			$message = isset( $shipping_options['message'] ) ? (string) $shipping_options['message'] : __( 'Unable to calculate shipping costs. Please try again later.', 'woocommerce' );
			wp_send_json_error( $message );
			return;
		}

		wp_send_json_success(
			array(
				'data'    => $shipping_options,
				'message' => __( 'Shipping options loaded successfully', 'woocommerce' ),
			)
		);
	}

	public function update_shipping_cost() {
		if ( ! $this->verify_nonce() ) {
			wp_send_json_error( __( 'Security check failed', 'woocommerce' ) );
			return;
		}

		if ( ! function_exists( 'WC' ) || ! WC()->session ) {
			wp_send_json_error( __( 'Session not available', 'woocommerce' ) );
			return;
		}

		$selected_cost = isset( $_POST['shipping_cost'] ) ? floatval( wp_unslash( $_POST['shipping_cost'] ) ) : null;
		$service_name  = isset( $_POST['service_name'] ) ? sanitize_text_field( wp_unslash( $_POST['service_name'] ) ) : '';

		if ( $selected_cost === null || $service_name === '' ) {
			wp_send_json_error( __( 'Missing shipping selection', 'woocommerce' ) );
			return;
		}

		WC()->session->set( 'pwca_selected_shipping_cost', $selected_cost );
		WC()->session->set( 'pwca_selected_shipping_service', $service_name );

		$this->recalculate_cart_totals();

		wp_send_json_success(
			array(
				'cost'    => $selected_cost,
				'service' => $service_name,
			)
		);
	}

	public function clear_shipping_selection() {
		if ( ! $this->verify_nonce() ) {
			wp_send_json_error( __( 'Security check failed', 'woocommerce' ) );
			return;
		}

		if ( ! function_exists( 'WC' ) || ! WC()->session ) {
			wp_send_json_error( __( 'Session not available', 'woocommerce' ) );
			return;
		}

		WC()->session->set( 'pwca_selected_shipping_cost', null );
		WC()->session->set( 'pwca_selected_shipping_service', null );

		$this->recalculate_cart_totals();

		wp_send_json_success(
			array(
				'message' => __( 'Shipping selection cleared', 'woocommerce' ),
			)
		);
	}

	private function verify_nonce() {
		$nonce = isset( $_POST['nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['nonce'] ) ) : '';
		return $nonce !== '' && wp_verify_nonce( $nonce, 'pwca_shipping_nonce' );
	}

	private function is_cart_available() {
		return function_exists( 'WC' ) && WC()->cart;
	}

	private function get_cart_weight_or_default() {
		$weight = 0.0;
		foreach ( WC()->cart->get_cart() as $cart_item ) {
			$product = isset( $cart_item['data'] ) ? $cart_item['data'] : null;
			if ( ! $product || ! method_exists( $product, 'get_weight' ) ) {
				continue;
			}

			$product_weight = $product->get_weight();
			$quantity       = isset( $cart_item['quantity'] ) ? floatval( $cart_item['quantity'] ) : 0;
			if ( $product_weight ) {
				$weight += floatval( $product_weight ) * $quantity;
			}
		}

		return $weight > 0 ? $weight : 1;
	}

	private function get_customer_country_or_default() {
		if ( ! isset( WC()->customer ) ) {
			return 'US';
		}

		$country_code = WC()->customer->get_shipping_country();
		if ( ! $country_code ) {
			$country_code = WC()->customer->get_billing_country();
		}

		return $country_code ? (string) $country_code : 'US';
	}

	private function recalculate_cart_totals() {
		if ( function_exists( 'WC' ) ) {
			WC()->shipping()->reset_shipping();
			if ( WC()->cart ) {
				WC()->cart->calculate_shipping();
				WC()->cart->calculate_totals();
			}
		}
	}
}

