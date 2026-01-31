<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$settings = isset( $view_model['settings'] ) && is_array( $view_model['settings'] ) ? $view_model['settings'] : array();

$messages = isset( $settings['messages'] ) && is_array( $settings['messages'] ) ? $settings['messages'] : array();

$disable_ssl     = isset( $settings['disable_ssl'] ) ? (int) $settings['disable_ssl'] : (int) get_option( 'pw_disable_ssl', 0 );
$api_key         = isset( $settings['api_key'] ) ? (string) $settings['api_key'] : (string) get_option( 'pw_api_key', '' );
$api_secret      = isset( $settings['api_secret'] ) ? (string) $settings['api_secret'] : (string) get_option( 'pw_api_secret', '' );
$customize_text  = isset( $settings['customize_text'] ) ? (string) $settings['customize_text'] : (string) get_option( 'pw_customize_text', 'Customize' );
$customize_color = isset( $settings['customize_color'] ) ? (string) $settings['customize_color'] : (string) get_option( 'pw_customize_color', '#000000' );

?>

<section class="pwca-admin-dashboard__pane pwca-admin-dashboard__pane--settings">
	<h2 class="pwca-admin-dashboard__pane-title">Settings</h2>

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

	<form method="post" action="">
		<input type="hidden" name="pwca_settings_nonce" value="<?php echo esc_attr( wp_create_nonce( 'pwca_settings' ) ); ?>">

		<table class="form-table">
			<tr>
				<th scope="row">Reconnect your store</th>
				<td>
					<button type="button" class="button" id="pwca-reconnect-button">Reconnect</button>
				</td>
			</tr>
			<tr>
				<th scope="row"><h3>Integration settings</h3></th>
				<td></td>
			</tr>
			<tr>
				<th scope="row">Disable SSL</th>
				<td>
					<label>
						<input type="checkbox" name="pw_disable_ssl" value="1" <?php checked( 1, $disable_ssl ); ?>>
						Use HTTP instead of HTTPS to connect to our API (may be required if the plugin does not work for some hosting configurations)
					</label>
				</td>
			</tr>
		</table>

		<table class="form-table">
			<tr>
				<th scope="row">Inquiry Form</th>
				<td>
					<input type="text" name="pw_api_key" value="<?php echo esc_attr( $api_key ); ?>" placeholder="API integration info" class="regular-text">
				</td>
			</tr>
			<tr>
				<th scope="row"></th>
				<td>
					<input type="text" name="pw_api_secret" value="<?php echo esc_attr( $api_secret ); ?>" placeholder="API integration info" class="regular-text">
				</td>
			</tr>
		</table>

		<h3>Product personalization settings</h3>
		<table class="form-table">
			<tr>
				<th scope="row">Customization button text</th>
				<td>
					<input type="text" name="pw_customize_text" value="<?php echo esc_attr( $customize_text ); ?>" class="regular-text">
				</td>
			</tr>
			<tr>
				<th scope="row">Customization button color</th>
				<td>
					<input type="color" name="pw_customize_color" value="<?php echo esc_attr( $customize_color ); ?>" class="pwca-color-picker">
				</td>
			</tr>
		</table>

		<h3>Promoware Shipping</h3>
		<table class="form-table">
			<tr>
				<td>
					<label>
						<input type="checkbox" name="pw_enable_tool_mode_shipping" value="1">
						Use Promoware Live Rate Shipping
					</label>
				</td>
			</tr>
			<tr>
				<td>
					<label>
						<input type="checkbox" name="pw_disable_standard_rates" value="1">
						Disable standard Woocommerce rates for products fulfilled by PromoWares
					</label>
				</td>
			</tr>
		</table>

		<p class="submit">
			<button type="submit" name="pwca_save_settings" class="button button-primary">Save settings</button>
		</p>
	</form>
</section>

