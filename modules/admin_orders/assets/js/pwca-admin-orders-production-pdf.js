(() => {
	const stateText = (container, text) => {
		const statusNode = container.querySelector('.pwca-admin-orders-production-pdf__status');
		if (statusNode) {
			statusNode.textContent = String(text || '');
		}
	};

	const setSpinner = (container, active) => {
		const spinner = container.querySelector('.spinner');
		if (!spinner) {
			return;
		}
		if (active) {
			spinner.classList.add('is-active');
		} else {
			spinner.classList.remove('is-active');
		}
	};

	const getJsPdf = () => {
		if (window.jspdf && typeof window.jspdf.jsPDF === 'function') {
			return window.jspdf.jsPDF;
		}
		if (typeof window.jsPDF === 'function') {
			return window.jsPDF;
		}
		return null;
	};

	const blobToDataUrl = (blob) =>
		new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(String(reader.result || ''));
			reader.onerror = () => reject(new Error('读取图片失败'));
			reader.readAsDataURL(blob);
		});

	const fetchImageDataUrl = async (url) => {
		const response = await fetch(url, { credentials: 'same-origin' });
		if (!response.ok) {
			throw new Error(`图片下载失败（${response.status}）`);
		}
		const blob = await response.blob();
		return blobToDataUrl(blob);
	};

	const inferImageFormat = (dataUrl) => {
		const prefix = String(dataUrl || '').slice(0, 50).toLowerCase();
		if (prefix.includes('data:image/jpeg') || prefix.includes('data:image/jpg')) {
			return 'JPEG';
		}
		return 'PNG';
	};

	const generatePdf = async (container) => {
		const jsPDF = getJsPdf();
		if (!jsPDF) {
			throw new Error('未检测到 jsPDF');
		}

		const orderNumber = container.dataset.orderNumber || '';
		const productName = container.dataset.productName || '';
		const productId = container.dataset.productId || '';
		const customColor = container.dataset.customColor || '';
		const colorName = container.dataset.colorName || '';
		const customImageUrl = container.dataset.customImage || '';

		if (!customImageUrl) {
			throw new Error('缺少设计图链接');
		}

		const doc = new jsPDF({ unit: 'pt', format: 'a4' });
		doc.setFontSize(16);
		doc.text(`生产单 - 订单 #${orderNumber}`, 40, 50);
		doc.setFontSize(11);
		doc.text(`产品：${productName}`, 40, 80);
		doc.text(`产品ID：${productId}`, 40, 98);

		const colorLine = colorName ? `${colorName}（${customColor}）` : customColor;
		if (colorLine) {
			doc.text(`颜色：${colorLine}`, 40, 116);
		}

		const imageDataUrl = await fetchImageDataUrl(customImageUrl);
		const format = inferImageFormat(imageDataUrl);
		doc.addImage(imageDataUrl, format, 40, 140, 360, 0);

		const safeOrder = String(orderNumber || 'order').replace(/[^\w.-]/g, '-');
		doc.save(`production-order-${safeOrder}.pdf`);
	};

	const getI18n = () => {
		const i18n = window.pwcaAdminOrdersProductionPdf && window.pwcaAdminOrdersProductionPdf.i18n;
		return {
			generating: (i18n && i18n.generating) || '正在生成 PDF…',
			success: (i18n && i18n.success) || '已生成并开始下载',
			failed: (i18n && i18n.failed) || '生成失败',
		};
	};

	const onClick = async (event) => {
		const button = event.target.closest('.pwca-admin-orders-generate-pdf');
		if (!button) {
			return;
		}

		const container = button.closest('.pwca-admin-orders-production-pdf');
		if (!container) {
			return;
		}

		event.preventDefault();

		const i18n = getI18n();
		stateText(container, i18n.generating);
		setSpinner(container, true);

		try {
			await generatePdf(container);
			stateText(container, i18n.success);
		} catch (err) {
			const message = err && err.message ? String(err.message) : i18n.failed;
			stateText(container, `${i18n.failed}：${message}`);
		} finally {
			setSpinner(container, false);
		}
	};

	document.addEventListener('click', onClick, false);
})();

