<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Public_Product_Composite {
	private $context;

	public function __construct( Pwca_Public_Product_Context $context ) {
		$this->context = $context;
	}

	public function register() {
		add_action( 'woocommerce_single_product_summary', array( $this, 'render_components_list' ), 40 );
	}

	public function render_components_list() {
		if ( ! $this->context->is_product_context() ) {
			return;
		}

		$product = $this->context->get_current_product();
		if ( ! $product ) {
			return;
		}

		$current_product_id = $product->get_id();
		$composite_data     = $this->get_composite_data( $current_product_id );

		if ( ! $composite_data ) {
			return;
		}

		$main_product_id  = $composite_data['main_product_id'];
		$child_product_ids = $composite_data['child_product_ids'];

		if ( ! $main_product_id || ( empty( $child_product_ids ) && $main_product_id !== $current_product_id ) ) {
			return;
		}

		$this->render_list_html( $current_product_id, $main_product_id, $child_product_ids );
	}

	private function get_composite_data( $current_product_id ) {
		$current_product_id = absint( $current_product_id );
		if ( ! $current_product_id ) {
			return null;
		}

		$all_ids = get_post_meta( $current_product_id, 'pw_composite_all_product_ids', true );
		if ( is_array( $all_ids ) && ! empty( $all_ids ) ) {
			$child_ids = array_values( array_diff( array_map( 'intval', $all_ids ), array( $current_product_id ) ) );
			return array(
				'main_product_id'  => $current_product_id,
				'child_product_ids' => $child_ids,
			);
		}

		$parent_id = get_post_meta( $current_product_id, 'pw_composite_main_post_id', true );
		$parent_id = $parent_id ? absint( $parent_id ) : 0;
		if ( ! $parent_id ) {
			return null;
		}

		$parent_all_ids = get_post_meta( $parent_id, 'pw_composite_all_product_ids', true );
		if ( ! is_array( $parent_all_ids ) || empty( $parent_all_ids ) ) {
			return null;
		}

		$child_ids = array_values( array_diff( array_map( 'intval', $parent_all_ids ), array( $parent_id ) ) );
		return array(
			'main_product_id'  => $parent_id,
			'child_product_ids' => $child_ids,
		);
	}

	private function render_list_html( $current_product_id, $main_product_id, $child_product_ids ) {
		echo '<ul class="pwca-composite-components">';

		$this->render_link_item( $current_product_id, $main_product_id );

		foreach ( $child_product_ids as $child_id ) {
			$child_id = absint( $child_id );
			if ( ! $child_id ) {
				continue;
			}

			$this->render_link_item( $current_product_id, $child_id );
		}

		echo '</ul>';
	}

	private function render_link_item( $current_product_id, $target_product_id ) {
		$current_product_id = absint( $current_product_id );
		$target_product_id  = absint( $target_product_id );

		$label = get_post_meta( $target_product_id, 'pw_container_value', true );
		$label = is_string( $label ) ? $label : '';
		if ( $label === '' ) {
			return;
		}

		if ( $current_product_id === $target_product_id ) {
			echo '<li class="active">' . esc_html( $label ) . '</li>';
			return;
		}

		echo '<li><a href="' . esc_url( get_permalink( $target_product_id ) ) . '">' . esc_html( $label ) . '</a></li>';
	}
}

