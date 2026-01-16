(function () {
	'use strict';

	const looksLikeImageUrl = (text) => /\.(jpeg|jpg|gif|png)$/i.test(text);

	const replaceTextUrlWithImage = (element) => {
		if (!element) {
			return;
		}

		const url = (element.textContent || '').trim();
		if (!url || !looksLikeImageUrl(url)) {
			return;
		}

		const img = document.createElement('img');
		img.src = url;
		img.alt = '';
		img.className = 'pwca-cart-url-image';

		element.textContent = '';
		element.appendChild(img);
		element.classList.add('pwca-cart-url-image-wrap');
	};

	const processBlockCart = () => {
		const elements = document.querySelectorAll('.wc-block-components-product-details__value');
		elements.forEach(replaceTextUrlWithImage);
	};

	const processCustomProductImageHolders = () => {
		const holders = document.querySelectorAll('.custom-product-image');
		holders.forEach((holder) => {
			const url = holder.getAttribute('data-image-url') || '';
			if (!url) {
				return;
			}
			const img = document.createElement('img');
			img.src = url;
			img.alt = '';
			img.className = 'pwca-cart-url-image';
			holder.textContent = '';
			holder.appendChild(img);
			holder.classList.add('pwca-cart-url-image-wrap');
		});
	};

	const run = () => {
		processBlockCart();
		processCustomProductImageHolders();
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', run);
	} else {
		run();
	}

	document.body.addEventListener('wc_fragments_refreshed', run);
	document.body.addEventListener('updated_wc_div', run);
})();

