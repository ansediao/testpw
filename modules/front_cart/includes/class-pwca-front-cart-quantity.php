<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Front_Cart_Quantity {
	private $context;
	private $quantity_config;

	public function __construct( Pwca_Front_Cart_Context $context ) {
		$this->context         = $context;
		$this->quantity_config = array(
			'products' => array(
				array( 'step' => 2, 'min' => 9 ),
				array( 'step' => 5, 'min' => 29 ),
				array( 'step' => 3, 'min' => 19 ),
			),
			'default'  => array( 'step' => 2, 'min' => 5 ),
		);
	}

	public function register() {
		add_action( 'wp_ajax_pwca_update_cart_quantity', array( $this, 'handle_cart_quantity_update' ) );
		add_action( 'wp_ajax_nopriv_pwca_update_cart_quantity', array( $this, 'handle_cart_quantity_update' ) );
		add_action( 'wp', array( $this, 'init_cart_page_features' ) );
		add_action( 'woocommerce_cart_updated', array( $this, 'handle_cart_updated' ) );
		add_filter( 'woocommerce_update_cart_validation', array( $this, 'validate_cart_quantity' ), 10, 4 );
		add_filter( 'woocommerce_cart_item_quantity', array( $this, 'modify_cart_item_quantity' ), 10, 3 );
		add_action( 'wp_enqueue_scripts', array( $this, 'localize_quantity_config' ) );
	}

	public function localize_quantity_config() {
		if ( ! $this->context->is_cart_context() ) {
			return;
		}

		wp_localize_script(
			'pwca-cart-quantity-controls',
			'pwca_cart_ajax',
			array(
				'ajax_url'  => admin_url( 'admin-ajax.php' ),
				'nonce'     => wp_create_nonce( 'pwca_cart_quantity_nonce' ),
				'messages'  => array(
					'updating'         => __( '正在更新...', 'pw-admin' ),
					'error'            => __( '更新失败，请重试', 'pw-admin' ),
					'success'          => __( '更新成功', 'pw-admin' ),
					'invalid_quantity' => __( '数量无效', 'pw-admin' ),
					'min_quantity'     => __( '数量不能少于最小值', 'pw-admin' ),
				),
				'config'    => $this->quantity_config,
			)
		);
	}

	public function init_cart_page_features() {
		if ( $this->context->is_cart_context() ) {
			add_action( 'woocommerce_before_cart_table', array( $this, 'add_cart_notices' ) );
		}
	}

	public function handle_cart_updated() {
		do_action( 'pwca_cart_quantity_updated' );
	}

	public function handle_cart_quantity_update() {
		$validation = $this->validate_ajax_request();
		if ( is_wp_error( $validation ) ) {
			wp_send_json_error( array( 'message' => $validation->get_error_message() ) );
		}

		$payload = $this->extract_ajax_payload();
		if ( is_wp_error( $payload ) ) {
			wp_send_json_error( array( 'message' => $payload->get_error_message() ) );
		}

		$result = $this->update_cart_quantity( $payload['cart_key'], $payload['quantity'] );
		if ( is_wp_error( $result ) ) {
			wp_send_json_error( array( 'message' => $result->get_error_message() ) );
		}

		wp_send_json_success( $result );
	}

	public function validate_cart_quantity( $passed, $cart_item_key, $values, $quantity ) {
		if ( ! $passed ) {
			return $passed;
		}

		$config = $this->get_quantity_config_for_item( $cart_item_key, $values );
		if ( $quantity < $config['min'] ) {
			$this->add_min_notice( $values, $config['min'] );
			return false;
		}

		if ( ( $quantity - $config['min'] ) % $config['step'] !== 0 ) {
			$this->add_step_notice( $values, $config );
			return false;
		}

		return $passed;
	}

	public function modify_cart_item_quantity( $product_quantity, $cart_item_key, $cart_item ) {
		if ( ! $this->context->is_cart_context() ) {
			return $product_quantity;
		}

		$config      = $this->get_quantity_config_for_cart_item( $cart_item_key, $cart_item );
		$current_qty = isset( $cart_item['quantity'] ) ? (int) $cart_item['quantity'] : 1;
		if ( $current_qty < $config['min'] ) {
			$current_qty = $config['min'];
		}

		return $this->render_quantity_controls( $cart_item_key, $current_qty, $config );
	}

	public function add_cart_notices() {
		if ( isset( $_GET['pwca_quantity_updated'] ) ) {
			wc_add_notice( __( '购物车数量已更新', 'pw-admin' ), 'success' );
		}
	}

	private function validate_ajax_request() {
		$nonce = isset( $_POST['nonce'] ) ? (string) wp_unslash( $_POST['nonce'] ) : '';
		if ( ! wp_verify_nonce( $nonce, 'pwca_cart_quantity_nonce' ) ) {
			return new WP_Error( 'pwca_security_error', __( '安全验证失败', 'pw-admin' ) );
		}

		if ( ! function_exists( 'WC' ) || ! WC()->cart ) {
			return new WP_Error( 'pwca_cart_error', __( '购物车不可用', 'pw-admin' ) );
		}

		return true;
	}

	private function extract_ajax_payload() {
		$cart_key = isset( $_POST['cart_key'] ) ? sanitize_text_field( wp_unslash( $_POST['cart_key'] ) ) : '';
		$quantity = isset( $_POST['quantity'] ) ? (int) $_POST['quantity'] : -1;

		if ( $cart_key === '' || $quantity < 0 ) {
			return new WP_Error( 'pwca_invalid_params', __( '参数无效', 'pw-admin' ) );
		}

		return array(
			'cart_key'  => $cart_key,
			'quantity'  => $quantity,
		);
	}

	private function update_cart_quantity( $cart_key, $requested_quantity ) {
		$cart_item = WC()->cart->get_cart_item( $cart_key );
		if ( ! $cart_item ) {
			return new WP_Error( 'pwca_cart_item_missing', __( '购物车项目不存在', 'pw-admin' ) );
		}

		$config   = $this->get_quantity_config_for_cart_item( $cart_key, $cart_item );
		$quantity = $this->normalize_quantity( $requested_quantity, $config );

		if ( $quantity < $config['min'] ) {
			return new WP_Error( 'pwca_min_quantity', sprintf( __( '数量不能少于 %d', 'pw-admin' ), $config['min'] ) );
		}

		$result = WC()->cart->set_quantity( $cart_key, $quantity, true );
		if ( ! $result ) {
			return new WP_Error( 'pwca_update_failed', __( '更新购物车失败', 'pw-admin' ) );
		}

		WC()->cart->calculate_totals();

		return array(
			'message'    => __( '购物车已更新', 'pw-admin' ),
			'quantity'   => $quantity,
			'cart_key'   => $cart_key,
			'fragments'  => $this->get_cart_fragments(),
			'cart_total' => WC()->cart->get_cart_total(),
			'cart_count' => WC()->cart->get_cart_contents_count(),
		);
	}

	private function normalize_quantity( $quantity, $config ) {
		if ( ( $quantity - $config['min'] ) % $config['step'] === 0 ) {
			return $quantity;
		}

		$diff      = $quantity - $config['min'];
		$remainder = $diff % $config['step'];
		if ( $remainder <= $config['step'] / 2 ) {
			return $quantity - $remainder;
		}

		return $quantity + ( $config['step'] - $remainder );
	}

	private function get_cart_fragments() {
		$fragments = array(
			'.cart-total'    => WC()->cart->get_cart_total(),
			'.cart-subtotal' => WC()->cart->get_cart_subtotal(),
			'.cart-count'    => WC()->cart->get_cart_contents_count(),
		);

		$cart_form = $this->render_template_to_string( 'cart/cart.php' );
		if ( $cart_form !== '' ) {
			$fragments['.woocommerce-cart-form'] = $cart_form;
		}

		$cart_totals = $this->render_template_to_string( 'cart/cart-totals.php' );
		if ( $cart_totals !== '' ) {
			$fragments['.cart_totals'] = $cart_totals;
		}

		$mini_cart = $this->render_template_to_string( 'cart/mini-cart.php' );
		if ( $mini_cart !== '' ) {
			$fragments['.widget_shopping_cart_content'] = $mini_cart;
		}

		return apply_filters( 'pwca_cart_quantity_fragments', $fragments );
	}

	private function render_template_to_string( $template ) {
		if ( ! function_exists( 'wc_get_template' ) ) {
			return '';
		}

		ob_start();
		wc_get_template( $template );
		$content = ob_get_clean();

		return is_string( $content ) ? $content : '';
	}

	private function get_quantity_config_for_item( $cart_item_key, $values ) {
		$cart_item = WC()->cart ? WC()->cart->get_cart_item( $cart_item_key ) : array();
		if ( is_array( $cart_item ) ) {
			return $this->get_quantity_config_for_cart_item( $cart_item_key, $cart_item );
		}

		$index = $this->get_product_index_in_cart( $cart_item_key );

		return $this->get_quantity_config_by_index( $index );
	}

	private function get_quantity_config_for_cart_item( $cart_item_key, $cart_item ) {
		$config = $this->get_quantity_config_by_index( $this->get_product_index_in_cart( $cart_item_key ) );

		if ( isset( $cart_item['custom_data'] ) && is_array( $cart_item['custom_data'] ) ) {
			$custom = $cart_item['custom_data'];
			if ( isset( $custom['min_order_quantity'] ) ) {
				$config['min'] = max( 1, (int) $custom['min_order_quantity'] );
			}
			if ( isset( $custom['batch_quantity'] ) ) {
				$config['step'] = max( 1, (int) $custom['batch_quantity'] );
			}
		}

		return $config;
	}

	private function get_product_index_in_cart( $cart_key ) {
		$cart_items = WC()->cart->get_cart();
		$index      = 0;

		foreach ( $cart_items as $key => $item ) {
			if ( $key === $cart_key ) {
				return $index;
			}
			$index++;
		}

		return 0;
	}

	private function get_quantity_config_by_index( $index ) {
		$product_config = isset( $this->quantity_config['products'][ $index ] ) ? $this->quantity_config['products'][ $index ] : null;
		$default_config = isset( $this->quantity_config['default'] ) ? $this->quantity_config['default'] : array( 'step' => 1, 'min' => 1 );

		return array(
			'step' => isset( $product_config['step'] ) ? (int) $product_config['step'] : (int) $default_config['step'],
			'min'  => isset( $product_config['min'] ) ? (int) $product_config['min'] : (int) $default_config['min'],
		);
	}

	private function render_quantity_controls( $cart_item_key, $current_qty, $config ) {
		$input_name = sprintf( 'cart[%s][qty]', $cart_item_key );
		$input_id   = sprintf( 'pwca-qty-%s', $cart_item_key );
		$is_min     = $current_qty <= $config['min'];
		$min_text   = sprintf( __( '起订量：%d', 'pw-admin' ), $config['min'] );

		$html  = '<div class="pwca-quantity-controls" data-cart-key="' . esc_attr( $cart_item_key ) . '">';
		$html .= '<button type="button" class="pwca-qty-btn minus" aria-label="' . esc_attr__( '减少数量', 'pw-admin' ) . '" ' . ( $is_min ? 'disabled' : '' ) . '><span>&minus;</span></button>';
		$html .= '<input type="number" id="' . esc_attr( $input_id ) . '" class="quantity-input qty" name="' . esc_attr( $input_name ) . '" value="' . esc_attr( $current_qty ) . '" min="' . esc_attr( $config['min'] ) . '" step="' . esc_attr( $config['step'] ) . '" data-min="' . esc_attr( $config['min'] ) . '" data-step="' . esc_attr( $config['step'] ) . '" aria-label="' . esc_attr__( '数量输入', 'pw-admin' ) . '">';
		$html .= '<button type="button" class="pwca-qty-btn plus" aria-label="' . esc_attr__( '增加数量', 'pw-admin' ) . '"><span>+</span></button>';
		$html .= '<div class="pwca-quantity-tooltip" role="tooltip" aria-live="polite"><span class="tooltip-text">' . esc_html( $min_text ) . '</span><span class="tooltip-arrow" aria-hidden="true"></span></div>';
		$html .= '</div>';

		return $html;
	}

	private function add_min_notice( $values, $min ) {
		$product_name = isset( $values['data'] ) && is_object( $values['data'] ) && method_exists( $values['data'], 'get_name' ) ? $values['data']->get_name() : '';
		wc_add_notice( sprintf( __( '商品 "%s" 的数量不能少于 %d', 'pw-admin' ), $product_name, $min ), 'error' );
	}

	private function add_step_notice( $values, $config ) {
		$product_name = isset( $values['data'] ) && is_object( $values['data'] ) && method_exists( $values['data'], 'get_name' ) ? $values['data']->get_name() : '';
		wc_add_notice( sprintf( __( '商品 "%s" 的数量必须符合步长 %d（最小值：%d）', 'pw-admin' ), $product_name, $config['step'], $config['min'] ), 'error' );
	}
}
