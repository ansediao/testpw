<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/includes/class-pwca-admin-dashboard.php';

Pwca_Admin_Dashboard::bootstrap(
	__DIR__,
	plugin_dir_url( __FILE__ )
);
