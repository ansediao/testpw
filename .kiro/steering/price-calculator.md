# 价格计算器模块

## 功能概述

价格计算器模块是 PW Canvas 插件的一个关键组件，用于在产品详情页面实时计算和显示预计总价。该模块考虑了产品数量、批量折扣和用户选择的配件，为客户提供透明的价格信息。

## 核心功能

- **实时价格计算**: 根据用户选择的数量和配件动态更新总价
- **批量折扣显示**: 自动应用并显示基于数量的折扣
- **配件价格集成**: 计算并显示所选配件的额外费用
- **价格明细**: 清晰展示单价、数量、小计、折扣和总计
- **响应式设计**: 适配各种屏幕尺寸的美观界面

## 技术实现

### 模块结构

- **类名**: `Pw_Price_Calculator`
- **文件位置**: `public/modules/class-pw-price-calculator.php`
- **钩子优先级**: 48 (确保在API数据显示模块之前显示)
- **依赖组件**: 
  - 数量选择器 (`#quantity-input`)
  - 配件选择器 (`#pw-accessories-container`)

### 数据源

- **产品价格**: 从 WooCommerce 产品对象获取
- **批量折扣**: 从 Promowares API 获取或使用默认折扣梯度
- **配件信息**: 从 Promowares API 获取配件列表和价格

### 价格计算逻辑

1. **基础价格计算**: 产品单价 × 数量
2. **折扣计算**: 根据数量应用相应折扣率
3. **配件价格**: 累加所有选择的配件价格
4. **最终总价**: (基础价格 - 折扣) + 配件价格

### 事件监听机制

模块使用两种方式监听用户交互:

1. **MutationObserver API** (现代浏览器):
   - 监听数量输入框值变化
   - 监听配件容器子元素变化

2. **事件监听器** (兼容性保障):
   - 监听输入事件 (`input`, `change`)
   - 监听点击事件 (步进器按钮, 刻度点)

### 界面组件

- **价格明细区域**: 显示价格计算的各个组成部分
- **折扣显示**: 条件性显示适用的折扣金额
- **配件费用**: 条件性显示选择的配件总价
- **总价显示**: 突出显示最终计算的总价

## 使用场景

- **产品定价透明化**: 客户可以实时看到不同数量和配置的价格变化
- **促进批量购买**: 通过显示数量折扣鼓励更大订单
- **配件销售**: 清晰显示配件价格，促进附加销售
- **购买决策辅助**: 帮助客户在下单前了解最终价格

## 代码示例

```javascript
// 价格计算核心函数
function updatePriceCalculation() {
    const subtotal = productPrice * currentQuantity;
    const discountRate = getDiscountForQuantity(currentQuantity);
    const discountAmount = subtotal * discountRate;
    const discountedSubtotal = subtotal - discountAmount;
    
    // 计算配件总价
    let accessoriesTotal = 0;
    selectedAccessories.forEach(function(accessory) {
        accessoriesTotal += parseFloat(accessory.price) || 0;
    });
    
    const finalTotal = discountedSubtotal + accessoriesTotal;
    
    // 更新显示...
}
```

## 未来扩展

- **货币本地化**: 根据用户区域设置显示不同货币
- **税费计算**: 集成税费计算功能
- **运费估算**: 添加基于重量或目的地的运费计算
- **促销代码**: 支持促销代码或优惠券折扣
- **保存配置**: 允许用户保存产品配置以便后续购买