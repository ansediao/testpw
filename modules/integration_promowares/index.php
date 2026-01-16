<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/includes/class-pwca-integration-promowares.php';

Pwca_Integration_Promowares::bootstrap(
	__DIR__,
	plugin_dir_url( __FILE__ )
);
