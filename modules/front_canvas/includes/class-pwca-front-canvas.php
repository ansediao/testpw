<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Front_Canvas {
	private $module_path;
	private $module_url;

	public static function bootstrap( $module_path, $module_url ) {
		$instance              = new self();
		$instance->module_path = untrailingslashit( $module_path );
		$instance->module_url  = trailingslashit( $module_url );

		$instance->load_dependencies();
		$instance->register();
	}

	private function load_dependencies() {
		require_once $this->module_path . '/includes/class-pwca-front-canvas-context.php';
		require_once $this->module_path . '/includes/class-pwca-front-canvas-router.php';
		require_once $this->module_path . '/includes/class-pwca-front-canvas-assets.php';
		require_once $this->module_path . '/includes/class-pwca-front-canvas-inquiry-rest.php';
	}

	private function register() {
		$context = new Pwca_Front_Canvas_Context();

		( new Pwca_Front_Canvas_Router( $context, $this->module_path ) )->register();
		( new Pwca_Front_Canvas_Assets( $context, $this->module_path, $this->module_url ) )->register();
		( new Pwca_Front_Canvas_Inquiry_Rest() )->register();
	}
}

