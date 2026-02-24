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

			// 获取 SKU
			$sku = '';
			if ( method_exists( $item, 'get_meta' ) ) {
				$sku = $item->get_meta( 'Variation ID', true );
				if ( ! $sku ) {
					$sku = get_post_meta( $product_id, '_sku', true );
				}
			}

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

			// 获取 view_print_methods 数据（印刷方式名称映射）
			$view_print_methods = array();
			if ( method_exists( $item, 'get_meta' ) ) {
				$view_print_methods = $item->get_meta( 'view_print_methods', true );
				if ( ! is_array( $view_print_methods ) ) {
					$view_print_methods = array();
				}
			}

			// 获取印刷方式完整数据（包含图片）
			$print_methods_data = $this->get_print_methods_data_for_product( $product_id, $view_print_methods );

			$items_data[] = array(
				'item_id'            => (int) $item_id,
				'product_id'         => $product_id,
				'product_name'       => $product_name,
				'sku'                => $sku,
				'view_images'        => $view_images,
				'view_print_methods' => $view_print_methods,
				'print_methods_data' => $print_methods_data,
				'custom_color'       => $custom_color,
				'color_name'         => $color_name,
			);
		}

		return $items_data;
	}

	/**
	 * 获取产品关联的印刷方式完整数据
	 */
	private function get_print_methods_data_for_product( $product_id, $view_print_methods ) {
		$print_methods_data = array();

		// 从产品获取印刷方式ID列表
		$printing_method_ids = $this->get_printing_method_ids_from_product( $product_id );
		if ( empty( $printing_method_ids ) ) {
			return $print_methods_data;
		}

		// 通过 API 获取印刷方式完整数据
		$api_data = $this->fetch_print_methods_from_api( $printing_method_ids );
		if ( empty( $api_data ) ) {
			return $print_methods_data;
		}

		// 构建印刷方式名称到完整数据的映射
		foreach ( $api_data as $method ) {
			if ( ! is_array( $method ) || ! isset( $method['name'] ) ) {
				continue;
			}
			$print_methods_data[ $method['name'] ] = array(
				'id'                 => isset( $method['id'] ) ? (int) $method['id'] : 0,
				'name'               => $method['name'],
				'code'               => isset( $method['code'] ) ? $method['code'] : '',
				'description'        => isset( $method['description'] ) ? $method['description'] : '',
				'print_method_area'  => isset( $method['print_method_area'] ) ? $method['print_method_area'] : '',
				'print_cost'         => isset( $method['print_cost'] ) ? (float) $method['print_cost'] : 0,
				'moq_quantity'       => isset( $method['moq_quantity'] ) ? (int) $method['moq_quantity'] : 0,
				'process_time'       => isset( $method['process_time'] ) ? (int) $method['process_time'] : 0,
			);
		}

		return $print_methods_data;
	}

	/**
	 * 从产品获取印刷方式ID列表
	 */
	private function get_printing_method_ids_from_product( $product_id ) {
		$ids = array();

		// 从 pw_main_custom_view 和 pw_sub_custom_view 获取印刷方式ID
		$main_view = get_post_meta( $product_id, 'pw_main_custom_view', true );
		if ( is_array( $main_view ) && isset( $main_view['printing_method_list_id'] ) && is_array( $main_view['printing_method_list_id'] ) ) {
			$ids = array_merge( $ids, $main_view['printing_method_list_id'] );
		}

		$sub_views = get_post_meta( $product_id, 'pw_sub_custom_view', true );
		if ( is_array( $sub_views ) ) {
			foreach ( $sub_views as $sub_view ) {
				if ( is_array( $sub_view ) && isset( $sub_view['printing_method_list_id'] ) && is_array( $sub_view['printing_method_list_id'] ) ) {
					$ids = array_merge( $ids, $sub_view['printing_method_list_id'] );
				}
			}
		}

		return array_unique( array_filter( array_map( 'intval', $ids ) ) );
	}

	/**
	 * 通过 API 获取印刷方式数据
	 */
	private function fetch_print_methods_from_api( $printing_method_ids ) {
		if ( empty( $printing_method_ids ) ) {
			return array();
		}

		// 检查缓存
		$cache_key = 'pw_print_methods_' . md5( implode( ',', $printing_method_ids ) );
		$cached_data = get_transient( $cache_key );
		if ( $cached_data !== false && is_array( $cached_data ) ) {
			return $cached_data;
		}

		// 通过 REST API 获取数据
		$ids_string = implode( ',', $printing_method_ids );
		$api_url = rest_url( 'pw-canvas/v1/print-methods' );
		
		$response = wp_remote_post( $api_url, array(
			'headers' => array(
				'Content-Type' => 'application/json',
			),
			'body' => wp_json_encode( array(
				'printing_method_ids' => $printing_method_ids,
			) ),
			'timeout' => 30,
		) );

		if ( is_wp_error( $response ) ) {
			return array();
		}

		$body = wp_remote_retrieve_body( $response );
		$data = json_decode( $body, true );

		if ( ! is_array( $data ) || ! isset( $data['data'] ) || ! is_array( $data['data'] ) ) {
			return array();
		}

		$methods = $data['data'];
		
		// 缓存1小时
		set_transient( $cache_key, $methods, HOUR_IN_SECONDS );

		return $methods;
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
