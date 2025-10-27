/*
 * 价格显示与计算模块（Product Card Footer）
 * 暴露：basePrice、customizationPrice
 */
const { computed } = window.Vue;

export function usePriceCalculations(canvasStore, printStore) {
  const maxPriceFromSelectedColors = computed(() => {
    let maxPrice = 0;
    const colorsMap = canvasStore?.selectedColorsByView || {};
    for (const viewId in colorsMap) {
      if (!Object.prototype.hasOwnProperty.call(colorsMap, viewId)) continue;
      const colorData = colorsMap[viewId];
      if (!colorData) continue;
      const price = Number(colorData.price);
      if (Number.isFinite(price) && price > maxPrice) {
        maxPrice = price;
      }
    }
    return maxPrice;
  });

  // 从 Canvas Store 读取 WooCommerce 原始价格，默认优先显示
  const wooBasePrice = computed(() => {
    const pd = canvasStore?.productData;
    const price = pd && pd.woocommerce && pd.woocommerce.price;
    const num = Number(price);
    return Number.isFinite(num) && num > 0 ? num : 0;
  });

  const basePrice = computed(() => {
    const candidate = wooBasePrice.value;
    if (candidate > 0) return candidate.toFixed(2);

    const maxPrice = maxPriceFromSelectedColors.value || 0;
    return Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice.toFixed(2) : '0.00';
  });

  const customizationPrice = computed(() => {
    const total = printStore.getTotalPrintCostFromUsedMethods || 0;
    return Number.isFinite(total) ? total.toFixed(2) : '0.00';
  });

  return { basePrice, customizationPrice };
}