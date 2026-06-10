/*
 * ProductCardFooter Vue 组件（进一步拆分版）
 * 将样品订单与数量的 state 和 Getter 拆分到功能子模块中：
 * - useSampleOrder: 管理 isSampleOrder、quantityDisabled 及与 DOM 复选框的同步
 * - useQuantity: 管理 quantity、minQuantity 及加减逻辑
 * 其它计算（日期、MOQ、价格、批量步长）保持在相应模块。
 */

const { createApp } = window.Vue;
import { pinia, useCanvasStore, usePrintMethodStore } from '../stores/index.js';
import { useDateCalculations } from './product-card-footer/date.js';
import { useMoqCalculations } from './product-card-footer/moq.js';
import { usePriceCalculations } from './product-card-footer/price.js';
import { useBatchQuantity } from './product-card-footer/batch-quantity.js';
import { useSampleOrder } from './product-card-footer/sample-order.js';
import { useQuantity } from './product-card-footer/quantity.js';

export const ProductCardFooter = {
  name: 'ProductCardFooter',
  setup() {
    const canvasStore = useCanvasStore();
    const printStore = usePrintMethodStore();

    const { getIsSampleOrder, quantityDisabled } = useSampleOrder();

    const { showDesign, showColor, moqDesignText, moqColorText, calculatedMoq } =
      useMoqCalculations(canvasStore, printStore);

    const { batchQuantity, sellInBatch } = useBatchQuantity(canvasStore);
    const { quantity, minQuantity, onMinus, onPlus, maxQuantity } =
      useQuantity(calculatedMoq, batchQuantity, getIsSampleOrder, sellInBatch);

    const { estimatedDeliveryDate, estimatedArrivalDate } =
      useDateCalculations(canvasStore, printStore, getIsSampleOrder, quantity);

    const {
      originalBasePrice,
      discountedBasePrice,
      discountText,
      hasDiscount,
      customizationPrice
    } = usePriceCalculations(canvasStore, printStore, quantity, getIsSampleOrder);

    return {
      showDesign,
      showColor,
      moqDesignText,
      moqColorText,
      originalBasePrice,
      discountedBasePrice,
      discountText,
      hasDiscount,
      customizationPrice,
      estimatedDeliveryDate,
      estimatedArrivalDate,
      quantityDisabled,
      quantity,
      minQuantity,
      maxQuantity,
      batchQuantity,
      onMinus,
      onPlus
    };
  },
  template: '#pwca-product-card-footer-template'
};

(function mountProductCardFooter(){
  const container = document.getElementById('product-card-footer');
  if (!container) return;
  const app = createApp(ProductCardFooter);
  app.use(pinia);
  app.mount('#product-card-footer');
  window.pwcaProductCardFooter = ProductCardFooter;
})();
