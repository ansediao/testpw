<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/includes/class-pwca-admin-orders-order-meta.php';

Pwca_Admin_Orders_Order_Meta::bootstrap(
	__DIR__,
	plugin_dir_url( __FILE__ )
);
