<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/includes/class-pwca-admin-dashboard-product-request.php';

Pwca_Admin_Dashboard_Product_Request::bootstrap(
	__DIR__,
	plugin_dir_url( __FILE__ )
);
