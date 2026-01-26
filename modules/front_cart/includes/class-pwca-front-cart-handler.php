<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Front_Cart_Handler {
	private $context;

	public function __construct( Pwca_Front_Cart_Context $context ) {
		$this->context = $context;
	}

	public function register() {
		add_filter( 'woocommerce_add_to_cart_validation', array( $this, 'validate_cart_products_before_add' ), 10, 2 );
		add_filter( 'woocommerce_add_cart_item_data', array( $this, 'append_post_data_to_cart_item_data' ), 10, 3 );
		add_action( 'template_redirect', array( $this, 'redirect_custom_cart_for_sync_products' ) );

		add_action( 'wp_ajax_add_customized_product_to_cart', array( $this, 'add_customized_product_to_cart' ) );
		add_action( 'wp_ajax_nopriv_add_customized_product_to_cart', array( $this, 'add_customized_product_to_cart' ) );

		add_action( 'wp_ajax_pw_has_blank_in_cart', array( $this, 'has_blank_in_cart' ) );
		add_action( 'wp_ajax_nopriv_pw_has_blank_in_cart', array( $this, 'has_blank_in_cart' ) );

		add_action( 'wp_ajax_pw_cart_blank_state', array( $this, 'cart_blank_state' ) );
		add_action( 'wp_ajax_nopriv_pw_cart_blank_state', array( $this, 'cart_blank_state' ) );

		add_action( 'wp_ajax_pw_get_cart_canvas_state', array( $this, 'get_cart_canvas_state' ) );
		add_action( 'wp_ajax_nopriv_pw_get_cart_canvas_state', array( $this, 'get_cart_canvas_state' ) );

		add_filter( 'woocommerce_get_item_data', array( $this, 'display_custom_product_image' ), 10, 2 );
		add_filter( 'woocommerce_order_item_name', array( $this, 'display_custom_image_in_order' ), 10, 2 );
		add_filter( 'woocommerce_display_item_meta', array( $this, 'display_cart_images_properly' ), 10, 3 );

		add_filter( 'woocommerce_cart_item_price', array( $this, 'render_cart_item_price_with_discount' ), 10, 3 );
		add_filter( 'woocommerce_cart_item_subtotal', array( $this, 'render_cart_item_subtotal_with_discount' ), 10, 3 );
	}

	public function redirect_custom_cart_for_sync_products() {
		if ( ! function_exists( 'is_cart' ) || ! is_cart() || wp_doing_ajax() ) {
			return;
		}

		if ( ! function_exists( 'WC' ) || ! WC()->cart ) {
			return;
		}

		$should_redirect = false;
		foreach ( WC()->cart->get_cart() as $cart_item ) {
			$product_id = isset( $cart_item['product_id'] ) ? (int) $cart_item['product_id'] : 0;
			if ( ! $product_id ) {
				continue;
			}

			if ( get_post_meta( $product_id, 'pw_isSyncProduct', true ) === '1' ) {
				$should_redirect = true;
				break;
			}
		}

		if ( ! $should_redirect ) {
			return;
		}

		$redirect_url = home_url( '/custom-cart/' );

		global $wp;
		$current_url = home_url( add_query_arg( array(), $wp->request ) );

		if ( rtrim( $current_url, '/' ) !== rtrim( $redirect_url, '/' ) ) {
			wp_safe_redirect( $redirect_url );
			exit;
		}
	}

	public function validate_cart_products_before_add( $passed, $product_id ) {
		if ( ! function_exists( 'WC' ) || WC()->cart === null ) {
			return $passed;
		}

		$new_product_is_sync = get_post_meta( $product_id, 'pw_isSyncProduct', true ) === '1';
		if ( WC()->cart->is_empty() ) {
			return $passed;
		}

		foreach ( WC()->cart->get_cart() as $cart_item ) {
			$cart_product_id      = isset( $cart_item['product_id'] ) ? (int) $cart_item['product_id'] : 0;
			$cart_product_is_sync = $cart_product_id ? ( get_post_meta( $cart_product_id, 'pw_isSyncProduct', true ) === '1' ) : false;

			if ( $cart_product_is_sync !== $new_product_is_sync ) {
				if ( function_exists( 'wc_add_notice' ) ) {
					wc_add_notice( 'Customized products cannot be checked out with regular products. Please clear the cart first.', 'error' );
				}
				return false;
			}
		}

		return $passed;
	}

	public function append_post_data_to_cart_item_data( $cart_item_data, $product_id, $variation_id = 0 ) {
		if ( ! isset( $cart_item_data['custom_data'] ) || ! is_array( $cart_item_data['custom_data'] ) ) {
			$cart_item_data['custom_data'] = array();
		}

		$extra = $this->build_custom_data_from_post();
		if ( ! empty( $extra ) ) {
			$cart_item_data['custom_data'] = array_merge( $cart_item_data['custom_data'], $extra );
		}

		if ( ! isset( $cart_item_data['custom_data']['added_from'] ) ) {
			$cart_item_data['custom_data']['added_from'] = 'product';
		}

		return $cart_item_data;
	}

	public function add_customized_product_to_cart() {
		if ( ! $this->verify_custom_product_nonce() ) {
			wp_send_json_error( 'Security verification failed' );
		}

		$product_id = $this->get_post_int( 'product_id', 0 );
		if ( ! $product_id || ! get_post_status( $product_id ) ) {
			wp_send_json_error( 'Invalid product ID' );
		}

		$product = wc_get_product( $product_id );
		if ( ! $product ) {
			wp_send_json_error( 'Product does not exist' );
		}

		$product_result = $this->resolve_grouped_product_to_child( $product_id, $product );
		if ( is_wp_error( $product_result ) ) {
			wp_send_json_error( $product_result->get_error_message() );
		}
		$product_id = $product_result['product_id'];
		$product    = $product_result['product'];

		if ( ! $product->is_purchasable() ) {
			wp_send_json_error( 'Product is not purchasable' );
		}

		if ( ! $product->is_in_stock() ) {
			wp_send_json_error( 'Product is out of stock' );
		}

		$quantity          = max( 1, $this->get_post_int( 'quantity', 1 ) );
		$incoming_is_blank = $this->get_post_bool( 'pw_is_blank' ) ? 1 : 0;
		if ( ! $this->cart_is_compatible_with( $incoming_is_blank ) ) {
			wp_send_json_error( $incoming_is_blank === 1 ? 'The cart contains customized products; cannot add this item' : 'The cart already contains blank items; cannot add this item' );
		}

		$custom_image     = $this->get_post_string( 'custom_image' );
		$view_images_data = $this->get_post_json_array( 'pw_view_images' );

		if ( $custom_image === '' && empty( $view_images_data ) ) {
			wp_send_json_error( 'Missing custom image data' );
		}

		if ( $custom_image !== '' && ! $this->is_valid_image_data_url( $custom_image ) ) {
			wp_send_json_error( 'Invalid image data format' );
		}

		$upload_setup = $this->prepare_custom_upload_dir();
		if ( is_wp_error( $upload_setup ) ) {
			wp_send_json_error( $upload_setup->get_error_message() );
		}

		$saved = $this->save_custom_images( $upload_setup, $product_id, $custom_image, $view_images_data );
		if ( is_wp_error( $saved ) ) {
			wp_send_json_error( $saved->get_error_message() );
		}

		$cart_item_data = $this->build_cart_item_data_from_request( $product_id, $saved, $incoming_is_blank );
		$this->maybe_add_accessories_names( $cart_item_data );

		if ( ! function_exists( 'WC' ) || WC()->cart === null ) {
			$this->cleanup_saved_files( $saved['saved_file_paths'] );
			wp_send_json_error( 'Cart functionality is unavailable' );
		}

		$cart_item_key = WC()->cart->add_to_cart( $product_id, $quantity, 0, array(), $cart_item_data );
		if ( $cart_item_key ) {
			wp_send_json_success(
				array(
					'message'       => 'Product added to cart successfully',
					'cart_item_key' => $cart_item_key,
					'product_id'    => $product_id,
					'quantity'      => $quantity,
				)
			);
		}

		$error_message = $this->get_wc_error_notice_message( 'Failed to add to cart' );
		$this->cleanup_saved_files( $saved['saved_file_paths'] );
		wp_send_json_error( $error_message );
	}

	public function has_blank_in_cart() {
		wp_send_json_success( array( 'has_blank' => $this->cart_has_blank() ) );
	}

	public function cart_blank_state() {
		$state = $this->cart_state();
		$total = (int) $state['blank'] + (int) $state['non_blank'];

		wp_send_json_success(
			array(
				'blank_count'     => (int) $state['blank'],
				'non_blank_count' => (int) $state['non_blank'],
				'cart_empty'      => $total === 0,
				'all_blank'       => (int) $state['blank'] > 0 && (int) $state['non_blank'] === 0,
				'all_non_blank'   => (int) $state['non_blank'] > 0 && (int) $state['blank'] === 0,
			)
		);
	}

	public function get_cart_canvas_state() {
		if ( ! function_exists( 'WC' ) || ! WC()->cart ) {
			wp_send_json_error( 'Cart is unavailable' );
		}

		$cart_item_key = isset( $_POST['cart_key'] ) ? sanitize_text_field( wp_unslash( $_POST['cart_key'] ) ) : '';
		if ( $cart_item_key === '' ) {
			wp_send_json_error( 'Invalid cart item' );
		}

		// 使用与添加定制产品相同的安全校验
		$nonce = isset( $_POST['security'] ) ? sanitize_text_field( wp_unslash( $_POST['security'] ) ) : '';
		if ( $nonce === '' || ! wp_verify_nonce( $nonce, 'custom-product-nonce' ) ) {
			wp_send_json_error( 'Security verification failed' );
		}

		$cart_item = WC()->cart->get_cart_item( $cart_item_key );
		if ( ! $cart_item ) {
			wp_send_json_error( 'Cart item does not exist' );
		}

		$custom_data = isset( $cart_item['custom_data'] ) && is_array( $cart_item['custom_data'] ) ? $cart_item['custom_data'] : array();
		if ( ! isset( $custom_data['canvas_state'] ) ) {
			wp_send_json_error( 'Canvas state not found for this cart item' );
		}

		$raw_state = $custom_data['canvas_state'];

		if ( is_array( $raw_state ) ) {
			$canvas_state = $raw_state;
		} else {
			$decoded = json_decode( (string) $raw_state, true );
			if ( ! is_array( $decoded ) ) {
				wp_send_json_error( 'Invalid canvas state data' );
			}
			$canvas_state = $decoded;
		}

		$product_id = isset( $cart_item['product_id'] ) ? (int) $cart_item['product_id'] : 0;

		wp_send_json_success(
			array(
				'canvas_state' => $canvas_state,
				'product_id'   => $product_id,
			)
		);
	}

	public function display_custom_product_image( $item_data, $cart_item ) {
		if ( isset( $cart_item['custom_data'] ) && is_array( $cart_item['custom_data'] ) ) {
			$item_data = $this->append_color_meta( $item_data, $cart_item['custom_data'] );
			$item_data = $this->append_order_type_meta( $item_data, $cart_item['custom_data'] );
			$item_data = $this->append_customization_meta( $item_data, $cart_item['custom_data'] );
			$item_data = $this->append_accessories_meta_if_needed( $item_data, $cart_item['custom_data'] );
		}

		$has_image = isset( $cart_item['custom_data'] ) && is_array( $cart_item['custom_data'] ) && ( ! empty( $cart_item['custom_data']['custom_image'] ) || ! empty( $cart_item['custom_data']['view_images'] ) );
		if ( ! $has_image ) {
			$is_sync = get_post_meta( $cart_item['product_id'], 'pw_isSyncProduct', true );
			if ( $is_sync === '1' ) {
				$item_data[] = array( 'key' => 'Custom Design', 'value' => 'None', 'display' => '' );
				$item_data[] = array( 'key' => 'Color', 'value' => 'Not selected', 'display' => '' );
			}
		}

		return $item_data;
	}

	public function display_custom_image_in_order( $item_name, $item ) {
		$custom_data = $item->get_meta( 'custom_data' );
		if ( empty( $custom_data ) || ! is_array( $custom_data ) ) {
			return $item_name;
		}

		$html = $this->build_order_item_images_html( $custom_data );
		if ( $html !== '' ) {
			$item_name .= $html;
		}

		return $item_name;
	}

	public function display_cart_images_properly( $html, $item, $args ) {
		$strings = array();
		$html    = '';

		foreach ( $item->get_formatted_meta_data( $args['hideprefix'], true ) as $meta ) {
			$key   = $meta->display_key;
			$value = $meta->display_value;

			if ( $meta->key === 'custom_data' && ( $key === 'Custom Design' || $key === 'Color' ) ) {
				$value = $meta->value;
			} else {
				$value = $args['autop'] ? wp_kses_post( $value ) : wp_kses_post( make_clickable( trim( $value ) ) );
				$key   = $args['autop'] ? wp_kses_post( $key ) : wp_kses_post( trim( $key ) );
			}

			$strings[] = '<strong class="' . esc_attr( $args['label_class'] ) . '">' . $key . $args['label_before'] . ':</strong> ' . $value . $args['label_after'];
		}

		if ( $strings ) {
			$html = $args['before'] . implode( $args['separator'], $strings ) . $args['after'];
		}

		return $html;
	}

	public function render_cart_item_price_with_discount( $price_html, $cart_item, $cart_item_key ) {
		if ( ! isset( $cart_item['custom_data'] ) || ! is_array( $cart_item['custom_data'] ) ) {
			return $price_html;
		}

		$custom = $cart_item['custom_data'];
		$rate   = $this->get_discount_rate_from_custom( $custom );
		if ( $rate === null ) {
			return $price_html;
		}

		$product = isset( $cart_item['data'] ) ? $cart_item['data'] : null;
		if ( ! $product || ! is_object( $product ) ) {
			return $price_html;
		}

		$original_price   = wc_get_price_to_display( $product );
		$discounted_price = $original_price * $rate;

		$formatted = wc_format_sale_price( wc_price( $original_price ), wc_price( $discounted_price ) );
		$label     = $this->get_discount_label_from_custom( $custom );
		if ( $label ) {
			$formatted .= ' <small class="pwca-discount-hint">' . esc_html( $label ) . '</small>';
		}

		return $formatted;
	}

	public function render_cart_item_subtotal_with_discount( $subtotal_html, $cart_item, $cart_item_key ) {
		if ( ! isset( $cart_item['custom_data'] ) || ! is_array( $cart_item['custom_data'] ) ) {
			return $subtotal_html;
		}

		$custom = $cart_item['custom_data'];
		$rate   = $this->get_discount_rate_from_custom( $custom );
		if ( $rate === null ) {
			return $subtotal_html;
		}

		$product = isset( $cart_item['data'] ) ? $cart_item['data'] : null;
		if ( ! $product || ! is_object( $product ) ) {
			return $subtotal_html;
		}

		$qty = isset( $cart_item['quantity'] ) ? (int) $cart_item['quantity'] : 1;
		$qty = max( 1, $qty );

		$unit_display_price     = wc_get_price_to_display( $product );
		$original_line_total    = $unit_display_price * $qty;
		$discounted_line_total  = $original_line_total * $rate;
		$formatted              = wc_format_sale_price( wc_price( $original_line_total ), wc_price( $discounted_line_total ) );

		$label = $this->get_discount_label_from_custom( $custom );
		if ( $label ) {
			$formatted .= ' <small class="pwca-discount-hint">' . esc_html( $label ) . '</small>';
		}

		return $formatted;
	}

	private function build_custom_data_from_post() {
		$extra = array();

		$min_order_quantity = $this->get_post_int_nullable( 'pw_min_order_quantity' );
		$batch_quantity     = $this->get_post_int_nullable( 'pw_batch_quantity' );

		$sell_in_batch = $this->get_post_bool_nullable( 'pw_sell_in_batch' );
		$is_sample     = $this->get_post_bool_nullable( 'pw_is_sample' );
		$is_blank      = $this->get_post_bool_nullable( 'pw_is_blank' );

		$discount_enabled = $this->get_post_bool_nullable( 'pw_discount_enabled' );
		$current_discount = $this->get_post_float_nullable( 'pw_current_discount' );
		$discount_text    = $this->get_post_sanitized_text( 'pw_discount_text' );

		if ( $min_order_quantity !== null ) { $extra['min_order_quantity'] = $min_order_quantity; }
		if ( $batch_quantity !== null ) { $extra['batch_quantity'] = $batch_quantity; }
		if ( $sell_in_batch !== null ) { $extra['sell_in_batch'] = $sell_in_batch ? 1 : 0; }
		if ( $is_sample !== null ) { $extra['is_sample'] = $is_sample ? 1 : 0; }
		if ( $is_blank !== null ) { $extra['is_blank'] = $is_blank ? 1 : 0; }
		if ( $discount_enabled !== null ) { $extra['discount_enabled'] = $discount_enabled ? 1 : 0; }
		if ( $current_discount !== null ) { $extra['current_discount'] = $current_discount; }
		if ( $discount_text !== '' ) { $extra['discount_text'] = $discount_text; }

		$quantity_discounts = $this->get_post_json_array( 'pw_quantity_discounts' );
		if ( ! empty( $quantity_discounts ) ) { $extra['quantity_discounts'] = $quantity_discounts; }

		$design_fee_total = $this->get_post_float_nullable( 'pw_design_fee_total' );
		if ( $design_fee_total !== null ) { $extra['design_fee_total'] = $design_fee_total; }

		$designs = $this->get_post_designs();
		if ( ! empty( $designs ) ) { $extra['designs'] = $designs; }

		$view_print_methods = $this->get_post_view_print_methods();
		if ( ! empty( $view_print_methods ) ) { $extra['view_print_methods'] = $view_print_methods; }

		return $extra;
	}

	private function get_post_designs() {
		$decoded = $this->get_post_json_array( 'pw_designs' );
		if ( empty( $decoded ) ) {
			return array();
		}

		$out = array();
		foreach ( $decoded as $item ) {
			if ( ! is_array( $item ) ) {
				continue;
			}
			$out[] = array(
				'name'     => isset( $item['name'] ) ? sanitize_text_field( $item['name'] ) : '',
				'image'    => isset( $item['image'] ) ? esc_url_raw( $item['image'] ) : '',
				'quantity' => isset( $item['quantity'] ) ? (int) $item['quantity'] : 0,
			);
		}

		return array_values( $out );
	}

	private function get_post_view_print_methods() {
		$decoded = $this->get_post_json_array( 'pw_view_print_methods' );
		if ( empty( $decoded ) ) {
			return array();
		}

		$out = array();
		foreach ( $decoded as $item ) {
			if ( ! is_array( $item ) ) {
				continue;
			}
			$view_id = isset( $item['view_id'] ) ? sanitize_text_field( $item['view_id'] ) : '';
			$methods = array();
			if ( isset( $item['print_methods'] ) && is_array( $item['print_methods'] ) ) {
				foreach ( $item['print_methods'] as $name ) {
					$methods[] = sanitize_text_field( $name );
				}
			}
			if ( $view_id !== '' && ! empty( $methods ) ) {
				$out[] = array( 'view_id' => $view_id, 'print_methods' => $methods );
			}
		}

		return array_values( $out );
	}

	private function verify_custom_product_nonce() {
		$nonce = $this->get_post_sanitized_text( 'security' );
		return $nonce !== '' && wp_verify_nonce( $nonce, 'custom-product-nonce' );
	}

	private function resolve_grouped_product_to_child( $product_id, $product ) {
		if ( ! $product->is_type( 'grouped' ) ) {
			return array( 'product_id' => $product_id, 'product' => $product );
		}

		$children = get_post_meta( $product_id, '_children', true );
		if ( empty( $children ) || ! is_array( $children ) ) {
			return new WP_Error( 'pwca_grouped_no_children', 'Grouped product has no purchasable child products' );
		}

		$target_child_id = $this->pick_grouped_child_id( $children );
		$child_product   = wc_get_product( $target_child_id );

		if ( ! $child_product || ! $child_product->is_purchasable() ) {
			return new WP_Error( 'pwca_grouped_not_purchasable', 'Grouped child product is not purchasable' );
		}

		if ( ! $child_product->is_in_stock() ) {
			return new WP_Error( 'pwca_grouped_out_of_stock', 'Grouped child product is out of stock' );
		}

		return array( 'product_id' => $target_child_id, 'product' => $child_product );
	}

	private function pick_grouped_child_id( $children ) {
		foreach ( $children as $child_id ) {
			$blank_item = get_post_meta( $child_id, 'pw_blank_item', true );
			if ( $blank_item === '1' || $blank_item === 1 || $blank_item === true ) {
				return (int) $child_id;
			}
		}

		return (int) reset( $children );
	}

	private function prepare_custom_upload_dir() {
		$upload_dir = wp_upload_dir();
		$custom_dir = $upload_dir['basedir'] . '/custom-products';

		if ( ! file_exists( $custom_dir ) ) {
			if ( ! wp_mkdir_p( $custom_dir ) ) {
				return new WP_Error( 'pwca_upload_dir_failed', 'Failed to create custom image directory' );
			}
		}

		return array(
			'baseurl' => $upload_dir['baseurl'],
			'basedir' => $upload_dir['basedir'],
			'custom_dir' => $custom_dir,
		);
	}

	private function save_custom_images( $upload_setup, $product_id, $custom_image, $view_images_data ) {
		$saved_view_images_meta = array();
		$first_saved_image_url  = '';
		$saved_file_paths       = array();

		if ( ! empty( $view_images_data ) ) {
			$result = $this->save_view_images( $upload_setup, $product_id, $view_images_data );
			$saved_view_images_meta = $result['saved_view_images_meta'];
			$first_saved_image_url  = $result['first_saved_image_url'];
			$saved_file_paths       = $result['saved_file_paths'];
		}

		if ( empty( $saved_view_images_meta ) ) {
			if ( $custom_image === '' ) {
				return new WP_Error( 'pwca_image_missing', 'Missing custom image data' );
			}
			$single = $this->save_single_image( $upload_setup, $product_id, $custom_image );
			if ( is_wp_error( $single ) ) {
				return $single;
			}
			$first_saved_image_url = $single['url'];
			$saved_file_paths[]    = $single['path'];
		}

		return array(
			'first_saved_image_url'  => $first_saved_image_url,
			'saved_view_images_meta' => $saved_view_images_meta,
			'saved_file_paths'       => $saved_file_paths,
		);
	}

	private function save_view_images( $upload_setup, $product_id, $view_images_data ) {
		$saved_view_images_meta = array();
		$first_saved_image_url  = '';
		$saved_file_paths       = array();

		foreach ( $view_images_data as $view_idx => $view_item ) {
			if ( ! is_array( $view_item ) ) {
				continue;
			}

			$view_id   = isset( $view_item['id'] ) ? sanitize_text_field( $view_item['id'] ) : '';
			$view_name = isset( $view_item['name'] ) ? sanitize_text_field( $view_item['name'] ) : ( $view_id !== '' ? $view_id : ( 'View ' . ( $view_idx + 1 ) ) );
			$images    = isset( $view_item['images'] ) && is_array( $view_item['images'] ) ? $view_item['images'] : array();

			$urls = array();
			foreach ( array_values( $images ) as $img_idx => $img_dataurl ) {
				if ( ! is_string( $img_dataurl ) || ! $this->is_valid_image_data_url( $img_dataurl ) ) {
					continue;
				}
				$saved = $this->save_single_image( $upload_setup, $product_id, $img_dataurl, $view_name, $img_idx + 1 );
				if ( is_wp_error( $saved ) ) {
					continue;
				}
				$saved_file_paths[] = $saved['path'];
				$urls[]             = $saved['url'];
				if ( $first_saved_image_url === '' ) {
					$first_saved_image_url = $saved['url'];
				}
			}

			if ( ! empty( $urls ) ) {
				$saved_view_images_meta[] = array(
					'view_id'   => $view_id,
					'view_name' => $view_name,
					'images'    => $urls,
				);
			}
		}

		return array(
			'saved_view_images_meta' => $saved_view_images_meta,
			'first_saved_image_url'  => $first_saved_image_url,
			'saved_file_paths'       => $saved_file_paths,
		);
	}

	private function save_single_image( $upload_setup, $product_id, $data_url, $view_name = '', $index = 0 ) {
		$custom_dir = $upload_setup['custom_dir'];
		$baseurl    = $upload_setup['baseurl'];

		$filename_parts = array( 'custom', $product_id );
		if ( $view_name !== '' ) {
			$filename_parts[] = sanitize_title( $view_name );
		}
		if ( $index > 0 ) {
			$filename_parts[] = $index;
		}
		$filename_parts[] = uniqid();

		$filename  = implode( '-', $filename_parts ) . '.png';
		$file_path = $custom_dir . '/' . $filename;

		$raw = preg_replace( '#^data:image/\w+;base64,#i', '', $data_url );
		$bin = base64_decode( $raw );
		if ( $bin === false ) {
			return new WP_Error( 'pwca_decode_failed', 'Failed to decode image data' );
		}

		if ( file_put_contents( $file_path, $bin ) === false ) {
			return new WP_Error( 'pwca_save_failed', 'Failed to save custom image' );
		}

		return array(
			'path' => $file_path,
			'url'  => $baseurl . '/custom-products/' . $filename,
		);
	}

	private function build_cart_item_data_from_request( $product_id, $saved, $incoming_is_blank ) {
		$custom_data = array(
			'custom_image' => $saved['first_saved_image_url'],
			'color'        => $this->get_post_sanitized_text( 'color' ),
			'color_name'   => $this->get_post_sanitized_text( 'color_name', 'Default Color' ),
			'color_value'  => $this->get_post_sanitized_text( 'color_value' ),
			'variant_id'   => $this->get_post_sanitized_text( 'variant_id' ),
			'added_from'   => $this->get_post_sanitized_text( 'added_from', 'design' ),
			'is_blank'     => $incoming_is_blank,
		);

		$custom_color = $this->get_post_sanitized_text( 'custom_color' );
		if ( $custom_color !== '' ) {
			$custom_data['custom_color'] = $custom_color;
		}

		if ( ! empty( $saved['saved_view_images_meta'] ) ) {
			$custom_data['view_images'] = $saved['saved_view_images_meta'];
		}

		// 画布完整状态（多视图、图层、图层组等），由前端 CanvasStateManager 提交
		$canvas_state_raw = $this->get_post_string( 'pw_canvas_state' );
		if ( $canvas_state_raw !== '' ) {
			$custom_data['canvas_state'] = $canvas_state_raw;
		}

		return array( 'custom_data' => $custom_data );
	}

	private function maybe_add_accessories_names( &$cart_item_data ) {
		$raw = $this->get_post_string( 'pw_accessories_names' );
		if ( $raw === '' ) {
			return;
		}

		$acc = array();
		$decoded = json_decode( $raw, true );
		if ( is_array( $decoded ) ) {
			foreach ( $decoded as $n ) {
				$acc[] = sanitize_text_field( $n );
			}
		} else {
			foreach ( array_filter( array_map( 'trim', explode( ',', $raw ) ) ) as $n ) {
				$acc[] = sanitize_text_field( $n );
			}
		}

		if ( ! empty( $acc ) ) {
			$cart_item_data['custom_data']['accessories_names'] = $acc;
		}
	}

	private function cleanup_saved_files( $paths ) {
		foreach ( (array) $paths as $p ) {
			if ( is_string( $p ) && $p !== '' ) {
				@unlink( $p );
			}
		}
	}

	private function get_wc_error_notice_message( $fallback ) {
		if ( ! function_exists( 'wc_get_notices' ) ) {
			return $fallback;
		}

		$notices = wc_get_notices( 'error' );
		if ( empty( $notices ) ) {
			return $fallback;
		}

		$message = $fallback . ': ' . implode( ', ', array_column( $notices, 'notice' ) );
		if ( function_exists( 'wc_clear_notices' ) ) {
			wc_clear_notices();
		}

		return $message;
	}

	private function cart_has_blank() {
		if ( ! function_exists( 'WC' ) || WC()->cart === null ) {
			return false;
		}

		foreach ( WC()->cart->get_cart() as $cart_item ) {
			if ( isset( $cart_item['custom_data']['is_blank'] ) && (int) $cart_item['custom_data']['is_blank'] === 1 ) {
				return true;
			}
		}

		return false;
	}

	private function cart_state() {
		$blank     = 0;
		$non_blank = 0;

		if ( function_exists( 'WC' ) && WC()->cart !== null ) {
			foreach ( WC()->cart->get_cart() as $cart_item ) {
				$is_blank = isset( $cart_item['custom_data']['is_blank'] ) && (int) $cart_item['custom_data']['is_blank'] === 1;
				if ( $is_blank ) {
					$blank++;
				} else {
					$non_blank++;
				}
			}
		}

		return array( 'blank' => $blank, 'non_blank' => $non_blank );
	}

	private function cart_is_compatible_with( $incoming_is_blank ) {
		if ( ! function_exists( 'WC' ) || WC()->cart === null || WC()->cart->is_empty() ) {
			return true;
		}

		foreach ( WC()->cart->get_cart() as $cart_item ) {
			$existing = isset( $cart_item['custom_data']['is_blank'] ) && (int) $cart_item['custom_data']['is_blank'] === 1 ? 1 : 0;
			if ( $existing !== (int) $incoming_is_blank ) {
				return false;
			}
		}

		return true;
	}

	private function append_color_meta( $item_data, $custom_data ) {
		if ( ! empty( $custom_data['custom_color'] ) ) {
			$cc = sanitize_text_field( $custom_data['custom_color'] );
			$item_data[] = array( 'key' => 'Custom Color', 'value' => $cc, 'display' => esc_html( $cc ) );
			return $item_data;
		}

		if ( empty( $custom_data['color_name'] ) ) {
			return $item_data;
		}

		$color_name = sanitize_text_field( $custom_data['color_name'] );
		$item_data[] = array( 'key' => 'Color', 'value' => $color_name, 'display' => esc_html( $color_name ) );

		return $item_data;
	}

	private function append_order_type_meta( $item_data, $custom_data ) {
		$order_type = 'Bulk';
		if ( isset( $custom_data['is_sample'] ) && (int) $custom_data['is_sample'] === 1 ) {
			$order_type = 'Sample';
		}

		$item_data[] = array( 'key' => 'Order Type', 'value' => $order_type, 'display' => '' );

		return $item_data;
	}

	private function append_customization_meta( $item_data, $custom_data ) {
		$added_from = isset( $custom_data['added_from'] ) ? (string) $custom_data['added_from'] : '';
		$item_data[] = array( 'key' => 'Customization', 'value' => $added_from === 'design' ? 'Yes' : 'No', 'display' => '' );

		return $item_data;
	}

	private function append_accessories_meta_if_needed( $item_data, $custom_data ) {
		if ( empty( $custom_data['accessories_names'] ) ) {
			return $item_data;
		}

		$names = $custom_data['accessories_names'];
		$list  = array();
		if ( is_string( $names ) ) {
			$decoded = json_decode( $names, true );
			$list    = is_array( $decoded ) ? $decoded : array_filter( array_map( 'trim', explode( ',', $names ) ) );
		} elseif ( is_array( $names ) ) {
			$list = $names;
		}

		$list = array_filter( array_map( 'sanitize_text_field', $list ) );
		if ( empty( $list ) ) {
			return $item_data;
		}

		$item_data[] = array( 'key' => 'Accessories Name', 'value' => implode( ', ', $list ), 'display' => '' );

		return $item_data;
	}

	private function build_order_item_images_html( $custom_data ) {
		if ( ! empty( $custom_data['view_images'] ) && is_array( $custom_data['view_images'] ) ) {
			$blocks = array();
			foreach ( $custom_data['view_images'] as $vm ) {
				if ( ! is_array( $vm ) ) {
					continue;
				}
				$vname  = isset( $vm['view_name'] ) ? (string) $vm['view_name'] : ( isset( $vm['view_id'] ) ? (string) $vm['view_id'] : 'View' );
				$images = isset( $vm['images'] ) && is_array( $vm['images'] ) ? $vm['images'] : array();
				if ( empty( $images ) ) {
					continue;
				}
				$imgs = array();
				foreach ( $images as $url ) {
					$imgs[] = '<img src="' . esc_url( $url ) . '" alt="' . esc_attr( $vname ) . '" class="pwca-order-custom-image">';
				}
				$blocks[] = '<div class="pwca-order-view-images"><div class="pwca-order-view-name">' . esc_html( $vname ) . '</div>' . implode( '', $imgs ) . '</div>';
			}
			if ( empty( $blocks ) ) {
				return '';
			}
			return '<div class="pwca-order-custom-images">' . implode( '', $blocks ) . '</div>';
		}

		if ( ! empty( $custom_data['custom_image'] ) ) {
			return '<div class="pwca-order-custom-images"><img src="' . esc_url( $custom_data['custom_image'] ) . '" alt="Custom Design" class="pwca-order-custom-image"></div>';
		}

		return '';
	}

	private function is_valid_image_data_url( $data_url ) {
		return is_string( $data_url ) && strpos( $data_url, 'data:image/' ) === 0 && strpos( $data_url, ';base64,' ) !== false;
	}

	private function get_discount_rate_from_custom( $custom ) {
		if ( isset( $custom['current_discount'] ) ) {
			$rate = (float) $custom['current_discount'];
			if ( $rate > 0 && $rate < 1 ) {
				return $rate;
			}
		}

		if ( ! empty( $custom['discount_text'] ) && is_string( $custom['discount_text'] ) ) {
			if ( preg_match( '/(\d+)\s*%/i', $custom['discount_text'], $m ) ) {
				$off = (float) $m[1];
				if ( $off > 0 && $off < 100 ) {
					return 1 - ( $off / 100 );
				}
			}
		}

		return null;
	}

	private function get_discount_label_from_custom( $custom ) {
		if ( ! empty( $custom['discount_text'] ) ) {
			return (string) $custom['discount_text'];
		}

		if ( isset( $custom['current_discount'] ) ) {
			$rate = (float) $custom['current_discount'];
			if ( $rate > 0 && $rate < 1 ) {
				return round( ( 1 - $rate ) * 100 ) . '% OFF';
			}
		}

		return null;
	}

	private function get_post_string( $key ) {
		return isset( $_POST[ $key ] ) ? (string) wp_unslash( $_POST[ $key ] ) : '';
	}

	private function get_post_sanitized_text( $key, $default = '' ) {
		$value = $this->get_post_string( $key );
		$value = $value === '' ? $default : $value;
		return sanitize_text_field( $value );
	}

	private function get_post_int( $key, $default = 0 ) {
		$value = $this->get_post_string( $key );
		if ( $value === '' ) {
			return (int) $default;
		}
		return (int) $value;
	}

	private function get_post_int_nullable( $key ) {
		$value = $this->get_post_string( $key );
		return $value === '' ? null : (int) $value;
	}

	private function get_post_float_nullable( $key ) {
		$value = $this->get_post_string( $key );
		if ( $value === '' ) {
			return null;
		}
		$float = (float) $value;
		return is_finite( $float ) ? $float : null;
	}

	private function get_post_bool( $key ) {
		$value = $this->get_post_string( $key );
		return $value === '1' || $value === 'true' || $value === 'on';
	}

	private function get_post_bool_nullable( $key ) {
		if ( ! isset( $_POST[ $key ] ) ) {
			return null;
		}
		return $this->get_post_bool( $key );
	}

	private function get_post_json_array( $key ) {
		$raw = $this->get_post_string( $key );
		if ( $raw === '' ) {
			return array();
		}
		$decoded = json_decode( $raw, true );
		return is_array( $decoded ) ? $decoded : array();
	}
}
