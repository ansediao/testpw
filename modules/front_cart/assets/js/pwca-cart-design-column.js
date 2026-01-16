(function ($) {
	'use strict';

	const getCartForm = () => $('.woocommerce-cart-form');

	const ensureDesignHeader = ($form) => {
		const $headerRow = $form.find('.shop_table thead tr');
		if ($headerRow.length === 0) {
			return;
		}

		if ($headerRow.find('.pwca-design-column-header').length > 0) {
			return;
		}

		const $priceHeader = $headerRow.find('.product-price').first();
		if ($priceHeader.length === 0) {
			return;
		}

		const th = document.createElement('th');
		th.className = 'pwca-design-column-header';
		th.textContent = 'Design';
		$priceHeader.before(th);
	};

	const moveHiddenDesignCell = ($form) => {
		$form.find('tr.cart_item').each((_, row) => {
			const $row = $(row);
			const $hidden = $row.find('.pwca-cart-design-hidden').first();
			if ($hidden.length === 0) {
				return;
			}

			if ($row.find('td.product-design').length > 0) {
				$hidden.remove();
				return;
			}

			const $priceCell = $row.find('.product-price').first();
			if ($priceCell.length === 0) {
				return;
			}

			const td = document.createElement('td');
			td.className = 'product-design';
			td.setAttribute('data-title', 'Design');
			td.appendChild(document.createElement('div')).innerHTML = $hidden.html();

			$priceCell.before(td);
			$hidden.remove();
		});
	};

	const formatPrice = (amount) => {
		const wcParams = window.wc_cart_params || window.wc_add_to_cart_params || {};
		const currencySymbol = wcParams.currency_symbol || '';

		const precision = Number.isFinite(parseInt(wcParams.currency_format_num_decimals, 10))
			? parseInt(wcParams.currency_format_num_decimals, 10)
			: 2;
		const dec = wcParams.currency_format_decimal_sep || '.';
		const thou = wcParams.currency_format_thousand_sep || ',';
		const pos = wcParams.currency_format || wcParams.currency_pos || 'left';

		const value = Number(amount);
		const safe = Number.isFinite(value) ? value : 0;
		const parts = safe.toFixed(precision).split('.');
		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thou);
		const joined = parts.join(dec);

		if (pos === 'right') return joined + currencySymbol;
		if (pos === 'left_space') return currencySymbol + ' ' + joined;
		if (pos === 'right_space') return joined + ' ' + currencySymbol;
		return currencySymbol + joined;
	};

	const insertDesignRows = () => {
		const config = window.pwca_cart_design_rows;
		if (!config || !config.map) {
			return;
		}

		Object.keys(config.map).forEach((cartKey) => {
			const data = config.map[cartKey] || {};
			const designs = Array.isArray(data.designs) ? data.designs : [];
			if (designs.length === 0) {
				return;
			}

			const $mainRow = $(`tr.cart_item.pwca-ci-${cartKey}`);
			if ($mainRow.length === 0) {
				return;
			}

			if ($mainRow.next('.pwca-design-row').length > 0) {
				return;
			}

			const unitFee = data.unit_fee;
			designs.forEach((d) => {
				const name = d && d.name ? String(d.name) : '';
				const image = d && d.image ? String(d.image) : '';
				const qty = d && d.quantity ? parseInt(d.quantity, 10) : 0;
				const imgSrc = image || config.placeholder || '';
				const subtotalHtml = unitFee != null ? formatPrice(unitFee * Math.max(0, qty)) : '—';

				const tr = document.createElement('tr');
				tr.className = 'pwca-design-row';

				const tdRemove = document.createElement('td');
				tdRemove.className = 'product-remove';
				tdRemove.innerHTML = '&nbsp;';
				tr.appendChild(tdRemove);

				const tdThumb = document.createElement('td');
				tdThumb.className = 'product-thumbnail';
				const img = document.createElement('img');
				img.src = imgSrc;
				img.width = 32;
				tdThumb.appendChild(img);
				tr.appendChild(tdThumb);

				const tdName = document.createElement('td');
				tdName.className = 'product-name';
				const span = document.createElement('span');
				span.className = 'pwca-design-row-title';
				span.textContent = name;
				tdName.appendChild(span);
				tr.appendChild(tdName);

				const tdDesign = document.createElement('td');
				tdDesign.className = 'product-design';
				tr.appendChild(tdDesign);

				const tdPrice = document.createElement('td');
				tdPrice.className = 'product-price';
				tr.appendChild(tdPrice);

				const tdQty = document.createElement('td');
				tdQty.className = 'product-quantity';
				tdQty.textContent = String(Math.max(0, qty));
				tr.appendChild(tdQty);

				const tdSubtotal = document.createElement('td');
				tdSubtotal.className = 'product-subtotal';
				tdSubtotal.innerHTML = subtotalHtml;
				tr.appendChild(tdSubtotal);

				$mainRow.after(tr);
			});
		});
	};

	const run = () => {
		const $form = getCartForm();
		if ($form.length === 0) {
			return;
		}
		ensureDesignHeader($form);
		moveHiddenDesignCell($form);
		insertDesignRows();
	};

	$(() => {
		run();
		$(document.body).on('updated_wc_div wc_fragments_refreshed updated_cart_totals pwca_cart_quantity_updated removed_from_cart', () => {
			setTimeout(run, 0);
		});
	});
})(jQuery);

