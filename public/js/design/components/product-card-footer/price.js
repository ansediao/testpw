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

  const basePrice = computed(() => {
    const maxPrice = maxPriceFromSelectedColors.value || 0;
    return Number.isFinite(maxPrice) ? maxPrice.toFixed(1) : '0.0';
  });

  const customizationPrice = computed(() => {
    const total = printStore.getTotalPrintCostFromUsedMethods || 0;
    return Number.isFinite(total) ? total.toFixed(2) : '0.00';
  });

  return { basePrice, customizationPrice };
}