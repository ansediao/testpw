<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Public_Product_Assets {
	private $context;
	private $module_path;
	private $module_url;
	private $plugin_root_path;
	private $plugin_root_url;

	public function __construct( Pwca_Public_Product_Context $context, $module_path, $module_url ) {
		$this->context          = $context;
		$this->module_path      = $module_path;
		$this->module_url       = $module_url;
		$this->plugin_root_path = untrailingslashit( dirname( dirname( $module_path ) ) );
		$this->plugin_root_url  = trailingslashit( plugin_dir_url( $this->plugin_root_path . '/pw-admin.php' ) );
	}

	public function register() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		add_action( 'wp_footer', array( $this, 'render_product_modals' ) );
	}

	public function enqueue_assets() {
		if ( ! $this->context->is_product_context() ) {
			return;
		}

		$this->enqueue_inquiry_styles();

		$product_id = $this->context->get_current_product_id();
		if ( ! $this->context->is_sync_product_id( $product_id ) ) {
			return;
		}

		$this->enqueue_vendor_assets();
		$this->enqueue_local_assets();
	}

	public function render_product_modals() {
		if ( ! $this->context->is_product_context() ) {
			return;
		}

		$product_id = $this->context->get_current_product_id();
		if ( ! $this->context->is_sync_product_id( $product_id ) ) {
			return;
		}

		$modal_view_path = $this->module_path . '/views/partials/pwca-gradient-modal.php';
		if ( is_readable( $modal_view_path ) ) {
			include $modal_view_path;
		}
	}

	private function enqueue_inquiry_styles() {
		$this->enqueue_style_if_readable(
			'pwca-front-product-inquiry',
			'assets/scss/pwca-front-product-inquiry.css',
			array()
		);
	}

	private function enqueue_vendor_assets() {
		wp_enqueue_style( 'pwca-vendor-layui', 'https://unpkg.com/layui@2.11.5/dist/css/layui.css', array(), '2.11.5' );

		wp_enqueue_script( 'pwca-vendor-layui', 'https://unpkg.com/layui@2.11.5/dist/layui.js', array(), '2.11.5', true );
		wp_enqueue_script( 'pwca-vendor-vue', 'https://unpkg.com/vue@3/dist/vue.global.js', array(), '3', true );
		wp_enqueue_script( 'pwca-vendor-vue-demi', 'https://unpkg.com/vue-demi@0.14.7/lib/index.iife.js', array( 'pwca-vendor-vue' ), '0.14.7', true );
		wp_enqueue_script( 'pwca-vendor-axios', 'https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js', array(), '1.6.0', true );
		wp_enqueue_script( 'pwca-vendor-vueuse-shared', 'https://unpkg.com/@vueuse/shared', array(), null, true );
		wp_enqueue_script( 'pwca-vendor-vueuse-core', 'https://unpkg.com/@vueuse/core', array( 'pwca-vendor-vueuse-shared' ), null, true );
		wp_enqueue_script( 'pwca-vendor-fabric', 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js', array(), '5.3.0', true );
	}

	private function enqueue_local_assets() {
		$this->enqueue_local_styles();
		$this->enqueue_component_styles();
		$this->enqueue_core_scripts();
		$this->enqueue_component_scripts();
		$this->enqueue_main_script();
	}

	private function enqueue_local_styles() {
		$this->enqueue_style_if_readable( 'pwca-cart-section', 'assets/scss/pw-cart-section.css', array() );
		$this->enqueue_style_if_readable( 'pwca-color-variants', 'assets/scss/pw-color-variants.css', array() );
		$this->enqueue_style_if_readable( 'pwca-product-canvas', 'assets/scss/pw-product-canvas.css', array() );
		$this->enqueue_style_if_readable( 'pwca-composite-components', 'assets/scss/pw-composite-components.css', array() );
		$this->enqueue_style_if_readable( 'pwca-gradient-modal', 'assets/scss/pw-gradient-modal.css', array() );
	}

	private function enqueue_component_styles() {
		$this->enqueue_style_if_readable( 'pwca-product-checkbox-options', 'assets/js/product/components/CheckboxOptions.css', array() );
		$this->enqueue_style_if_readable( 'pwca-product-price-info', 'assets/js/product/components/ProductPriceInfo.css', array() );
		$this->enqueue_style_if_readable( 'pwca-product-quantity', 'assets/js/product/components/ProductQuantity.css', array() );
		$this->enqueue_style_if_readable( 'pwca-product-quantity-discount', 'assets/js/product/components/QuantityDiscountSlider.css', array() );
		$this->enqueue_style_if_readable( 'pwca-product-accessories', 'assets/js/product/components/ProductAccessories.css', array() );
		$this->enqueue_style_if_readable( 'pwca-product-custom-colors', 'assets/js/product/components/CustomColorsButton.css', array() );
	}

	private function enqueue_core_scripts() {
		$this->enqueue_script_if_readable( 'pwca-canvas-manager', $this->plugin_root_url . 'modules/front_canvas/assets/js/canvas-manager.js', array( 'pwca-vendor-fabric' ), $this->plugin_root_path . '/modules/front_canvas/assets/js/canvas-manager.js' );

		$this->enqueue_script_if_readable( 'pwca-product-image-canvas', $this->module_url . 'assets/js/product/product-image-canvas.js', array( 'pwca-canvas-manager' ), $this->module_path . '/assets/js/product/product-image-canvas.js' );
		$this->enqueue_script_if_readable( 'pwca-product-api', $this->module_url . 'assets/js/product/api/productDataAPI.js', array(), $this->module_path . '/assets/js/product/api/productDataAPI.js' );
		$this->enqueue_script_if_readable( 'pwca-product-response-mapper', $this->module_url . 'assets/js/product/api/productResponseMapper.js', array( 'pwca-product-api' ), $this->module_path . '/assets/js/product/api/productResponseMapper.js' );
		$this->enqueue_script_if_readable( 'pwca-product-canvas-payload-builder', $this->module_url . 'assets/js/product/api/canvasPayloadBuilder.js', array( 'pwca-product-response-mapper' ), $this->module_path . '/assets/js/product/api/canvasPayloadBuilder.js' );
		$this->enqueue_script_if_readable( 'pwca-product-cart-submit-service', $this->module_url . 'assets/js/product/api/cartSubmitService.js', array( 'pwca-product-canvas-payload-builder' ), $this->module_path . '/assets/js/product/api/cartSubmitService.js' );
		$this->enqueue_script_if_readable( 'pwca-product-store', $this->module_url . 'assets/js/product/stores/productStore.js', array( 'pwca-vendor-vue', 'pwca-product-cart-submit-service' ), $this->module_path . '/assets/js/product/stores/productStore.js' );
		if ( function_exists( 'wp_script_is' ) && wp_script_is( 'pwca-product-store', 'enqueued' ) ) {
			wp_localize_script(
				'pwca-product-store',
				'pwAjax',
				array(
					'ajaxurl' => admin_url( 'admin-ajax.php' ),
					'nonce'   => wp_create_nonce( 'custom-product-nonce' ),
				)
			);
		}
		$this->enqueue_script_if_readable( 'pwca-product-messages', $this->module_url . 'assets/js/utils/messageUtils.js', array(), $this->module_path . '/assets/js/utils/messageUtils.js' );
	}

	private function enqueue_component_scripts() {
		$this->enqueue_script_if_readable( 'pwca-product-component-quantity-discount', $this->module_url . 'assets/js/product/components/QuantityDiscountSlider.js', array( 'pwca-vendor-vue', 'pwca-product-store' ), $this->module_path . '/assets/js/product/components/QuantityDiscountSlider.js' );
		$this->enqueue_script_if_readable( 'pwca-product-component-quantity', $this->module_url . 'assets/js/product/components/ProductQuantity.js', array( 'pwca-product-component-quantity-discount' ), $this->module_path . '/assets/js/product/components/ProductQuantity.js' );
		$this->enqueue_script_if_readable( 'pwca-product-component-price-info', $this->module_url . 'assets/js/product/components/ProductPriceInfo.js', array( 'pwca-product-component-quantity' ), $this->module_path . '/assets/js/product/components/ProductPriceInfo.js' );
		$this->enqueue_script_if_readable( 'pwca-product-component-add-to-cart', $this->module_url . 'assets/js/product/components/AddToCart.js', array( 'pwca-product-component-price-info' ), $this->module_path . '/assets/js/product/components/AddToCart.js' );
		$this->enqueue_script_if_readable( 'pwca-product-color-selection-bridge', $this->module_url . 'assets/js/product/components/colorSelectionBridge.js', array( 'pwca-product-component-add-to-cart' ), $this->module_path . '/assets/js/product/components/colorSelectionBridge.js' );
		$this->enqueue_script_if_readable( 'pwca-product-component-color-variants', $this->module_url . 'assets/js/product/components/ColorVariants.js', array( 'pwca-product-color-selection-bridge' ), $this->module_path . '/assets/js/product/components/ColorVariants.js' );
		$this->enqueue_script_if_readable( 'pwca-product-component-checkbox-options', $this->module_url . 'assets/js/product/components/CheckboxOptions.js', array( 'pwca-product-component-color-variants' ), $this->module_path . '/assets/js/product/components/CheckboxOptions.js' );
		$this->enqueue_script_if_readable( 'pwca-product-component-accessories', $this->module_url . 'assets/js/product/components/ProductAccessories.js', array( 'pwca-product-component-checkbox-options' ), $this->module_path . '/assets/js/product/components/ProductAccessories.js' );
		$this->enqueue_script_if_readable( 'pwca-product-component-custom-colors', $this->module_url . 'assets/js/product/components/CustomColorsButton.js', array( 'pwca-product-component-accessories' ), $this->module_path . '/assets/js/product/components/CustomColorsButton.js' );
	}

	private function enqueue_main_script() {
		$this->enqueue_script_if_readable(
			'pwca-product-main',
			$this->module_url . 'assets/js/product/main.js',
			array( 'pwca-product-component-custom-colors' ),
			$this->module_path . '/assets/js/product/main.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-product-gradient-modal',
			$this->module_url . 'assets/js/product/gradient-modal.js',
			array( 'pwca-product-main' ),
			$this->module_path . '/assets/js/product/gradient-modal.js'
		);
	}

	private function enqueue_style_if_readable( $handle, $relative_path, $deps ) {
		$css_path = $this->module_path . '/' . ltrim( $relative_path, '/' );
		if ( ! is_readable( $css_path ) ) {
			return;
		}

		wp_enqueue_style( $handle, $this->module_url . ltrim( $relative_path, '/' ), $deps, filemtime( $css_path ), 'all' );
	}

	private function enqueue_script_if_readable( $handle, $src, $deps, $path_for_version ) {
		if ( ! is_readable( $path_for_version ) ) {
			return;
		}

		wp_enqueue_script( $handle, $src, $deps, filemtime( $path_for_version ), true );
	}
}
