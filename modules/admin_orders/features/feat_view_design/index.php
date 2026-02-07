<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/includes/class-pwca-admin-orders-view-design.php';

Pwca_Admin_Orders_View_Design::bootstrap(
	__DIR__,
	plugin_dir_url( __FILE__ )
);
