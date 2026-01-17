<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/includes/class-pwca-admin-woocommerce.php';

Pwca_Admin_WooCommerce::bootstrap(
	__DIR__,
	plugin_dir_url( __FILE__ )
);

