<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Admin_Orders_Production_Pdf {
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
		// 在订单数据列（order_data_column）最下面渲染订单详情 PDF 下载按钮
		add_action( 'woocommerce_admin_order_data_after_billing_address', array( $this, 'render_order_details_pdf_button' ), 10, 1 );
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

	/**
	 * 在订单数据区域（#order_data）渲染订单详情 PDF 下载按钮
	 */
	public function render_order_details_pdf_button( $order ) {
		if ( ! $this->is_valid_order( $order ) ) {
			return;
		}

		$order_id     = $order->get_id();
		$order_number = (string) $order->get_order_number();

		// 收集所有有设计数据的商品
		$items_data = $this->collect_order_design_items( $order );

		echo '<p class="form-field form-field-wide pwca-admin-orders-details-pdf-action">';
		echo '<span class="pwca-admin-orders-details-pdf"'
			. ' data-order-id="' . esc_attr( (string) $order_id ) . '"'
			. ' data-order-number="' . esc_attr( $order_number ) . '"'
			. ' data-items="' . esc_attr( wp_json_encode( $items_data ) ) . '"'
			. '>';
		echo '<button type="button" class="button button-primary pwca-admin-orders-download-details-pdf">Print File</button>';
		echo '<span class="spinner" style="float: none; margin-top: 0;"></span>';
		echo '<span class="pwca-admin-orders-details-pdf__status" style="margin-left: 10px;"></span>';
		echo '</span>';
		echo '</p>';
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

			// 获取 view_images 数据
			$view_images = array();
			if ( method_exists( $item, 'get_meta' ) ) {
				$view_images = $item->get_meta( '_view_images', true );
				if ( ! is_array( $view_images ) ) {
					$view_images = array();
				}
			}

			// 如果没有 view_images，跳过此订单项
			if ( empty( $view_images ) ) {
				continue;
			}

			$product_name = is_object( $item ) && method_exists( $item, 'get_name' ) ? (string) $item->get_name() : '';
			$product_id   = is_object( $item ) && method_exists( $item, 'get_product_id' ) ? (int) $item->get_product_id() : 0;

			// 获取颜色信息
			$color_name   = '';
			$custom_color = '';
			if ( method_exists( $item, 'get_meta' ) ) {
				$color_name   = $item->get_meta( 'color_name', true );
				$custom_color = $item->get_meta( 'custom_color', true );
				if ( ! $custom_color ) {
					$custom_color = $item->get_meta( 'color', true );
				}
			}

			$items_data[] = array(
				'item_id'      => (int) $item_id,
				'product_id'   => $product_id,
				'product_name' => $product_name,
				'view_images'  => $view_images,
				'custom_color' => $custom_color,
				'color_name'   => $color_name,
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
}
