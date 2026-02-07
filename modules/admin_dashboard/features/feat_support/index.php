<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/includes/class-pwca-admin-dashboard-support.php';

Pwca_Admin_Dashboard_Support::bootstrap(
	__DIR__,
	plugin_dir_url( __FILE__ )
);
