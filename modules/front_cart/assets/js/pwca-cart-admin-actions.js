(function ($) {
	'use strict';

	const getConfig = () => {
		if (typeof pwca_cart_admin_actions === 'undefined') {
			return null;
		}
		return pwca_cart_admin_actions;
	};

	const setMessage = ($container, message, type) => {
		const $msg = $container.find('.pwca-cart-admin-message').first();
		$msg.removeClass('is-success is-error').addClass(type === 'success' ? 'is-success' : 'is-error');
		$msg.text(message);
	};

	const clearMessage = ($container) => {
		const $msg = $container.find('.pwca-cart-admin-message').first();
		$msg.text('').removeClass('is-success is-error');
	};

	const requestDuplicate = async (cartKey, config) => {
		const result = await $.ajax({
			url: config.ajax_url,
			type: 'POST',
			dataType: 'json',
			data: {
				action: 'pw_duplicate_cart_item',
				cart_key: cartKey,
				nonce: config.nonce,
			},
		});
		return result;
	};

	const bind = (config) => {
		$(document).on('click', '.pwca-cart-admin-actions .pwca-cart-duplicate', async (e) => {
			e.preventDefault();
			const $button = $(e.currentTarget);
			const $container = $button.closest('.pwca-cart-admin-actions');
			const cartKey = String($button.data('cart-key') || $container.data('cart-key') || '');
			if (!cartKey) {
				return;
			}

			if ($button.prop('disabled') || $button.hasClass('is-loading')) {
				return;
			}

			clearMessage($container);
			const originalText = $button.text();
			$button.addClass('is-loading').prop('disabled', true).text(config.messages?.duplicating || '复制中…');

			try {
				const response = await requestDuplicate(cartKey, config);
				if (response && response.success && response.data && response.data.new_cart_key) {
					setMessage($container, config.messages?.duplicated || '已复制。', 'success');
					setTimeout(() => window.location.reload(), 300);
					return;
				}

				const text = response && response.data ? String(response.data) : '';
				setMessage($container, text || config.messages?.duplicate_failed || 'Duplicate failed', 'error');
			} catch (err) {
				setMessage($container, config.messages?.request_failed || 'Request failed', 'error');
			} finally {
				$button.removeClass('is-loading').prop('disabled', false).text(originalText);
			}
		});

		$(document).on('click', '.pwca-cart-admin-actions .pwca-cart-edit', (e) => {
			const confirmed = window.confirm(config.messages?.confirm_edit || 'Open in new tab?');
			if (!confirmed) {
				e.preventDefault();
			}
		});
	};

	$(() => {
		const config = getConfig();
		if (!config) {
			return;
		}
		bind(config);
	});
})(jQuery);

