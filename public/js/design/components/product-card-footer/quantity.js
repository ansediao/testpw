/*
 * 数量状态与 Getter 模块（Product Card Footer）
 * 暴露：quantity、minQuantity、setQuantity、onMinus、onPlus
 * 说明：负责数量的本地状态与步长增减逻辑，并根据外部的 calculatedMoq、batchQuantity、getIsSampleOrder 进行计算。
 */
const { ref, computed, watch } = window.Vue;

export function useQuantity(calculatedMoq, batchQuantity, getIsSampleOrder, sellInBatch) {
  const quantity = ref(1);

  const maxQuantity = computed(() => 9999);

  const setQuantity = (newValue) => {
    const numeric = parseInt(newValue, 10);
    let base = Number.isFinite(numeric) ? Math.max(1, numeric) : 1;
    const minQ = Number(minQuantity.value || 1);
    if (base < minQ) base = minQ;
    const isSample = Boolean(getIsSampleOrder?.value);
    const step = Number(batchQuantity?.value || 1);
    const batchEnabled = sellInBatch?.value === true && step > 1 && !isSample;
    if (batchEnabled) {
      const diff = base - minQ;
      const k = Math.ceil(diff / step);
      base = minQ + Math.max(0, k) * step;
    }
    if (base > maxQuantity.value) base = maxQuantity.value;
    quantity.value = base;
  };

  const minQuantity = computed(() => {
    const calculatedMoqValue = Number(calculatedMoq?.value || 0);
    return Number.isFinite(calculatedMoqValue) && calculatedMoqValue > 0 ? calculatedMoqValue : 1;
  });

  watch([minQuantity, quantity], ([minQ, q]) => {
    if (q < minQ && minQ > 0) {
      setQuantity(minQ);
      return;
    }
    const isSample = Boolean(getIsSampleOrder?.value);
    const step = Number(batchQuantity?.value || 1);
    const batchEnabled = sellInBatch?.value === true && step > 1 && !isSample;
    if (batchEnabled) {
      const diff = q - minQ;
      const k = Math.ceil(diff / step);
      const aligned = minQ + Math.max(0, k) * step;
      if (aligned !== q) setQuantity(aligned);
    }
    if (q > maxQuantity.value) setQuantity(maxQuantity.value);
  }, { immediate: true });

  const onMinus = () => {
    const disabled = Boolean(getIsSampleOrder?.value);
    if (disabled) return;
    const step = getIsSampleOrder?.value ? 1 : (batchQuantity?.value || 1);
    const newVal = Math.max(minQuantity.value, (quantity.value || 1) - step);
    setQuantity(newVal);
  };

  const onPlus = () => {
    const disabled = Boolean(getIsSampleOrder?.value);
    if (disabled) return;
    const step = getIsSampleOrder?.value ? 1 : (batchQuantity?.value || 1);
    const newVal = (quantity.value || 1) + step;
    setQuantity(newVal);
  };

  return { quantity, minQuantity, setQuantity, onMinus, onPlus, maxQuantity };
}