<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Admin_Orders_View_Design {
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
		// 在订单项元数据表格（display_meta table）下方添加按钮
		add_action( 'woocommerce_after_order_itemmeta', array( $this, 'render_button_after_item_meta' ), 10, 3 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		// 添加弹窗 HTML 到 footer
		add_action( 'admin_footer', array( $this, 'render_view_design_modal' ) );
	}

	public function enqueue_assets( $hook ) {
		if ( ! $this->should_load_assets( (string) $hook ) ) {
			return;
		}

		$this->maybe_enqueue_style( 'pwca-admin-orders-view-design', 'assets/scss/pwca-admin-orders-view-design.css' );

		wp_enqueue_script(
			'pwca-admin-orders-view-design',
			$this->module_url . 'assets/js/pwca-admin-orders-view-design.js',
			array(),
			null,
			true
		);
	}

	/**
	 * 渲染设计预览弹窗
	 */
	public function render_view_design_modal() {
		echo '<div class="modal" id="pwca-view-design-modal" aria-hidden="true">';
		echo '<div class="modal__overlay" data-micromodal-close>';
		echo '<div class="modal__container" role="dialog" aria-modal="true">';
		echo '<div class="modal__header">';
		echo '<h3 class="modal__title" id="pwca-view-design-modal-title">Design Preview</h3>';
		echo '<button class="modal__close" data-micromodal-close aria-label="Close">&times;</button>';
		echo '</div>';
		echo '<div class="modal__content" id="pwca-view-design-modal-body">';
		echo '<p class="pwca-view-design-empty">Loading...</p>';
		echo '</div>';
		echo '</div>';
		echo '</div>';
		echo '</div>';
	}

	/**
	 * 在订单项元数据表格（display_meta table）下方添加按钮
	 *
	 * @param int        $item_id 订单项ID
	 * @param WC_Order_Item $item 订单项对象
	 * @param WC_Product   $product 产品对象
	 */
	public function render_button_after_item_meta( $item_id, $item, $product ) {
		// 只处理 line_item 类型的订单项
		if ( ! ( is_object( $item ) && method_exists( $item, 'get_type' ) && $item->get_type() === 'line_item' ) ) {
			return;
		}

		$product_name = is_object( $item ) && method_exists( $item, 'get_name' ) ? (string) $item->get_name() : '';
		$product_id   = is_object( $item ) && method_exists( $item, 'get_product_id' ) ? (int) $item->get_product_id() : 0;

		// 获取 view_images 数据
		$view_images = array();
		if ( method_exists( $item, 'get_meta' ) ) {
			$view_images = $item->get_meta( '_view_images', true );
			if ( ! is_array( $view_images ) ) {
				$view_images = array();
			}
		}

		echo '<div class="pwca-admin-orders-item-meta-button">';
		echo '<button type="button" class="button pwca-admin-orders-view-design"'
			. ' data-item-id="' . esc_attr( (string) $item_id ) . '"'
			. ' data-product-id="' . esc_attr( (string) $product_id ) . '"'
			. ' data-product-name="' . esc_attr( $product_name ) . '"'
			. ' data-view-images="' . esc_attr( wp_json_encode( $view_images ) ) . '"'
			. '>';
		echo 'Designer Page';
		echo '</button>';
		echo '</div>';
	}

	private function should_load_assets( $hook ) {
		$screen = $this->get_current_screen_object();
		if ( ! $screen ) {
			return false;
		}

		$context = $this->get_screen_context( $screen );
		return $this->is_order_admin_screen( $context );
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
}
