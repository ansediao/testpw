<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Integration_Shipping_Assets {
	private $context;
	private $module_path;
	private $module_url;

	public function __construct( Pwca_Integration_Shipping_Context $context, $module_path, $module_url ) {
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

		$this->enqueue_scripts();
	}

	private function enqueue_scripts() {
		$js_path = $this->module_path . '/assets/js/pwca-checkout-shipping.js';
		if ( ! is_readable( $js_path ) ) {
			return;
		}

		wp_enqueue_script( 'pwca-checkout-shipping', $this->module_url . 'assets/js/pwca-checkout-shipping.js', array( 'jquery' ), filemtime( $js_path ), true );

		$selected = $this->get_selected_shipping_from_session();
		wp_localize_script(
			'pwca-checkout-shipping',
			'pwcaCheckoutShipping',
			array(
				'ajaxUrl'         => admin_url( 'admin-ajax.php' ),
				'nonce'           => wp_create_nonce( 'pwca_shipping_nonce' ),
				'selectedService' => $selected['service'],
				'selectedCost'    => $selected['cost'],
				'i18n'            => array(
					'calculateShipping'          => __( 'Calculate Shipping', 'woocommerce' ),
					'calculating'                => __( 'Calculating...', 'woocommerce' ),
					'shippingOptionsTitle'       => __( 'Shipping Options', 'woocommerce' ),
					'unableToLoadOptions'        => __( 'Unable to load shipping options. Please try again.', 'woocommerce' ),
					'failedToCalculateShipping'  => __( 'Failed to calculate shipping costs', 'woocommerce' ),
					'errorCalculatingShipping'   => __( 'Error occurred while calculating shipping', 'woocommerce' ),
					'updatingShipping'           => __( 'Updating shipping cost...', 'woocommerce' ),
					'failedToUpdateShippingCost' => __( 'Failed to update shipping cost', 'woocommerce' ),
					'errorUpdatingShippingCost'  => __( 'Error updating shipping cost', 'woocommerce' ),
					'days'                       => __( 'days', 'woocommerce' ),
				),
			)
		);
	}

	private function get_selected_shipping_from_session() {
		if ( ! function_exists( 'WC' ) || ! WC()->session ) {
			return array(
				'service' => '',
				'cost'    => null,
			);
		}

		$cost    = WC()->session->get( 'pwca_selected_shipping_cost' );
		$service = WC()->session->get( 'pwca_selected_shipping_service' );

		if ( $cost === null || $cost === false || ! $service ) {
			return array(
				'service' => '',
				'cost'    => null,
			);
		}

		return array(
			'service' => (string) $service,
			'cost'    => floatval( $cost ),
		);
	}
}

