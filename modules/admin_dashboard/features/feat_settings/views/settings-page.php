<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$ajax_url              = isset( $view_model['ajax_url'] ) ? (string) $view_model['ajax_url'] : '';
$admin_page_url        = isset( $view_model['admin_page_url'] ) ? (string) $view_model['admin_page_url'] : '';
$store_url             = isset( $view_model['store_url'] ) ? (string) $view_model['store_url'] : '';
$rest_product_base     = isset( $view_model['rest_product_base'] ) ? (string) $view_model['rest_product_base'] : '';
$save_token_nonce      = isset( $view_model['save_token_nonce'] ) ? (string) $view_model['save_token_nonce'] : '';
$clear_cache_nonce     = isset( $view_model['clear_cache_nonce'] ) ? (string) $view_model['clear_cache_nonce'] : '';
$cache_status_nonce    = isset( $view_model['cache_status_nonce'] ) ? (string) $view_model['cache_status_nonce'] : '';
$product_request_nonce = isset( $view_model['product_request_nonce'] ) ? (string) $view_model['product_request_nonce'] : '';

// 获取当前 tab
$current_tab = isset( $_GET['tab'] ) ? sanitize_text_field( wp_unslash( $_GET['tab'] ) ) : 'dashboard';
$tabs = array(
	'dashboard'       => 'Dashboard',
	'settings'        => 'Settings',
	'status'          => 'Status',
	'product_request' => 'Product Requirement',
	'support'         => 'Support',
);
if ( ! isset( $tabs[ $current_tab ] ) ) {
	$current_tab = 'dashboard';
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
	data-product-request-nonce="<?php echo esc_attr( $product_request_nonce ); ?>"
>
	<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>

	<nav class="nav-tab-wrapper wp-clearfix pwca-admin-dashboard__tabs" aria-label="Promoware Tabs">
		<?php foreach ( $tabs as $tab_key => $tab_label ) : ?>
			<?php
			$is_active = ( (string) $tab_key === $current_tab );
			$class     = $is_active ? 'nav-tab nav-tab-active' : 'nav-tab';
			$url       = add_query_arg(
				array(
					'page' => 'pw-dashboard-settings',
					'tab'  => (string) $tab_key,
				),
				admin_url( 'admin.php' )
			);
			?>
			<a href="<?php echo esc_url( $url ); ?>" class="<?php echo esc_attr( $class ); ?>">
				<?php echo esc_html( (string) $tab_label ); ?>
			</a>
		<?php endforeach; ?>
	</nav>

	<div class="pwca-admin-dashboard__tab-content">
		<?php
		// 使用主模块的 render_current_tab 方法渲染当前 tab
		if ( class_exists( 'Pwca_Admin_Dashboard' ) ) {
			Pwca_Admin_Dashboard::render_current_tab( $current_tab );
		}
		?>
	</div>
</div>
