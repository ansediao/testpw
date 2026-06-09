<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Public_Canvas_Context {
	public function is_canvas_request() {
		if ( absint( get_query_var( 'pw_canvas' ) ) === 1 ) {
			return true;
		}

		global $wp;
		if ( isset( $wp ) && isset( $wp->request ) ) {
			return untrailingslashit( home_url( $wp->request ) ) === untrailingslashit( home_url( '/pwcanvas/' ) );
		}

		return false;
	}

	public function get_product_id() {
		if ( ! isset( $_GET['product_id'] ) ) {
			return 0;
		}

		return absint( wp_unslash( $_GET['product_id'] ) );
	}

	public function get_product() {
		$product_id = $this->get_product_id();
		if ( ! $product_id ) {
			return null;
		}

		if ( ! function_exists( 'wc_get_product' ) ) {
			return null;
		}

		return wc_get_product( $product_id );
	}

	public function get_product_name() {
		$product = $this->get_product();
		if ( ! $product ) {
			return '';
		}

		return (string) $product->get_name();
	}

	public function get_pw_id() {
		$product_id = $this->get_product_id();
		if ( ! $product_id ) {
			return '';
		}

		$pw_id = get_post_meta( $product_id, 'pw_id', true );
		return is_string( $pw_id ) ? $pw_id : '';
	}

	public function is_edit_mode() {
		return isset( $_GET['edit'] );
	}
}

