<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Front_Checkout_Shipping {
	public function register() {
		add_action( 'woocommerce_shipping_init', array( $this, 'init_shipping_method' ) );
		add_filter( 'woocommerce_shipping_methods', array( $this, 'register_shipping_method' ) );

		add_action( 'woocommerce_init', array( $this, 'auto_add_shipping_method_to_zones' ) );
		add_action( 'woocommerce_checkout_update_order_review', array( $this, 'force_shipping_recalculation' ) );
		add_action( 'woocommerce_checkout_init', array( $this, 'init_checkout_shipping' ) );
		add_filter( 'woocommerce_package_rates', array( $this, 'filter_shipping_methods' ), 10, 2 );
	}

	public function init_shipping_method() {
		require_once __DIR__ . '/class-wc-pwca-shipping-method.php';
	}

	public function register_shipping_method( $methods ) {
		$methods['pwca_shipping_method'] = 'WC_Pwca_Shipping_Method';
		return $methods;
	}

	public function auto_add_shipping_method_to_zones() {
		if ( ! class_exists( 'WC_Shipping_Zones' ) || ! class_exists( 'WC_Shipping_Zone' ) ) {
			return;
		}

		$added_all = get_option( 'pwca_shipping_method_added_all_zones', false );
		if ( $added_all ) {
			return;
		}

		$zones    = WC_Shipping_Zones::get_zones();
		$zone_ids = array_map( 'intval', array_keys( $zones ) );
		$zone_ids[] = 0;

		foreach ( $zone_ids as $zone_id ) {
			$zone = ( $zone_id === 0 ) ? new WC_Shipping_Zone( 0 ) : WC_Shipping_Zones::get_zone( $zone_id );
			if ( ! $zone ) {
				continue;
			}

			if ( $this->zone_has_pwca_method( $zone ) ) {
				continue;
			}

			$zone->add_shipping_method( 'pwca_shipping_method' );
		}

		update_option( 'pwca_shipping_method_added_all_zones', true );
	}

	private function zone_has_pwca_method( $zone ) {
		$methods = $zone->get_shipping_methods();
		foreach ( $methods as $method ) {
			if ( isset( $method->id ) && $method->id === 'pwca_shipping_method' ) {
				return true;
			}
		}

		return false;
	}

	public function force_shipping_recalculation( $post_data ) {
		if ( ! function_exists( 'WC' ) || ! WC()->session ) {
			return;
		}

		$selected_cost = WC()->session->get( 'pwca_selected_shipping_cost' );
		if ( $selected_cost === null || $selected_cost === false ) {
			return;
		}

		$this->recalculate_cart_totals();
	}

	public function init_checkout_shipping() {
		if ( ! function_exists( 'WC' ) || ! WC()->session ) {
			return;
		}

		$selected_cost = WC()->session->get( 'pwca_selected_shipping_cost' );
		if ( $selected_cost === null || $selected_cost === false ) {
			return;
		}

		$this->recalculate_cart_totals();
	}

	private function recalculate_cart_totals() {
		if ( ! function_exists( 'WC' ) ) {
			return;
		}

		WC()->shipping()->reset_shipping();
		if ( WC()->cart ) {
			WC()->cart->calculate_shipping();
			WC()->cart->calculate_totals();
		}
	}

	public function filter_shipping_methods( $rates, $package ) {
		$pwca_rates = array();
		foreach ( $rates as $rate_id => $rate ) {
			if ( strpos( $rate_id, 'pwca_shipping_method' ) !== false ) {
				$pwca_rates[ $rate_id ] = $rate;
			}
		}

		if ( ! empty( $pwca_rates ) ) {
			return $pwca_rates;
		}

		return $rates;
	}
}
