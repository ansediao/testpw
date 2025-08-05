# 价格计算器模块

## 功能概述

价格计算器现已集成到Vue 3组件架构中，作为产品页面的核心功能之一。通过Vue组件和Pinia状态管理，提供实时的价格计算和显示功能。

## 核心功能

- **实时价格计算**: 根据用户选择的数量和配件动态更新总价
- **批量折扣显示**: 自动应用并显示基于数量的折扣
- **配件价格集成**: 计算并显示所选配件的额外费用
- **价格明细**: 清晰展示单价、数量、小计、折扣和总计
- **响应式设计**: Vue 3响应式系统，适配各种屏幕尺寸

## 技术实现

### Vue组件架构

- **主组件**: `ProductPriceInfo.js` - 价格信息显示组件
- **辅助组件**: `QuantityDiscountSlider.js` - 数量折扣滑块
- **状态管理**: `productStore.js` - Pinia store管理价格状态
- **样式文件**: 
  - `ProductPriceInfo.css` - 价格显示样式
  - `QuantityDiscountSlider.css` - 滑块样式

### 数据源

- **产品价格**: 通过API聚合端点从WooCommerce获取
- **批量折扣**: 从 Promowares API 获取或使用默认折扣梯度
- **配件信息**: 从 Promowares API 获取配件列表和价格
- **Mock数据**: 从Mock API获取增强功能数据

### Vue响应式价格计算

1. **状态管理**: Pinia store统一管理价格相关状态
2. **计算属性**: Vue computed自动计算价格变化
3. **响应式更新**: 数量或配件变化时自动重新计算
4. **组件通信**: 通过store实现组件间数据共享

### 价格计算逻辑

```javascript
// 在Pinia store中实现
const computedPrice = computed(() => {
  const subtotal = basePrice.value * quantity.value;
  const discountRate = getDiscountForQuantity(quantity.value);
  const discountAmount = subtotal * discountRate;
  const discountedSubtotal = subtotal - discountAmount;
  
  const accessoriesTotal = selectedAccessories.value.reduce(
    (total, accessory) => total + parseFloat(accessory.price || 0), 0
  );
  
  return discountedSubtotal + accessoriesTotal;
});
```

### 组件集成

- **ProductQuantity**: 数量选择器，触发价格重新计算
- **ProductAccessories**: 配件选择器，影响总价计算
- **ProductPriceInfo**: 价格显示组件，展示计算结果
- **QuantityDiscountSlider**: 批量折扣可视化

### Vue组件界面

- **ProductPriceInfo组件**: 
  - 价格明细区域显示
  - 条件性折扣显示
  - 配件费用展示
  - 总价突出显示
- **QuantityDiscountSlider组件**:
  - 可视化折扣梯度
  - 交互式数量选择
  - 实时折扣预览

## 使用场景

- **产品定价透明化**: 客户可以实时看到不同数量和配置的价格变化
- **促进批量购买**: 通过显示数量折扣鼓励更大订单
- **配件销售**: 清晰显示配件价格，促进附加销售
- **购买决策辅助**: 帮助客户在下单前了解最终价格

## Vue组件示例

```javascript
// ProductPriceInfo.js 组件示例
const ProductPriceInfo = {
  name: 'ProductPriceInfo',
  template: `
    <div class="price-info">
      <div class="price-breakdown">
        <div class="base-price">
          单价: {{ formatPrice(basePrice) }} × {{ quantity }}
        </div>
        <div v-if="discountAmount > 0" class="discount">
          折扣: -{{ formatPrice(discountAmount) }}
        </div>
        <div v-if="accessoriesTotal > 0" class="accessories">
          配件: +{{ formatPrice(accessoriesTotal) }}
        </div>
        <div class="total-price">
          总计: {{ formatPrice(totalPrice) }}
        </div>
      </div>
    </div>
  `,
  setup() {
    const store = useProductStore();
    const storeRefs = toRefs(store);
    
    const totalPrice = computed(() => {
      // 价格计算逻辑
      return store.calculateTotalPrice();
    });
    
    return {
      basePrice: storeRefs.basePrice,
      quantity: storeRefs.quantity,
      discountAmount: storeRefs.discountAmount,
      accessoriesTotal: storeRefs.accessoriesTotal,
      totalPrice
    };
  }
};
```

## 当前实现状态

### 已实现功能
- **Vue 3组件化**: 价格计算已迁移到Vue组件
- **Pinia状态管理**: 统一的价格状态管理
- **响应式计算**: 自动价格更新机制
- **组件样式**: 独立的CSS样式文件
- **API集成**: 通过聚合API获取价格数据

### 调试和开发工具
- **MOQ调试器**: `moq-debugger.js` 用于最小订购量调试
- **组件验证器**: `component-validator.js` 确保组件正常工作
- **批量演示**: `batch-quantity-demo.html` 批量数量功能演示

## 未来扩展

- **货币本地化**: 根据用户区域设置显示不同货币
- **税费计算**: 集成税费计算功能
- **运费估算**: 添加基于重量或目的地的运费计算
- **促销代码**: 支持促销代码或优惠券折扣
- **保存配置**: 允许用户保存产品配置以便后续购买
- **A/B测试**: 不同价格显示方式的效果测试