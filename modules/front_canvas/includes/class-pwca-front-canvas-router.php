<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Front_Canvas_Router {
	private $context;
	private $module_path;

	public function __construct( Pwca_Front_Canvas_Context $context, $module_path ) {
		$this->context     = $context;
		$this->module_path = untrailingslashit( $module_path );
	}

	public function register() {
		add_action( 'init', array( $this, 'register_rewrite_rules' ) );
		add_filter( 'query_vars', array( $this, 'register_query_vars' ) );
		add_action( 'template_redirect', array( $this, 'render_canvas_page' ), 0 );
	}

	public function register_rewrite_rules() {
		add_rewrite_rule( '^pwcanvas/?$', 'index.php?pw_canvas=1', 'top' );

		$flush_flag = get_option( 'pw_canvas_flush_rewrite' );
		if ( $flush_flag !== true ) {
			flush_rewrite_rules();
			update_option( 'pw_canvas_flush_rewrite', true );
		}
	}

	public function register_query_vars( $vars ) {
		$vars[] = 'pw_canvas';
		return $vars;
	}

	public function render_canvas_page() {
		if ( ! $this->context->is_canvas_request() ) {
			return;
		}

		$view_path = $this->module_path . '/views/canvas-page.php';
		if ( ! is_readable( $view_path ) ) {
			status_header( 404 );
			wp_die( esc_html__( 'Canvas page template not found.', 'pw-admin' ) );
		}

		nocache_headers();

		$context      = $this->context;
		$module_path  = $this->module_path;
		$product_id   = $context->get_product_id();
		$product_name = $context->get_product_name();
		$pw_id        = $context->get_pw_id();
		$is_edit_mode = $context->is_edit_mode();

		// 读取产品级别的 UI 开关（blank_item → sample-check, inquiry_button → inquiry-btn）
		$blank_item      = get_post_meta( $product_id, 'pw_blank_item', true );
		$inquiry_button  = get_post_meta( $product_id, 'pw_inquiry_button', true );
		$show_sample     = ( $blank_item === '1' || $blank_item === 1 || $blank_item === true );
		$show_inquiry    = ( $inquiry_button === '1' || $inquiry_button === 1 || $inquiry_button === true );

		include $view_path;
		exit;
	}
}
