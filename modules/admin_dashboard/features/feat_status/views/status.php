<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// 从 Status 子模块获取数据
$status_data = array();
if ( class_exists( 'Pwca_Admin_Dashboard_Status' ) ) {
	$status_data = Pwca_Admin_Dashboard_Status::get_status_data();
}

$woo_installed = class_exists( 'WooCommerce' );
if ( ! $woo_installed ) {
	$active_plugins = apply_filters( 'active_plugins', get_option( 'active_plugins', array() ) );
	$woo_installed  = in_array( 'woocommerce/woocommerce.php', (array) $active_plugins, true );
}

$woo_version     = $woo_installed && function_exists( 'WC' ) ? WC()->version : '';
$woo_min_version = '7.0.0';
$woo_version_ok  = $woo_version ? version_compare( $woo_version, $woo_min_version, '>=' ) : false;

global $wp_version;
$wp_min_version = '6.0';
$wp_version_ok  = version_compare( (string) $wp_version, $wp_min_version, '>=' );

$php_version     = phpversion();
$php_min_version = '7.4';
$php_version_ok  = version_compare( (string) $php_version, $php_min_version, '>=' );

$smtp_configured = false;
if ( class_exists( 'PHPMailer\\PHPMailer\\PHPMailer' ) ) {
	$phpmailer = new PHPMailer\PHPMailer\PHPMailer();
	do_action_ref_array( 'phpmailer_init', array( &$phpmailer ) );
	$smtp_configured = $phpmailer->isSMTP() && ! empty( $phpmailer->Host );
}

?>

<section class="pwca-admin-dashboard__pane pwca-admin-dashboard__pane--status">
	<h2 class="pwca-admin-dashboard__pane-title">状态检查</h2>

	<table class="pwca-admin-dashboard__status-table">
		<thead>
			<tr>
				<th>检查项</th>
				<th>描述</th>
				<th>状态</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>WooCommerce 安装</td>
				<td>检查 WooCommerce 是否已安装并激活</td>
				<td class="<?php echo esc_attr( $woo_installed ? 'pwca-status--ok' : 'pwca-status--fail' ); ?>">
					<?php echo esc_html( $woo_installed ? 'OK' : '未安装' ); ?>
				</td>
			</tr>

			<?php if ( $woo_installed ) : ?>
				<tr>
					<td>WooCommerce 版本</td>
					<td>当前版本: <?php echo esc_html( (string) $woo_version ); ?> (最低要求: <?php echo esc_html( $woo_min_version ); ?>)</td>
					<td class="<?php echo esc_attr( $woo_version_ok ? 'pwca-status--ok' : 'pwca-status--fail' ); ?>">
						<?php echo esc_html( $woo_version_ok ? 'OK' : '需要更新' ); ?>
					</td>
				</tr>
			<?php endif; ?>

			<tr>
				<td>WordPress 版本</td>
				<td>当前版本: <?php echo esc_html( (string) $wp_version ); ?> (最低要求: <?php echo esc_html( $wp_min_version ); ?>)</td>
				<td class="<?php echo esc_attr( $wp_version_ok ? 'pwca-status--ok' : 'pwca-status--fail' ); ?>">
					<?php echo esc_html( $wp_version_ok ? 'OK' : '需要更新' ); ?>
				</td>
			</tr>

			<tr>
				<td>PHP 版本</td>
				<td>当前版本: <?php echo esc_html( (string) $php_version ); ?> (最低要求: <?php echo esc_html( $php_min_version ); ?>)</td>
				<td class="<?php echo esc_attr( $php_version_ok ? 'pwca-status--ok' : 'pwca-status--fail' ); ?>">
					<?php echo esc_html( $php_version_ok ? 'OK' : '需要更新' ); ?>
				</td>
			</tr>

			<tr>
				<td>SMTP 配置</td>
				<td>检查是否已配置SMTP</td>
				<td class="<?php echo esc_attr( $smtp_configured ? 'pwca-status--ok' : 'pwca-status--fail' ); ?>">
					<?php echo esc_html( $smtp_configured ? 'OK' : '未配置' ); ?>
				</td>
			</tr>
		</tbody>
	</table>
</section>

