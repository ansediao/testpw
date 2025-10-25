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

    // 样品订单状态与 Getter（含 DOM 同步）
    const { getIsSampleOrder, quantityDisabled } = useSampleOrder();

    // MOQ、价格、批量步长
    const { showDesign, showColor, moqDesignText, moqColorText, calculatedMoq } = useMoqCalculations(canvasStore, printStore);
    const { basePrice, customizationPrice } = usePriceCalculations(canvasStore, printStore);
    const { batchQuantity } = useBatchQuantity(canvasStore);

    // 日期计算（依赖样品订单状态）
    const { estimatedDeliveryDate, estimatedArrivalDate } = useDateCalculations(canvasStore, printStore, getIsSampleOrder);

    // 数量状态与 Getter（依赖 MOQ、批量步长、样品订单）
    const { quantity, minQuantity, onMinus, onPlus } = useQuantity(calculatedMoq, batchQuantity, getIsSampleOrder);

    return {
      showDesign, showColor, moqDesignText, moqColorText,
      basePrice, customizationPrice,
      estimatedDeliveryDate, estimatedArrivalDate,
      quantityDisabled, quantity, minQuantity,
      onMinus, onPlus
    };
  },
  template: `
      <div class="product-card__info">
        <div class="product-card__detail">
          <span class="product-card__label">Minimum Order Quantity</span>
          <span class="product-card__value">
            <span v-show="showDesign">{{ moqDesignText }}</span>
            <br v-show="showDesign && showColor" />
            <span v-show="showColor">{{ moqColorText }}</span>
          </span>
        </div>
        <div class="product-card__detail">
          <span class="product-card__label">Price</span>
          <span class="product-card__value">
            Base Price: $<span>{{ basePrice }}</span><br>
            Customization Price: $<span>{{ customizationPrice }}</span>
          </span>
        </div>
        <div class="product-card__detail">
          <span class="product-card__label">Estimated delivery date:<br>Estimated arrival date:</span>
          <span class="product-card__value">
            <span>{{ estimatedDeliveryDate }}</span><br>
            <span>{{ estimatedArrivalDate }}</span>
          </span>
        </div>
      </div>
      <div class="product-card__quantity">
        <button class="product-card__button product-card__button--minus" :disabled="quantityDisabled" @click="onMinus">-</button>
        <input type="number" :min="minQuantity" v-model.number="quantity" class="product-card__input" :readonly="quantityDisabled">
        <button class="product-card__button product-card__button--plus" :disabled="quantityDisabled" @click="onPlus">+</button>
      </div>
  `
};

(function mountProductCardFooter(){
  const container = document.getElementById('product-card-footer');
  if (!container) return;
  const app = createApp(ProductCardFooter);
  app.use(pinia);
  app.mount('#product-card-footer');
  window.ProductCardFooter = ProductCardFooter;
})();
