<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/includes/class-pwca-front-product.php';

Pwca_Front_Product::bootstrap(
	__DIR__,
	plugin_dir_url( __FILE__ )
);
