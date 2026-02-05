const getSettings = () => {
  const settings = window.pwcaFrontCanvasSettings;
  if (!settings || typeof settings !== 'object') {
    const appEl = document.getElementById('app');
    const dataset = appEl && appEl.dataset ? appEl.dataset : {};
    return {
      productId: Number(dataset.productId || 0),
      pwId: String(dataset.pwId || ''),
      isEdit: String(dataset.editMode || '0') === '1',
      ajaxUrl: String(dataset.ajaxUrl || ''),
      cartUrl: String(dataset.cartUrl || ''),
      ajaxNonce: String(dataset.ajaxNonce || ''),
      restUrl: String(dataset.restUrl || ''),
      nonce: String(dataset.restNonce || ''),
    };
  }
  return settings;
};

// 标记是否为从购物车进入的编辑模式：URL 中同时包含 edit=true 与 cart_key
(() => {
  try {
    const params = new URLSearchParams(window.location.search);
    const isEdit = params.get('edit') === 'true' || params.get('edit') === '1';
    const cartKey = params.get('cart_key');
    window.pwcaCanvasEditFromCart = !!(isEdit && cartKey);
    if (window.pwcaCanvasEditFromCart) {
      window.pwcaCartKeyForCanvasEdit = cartKey;
    }
  } catch (e) {
    window.pwcaCanvasEditFromCart = false;
  }
})();

const onReady = (handler) => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handler, { once: true });
    return;
  }
  handler();
};

const waitFor = async (predicate, { timeoutMs = 8000, intervalMs = 50 } = {}) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const value = predicate();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return null;
};

const initColorSwitchButtons = () => {
  const buttons = document.querySelectorAll('.color-switch-btn');
  if (!buttons || buttons.length === 0) return;

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const imageUrl = button.getAttribute('data-image-url');
      const shadowLayer = document.getElementById('shadowLayer');
      if (!shadowLayer || !imageUrl) return;
      shadowLayer.setAttribute('data-color-image', imageUrl);
      if (typeof window.initCanvas === 'function') {
        window.initCanvas();
      }
    });
  });
};

const initFetchProductData = async () => {
  const { pwId } = getSettings();
  if (!pwId) return;

  const useCanvasStore = await waitFor(() => (typeof window.useCanvasStore === 'function' ? window.useCanvasStore : null));
  if (!useCanvasStore) return;

  try {
    const store = useCanvasStore();
    if (store && typeof store.fetchProductData === 'function') {
      await store.fetchProductData(pwId);
    }
  } catch (error) {
    console.error('加载产品数据失败:', error);
  }
};

const buildDesignPayload = () => {
  const ds =
    typeof window.useDesignUsageStore === 'function' && window.pinia ? window.useDesignUsageStore(window.pinia) : null;

  const designList = ds && Array.isArray(ds.list) ? ds.list : [];
  const payload = designList.map((item) => ({
    name: String(item?.name || ''),
    image: String(item?.image || ''),
    sku: String(item?.sku || ''),
    quantity: Number(item?.quantity || 0),
  }));

  const designFeeTotal = ds ? Number(ds.totalFee || 0) : 0;

  return {
    designs: payload,
    designFeeTotal: Number.isFinite(designFeeTotal) ? designFeeTotal : 0,
  };
};

const buildViewPrintMethodsPayload = () => {
  const payload = [];
  try {
    const store = typeof window.usePrintMethodStore === 'function' ? window.usePrintMethodStore() : null;
    const byView = store && store.usedPrintMethodsByView ? store.usedPrintMethodsByView : null;
    if (!byView) return payload;

    Object.keys(byView).forEach((viewId) => {
      const methodsMap = byView[viewId] || {};
      const methodNames = [];

      Object.keys(methodsMap).forEach((methodId) => {
        const method = methodsMap[methodId];
        if (method && method.name) methodNames.push(method.name);
      });

      if (methodNames.length > 0) {
        payload.push({
          view_id: viewId,
          print_methods: methodNames,
        });
      }
    });
  } catch (e) {
    console.warn('获取印刷方式名称失败：', e);
  }

  return payload;
};

const resolveMoqAndDiscount = () => {
  let minOrderQuantity = 1;
  let batchQuantity = 1;
  let sellInBatch = '0';
  let discountEnabled = '0';
  let currentDiscount = 0;
  let discountText = '';
  let quantityDiscountsJson = '[]';

  try {
    if (typeof window.useProductStore === 'function') {
      const ps = window.useProductStore();
      minOrderQuantity = parseInt(ps?.minQuantity, 10) || 1;
      batchQuantity = parseInt(ps?.stepQuantity, 10) || 1;
      sellInBatch = ps?.moqSettings?.sell_in_batch ? '1' : '0';
      discountEnabled = ps?.quantityDiscountEnabled ? '1' : '0';
      currentDiscount = Number(ps?.getCurrentDiscount || 0);
      discountText = ps?.getDiscountText || '';
      quantityDiscountsJson = JSON.stringify(ps?.quantityDiscounts || []);
    } else {
      const qtyEl = document.querySelector('.product-card__input');
      minOrderQuantity = qtyEl ? parseInt(qtyEl.getAttribute('min') || '1', 10) || 1 : 1;
      batchQuantity = qtyEl ? parseInt(qtyEl.getAttribute('step') || '1', 10) || 1 : 1;
    }
  } catch (e) {
    console.warn('读取 MOQ/折扣信息失败，使用默认值：', e);
  }

  return {
    minOrderQuantity,
    batchQuantity,
    sellInBatch,
    discountEnabled,
    currentDiscount,
    discountText,
    quantityDiscountsJson,
  };
};

const capturePrimaryImage = async (previewContainerExists) => {
  if (previewContainerExists) {
    if (typeof window.capturePreviewCanvas === 'function') {
      return window.capturePreviewCanvas();
    }
    return '';
  }

  if (typeof window.captureCanvas === 'function') {
    return window.captureCanvas();
  }
  return '';
};

const buildViewImagesPayload = async (previewContainerExists) => {
  let viewImagesPayload = [];
  try {
    if (window.CanvasManager && typeof window.CanvasManager.getAllCanvasIds === 'function') {
      const allCanvasIds = window.CanvasManager.getAllCanvasIds();
      allCanvasIds.forEach((viewId) => {
        const fc = window.CanvasManager.getCanvas(viewId);
        if (!fc) return;
        try {
          const active = typeof fc.getActiveObject === 'function' ? fc.getActiveObject() : null;
          if (active && active.isEditing && typeof active.exitEditing === 'function') {
            active.exitEditing();
          }
          if (typeof fc.discardActiveObject === 'function') {
            fc.discardActiveObject();
          }
          if (typeof fc.renderAll === 'function') {
            fc.renderAll();
          }
        } catch (e) {
          console.warn('清除单视图选中状态异常：', viewId, e);
        }
      });
    }

    const store = typeof window.useCanvasStore === 'function' ? window.useCanvasStore() : null;
    const views = store && Array.isArray(store.views) ? store.views : [];

    if (views.length > 0 && typeof window.generateUniversalViewImages === 'function') {
      const images = await window.generateUniversalViewImages(views);
      viewImagesPayload = images.map((imgData, idx) => {
        const v = views[idx] || {};
        const imageArray = Array.isArray(imgData) ? imgData : [imgData];
        return {
          id: v.id || v.view_id || `view-${idx + 1}`,
          name: v.name || v.view_name || `视图 ${idx + 1}`,
          images: imageArray,
        };
      });
    } else {
      const singleImage = await capturePrimaryImage(previewContainerExists);
      viewImagesPayload = [
        {
          id: 'single',
          name: '视图',
          images: [singleImage],
        },
      ];
    }
  } catch (e) {
    console.warn('生成多视图图片时发生错误，将仅使用单图：', e);
  }
  return viewImagesPayload;
};

/**
 * 从购物车获取当前行项目的完整画布状态
 * 仅在编辑模式下（edit=true 且具有 cart_key）使用
 */
const fetchCartCanvasState = async (cartKey, settings) => {
  if (!cartKey || !settings || !settings.ajaxUrl) {
    return null;
  }

  const body = new URLSearchParams();
  body.set('action', 'pw_get_cart_canvas_state');
  body.set('cart_key', String(cartKey));
  body.set('security', String(settings.ajaxNonce || ''));

  try {
    const response = await fetch(settings.ajaxUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: body.toString(),
      credentials: 'same-origin',
    });

    const json = await response.json();
    if (json && json.success && json.data && json.data.canvas_state) {
      return json.data.canvas_state;
    }
    return null;
  } catch (e) {
    console.error('从购物车获取画布状态失败:', e);
    return null;
  }
};

const addCustomizedProductToCart = async () => {
  const settings = getSettings();
  const productId = Number(settings.productId || 0);
  if (!productId) {
    alert('未指定产品，无法加入购物车');
    return;
  }

  const quantityInput = document.querySelector('.product-card__input');
  const quantity = quantityInput ? parseInt(quantityInput.value || '1', 10) || 1 : 1;
  if (quantity <= 0) {
    alert('请输入有效的数量');
    return;
  }

  const previewContainerExists = !!document.querySelector('.preview-canvas-container');
  const moq = resolveMoqAndDiscount();
  const { designs, designFeeTotal } = buildDesignPayload();
  const viewPrintMethods = buildViewPrintMethodsPayload();

  let customImage = await capturePrimaryImage(previewContainerExists);
  const viewImagesPayload = await buildViewImagesPayload(previewContainerExists);
  if (viewImagesPayload.length > 0 && Array.isArray(viewImagesPayload[0].images) && viewImagesPayload[0].images.length > 0) {
    customImage = viewImagesPayload[0].images[0];
  }

  if (!settings.ajaxUrl) {
    alert('系统配置缺失，无法加入购物车');
    return;
  }

  // 在提交前尽量保存并获取当前产品的完整画布状态
  let canvasStateJson = '';
  try {
    if (window.canvasStateManager && typeof window.canvasStateManager.saveAllViewStates === 'function') {
      window.canvasStateManager.saveAllViewStates();
      const state = window.canvasStateManager.getState();
      if (state) {
        canvasStateJson = JSON.stringify(state);
      }
    }
  } catch (e) {
    console.warn('保存画布状态到购物车时发生错误，将继续提交但不携带画布状态:', e);
  }

  const accessoriesStorageKey = `pwca-accessories-names-${productId}`;
  let accessoriesNames = [];
  try {
    const raw = localStorage.getItem(accessoriesStorageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        accessoriesNames = parsed.filter(v => typeof v === 'string' && v.trim() !== '').map(v => v.trim());
      }
    }
  } catch (e) {
  }

  const body = new URLSearchParams();
  body.set('action', 'add_customized_product_to_cart');
  body.set('product_id', String(productId));
  body.set('quantity', String(quantity));
  body.set('custom_image', String(customImage || ''));
  body.set('color', String(window.currentColor || ''));
  body.set('security', String(settings.ajaxNonce || ''));
  body.set('pw_min_order_quantity', String(moq.minOrderQuantity));
  body.set('pw_batch_quantity', String(moq.batchQuantity));
  body.set('pw_sell_in_batch', String(moq.sellInBatch));
  body.set('pw_discount_enabled', String(moq.discountEnabled));
  body.set('pw_current_discount', String(moq.currentDiscount));
  body.set('pw_discount_text', String(moq.discountText));
  body.set('pw_quantity_discounts', String(moq.quantityDiscountsJson));
  body.set('pw_view_images', JSON.stringify(viewImagesPayload || []));
  body.set('pw_design_fee_total', String(designFeeTotal));
  body.set('pw_designs', JSON.stringify(designs));
  body.set('pw_view_print_methods', JSON.stringify(viewPrintMethods));
  if (canvasStateJson) {
    body.set('pw_canvas_state', canvasStateJson);
  }
  if (accessoriesNames.length > 0) {
    body.set('pw_accessories_names', JSON.stringify(accessoriesNames));
  }

  try {
    const response = await fetch(settings.ajaxUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: body.toString(),
      credentials: 'same-origin',
    });

    const json = await response.json();
    if (json && json.success) {
      const cartUrl = settings.cartUrl || '/cart/';
      window.location.href = cartUrl;
      return;
    }

    const errorMessage = json?.data || '未知错误';
    alert(`加入购物车失败: ${errorMessage}`);
  } catch (e) {
    console.error('加入购物车时出错:', e);
    alert('加入购物车时出错，请重试');
  }
};

const generateSingleViewPDF = async (productName) => {
  const previewContainerExists = !!document.querySelector('.preview-canvas-container');
  const imageData = await capturePrimaryImage(previewContainerExists);
  if (!imageData) return;

  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    title: `${productName} - 定制预览`,
    subject: '在线定制预览',
    author: 'PW在线定制系统',
    creator: 'PW在线定制系统',
    format: 'a4',
  });

  doc.setFontSize(16);
  doc.text('Preview', 105, 20, { align: 'center' });
  if (productName) {
    doc.setFontSize(14);
    doc.text(`Product: ${productName}`, 105, 30, { align: 'center' });
  }

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  doc.addImage(imageData, 'PNG', margin, 40, maxWidth, maxWidth);

  const currentTime = new Date();
  doc.setFontSize(10);
  doc.text(`Time: ${currentTime.toLocaleString()}`, 105, pageHeight - 10, { align: 'center' });

  const timeStr = currentTime
    .toLocaleString()
    .replace(/[:/]/g, '-')
    .replace(/,/g, '');
  const fileName = `${productName}_规格书_${timeStr}.pdf`;
  doc.save(fileName);
};

const generateMultiViewPDF = async (productName, store) => {
  if (!store || !Array.isArray(store.views) || store.views.length === 0) return;

  const originalActiveViewId = store.activeViewId;
  const exportedImages = [];

  try {
    for (const view of store.views) {
      store.setActiveViewId(view.id);

      const viewContainer = document.getElementById(`view-container-${view.id}`);
      if (viewContainer) {
        document.querySelectorAll('.view-container').forEach((container) => {
          container.style.display = 'none';
        });
        viewContainer.style.display = 'block';
      }

      if (window.CanvasManager) {
        window.CanvasManager.setActiveCanvas(view.id);
      }

      const canvas = window.CanvasManager ? window.CanvasManager.getCanvas(view.id) : null;
      if (canvas) {
        const allCanvasIds = window.CanvasManager && typeof window.CanvasManager.getAllCanvasIds === 'function' ? window.CanvasManager.getAllCanvasIds() : [];
        allCanvasIds.forEach((canvasId) => {
          const viewCanvas = window.CanvasManager ? window.CanvasManager.getCanvas(canvasId) : null;
          if (viewCanvas && typeof viewCanvas.discardActiveObject === 'function') {
            viewCanvas.discardActiveObject();
            if (typeof viewCanvas.renderAll === 'function') viewCanvas.renderAll();
          }
        });

        if (typeof window.setGlobalCanvas === 'function') {
          window.setGlobalCanvas(canvas);
        } else {
          window.canvas = canvas;
          window.fabricCanvas = canvas;
        }

        if (typeof canvas.renderAll === 'function') canvas.renderAll();
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      const imageDataUrl = typeof window.captureViewForPDF === 'function' ? await window.captureViewForPDF(view.id) : null;
      if (imageDataUrl) {
        exportedImages.push({
          viewName: view.name,
          imageData: imageDataUrl,
        });
      }
    }

    const { jsPDF } = window.jspdf || {};
    if (!jsPDF || exportedImages.length === 0) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      title: `${productName} - 多视图定制预览`,
      subject: '在线定制预览',
      author: 'PW在线定制系统',
      creator: 'PW在线定制系统',
      format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    const maxImageHeight = 120;

    doc.setFontSize(18);
    doc.text('Multi-View Preview', 105, 30, { align: 'center' });
    if (productName) {
      doc.setFontSize(16);
      doc.text(`Product: ${productName}`, 105, 45, { align: 'center' });
    }
    doc.setFontSize(12);
    doc.text(`Total Views: ${exportedImages.length}`, 105, 60, { align: 'center' });

    exportedImages.forEach((item, index) => {
      if (index > 0) {
        doc.addPage();
      }

      doc.setFontSize(16);
      doc.text(`View: ${item.viewName}`, 105, 80, { align: 'center' });

      doc.addImage(item.imageData, 'PNG', margin, 90, maxWidth, maxImageHeight);

      doc.setFontSize(10);
      doc.text(`Page ${index + 1} of ${exportedImages.length}`, 105, pageHeight - 20, { align: 'center' });
    });

    const currentTime = new Date();
    doc.setFontSize(10);
    doc.text(`Generated: ${currentTime.toLocaleString()}`, 105, pageHeight - 10, { align: 'center' });

    const timeStr = currentTime
      .toLocaleString()
      .replace(/[:/]/g, '-')
      .replace(/,/g, '');
    doc.save(`${productName}_多视图规格书_${timeStr}.pdf`);
  } finally {
    if (originalActiveViewId) {
      store.setActiveViewId(originalActiveViewId);

      const originalViewContainer = document.getElementById(`view-container-${originalActiveViewId}`);
      if (originalViewContainer) {
        document.querySelectorAll('.view-container').forEach((container) => {
          container.style.display = 'none';
        });
        originalViewContainer.style.display = 'block';
      }

      if (window.CanvasManager) {
        window.CanvasManager.setActiveCanvas(originalActiveViewId);
      }

      const originalCanvas = window.CanvasManager ? window.CanvasManager.getCanvas(originalActiveViewId) : null;
      if (originalCanvas) {
        if (typeof window.setGlobalCanvas === 'function') {
          window.setGlobalCanvas(originalCanvas);
        } else {
          window.canvas = originalCanvas;
          window.fabricCanvas = originalCanvas;
        }
        if (typeof originalCanvas.renderAll === 'function') originalCanvas.renderAll();
      }
    }
  }
};

const initCartEditCanvasState = async () => {
  const settings = getSettings();
  if (!settings || !settings.isEdit) {
    return;
  }

  const cartKey = window.pwcaCartKeyForCanvasEdit || (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('cart_key') || '';
    } catch (e) {
      return '';
    }
  })();

  if (!cartKey) {
    return;
  }

  const externalState = await fetchCartCanvasState(cartKey, settings);
  if (!externalState) {
    return;
  }

  // 将外部状态挂到全局，供 CanvasStateManager / CanvasStateIntegration 使用
  window.pwcaInitialCanvasState = externalState;

  // 等待 CanvasStateIntegration 就绪后应用外部状态
  const waitForIntegration = () =>
    new Promise((resolve) => {
      if (
        window.canvasStateIntegration &&
        typeof window.canvasStateIntegration.applyExternalState === 'function' &&
        typeof window.canvasStateIntegration.isInitialized === 'function' &&
        window.canvasStateIntegration.isInitialized()
      ) {
        resolve(window.canvasStateIntegration);
        return;
      }

      const handler = (event) => {
        if (event && event.detail && event.detail.integration) {
          resolve(event.detail.integration);
        } else {
          resolve(window.canvasStateIntegration || null);
        }
      };
      document.addEventListener('canvasStateIntegrationReady', handler, { once: true });
    });

  try {
    const integration = await waitForIntegration();
    if (integration && typeof integration.applyExternalState === 'function') {
      await integration.applyExternalState(externalState);
    }
  } catch (e) {
    console.error('应用购物车画布状态失败:', e);
  }
};

onReady(() => {
  initColorSwitchButtons();
  initFetchProductData();
  // 如果是从购物车进入的编辑模式，尝试恢复对应行项目的完整画布状态
  initCartEditCanvasState();

  // 基于 products/{product_id}/updated-at 检查远程数据是否更新，
  // 如价格发生变化则由后端同步 WooCommerce 价格，并在前端刷新页面。
  (async () => {
    try {
      const settings = getSettings();
      const pwId = settings.pwId;
      if (!pwId) {
        return;
      }

      const restBase = (settings.restUrl || '/wp-json/').replace(/\/?$/, '/');
      const syncUrl = `${restBase}pw-canvas/v1/product-sync-status/${encodeURIComponent(pwId)}`;

      const response = await fetch(syncUrl, {
        method: 'GET',
        credentials: 'same-origin'
      });

      let payload;

      if (!response.ok) {
        try {
          payload = await response.json();
        } catch (e) {
          payload = null;
        }

        const message = (payload && (payload.error || payload.message))
          ? String(payload.error || payload.message)
          : `无法检查产品最新价格（HTTP ${response.status}）`;

        window.alert(message);
        return;
      }

      payload = await response.json();
      if (!payload || payload.success === false) {
        const message = (payload && (payload.error || payload.message))
          ? String(payload.error || payload.message)
          : '无法检查产品最新价格，请稍后重试。';

        window.alert(message);
        return;
      }

      if (payload.price_changed && payload.price_synced) {
        window.alert('该产品的价格已在后台更新，页面将刷新以显示最新价格。');
        window.setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (e) {
      window.alert('无法检查产品最新价格，请检查网络连接或稍后重试。');
    }
  })();

  const addToCartBtn = document.getElementById('addToCartBtn');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => addCustomizedProductToCart());
  }
});

window.generateSingleViewPDF = generateSingleViewPDF;
window.generateMultiViewPDF = generateMultiViewPDF;
