<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( class_exists( 'WC_Shipping_Method' ) && ! class_exists( 'WC_Pwca_Shipping_Method' ) ) {
	final class WC_Pwca_Shipping_Method extends WC_Shipping_Method {
		public function __construct( $instance_id = 0 ) {
			$this->id                = 'pwca_shipping_method';
			$this->instance_id        = absint( $instance_id );
			$this->method_title       = __( 'PW Shipping', 'woocommerce' );
			$this->method_description = __( 'PW shipping method with API integration', 'woocommerce' );
			$this->supports           = array( 'shipping-zones', 'instance-settings', 'instance-settings-modal' );

			$this->init();
		}

		public function init() {
			$this->init_form_fields();
			$this->init_settings();

			$this->title = $this->get_option( 'title', __( 'PW Shipping', 'woocommerce' ) );
			add_action( 'woocommerce_update_options_shipping_' . $this->id, array( $this, 'process_admin_options' ) );
		}

		public function init_form_fields() {
			$this->instance_form_fields = array(
				'title' => array(
					'title'       => __( 'Shipping Title', 'woocommerce' ),
					'type'        => 'text',
					'description' => __( 'The title shown to customers during checkout.', 'woocommerce' ),
					'default'     => __( 'PW Shipping', 'woocommerce' ),
				),
			);
		}

		public function calculate_shipping( $package = array() ) {
			$rate = $this->get_shipping_rate_from_session();
			if ( $rate ) {
				$this->add_rate( $rate );
			}
		}

		private function get_shipping_rate_from_session() {
			if ( ! function_exists( 'WC' ) || ! WC()->session ) {
				return $this->get_placeholder_rate();
			}

			$selected_cost    = WC()->session->get( 'pwca_selected_shipping_cost' );
			$selected_service = WC()->session->get( 'pwca_selected_shipping_service' );

			if ( $selected_cost === null || $selected_cost === false || ! $selected_service ) {
				return $this->get_placeholder_rate();
			}

			$cost = floatval( $selected_cost );

			return array(
				'id'       => $this->id . '_' . $this->instance_id,
				'label'    => 'Shipping Options: ' . (string) $selected_service,
				'cost'     => $cost,
				'taxes'    => '',
				'calc_tax' => 'per_order',
				'meta_data' => array(
					'pwca_shipping_service' => (string) $selected_service,
					'pwca_shipping_cost'    => $cost,
				),
			);
		}

		private function get_placeholder_rate() {
			return array(
				'id'       => $this->id . '_' . $this->instance_id,
				'label'    => 'Shipping Options: Please calculate shipping',
				'cost'     => 0,
				'taxes'    => '',
				'calc_tax' => 'per_order',
				'meta_data' => array(
					'pwca_shipping_service' => 'Not selected',
					'pwca_shipping_cost'    => 0,
				),
			);
		}
	}
}

