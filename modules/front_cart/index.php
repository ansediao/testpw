<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/includes/class-pwca-front-cart.php';

Pwca_Front_Cart::bootstrap(
	__DIR__,
	plugin_dir_url( __FILE__ )
);
