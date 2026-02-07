<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/includes/class-pwca-admin-dashboard-dashboard.php';

Pwca_Admin_Dashboard_Dashboard::bootstrap(
	__DIR__,
	plugin_dir_url( __FILE__ )
);
