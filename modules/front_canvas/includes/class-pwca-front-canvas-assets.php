<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Front_Canvas_Assets {
	private $context;
	private $module_path;
	private $module_url;
	private $plugin_root_path;
	private $plugin_root_url;

	public function __construct( Pwca_Front_Canvas_Context $context, $module_path, $module_url ) {
		$this->context          = $context;
		$this->module_path      = untrailingslashit( $module_path );
		$this->module_url       = trailingslashit( $module_url );
		$this->plugin_root_path = untrailingslashit( dirname( dirname( $module_path ) ) );
		$this->plugin_root_url  = trailingslashit( plugin_dir_url( $this->plugin_root_path . '/pw-admin.php' ) );
	}

	public function register() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		add_filter( 'script_loader_tag', array( $this, 'filter_script_loader_tag' ), 10, 3 );
	}

	public function enqueue_assets() {
		if ( ! $this->context->is_canvas_request() ) {
			return;
		}

		$this->enqueue_vendor_assets();
		$this->enqueue_local_styles();
		$this->enqueue_local_scripts();
	}

	public function filter_script_loader_tag( $tag, $handle, $src ) {
		$module_handles = $this->get_module_script_handles();
		if ( ! in_array( $handle, $module_handles, true ) ) {
			return $tag;
		}

		if ( strpos( $tag, ' type=' ) !== false ) {
			$tag = preg_replace( '/\stype=(["\'])(.*?)\1/', ' type="module"', $tag, 1 );
			return $tag;
		}

		return str_replace( '<script ', '<script type="module" ', $tag );
	}

	private function get_module_script_handles() {
		return array(
			'pwca-front-canvas-store-index',
			'pwca-front-canvas-header-controls',
			'pwca-front-canvas-product-card-footer',
			'pwca-front-canvas-design-main',
			'pwca-front-canvas-page-bootstrap',
		);
	}

	private function enqueue_vendor_assets() {
		wp_enqueue_style( 'pwca-vendor-layui', 'https://unpkg.com/layui@2.11.5/dist/css/layui.css', array(), '2.11.5' );
		wp_enqueue_style( 'pwca-vendor-icons', '//at.alicdn.com/t/c/font_4970780_pfyts3fzl6.css', array(), null );

		wp_enqueue_script( 'pwca-vendor-layui', 'https://unpkg.com/layui@2.11.5/dist/layui.js', array(), '2.11.5', true );
		wp_enqueue_script( 'pwca-vendor-vue', 'https://unpkg.com/vue@3/dist/vue.global.js', array(), '3', true );
		wp_enqueue_script( 'pwca-vendor-vue-demi', 'https://unpkg.com/vue-demi@0.14.7/lib/index.iife.js', array( 'pwca-vendor-vue' ), '0.14.7', true );
		wp_enqueue_script( 'pwca-vendor-pinia', 'https://unpkg.com/pinia@2/dist/pinia.iife.js', array( 'pwca-vendor-vue-demi' ), '2', true );

		wp_enqueue_script( 'pwca-vendor-vueuse-shared', 'https://unpkg.com/@vueuse/shared', array(), null, true );
		wp_enqueue_script( 'pwca-vendor-vueuse-core', 'https://unpkg.com/@vueuse/core', array( 'pwca-vendor-vueuse-shared' ), null, true );
		wp_enqueue_script( 'pwca-vendor-fabric', 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js', array(), '5.3.1', true );
		wp_enqueue_script( 'pwca-vendor-jspdf', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', array(), '2.5.1', true );

		wp_enqueue_script( 'pwca-vendor-three', 'https://unpkg.com/three@0.128.0/build/three.min.js', array(), '0.128.0', true );
		wp_enqueue_script( 'pwca-vendor-three-orbit', 'https://unpkg.com/three@0.128.0/examples/js/controls/OrbitControls.js', array( 'pwca-vendor-three' ), '0.128.0', true );
		wp_enqueue_script( 'pwca-vendor-three-gltf', 'https://unpkg.com/three@0.128.0/examples/js/loaders/GLTFLoader.js', array( 'pwca-vendor-three' ), '0.128.0', true );

		wp_enqueue_script( 'pwca-vendor-listjs', 'https://cdnjs.cloudflare.com/ajax/libs/list.js/2.3.1/list.min.js', array(), '2.3.1', true );
	}

	private function enqueue_local_styles() {
		$this->enqueue_style_if_readable(
			'pwca-front-canvas-onlinedesign',
			'assets/scss/pwca-front-canvas.css',
			array( 'pwca-vendor-layui', 'pwca-vendor-icons' )
		);

		$this->enqueue_plugin_style_if_readable(
			'pwca-gradient-modal',
			$this->plugin_root_url . 'modules/front_product/assets/scss/pw-gradient-modal.css',
			$this->plugin_root_path . '/modules/front_product/assets/scss/pw-gradient-modal.css',
			array( 'pwca-front-canvas-onlinedesign' )
		);
	}

	private function enqueue_local_scripts() {
		$this->enqueue_script_if_readable(
			'pwca-front-canvas-view-switch-facade',
			$this->module_url . 'assets/js/main/view-switch-facade.js',
			array( 'pwca-front-canvas-ui-state-access' ),
			$this->module_path . '/assets/js/main/view-switch-facade.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-url-params',
			$this->module_url . 'assets/js/design/url-params-handler.js',
			array( 'pwca-front-canvas-view-switch-facade', 'pwca-front-canvas-ui-state-access' ),
			$this->module_path . '/assets/js/design/url-params-handler.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-pinia-sync',
			$this->module_url . 'assets/js/utils/piniaSync.js',
			array(),
			$this->module_path . '/assets/js/utils/piniaSync.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-export',
			$this->module_url . 'assets/js/export.js',
			array( 'pwca-vendor-jspdf' ),
			$this->module_path . '/assets/js/export.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-ui-state-access',
			$this->module_url . 'assets/js/main/ui-state-access.js',
			array(),
			$this->module_path . '/assets/js/main/ui-state-access.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-toolbar',
			$this->module_url . 'assets/js/toolbar.js',
			array( 'pwca-front-canvas-ui-state-access' ),
			$this->module_path . '/assets/js/toolbar.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-boundary',
			$this->module_url . 'assets/js/boundary.js',
			array(),
			$this->module_path . '/assets/js/boundary.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-model-3d',
			$this->module_url . 'assets/js/model-3d.js',
			array( 'pwca-vendor-three-orbit', 'pwca-vendor-three-gltf' ),
			$this->module_path . '/assets/js/model-3d.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-canvas-manager',
			$this->module_url . 'assets/js/canvas-manager.js',
			array( 'pwca-vendor-fabric' ),
			$this->module_path . '/assets/js/canvas-manager.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-print-area-validator',
			$this->module_url . 'assets/js/design/utils/print-area-validator.js',
			array(),
			$this->module_path . '/assets/js/design/utils/print-area-validator.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-canvas-init',
			$this->module_url . 'assets/js/canvas-init.js',
			array( 'pwca-canvas-manager' ),
			$this->module_path . '/assets/js/canvas-init.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-core-init',
			$this->module_url . 'assets/js/main/core-init.js',
			array( 'pwca-front-canvas-canvas-init', 'pwca-front-canvas-ui-state-access' ),
			$this->module_path . '/assets/js/main/core-init.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-preview',
			$this->module_url . 'assets/js/main/preview.js',
			array( 'pwca-front-canvas-core-init', 'pwca-front-canvas-ui-state-access' ),
			$this->module_path . '/assets/js/main/preview.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-preview-init',
			$this->module_url . 'assets/js/main/preview-init.js',
			array( 'pwca-front-canvas-preview' ),
			$this->module_path . '/assets/js/main/preview-init.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-layers-sync',
			$this->module_url . 'assets/js/main/layers-sync.js',
			array( 'pwca-front-canvas-preview-init', 'pwca-front-canvas-ui-state-access' ),
			$this->module_path . '/assets/js/main/layers-sync.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-color-utils',
			$this->module_url . 'assets/js/main/color-utils.js',
			array( 'pwca-front-canvas-layers-sync' ),
			$this->module_path . '/assets/js/main/color-utils.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-product-gradient-modal',
			$this->plugin_root_url . 'modules/front_product/assets/js/product/gradient-modal.js',
			array( 'pwca-front-canvas-color-utils' ),
			$this->plugin_root_path . '/modules/front_product/assets/js/product/gradient-modal.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-capture',
			$this->module_url . 'assets/js/main/capture.js',
			array( 'pwca-front-canvas-color-utils', 'pwca-front-canvas-ui-state-access' ),
			$this->module_path . '/assets/js/main/capture.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-image-analyze',
			$this->module_url . 'assets/js/main/image-analyze.js',
			array( 'pwca-front-canvas-capture' ),
			$this->module_path . '/assets/js/main/image-analyze.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-grid-preview',
			$this->module_url . 'assets/js/main/grid-preview.js',
			array( 'pwca-front-canvas-image-analyze' ),
			$this->module_path . '/assets/js/main/grid-preview.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-universal-preview',
			$this->module_url . 'assets/js/main/universal-preview.js',
			array( 'pwca-front-canvas-grid-preview' ),
			$this->module_path . '/assets/js/main/universal-preview.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-events',
			$this->module_url . 'assets/js/main/events.js',
			array( 'pwca-front-canvas-universal-preview', 'pwca-front-canvas-ui-state-access' ),
			$this->module_path . '/assets/js/main/events.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-dynamic-toolbar',
			$this->module_url . 'assets/js/main/dongtai-toolbar.js',
			array( 'pwca-front-canvas-events', 'pwca-front-canvas-ui-state-access' ),
			$this->module_path . '/assets/js/main/dongtai-toolbar.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-tab-text',
			$this->module_url . 'assets/js/main/tab-text.js',
			array( 'pwca-front-canvas-dynamic-toolbar', 'pwca-front-canvas-ui-state-access' ),
			$this->module_path . '/assets/js/main/tab-text.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-tab-image',
			$this->module_url . 'assets/js/main/tab-image.js',
			array( 'pwca-front-canvas-dynamic-toolbar', 'pwca-front-canvas-ui-state-access' ),
			$this->module_path . '/assets/js/main/tab-image.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-customization-area',
			$this->module_url . 'assets/js/main/customization-area.js',
			array( 'pwca-front-canvas-events', 'pwca-front-canvas-view-switch-facade', 'pwca-front-canvas-ui-state-access' ),
			$this->module_path . '/assets/js/main/customization-area.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-inquiry-modal',
			$this->module_url . 'assets/js/main/inquiry-modal.js',
			array( 'pwca-front-canvas-events' ),
			$this->module_path . '/assets/js/main/inquiry-modal.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-operation-panel-design-search',
			$this->module_url . 'assets/js/main/operation-panel-design-search.js',
			array( 'pwca-front-canvas-events', 'pwca-vendor-listjs' ),
			$this->module_path . '/assets/js/main/operation-panel-design-search.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-operation-panel-tabs',
			$this->module_url . 'assets/js/main/operation-panel-tabs.js',
			array( 'pwca-front-canvas-events', 'pwca-front-canvas-ui-state-access' ),
			$this->module_path . '/assets/js/main/operation-panel-tabs.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-operation-panel-reviews',
			$this->module_url . 'assets/js/main/operation-panel-reviews.js',
			array( 'pwca-front-canvas-events' ),
			$this->module_path . '/assets/js/main/operation-panel-reviews.js'
		);

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-operation-panel-colors',
			$this->module_url . 'assets/js/main/operation-panel-colors.js',
			array( 'pwca-front-canvas-events', 'pwca-front-canvas-multi-view-init', 'pwca-front-canvas-ui-state-access' ),
			$this->module_path . '/assets/js/main/operation-panel-colors.js'
		);

		$this->enqueue_design_modules();

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-multi-view-init',
			$this->module_url . 'assets/js/canvas/multi-view-init.js',
			array( 'pwca-front-canvas-design-main', 'pwca-front-canvas-core-init' ),
			$this->module_path . '/assets/js/canvas/multi-view-init.js'
		);

		$this->enqueue_page_bootstrap();
	}

	private function enqueue_design_modules() {
		$this->enqueue_script_if_readable(
			'pwca-front-canvas-store-index',
			$this->module_url . 'assets/js/design/stores/index.js',
			array( 'pwca-vendor-pinia' ),
			$this->module_path . '/assets/js/design/stores/index.js'
		);
		wp_script_add_data( 'pwca-front-canvas-store-index', 'type', 'module' );

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-header-controls',
			$this->module_url . 'assets/js/design/components/header-controls.js',
			array( 'pwca-front-canvas-store-index', 'pwca-front-canvas-events', 'pwca-front-canvas-ui-state-access' ),
			$this->module_path . '/assets/js/design/components/header-controls.js'
		);
		wp_script_add_data( 'pwca-front-canvas-header-controls', 'type', 'module' );

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-product-card-footer',
			$this->module_url . 'assets/js/design/components/product-card-footer.js',
			array( 'pwca-front-canvas-store-index' ),
			$this->module_path . '/assets/js/design/components/product-card-footer.js'
		);
		wp_script_add_data( 'pwca-front-canvas-product-card-footer', 'type', 'module' );

		$this->enqueue_script_if_readable(
			'pwca-front-canvas-design-main',
			$this->module_url . 'assets/js/design/main.js',
			array( 'pwca-front-canvas-header-controls', 'pwca-front-canvas-product-card-footer' ),
			$this->module_path . '/assets/js/design/main.js'
		);
		wp_script_add_data( 'pwca-front-canvas-design-main', 'type', 'module' );
	}

	private function enqueue_page_bootstrap() {
		$this->enqueue_script_if_readable(
			'pwca-front-canvas-page-bootstrap',
			$this->module_url . 'assets/js/canvas/page-bootstrap.js',
			array( 'pwca-front-canvas-design-main', 'pwca-front-canvas-ui-state-access' ),
			$this->module_path . '/assets/js/canvas/page-bootstrap.js'
		);
		wp_script_add_data( 'pwca-front-canvas-page-bootstrap', 'type', 'module' );
	}

	private function enqueue_style_if_readable( $handle, $relative_path, $deps ) {
		$css_path = $this->module_path . '/' . ltrim( $relative_path, '/' );
		if ( ! is_readable( $css_path ) ) {
			return;
		}

		wp_enqueue_style( $handle, $this->module_url . ltrim( $relative_path, '/' ), $deps, filemtime( $css_path ), 'all' );
	}

	private function enqueue_plugin_style_if_readable( $handle, $src, $path_for_version, $deps ) {
		if ( ! is_readable( $path_for_version ) ) {
			return;
		}

		wp_enqueue_style( $handle, $src, $deps, filemtime( $path_for_version ), 'all' );
	}

	private function enqueue_script_if_readable( $handle, $src, $deps, $path_for_version ) {
		if ( ! is_readable( $path_for_version ) ) {
			return;
		}

		wp_enqueue_script( $handle, $src, $deps, filemtime( $path_for_version ), true );
	}
}
