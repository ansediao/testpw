<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Admin_Orders {
	private $module_path;
	private $module_url;

	public static function bootstrap( $module_path, $module_url ) {
		$instance = new self( $module_path, $module_url );
		$instance->register();
	}

	private function __construct( $module_path, $module_url ) {
		$this->module_path = trailingslashit( (string) $module_path );
		$this->module_url  = trailingslashit( (string) $module_url );
	}

	public function register() {
		add_action( 'woocommerce_checkout_create_order_line_item', array( $this, 'store_custom_data_on_order_item' ), 10, 4 );
		// 在订单操作区域（Order actions）渲染 PDF 生成按钮
		add_action( 'woocommerce_order_actions_end', array( $this, 'render_production_pdf_button' ), 10, 1 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
	}

	public function enqueue_assets( $hook ) {
		if ( ! $this->should_load_assets( (string) $hook ) ) {
			return;
		}

		if ( ! wp_script_is( 'jspdf', 'registered' ) ) {
			wp_register_script(
				'jspdf',
				'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
				array(),
				'2.5.1',
				true
			);
		}

		$this->maybe_enqueue_style( 'pwca-admin-orders-production-pdf', 'assets/scss/pwca-admin-orders-production-pdf.css' );

		wp_enqueue_script(
			'pwca-admin-orders-production-pdf',
			$this->module_url . 'assets/js/pwca-admin-orders-production-pdf.js',
			array( 'jspdf' ),
			null,
			true
		);

		wp_localize_script(
			'pwca-admin-orders-production-pdf',
			'pwcaAdminOrdersProductionPdf',
			array(
				'i18n' => array(
					'generating' => 'Generating PDF...',
					'success'    => 'Generated and download started',
					'failed'     => 'Generation failed',
				),
			)
		);
	}

	public function store_custom_data_on_order_item( $item, $cart_item_key, $values, $order ) {
		if ( ! $item || ! is_object( $item ) || ! method_exists( $item, 'add_meta_data' ) ) {
			return;
		}

		$product_id = $item->get_product_id();


		

		if ( $product_id ) {
			$pw_id = get_post_meta( $product_id, 'pw_id', true );
			if ( $pw_id ) {
				$item->add_meta_data( 'Variation ID', $pw_id, true );
			}
		}

		if ( ! isset( $values['custom_data'] ) || ! is_array( $values['custom_data'] ) ) {
			return;
		}

		$custom_data = $this->sanitize_custom_data( $values['custom_data'] );
		if ( empty( $custom_data ) ) {
			return;
		}

		$skip_keys = array( 'custom_image', 'added_from' );
		foreach ( $custom_data as $key => $value ) {
			if ( in_array( $key, $skip_keys, true ) ) {
				continue;
			}
			$item->add_meta_data( $key, $value, true );
		}

		// if ( isset( $custom_data['custom_image'] ) && is_string( $custom_data['custom_image'] ) && $custom_data['custom_image'] !== '' ) {
		// 	$item->add_meta_data( '_custom_image', $custom_data['custom_image'], true );
		// }

		// $legacy_color = '';
		// if ( isset( $custom_data['custom_color'] ) && is_string( $custom_data['custom_color'] ) ) {
		// 	$legacy_color = $custom_data['custom_color'];
		// } elseif ( isset( $custom_data['color'] ) && is_string( $custom_data['color'] ) ) {
		// 	$legacy_color = $custom_data['color'];
		// }
		// if ( $legacy_color !== '' ) {
		// 	$item->add_meta_data( '_custom_color', $legacy_color, true );
		// }

		if ( isset( $values['custom_data']['custom_image'] ) && is_string( $values['custom_data']['custom_image'] ) && $values['custom_data']['custom_image'] !== '' ) {
			$download_link = '<a href="' . esc_url( $values['custom_data']['custom_image'] ) . '" target="_blank" download class="button">下载设计图</a>';
			$item->add_meta_data( '　', $download_link, false );
		}
	}

	/**
	 * 在订单操作区域（Order actions）渲染 PDF 生成按钮
	 */
	public function render_production_pdf_button( $order_id ) {
		$order = wc_get_order( $order_id );
		if ( ! $this->is_valid_order( $order ) ) {
			return;
		}

		// 收集所有有设计数据的商品
		$items_data = $this->collect_order_design_items( $order );
		if ( empty( $items_data ) ) {
			return;
		}

		$order_number = (string) $order->get_order_number();

		echo '<li class="wide pwca-admin-orders-production-pdf-action">';
		echo '<div class="pwca-admin-orders-production-pdf"'
			. ' data-order-id="' . esc_attr( (string) $order_id ) . '"'
			. ' data-order-number="' . esc_attr( $order_number ) . '"'
			. ' data-items="' . esc_attr( wp_json_encode( $items_data ) ) . '"'
			. '>';
		echo '<button type="button" class="button button-primary pwca-admin-orders-generate-pdf">Generate Print PDF</button>';
		echo '<span class="spinner"></span>';
		echo '<span class="pwca-admin-orders-production-pdf__status"></span>';
		echo '</div>';
		echo '</li>';
	}

	/**
	 * 收集订单中所有有设计数据的商品信息
	 */
	private function collect_order_design_items( $order ) {
		$items_data = array();
		$items = $order->get_items();

		foreach ( $items as $item_id => $item ) {
			if ( ! ( is_object( $item ) && method_exists( $item, 'get_type' ) && $item->get_type() === 'line_item' ) ) {
				continue;
			}

			$resolved = $this->resolve_item_design_data( $item_id, $item );
			if ( $resolved['custom_image'] === '' ) {
				continue;
			}

			$product_name = is_object( $item ) && method_exists( $item, 'get_name' ) ? (string) $item->get_name() : '';
			$product_id   = is_object( $item ) && method_exists( $item, 'get_product_id' ) ? (int) $item->get_product_id() : 0;

			$items_data[] = array(
				'item_id'      => (int) $item_id,
				'product_id'   => $product_id,
				'product_name' => $product_name,
				'custom_image' => $resolved['custom_image'],
				'custom_color' => $resolved['custom_color'],
				'color_name'   => $resolved['color_name'],
			);
		}

		return $items_data;
	}

	private function should_load_assets( $hook ) {
		$screen = $this->get_current_screen_object();
		if ( ! $screen ) {
			return false;
		}

		$context = $this->get_screen_context( $screen );
		return $this->is_order_admin_screen( $context );
	}

	private function is_valid_order( $order ) {
		return is_object( $order ) && method_exists( $order, 'get_id' ) && method_exists( $order, 'get_order_number' );
	}

	private function sanitize_custom_data( array $custom_data ) {
		$out = $this->sanitize_custom_data_scalars( $custom_data );

		$flags = $this->sanitize_custom_data_flags( $custom_data );
		if ( ! empty( $flags ) ) {
			$out = array_merge( $out, $flags );
		}

		$view_images = $this->sanitize_custom_data_view_images( $custom_data );
		if ( ! empty( $view_images ) ) {
			$out['view_images'] = $view_images;
		}

		$accessories = $this->sanitize_accessories_names( $custom_data );
		if ( ! empty( $accessories ) ) {
			$out['accessories_names'] = $accessories;
		}

		return $out;
	}

	private function sanitize_view_images( array $view_images ) {
		$out = array();
		foreach ( $view_images as $view_item ) {
			$sanitized = $this->sanitize_view_image_item( $view_item );
			if ( ! empty( $sanitized ) ) {
				$out[] = $sanitized;
			}
		}
		return $out;
	}

	private function get_current_screen_object() {
		if ( ! function_exists( 'get_current_screen' ) ) {
			return null;
		}

		$screen = get_current_screen();
		if ( ! $screen || ! is_object( $screen ) ) {
			return null;
		}

		return $screen;
	}

	private function get_screen_context( $screen ) {
		return array(
			'id'        => isset( $screen->id ) ? (string) $screen->id : '',
			'base'      => isset( $screen->base ) ? (string) $screen->base : '',
			'post_type' => isset( $screen->post_type ) ? (string) $screen->post_type : '',
		);
	}

	private function is_order_admin_screen( array $context ) {
		if ( $context['id'] === 'shop_order' && $context['base'] === 'post' ) {
			return true;
		}

		if ( $context['post_type'] === 'shop_order' && in_array( $context['base'], array( 'post', 'edit' ), true ) ) {
			return true;
		}

		if ( $context['id'] === 'woocommerce_page_wc-orders' ) {
			return true;
		}

		if ( strpos( $context['id'], 'wc-orders' ) !== false ) {
			return true;
		}

		return false;
	}

	private function sanitize_custom_data_scalars( array $custom_data ) {
		$allowed_scalar_keys = array(
			'custom_image',
			'color',
			'color_name',
			'color_value',
			'custom_color',
			'variant_id',
			'added_from',
		);

		$out = array();
		foreach ( $allowed_scalar_keys as $key ) {
			$value = $this->sanitize_scalar_value( $custom_data, $key );
			if ( $value !== '' ) {
				$out[ $key ] = $value;
			}
		}

		return $out;
	}

	private function sanitize_scalar_value( array $custom_data, $key ) {
		if ( ! array_key_exists( $key, $custom_data ) ) {
			return '';
		}

		$value = $custom_data[ $key ];
		if ( is_string( $value ) ) {
			return sanitize_text_field( $value );
		}
		if ( is_numeric( $value ) ) {
			return (string) $value;
		}

		return '';
	}

	private function sanitize_custom_data_flags( array $custom_data ) {
		if ( ! array_key_exists( 'is_blank', $custom_data ) ) {
			return array();
		}

		$value = $custom_data['is_blank'];
		$is_blank = is_numeric( $value ) ? (int) $value : ( (bool) $value ? 1 : 0 );

		return array(
			'is_blank' => $is_blank,
		);
	}

	private function sanitize_custom_data_view_images( array $custom_data ) {
		if ( ! isset( $custom_data['view_images'] ) || ! is_array( $custom_data['view_images'] ) ) {
			return array();
		}

		return $this->sanitize_view_images( $custom_data['view_images'] );
	}

	private function sanitize_accessories_names( array $custom_data ) {
		if ( ! isset( $custom_data['accessories_names'] ) || ! is_array( $custom_data['accessories_names'] ) ) {
			return array();
		}

		$out = array();
		foreach ( $custom_data['accessories_names'] as $value ) {
			$clean = sanitize_text_field( (string) $value );
			if ( $clean !== '' ) {
				$out[] = $clean;
			}
		}

		return array_values( $out );
	}

	private function sanitize_view_image_item( $view_item ) {
		if ( ! is_array( $view_item ) ) {
			return array();
		}

		$view_id   = isset( $view_item['view_id'] ) ? sanitize_text_field( (string) $view_item['view_id'] ) : '';
		$view_name = isset( $view_item['view_name'] ) ? sanitize_text_field( (string) $view_item['view_name'] ) : '';
		$images    = isset( $view_item['images'] ) && is_array( $view_item['images'] ) ? $view_item['images'] : array();

		$urls = $this->sanitize_image_urls( $images );
		if ( empty( $urls ) ) {
			return array();
		}

		return array(
			'view_id'   => $view_id,
			'view_name' => $view_name,
			'images'    => $urls,
		);
	}

	private function sanitize_image_urls( array $urls ) {
		$out = array();
		foreach ( $urls as $url ) {
			if ( ! is_string( $url ) ) {
				continue;
			}
			$clean = esc_url_raw( $url );
			if ( $clean !== '' ) {
				$out[] = $clean;
			}
		}
		return array_values( $out );
	}

	private function maybe_enqueue_style( $handle, $relative_css_path ) {
		$relative_css_path = ltrim( (string) $relative_css_path, '/\\' );
		$css_path = $this->module_path . str_replace( array( '/', '\\' ), DIRECTORY_SEPARATOR, $relative_css_path );
		if ( ! file_exists( $css_path ) ) {
			return;
		}

		wp_enqueue_style(
			(string) $handle,
			$this->module_url . str_replace( DIRECTORY_SEPARATOR, '/', $relative_css_path ),
			array(),
			null
		);
	}

	private function resolve_item_design_data( $item_id, $item ) {
		$from_custom = $this->resolve_from_custom_data_meta( $item );

		$custom_image = $from_custom['custom_image'];
		$custom_color = $from_custom['custom_color'];
		$color_name   = $from_custom['color_name'];

		if ( $custom_image === '' ) {
			$custom_image = $this->get_legacy_item_custom_image( (int) $item_id );
		}

		if ( $custom_color === '' ) {
			$custom_color = $this->get_legacy_item_custom_color( (int) $item_id );
		}

		return array(
			'custom_image' => $custom_image,
			'custom_color' => $custom_color,
			'color_name'   => $color_name,
		);
	}

	private function resolve_from_custom_data_meta( $item ) {
		$custom_image = '';
		$custom_color = '';
		$color_name   = '';

		if ( ! ( is_object( $item ) && method_exists( $item, 'get_meta' ) ) ) {
			return array(
				'custom_image' => '',
				'custom_color' => '',
				'color_name'   => '',
			);
		}

		$meta = $item->get_meta( 'custom_data', true );
		if ( ! is_array( $meta ) ) {
			return array(
				'custom_image' => '',
				'custom_color' => '',
				'color_name'   => '',
			);
		}

		if ( isset( $meta['custom_image'] ) && is_string( $meta['custom_image'] ) ) {
			$custom_image = esc_url_raw( $meta['custom_image'] );
		}

		if ( isset( $meta['custom_color'] ) && is_string( $meta['custom_color'] ) ) {
			$custom_color = sanitize_text_field( $meta['custom_color'] );
		} elseif ( isset( $meta['color'] ) && is_string( $meta['color'] ) ) {
			$custom_color = sanitize_text_field( $meta['color'] );
		}

		if ( isset( $meta['color_name'] ) && is_string( $meta['color_name'] ) ) {
			$color_name = sanitize_text_field( $meta['color_name'] );
		}

		return array(
			'custom_image' => $custom_image,
			'custom_color' => $custom_color,
			'color_name'   => $color_name,
		);
	}

	private function get_legacy_item_custom_image( $item_id ) {
		$legacy_image = wc_get_order_item_meta( $item_id, '_custom_image', true );
		if ( is_string( $legacy_image ) ) {
			$clean = esc_url_raw( $legacy_image );
			if ( $clean !== '' ) {
				return $clean;
			}
		}

		$legacy_design_html = wc_get_order_item_meta( $item_id, '定制设计', true );
		if ( is_string( $legacy_design_html ) ) {
			return $this->extract_first_image_url( $legacy_design_html );
		}

		return '';
	}

	private function get_legacy_item_custom_color( $item_id ) {
		$legacy_color = wc_get_order_item_meta( $item_id, '_custom_color', true );
		if ( is_string( $legacy_color ) ) {
			$clean = sanitize_text_field( $legacy_color );
			if ( $clean !== '' ) {
				return $clean;
			}
		}

		$legacy_color = wc_get_order_item_meta( $item_id, '颜色', true );
		if ( is_string( $legacy_color ) ) {
			return sanitize_text_field( $legacy_color );
		}

		return '';
	}

	private function extract_first_image_url( $html ) {
		$html = (string) $html;
		if ( $html === '' ) {
			return '';
		}

		if ( preg_match( '#<img[^>]+src=["\']([^"\']+)["\']#i', $html, $matches ) ) {
			if ( isset( $matches[1] ) && is_string( $matches[1] ) ) {
				return esc_url_raw( $matches[1] );
			}
		}

		return '';
	}
}
