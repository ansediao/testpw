<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Front_Product_Context {
	public function is_product_context() {
		return function_exists( 'is_product' ) && is_product();
	}

	public function get_current_product() {
		if ( ! function_exists( 'wc_get_product' ) ) {
			return null;
		}

		global $product;
		if ( is_a( $product, 'WC_Product' ) ) {
			return $product;
		}

		$product_id = $this->get_current_product_id();
		if ( ! $product_id ) {
			return null;
		}

		$fetched = wc_get_product( $product_id );
		return is_a( $fetched, 'WC_Product' ) ? $fetched : null;
	}

	public function get_current_product_id() {
		if ( ! $this->is_product_context() ) {
			return 0;
		}

		$post_id = get_the_ID();
		return $post_id ? absint( $post_id ) : 0;
	}

	public function is_sync_product_id( $product_id ) {
		$product_id = absint( $product_id );
		if ( ! $product_id ) {
			return false;
		}

		return get_post_meta( $product_id, 'pw_isSyncProduct', true ) === '1';
	}

	public function get_pw_id_by_product_id( $product_id ) {
		$product_id = absint( $product_id );
		if ( ! $product_id ) {
			return '';
		}

		$pw_id = get_post_meta( $product_id, 'pw_id', true );
		return is_string( $pw_id ) ? $pw_id : '';
	}
}

