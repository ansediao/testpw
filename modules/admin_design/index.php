<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/includes/class-pwca-admin-design.php';

Pwca_Admin_Design::bootstrap(
	__DIR__,
	plugin_dir_url( __FILE__ )
);
