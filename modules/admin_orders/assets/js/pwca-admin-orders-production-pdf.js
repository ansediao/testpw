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

	/**
	 * 生成订单详情 PDF
	 */
	const generateOrderDetailsPdf = async (container) => {
		const jsPDF = getJsPdf();
		if (!jsPDF) {
			throw new Error('未检测到 jsPDF');
		}

		const orderId = container.dataset.orderId || '';
		const orderNumber = container.dataset.orderNumber || '';

		// 从页面获取订单信息
		const orderData = extractOrderDataFromPage();

		// 获取设计数据
		const itemsJson = container.dataset.items || '[]';
		let designItems = [];
		try {
			designItems = JSON.parse(itemsJson);
		} catch (e) {
			designItems = [];
		}

		const doc = new jsPDF({ unit: 'pt', format: 'a4' });
		const pageWidth = doc.internal.pageSize.getWidth();
		const pageHeight = doc.internal.pageSize.getHeight();
		const margin = 40;
		const contentWidth = pageWidth - margin * 2;

		let yPos = margin;

		// 标题
		const titleLines = ['订单详情', `订单号: #${orderNumber}`];
		const titleImg = textToImage(titleLines, { fontSize: 18, maxWidth: contentWidth });
		doc.addImage(titleImg.dataUrl, 'PNG', margin, yPos, titleImg.width, titleImg.height);
		yPos += titleImg.height + 20;

		// 分隔线
		doc.setDrawColor(200, 200, 200);
		doc.line(margin, yPos, pageWidth - margin, yPos);
		yPos += 20;

		// 订单基本信息
		if (orderData.basicInfo.length > 0) {
			const basicInfoImg = textToImage(['【基本信息】'], { fontSize: 14, maxWidth: contentWidth });
			doc.addImage(basicInfoImg.dataUrl, 'PNG', margin, yPos, basicInfoImg.width, basicInfoImg.height);
			yPos += basicInfoImg.height + 10;

			const infoImg = textToImage(orderData.basicInfo, { fontSize: 12, maxWidth: contentWidth });
			doc.addImage(infoImg.dataUrl, 'PNG', margin, yPos, infoImg.width, infoImg.height);
			yPos += infoImg.height + 15;
		}

		// 账单地址
		if (orderData.billingAddress.length > 0) {
			if (yPos > pageHeight - 150) {
				doc.addPage();
				yPos = margin;
			}
			const billingTitleImg = textToImage(['【账单地址】'], { fontSize: 14, maxWidth: contentWidth });
			doc.addImage(billingTitleImg.dataUrl, 'PNG', margin, yPos, billingTitleImg.width, billingTitleImg.height);
			yPos += billingTitleImg.height + 10;

			const billingImg = textToImage(orderData.billingAddress, { fontSize: 12, maxWidth: contentWidth });
			doc.addImage(billingImg.dataUrl, 'PNG', margin, yPos, billingImg.width, billingImg.height);
			yPos += billingImg.height + 15;
		}

		// 配送地址
		if (orderData.shippingAddress.length > 0) {
			if (yPos > pageHeight - 150) {
				doc.addPage();
				yPos = margin;
			}
			const shippingTitleImg = textToImage(['【配送地址】'], { fontSize: 14, maxWidth: contentWidth });
			doc.addImage(shippingTitleImg.dataUrl, 'PNG', margin, yPos, shippingTitleImg.width, shippingTitleImg.height);
			yPos += shippingTitleImg.height + 10;

			const shippingImg = textToImage(orderData.shippingAddress, { fontSize: 12, maxWidth: contentWidth });
			doc.addImage(shippingImg.dataUrl, 'PNG', margin, yPos, shippingImg.width, shippingImg.height);
			yPos += shippingImg.height + 15;
		}

		// 订单商品
		if (orderData.items.length > 0) {
			if (yPos > pageHeight - 150) {
				doc.addPage();
				yPos = margin;
			}
			const itemsTitleImg = textToImage(['【订单商品】'], { fontSize: 14, maxWidth: contentWidth });
			doc.addImage(itemsTitleImg.dataUrl, 'PNG', margin, yPos, itemsTitleImg.width, itemsTitleImg.height);
			yPos += itemsTitleImg.height + 10;

			for (let i = 0; i < orderData.items.length; i++) {
				if (yPos > pageHeight - 100) {
					doc.addPage();
					yPos = margin;
				}
				const itemImg = textToImage(orderData.items[i], { fontSize: 11, maxWidth: contentWidth });
				doc.addImage(itemImg.dataUrl, 'PNG', margin, yPos, itemImg.width, itemImg.height);
				yPos += itemImg.height + 8;
			}
			yPos += 10;
		}

		// 订单总计
		if (orderData.totals.length > 0) {
			if (yPos > pageHeight - 150) {
				doc.addPage();
				yPos = margin;
			}
			doc.setDrawColor(200, 200, 200);
			doc.line(margin, yPos, pageWidth - margin, yPos);
			yPos += 15;

			const totalsTitleImg = textToImage(['【订单总计】'], { fontSize: 14, maxWidth: contentWidth });
			doc.addImage(totalsTitleImg.dataUrl, 'PNG', margin, yPos, totalsTitleImg.width, totalsTitleImg.height);
			yPos += totalsTitleImg.height + 10;

			for (let i = 0; i < orderData.totals.length; i++) {
				const totalImg = textToImage(orderData.totals[i], { fontSize: 12, maxWidth: contentWidth });
				doc.addImage(totalImg.dataUrl, 'PNG', margin, yPos, totalImg.width, totalImg.height);
				yPos += totalImg.height + 5;
			}
		}

		// 商品设计图（每个商品一页）
		if (Array.isArray(designItems) && designItems.length > 0) {
			for (let i = 0; i < designItems.length; i++) {
				doc.addPage();
				let designYPos = margin;

				const item = designItems[i];

				// 设计图标题
				const designTitleLines = [
					'【商品设计图】',
					`商品 ${i + 1} / ${designItems.length}`,
					`产品：${item.product_name || ''}`,
					`产品ID：${item.product_id || ''}`
				];

				// 颜色信息
				const colorLine = item.color_name
					? `${item.color_name}（${item.custom_color}）`
					: item.custom_color;
				if (colorLine) {
					designTitleLines.push(`颜色：${colorLine}`);
				}

				const designTitleImg = textToImage(designTitleLines, { fontSize: 14, maxWidth: contentWidth });
				doc.addImage(designTitleImg.dataUrl, 'PNG', margin, designYPos, designTitleImg.width, designTitleImg.height);
				designYPos += designTitleImg.height + 20;

				// 设计图
				if (item.custom_image) {
					try {
						const imageDataUrl = await fetchImageDataUrl(item.custom_image);
						const format = inferImageFormat(imageDataUrl);
						const maxImgHeight = pageHeight - designYPos - margin;
						doc.addImage(imageDataUrl, format, margin, designYPos, contentWidth, 0);
					} catch (imgErr) {
						const errImg = textToImage([`[图片加载失败: ${imgErr.message}]`], { fontSize: 12, color: '#c00' });
						doc.addImage(errImg.dataUrl, 'PNG', margin, designYPos, errImg.width, errImg.height);
					}
				}
			}
		}

		const safeOrder = String(orderNumber || 'order').replace(/[^\w.-]/g, '-');
		doc.save(`order-details-${safeOrder}.pdf`);
	};

	/**
	 * 从页面提取订单数据
	 */
	const extractOrderDataFromPage = () => {
		const data = {
			basicInfo: [],
			billingAddress: [],
			shippingAddress: [],
			items: [],
			totals: []
		};

		// 提取订单状态
		const statusSelect = document.querySelector('#order_status');
		if (statusSelect) {
			const selectedOption = statusSelect.options[statusSelect.selectedIndex];
			if (selectedOption) {
				data.basicInfo.push(`订单状态: ${selectedOption.text}`);
			}
		}

		// 提取订单日期
		const dateInput = document.querySelector('#order_date');
		if (dateInput && dateInput.value) {
			data.basicInfo.push(`订单日期: ${dateInput.value}`);
		}

		// 提取客户信息
		const customerInput = document.querySelector('#customer_user');
		if (customerInput) {
			const selectedOption = customerInput.options[customerInput.selectedIndex];
			if (selectedOption && selectedOption.value) {
				data.basicInfo.push(`客户: ${selectedOption.text}`);
			}
		}

		// 提取客户IP
		const customerIp = document.querySelector('.order-customer-ip');
		if (customerIp) {
			const ipText = customerIp.textContent.replace('Customer IP:', '').trim();
			if (ipText) {
				data.basicInfo.push(`客户 IP: ${ipText}`);
			}
		}

		// 提取账单地址
		const billingFields = [
			{ id: '_billing_first_name', label: '名字' },
			{ id: '_billing_last_name', label: '姓氏' },
			{ id: '_billing_company', label: '公司' },
			{ id: '_billing_address_1', label: '地址 1' },
			{ id: '_billing_address_2', label: '地址 2' },
			{ id: '_billing_city', label: '城市' },
			{ id: '_billing_postcode', label: '邮编' },
			{ id: '_billing_country', label: '国家' },
			{ id: '_billing_state', label: '省份' },
			{ id: '_billing_email', label: '邮箱' },
			{ id: '_billing_phone', label: '电话' }
		];

		billingFields.forEach(field => {
			const input = document.querySelector(`#${field.id}`);
			if (input && input.value.trim()) {
				data.billingAddress.push(`${field.label}: ${input.value.trim()}`);
			}
		});

		// 提取配送地址
		const shippingFields = [
			{ id: '_shipping_first_name', label: '名字' },
			{ id: '_shipping_last_name', label: '姓氏' },
			{ id: '_shipping_company', label: '公司' },
			{ id: '_shipping_address_1', label: '地址 1' },
			{ id: '_shipping_address_2', label: '地址 2' },
			{ id: '_shipping_city', label: '城市' },
			{ id: '_shipping_postcode', label: '邮编' },
			{ id: '_shipping_country', label: '国家' },
			{ id: '_shipping_state', label: '省份' }
		];

		shippingFields.forEach(field => {
			const input = document.querySelector(`#${field.id}`);
			if (input && input.value.trim()) {
				data.shippingAddress.push(`${field.label}: ${input.value.trim()}`);
			}
		});

		// 提取订单商品
		const orderItemsTable = document.querySelector('#order_items_list, .woocommerce_order_items');
		if (orderItemsTable) {
			const itemRows = orderItemsTable.querySelectorAll('.item, tr.item');
			itemRows.forEach((row, index) => {
				const itemData = [];
				const nameEl = row.querySelector('.name, .item_name, td.name');
				const qtyEl = row.querySelector('.quantity, .item_quantity, td.quantity');
				const costEl = row.querySelector('.cost, .item_cost, td.cost');
				const totalEl = row.querySelector('.total, .line_total, td.total');

				if (nameEl) {
					itemData.push(`商品 ${index + 1}: ${nameEl.textContent.trim()}`);
				}
				if (qtyEl) {
					itemData.push(`  数量: ${qtyEl.textContent.trim()}`);
				}
				if (costEl) {
					itemData.push(`  单价: ${costEl.textContent.trim()}`);
				}
				if (totalEl) {
					itemData.push(`  小计: ${totalEl.textContent.trim()}`);
				}

				// 提取商品元数据
				const metaRows = row.querySelectorAll('.meta, .item_meta, .wc-order-item-meta');
				metaRows.forEach(meta => {
					const metaText = meta.textContent.trim();
					if (metaText) {
						itemData.push(`  ${metaText}`);
					}
				});

				if (itemData.length > 0) {
					data.items.push(itemData);
				}
			});
		}

		// 提取订单总计
		const totalsTable = document.querySelector('.wc-order-totals, #order_totals');
		if (totalsTable) {
			const totalRows = totalsTable.querySelectorAll('tr');
			totalRows.forEach(row => {
				const labelEl = row.querySelector('th, .label');
				const valueEl = row.querySelector('td, .total');
				if (labelEl && valueEl) {
					const label = labelEl.textContent.trim();
					const value = valueEl.textContent.trim();
					if (label && value) {
						data.totals.push(`${label}: ${value}`);
					}
				}
			});
		}

		// 如果没有找到总计，尝试其他选择器
		if (data.totals.length === 0) {
			const totalElements = document.querySelectorAll('.order-total, .wc-order-total');
			totalElements.forEach(el => {
				const text = el.textContent.trim();
				if (text) {
					data.totals.push(text);
				}
			});
		}

		return data;
	};

	const getI18n = () => {
		const i18n = window.pwcaAdminOrdersProductionPdf && window.pwcaAdminOrdersProductionPdf.i18n;
		return {
			generating: (i18n && i18n.generating) || '正在生成 PDF…',
			success: (i18n && i18n.success) || '已生成并开始下载',
			failed: (i18n && i18n.failed) || '生成失败',
		};
	};

	const onClickProductionPdf = async (event) => {
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
			await generateOrderDetailsPdf(container);
			stateText(container, i18n.success);
		} catch (err) {
			const message = err && err.message ? String(err.message) : i18n.failed;
			stateText(container, `${i18n.failed}：${message}`);
		} finally {
			setSpinner(container, false);
		}
	};

	document.addEventListener('click', onClickProductionPdf, false);
	document.addEventListener('click', onClickDetailsPdf, false);
})();
