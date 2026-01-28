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
		add_action( 'wp_ajax_nopriv_pw_duplicate_cart_item', array( $this, 'handle_duplicate_cart_item' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'localize_admin_actions' ) );
	}

	public function add_admin_action_buttons( $product_name, $cart_item, $cart_item_key ) {
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
		if ( ! $this->context->is_cart_context() ) {
			return;
		}

		wp_localize_script(
			'pwca-cart-admin-actions',
			'pwca_cart_admin_actions',
			array(
				'ajax_url' => admin_url( 'admin-ajax.php' ),
				'nonce'    => wp_create_nonce( 'pw_cart_actions' ),
				'messages' => array(
					'duplicating'      => __( '复制中…', 'pw-admin' ),
					'duplicated'       => __( '已复制该商品项。', 'pw-admin' ),
					'duplicate_failed' => __( '复制失败，请重试。', 'pw-admin' ),
					'request_failed'   => __( '请求失败，请重试。', 'pw-admin' ),
					'confirm_edit'     => __( '在新标签页打开编辑？', 'pw-admin' ),
				),
			)
		);
	}

	public function handle_duplicate_cart_item() {
		check_ajax_referer( 'pw_cart_actions', 'nonce' );

		$cart_item_key = isset( $_POST['cart_key'] ) ? sanitize_text_field( wp_unslash( $_POST['cart_key'] ) ) : '';
		if ( $cart_item_key === '' ) {
			wp_send_json_error( __( '无效的购物车项', 'pw-admin' ) );
		}

		$duplicated_key = $this->duplicate_cart_item_or_error( $cart_item_key );
		if ( is_wp_error( $duplicated_key ) ) {
			wp_send_json_error( $duplicated_key->get_error_message() );
		}

		wp_send_json_success(
			array(
				'new_cart_key' => (string) $duplicated_key,
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

		$html = '<div class="pwca-cart-admin-actions" data-cart-key="' . esc_attr( $cart_item_key ) . '">';
		$html .= $this->build_duplicate_link( $cart_item_key, $product_id, $variation_id );
		if ( current_user_can( 'manage_options' ) ) {
			$html .= $this->build_edit_link( $product_id, $cart_item_key, $is_design, $is_product );
		}
		$html .= '<div class="pwca-cart-admin-message" aria-live="polite"></div>';
		$html .= '</div>';

		return $html;
	}

	private function build_duplicate_link( $cart_item_key, $product_id, $variation_id ) {
		return '<button type="button" class="pwca-cart-admin-action pwca-cart-duplicate" data-cart-key="' . esc_attr( $cart_item_key ) . '" data-product-id="' . esc_attr( $product_id ) . '" data-variation-id="' . esc_attr( $variation_id ) . '">' . esc_html__( 'Copy', 'pw-admin' ) . '</button>';
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

			return '<a class="pwca-cart-admin-action pwca-cart-edit" href="' . esc_url( $url ) . '" target="_blank" rel="noopener noreferrer">' . esc_html__( 'Edit', 'pw-admin' ) . '</a>';
		}

		if ( $is_product && $product_id ) {
			return '<a class="pwca-cart-admin-action pwca-cart-edit" href="' . esc_url( get_permalink( $product_id ) ) . '" target="_blank" rel="noopener noreferrer">' . esc_html__( 'Edit', 'pw-admin' ) . '</a>';
		}

		return '<button type="button" class="pwca-cart-admin-action pwca-cart-edit" disabled>' . esc_html__( 'Edit', 'pw-admin' ) . '</button>';
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

	private function duplicate_cart_item_or_error( $cart_item_key ) {
		$cart_item = $this->get_cart_item_or_error( $cart_item_key );
		if ( is_wp_error( $cart_item ) ) {
			return $cart_item;
		}

		$product_id   = isset( $cart_item['product_id'] ) ? (int) $cart_item['product_id'] : 0;
		$variation_id = isset( $cart_item['variation_id'] ) ? (int) $cart_item['variation_id'] : 0;
		$variation    = isset( $cart_item['variation'] ) && is_array( $cart_item['variation'] ) ? $cart_item['variation'] : array();
		$quantity     = isset( $cart_item['quantity'] ) ? (int) $cart_item['quantity'] : 1;
		$quantity     = $quantity > 0 ? $quantity : 1;

		if ( ! $product_id || ! wc_get_product( $product_id ) ) {
			return new WP_Error( 'pwca_product_missing', __( '商品不存在', 'pw-admin' ) );
		}

		$cart_item_data = $this->extract_cart_item_data( $cart_item );

		$added_key = WC()->cart->add_to_cart( $product_id, $quantity, $variation_id, $variation, $cart_item_data );
		if ( ! $added_key ) {
			return new WP_Error( 'pwca_duplicate_failed', __( '复制失败，请重试', 'pw-admin' ) );
		}

		if ( (string) $added_key === (string) $cart_item_key ) {
			WC()->cart->set_quantity( $cart_item_key, $quantity, false );
			$cart_item_data['_pwca_duplicate_uid'] = wp_generate_uuid4();
			$added_key                            = WC()->cart->add_to_cart( $product_id, $quantity, $variation_id, $variation, $cart_item_data );
			if ( ! $added_key ) {
				return new WP_Error( 'pwca_duplicate_failed', __( '复制失败，请重试', 'pw-admin' ) );
			}
		}

		WC()->cart->calculate_totals();
		WC()->cart->set_session();

		return (string) $added_key;
	}

	private function extract_cart_item_data( array $cart_item ) {
		$excluded = array(
			'product_id'         => true,
			'variation_id'       => true,
			'variation'          => true,
			'quantity'           => true,
			'data'               => true,
			'data_hash'          => true,
			'line_subtotal'      => true,
			'line_subtotal_tax'  => true,
			'line_total'         => true,
			'line_tax'           => true,
			'line_tax_data'      => true,
			'line_total_tax'     => true,
			'line_subtotal_tax'  => true,
			'line_total_tax'     => true,
		);

		$data = array();
		foreach ( $cart_item as $key => $value ) {
			if ( isset( $excluded[ $key ] ) ) {
				continue;
			}
			$data[ $key ] = $value;
		}

		return $data;
	}
}

