<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$ajax_url             = isset( $view_model['ajax_url'] ) ? (string) $view_model['ajax_url'] : '';
$admin_page_url       = isset( $view_model['admin_page_url'] ) ? (string) $view_model['admin_page_url'] : '';
$store_url            = isset( $view_model['store_url'] ) ? (string) $view_model['store_url'] : '';
$rest_product_base    = isset( $view_model['rest_product_base'] ) ? (string) $view_model['rest_product_base'] : '';
$save_token_nonce     = isset( $view_model['save_token_nonce'] ) ? (string) $view_model['save_token_nonce'] : '';
$clear_cache_nonce    = isset( $view_model['clear_cache_nonce'] ) ? (string) $view_model['clear_cache_nonce'] : '';
$cache_status_nonce   = isset( $view_model['cache_status_nonce'] ) ? (string) $view_model['cache_status_nonce'] : '';
$current_token        = isset( $view_model['current_token'] ) ? (string) $view_model['current_token'] : '';
$current_store_id     = isset( $view_model['current_store_id'] ) ? (string) $view_model['current_store_id'] : '';
$save_mock_mode_nonce = isset( $view_model['save_mock_mode_nonce'] ) ? (string) $view_model['save_mock_mode_nonce'] : '';
$api_mock_mode        = isset( $view_model['api_mock_mode'] ) ? (int) $view_model['api_mock_mode'] : 0;
// 从 Dashboard 子模块获取消息
$messages = array();
if ( class_exists( 'Pwca_Admin_Dashboard_Dashboard' ) ) {
	$messages = Pwca_Admin_Dashboard_Dashboard::get_messages();
}

?>

<div
	class="wrap pwca-admin-dashboard"
	data-ajax-url="<?php echo esc_url( $ajax_url ); ?>"
	data-admin-page-url="<?php echo esc_url( $admin_page_url ); ?>"
	data-store-url="<?php echo esc_url( $store_url ); ?>"
	data-rest-product-base="<?php echo esc_url( $rest_product_base ); ?>"
	data-save-token-nonce="<?php echo esc_attr( $save_token_nonce ); ?>"
	data-clear-cache-nonce="<?php echo esc_attr( $clear_cache_nonce ); ?>"
	data-cache-status-nonce="<?php echo esc_attr( $cache_status_nonce ); ?>"
	data-save-mock-mode-nonce="<?php echo esc_attr( $save_mock_mode_nonce ); ?>"
	data-api-mock-mode="<?php echo esc_attr( (string) $api_mock_mode ); ?>"
>
	<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>

	<?php foreach ( $messages as $message ) : ?>
		<?php
		$type = isset( $message['type'] ) ? (string) $message['type'] : 'info';
		$text = isset( $message['text'] ) ? (string) $message['text'] : '';
		$notice_class = 'notice notice-info';
		if ( 'success' === $type ) {
			$notice_class = 'notice notice-success';
		}
		if ( 'error' === $type ) {
			$notice_class = 'notice notice-error';
		}
		?>
		<div class="<?php echo esc_attr( $notice_class ); ?> is-dismissible">
			<p><?php echo esc_html( $text ); ?></p>
		</div>
	<?php endforeach; ?>

	<section class="pwca-admin-dashboard__section pwca-admin-dashboard__section--token">
		<h2 class="pwca-admin-dashboard__section-title">Token</h2>
		<div class="pwca-admin-dashboard__key-row">
			<input
				type="password"
				name="pw_secret_key"
				id="pwca-secret-key-input"
				class="regular-text"
				placeholder="Enter Secret Key"
				autocomplete="off"
			>
			<p class="pwca-admin-dashboard__field-hint" id="pwca-secret-key-hint" aria-live="polite">Please enter secret key (at least 8 characters)</p>
		</div>
		<div class="pwca-admin-dashboard__key-row">
			<input
				type="text"
				id="pwca-store-id-input"
				class="regular-text"
				placeholder="Store ID"
				value="<?php echo esc_attr( $current_store_id ); ?>"
				readonly
			>
		</div>
		<div class="pwca-admin-dashboard__token-row">
			<input
				type="text"
				name="pw_token"
				id="pwca-token-input"
				class="regular-text"
				placeholder="Token will be synced after Connect callback"
				value="<?php echo esc_attr( $current_token ); ?>"
				autocomplete="off"
				readonly
			>
			<button type="button" class="button" id="pwca-token-connect">Connect</button>
		</div>
		<div class="pwca-admin-dashboard__token-status" id="pwca-token-status" aria-live="polite"></div>
	</section>

	<section class="pwca-admin-dashboard__section pwca-admin-dashboard__section--api-mock">
		<h2 class="pwca-admin-dashboard__section-title">API Mock Mode</h2>
		<div class="pwca-admin-dashboard__row">
			<span class="pwca-admin-dashboard__label">Promowares API</span>
			<div class="pwca-admin-dashboard__toggle" id="pwca-api-mock-toggle" data-current="<?php echo $api_mock_mode ? '1' : '0'; ?>">
				<button type="button" class="button <?php echo $api_mock_mode ? 'button-secondary' : 'button-primary'; ?>" data-value="0">Real Data</button>
				<button type="button" class="button <?php echo $api_mock_mode ? 'button-primary' : 'button-secondary'; ?>" data-value="1">Mock Error</button>
			</div>
		</div>
		<p class="description">Switch between real Promowares API responses and mocked error responses for testing.</p>
		<div class="pwca-admin-dashboard__mock-status" id="pwca-api-mock-status" aria-live="polite"></div>
	</section>

	<section class="pwca-admin-dashboard__section pwca-admin-dashboard__section--currency">
		<h2 class="pwca-admin-dashboard__section-title">Currency</h2>
		<label class="pwca-admin-dashboard__field">
			<span class="pwca-admin-dashboard__label">Currency</span>
			<select name="pw_currency" id="pwca-currency" class="pwca-admin-dashboard__select">
				<option value="USD">USD</option>
				<option value="EUR">EUR</option>
				<option value="GBP">GBP</option>
				<option value="CNY">CNY</option>
				<option value="JPY">JPY</option>
			</select>
		</label>
	</section>

	<section class="pwca-admin-dashboard__section pwca-admin-dashboard__section--importer">
		<h2 class="pwca-admin-dashboard__section-title">Product Importer</h2>
		<form method="post" action="">
			<?php wp_nonce_field( 'pwca_sync_products', 'pwca_sync_products_nonce' ); ?>
			<button type="submit" name="pwca_sync_products" id="pwca-sync-products" class="button button-primary">
				Sync Products
			</button>
		</form>

		<div class="pwca-admin-dashboard__progress" id="pwca-import-progress">
			<div class="pwca-admin-dashboard__progress-bar" id="pwca-progress-bar"></div>
			<div class="pwca-admin-dashboard__progress-text" id="pwca-progress-text">0/0</div>
		</div>
	</section>

	<section class="pwca-admin-dashboard__section pwca-admin-dashboard__section--cache">
		<h2 class="pwca-admin-dashboard__section-title">Product Data Cache Management</h2>

		<div class="pwca-admin-dashboard__cache-status" id="pwca-cache-status">
			<p><strong>Total Cache:</strong><span id="pwca-cache-total">-</span></p>
			<p><strong>Expired Cache:</strong><span id="pwca-cache-expired">-</span></p>
			<p><strong>Last Updated:</strong><span id="pwca-cache-last-updated">-</span></p>
			<p><strong>Cache TTL:</strong><span id="pwca-cache-ttl">-</span></p>
		</div>

		<div class="pwca-admin-dashboard__cache-actions">
			<div class="pwca-admin-dashboard__row">
				<input
					type="text"
					id="pwca-cache-product-id"
					class="regular-text pwca-admin-dashboard__input"
					placeholder="Enter Product PW ID (leave empty to clear all cache)"
				/>
				<button type="button" class="button" id="pwca-clear-cache">Clear Cache</button>
				<button type="button" class="button" id="pwca-refresh-cache-status">Refresh Status</button>
			</div>
			<div class="pwca-admin-dashboard__row">
				<button type="button" class="button" id="pwca-test-cache">Cache Performance Test</button>
				<span class="pwca-admin-dashboard__cache-test-result" id="pwca-cache-test-result"></span>
			</div>
			<div class="pwca-admin-dashboard__result" id="pwca-cache-result" aria-live="polite"></div>
		</div>
	</section>
</div>

