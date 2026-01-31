<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div id="pwca-design-modal" class="pwca-modal" role="dialog" aria-labelledby="pwca-modal-title" aria-hidden="true">
	<div class="pwca-modal-overlay" data-pwca-modal-close aria-hidden="true"></div>
	<div class="pwca-modal-container">
		<div class="pwca-modal-header">
			<h3 id="pwca-modal-title" class="pwca-modal-title"><?php echo esc_html__( 'Design Preview', 'pw-admin' ); ?></h3>
			<button type="button" class="pwca-modal-close" data-pwca-modal-close aria-label="<?php echo esc_attr__( 'Close modal', 'pw-admin' ); ?>">
				<span aria-hidden="true">&times;</span>
			</button>
		</div>
		<div class="pwca-modal-body">
			<div class="pwca-modal-loading" data-pwca-modal-loading>
				<div class="pwca-spinner"></div>
				<p><?php echo esc_html__( 'Loading...', 'pw-admin' ); ?></p>
			</div>
			<div class="pwca-modal-content" data-pwca-modal-content>
				<iframe id="pwca-modal-iframe" src="" frameborder="0" allowfullscreen></iframe>
				<div class="pwca-image-preview-container" data-pwca-modal-image hidden>
					<img src="" alt="" class="pwca-preview-image" />
				</div>
			</div>
			<div class="pwca-modal-error" data-pwca-modal-error hidden>
				<p><?php echo esc_html__( 'Failed to load, please try again', 'pw-admin' ); ?></p>
				<button type="button" class="pwca-retry-btn"><?php echo esc_html__( 'Retry', 'pw-admin' ); ?></button>
			</div>
		</div>
		<div class="pwca-modal-footer">
			<button type="button" class="pwca-btn pwca-btn-secondary" data-pwca-modal-close><?php echo esc_html__( 'Close', 'pw-admin' ); ?></button>
			<a href="#" target="_blank" rel="noopener noreferrer" class="pwca-btn pwca-btn-primary" id="pwca-open-editor"><?php echo esc_html__( 'Edit in new window', 'pw-admin' ); ?></a>
		</div>
	</div>
</div>

