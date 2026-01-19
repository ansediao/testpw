/*
 * 日期显示与计算模块（Product Card Footer）
 * 暴露：estimatedDeliveryDate、estimatedArrivalDate 两个 computed
 * 依赖：从全局 window.Vue 解构 computed；依赖 Pinia 的 canvasStore、printStore；
 * 变更：支持根据 quantity_discount 的 extra_processing_time 按数量梯度累计额外加工天数
*/
const { computed } = window.Vue;

export function useDateCalculations(canvasStore, printStore, getIsSampleOrder, quantityRef) {
  // 统计所有已使用印刷方式中的最大工艺耗时（process_time）
  const maxProcessTimeFromPrintMethods = computed(() => {
    if (!printStore || !printStore.usedPrintMethodsByView) return 0;
    let maxProcessTime = 0;
    const usedPrintMethodsByView = printStore.usedPrintMethodsByView || {};
    for (const viewId in usedPrintMethodsByView) {
      if (!Object.prototype.hasOwnProperty.call(usedPrintMethodsByView, viewId)) continue;
      const methodsMap = usedPrintMethodsByView[viewId] || {};
      for (const methodId in methodsMap) {
        if (!Object.prototype.hasOwnProperty.call(methodsMap, methodId)) continue;
        const method = methodsMap[methodId];
        if (method && method.apiData && method.apiData.process_time) {
          const processTime = Number(method.apiData.process_time);
          if (Number.isFinite(processTime) && processTime > maxProcessTime) {
            maxProcessTime = processTime;
          }
        }
      }
    }
    return maxProcessTime;
  });

  // 从产品数据中解析数量折扣（含额外加工时间）并排序
  const quantityDiscounts = computed(() => {
    const pd = canvasStore?.productData;
    const candidates = [
      pd?.product?.data?.quantity_discount,
      pd?.product?.quantity_discount,
      pd?.quantity_discount
    ];
    let arr = null;
    for (const c of candidates) {
      if (Array.isArray(c)) { arr = c; break; }
    }
    if (!Array.isArray(arr)) return [];
    return arr.map(d => ({
      range_from: parseInt(d.range_from) || 0,
      range_to: parseInt(d.range_to) || 0,
      discount: parseFloat(d.discount) || 1,
      extra_processing_time: parseInt(d.extra_processing_time) || 0
    })).sort((a, b) => a.range_from - b.range_from);
  });

  // 按当前数量累计所有已达梯度的额外加工天数（样品订单不叠加）
  const cumulativeExtraProcessingDays = computed(() => {
    const isSample = Boolean(getIsSampleOrder?.value);
    const qty = Number(quantityRef?.value || 0);
    if (isSample || !Number.isFinite(qty) || qty <= 0) return 0;
    let extra = 0;
    for (const tier of quantityDiscounts.value) {
      if (qty >= tier.range_from) {
        extra += Number(tier.extra_processing_time) || 0;
      }
    }
    return extra > 0 ? extra : 0;
  });

  // 预计发货日期：以颜色 RTS 最大值与印刷方式最大处理时间求和
  const estimatedDeliveryDate = computed(() => {
    const currentDate = new Date();
    const maxRtsValue = Number(canvasStore?.getTotalMaxRtsForBulkOrder || 0);
    const maxProcessTime = Number(maxProcessTimeFromPrintMethods.value || 0);
    const extraDays = Number(cumulativeExtraProcessingDays.value || 0);
    const totalProcessingDays = maxRtsValue + maxProcessTime + extraDays;
    const daysToAdd = totalProcessingDays > 0 ? totalProcessingDays : 0;
    const deliveryDate = new Date(currentDate);
    deliveryDate.setDate(currentDate.getDate() + daysToAdd);
    const year = deliveryDate.getFullYear();
    const month = String(deliveryDate.getMonth() + 1).padStart(2, '0');
    const day = String(deliveryDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // 预计到货日期：在发货日期基础上叠加 shipping_info 对应的 RTS 时间
  const estimatedArrivalDate = computed(() => {
    const deliveryDateStr = estimatedDeliveryDate.value;
    if (!deliveryDateStr) return '';
    const deliveryDate = new Date(deliveryDateStr);
    if (Number.isNaN(deliveryDate.getTime())) return '';

    const productData = canvasStore?.productData;
    let shippingDays = 5;
    const isSampleOrderChecked = Boolean(getIsSampleOrder?.value);

    if (productData && productData.product && productData.product.data && productData.product.data.shipping_info) {
      const shippingInfo = productData.product.data.shipping_info;
      if (isSampleOrderChecked && shippingInfo.rts_for_sample_order) {
        shippingDays = Number(shippingInfo.rts_for_sample_order) || 0;
      } else if (!isSampleOrderChecked && shippingInfo.rts_for_bulk_order) {
        shippingDays = Number(shippingInfo.rts_for_bulk_order) || 0;
      }
    }

    if (shippingDays === 0) {
      shippingDays = isSampleOrderChecked ? 1 : 2;
    }

    const arrivalDate = new Date(deliveryDate);
    arrivalDate.setDate(deliveryDate.getDate() + shippingDays);
    const year = arrivalDate.getFullYear();
    const month = String(arrivalDate.getMonth() + 1).padStart(2, '0');
    const day = String(arrivalDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  return { estimatedDeliveryDate, estimatedArrivalDate };
}