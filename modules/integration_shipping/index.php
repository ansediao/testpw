<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/includes/class-pwca-integration-shipping.php';

Pwca_Integration_Shipping::bootstrap(
	__DIR__,
	plugin_dir_url( __FILE__ )
);
