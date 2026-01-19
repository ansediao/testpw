<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/includes/class-pwca-admin-orders.php';

Pwca_Admin_Orders::bootstrap(
	__DIR__,
	plugin_dir_url( __FILE__ )
);
