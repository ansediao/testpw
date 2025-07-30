# 批量销售数量控制实现

## 概述

本文档描述了如何在 PW Canvas 插件中实现基于聚合API的批量销售数量控制功能。该功能根据产品的`sell_in_batch`和`sell_in_batch_info.batch_quantity`设置来控制数量选择器的步进值。

## 数据流

### 1. API数据结构

聚合API返回的产品数据包含以下字段：

```json
{
  "product": {
    "data": {
      "sell_in_batch": true,
      "sell_in_batch_info": {
        "batch_quantity": 50,
        "moq_quantity": 1
      }
    }
  }
}
```

### 2. 数据处理逻辑

在`productStore.js`的`fetchProductData`方法中：

```javascript
// 构建 MOQ 设置对象
const moqSettingsData = {};

// 处理批量销售设置
if (productApiData.sell_in_batch !== undefined) {
    moqSettingsData.sell_in_batch = productApiData.sell_in_batch;
}

// 处理批量销售信息
if (productApiData.sell_in_batch_info) {
    if (productApiData.sell_in_batch_info.batch_quantity !== undefined) {
        moqSettingsData.batch_quantity = productApiData.sell_in_batch_info.batch_quantity;
    }
    if (productApiData.sell_in_batch_info.moq_quantity !== undefined) {
        moqSettingsData.minimum_order_quantity = productApiData.sell_in_batch_info.moq_quantity;
    }
}
```

### 3. 步进值设置

在`setMoqSettings`方法中：

```javascript
// 根据 sell_in_batch 设置步进值
if (moqSettings.value.sell_in_batch === true) {
    stepQuantity.value = moqSettings.value.batch_quantity;
} else {
    stepQuantity.value = 1; // 不按批次销售时，步进值为1
}
```

## 核心功能

### 1. 数量修正逻辑

`correctedQuantity`计算属性确保用户输入的数量符合批量销售要求：

```javascript
const correctedQuantity = Vue.computed(() => {
    return (inputQuantity) => {
        const minQty = minQuantity.value;
        const batchQty = stepQuantity.value;
        const sellInBatch = moqSettings.value.sell_in_batch;

        // 确保不低于最小数量
        if (inputQuantity < minQty) {
            return minQty;
        }

        // 如果需要按批次销售，调整到最近的批次数量
        if (sellInBatch === true) {
            if (batchQty > 1) {
                // 计算从最小数量开始的批次倍数
                const excessQuantity = inputQuantity - minQty;
                const remainder = excessQuantity % batchQty;
                
                if (remainder !== 0) {
                    // 向上调整到下一个批次
                    return inputQuantity - remainder + batchQty;
                }
            }
        }

        return inputQuantity;
    };
});
```

### 2. 增减按钮逻辑

在`ProductQuantity.js`组件中，增减按钮使用动态步进值：

```javascript
const increaseQuantity = () => {
    const currentStep = store.moqSettings.sell_in_batch === true ? store.stepQuantity : 1;
    const newQuantity = store.quantity + currentStep;
    store.updateQuantity(newQuantity);
};

const decreaseQuantity = () => {
    const currentStep = store.moqSettings.sell_in_batch === true ? store.stepQuantity : 1;
    const newQuantity = store.quantity - currentStep;
    if (newQuantity >= store.minQuantity) {
        store.updateQuantity(newQuantity);
    }
};
```

### 3. 用户界面显示

模板中显示批量销售信息：

```html
<div class="quantity-info">
    <p class="moq-info" v-if="minQuantity > 1">
        {{ moqInfo }}
    </p>
    <p class="batch-info" v-if="moqSettings.sell_in_batch === true">
        Sold in batches of {{ stepQuantity }}
    </p>
</div>
```

## 测试场景

### 场景1：不按批次销售
- `sell_in_batch: false`
- `batch_quantity: 50`
- 预期：步进值为1，用户可以选择任意数量

### 场景2：按批次销售
- `sell_in_batch: true`
- `batch_quantity: 50`
- `moq_quantity: 1`
- 预期：步进值为50，数量必须是50的倍数（1, 51, 101, 151...）

### 场景3：按批次销售，有最小订购量
- `sell_in_batch: true`
- `batch_quantity: 25`
- `moq_quantity: 10`
- 预期：步进值为25，数量必须从10开始，然后是35, 60, 85...

## 兼容性

### 向后兼容
- 支持旧的`moq_setting`数据结构
- 如果没有批量销售信息，默认步进值为1
- 保持与现有PHP模块的兼容性

### PHP模块支持
以下PHP模块已经支持新的数据结构：
- `class-pw-quantity-discount.php`
- `class-pw-price-calculator.php`

## 调试

### 测试工具
创建了`test-batch-quantity.js`文件用于测试批量销售逻辑：

```javascript
// 在浏览器控制台中运行
testBatchQuantity();
```

### 调试信息
在开发环境中，可以通过以下方式查看当前设置：

```javascript
// 查看当前MOQ设置
console.log(store.moqSettings);

// 查看当前步进值
console.log(store.stepQuantity);

// 测试数量修正
console.log(store.correctedQuantity(75)); // 输入75，查看修正后的值
```

## 注意事项

1. **严格比较**：使用`=== true`而不是`== true`来检查`sell_in_batch`
2. **数据类型**：确保`batch_quantity`和`moq_quantity`被转换为数字类型
3. **边界情况**：处理`batch_quantity`为1或0的情况
4. **用户体验**：在UI中清楚地显示批量销售要求

## 未来扩展

1. **动态批次**：支持基于数量的动态批次大小
2. **批次折扣**：为不同批次大小提供不同的折扣
3. **库存检查**：确保批次数量不超过可用库存
4. **国际化**：为批量销售信息添加多语言支持