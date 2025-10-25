/*
 * 批量数量（步长）计算模块（Product Card Footer）
 * 暴露：batchQuantity
 */
const { computed } = window.Vue;

export function useBatchQuantity(canvasStore) {
  const batchQuantity = computed(() => {
    const productData = canvasStore?.productData;
    if (!productData || !productData.product || !productData.product.data) {
      return 1;
    }
    const product = productData.product.data;
    if (product.sell_in_batch === true) {
      if (product.sell_in_batch_info && product.sell_in_batch_info.batch_quantity) {
        const batchQty = Number(product.sell_in_batch_info.batch_quantity);
        return Number.isFinite(batchQty) && batchQty > 0 ? batchQty : 1;
      }
      if (product.batch_quantity) {
        const batchQty = Number(product.batch_quantity);
        return Number.isFinite(batchQty) && batchQty > 0 ? batchQty : 1;
      }
    }
    return 1;
  });

  return { batchQuantity };
}