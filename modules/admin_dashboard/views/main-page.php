<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$ajax_url           = isset( $view_model['ajax_url'] ) ? (string) $view_model['ajax_url'] : '';
$rest_product_base  = isset( $view_model['rest_product_base'] ) ? (string) $view_model['rest_product_base'] : '';
$save_token_nonce   = isset( $view_model['save_token_nonce'] ) ? (string) $view_model['save_token_nonce'] : '';
$clear_cache_nonce  = isset( $view_model['clear_cache_nonce'] ) ? (string) $view_model['clear_cache_nonce'] : '';
$cache_status_nonce = isset( $view_model['cache_status_nonce'] ) ? (string) $view_model['cache_status_nonce'] : '';
$current_token      = isset( $view_model['current_token'] ) ? (string) $view_model['current_token'] : '';
$messages           = isset( $view_model['messages'] ) && is_array( $view_model['messages'] ) ? $view_model['messages'] : array();

?>

<div
	class="wrap pwca-admin-dashboard"
	data-ajax-url="<?php echo esc_url( $ajax_url ); ?>"
	data-rest-product-base="<?php echo esc_url( $rest_product_base ); ?>"
	data-save-token-nonce="<?php echo esc_attr( $save_token_nonce ); ?>"
	data-clear-cache-nonce="<?php echo esc_attr( $clear_cache_nonce ); ?>"
	data-cache-status-nonce="<?php echo esc_attr( $cache_status_nonce ); ?>"
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
		<div class="pwca-admin-dashboard__token-row">
			<input
				type="text"
				name="pw_token"
				id="pwca-token-input"
				class="regular-text"
				placeholder="Enter API Token"
				value="<?php echo esc_attr( $current_token ); ?>"
				autocomplete="off"
			>
			<button type="button" class="button" id="pwca-token-connect">Connect</button>
		</div>
		<div class="pwca-admin-dashboard__token-status" id="pwca-token-status" aria-live="polite"></div>
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
		<h2 class="pwca-admin-dashboard__section-title">产品数据缓存管理</h2>

		<div class="pwca-admin-dashboard__cache-status" id="pwca-cache-status">
			<p><strong>总缓存数：</strong><span id="pwca-cache-total">-</span></p>
			<p><strong>过期缓存数：</strong><span id="pwca-cache-expired">-</span></p>
			<p><strong>最近更新时间：</strong><span id="pwca-cache-last-updated">-</span></p>
			<p><strong>缓存有效期：</strong><span id="pwca-cache-ttl">-</span></p>
		</div>

		<div class="pwca-admin-dashboard__cache-actions">
			<div class="pwca-admin-dashboard__row">
				<input
					type="text"
					id="pwca-cache-product-id"
					class="regular-text pwca-admin-dashboard__input"
					placeholder="输入产品 PW ID（留空则清除所有缓存）"
				/>
				<button type="button" class="button" id="pwca-clear-cache">清除缓存</button>
				<button type="button" class="button" id="pwca-refresh-cache-status">刷新状态</button>
			</div>
			<div class="pwca-admin-dashboard__row">
				<button type="button" class="button" id="pwca-test-cache">缓存性能测试</button>
				<span class="pwca-admin-dashboard__cache-test-result" id="pwca-cache-test-result"></span>
			</div>
			<div class="pwca-admin-dashboard__result" id="pwca-cache-result" aria-live="polite"></div>
		</div>
	</section>
</div>

