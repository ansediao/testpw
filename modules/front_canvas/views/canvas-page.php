<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>
		<?php
		echo esc_html__( '在线定制', 'pw-admin' );
		if ( $product_name !== '' ) {
			echo ' - ' . esc_html( $product_name );
		}
		?>
	</title>
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'wpcanvas' ); ?>>
	<div
		id="app"
		class="container"
		data-product-id="<?php echo esc_attr( $product_id ); ?>"
		data-pw-id="<?php echo esc_attr( $pw_id ); ?>"
		data-edit-mode="<?php echo esc_attr( $is_edit_mode ? '1' : '0' ); ?>"
		data-ajax-url="<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>"
		data-cart-url="<?php echo esc_url( function_exists( 'wc_get_cart_url' ) ? wc_get_cart_url() : '' ); ?>"
		data-ajax-nonce="<?php echo esc_attr( wp_create_nonce( 'custom-product-nonce' ) ); ?>"
		data-rest-url="<?php echo esc_url( rest_url() ); ?>"
		data-rest-nonce="<?php echo esc_attr( wp_create_nonce( 'wp_rest' ) ); ?>"
		data-blank-item="<?php echo esc_attr( $show_sample ? '1' : '0' ); ?>"
		data-inquiry-button="<?php echo esc_attr( $show_inquiry ? '1' : '0' ); ?>"
	>
		<header class="header">
			<?php
			$header_view = $module_path . '/views/partials/canvas-header.php';
			if ( is_readable( $header_view ) ) {
				include $header_view;
			}
			?>
		</header>
		<div class="customization-area">
			<?php
			$customization_view = $module_path . '/views/partials/canvas-customization-area.php';
			if ( is_readable( $customization_view ) ) {
				include $customization_view;
			}
			?>
		</div>
		<main class="main-content">
			<div class="operation-panel">
				<?php
				$panel_view = $module_path . '/views/partials/canvas-operation-panel.php';
				if ( is_readable( $panel_view ) ) {
					include $panel_view;
				}
				?>
			</div>

			<div class="canvas-area">
				<div class="dongtai-area">
					<?php
					$dongtai_view = $module_path . '/views/partials/canvas-dongtai-area.php';
					if ( is_readable( $dongtai_view ) ) {
						include $dongtai_view;
					}
					?>
				</div>

				<div class="canvas-box">
					<div class="design_area">
						<?php
						$design_view = $module_path . '/views/partials/canvas-design_area.php';
						if ( is_readable( $design_view ) ) {
							include $design_view;
						}
						?>
					</div>
				</div>
			</div>
		</main>
		<footer class="footer" id="footer">
			<div class="product-card" id="product-card-footer"></div>
			<div class="zoom-control">
				<label for="zoomSlider">Scale: <span id="zoomValue">100%</span></label>
				<input type="range" id="zoomSlider" min="50" max="200" value="100">
			</div>
			<?php
			$pw_4_grid = get_post_meta( $product_id, 'pw_4-grid', true );
			?>
			<?php if ( ! empty( $pw_4_grid ) ) : ?>
				<div class="arc-control">
					<label for="arcSlider">Arc: <span id="arcValue">0</span></label>
					<input type="range" id="arcSlider" min="-200" max="200" value="0">
				</div>
			<?php endif; ?>
			<div class="product-card-btn">
				<button id="addToCartBtn" class="product-card__add-to-cart">
					<?php echo esc_html( $is_edit_mode ? __( 'Update', 'pw-admin' ) : __( 'Add to Cart', 'pw-admin' ) ); ?>
				</button>
			</div>
		</footer>
		<?php
		$templates_view = $module_path . '/views/partials/canvas-templates.php';
		if ( is_readable( $templates_view ) ) {
			include $templates_view;
		}
		?>
	</div>
	<?php wp_footer(); ?>
</body>
</html>
