<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/includes/class-pwca-front-checkout.php';

Pwca_Front_Checkout::bootstrap(
	__DIR__,
	plugin_dir_url( __FILE__ )
);
