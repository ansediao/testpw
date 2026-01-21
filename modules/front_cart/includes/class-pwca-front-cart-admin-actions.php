<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Front_Cart_Admin_Actions {
	private $context;

	public function __construct( Pwca_Front_Cart_Context $context ) {
		$this->context = $context;
	}

	public function register() {
		add_filter( 'woocommerce_cart_item_name', array( $this, 'add_admin_action_buttons' ), 10, 3 );
		add_action( 'wp_ajax_pw_duplicate_cart_item', array( $this, 'handle_duplicate_cart_item' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'localize_admin_actions' ) );
	}

	public function add_admin_action_buttons( $product_name, $cart_item, $cart_item_key ) {
		if ( ! current_user_can( 'manage_options' ) ) {
			return $product_name;
		}

		if ( ! $this->context->is_cart_context() ) {
			return $product_name;
		}

		if ( ! is_array( $cart_item ) || empty( $cart_item ) ) {
			$cart_item = $this->fetch_cart_item_fallback( $cart_item_key );
			if ( ! is_array( $cart_item ) || empty( $cart_item ) ) {
				return $product_name;
			}
		}

		$buttons_html = $this->build_buttons_html( $cart_item, $cart_item_key );

		return $product_name . $buttons_html;
	}

	public function localize_admin_actions() {
		if ( ! $this->context->is_cart_context() || ! current_user_can( 'manage_options' ) ) {
			return;
		}

		wp_localize_script(
			'pwca-cart-admin-actions',
			'pwca_cart_admin_actions',
			array(
				'ajax_url' => admin_url( 'admin-ajax.php' ),
				'nonce'    => wp_create_nonce( 'pw_cart_actions' ),
				'messages' => array(
					'duplicating'      => __( 'Duplicating...', 'pw-admin' ),
					'redirecting'      => __( 'Product duplicated. Redirecting...', 'pw-admin' ),
					'duplicate_failed' => __( 'Duplicate failed, please try again.', 'pw-admin' ),
					'request_failed'   => __( 'Request failed, please try again.', 'pw-admin' ),
					'confirm_edit'     => __( 'Edit this product in the admin? This will open a new tab.', 'pw-admin' ),
				),
			)
		);
	}

	public function handle_duplicate_cart_item() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( __( 'Insufficient permissions', 'pw-admin' ) );
		}

		check_ajax_referer( 'pw_cart_actions', 'nonce' );

		$cart_item_key = isset( $_POST['cart_key'] ) ? sanitize_text_field( wp_unslash( $_POST['cart_key'] ) ) : '';
		if ( $cart_item_key === '' ) {
			wp_send_json_error( __( 'Invalid cart item', 'pw-admin' ) );
		}

		$cart_item = $this->get_cart_item_or_error( $cart_item_key );
		if ( is_wp_error( $cart_item ) ) {
			wp_send_json_error( $cart_item->get_error_message() );
		}

		$original_product_id = isset( $cart_item['product_id'] ) ? (int) $cart_item['product_id'] : 0;
		$original_product    = $original_product_id ? wc_get_product( $original_product_id ) : false;
		if ( ! $original_product ) {
			wp_send_json_error( __( 'Original product does not exist', 'pw-admin' ) );
		}

		$new_product_id = $this->duplicate_product_from_cart_item( $original_product, $cart_item );
		if ( ! $new_product_id ) {
			wp_send_json_error( __( 'Duplicate failed, please try again', 'pw-admin' ) );
		}

		wp_send_json_success(
			array(
				'new_product_id' => $new_product_id,
				'redirect_url'   => admin_url( 'post.php?post=' . (int) $new_product_id . '&action=edit' ),
			)
		);
	}

	private function fetch_cart_item_fallback( $cart_item_key ) {
		if ( ! function_exists( 'WC' ) || ! WC()->cart ) {
			return array();
		}

		$fetched = WC()->cart->get_cart_item( $cart_item_key );

		return is_array( $fetched ) ? $fetched : array();
	}

	private function build_buttons_html( $cart_item, $cart_item_key ) {
		$product_id   = isset( $cart_item['product_id'] ) ? (int) $cart_item['product_id'] : 0;
		$variation_id = isset( $cart_item['variation_id'] ) ? (int) $cart_item['variation_id'] : 0;

		$added_from = '';
		if ( isset( $cart_item['custom_data'] ) && is_array( $cart_item['custom_data'] ) ) {
			$added_from = isset( $cart_item['custom_data']['added_from'] ) ? (string) $cart_item['custom_data']['added_from'] : '';
		}

		$is_design  = $added_from === 'design';
		$is_product = $added_from === 'product';

		$html = '<div class=\"pwca-cart-admin-actions\" data-cart-key=\"' . esc_attr( $cart_item_key ) . '\">';
		$html .= $this->build_duplicate_link( $cart_item_key, $product_id, $variation_id, $is_product );
		$html .= $this->build_edit_link( $product_id, $cart_item_key, $is_design, $is_product );
		$html .= '<div class=\"pwca-cart-admin-message\" aria-live=\"polite\"></div>';
		$html .= '</div>';

		return $html;
	}

	private function build_duplicate_link( $cart_item_key, $product_id, $variation_id, $disabled ) {
		if ( $disabled ) {
			return '<button type="button" class="pwca-cart-admin-action pwca-cart-duplicate" disabled>' . esc_html__( 'Duplicate', 'pw-admin' ) . '</button>';
		}

		return '<button type="button" class="pwca-cart-admin-action pwca-cart-duplicate" data-cart-key="' . esc_attr( $cart_item_key ) . '" data-product-id="' . esc_attr( $product_id ) . '" data-variation-id="' . esc_attr( $variation_id ) . '">' . esc_html__( 'Duplicate', 'pw-admin' ) . '</button>';
	}

	private function build_edit_link( $product_id, $cart_item_key, $is_design, $is_product ) {
		if ( $is_design && $product_id ) {
			$url = add_query_arg(
				array(
					'product_id' => $product_id,
					'edit'       => 'true',
					'cart_key'   => $cart_item_key,
				),
				home_url( '/pwcanvas/' )
			);

			return '<a class=\"pwca-cart-admin-action pwca-cart-edit\" href=\"' . esc_url( $url ) . '\" target=\"_blank\" rel=\"noopener noreferrer\">' . esc_html__( 'Edit', 'pw-admin' ) . '</a>';
		}

		if ( $is_product && $product_id ) {
			return '<a class=\"pwca-cart-admin-action pwca-cart-edit\" href=\"' . esc_url( get_permalink( $product_id ) ) . '\" target=\"_blank\" rel=\"noopener noreferrer\">' . esc_html__( 'Edit', 'pw-admin' ) . '</a>';
		}

		return '<button type=\"button\" class=\"pwca-cart-admin-action pwca-cart-edit\" disabled>' . esc_html__( 'Edit', 'pw-admin' ) . '</button>';
	}

	private function get_cart_item_or_error( $cart_item_key ) {
		if ( ! function_exists( 'WC' ) || ! WC()->cart ) {
			return new WP_Error( 'pwca_cart_unavailable', __( 'Cart is unavailable', 'pw-admin' ) );
		}

		$item = WC()->cart->get_cart_item( $cart_item_key );
		if ( ! $item ) {
			return new WP_Error( 'pwca_cart_item_missing', __( 'Cart item does not exist', 'pw-admin' ) );
		}

		return $item;
	}

	private function duplicate_product_from_cart_item( $original_product, $cart_item ) {
		$original_post = get_post( $original_product->get_id() );
		if ( ! $original_post ) {
			return false;
		}

		$new_id = wp_insert_post(
			array(
				'post_title'   => $original_post->post_title . ' (Duplicate)',
				'post_content' => $original_post->post_content,
				'post_excerpt' => $original_post->post_excerpt,
				'post_status'  => 'draft',
				'post_type'    => 'product',
				'post_author'  => get_current_user_id(),
				'post_parent'  => $original_post->post_parent,
				'menu_order'   => $original_post->menu_order,
			)
		);

		if ( is_wp_error( $new_id ) || ! $new_id ) {
			return false;
		}

		$this->copy_product_meta( $original_product->get_id(), $new_id );
		$this->copy_product_taxonomies( $original_product->get_id(), $new_id );
		$this->copy_product_thumbnail( $original_product->get_id(), $new_id );
		$this->save_cart_custom_data( $new_id, $cart_item );
		$this->mark_as_duplicate( $new_id, $cart_item );

		return (int) $new_id;
	}

	private function copy_product_meta( $original_id, $new_id ) {
		$meta_data = get_post_meta( $original_id );
		foreach ( $meta_data as $key => $values ) {
			if ( in_array( $key, array( '_edit_lock', '_edit_last' ), true ) ) {
				continue;
			}

			foreach ( (array) $values as $value ) {
				add_post_meta( $new_id, $key, maybe_unserialize( $value ) );
			}
		}
	}

	private function copy_product_taxonomies( $original_id, $new_id ) {
		$taxonomies = array( 'product_cat', 'product_tag' );
		foreach ( $taxonomies as $taxonomy ) {
			$terms = wp_get_object_terms( $original_id, $taxonomy, array( 'fields' => 'ids' ) );
			if ( is_wp_error( $terms ) || empty( $terms ) ) {
				continue;
			}
			wp_set_object_terms( $new_id, $terms, $taxonomy );
		}
	}

	private function copy_product_thumbnail( $original_id, $new_id ) {
		$thumb_id = get_post_thumbnail_id( $original_id );
		if ( $thumb_id ) {
			set_post_thumbnail( $new_id, $thumb_id );
		}
	}

	private function save_cart_custom_data( $new_product_id, $cart_item ) {
		if ( ! isset( $cart_item['custom_data'] ) || ! is_array( $cart_item['custom_data'] ) ) {
			return;
		}

		update_post_meta( $new_product_id, '_pw_cart_custom_data', wp_json_encode( $cart_item['custom_data'] ) );
	}

	private function mark_as_duplicate( $new_product_id, $cart_item ) {
		update_post_meta( $new_product_id, '_pw_is_duplicate', true );
		update_post_meta( $new_product_id, '_pw_duplicate_time', current_time( 'timestamp' ) );
		update_post_meta( $new_product_id, '_pw_original_product_id', isset( $cart_item['product_id'] ) ? (int) $cart_item['product_id'] : 0 );
	}
}

