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

	/**
	 * 使用 Canvas 绘制中文文字并返回图片
	 */
	const textToImage = (lines, options = {}) => {
		const {
			fontSize = 14,
			fontFamily = 'Microsoft YaHei, PingFang SC, Hiragino Sans GB, sans-serif',
			lineHeight = 1.5,
			color = '#000',
			maxWidth = 500
		} = options;

		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		
		ctx.font = `${fontSize}px ${fontFamily}`;
		
		// 计算画布尺寸
		let textWidth = 0;
		lines.forEach(line => {
			const w = ctx.measureText(line).width;
			if (w > textWidth) textWidth = w;
		});
		
		const width = Math.min(textWidth + 20, maxWidth);
		const height = lines.length * fontSize * lineHeight + 20;
		
		canvas.width = width * 2; // 2x for retina
		canvas.height = height * 2;
		ctx.scale(2, 2);
		
		// 绘制文字
		ctx.font = `${fontSize}px ${fontFamily}`;
		ctx.fillStyle = color;
		ctx.textBaseline = 'top';
		
		lines.forEach((line, i) => {
			ctx.fillText(line, 10, 10 + i * fontSize * lineHeight);
		});
		
		return {
			dataUrl: canvas.toDataURL('image/png'),
			width,
			height
		};
	};

	/**
	 * 生成包含所有商品设计的 PDF
	 */
	const generatePdf = async (container) => {
		const jsPDF = getJsPdf();
		if (!jsPDF) {
			throw new Error('未检测到 jsPDF');
		}

		const orderNumber = container.dataset.orderNumber || '';
		const itemsJson = container.dataset.items || '[]';
		
		let items = [];
		try {
			items = JSON.parse(itemsJson);
		} catch (e) {
			throw new Error('商品数据解析失败');
		}

		if (!Array.isArray(items) || items.length === 0) {
			throw new Error('没有可生成的设计数据');
		}

		const doc = new jsPDF({ unit: 'pt', format: 'a4' });
		const pageWidth = doc.internal.pageSize.getWidth();
		const pageHeight = doc.internal.pageSize.getHeight();
		const margin = 40;
		const contentWidth = pageWidth - margin * 2;

		// 遍历每个商品，每个商品一页
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			
			if (i > 0) {
				doc.addPage();
			}

			let yPos = margin;

			// 构建文字内容
			const textLines = [
				`生产单 - 订单 #${orderNumber}`,
				``,
				`商品 ${i + 1} / ${items.length}`,
				`产品：${item.product_name || ''}`,
				`产品ID：${item.product_id || ''}`
			];

			// 颜色信息
			const colorLine = item.color_name 
				? `${item.color_name}（${item.custom_color}）` 
				: item.custom_color;
			if (colorLine) {
				textLines.push(`颜色：${colorLine}`);
			}

			// 使用 Canvas 绘制中文文字
			const textImg = textToImage(textLines, { fontSize: 14, maxWidth: contentWidth });
			doc.addImage(textImg.dataUrl, 'PNG', margin, yPos, textImg.width, textImg.height);
			yPos += textImg.height + 20;

			// 设计图
			if (item.custom_image) {
				try {
					const imageDataUrl = await fetchImageDataUrl(item.custom_image);
					const format = inferImageFormat(imageDataUrl);
					const maxImgHeight = pageHeight - yPos - margin;
					doc.addImage(imageDataUrl, format, margin, yPos, contentWidth, 0);
				} catch (imgErr) {
					// 图片加载失败时显示错误信息
					const errImg = textToImage([`[图片加载失败: ${imgErr.message}]`], { fontSize: 12, color: '#c00' });
					doc.addImage(errImg.dataUrl, 'PNG', margin, yPos, errImg.width, errImg.height);
				}
			}
		}

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
