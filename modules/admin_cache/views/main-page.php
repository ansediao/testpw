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
		<h2 class="pwca-admin-cache__section-title">产品数据缓存管理</h2>

		<div class="pwca-admin-cache__cache-status">
			<h3 class="pwca-admin-cache__sub-title">缓存状态</h3>
			<div class="pwca-admin-cache__cache-info" id="pwca-cache-info">
				<p><strong>总缓存数量:</strong> <span id="pwca-total-cached">加载中...</span></p>
				<p><strong>过期缓存数量:</strong> <span id="pwca-expired-count">加载中...</span></p>
				<p><strong>最近更新时间:</strong> <span id="pwca-latest-cache-time">加载中...</span></p>
				<p><strong>缓存有效期:</strong> <span id="pwca-cache-expiry">30分钟</span></p>
			</div>
			<button type="button" id="pwca-refresh-cache-status" class="button">刷新状态</button>
		</div>

		<div class="pwca-admin-cache__cache-actions">
			<h3 class="pwca-admin-cache__sub-title">缓存操作</h3>

			<div class="pwca-admin-cache__row">
				<input type="number" id="pwca-specific-product-id" placeholder="输入产品ID (可选)" class="pwca-admin-cache__input">
				<button type="button" id="pwca-clear-specific-cache" class="button">清除指定产品缓存</button>
			</div>

			<div class="pwca-admin-cache__row">
				<button type="button" id="pwca-clear-all-cache" class="button button-secondary">清除所有缓存</button>
			</div>

			<div class="pwca-admin-cache__row">
				<input type="number" id="pwca-test-product-id" placeholder="输入产品ID进行测试" class="pwca-admin-cache__input">
				<button type="button" id="pwca-test-cache" class="button">测试缓存功能</button>
			</div>

			<div class="pwca-admin-cache__result" id="pwca-cache-operation-result"></div>
		</div>
	</section>
</div>