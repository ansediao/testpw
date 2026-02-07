<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/includes/class-pwca-admin-orders-production-pdf.php';

Pwca_Admin_Orders_Production_Pdf::bootstrap(
	__DIR__,
	plugin_dir_url( __FILE__ )
);
