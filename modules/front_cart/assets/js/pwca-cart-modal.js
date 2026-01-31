(function ($) {
	'use strict';

	const modalSelector = '#pwca-design-modal';

	const getModalElements = () => {
		const $modal = $(modalSelector);
		if ($modal.length === 0) {
			return null;
		}

		return {
			$modal,
			$title: $modal.find('#pwca-modal-title'),
			$iframe: $modal.find('#pwca-modal-iframe'),
			$openEditor: $modal.find('#pwca-open-editor'),
			$loading: $modal.find('[data-pwca-modal-loading]'),
			$error: $modal.find('[data-pwca-modal-error]'),
			$imageWrap: $modal.find('[data-pwca-modal-image]'),
			$image: $modal.find('[data-pwca-modal-image] img'),
			$closeButtons: $modal.find('[data-pwca-modal-close]'),
			$retry: $modal.find('.pwca-retry-btn'),
		};
	};

	const state = {
		lastUrl: '',
		mode: 'iframe',
		timeoutId: null,
	};

	const setHidden = ($el, hidden) => {
		if (hidden) {
			$el.attr('hidden', 'hidden');
			return;
		}
		$el.removeAttr('hidden');
	};

	const showLoading = (els) => {
		setHidden(els.$error, true);
		setHidden(els.$loading, false);
	};

	const showError = (els) => {
		setHidden(els.$loading, true);
		setHidden(els.$error, false);
	};

	const showContent = (els) => {
		setHidden(els.$loading, true);
		setHidden(els.$error, true);
	};

	const openBase = (els) => {
		els.$modal.addClass('pwca-modal-open').attr('aria-hidden', 'false');
		$('body').addClass('pwca-modal-body-lock');

		const $firstClose = els.$closeButtons.first();
		if ($firstClose.length) {
			$firstClose.trigger('focus');
		}
	};

	const closeModal = (els) => {
		els.$modal.removeClass('pwca-modal-open').attr('aria-hidden', 'true');
		$('body').removeClass('pwca-modal-body-lock');

		if (state.timeoutId) {
			clearTimeout(state.timeoutId);
			state.timeoutId = null;
		}

		setTimeout(() => {
			els.$iframe.attr('src', '');
			els.$image.attr('src', '').attr('alt', '');
		}, 250);
	};

	const openIframe = (els, url) => {
		state.mode = 'iframe';
		state.lastUrl = url;

		els.$title.text('Design Preview');
		els.$openEditor.attr('href', url).show();

		setHidden(els.$imageWrap, true);
		els.$iframe.removeAttr('hidden');

		showLoading(els);
		openBase(els);

		els.$iframe.off('load error');
		els.$iframe.on('load', () => showContent(els));
		els.$iframe.on('error', () => showError(els));

		state.timeoutId = setTimeout(() => {
			showContent(els);
		}, 3000);

		els.$iframe.attr('src', url);
	};

	const openImage = (els, imageUrl, title) => {
		state.mode = 'image';
		state.lastUrl = imageUrl;

		els.$title.text(title || 'Image Preview');
		els.$openEditor.hide();

		els.$iframe.attr('src', '').attr('hidden', 'hidden');
		setHidden(els.$imageWrap, false);

		els.$image.attr('src', imageUrl).attr('alt', title || 'Image Preview');
		showContent(els);
		openBase(els);
	};

	const retry = (els) => {
		if (!state.lastUrl) {
			return;
		}
		if (state.mode === 'image') {
			openImage(els, state.lastUrl, els.$title.text());
			return;
		}
		openIframe(els, state.lastUrl);
	};

	const bind = (els) => {
		$(document).on('click', '.pwca-draft-link', (e) => {
			const url = $(e.currentTarget).attr('href');
			if (!url) {
				return;
			}
			e.preventDefault();
			openIframe(els, url);
		});

		$(document).on('click', '.pwca-image-preview', (e) => {
			const $target = $(e.currentTarget);
			const url = $target.data('image-url');
			if (!url) {
				return;
			}
			e.preventDefault();
			openImage(els, url, $target.data('image-title') || 'Image Preview');
		});

		els.$closeButtons.on('click', (e) => {
			e.preventDefault();
			closeModal(els);
		});

		$(document).on('keydown', (e) => {
			if (e.key === 'Escape' && els.$modal.hasClass('pwca-modal-open')) {
				closeModal(els);
			}
		});

		els.$retry.on('click', () => retry(els));
	};

	$(() => {
		const els = getModalElements();
		if (!els) {
			return;
		}
		bind(els);
	});
})(jQuery);

