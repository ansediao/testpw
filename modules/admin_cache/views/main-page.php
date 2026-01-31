<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$ajax_url           = isset( $view_model['ajax_url'] ) ? (string) $view_model['ajax_url'] : '';
$rest_product_base  = isset( $view_model['rest_product_base'] ) ? (string) $view_model['rest_product_base'] : '';
$clear_cache_nonce  = isset( $view_model['clear_cache_nonce'] ) ? (string) $view_model['clear_cache_nonce'] : '';
$cache_status_nonce = isset( $view_model['cache_status_nonce'] ) ? (string) $view_model['cache_status_nonce'] : '';

?>
<div
	class="wrap pwca-admin-cache"
	data-ajax-url="<?php echo esc_url( $ajax_url ); ?>"
	data-rest-product-base="<?php echo esc_url( $rest_product_base ); ?>"
	data-clear-cache-nonce="<?php echo esc_attr( $clear_cache_nonce ); ?>"
	data-cache-status-nonce="<?php echo esc_attr( $cache_status_nonce ); ?>"
>
	<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>

	<section class="pwca-admin-cache__section pwca-admin-cache__section--cache">
		<h2 class="pwca-admin-cache__section-title">Product Data Cache Management</h2>

		<div class="pwca-admin-cache__cache-status">
			<h3 class="pwca-admin-cache__sub-title">Cache Status</h3>
			<div class="pwca-admin-cache__cache-info" id="pwca-cache-info">
				<p><strong>Total Cached:</strong> <span id="pwca-total-cached">Loading...</span></p>
				<p><strong>Expired Cache:</strong> <span id="pwca-expired-count">Loading...</span></p>
				<p><strong>Last Updated:</strong> <span id="pwca-latest-cache-time">Loading...</span></p>
				<p><strong>Cache TTL:</strong> <span id="pwca-cache-expiry">30 minutes</span></p>
			</div>
			<button type="button" id="pwca-refresh-cache-status" class="button">Refresh Status</button>
		</div>

		<div class="pwca-admin-cache__cache-actions">
			<h3 class="pwca-admin-cache__sub-title">Cache Operations</h3>

			<div class="pwca-admin-cache__row">
				<input type="number" id="pwca-specific-product-id" placeholder="Enter Product ID (optional)" class="pwca-admin-cache__input">
				<button type="button" id="pwca-clear-specific-cache" class="button">Clear Specific Product Cache</button>
			</div>

			<div class="pwca-admin-cache__row">
				<button type="button" id="pwca-clear-all-cache" class="button button-secondary">Clear All Cache</button>
			</div>

			<div class="pwca-admin-cache__row">
				<input type="number" id="pwca-test-product-id" placeholder="Enter Product ID to test" class="pwca-admin-cache__input">
				<button type="button" id="pwca-test-cache" class="button">Test Cache Function</button>
			</div>

			<div class="pwca-admin-cache__result" id="pwca-cache-operation-result"></div>
		</div>
	</section>
</div>