<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$all_statuses = array();
if ( function_exists( 'wc_get_order_statuses' ) ) {
	$all_statuses = array_keys( wc_get_order_statuses() );
}

$today_date  = function_exists( 'current_time' ) ? current_time( 'Y-m-d' ) : gmdate( 'Y-m-d' );
$today_start = $today_date . ' 00:00:00';
$today_end   = $today_date . ' 23:59:59';

$todays_total = 0;
$todays_gross = 0.0;

if ( function_exists( 'wc_get_orders' ) && ! empty( $all_statuses ) ) {
	$todays_orders = wc_get_orders(
		array(
			'status'       => $all_statuses,
			'limit'        => -1,
			'date_created' => $today_start . '...' . $today_end,
		)
	);

	if ( ! empty( $todays_orders ) ) {
		$todays_total = count( $todays_orders );
		foreach ( $todays_orders as $order ) {
			if ( $order instanceof WC_Order ) {
				$todays_gross += (float) $order->get_total();
			}
		}
	}
}

$end_date   = $today_end;
$start_date = ( function_exists( 'current_time' ) ? current_time( 'Y-m-d', strtotime( '-6 days' ) ) : gmdate( 'Y-m-d', strtotime( '-6 days' ) ) ) . ' 00:00:00';

$last7_total = 0;
$last7_gross = 0.0;

if ( function_exists( 'wc_get_orders' ) && ! empty( $all_statuses ) ) {
	$last7_orders = wc_get_orders(
		array(
			'status'       => $all_statuses,
			'limit'        => -1,
			'date_created' => $start_date . '...' . $end_date,
		)
	);

	if ( ! empty( $last7_orders ) ) {
		$last7_total = count( $last7_orders );
		foreach ( $last7_orders as $order ) {
			if ( $order instanceof WC_Order ) {
				$last7_gross += (float) $order->get_total();
			}
		}
	}
}

$total_orders_count = 0;
if ( function_exists( 'wc_get_orders' ) && ! empty( $all_statuses ) ) {
	$order_ids = wc_get_orders(
		array(
			'status' => $all_statuses,
			'limit'  => -1,
			'return' => 'ids',
		)
	);
	$total_orders_count = is_array( $order_ids ) ? count( $order_ids ) : 0;
}

?>

<section class="pwca-admin-dashboard__pane pwca-admin-dashboard__pane--dashboard">
	<h2 class="pwca-admin-dashboard__pane-title">Dashboard</h2>

	<div class="pwca-admin-dashboard__stats">
		<div class="pwca-admin-dashboard__stat-card">
			<div class="pwca-admin-dashboard__stat-value">
				<?php echo function_exists( 'wc_price' ) ? wp_kses_post( wc_price( $todays_gross ) ) : esc_html( (string) $todays_gross ); ?>
			</div>
			<div class="pwca-admin-dashboard__stat-label"><?php echo esc_html( (string) $todays_total ); ?> ORDERS today</div>
			<div class="pwca-admin-dashboard__stat-icon dashicons dashicons-chart-bar" aria-hidden="true"></div>
		</div>

		<div class="pwca-admin-dashboard__stat-card">
			<div class="pwca-admin-dashboard__stat-value">
				<?php echo function_exists( 'wc_price' ) ? wp_kses_post( wc_price( $last7_gross ) ) : esc_html( (string) $last7_gross ); ?>
			</div>
			<div class="pwca-admin-dashboard__stat-label"><?php echo esc_html( (string) $last7_total ); ?> ORDERS last 7 days</div>
			<div class="pwca-admin-dashboard__stat-icon dashicons dashicons-calendar-alt" aria-hidden="true"></div>
		</div>

		<div class="pwca-admin-dashboard__stat-card">
			<div class="pwca-admin-dashboard__stat-value"><?php echo esc_html( (string) $total_orders_count ); ?></div>
			<div class="pwca-admin-dashboard__stat-label">TOTAL ORDERS</div>
			<div class="pwca-admin-dashboard__stat-icon dashicons dashicons-archive" aria-hidden="true"></div>
		</div>
	</div>

	<div class="pwca-admin-dashboard__nav">
		<a class="pwca-admin-dashboard__nav-item" href="<?php echo esc_url( add_query_arg( array( 'page' => 'pw-dashboard-settings', 'tab' => 'settings' ), admin_url( 'admin.php' ) ) ); ?>">
			<span class="dashicons dashicons-admin-generic" aria-hidden="true"></span>
			<span class="pwca-admin-dashboard__nav-label">Settings</span>
		</a>
		<a class="pwca-admin-dashboard__nav-item" href="<?php echo esc_url( add_query_arg( array( 'page' => 'pw-dashboard-settings', 'tab' => 'status' ), admin_url( 'admin.php' ) ) ); ?>">
			<span class="dashicons dashicons-yes-alt" aria-hidden="true"></span>
			<span class="pwca-admin-dashboard__nav-label">Status</span>
		</a>
		<a class="pwca-admin-dashboard__nav-item" href="<?php echo esc_url( add_query_arg( array( 'page' => 'pw-dashboard-settings', 'tab' => 'product_request' ), admin_url( 'admin.php' ) ) ); ?>">
			<span class="dashicons dashicons-feedback" aria-hidden="true"></span>
			<span class="pwca-admin-dashboard__nav-label">Product Requirement</span>
		</a>
		<a class="pwca-admin-dashboard__nav-item" href="<?php echo esc_url( add_query_arg( array( 'page' => 'pw-dashboard-settings', 'tab' => 'support' ), admin_url( 'admin.php' ) ) ); ?>">
			<span class="dashicons dashicons-sos" aria-hidden="true"></span>
			<span class="pwca-admin-dashboard__nav-label">Support</span>
		</a>
	</div>
</section>

