<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Public_Cart_Design_Column {
	private $context;

	public function __construct( Pwca_Public_Cart_Context $context ) {
		$this->context = $context;
	}

	public function register() {
		add_filter( 'woocommerce_cart_item_class', array( $this, 'add_cart_item_key_class' ), 10, 3 );
		add_action( 'woocommerce_after_cart_item_name', array( $this, 'render_hidden_design_cell' ), 10, 2 );
		add_action( 'wp_enqueue_scripts', array( $this, 'localize_design_data' ) );
	}

	public function add_cart_item_key_class( $class, $cart_item, $cart_item_key ) {
		if ( ! $this->context->is_cart_context() ) {
			return $class;
		}

		$class .= ' ' . sanitize_html_class( 'pwca-ci-' . $cart_item_key );

		return $class;
	}

	public function render_hidden_design_cell( $cart_item, $cart_item_key ) {
		if ( ! $this->context->is_cart_context() ) {
			return;
		}

		$design_html = $this->build_design_preview_html( $cart_item );
		if ( $design_html === '' ) {
			return;
		}

		echo '<div class="pwca-cart-design-hidden" hidden>' . $design_html . '</div>';
	}

	public function localize_design_data() {
		if ( ! $this->context->is_cart_context() ) {
			return;
		}

		if ( ! function_exists( 'WC' ) || ! WC()->cart ) {
			return;
		}

		$map = $this->build_design_rows_map();

		wp_localize_script(
			'pwca-cart-design-column',
			'pwca_cart_design_rows',
			array(
				'map'          => $map,
				'placeholder'  => function_exists( 'wc_placeholder_img_src' ) ? wc_placeholder_img_src() : '',
			)
		);
	}

	private function build_design_preview_html( $cart_item ) {
		if ( ! isset( $cart_item['custom_data'] ) || ! is_array( $cart_item['custom_data'] ) ) {
			return '';
		}

		$custom      = $cart_item['custom_data'];
		$added_from  = isset( $custom['added_from'] ) ? (string) $custom['added_from'] : '';
		$product_id  = isset( $cart_item['product_id'] ) ? (int) $cart_item['product_id'] : 0;
		$views_meta  = isset( $custom['view_images'] ) && is_array( $custom['view_images'] ) ? $custom['view_images'] : array();

		$view_print_methods_map = $this->build_view_print_methods_map( $custom );

		if ( empty( $views_meta ) ) {
			if ( $added_from === 'product' || $added_from === '' ) {
				return '<span class="pw-design-na">' . esc_html__( 'Not Available', 'pw-admin' ) . '</span>';
			}
			return '';
		}

		$parts = array();
		foreach ( $views_meta as $vm ) {
			$parts[] = $this->render_view_images_block( $vm, $view_print_methods_map, $added_from, $product_id );
		}

		$parts = array_values(
			array_filter(
				$parts,
				function ( $html ) {
					return $html !== '';
				}
			)
		);

		if ( empty( $parts ) ) {
			return '';
		}

		return '<div class="pw-design-preview">' . implode( '', $parts ) . '</div>';
	}

	private function build_view_print_methods_map( $custom ) {
		$map = array();
		if ( ! isset( $custom['view_print_methods'] ) || ! is_array( $custom['view_print_methods'] ) ) {
			return $map;
		}

		foreach ( $custom['view_print_methods'] as $vpm ) {
			if ( ! is_array( $vpm ) ) {
				continue;
			}
			if ( ! isset( $vpm['view_id'], $vpm['print_methods'] ) ) {
				continue;
			}
			$view_id = (string) $vpm['view_id'];
			$methods = is_array( $vpm['print_methods'] ) ? $vpm['print_methods'] : array();
			$map[ $view_id ] = $methods;
		}

		return $map;
	}

	private function render_view_images_block( $vm, $view_print_methods_map, $added_from, $product_id ) {
		if ( ! is_array( $vm ) ) {
			return '';
		}

		$view_id  = isset( $vm['view_id'] ) ? (string) $vm['view_id'] : ( isset( $vm['id'] ) ? (string) $vm['id'] : '' );
		$view_raw = isset( $vm['view_name'] ) ? (string) $vm['view_name'] : ( $view_id !== '' ? $view_id : 'View' );
		$vname    = esc_html( $view_raw );

		$images = isset( $vm['images'] ) && is_array( $vm['images'] ) ? $vm['images'] : array();
		if ( empty( $images ) ) {
			return '';
		}

		$print_method_names = isset( $view_print_methods_map[ $view_id ] ) ? (array) $view_print_methods_map[ $view_id ] : array();
		$view_edit_url      = $this->build_view_edit_url( $added_from, $product_id, $view_id );

		$html  = '<div class="pwca-design-view">';
        $html .= '<div class="pwca-design-view-name">' . $vname . '</div>';
		if ( ! empty( $print_method_names ) ) {
			$html .= '<div class="pw-design-print-methods">' . esc_html( implode( ', ', $print_method_names ) ) . '</div>';
		}
		$html .= '<div class="pwca-design-view-images">';

		$img_count = count( $images );
		foreach ( array_values( $images ) as $idx => $url ) {
			$html .= $this->render_single_view_image( $url, $vname, $idx, $img_count, $view_id, $view_edit_url );
		}

		$html .= '</div></div>';

		return $html;
	}

	private function build_view_edit_url( $added_from, $product_id, $view_id ) {
		if ( $added_from !== 'design' || ! $product_id ) {
			return '';
		}

		$args = array(
			'product_id' => $product_id,
			'edit'       => 'true',
		);

		if ( $view_id !== '' ) {
			$args['view'] = $view_id;
		}

		return add_query_arg( $args, home_url( '/pwcanvas/' ) );
	}

	private function render_single_view_image( $url, $vname, $idx, $img_count, $view_id, $view_edit_url ) {
		$url = (string) $url;
		if ( $url === '' ) {
			return '';
		}

		$classes = 'pwca-design-item';
		$label   = '';

		if ( $img_count === 1 && $idx === 0 ) {
			$classes .= ' pwca-design-render';
			$label    = 'Mockup';
		}

		if ( $img_count === 2 ) {
			if ( $idx === 0 ) {
				$classes .= ' pwca-design-draft';
				$label    = 'Print File';
			} else {
				$classes .= ' pwca-design-render';
				$label    = 'Mockup';
			}
		}

		$img_tag = '<img src="' . esc_url( $url ) . '" alt="' . esc_attr( $vname ) . '">';

		$content = $img_tag;
		if ( strpos( $classes, 'pwca-design-draft' ) !== false && $view_edit_url !== '' ) {
			$content = '<a href="' . esc_url( $view_edit_url ) . '" target="_blank" rel="noopener noreferrer" class="pwca-draft-link" data-view-id="' . esc_attr( $view_id ) . '">' . $img_tag . '</a>';
		} elseif ( strpos( $classes, 'pwca-design-render' ) !== false ) {
			$content = '<a href="' . esc_url( $url ) . '" class="pwca-image-preview" data-image-url="' . esc_attr( $url ) . '" data-image-title="' . esc_attr( $vname . ' - ' . $label ) . '">' . $img_tag . '</a>';
		}

		$html  = '<div class="' . esc_attr( $classes ) . '">';
		$html .= $content;
		if ( $label !== '' ) {
			$html .= '<div class="pwca-design-label">' . esc_html( $label ) . '</div>';
		}
		$html .= '</div>';

		return $html;
	}

	private function build_design_rows_map() {
		$data_map = array();

		foreach ( WC()->cart->get_cart() as $cart_item_key => $cart_item ) {
			$custom  = isset( $cart_item['custom_data'] ) && is_array( $cart_item['custom_data'] ) ? $cart_item['custom_data'] : array();
			$designs = isset( $custom['designs'] ) && is_array( $custom['designs'] ) ? $custom['designs'] : array();

			if ( empty( $designs ) ) {
				continue;
			}

			$total_fee = isset( $custom['design_fee_total'] ) ? (float) $custom['design_fee_total'] : null;
			$sum_qty   = 0;
			foreach ( $designs as $design ) {
				$sum_qty += isset( $design['quantity'] ) ? (int) $design['quantity'] : 0;
			}

			$unit_fee = null;
			if ( $total_fee !== null && $sum_qty > 0 ) {
				$unit_fee = $total_fee / $sum_qty;
			}

			$data_map[ $cart_item_key ] = array(
				'designs'   => array_values( $designs ),
				'unit_fee'  => $unit_fee,
			);
		}

		return $data_map;
	}
}
