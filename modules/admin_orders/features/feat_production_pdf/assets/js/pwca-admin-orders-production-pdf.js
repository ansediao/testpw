(() => {
	const stateText = (container, text) => {
		const statusNode = container.querySelector('.pwca-admin-orders-production-pdf__status, .pwca-admin-orders-details-pdf__status');
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

	const textToImage = (lines, options = {}) => {
		const {
			fontSize = 14,
			fontFamily = 'Microsoft YaHei, PingFang SC, Hiragino Sans GB, sans-serif',
			lineHeight = 1.5,
			color = '#000',
			maxWidth = 500,
			boldLines = [],
			padding = 10
		} = options;

		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		
		ctx.font = `${fontSize}px ${fontFamily}`;
		
		let textWidth = 0;
		lines.forEach(line => {
			const w = ctx.measureText(line).width;
			if (w > textWidth) textWidth = w;
		});
		
		const width = Math.min(textWidth + padding * 2, maxWidth);
		const height = lines.length * fontSize * lineHeight + padding * 2;
		
		canvas.width = width * 2;
		canvas.height = height * 2;
		ctx.scale(2, 2);
		
		ctx.textBaseline = 'top';
		
		lines.forEach((line, i) => {
			const isBold = boldLines.includes(i);
			ctx.font = `${isBold ? 'bold ' : ''}${fontSize}px ${fontFamily}`;
			ctx.fillStyle = color;
			ctx.fillText(line, padding, padding + i * fontSize * lineHeight);
		});
		
		return {
			dataUrl: canvas.toDataURL('image/png'),
			width,
			height
		};
	};

	const extractViewData = (viewImages, viewPrintMethods, printMethodsData) => {
		if (!Array.isArray(viewImages) || viewImages.length === 0) {
			return [];
		}

		const views = [];
		viewImages.forEach((view) => {
			if (!view || typeof view !== 'object') return;
			
			const viewId = view.view_id || view.id || '';
			const viewName = view.view_name || view.view_id || view.id || 'View';
			const images = Array.isArray(view.images) ? view.images : [];
			
			const printMethodNames = [];
			if (Array.isArray(viewPrintMethods)) {
				const vpm = viewPrintMethods.find(v => String(v.view_id) === String(viewId));
				if (vpm && Array.isArray(vpm.print_methods)) {
					printMethodNames.push(...vpm.print_methods);
				}
			}

			const printMethods = [];
			printMethodNames.forEach(name => {
				if (printMethodsData && printMethodsData[name]) {
					printMethods.push(printMethodsData[name]);
				}
			});

			views.push({
				viewId,
				viewName,
				images,
				printMethods
			});
		});
		
		return views;
	};

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
		const imageSpacing = 10;

		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			const views = extractViewData(item.view_images, item.view_print_methods, item.print_methods_data);
			
			if (views.length === 0) {
				continue;
			}

			for (let viewIdx = 0; viewIdx < views.length; viewIdx++) {
				const view = views[viewIdx];
				
				if (i > 0 || viewIdx > 0) {
					doc.addPage();
				}

				let yPos = margin;

				// const headerLines = [
				// 	`生产单 - 订单 #${orderNumber}`,
				// 	``,
				// 	`商品 ${i + 1} / ${items.length}`
				// ];
				// const headerImg = textToImage(headerLines, { fontSize: 12, maxWidth: contentWidth });
				// doc.addImage(headerImg.dataUrl, 'PNG', margin, yPos, headerImg.width, headerImg.height);
				// yPos += headerImg.height + 15;

				const productLines = [item.product_name || ''];
				const productImg = textToImage(productLines, { fontSize: 16, maxWidth: contentWidth, boldLines: [0], padding: 2 });
				doc.addImage(productImg.dataUrl, 'PNG', margin, yPos, productImg.width, productImg.height);
				yPos += productImg.height + 2;

				if (item.sku) {
					const skuLines = [`SKU: ${item.sku}`];
					const skuImg = textToImage(skuLines, { fontSize: 12, maxWidth: contentWidth, color: '#666', padding: 2 });
					doc.addImage(skuImg.dataUrl, 'PNG', margin, yPos, skuImg.width, skuImg.height);
					yPos += skuImg.height + 10;
				}

				// const colorLine = item.color_name 
				// 	? `${item.color_name}（${item.custom_color}）` 
				// 	: item.custom_color;
				// if (colorLine) {
				// 	const colorLines = [`颜色: ${colorLine}`];
				// 	const colorImg = textToImage(colorLines, { fontSize: 12, maxWidth: contentWidth });
				// 	doc.addImage(colorImg.dataUrl, 'PNG', margin, yPos, colorImg.width, colorImg.height);
				// 	yPos += colorImg.height + 15;
				// }

				const viewNameLines = [`View Name: ${view.viewName}`];
				const viewNameImg = textToImage(viewNameLines, { fontSize: 14, maxWidth: contentWidth, boldLines: [0] });
				doc.addImage(viewNameImg.dataUrl, 'PNG', margin, yPos, viewNameImg.width, viewNameImg.height);
				yPos += viewNameImg.height + 10;

				const images = view.images || [];
				if (images.length > 0) {
					const imagesPerRow = 4;
					const imgWidth = (contentWidth - (imagesPerRow - 1) * imageSpacing) / imagesPerRow;
					const maxImgHeight = 150;

					for (let rowStart = 0; rowStart < images.length; rowStart += imagesPerRow) {
						const rowImages = images.slice(rowStart, rowStart + imagesPerRow);
						let rowHeight = 0;
						const loadedImages = [];

						for (let j = 0; j < rowImages.length; j++) {
							try {
								const imageDataUrl = await fetchImageDataUrl(rowImages[j]);
								const format = inferImageFormat(imageDataUrl);
								loadedImages.push({ dataUrl: imageDataUrl, format });
								
								const img = new Image();
								img.src = imageDataUrl;
								await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
								const aspectRatio = img.width / img.height;
								const actualHeight = imgWidth / aspectRatio;
								if (actualHeight > rowHeight) rowHeight = actualHeight;
							} catch (e) {
								loadedImages.push({ dataUrl: null, format: 'PNG', error: true });
							}
						}

						if (rowHeight > maxImgHeight) rowHeight = maxImgHeight;

						if (yPos + rowHeight > pageHeight - margin) {
							doc.addPage();
							yPos = margin;
						}

						for (let j = 0; j < loadedImages.length; j++) {
							const x = margin + j * (imgWidth + imageSpacing);
							const imgData = loadedImages[j];
							
							if (imgData.error || !imgData.dataUrl) {
								const errImg = textToImage([`[图片加载失败]`], { fontSize: 10, color: '#c00' });
								doc.addImage(errImg.dataUrl, 'PNG', x, yPos, errImg.width, errImg.height);
							} else {
								doc.addImage(imgData.dataUrl, imgData.format, x, yPos, imgWidth, rowHeight);
							}
						}

						yPos += rowHeight + 15;
					}
				}

				if (view.printMethods && view.printMethods.length > 0) {
					for (const printMethod of view.printMethods) {
						if (yPos > pageHeight - margin - 100) {
							doc.addPage();
							yPos = margin;
						}

						const pmNameLines = [`印刷方式: ${printMethod.name}`];
						const pmNameImg = textToImage(pmNameLines, { fontSize: 12, maxWidth: contentWidth, boldLines: [0] });
						doc.addImage(pmNameImg.dataUrl, 'PNG', margin, yPos, pmNameImg.width, pmNameImg.height);
						yPos += pmNameImg.height + 8;

						if (printMethod.description) {
							const descLines = [printMethod.description];
							const descImg = textToImage(descLines, { fontSize: 10, maxWidth: contentWidth, color: '#666' });
							doc.addImage(descImg.dataUrl, 'PNG', margin, yPos, descImg.width, descImg.height);
							yPos += descImg.height + 8;
						}

						if (printMethod.print_method_area) {
							try {
								const pmImageDataUrl = await fetchImageDataUrl(printMethod.print_method_area);
								const pmFormat = inferImageFormat(pmImageDataUrl);
								
								const pmMaxWidth = 100;
								const pmMaxHeight = 100;
								
								const pmImg = new Image();
								pmImg.src = pmImageDataUrl;
								await new Promise((resolve) => { pmImg.onload = resolve; pmImg.onerror = resolve; });
								
								let pmImgWidth = pmImg.width;
								let pmImgHeight = pmImg.height;
								
								if (pmImgWidth > pmMaxWidth || pmImgHeight > pmMaxHeight) {
									const scale = Math.min(pmMaxWidth / pmImgWidth, pmMaxHeight / pmImgHeight);
									pmImgWidth *= scale;
									pmImgHeight *= scale;
								}

								if (yPos + pmImgHeight > pageHeight - margin) {
									doc.addPage();
									yPos = margin;
								}

								doc.addImage(pmImageDataUrl, pmFormat, margin, yPos, pmImgWidth, pmImgHeight);
								yPos += pmImgHeight + 15;
							} catch (e) {
								const errImg = textToImage([`[印刷方式图加载失败]`], { fontSize: 10, color: '#c00' });
								doc.addImage(errImg.dataUrl, 'PNG', margin, yPos, errImg.width, errImg.height);
								yPos += errImg.height + 15;
							}
						}
					}
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

	const onClickDetailsPdf = async (event) => {
		const button = event.target.closest('.pwca-admin-orders-download-details-pdf');
		if (!button) {
			return;
		}

		const container = button.closest('.pwca-admin-orders-details-pdf');
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

	document.addEventListener('click', onClickDetailsPdf, false);
})();
