# MOQ (Minimum Order Quantity) 集成测试指南

## 功能概述

已成功将API数据中的`moq_setting`和`minimum_order_quantity`绑定到Pinia状态管理中，实现了响应式的数量控制器。

## 实现的功能

### 1. Pinia Store 增强
- 添加了 `moqSettings`、`minQuantity`、`maxQuantity`、`stepQuantity` 响应式状态
- 实现了 `correctedQuantity` 计算属性，自动根据MOQ设置调整数量
- 添加了 `setMoqSettings` 方法来更新MOQ配置
- 在 `fetchProductData` 中自动解析API数据中的MOQ设置

### 2. ProductQuantity 组件增强
- 使用 `toRefs` 保持响应式绑定
- 按钮状态根据MOQ设置动态启用/禁用
- 输入框支持最小值、最大值、步进值验证
- 显示MOQ信息和批次销售提示
- 添加数量验证错误提示

### 3. 样式优化
- 创建了专门的 `ProductQuantity.css` 样式文件
- 支持响应式设计和深色主题
- 禁用状态和验证错误的视觉反馈

## API 数据结构支持

系统支持以下两种API数据结构：

### 结构1: 嵌套的 moq_setting
```json
{
  "product": {
    "data": {
      "moq_setting": {
        "minimum_order_quantity": 10,
        "batch_quantity": 5,
        "sell_in_batch": true
      }
    }
  }
}
```

### 结构2: 平级的字段
```json
{
  "product": {
    "data": {
      "minimum_order_quantity": 10,
      "batch_quantity": 5,
      "sell_in_batch": true
    }
  }
}
```

## 测试步骤

### 1. 准备测试环境
确保以下文件已更新：
- `public/js/product/stores/productStore.js` - 增强的状态管理
- `public/js/product/components/ProductQuantity.js` - 响应式数量控制器
- `public/js/product/components/ProductQuantity.css` - 组件样式
- `public/modules/class-pw-cdn-loader.php` - CSS加载配置

### 2. 测试场景

#### 场景1: 基本MOQ功能
1. 访问一个同步产品页面 (`pw_isSyncProduct = '1'`)
2. 检查数量控制器是否显示正确的最小数量
3. 尝试输入小于最小数量的值，应自动调整
4. 检查减号按钮在达到最小数量时是否禁用

#### 场景2: 批次销售功能
1. 确保API返回 `sell_in_batch: true` 和 `batch_quantity > 1`
2. 检查是否显示"Sold in batches of X"提示
3. 输入不符合批次要求的数量，应自动调整到最近的批次数量
4. 使用+/-按钮，应按批次数量步进

#### 场景3: 数据响应式更新
1. 打开浏览器开发者工具
2. 在控制台中执行：
   ```javascript
   const store = useProductStore();
   store.setMoqSettings({
     minimum_order_quantity: 20,
     batch_quantity: 10,
     sell_in_batch: true
   });
   ```
3. 观察数量控制器是否立即更新显示

### 3. 验证点

#### 界面验证
- [ ] 数量控制器显示正确的最小数量
- [ ] MOQ信息文本正确显示
- [ ] 批次销售提示正确显示
- [ ] 按钮状态正确（启用/禁用）
- [ ] 输入验证错误提示正确显示

#### 功能验证
- [ ] 数量自动调整到符合MOQ要求
- [ ] 批次数量正确计算
- [ ] 响应式更新正常工作
- [ ] 与其他组件（如价格计算器）正确集成

#### 数据验证
- [ ] API数据正确解析到Pinia状态
- [ ] 状态变化正确传播到所有相关组件
- [ ] 计算属性正确响应状态变化

## 调试技巧

### 1. 检查Pinia状态
```javascript
// 在浏览器控制台中执行
const store = useProductStore();
console.log('MOQ Settings:', store.moqSettings);
console.log('Min Quantity:', store.minQuantity);
console.log('Current Quantity:', store.quantity);
```

### 2. 检查API数据
```javascript
// 检查原始API数据
const store = useProductStore();
console.log('API Data:', store.productData?.apiData);
```

### 3. 测试数量调整逻辑
```javascript
// 测试数量修正函数
const store = useProductStore();
console.log('Corrected 15:', store.correctedQuantity(15));
console.log('Corrected 3:', store.correctedQuantity(3));
```

## 常见问题排查

### 问题1: MOQ设置未生效
- 检查API是否返回正确的MOQ数据
- 确认产品的 `pw_isSyncProduct` 元字段为 '1'
- 检查浏览器控制台是否有JavaScript错误

### 问题2: 数量调整不正确
- 验证 `correctedQuantity` 计算逻辑
- 检查 `sell_in_batch` 和 `batch_quantity` 设置
- 确认最小数量和步进数量的值

### 问题3: 样式显示异常
- 确认 `ProductQuantity.css` 文件已正确加载
- 检查CSS文件路径是否正确
- 验证CDN加载器中的CSS链接

## 扩展建议

### 1. 添加更多验证
- 最大库存数量限制
- 自定义错误消息
- 数量范围提示

### 2. 增强用户体验
- 数量调整动画效果
- 键盘快捷键支持
- 批量选择快捷按钮

### 3. 集成其他功能
- 与购物车数量同步
- 与价格计算器深度集成
- 支持多变体MOQ设置

## 总结

MOQ功能已成功集成到Vue 3 + Pinia架构中，实现了：
- 响应式的数量控制
- 自动数量调整
- 用户友好的界面反馈
- 完整的API数据绑定

系统现在能够根据API返回的MOQ设置自动调整产品数量控制器的行为，为用户提供符合业务规则的购买体验。