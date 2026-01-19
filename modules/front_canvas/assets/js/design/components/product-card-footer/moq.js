/*
 * MOQ 显示与计算模块（Product Card Footer）
 * 暴露：showDesign、showColor、moqDesignText、moqColorText、calculatedMoq
 */
const { computed } = window.Vue;

export function useMoqCalculations(canvasStore, printStore) {
  // 颜色选择带来的最大 MOQ
  const maxUsedColorMoqQuantity = computed(() => {
    let max = 0;
    const colorsMap = canvasStore?.selectedColorsByView || {};
    for (const viewId in colorsMap) {
      if (!Object.prototype.hasOwnProperty.call(colorsMap, viewId)) continue;
      const colorData = colorsMap[viewId];
      if (!colorData || !colorData.moq_setting) continue;
      let moqSetting = colorData.moq_setting;
      if (moqSetting && moqSetting._custom && moqSetting._custom.value) {
        moqSetting = moqSetting._custom.value;
      }
      const moqEnabled = moqSetting && (moqSetting.enable === true || moqSetting.enable === 1 || moqSetting.enable === '1' || moqSetting.enable === 'true');
      if (!moqEnabled) continue;
      const qty = Number(moqSetting.minimum_order_quantity);
      if (Number.isFinite(qty) && qty > max) {
        max = qty;
      }
    }
    return max;
  });

  // 颜色与印刷方式综合后的最终 MOQ
  const calculatedMoq = computed(() => {
    let maxColorMoq = 0;
    let maxPrintMethodMoq = 0;
    let productMoq = 0;

    const colorsMap = canvasStore?.selectedColorsByView || {};
    for (const viewId in colorsMap) {
      if (!Object.prototype.hasOwnProperty.call(colorsMap, viewId)) continue;
      const colorData = colorsMap[viewId];
      if (!colorData || !colorData.moq_setting) continue;
      let moqSetting = colorData.moq_setting;
      if (moqSetting && moqSetting._custom && moqSetting._custom.value) {
        moqSetting = moqSetting._custom.value;
      }
      const moqEnabled = moqSetting && (moqSetting.enable === true || moqSetting.enable === 1 || moqSetting.enable === '1' || moqSetting.enable === 'true');
      if (!moqEnabled) continue;
      const qty = Number(moqSetting.minimum_order_quantity);
      if (Number.isFinite(qty) && qty > maxColorMoq) {
        maxColorMoq = qty;
      }
    }

    if (printStore && printStore.usedPrintMethodsByView) {
      const usedPrintMethodsByView = printStore.usedPrintMethodsByView || {};
      for (const viewId in usedPrintMethodsByView) {
        if (!Object.prototype.hasOwnProperty.call(usedPrintMethodsByView, viewId)) continue;
        const methodsMap = usedPrintMethodsByView[viewId] || {};
        for (const methodId in methodsMap) {
          if (!Object.prototype.hasOwnProperty.call(methodsMap, methodId)) continue;
          const method = methodsMap[methodId];
          if (!method || !method.apiData) continue;
          const api = method.apiData;
          const moqEnabled = api.moq_enabled === true || api.moq_enabled === 1 || api.moq_enabled === '1' || api.moq_enabled === 'true';
          if (!moqEnabled) continue;
          const qty = Number(api.moq_quantity);
          if (Number.isFinite(qty) && qty > maxPrintMethodMoq) {
            maxPrintMethodMoq = qty;
          }
        }
      }
    }

    try {
      const pd = canvasStore?.productData?.product?.data;
      if (pd && pd.sell_in_batch_info && pd.sell_in_batch_info.moq_quantity !== undefined) {
        const q = Number(pd.sell_in_batch_info.moq_quantity);
        if (Number.isFinite(q) && q > productMoq) productMoq = q;
      }
      if (pd && pd.moq_setting && pd.moq_setting.minimum_order_quantity !== undefined) {
        const q = Number(pd.moq_setting.minimum_order_quantity);
        if (Number.isFinite(q) && q > productMoq) productMoq = q;
      }
    } catch (e) {}

    const finalMoq = Math.max(maxColorMoq, maxPrintMethodMoq, productMoq);
    return finalMoq > 0 ? finalMoq : 1;
  });

  // 是否在 API 配置中启用样品订单（样品订单通常 MOQ 为 1）
  const isSampleOrderEnabledByApi = computed(() => {
    try {
      const val = canvasStore?.productData?.customization_settings?.data?.moq_sample_order;
      return val === true || val === 1 || val === '1' || val === 'true';
    } catch (e) {
      return false;
    }
  });

  // 展示开关
  const showDesign = computed(() => !!canvasStore.shouldShowMoqDesign);
  const showColor = computed(() => {
    if (Object.prototype.hasOwnProperty.call(canvasStore, 'shouldShowMoqColor')) {
      return !!canvasStore.shouldShowMoqColor;
    } else {
      const raw = canvasStore?.productData?.customization_settings?.data?.moq_items_color;
      return !(raw === false || raw === 0 || raw === 'false' || raw === '0' || raw === null || raw === undefined);
    }
  });

  // MOQ 数量与文案
  const moqDesignQty = computed(() => {
    if (isSampleOrderEnabledByApi.value) return 1;
    const maxQty = Number(printStore ? printStore.getMaxUsedMoqQuantity : 0);
    return Number.isFinite(maxQty) ? maxQty : 0;
  });

  const moqColorQty = computed(() => {
    if (isSampleOrderEnabledByApi.value) return 1;
    const maxQty = Number(maxUsedColorMoqQuantity.value || 0);
    return Number.isFinite(maxQty) ? maxQty : 0;
  });

  const moqDesignText = computed(() => `${moqDesignQty.value}Pcs / Design`);
  const moqColorText = computed(() => `${moqColorQty.value}Pcs / Color`);

  return { showDesign, showColor, moqDesignText, moqColorText, calculatedMoq };
}