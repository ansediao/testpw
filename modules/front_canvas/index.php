<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/includes/class-pwca-front-canvas.php';

Pwca_Public_Canvas::bootstrap(
	__DIR__,
	plugin_dir_url( __FILE__ )
);
