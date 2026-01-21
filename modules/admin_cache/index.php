<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/includes/class-pwca-admin-cache.php';

Pwca_Admin_Cache::bootstrap(
	__DIR__,
	plugin_dir_url( __FILE__ )
);