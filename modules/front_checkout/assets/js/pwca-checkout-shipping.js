(function ($) {
	const settings = window.pwcaCheckoutShipping || {};
	const state = {
		selectedService: settings.selectedService || '',
		selectedCost: typeof settings.selectedCost === 'number' ? settings.selectedCost : null
	};

	const selectors = {
		calculateButton: '#pwca-calculate-shipping',
		shippingOptions: '#pwca-shipping-options',
		placeOrderButton: '#place_order',
		requiredFields: '#billing_country, #billing_first_name, #billing_last_name, #billing_address_1, #billing_city, #billing_postcode, #billing_email, #shipping_country, #shipping_first_name, #shipping_last_name, #shipping_address_1, #shipping_city, #shipping_postcode, #ship-to-different-address-checkbox',
		shippingOptionRadio: 'input[name="pwca_shipping_option"]',
		shippingRowContainer: '.pwca-order-shipping',
		shippingRow: '.pwca-order-shipping .pwca-shipping-row'
	};

	const hasAjaxConfig = () => settings.ajaxUrl && settings.nonce;

	const setPayButtonEnabled = (enabled) => {
		const $btn = $(selectors.placeOrderButton);
		if (!$btn.length) {
			return;
		}
		$btn.prop('disabled', !enabled);
		$btn.toggleClass('pwca-pay-disabled', !enabled);
	};

	const setShippingButtonEnabled = (enabled) => {
		const $btn = $(selectors.calculateButton);
		if (!$btn.length) {
			return;
		}
		$btn.prop('disabled', !enabled);
		$btn.toggleClass('disabled', !enabled);
	};

	const validateRequiredFields = () => {
		const billingCountry = $('#billing_country').val();
		const billingFirstName = $('#billing_first_name').val();
		const billingLastName = $('#billing_last_name').val();
		const billingAddress1 = $('#billing_address_1').val();
		const billingCity = $('#billing_city').val();
		const billingPostcode = $('#billing_postcode').val();
		const billingEmail = $('#billing_email').val();

		const hasShippingAddress = $('#ship-to-different-address-checkbox').is(':checked');
		const shippingCountry = $('#shipping_country').val();
		const shippingFirstName = $('#shipping_first_name').val();
		const shippingLastName = $('#shipping_last_name').val();
		const shippingAddress1 = $('#shipping_address_1').val();
		const shippingCity = $('#shipping_city').val();
		const shippingPostcode = $('#shipping_postcode').val();

		const billingValid = !!(billingCountry && billingFirstName && billingLastName && billingAddress1 && billingCity && billingPostcode && billingEmail);
		const shippingValid = hasShippingAddress ? !!(shippingCountry && shippingFirstName && shippingLastName && shippingAddress1 && shippingCity && shippingPostcode) : true;

		return billingValid && shippingValid;
	};

	const updateShippingButtonState = () => setShippingButtonEnabled(validateRequiredFields());

	const hideWooCommerceShippingSelector = () => {
		$('.woocommerce-shipping-methods, .woocommerce-shipping-methods li, #shipping_method, .shipping-calculator-form, .shipping-calculator-button').hide();
	};

	const setSelectedState = (service, cost) => {
		state.selectedService = service || '';
		state.selectedCost = typeof cost === 'number' ? cost : null;
		document.body.dataset.pwcaHasSelectedShipping = state.selectedService ? '1' : '0';
	};

	const showShippingRow = (service, cost) => {
		const parsedCost = typeof cost === 'number' ? cost : 0;
		const safeService = service || '';
		const html = `<label class="pwca-selected-shipping"><input type="radio" checked disabled /> <span class="pwca-shipping-name">${safeService}</span></label><div class="pwca-shipping-freight"><strong>Freight:</strong> ${parsedCost.toFixed(2)}$</div>`;
		$(selectors.shippingRow).html(html);
		$(selectors.shippingRowContainer).addClass('is-visible');
	};

	const hideShippingRow = () => {
		$(selectors.shippingRow).empty();
		$(selectors.shippingRowContainer).removeClass('is-visible');
	};

	const setCalculateButtonLoading = (loading) => {
		const $btn = $(selectors.calculateButton);
		if (!$btn.length) {
			return;
		}
		if (loading) {
			$btn.prop('disabled', true).addClass('loading').text(settings.i18n?.calculating || 'Calculating...');
		} else {
			$btn.prop('disabled', false).removeClass('loading').text(settings.i18n?.calculateShipping || 'Calculate Shipping');
		}
	};

	const renderShippingOptionsTable = (options) => {
		const title = settings.i18n?.shippingOptionsTitle || 'Shipping Options';
		let html = `<h4>${title}</h4><table class="pwca-shipping-table"><thead><tr><th>Select</th><th>Service</th><th>Delivery Time</th><th>Cost</th></tr></thead><tbody>`;

		options.forEach((option, index) => {
			const checked = index === 0 ? 'checked' : '';
			const serviceName = option.serviceCnName || 'Unknown Service';
			const cost = parseFloat(option.totalFee || 0);
			let deliveryTime = option.effectiveness || 'Unknown';
			if (typeof deliveryTime === 'string' && deliveryTime.indexOf('day') === -1) {
				deliveryTime = `${deliveryTime} ${settings.i18n?.days || 'days'}`;
			}
			html += `<tr><td><input type="radio" name="pwca_shipping_option" value="${index}" ${checked} data-cost="${cost}" data-service="${serviceName}"></td><td>${serviceName}</td><td>${deliveryTime}</td><td>$${cost.toFixed(2)}</td></tr>`;
		});

		html += '</tbody></table>';
		$(selectors.shippingOptions).html(html).show();

		const $firstRadio = $(selectors.shippingOptionRadio).first();
		if ($firstRadio.length) {
			$firstRadio.prop('checked', true).trigger('change');
		}
	};

	const fetchShippingOptions = async () => {
		if (!hasAjaxConfig()) {
			return { ok: false, message: settings.i18n?.unableToLoadOptions || 'Unable to load shipping options.' };
		}

		const response = await $.ajax({
			url: settings.ajaxUrl,
			type: 'POST',
			data: {
				action: 'pwca_get_shipping_options',
				nonce: settings.nonce
			}
		});

		if (!response?.success) {
			const message = response?.data || settings.i18n?.failedToCalculateShipping || 'Failed to calculate shipping costs';
			return { ok: false, message };
		}

		const shippingData = response.data?.data || response.data;
		const options = shippingData?.data?.raw_response?.data;
		if (!Array.isArray(options)) {
			return { ok: false, message: settings.i18n?.unableToLoadOptions || 'Unable to load shipping options.' };
		}

		return { ok: true, message: response.data?.message || '', options };
	};

	const updateShippingCost = async (cost, service) => {
		if (!hasAjaxConfig()) {
			return { ok: false };
		}

		$(selectors.shippingOptions).append(`<div class="pwca-shipping-updating">${settings.i18n?.updatingShipping || 'Updating shipping cost...'}</div>`);

		try {
			const response = await $.ajax({
				url: settings.ajaxUrl,
				type: 'POST',
				data: {
					action: 'pwca_update_shipping_cost',
					nonce: settings.nonce,
					shipping_cost: cost,
					service_name: service
				}
			});

			$('.pwca-shipping-updating').remove();

			if (!response?.success) {
				return { ok: false };
			}

			setSelectedState(service, cost);
			showShippingRow(service, cost);
			setPayButtonEnabled(true);

			$('body').trigger('update_checkout');
			setTimeout(() => $('body').trigger('update_checkout'), 500);

			$(selectors.calculateButton).hide();
			return { ok: true };
		} catch (e) {
			$('.pwca-shipping-updating').remove();
			return { ok: false };
		}
	};

	const ensureSingleCalculateContainer = () => {
		const $containers = $('.pwca-calculate-shipping-container');
		if ($containers.length > 1) {
			$containers.not(':first').remove();
		}
	};

	const initFromSession = () => {
		if (state.selectedService && typeof state.selectedCost === 'number') {
			setSelectedState(state.selectedService, state.selectedCost);
			showShippingRow(state.selectedService, state.selectedCost);
			setPayButtonEnabled(true);
			$(selectors.calculateButton).hide();
			return;
		}
		setSelectedState('', null);
		hideShippingRow();
		setPayButtonEnabled(false);
	};

	$(document).ready(function () {
		hideWooCommerceShippingSelector();
		ensureSingleCalculateContainer();

		initFromSession();
		updateShippingButtonState();

		$(selectors.requiredFields).on('change keyup input', function () {
			updateShippingButtonState();
		});

		$(document.body).on('updated_checkout', function () {
			hideWooCommerceShippingSelector();
			ensureSingleCalculateContainer();
			updateShippingButtonState();
		});

		$(document).ajaxComplete(function () {
			hideWooCommerceShippingSelector();
			ensureSingleCalculateContainer();
		});

		$(document).on('click', selectors.calculateButton, async function () {
			const $btn = $(selectors.calculateButton);
			if (!$btn.length || $btn.prop('disabled')) {
				return;
			}

			setCalculateButtonLoading(true);
			$(selectors.shippingOptions).hide().empty();

			try {
				const result = await fetchShippingOptions();
				setCalculateButtonLoading(false);

				if (!result.ok) {
					alert(result.message || settings.i18n?.errorCalculatingShipping || 'Error occurred while calculating shipping');
					return;
				}

				renderShippingOptionsTable(result.options);
			} catch (e) {
				setCalculateButtonLoading(false);
				alert(settings.i18n?.errorCalculatingShipping || 'Error occurred while calculating shipping');
			}
		});

		$(document).on('change', selectors.shippingOptionRadio, async function () {
			const $opt = $(this);
			$('.pwca-shipping-table tr').removeClass('pwca-selected');
			$opt.closest('tr').addClass('pwca-selected');

			const cost = parseFloat($opt.data('cost'));
			const service = $opt.data('service');

			if (!service || Number.isNaN(cost)) {
				return;
			}

			const result = await updateShippingCost(cost, service);
			if (!result.ok) {
				alert(settings.i18n?.failedToUpdateShippingCost || 'Failed to update shipping cost');
			}
		});
	});
})(jQuery);

