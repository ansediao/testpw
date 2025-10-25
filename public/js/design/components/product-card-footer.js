/*
 * ProductCardFooter Vue 组件
 * 作用：在产品卡底部展示 MOQ、价格、预计交付/到达日期及数量控件，并管理与这些展示直接相关的本地状态。
 * 迁移：将原 Pinia store 中仅供 #product-card-footer 使用的数量、样品订单与日期计算逻辑迁移至组件内部，
 *      以便就地维护并减少对全局 store 的耦合。
 * 依赖：
 *   - window.Vue：从全局 Vue 运行时中解构出 createApp/reactive/computed/watch/onMounted/onBeforeUnmount 等 API；
 *   - Pinia stores：从 ../stores/index.js 引入 pinia、useCanvasStore、usePrintMethodStore。
 * 挂载点：#product-card-footer（在 template-canvas-display.php 中为 .product-card 添加了该 id）。
 * 设计约定：
 *   - 组件只负责展示与交互（数量增减），不直接控制样品订单开关，仅消费 Pinia 与 DOM 的派生数据；
 *   - 模板字符串内部不写 HTML 注释，以避免在 DOM 中产生额外注释节点；
 *   - 保持纯函数式计算（computed）与最小副作用（watch 中对数量的矫正、与 DOM 的同步监听）。
 */

// 从全局 Vue 运行时解构出需要的 API
const { createApp, reactive, computed, watch, onMounted, onBeforeUnmount } = window.Vue;
// 引入 Pinia 实例和两个业务 Store（画布与印刷方法）
import { pinia, useCanvasStore, usePrintMethodStore } from '../stores/index.js';

// 导出组件定义，便于外部引用或测试
export const ProductCardFooter = {
  name: 'ProductCardFooter',
  setup() {
    // 获取 Pinia 的实例（依赖注入），用于访问全局状态和派生数据
    const canvasStore = useCanvasStore(); // 画布/产品视图相关业务状态
    const printStore = usePrintMethodStore(); // 印刷方法/成本相关业务状态

    // === 状态 (state) ===
    const state = reactive({
      /** 当前下单数量：驱动数量输入框与加减按钮的展示与步长计算，默认值与历史逻辑保持一致为 100。 */
      quantity: 100,
      /** 样品订单勾选状态：用于判断数量控件是否禁用以及数量步长是否按批次计算，由页面复选框同步更新。 */
      isSampleOrder: false,
      /** 预计到货日期：保存计算结果供模板展示，也方便后续扩展其他组件读取。 */
      estimatedArrivalDate: '2025-01-15'
    });

    // === Actions ===
    /**
     * 更新数量值。
     * @param {number} newValue - 新的目标数量，可能来自输入框或按钮计算。
     * 逻辑：确保结果为整数且不小于 1，与原 store 中 Math.max(1, newValue) 的行为保持一致。
     */
    const setQuantity = (newValue) => {
      const numeric = parseInt(newValue, 10);
      state.quantity = Number.isFinite(numeric) ? Math.max(1, numeric) : 1;
    };

    /**
     * 设置样品订单状态。
     * @param {boolean} value - 是否勾选样品订单复选框。
     * 逻辑：将任意真值转换为布尔值，便于后续计算 MOQ 与数量禁用逻辑。
     */
    const setIsSampleOrder = (value) => {
      state.isSampleOrder = Boolean(value);
    };

    /**
     * 写回预计到货日期。
     * @param {string} arrivalDate - 最新计算的到货日期字符串，可为空字符串表示无法计算。
     * 逻辑：统一通过该方法更新状态，方便未来在此增加埋点或联动逻辑。
     */
    const updateEstimatedArrivalDate = (arrivalDate) => {
      state.estimatedArrivalDate = arrivalDate || '';
    };

    // 与页面 DOM 的样品订单复选框同步
    let removeSampleCheckboxListener = null;
    const handleSampleCheckboxChange = (event) => {
      setIsSampleOrder(event?.target?.checked);
    };

    onMounted(() => {
      const sampleCheckbox = document.querySelector('.sample-check input#sample');
      if (sampleCheckbox) {
        setIsSampleOrder(sampleCheckbox.checked);
        sampleCheckbox.addEventListener('change', handleSampleCheckboxChange);
        removeSampleCheckboxListener = () => {
          sampleCheckbox.removeEventListener('change', handleSampleCheckboxChange);
        };
      }
    });

    onBeforeUnmount(() => {
      if (typeof removeSampleCheckboxListener === 'function') {
        removeSampleCheckboxListener();
      }
    });

    // === Getters ===
    /** 获取当前数量，供其他计算属性复用。 */
    const getQuantity = computed(() => state.quantity);

    /** 获取样品订单状态，用于控制数量步长及禁用逻辑。 */
    const getIsSampleOrder = computed(() => state.isSampleOrder);

    /** 判断数量控件是否需要禁用：样品订单场景下禁用手动调整数量。 */
    const isQuantityControlDisabled = computed(() => state.isSampleOrder);

    /**
     * 计算颜色选择带来的最大 MOQ。
     * 逻辑：遍历 selectedColorsByView，兼容 _custom.value 结构与多种布尔表示。
     */
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

    /**
     * 计算颜色选择中的最高基础单价。
     * 逻辑：遍历所有已选颜色，取 price 字段的最大值，默认返回 0。
     */
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

    /**
     * 统计所有已使用印刷方式中的最大工艺耗时（process_time）。
     * 逻辑：遍历 printStore.usedPrintMethodsByView，取数值最大值，默认返回 0。
     */
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

    /**
     * 计算颜色与印刷方式综合后的最终 MOQ。
     * 逻辑：分别计算颜色 MOQ 与印刷方式 MOQ 的最大值，二者取最大并确保最小返回值为 1。
     */
    const calculatedMoq = computed(() => {
      let maxColorMoq = 0;
      let maxPrintMethodMoq = 0;

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

      const finalMoq = Math.max(maxColorMoq, maxPrintMethodMoq);
      return finalMoq > 0 ? finalMoq : 1;
    });

    /**
     * 获取批量销售的步长数量。
     * 逻辑：优先读取 sell_in_batch_info.batch_quantity，其次读取旧字段 batch_quantity，若未启用批量销售则返回 1。
     */
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

    /**
     * 计算预计发货日期：以颜色 RTS 最大值与印刷方式最大处理时间求和。
     */
    const estimatedDeliveryDateGetter = computed(() => {
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

    /**
     * 计算预计到货日期：在发货日期基础上叠加 shipping_info 对应的 RTS 时间，并更新状态。
     */
    const estimatedArrivalDateGetter = computed(() => {
      const deliveryDateStr = estimatedDeliveryDateGetter.value;
      if (!deliveryDateStr) return '';
      const deliveryDate = new Date(deliveryDateStr);
      if (Number.isNaN(deliveryDate.getTime())) return '';

      const productData = canvasStore?.productData;
      let shippingDays = 5;
      const isSampleOrderChecked = getIsSampleOrder.value;

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

    // 同步预计到货日期到状态，保持与原 store 中的可读属性一致
    watch(estimatedArrivalDateGetter, (val) => {
      updateEstimatedArrivalDate(val);
    }, { immediate: true });

    // 是否在 API 配置中启用样品订单（样品订单通常 MOQ 为 1）
    const isSampleOrderEnabledByApi = computed(() => {
      try {
        const val = canvasStore?.productData?.customization_settings?.data?.moq_sample_order;
        return val === true || val === 1 || val === '1' || val === 'true';
      } catch (e) {
        return false;
      }
    });

    // 是否展示「按设计」的 MOQ（来源于 Pinia 的派生标识）
    const showDesign = computed(() => !!canvasStore.shouldShowMoqDesign);

    // 是否展示「按颜色」的 MOQ；优先读取 Pinia 的派生标识，若不存在则回退到产品配置
    const showColor = computed(() => {
      if (Object.prototype.hasOwnProperty.call(canvasStore, 'shouldShowMoqColor')) {
        return !!canvasStore.shouldShowMoqColor;
      } else {
        const raw = canvasStore?.productData?.customization_settings?.data?.moq_items_color;
        return !(raw === false || raw === 0 || raw === 'false' || raw === '0' || raw === null || raw === undefined);
      }
    });

    // 「按设计」的 MOQ 数量：样品订单时固定为 1；否则取印刷方法中实际使用的最大 MOQ
    const moqDesignQty = computed(() => {
      if (isSampleOrderEnabledByApi.value) return 1;
      const maxQty = Number(printStore ? printStore.getMaxUsedMoqQuantity : 0);
      return Number.isFinite(maxQty) ? maxQty : 0;
    });

    // 「按颜色」的 MOQ 数量：样品订单时固定为 1；否则取颜色选择中实际使用的最大 MOQ
    const moqColorQty = computed(() => {
      if (isSampleOrderEnabledByApi.value) return 1;
      const maxQty = Number(maxUsedColorMoqQuantity.value || 0);
      return Number.isFinite(maxQty) ? maxQty : 0;
    });

    // MOQ 展示文案：保持与原有页面文案一致（单位 Pcs）
    const moqDesignText = computed(() => `${moqDesignQty.value}Pcs / Design`);
    const moqColorText = computed(() => `${moqColorQty.value}Pcs / Color`);

    // 价格展示（基础价/定制价）
    const basePrice = computed(() => {
      const maxPrice = maxPriceFromSelectedColors.value || 0;
      return Number.isFinite(maxPrice) ? maxPrice.toFixed(1) : '0.0';
    });
    const customizationPrice = computed(() => {
      const total = printStore.getTotalPrintCostFromUsedMethods || 0;
      return Number.isFinite(total) ? total.toFixed(2) : '0.00';
    });

    // 预计交付/到达日期
    const estimatedDeliveryDate = computed(() => estimatedDeliveryDateGetter.value);
    const estimatedArrivalDate = computed(() => estimatedArrivalDateGetter.value);

    // 数量控件的可用状态
    const quantityDisabled = computed(() => isQuantityControlDisabled.value);

    // 与数量的双向绑定
    const quantity = computed({
      get: () => getQuantity.value,
      set: (val) => {
        const num = parseInt(val, 10);
        if (Number.isFinite(num)) setQuantity(num);
      },
    });

    // 最小数量：非样品订单时使用计算得到的 MOQ，兜底为 1
    const minQuantity = computed(() => {
      const calculatedMoqValue = Number(calculatedMoq.value || 0);
      return Number.isFinite(calculatedMoqValue) && calculatedMoqValue > 0 ? calculatedMoqValue : 1;
    });

    // 监听最小值与当前数量：当数量小于最小值时进行矫正
    watch([minQuantity, quantity], ([minQ, q]) => {
      if (q < minQ && minQ > 0) {
        setQuantity(minQ);
      }
    }, { immediate: true });

    // 点击「-」按钮：按步长递减
    const onMinus = () => {
      if (quantityDisabled.value) return;
      const step = getIsSampleOrder.value ? 1 : (batchQuantity.value || 1);
      const newVal = Math.max(minQuantity.value, (quantity.value || 1) - step);
      setQuantity(newVal);
    };

    // 点击「+」按钮：按步长递增
    const onPlus = () => {
      if (quantityDisabled.value) return;
      const step = getIsSampleOrder.value ? 1 : (batchQuantity.value || 1);
      const newVal = (quantity.value || 1) + step;
      setQuantity(newVal);
    };

    // 暴露到模板使用的响应式数据与事件处理函数
    return {
      showDesign, showColor, moqDesignText, moqColorText,
      basePrice, customizationPrice,
      estimatedDeliveryDate, estimatedArrivalDate,
      quantityDisabled, quantity, minQuantity,
      onMinus, onPlus
    };
  },
  // 模板说明：
  // - 左侧信息块（product-card__info）：展示 MOQ、价格以及两个预计日期；
  // - 右侧数量块（product-card__quantity）：提供「-」「+」按钮与 number 输入框；
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

// 组件挂载的自执行函数：在页面就绪后立即尝试挂载到指定容器
(function mountProductCardFooter(){
  const container = document.getElementById('product-card-footer');
  if (!container) return;
  const app = createApp(ProductCardFooter);
  app.use(pinia);
  app.mount('#product-card-footer');
  window.ProductCardFooter = ProductCardFooter;
})();
