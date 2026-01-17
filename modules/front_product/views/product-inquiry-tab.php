<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$status_messages = array(
	'success'     => array( 'class' => 'pwca-woocommerce-message', 'text' => __( 'Your inquiry has been sent successfully!', 'pw-admin' ) ),
	'error'       => array( 'class' => 'pwca-woocommerce-error', 'text' => __( 'There was an error sending your inquiry. Please try again.', 'pw-admin' ) ),
	'mail_failed' => array( 'class' => 'pwca-woocommerce-info', 'text' => __( 'Your inquiry has been saved but email notification failed.', 'pw-admin' ) ),
);

$status_config = isset( $status_messages[ $status ] ) ? $status_messages[ $status ] : null;

?>
<div class="pwca-product-inquiry">
	<h2><?php echo esc_html( sprintf( __( 'Inquire about %s', 'pw-admin' ), $product_title ) ); ?></h2>

	<?php if ( $status_config ) : ?>
		<div class="<?php echo esc_attr( $status_config['class'] ); ?>" role="alert">
			<?php echo esc_html( $status_config['text'] ); ?>
		</div>
	<?php endif; ?>

	<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post" class="pwca-product-inquiry__form">
		<?php wp_nonce_field( 'product_inquiry_action', 'product_inquiry_nonce' ); ?>
		<input type="hidden" name="action" value="handle_product_inquiry">
		<input type="hidden" name="product_id" value="<?php echo esc_attr( $product_id ); ?>">
		<input type="hidden" name="product_title" value="<?php echo esc_attr( $product_title ); ?>">

		<div class="pwca-product-inquiry__row">
			<label for="pwca_inquiry_first_name"><?php echo esc_html__( 'First Name', 'pw-admin' ); ?> <span class="pwca-product-inquiry__required">*</span></label>
			<input type="text" name="inquiry_first_name" id="pwca_inquiry_first_name" required>
		</div>

		<div class="pwca-product-inquiry__row">
			<label for="pwca_inquiry_last_name"><?php echo esc_html__( 'Last Name', 'pw-admin' ); ?> <span class="pwca-product-inquiry__required">*</span></label>
			<input type="text" name="inquiry_last_name" id="pwca_inquiry_last_name" required>
		</div>

		<div class="pwca-product-inquiry__row">
			<label for="pwca_inquiry_email"><?php echo esc_html__( 'Email', 'pw-admin' ); ?> <span class="pwca-product-inquiry__required">*</span></label>
			<input type="email" name="inquiry_email" id="pwca_inquiry_email" required>
		</div>

		<div class="pwca-product-inquiry__row">
			<label for="pwca_inquiry_phone"><?php echo esc_html__( 'Tel', 'pw-admin' ); ?></label>
			<input type="tel" name="inquiry_phone" id="pwca_inquiry_phone">
		</div>

		<div class="pwca-product-inquiry__row pwca-product-inquiry__row--textarea">
			<label for="pwca_inquiry_message"><?php echo esc_html__( 'Message', 'pw-admin' ); ?> <span class="pwca-product-inquiry__required">*</span></label>
			<textarea name="inquiry_message" id="pwca_inquiry_message" required></textarea>
		</div>

		<div class="pwca-product-inquiry__actions">
			<input type="submit" name="submit_inquiry" value="<?php echo esc_attr__( 'Submit', 'pw-admin' ); ?>" class="pwca-product-inquiry__submit">
		</div>
	</form>
</div>

