<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Front_Product_Woo_Adjustments {
	private $context;

	public function __construct( Pwca_Front_Product_Context $context ) {
		$this->context = $context;
	}

	public function register() {
		add_filter( 'woocommerce_get_price_html', array( $this, 'filter_price_html' ), 10, 2 );
		add_action( 'woocommerce_after_shop_loop_item', array( $this, 'maybe_remove_loop_add_to_cart' ), 1 );
		add_action( 'woocommerce_single_product_summary', array( $this, 'maybe_remove_single_add_to_cart' ), 25 );
		add_filter( 'pre_get_posts', array( $this, 'exclude_composite_group_from_shop' ) );
	}

	public function exclude_composite_group_from_shop( $query ) {
		if ( ! is_a( $query, 'WP_Query' ) ) {
			return $query;
		}

		if ( ! $query->is_main_query() ) {
			return $query;
		}

		if ( ! is_shop() && ! is_product_category() && ! is_product_tag() && ! is_tax( 'product_cat' ) && ! is_tax( 'product_tag' ) ) {
			return $query;
		}

		if ( $query->get( 'post_type' ) !== 'product' ) {
			return $query;
		}

		global $wpdb;
		$group_post_ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT pm.post_id FROM {$wpdb->postmeta} pm WHERE pm.meta_key = %s AND pm.meta_value = %s",
				'pw_is_composite_group',
				'1'
			)
		);

		if ( empty( $group_post_ids ) ) {
			return $query;
		}

		$existing = (array) $query->get( 'post__not_in' );
		$query->set( 'post__not_in', array_unique( array_merge( $existing, array_map( 'intval', $group_post_ids ) ) ) );

		return $query;
	}

	public function filter_price_html( $price_html, $product ) {
		if ( ! is_a( $product, 'WC_Product' ) ) {
			return $price_html;
		}

		$product_id = $product->get_id();
		if ( ! $this->context->is_sync_product_id( $product_id ) ) {
			return $price_html;
		}

		return '';
	}

	public function maybe_remove_loop_add_to_cart() {
		global $product;
		if ( ! is_a( $product, 'WC_Product' ) ) {
			return;
		}

		if ( ! $this->context->is_sync_product_id( $product->get_id() ) ) {
			return;
		}

		remove_action( 'woocommerce_after_shop_loop_item', 'woocommerce_template_loop_add_to_cart' );
	}

	public function maybe_remove_single_add_to_cart() {
		$product = $this->context->get_current_product();
		if ( ! $product ) {
			return;
		}

		if ( ! $this->context->is_sync_product_id( $product->get_id() ) ) {
			return;
		}

		remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_add_to_cart', 30 );
		remove_action( 'woocommerce_grouped_add_to_cart', 'woocommerce_grouped_add_to_cart', 30 );
	}
}

