<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/includes/class-pwca-admin-dashboard-status.php';

Pwca_Admin_Dashboard_Status::bootstrap(
	__DIR__,
	plugin_dir_url( __FILE__ )
);
