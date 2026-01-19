<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$product_request_nonce = isset( $view_model['product_request_nonce'] ) ? (string) $view_model['product_request_nonce'] : '';

?>

<section class="pwca-admin-dashboard__pane pwca-admin-dashboard__pane--product-request">
	<h2 class="pwca-admin-dashboard__pane-title">产品需求</h2>

	<div id="pwca-form-messages" class="pwca-admin-dashboard__form-messages" hidden></div>

	<div class="pwca-admin-dashboard__product-request">
		<p class="pwca-admin-dashboard__product-request-intro">我们对新产品充满热情，并珍视您提供的每一条建议。如果您发现了有趣的产品，请告诉我们！</p>

		<form method="post" action="" enctype="multipart/form-data" id="pwca-product-request-form">
			<input type="hidden" name="nonce" value="<?php echo esc_attr( $product_request_nonce ); ?>">

			<p class="pwca-admin-dashboard__product-request-instruction">只需填写任意一个字段</p>

			<div class="pwca-admin-dashboard__form-field">
				<label for="pwca-product-description">描述</label>
				<textarea id="pwca-product-description" name="pw_product_description" rows="4"></textarea>
			</div>

			<div class="pwca-admin-dashboard__form-field">
				<label for="pwca-product-link">产品链接</label>
				<input type="url" id="pwca-product-link" name="pw_product_link">
			</div>

			<div class="pwca-admin-dashboard__form-field">
				<label for="pwca-product-image">图片</label>
				<div class="pwca-admin-dashboard__image-upload">
					<input type="file" id="pwca-product-image" name="pw_product_image" accept="image/*">
					<div class="pwca-admin-dashboard__image-preview" id="pwca-image-preview"></div>
				</div>
			</div>

			<div class="pwca-admin-dashboard__form-submit">
				<button type="submit" class="button button-primary" id="pwca-product-request-submit">Submit</button>
			</div>
		</form>
	</div>
</section>

