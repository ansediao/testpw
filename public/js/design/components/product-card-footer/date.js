/*
 * 日期显示与计算模块（Product Card Footer）
 * 暴露：estimatedDeliveryDate、estimatedArrivalDate 两个 computed
 * 依赖：从全局 window.Vue 解构 computed；依赖 Pinia 的 canvasStore、printStore；
 */
const { computed } = window.Vue;

export function useDateCalculations(canvasStore, printStore, getIsSampleOrder) {
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

  // 预计发货日期：以颜色 RTS 最大值与印刷方式最大处理时间求和
  const estimatedDeliveryDate = computed(() => {
    const currentDate = new Date();
    const maxRtsValue = Number(canvasStore?.getTotalMaxRtsForBulkOrder || 0);
    const maxProcessTime = Number(maxProcessTimeFromPrintMethods.value || 0);
    const totalProcessingDays = maxRtsValue + maxProcessTime;
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