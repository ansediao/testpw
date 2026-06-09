<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Public_Checkout_Template_Override {
	private $plugin_root_path;

	public function __construct( $plugin_root_path ) {
		$this->plugin_root_path = untrailingslashit( $plugin_root_path );
	}

	public function register() {
		add_filter( 'woocommerce_locate_template', array( $this, 'locate_template' ), 10, 3 );
	}

	public function locate_template( $template, $template_name, $template_path ) {
		$plugin_template_path = $this->plugin_root_path . '/woocommerce/' . ltrim( $template_name, '/' );
		if ( file_exists( $plugin_template_path ) ) {
			return $plugin_template_path;
		}

		return $template;
	}
}

