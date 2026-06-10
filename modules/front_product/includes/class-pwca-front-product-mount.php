<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Public_Product_Mount {
	private $context;

	public function __construct( Pwca_Public_Product_Context $context ) {
		$this->context = $context;
	}

	public function register() {
		add_action( 'woocommerce_product_meta_end', array( $this, 'render_mount_point' ), 100 );
	}

	public function render_mount_point() {
		$product = $this->context->get_current_product();
		if ( ! $product ) {
			return;
		}

		$product_id = $product->get_id();
		if ( ! $this->context->is_sync_product_id( $product_id ) ) {
			return;
		}

		$pw_id = $this->context->get_pw_id_by_product_id( $product_id );
		if ( $pw_id === '' ) {
			return;
		}

		$nonce    = wp_create_nonce( 'wp_rest' );
		$rest_url = rest_url( 'pwca/v1/product-data/' );

		echo '<div id="vue-dynamic-product-area" data-product-id="' . esc_attr( $product_id ) . '" data-pwca-id="' . esc_attr( $pw_id ) . '" data-rest-api-url="' . esc_url( $rest_url ) . '" data-rest-nonce="' . esc_attr( $nonce ) . '"></div>';
	}
}

