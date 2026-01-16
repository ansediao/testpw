(function ($) {
	'use strict';

	const getConfig = () => {
		if (typeof pwca_cart_ajax === 'undefined') {
			return null;
		}
		return pwca_cart_ajax;
	};

	const setUpdating = ($controls, updating) => {
		$controls.toggleClass('pwca-updating', updating);
		$controls.find('.pwca-qty-btn').prop('disabled', updating);
	};

	const updateMinusDisabled = ($controls) => {
		const $input = $controls.find('.quantity-input').first();
		const min = parseInt($input.data('min'), 10);
		const value = parseInt($input.val(), 10);
		$controls.find('.pwca-qty-btn.minus').prop('disabled', Number.isFinite(value) && Number.isFinite(min) ? value <= min : false);
	};

	const showTooltip = ($controls, text) => {
		const $tooltip = $controls.find('.pwca-quantity-tooltip').first();
		$tooltip.find('.tooltip-text').text(text);
		$tooltip.addClass('show');
	};

	const hideTooltip = ($controls) => {
		$controls.find('.pwca-quantity-tooltip').removeClass('show');
	};

	const applyFragments = (fragments) => {
		if (!fragments || typeof fragments !== 'object') {
			return;
		}

		Object.keys(fragments).forEach((selector) => {
			const html = fragments[selector];
			if (typeof html !== 'string') {
				return;
			}
			const $target = $(selector);
			if ($target.length === 0) {
				return;
			}
			$target.replaceWith(html);
		});
	};

	const requestUpdate = async (cartKey, quantity, config) => {
		const response = await $.ajax({
			url: config.ajax_url,
			type: 'POST',
			dataType: 'json',
			data: {
				action: 'pwca_update_cart_quantity',
				nonce: config.nonce,
				cart_key: cartKey,
				quantity,
			},
		});
		return response;
	};

	const queue = new Map();

	const enqueueUpdate = ($controls, quantity, config) => {
		const cartKey = String($controls.data('cart-key') || '');
		if (!cartKey) {
			return;
		}

		queue.set(cartKey, { $controls, quantity });

		if (queue.get(cartKey).timer) {
			clearTimeout(queue.get(cartKey).timer);
		}

		const timer = setTimeout(async () => {
			const item = queue.get(cartKey);
			if (!item) {
				return;
			}
			queue.delete(cartKey);

			setUpdating(item.$controls, true);
			try {
				const result = await requestUpdate(cartKey, item.quantity, config);
				if (result && result.success) {
					applyFragments(result.data.fragments);
					$(document.body).trigger('pwca_cart_quantity_updated');
					return;
				}
				const message = result && result.data && result.data.message ? result.data.message : (config.messages?.error || '更新失败');
				showTooltip(item.$controls, message);
			} catch (e) {
				showTooltip(item.$controls, config.messages?.error || '更新失败');
			} finally {
				setUpdating(item.$controls, false);
				updateMinusDisabled(item.$controls);
			}
		}, 400);

		queue.set(cartKey, { $controls, quantity, timer });
	};

	const handleButtonClick = (e, config) => {
		const $button = $(e.currentTarget);
		const $controls = $button.closest('.pwca-quantity-controls');
		const $input = $controls.find('.quantity-input').first();

		const step = parseInt($input.data('step'), 10);
		const min = parseInt($input.data('min'), 10);
		const current = parseInt($input.val(), 10);

		if (!Number.isFinite(step) || !Number.isFinite(min) || !Number.isFinite(current)) {
			return;
		}

		const isPlus = $button.hasClass('plus');
		const next = isPlus ? current + step : Math.max(current - step, min);

		$input.val(next);
		hideTooltip($controls);
		updateMinusDisabled($controls);
		enqueueUpdate($controls, next, config);
	};

	const handleInputChange = (e, config) => {
		const $input = $(e.currentTarget);
		const $controls = $input.closest('.pwca-quantity-controls');
		const min = parseInt($input.data('min'), 10);
		const step = parseInt($input.data('step'), 10);
		const value = parseInt($input.val(), 10);

		if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(step)) {
			return;
		}

		if (value < min) {
			showTooltip($controls, `${config.messages?.min_quantity || '数量不能少于最小值'}：${min}`);
			return;
		}

		hideTooltip($controls);
		updateMinusDisabled($controls);
		enqueueUpdate($controls, value, config);
	};

	$(() => {
		const config = getConfig();
		if (!config) {
			return;
		}

		$(document).on('click', '.pwca-quantity-controls .pwca-qty-btn', (e) => {
			e.preventDefault();
			handleButtonClick(e, config);
		});

		$(document).on('change', '.pwca-quantity-controls .quantity-input', (e) => {
			handleInputChange(e, config);
		});

		$('.pwca-quantity-controls').each((_, el) => updateMinusDisabled($(el)));
	});
})(jQuery);

