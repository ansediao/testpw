/*
 * ProductCardFooter Vue 组件
 * 作用：在产品卡底部展示 MOQ（按设计/按颜色）、价格（基础价/定制价）、预计交付/到达日期以及数量增减控件，
 *      并与 Pinia 全局状态（useCanvasStore、usePrintMethodStore）保持实时联动。
 * 依赖：
 *   - window.Vue：从全局 Vue 运行时中解构出 createApp/computed/watch 等 API；
 *   - Pinia stores：从 ../stores/index.js 引入 pinia、useCanvasStore、usePrintMethodStore。
 * 挂载点：#product-card-footer（在 template-canvas-display.php 中为 .product-card 添加了该 id）。
 * 设计约定：
 *   - 组件只负责展示与交互（数量增减），不直接控制样品订单开关，仅消费 Pinia 的派生数据；
 *   - 模板字符串内部不写 HTML 注释，以避免在 DOM 中产生额外注释节点；
 *   - 保持纯函数式计算（computed）与最小副作用（watch 中对数量的矫正）。
 */

// 从全局 Vue 运行时解构出需要的 API；ref 当前未用到，保留以备后续拓展
const { createApp, ref, computed, watch } = window.Vue;
// 引入 Pinia 实例和两个业务 Store（画布与印刷方法）
import { pinia, useCanvasStore, usePrintMethodStore } from '../stores/index.js';

// 导出组件定义，便于外部引用或测试
export const ProductCardFooter = {
  name: 'ProductCardFooter',
  setup() {
    // 获取 Pinia 的实例（依赖注入），用于访问全局状态和派生数据
    const canvasStore = useCanvasStore(); // 画布/产品视图相关业务状态
    const printStore = usePrintMethodStore(); // 印刷方法/成本相关业务状态

    // 是否在 API 配置中启用样品订单（样品订单通常 MOQ 为 1）
    const isSampleOrderEnabledByApi = computed(() => {
      try {
        const val = canvasStore?.productData?.customization_settings?.data?.moq_sample_order;
        // 兼容后端返回的多种布尔表达形式
        return val === true || val === 1 || val === '1' || val === 'true';
      } catch (e) {
        // 若读取失败，视为未启用样品订单
        return false;
      }
    });

    // 是否展示「按设计」的 MOQ（来源于 Pinia 的派生标识）
    const showDesign = computed(() => !!canvasStore.shouldShowMoqDesign);

    // 是否展示「按颜色」的 MOQ；优先读取 Pinia 的派生标识，若不存在则回退到产品配置
    const showColor = computed(() => {
      // 兼容历史：某些场景下 store 中可能不存在 shouldShowMoqColor 字段
      if (Object.prototype.hasOwnProperty.call(canvasStore, 'shouldShowMoqColor')) {
        return !!canvasStore.shouldShowMoqColor;
      } else {
        // 回退：直接读取产品的 customization_settings 配置项
        const raw = canvasStore?.productData?.customization_settings?.data?.moq_items_color;
        // 将各种“关闭”状态统一识别为不展示
        return !(raw === false || raw === 0 || raw === 'false' || raw === '0' || raw === null || raw === undefined);
      }
    });

    // 「按设计」的 MOQ 数量：样品订单时固定为 1；否则取印刷方法中实际使用的最大 MOQ
    const moqDesignQty = computed(() => {
      if (isSampleOrderEnabledByApi.value) return 1;
      const maxQty = Number(printStore ? printStore.getMaxUsedMoqQuantity : 0);
      return Number.isFinite(maxQty) ? maxQty : 0; // 兜底为 0，避免 NaN
    });

    // 「按颜色」的 MOQ 数量：样品订单时固定为 1；否则取颜色选择中实际使用的最大 MOQ
    const moqColorQty = computed(() => {
      if (isSampleOrderEnabledByApi.value) return 1;
      const maxQty = Number(canvasStore ? canvasStore.getMaxUsedColorMoqQuantity : 0);
      return Number.isFinite(maxQty) ? maxQty : 0; // 兜底为 0，避免 NaN
    });

    // MOQ 展示文案：保持与原有页面文案一致（单位 Pcs）
    const moqDesignText = computed(() => `${moqDesignQty.value}Pcs / Design`);
    const moqColorText = computed(() => `${moqColorQty.value}Pcs / Color`);

    // 价格展示（基础价/定制价）：
    // - 基础价来自颜色选择的最大单价（按视图与颜色选中状态计算）
    const basePrice = computed(() => {
      const maxPrice = canvasStore.getMaxPriceFromSelectedColors || 0;
      return Number.isFinite(maxPrice) ? maxPrice.toFixed(1) : '0.0'; // 统一 1 位小数显示
    });
    // - 定制价来自印刷方法的总成本（按已使用的方法聚合）
    const customizationPrice = computed(() => {
      const total = printStore.getTotalPrintCostFromUsedMethods || 0;
      return Number.isFinite(total) ? total.toFixed(2) : '0.00'; // 统一 2 位小数显示
    });

    // 预计交付/到达日期：直接映射 Pinia 的派生字段，保持与原逻辑一致
    const estimatedDeliveryDate = computed(() => canvasStore.estimatedDeliveryDate);
    const estimatedArrivalDate = computed(() => canvasStore.estimatedArrivalDate);

    // 数量控件的可用状态：由业务规则决定（如某些组合不允许手动修改数量）
    const quantityDisabled = computed(() => canvasStore.isQuantityControlDisabled);

    // 与 Pinia 的数量做双向绑定：
    // - 读取：使用 store 的 getter；
    // - 写入：进行整数解析与校验，合法后再调用 setQuantity。
    const quantity = computed({
      get: () => canvasStore.getQuantity,
      set: (val) => {
        const num = parseInt(val, 10);
        if (Number.isFinite(num)) canvasStore.setQuantity(num);
      },
    });

    // 最小数量：
    // - 非样品订单时，优先使用 Pinia 计算好的 MOQ（getCalculatedMoq）；
    // - 若无法计算（或结果不合法），则兜底为 1。
    const minQuantity = computed(() => {
      const calculatedMoq = canvasStore.getCalculatedMoq;
      return Number.isFinite(calculatedMoq) && calculatedMoq > 0 ? calculatedMoq : 1;
    });

    // 监听最小值与当前数量：当数量小于最小值时进行矫正，确保业务规则生效
    watch([minQuantity, quantity], ([minQ, q]) => {
      if (q < minQ && minQ > 0) {
        canvasStore.setQuantity(minQ);
      }
    }, { immediate: true }); // immediate：初始化时也执行一次，避免初始状态不合法

    // 点击「-」按钮：按步长递减
    // - 样品订单：步长为 1；
    // - 普通订单：步长为批量数量（getBatchQuantity），至少为 1；
    // - 并且不允许小于最小数量。
    const onMinus = () => {
      if (quantityDisabled.value) return; // 若禁用则直接返回
      const isSampleOrder = canvasStore.getIsSampleOrder;
      const step = isSampleOrder ? 1 : (canvasStore.getBatchQuantity || 1);
      const newVal = Math.max(minQuantity.value, (quantity.value || 1) - step);
      canvasStore.setQuantity(newVal);
    };

    // 点击「+」按钮：按步长递增（同上），不做上限限制，由业务侧控制
    const onPlus = () => {
      if (quantityDisabled.value) return; // 若禁用则直接返回
      const isSampleOrder = canvasStore.getIsSampleOrder;
      const step = isSampleOrder ? 1 : (canvasStore.getBatchQuantity || 1);
      const newVal = (quantity.value || 1) + step;
      canvasStore.setQuantity(newVal);
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
  //   输入框使用 v-model.number 与 Pinia 的数量同步，readonly 受 quantityDisabled 控制。
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
  if (!container) return; // 若页面未提供挂载点则安全退出
  const app = createApp(ProductCardFooter);
  app.use(pinia); // 注入 Pinia，使组件内能够访问 useCanvasStore/usePrintMethodStore
  app.mount('#product-card-footer'); // 将组件挂载至容器
  window.ProductCardFooter = ProductCardFooter; // 暴露到全局，便于在控制台调试
})();