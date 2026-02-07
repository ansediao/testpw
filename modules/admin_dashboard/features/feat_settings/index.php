<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/includes/class-pwca-admin-dashboard-settings.php';

Pwca_Admin_Dashboard_Settings::bootstrap(
	__DIR__,
	plugin_dir_url( __FILE__ )
);
