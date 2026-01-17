/*
 * 价格显示与计算模块（Product Card Footer）
 * 暴露：originalBasePrice、discountedBasePrice、discountText、hasDiscount、customizationPrice
 * 折扣数据来源：canvasStore.productData.*.quantity_discount 数组
 * 数量来源：传入的 quantityRef（推荐），或页面 .product-card__input 的 v-model（已在父组件绑定）
 */
const { computed } = window.Vue;

export function usePriceCalculations(canvasStore, printStore, quantityRef, getIsSampleOrder) {
  // 颜色选择中的最高价格（作为 Woo 固价的回退）
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

  // WooCommerce 原始价格，默认优先显示
  const wooBasePrice = computed(() => {
    const pd = canvasStore?.productData;
    const price = pd && pd.woocommerce && pd.woocommerce.price;
    const num = Number(price);
    return Number.isFinite(num) && num > 0 ? num : 0;
  });

  // 统一的原始单价（数字）
  const numericBasePrice = computed(() => {
    const candidate = Number(wooBasePrice.value || 0);
    if (Number.isFinite(candidate) && candidate > 0) return candidate;
    const maxPrice = Number(maxPriceFromSelectedColors.value || 0);
    return Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : 0;
  });

  // 解析 quantity_discount 数组（兼容不同层级）并排序
  const quantityDiscounts = computed(() => {
    const pd = canvasStore?.productData || {};
    const paths = [
      pd?.product?.data?.quantity_discount,
      pd?.product?.quantity_discount,
      pd?.quantity_discount
    ];
    let arr = null;
    for (const p of paths) {
      if (Array.isArray(p)) { arr = p; break; }
    }
    if (!Array.isArray(arr)) return [];
    return arr.map(d => ({
      range_from: parseInt(d.range_from) || 0,
      range_to: parseInt(d.range_to) || 0,
      discount: parseFloat(d.discount) || 1
    })).sort((a, b) => a.range_from - b.range_from);
  });

  // 是否启用折扣：有数据即可认为启用（样品订单不适用）
  const quantityDiscountEnabled = computed(() => {
    const enabledByData = quantityDiscounts.value.length > 0;
    const isSample = Boolean(getIsSampleOrder?.value);
    return enabledByData && !isSample;
  });

  // 当前数量对应的折扣系数（默认为1）
  const currentDiscountFactor = computed(() => {
    if (!quantityDiscountEnabled.value) return 1;
    const qty = Number(quantityRef?.value || 0);
    if (!Number.isFinite(qty) || qty <= 0) return 1;
    let factor = 1;
    for (const tier of quantityDiscounts.value) {
      if (qty >= tier.range_from) {
        factor = tier.discount; // 折扣系数（如 0.9）
      }
    }
    return Number.isFinite(factor) && factor > 0 ? factor : 1;
  });

  // 显示用的原始单价和折后单价
  const originalBasePrice = computed(() => {
    const n = numericBasePrice.value;
    return Number.isFinite(n) && n > 0 ? n.toFixed(2) : '0.00';
  });

  const discountedBasePrice = computed(() => {
    const n = numericBasePrice.value;
    const f = currentDiscountFactor.value;
    const val = (Number.isFinite(n) ? n : 0) * (Number.isFinite(f) ? f : 1);
    return Number.isFinite(val) ? val.toFixed(2) : '0.00';
  });

  const hasDiscount = computed(() => {
    const f = currentDiscountFactor.value;
    return quantityDiscountEnabled.value && Number.isFinite(f) && f > 0 && f < 1;
  });

  const discountText = computed(() => {
    if (!hasDiscount.value) return '';
    const f = currentDiscountFactor.value;
    const percentage = Math.round((1 - f) * 100);
    return percentage > 0 ? `${percentage}% OFF` : '';
  });

  // 自定义印刷费用
  const customizationPrice = computed(() => {
    const totalPrint = printStore.getTotalPrintCostFromUsedMethods || 0;
    let designFee = 0;
    try {
      if (typeof window.useDesignUsageStore === 'function') {
        const ds = window.pinia ? window.useDesignUsageStore(window.pinia) : window.useDesignUsageStore();
        const fee = Number(ds.totalFee || 0);
        if (Number.isFinite(fee)) designFee = fee;
      }
    } catch (e) {}
    const val = Number(totalPrint) + Number(designFee);
    return Number.isFinite(val) ? val.toFixed(2) : '0.00';
  });

  return { originalBasePrice, discountedBasePrice, discountText, hasDiscount, customizationPrice };
}