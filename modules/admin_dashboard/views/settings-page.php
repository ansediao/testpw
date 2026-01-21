<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$ajax_url              = isset( $view_model['ajax_url'] ) ? (string) $view_model['ajax_url'] : '';
$rest_product_base     = isset( $view_model['rest_product_base'] ) ? (string) $view_model['rest_product_base'] : '';
$save_token_nonce      = isset( $view_model['save_token_nonce'] ) ? (string) $view_model['save_token_nonce'] : '';
$clear_cache_nonce     = isset( $view_model['clear_cache_nonce'] ) ? (string) $view_model['clear_cache_nonce'] : '';
$cache_status_nonce    = isset( $view_model['cache_status_nonce'] ) ? (string) $view_model['cache_status_nonce'] : '';
$product_request_nonce = isset( $view_model['product_request_nonce'] ) ? (string) $view_model['product_request_nonce'] : '';
$current_tab           = isset( $view_model['current_tab'] ) ? (string) $view_model['current_tab'] : 'dashboard';
$tabs                  = isset( $view_model['tabs'] ) && is_array( $view_model['tabs'] ) ? $view_model['tabs'] : array();

?>

<div
	class="wrap pwca-admin-dashboard"
	data-ajax-url="<?php echo esc_url( $ajax_url ); ?>"
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
		$tab_path = __DIR__ . DIRECTORY_SEPARATOR . 'tabs' . DIRECTORY_SEPARATOR . $current_tab . '.php';
		if ( file_exists( $tab_path ) ) {
			require $tab_path;
		}
		?>
	</div>
</div>

