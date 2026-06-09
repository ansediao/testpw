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

// 标记是否为从购物车进入的编辑模式：URL 中同时包含 edit=true 和 cart_key
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

const pwcaGetUseAsyncQueue = () => (
  window.VueUse && typeof window.VueUse.useAsyncQueue === 'function'
    ? window.VueUse.useAsyncQueue
    : null
);

const pwcaLogAsyncFlow = (level, message, payload) => {
  const method = typeof console[level] === 'function' ? console[level] : console.log;
  if (payload === undefined) {
    method.call(console, `[PW Canvas][AsyncFlow] ${message}`);
    return;
  }

  method.call(console, `[PW Canvas][AsyncFlow] ${message}`, payload);
};

const pwcaCreateAsyncContext = () => ({
  settings: getSettings(),
  startedAt: Date.now(),
  store: null,
  productData: null,
  activeViewPrintMethodsReady: false,
  multiViewReady: false,
  integration: null,
  externalCanvasState: null,
  errors: [],
  tasks: [],
  queueResults: [],
});

const pwcaCreateActionContext = (flowName, payload = {}) => ({
  flowName,
  startedAt: Date.now(),
  errors: [],
  tasks: [],
  queueResults: [],
  ...payload,
});

const pwcaRecordAsyncTask = (context, taskName, status, payload = {}) => {
  context.tasks.push({
    taskName,
    status,
    timestamp: Date.now(),
    ...payload,
  });
};

const pwcaRunAsyncTask = async (context, taskName, runner) => {
  const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
  pwcaLogAsyncFlow('info', `开始执行任务 ${taskName}`);

  try {
    await runner(context);
    const durationMs = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt);
    pwcaRecordAsyncTask(context, taskName, 'fulfilled', { durationMs });
    pwcaLogAsyncFlow('info', `任务完成: ${taskName}`, { durationMs });
  } catch (error) {
    const normalizedError = error instanceof Error ? error : new Error(String(error || 'Unknown error'));
    const durationMs = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt);
    context.errors.push({
      taskName,
      message: normalizedError.message,
    });
    pwcaRecordAsyncTask(context, taskName, 'rejected', {
      durationMs,
      message: normalizedError.message,
    });
    pwcaLogAsyncFlow('error', `任务失败: ${taskName}`, normalizedError);
  }

  return context;
};

const pwcaWaitForCanvasStore = async () => {
  const store = await waitFor(
    () => (typeof window.useCanvasStore === 'function' ? window.useCanvasStore() : null),
    { timeoutMs: 10000, intervalMs: 50 }
  );

  if (!store) {
    throw new Error('Canvas store is not ready.');
  }

  return store;
};

const pwcaRunStartupQueueWithVueUse = (tasks, context) => {
  const useAsyncQueue = pwcaGetUseAsyncQueue();
  if (!useAsyncQueue) return null;

  return new Promise((resolve) => {
    const { activeIndex, result } = useAsyncQueue(tasks, {
      interrupt: true, // 发生错误时中断，确保流程稳定
      onError: () => {
        const err = result[activeIndex.value];
        pwcaLogAsyncFlow('error', `队列任务失败 (索引: ${activeIndex.value}):`, err);
        context.errors.push({
          index: activeIndex.value,
          error: err
        });
      },
      onFinished: () => {
        pwcaLogAsyncFlow('info', '所有初始化任务结束');
        context.queueResults = result;
        resolve(context);
      },
    });
  });
};

const pwcaRunStartupQueueSequentially = async (tasks, context) => {
  let currentContext = context;
  for (const task of tasks) {
    currentContext = await task(currentContext);
  }
  return currentContext;
};

const pwcaRunStartupQueue = async (tasks, context) => {
  const useAsyncQueue = pwcaGetUseAsyncQueue();

  if (!useAsyncQueue) {
    pwcaLogAsyncFlow('warn', 'VueUse.useAsyncQueue not available, falling back to manual sequential execution');
    return pwcaRunStartupQueueSequentially(tasks, context);
  }

  return pwcaRunStartupQueueWithVueUse(tasks, context);
};

const pwcaCreateInterruptibleQueueTask = (context, taskName, runner) => (
  async (previousContext) => {
    const currentContext = previousContext || context;
    const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
    pwcaLogAsyncFlow('info', `开始执行任务 ${taskName}`);

    try {
      await runner(currentContext);
      const durationMs = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt);
      pwcaRecordAsyncTask(currentContext, taskName, 'fulfilled', { durationMs });
      pwcaLogAsyncFlow('info', `任务完成: ${taskName}`, { durationMs });
      return currentContext;
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error(String(error || 'Unknown error'));
      const durationMs = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt);
      currentContext.errors.push({
        taskName,
        message: normalizedError.message,
        error: normalizedError,
      });
      pwcaRecordAsyncTask(currentContext, taskName, 'rejected', {
        durationMs,
        message: normalizedError.message,
      });
      pwcaLogAsyncFlow('error', `任务失败: ${taskName}`, normalizedError);
      throw normalizedError;
    }
  }
);

const pwcaRunManagedQueueWithVueUse = (tasks, context, flowName) => {
  const useAsyncQueue = pwcaGetUseAsyncQueue();
  if (!useAsyncQueue) {
    return null;
  }

  return new Promise((resolve, reject) => {
    const { activeIndex, result } = useAsyncQueue(tasks, {
      interrupt: true,
      onError: () => {
        const err = result[activeIndex.value];
        pwcaLogAsyncFlow('error', `${flowName} 队列中断原因:`, err);
      },
      onFinished: () => {
        pwcaLogAsyncFlow('info', `${flowName} 所有任务结束`);
        context.queueResults = result;
        if (context.errors.length > 0) {
          reject(context.errors[0].error || new Error(`${flowName} failed`));
          return;
        }
        resolve(context);
      },
    });
  });
};

const pwcaRunManagedQueueSequentially = async (tasks, context) => {
  let currentContext = context;
  for (const task of tasks) {
    currentContext = await task(currentContext);
  }
  return currentContext;
};

const pwcaRunManagedQueue = async (tasks, context, flowName) => {
  const useAsyncQueue = pwcaGetUseAsyncQueue();

  if (!useAsyncQueue) {
    pwcaLogAsyncFlow('warn', `${flowName} 缺少 VueUse.useAsyncQueue，回退为手动串行执行`);
    return pwcaRunManagedQueueSequentially(tasks, context);
  }

  return pwcaRunManagedQueueWithVueUse(tasks, context, flowName);
};

const pwcaGetUiStateAccess = () => window.pwcaUiStateAccess || null;

const pwcaGetPageBootstrapCanvasStore = () => {
  const uiStateAccess = pwcaGetUiStateAccess();
  if (uiStateAccess && typeof uiStateAccess.pwcaGetCanvasStore === 'function') {
    return uiStateAccess.pwcaGetCanvasStore();
  }

  return typeof window.useCanvasStore === 'function' ? window.useCanvasStore() : null;
};

const pwcaGetPageBootstrapAllViewCanvases = () => {
  const uiStateAccess = pwcaGetUiStateAccess();
  if (uiStateAccess && typeof uiStateAccess.pwcaGetAllViewCanvases === 'function') {
    return uiStateAccess.pwcaGetAllViewCanvases();
  }

  return [];
};

const initFetchProductData = async () => {
  const { pwId } = getSettings();
  if (!pwId) return;

  const store = await pwcaWaitForCanvasStore();

  try {
    if (store && typeof store.fetchProductData === 'function') {
      return await store.fetchProductData(pwId);
    }
  } catch (error) {
    console.error('Failed to load product data:', error);
    throw error;
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
    console.warn('Failed to get print method names', e);
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
  const pwcaUseProductStore =
    typeof window.pwca_use_product_store === 'function'
      ? window.pwca_use_product_store
      : window.useProductStore;

  try {
    if (typeof pwcaUseProductStore === 'function') {
      const ps = pwcaUseProductStore();
      minOrderQuantity = parseInt(ps?.minQuantity, 10) || 1;
      batchQuantity = parseInt(ps?.stepQuantity, 10) || 1;
      sellInBatch = ps?.moqSettings?.sell_in_batch ? '1' : '0';
      discountEnabled = ps?.quantityDiscountEnabled ? '1' : '0';
      currentDiscount = Number(ps?.getCurrentDiscount || 0);
      discountText = ps?.getDiscountText || '';
      quantityDiscountsJson = JSON.stringify(ps?.quantityDiscounts || []);
    } else {
      const qtyEl = document.querySelector('.pwca-product-card__input');
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

const buildViewImagesPayload = async (previewContainerExists) => {
  let viewImagesPayload = [];
  try {
    pwcaGetPageBootstrapAllViewCanvases().forEach((fc, index) => {
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
        console.warn('清除单视图选中状态异常：', index, e);
      }
    });

    const store = pwcaGetPageBootstrapCanvasStore();
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
      console.error('[PW Canvas] 无法生成多视图图片：未发现视图数据或生成函数缺失');
      throw new Error('Failed to generate view images');
    }
  } catch (e) {
    console.warn('生成多视图图片时发生错误，将仅使用单图：', e);
  }
  return viewImagesPayload;
};

const readAccessoriesNames = (productId) => {
  const accessoriesStorageKey = `pwca-accessories-names-${productId}`;

  try {
    const raw = localStorage.getItem(accessoriesStorageKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((value) => typeof value === 'string' && value.trim() !== '')
      .map((value) => value.trim());
  } catch (e) {
    return [];
  }
};

const captureCanvasStateJson = () => {
  try {
    if (window.canvasStateManager && typeof window.canvasStateManager.saveAllViewStates === 'function') {
      window.canvasStateManager.saveAllViewStates();
      const state = window.canvasStateManager.getState();
      if (state) {
        return JSON.stringify(state);
      }
    }
  } catch (e) {
    console.warn('保存画布状态到购物车时发生错误，将继续提交但不携带画布状态', e);
  }

  return '';
};

const buildAddToCartRequestBody = ({
  settings,
  productId,
  quantity,
  customImage,
  moq,
  designFeeTotal,
  designs,
  viewImagesPayload,
  viewPrintMethods,
  canvasStateJson,
  accessoriesNames,
}) => {
  const body = new URLSearchParams();
  body.set('action', 'add_customized_product_to_cart');
  body.set('product_id', String(productId));
  body.set('quantity', String(quantity));
  body.set('custom_image', String(customImage || ''));
  body.set('color', String(window.pwca_current_color || ''));
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

  const sampleCheckbox = document.querySelector('.sample-check input#sample');
  const isSampleOrder = sampleCheckbox ? sampleCheckbox.checked : false;
  body.set('pw_is_sample', isSampleOrder ? '1' : '0');

  if (canvasStateJson) {
    body.set('pw_canvas_state', canvasStateJson);
  }

  if (accessoriesNames.length > 0) {
    body.set('pw_accessories_names', JSON.stringify(accessoriesNames));
  }

  return body;
};

const submitAddToCartRequest = async (settings, body) => {
  const response = await fetch(settings.ajaxUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body: body.toString(),
    credentials: 'same-origin',
  });

  return response.json();
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
    console.error('从购物车获取画布状态失败', e);
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

  const quantityInput = document.querySelector('.pwca-product-card__input');
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

  const canvasStateJson = captureCanvasStateJson();
  const accessoriesNames = readAccessoriesNames(productId);
  const body = buildAddToCartRequestBody({
    settings,
    productId,
    quantity,
    customImage,
    moq,
    designFeeTotal,
    designs,
    viewImagesPayload,
    viewPrintMethods,
    canvasStateJson,
    accessoriesNames,
  });

  try {
    const json = await submitAddToCartRequest(settings, body);
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

const toggleVisibleViewContainer = (viewId) => {
  const targetViewContainer = document.getElementById(`view-container-${viewId}`);
  if (!targetViewContainer) {
    return;
  }

  document.querySelectorAll('.pwca-view-container').forEach((container) => {
    container.style.display = 'none';
  });
  targetViewContainer.style.display = 'block';
};

const syncGlobalCanvasForView = (viewId) => {
  if (window.CanvasManager) {
    window.CanvasManager.setActiveCanvas(viewId);
  }

  const canvas = window.CanvasManager ? window.CanvasManager.getCanvas(viewId) : null;
  if (!canvas) {
    return null;
  }

  const allCanvasIds =
    window.CanvasManager && typeof window.CanvasManager.getAllCanvasIds === 'function'
      ? window.CanvasManager.getAllCanvasIds()
      : [];
  allCanvasIds.forEach((canvasId) => {
    const viewCanvas = window.CanvasManager ? window.CanvasManager.getCanvas(canvasId) : null;
    if (viewCanvas && typeof viewCanvas.discardActiveObject === 'function') {
      viewCanvas.discardActiveObject();
      if (typeof viewCanvas.renderAll === 'function') {
        viewCanvas.renderAll();
      }
    }
  });

  if (typeof window.pwcaSetGlobalCanvas === 'function') {
    window.pwcaSetGlobalCanvas(canvas);
  } else {
    window.canvas = canvas;
    window.fabricCanvas = canvas;
  }

  if (typeof canvas.renderAll === 'function') {
    canvas.renderAll();
  }

  return canvas;
};

const clearAllViewSelections = () => {
  const allViewCanvases = pwcaGetPageBootstrapAllViewCanvases();
  if (!Array.isArray(allViewCanvases) || allViewCanvases.length === 0) {
    return;
  }

  allViewCanvases.forEach((fc) => {
    if (!fc) {
      return;
    }

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
    } catch (error) {
      pwcaLogAsyncFlow('warn', '清理画布选中状态失败', error);
    }
  });
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

const waitForViewCanvasReady = async (viewId) => {
  const readyCanvas = await waitFor(() => {
    const canvas = window.CanvasManager && typeof window.CanvasManager.getCanvas === 'function'
      ? window.CanvasManager.getCanvas(viewId)
      : null;
    const viewContainer = document.getElementById(`view-container-${viewId}`);
    const isVisible = !!(viewContainer && viewContainer.style.display !== 'none');
    return canvas && isVisible ? canvas : null;
  }, { timeoutMs: 1200, intervalMs: 16 });

  if (!readyCanvas) {
    throw new Error(`View canvas is not ready for ${viewId}`);
  }

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  return readyCanvas;
};

const saveMultiViewPdfDocument = (productName, exportedImages) => {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF || exportedImages.length === 0) {
    throw new Error('jsPDF is not available or no exported images were generated.');
  }

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
};

const createPreviewRenderTasks = (context) => ([
  pwcaCreateInterruptibleQueueTask(context, 'resolvePreviewViews', async (currentContext) => {
    currentContext.store = currentContext.store || pwcaGetPageBootstrapCanvasStore();
    currentContext.views = Array.isArray(currentContext.views) && currentContext.views.length > 0
      ? currentContext.views
      : (currentContext.store && Array.isArray(currentContext.store.views) ? currentContext.store.views : []);

    if (!currentContext.store) {
      throw new Error('Canvas store is not ready for preview rendering.');
    }

    if (!currentContext.views.length) {
      throw new Error('No views available for preview rendering.');
    }
  }),
  pwcaCreateInterruptibleQueueTask(context, 'clearCanvasSelections', async () => {
    clearAllViewSelections();
  }),
  pwcaCreateInterruptibleQueueTask(context, 'showUniversalViewPreview', async (currentContext) => {
    if (typeof window.showUniversalViewPreview !== 'function') {
      throw new Error('window.showUniversalViewPreview is not defined.');
    }

    await window.showUniversalViewPreview(currentContext.views);
  }),
]);

const createMultiViewPdfTasks = (context) => {
  const tasks = [
    pwcaCreateInterruptibleQueueTask(context, 'resolvePdfViews', async (currentContext) => {
      currentContext.store = currentContext.store || pwcaGetPageBootstrapCanvasStore();
      currentContext.views = currentContext.store && Array.isArray(currentContext.store.views)
        ? currentContext.store.views
        : [];
      currentContext.originalActiveViewId = currentContext.store && currentContext.store.activeViewId
        ? currentContext.store.activeViewId
        : null;
      currentContext.exportedImages = [];

      if (!currentContext.store) {
        throw new Error('Canvas store is not ready for PDF generation.');
      }

      if (!currentContext.views.length) {
        throw new Error('No views available for PDF generation.');
      }
    }),
    pwcaCreateInterruptibleQueueTask(context, 'clearCanvasSelections', async () => {
      clearAllViewSelections();
    }),
  ];

  context.views.forEach((view) => {
    tasks.push(
      pwcaCreateInterruptibleQueueTask(context, `capturePdfView:${view.id}`, async (currentContext) => {
        currentContext.store.setActiveViewId(view.id);
        toggleVisibleViewContainer(view.id);
        syncGlobalCanvasForView(view.id);
        await waitForViewCanvasReady(view.id);

        const imageDataUrl = typeof window.captureViewForPDF === 'function'
          ? await window.captureViewForPDF(view.id)
          : null;

        if (!imageDataUrl) {
          throw new Error(`Failed to capture PDF image for view ${view.id}`);
        }

        currentContext.exportedImages.push({
          viewId: view.id,
          viewName: view.name,
          imageData: imageDataUrl,
        });
      })
    );
  });

  tasks.push(
    pwcaCreateInterruptibleQueueTask(context, 'saveMultiViewPdf', async (currentContext) => {
      saveMultiViewPdfDocument(currentContext.productName || 'Product', currentContext.exportedImages || []);
    })
  );

  return tasks;
};

const finalizeManagedActionFlow = (context) => {
  const durationMs = Date.now() - context.startedAt;
  pwcaLogAsyncFlow('info', `${context.flowName} finished`, {
    durationMs,
    errorCount: context.errors.length,
    tasks: context.tasks,
    queueResults: context.queueResults,
  });
  window.pwcaLastActionQueueContext = context;
  return context;
};

const runPreviewRenderFlow = async (store) => {
  const context = pwcaCreateActionContext('preview-render-flow', {
    store: store || null,
    views: store && Array.isArray(store.views) ? store.views : null,
  });
  const tasks = createPreviewRenderTasks(context);
  const finalContext = await pwcaRunManagedQueue(tasks, context, '预览渲染流程');
  return finalizeManagedActionFlow(finalContext);
};

const runGeneratePdfFlow = async (productName, store) => {
  const resolvedStore = store || pwcaGetPageBootstrapCanvasStore();
  const resolvedViews = resolvedStore && Array.isArray(resolvedStore.views) ? resolvedStore.views : [];
  const context = pwcaCreateActionContext('generate-pdf-flow', {
    productName,
    store: resolvedStore,
    views: resolvedViews,
    exportedImages: [],
    originalActiveViewId: resolvedStore ? resolvedStore.activeViewId : null,
  });

  try {
    const tasks = createMultiViewPdfTasks(context);
    const finalContext = await pwcaRunManagedQueue(tasks, context, 'PDF 生成流程');
    return finalizeManagedActionFlow(finalContext);
  } finally {
    if (context.store && context.originalActiveViewId) {
      context.store.setActiveViewId(context.originalActiveViewId);
      toggleVisibleViewContainer(context.originalActiveViewId);
      syncGlobalCanvasForView(context.originalActiveViewId);
    }
  }
};

const generateMultiViewPDF = async (productName, store) => runGeneratePdfFlow(productName, store);

const resolveCartEditKey = () => {
  if (window.pwcaCartKeyForCanvasEdit) {
    return window.pwcaCartKeyForCanvasEdit;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('cart_key') || '';
  } catch (e) {
    return '';
  }
};

const waitForCanvasStateIntegration = () =>
  new Promise((resolve) => {
    if (typeof window.pwcaEnsureCanvasStateIntegrationReady === 'function') {
      window.pwcaEnsureCanvasStateIntegrationReady()
        .then(resolve)
        .catch(() => resolve(window.canvasStateIntegration || null));
      return;
    }

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

const initCartEditCanvasState = async () => {
  const settings = getSettings();
  if (!settings || !settings.isEdit) {
    return;
  }

  const cartKey = resolveCartEditKey();

  if (!cartKey) {
    return;
  }

  const externalState = await fetchCartCanvasState(cartKey, settings);
  if (!externalState) {
    return;
  }

  // 将外部状态挂到全局，供 CanvasStateManager / CanvasStateIntegration 使用
  window.pwcaInitialCanvasState = externalState;

  try {
    const integration = await waitForCanvasStateIntegration();
    if (integration && typeof integration.applyExternalState === 'function') {
      await integration.applyExternalState(externalState);
    }
    return externalState;
  } catch (e) {
    console.error('应用购物车画布状态失败', e);
    throw e;
  }
};

const pwcaCreateStartupTask = (context, taskName, runner) => (
  (previousContext) => pwcaRunAsyncTask(previousContext || context, taskName, runner)
);

const pwcaStartupTaskWaitForCanvasStore = async (currentContext) => {
  currentContext.store = await pwcaWaitForCanvasStore();
};

const pwcaStartupTaskFetchProductData = async (currentContext) => {
  const { pwId } = currentContext.settings || {};
  if (!pwId) {
    pwcaLogAsyncFlow('warn', 'Missing pwId, skipping product data request');
    return;
  }

  currentContext.productData = await initFetchProductData();
};

const pwcaStartupTaskEnsureActiveViewPrintMethodsLoaded = async (currentContext) => {
  if (
    currentContext.store &&
    typeof currentContext.store.ensureActiveViewPrintMethodsLoaded === 'function'
  ) {
    await currentContext.store.ensureActiveViewPrintMethodsLoaded();
    currentContext.activeViewPrintMethodsReady = true;
  }
};

const pwcaStartupTaskInitializeMultiViewCanvases = async (currentContext) => {
  if (typeof window.pwcaEnsureMultiViewInitialization !== 'function') {
    throw new Error('pwcaEnsureMultiViewInitialization is not available.');
  }

  await window.pwcaEnsureMultiViewInitialization(currentContext.store);
  currentContext.multiViewReady = true;
};

const pwcaStartupTaskInitializeCanvasStateIntegration = async (currentContext) => {
  if (typeof window.pwcaEnsureCanvasStateIntegrationReady !== 'function') {
    return;
  }

  currentContext.integration = await window.pwcaEnsureCanvasStateIntegrationReady();
};

const pwcaStartupTaskRestoreCartEditCanvasState = async (currentContext) => {
  if (!currentContext.settings || !currentContext.settings.isEdit) {
    return;
  }

  currentContext.externalCanvasState = await initCartEditCanvasState();
};

const pwcaStartupTaskSyncUiState = async (currentContext) => {
  if (typeof window.pwcaBindOperationPanelModuleSync === 'function') {
    window.pwcaBindOperationPanelModuleSync();
  }
};

/**
 * 同步 footer 区域可见性
 * 从 #app data-* 属性读取服务器端确认的值（绕过缓存，最可靠）
 * 同步到 store computed，并通过 Vue watch 响应后续变化
 */
const pwcaStartupTaskSyncFooterVisibility = async (currentContext) => {
  const store = window.useCanvasStore && window.useCanvasStore();
  if (!store) return;

  // 从 #app data-* 读取（PHP 服务端渲染时直接读取 post meta，无缓存问题）
  const appEl = document.getElementById('app');
  const blankItem = appEl?.dataset?.blankItem === '1';
  const inquiryBtn = appEl?.dataset?.inquiryButton === '1';

  // 同步到 store computed，确保 Pinia 中的值与服务端一致
  if (store.productData?.computed) {
    store.productData.computed.blank_item = blankItem;
    store.productData.computed.inquiry_button = inquiryBtn;
  }

  const { watch } = window.Vue || {};

  const syncVisibility = () => {
    const elSample = document.getElementById('pwca-sample-check');
    const elInquiry = document.getElementById('pwca-inquiry-btn');

    if (elSample) {
      elSample.style.display = store.showSampleCheck ? '' : 'none';
    }
    if (elInquiry) {
      elInquiry.style.display = store.showInquiryBtn ? '' : 'none';
    }
  };

  // 立即同步一次
  syncVisibility();

  // 响应式监听 store getters 后续变化（支持控制台动态调试和未来业务逻辑叠加）
  if (watch) {
    watch(
      () => [store.showSampleCheck, store.showInquiryBtn],
      () => syncVisibility()
    );
  }
};

const buildStartupTasks = (context) => {
  // 定义初始化任务序列
  const tasks = [
    // 1. 等待 Pinia Store 就绪
    pwcaCreateStartupTask(context, 'waitForCanvasStore', pwcaStartupTaskWaitForCanvasStore),
    
    // 2. 获取产品基础数据与配置
    pwcaCreateStartupTask(context, 'fetchProductData', pwcaStartupTaskFetchProductData),
    
    // 3. 加载当前视图的印刷方式
    pwcaCreateStartupTask(
      context,
      'ensureActiveViewPrintMethodsLoaded',
      pwcaStartupTaskEnsureActiveViewPrintMethodsLoaded
    ),
    
    // 4. 初始化多视图画布 (Fabric.js 实例)
    pwcaCreateStartupTask(
      context,
      'initializeMultiViewCanvases',
      pwcaStartupTaskInitializeMultiViewCanvases
    ),

    // 5. 初始化同步 UI 状态（面板可见性等）
    pwcaCreateStartupTask(context, 'syncUiState', pwcaStartupTaskSyncUiState),

    // 5.1 同步 footer 可见性（blank_item → sample-check, inquiry_button → inquiry-btn）
    pwcaCreateStartupTask(context, 'syncFooterVisibility', pwcaStartupTaskSyncFooterVisibility),

    // 6. 初始化画布状态集成（保存/回显逻辑）
    pwcaCreateStartupTask(
      context,
      'initializeCanvasStateIntegration',
      pwcaStartupTaskInitializeCanvasStateIntegration
    ),

    // 7. 如果是编辑模式，还原购物车中的画布状态
    pwcaCreateStartupTask(
      context,
      'restoreCartEditCanvasState',
      pwcaStartupTaskRestoreCartEditCanvasState
    ),
  ];

  return tasks;
};

const finalizeAsyncStartup = (finalContext) => {
  const durationMs = Date.now() - finalContext.startedAt;
  pwcaLogAsyncFlow('info', 'Design page async startup flow finished', {
    durationMs,
    errorCount: finalContext.errors.length,
    tasks: finalContext.tasks,
    queueResults: finalContext.queueResults,
  });

  window.pwcaCanvasAsyncContext = finalContext;
  return finalContext;
};

const pwcaInitializeAsyncStartup = async () => {
  const context = pwcaCreateAsyncContext();
  const tasks = buildStartupTasks(context);
  
  // 使用 useAsyncQueue 执行任务序列
  const finalContext = await pwcaRunStartupQueue(tasks, context);
  
  // 结束初始化流程
  const resolvedContext = finalizeAsyncStartup(finalContext);
  
  return resolvedContext;
};

const bindAddToCartButton = () => {
  const addToCartBtn = document.getElementById('addToCartBtn');
  if (!addToCartBtn) {
    return;
  }

  addToCartBtn.addEventListener('click', () => {
    addCustomizedProductToCart();
  });
};

const initializePageBootstrap = () => {
  bindAddToCartButton();
  window.pwcaCanvasStartupPromise = pwcaInitializeAsyncStartup().catch((error) => {
    pwcaLogAsyncFlow('error', 'Uncaught exception in design page async startup flow', error);
    throw error;
  });
};

onReady(() => {
  initializePageBootstrap();
});


window.generateMultiViewPDF = generateMultiViewPDF;
window.pwcaRunPreviewRenderFlow = runPreviewRenderFlow;
window.pwcaRunGeneratePdfFlow = runGeneratePdfFlow;
