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
		add_filter( 'woocommerce_post_class', array( $this, 'filter_loop_product_classes' ), 10, 2 );
		add_filter( 'woocommerce_get_product_thumbnail', array( $this, 'filter_loop_product_thumbnail_html' ), 10, 2 );
		add_filter( 'woocommerce_single_product_image_gallery_classes', array( $this, 'filter_single_image_gallery_classes' ), 10, 1 );
		add_filter( 'post_class', array( $this, 'filter_post_classes' ), 10, 3 );
		add_filter( 'render_block_woocommerce/product-image', array( $this, 'filter_block_product_image' ), 10, 2 );
		add_action( 'woocommerce_after_shop_loop_item', array( $this, 'maybe_remove_loop_add_to_cart' ), 1 );
		add_action( 'woocommerce_single_product_summary', array( $this, 'maybe_remove_single_add_to_cart' ), 25 );
		add_filter( 'pre_get_posts', array( $this, 'exclude_composite_group_from_shop' ) );
	}

	public function exclude_composite_group_from_shop( $query ) {
		if ( ! is_a( $query, 'WP_Query' ) ) {
			return $query;
		}

		if ( ! is_shop() && ! is_product_category() && ! is_product_tag() && ! is_tax( 'product_cat' ) && ! is_tax( 'product_tag' ) ) {
			return $query;
		}

		$post_type = $query->get( 'post_type' );
		if ( is_array( $post_type ) ) {
			if ( ! in_array( 'product', $post_type, true ) ) {
				return $query;
			}
		} elseif ( 'product' !== $post_type ) {
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
		$child_post_ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT pm.post_id
				FROM {$wpdb->postmeta} pm
				WHERE pm.meta_key = %s
					AND CAST(pm.meta_value AS UNSIGNED) > 0
					AND CAST(pm.meta_value AS UNSIGNED) <> pm.post_id",
				'pw_composite_main_post_id'
			)
		);

		$excluded_ids = array_unique(
			array_merge(
				array_map( 'intval', (array) $group_post_ids ),
				array_map( 'intval', (array) $child_post_ids )
			)
		);

		if ( empty( $excluded_ids ) ) {
			return $query;
		}

		$existing = (array) $query->get( 'post__not_in' );
		$query->set( 'post__not_in', array_unique( array_merge( $existing, $excluded_ids ) ) );

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

	public function filter_loop_product_classes( $classes, $product ) {
		if ( ! is_a( $product, 'WC_Product' ) ) {
			return $classes;
		}

		if ( ! $this->context->is_sync_product_id( $product->get_id() ) ) {
			return $classes;
		}

		$classes[] = 'pwca-sync-product-image-area';

		return array_unique( $classes );
	}

	public function filter_loop_product_thumbnail_html( $thumbnail_html, $product_id ) {
		$product_id = absint( $product_id );
		if ( ! $product_id ) {
			return $thumbnail_html;
		}

		if ( ! $this->context->is_sync_product_id( $product_id ) ) {
			return $thumbnail_html;
		}

		if ( strpos( $thumbnail_html, '<img' ) === false ) {
			return $thumbnail_html;
		}

		if ( preg_match( '/<img[^>]*\bclass="/i', $thumbnail_html ) ) {
			return preg_replace( '/(<img[^>]*\bclass=")([^"]*)"/i', '$1$2 pwca-sync-product-image-area"', $thumbnail_html, 1 );
		}

		return preg_replace( '/<img\b/i', '<img class="pwca-sync-product-image-area"', $thumbnail_html, 1 );
	}

	public function filter_single_image_gallery_classes( $classes ) {
		$product = $this->context->get_current_product();
		if ( ! $product ) {
			return $classes;
		}

		if ( ! $this->context->is_sync_product_id( $product->get_id() ) ) {
			return $classes;
		}

		$classes[] = 'pwca-sync-product-image-area';

		return array_unique( $classes );
	}

	public function filter_post_classes( $classes, $class, $post_id ) {
		$post_id = absint( $post_id );
		if ( ! $post_id ) {
			return $classes;
		}

		if ( get_post_type( $post_id ) !== 'product' ) {
			return $classes;
		}

		if ( ! $this->context->is_sync_product_id( $post_id ) ) {
			return $classes;
		}

		$classes[] = 'pwca-sync-product-image-area';

		return array_unique( $classes );
	}

	public function filter_block_product_image( $block_content, $block ) {
		if ( strpos( $block_content, 'wc-block-components-product-image' ) === false ) {
			return $block_content;
		}

		$product_id = 0;
		if ( is_array( $block ) && isset( $block['context']['postId'] ) ) {
			$product_id = absint( $block['context']['postId'] );
		}

		if ( ! $product_id ) {
			$product_id = get_the_ID() ? absint( get_the_ID() ) : 0;
		}

		if ( ! $product_id ) {
			return $block_content;
		}

		if ( get_post_type( $product_id ) !== 'product' ) {
			return $block_content;
		}

		if ( ! $this->context->is_sync_product_id( $product_id ) ) {
			return $block_content;
		}

		if ( strpos( $block_content, 'pwca-sync-product-image-area' ) !== false ) {
			return $block_content;
		}

		$block_content = preg_replace( '/(class="[^"]*wc-block-components-product-image[^"]*)"/i', '$1 pwca-sync-product-image-area"', $block_content, 1 );

		if ( preg_match( '/<img[^>]*\bclass="/i', $block_content ) ) {
			$block_content = preg_replace( '/(<img[^>]*\bclass=")([^"]*)"/i', '$1$2 pwca-sync-product-image-area"', $block_content, 1 );
		} else {
			$block_content = preg_replace( '/<img\b/i', '<img class="pwca-sync-product-image-area"', $block_content, 1 );
		}

		return $block_content;
	}
}

