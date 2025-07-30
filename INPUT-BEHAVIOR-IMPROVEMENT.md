# 数量输入行为改进

## 改进概述

根据用户反馈，我们改进了数量控制器的输入行为，现在用户可以在输入框中自由输入任何数量，系统不会自动修正输入的值。只有在点击增加(+)或减少(-)按钮时，系统才会根据批量销售要求自动修正数量。

## 新的行为模式

### 1. 输入框行为
- **自由输入**: 用户可以在输入框中输入任何数量
- **不自动修正**: 系统不会立即修正用户输入的值
- **实时提示**: 如果输入的数量不符合批量要求，显示建议的修正数量

### 2. 增减按钮行为
- **自动修正**: 点击+/-按钮时，系统会自动应用批量销售规则
- **智能步进**: 根据`sell_in_batch`设置使用相应的步进值

### 3. 用户体验
- **更灵活**: 用户可以输入任意数量进行计算或比较
- **清晰提示**: 通过提示信息告知用户建议的批量数量
- **便捷修正**: 通过+/-按钮快速调整到有效数量

## 技术实现

### 1. 新增方法

在`productStore.js`中添加了`setQuantityDirect`方法：

```javascript
// 直接设置数量，不进行批次修正（用于输入框）
const setQuantityDirect = (qty) => {
    // 只进行基本的范围限制，不进行批次修正
    const clampedQty = Math.max(1, Math.min(qty, maxQuantity.value));
    quantity.value = clampedQty;
};
```

### 2. 修改输入处理

在`ProductQuantity.js`中修改了`handleInput`方法：

```javascript
const handleInput = (event) => {
    const value = parseInt(event.target.value) || 1;
    // 直接设置用户输入的值，不进行批次修正
    store.setQuantityDirect(value);
};
```

### 3. 添加验证提示

新增了批次验证相关的计算属性：

```javascript
// 检查当前数量是否符合批次要求
const isQuantityValidForBatch = Vue.computed(() => {
    if (store.moqSettings.sell_in_batch !== true) {
        return true; // 不按批次销售时，任何数量都有效
    }
    
    const corrected = store.correctedQuantity(store.quantity);
    return corrected === store.quantity;
});

// 获取建议的修正数量
const suggestedQuantity = Vue.computed(() => {
    if (isQuantityValidForBatch.value) {
        return null; // 当前数量已经有效
    }
    return store.correctedQuantity(store.quantity);
});
```

### 4. UI提示信息

在模板中添加了建议数量的提示：

```html
<p class="batch-warning" v-if="moqSettings.sell_in_batch === true && !isQuantityValidForBatch" 
   style="color: #ff9800; font-size: 12px;">
    Suggested quantity: {{ suggestedQuantity }} (Use +/- buttons to auto-correct)
</p>
```

## 使用场景示例

### 场景1：不按批次销售
- 用户输入: 任意数量
- 系统行为: 直接接受，无需修正
- 提示信息: 无特殊提示

### 场景2：按批次销售（批次50）
- 用户输入: 75
- 系统行为: 接受输入，显示建议数量101
- 点击+按钮: 自动调整到101
- 点击-按钮: 自动调整到51

### 场景3：按批次销售（批次25，最小10）
- 用户输入: 20
- 系统行为: 接受输入，显示建议数量35
- 点击+按钮: 自动调整到35
- 点击-按钮: 自动调整到10

## 演示和测试

### 1. 可视化演示
打开 `public/js/product/demo/batch-quantity-demo.html` 查看新的交互行为

### 2. 测试工具
运行 `testBatchQuantity()` 查看各种场景的测试结果

### 3. 调试信息
```javascript
// 检查当前数量是否有效
console.log(store.isQuantityValidForBatch);

// 查看建议的修正数量
console.log(store.suggestedQuantity);
```

## 优势

### 1. 用户体验改进
- **更自然**: 符合用户对输入框的预期行为
- **更灵活**: 允许用户输入任意数量进行试算
- **更清晰**: 通过提示而不是强制修正来引导用户

### 2. 功能完整性
- **保持批量控制**: +/-按钮仍然遵循批量销售规则
- **智能提示**: 实时显示建议的有效数量
- **向后兼容**: 不影响现有的批量销售逻辑

### 3. 开发友好
- **清晰分离**: 输入和修正逻辑分离
- **易于测试**: 可以独立测试各个行为
- **易于扩展**: 可以轻松添加更多验证规则

## 注意事项

### 1. 数据一致性
- 输入框中的值可能与批量要求不符
- 在提交订单前需要进行最终验证
- 建议在添加到购物车时进行数量修正

### 2. 用户引导
- 通过提示信息引导用户使用+/-按钮
- 在必要时显示批量销售的说明
- 考虑添加"自动修正"按钮供用户选择

### 3. 边界情况
- 处理非数字输入
- 处理超出范围的数量
- 处理网络延迟导致的状态不一致

## 未来扩展

### 1. 自动修正选项
- 添加"自动修正"开关，让用户选择是否启用实时修正
- 提供"修正到最近批次"的快捷按钮

### 2. 智能建议
- 根据用户历史行为提供个性化建议
- 显示不同数量对应的价格差异

### 3. 批量输入
- 支持批量输入多个产品的数量
- 提供批量修正功能

## 总结

这个改进让数量控制器的行为更加符合用户预期，在保持批量销售功能完整性的同时，提供了更灵活的输入体验。用户现在可以自由输入数量进行试算，同时通过+/-按钮快速调整到有效的批量数量。