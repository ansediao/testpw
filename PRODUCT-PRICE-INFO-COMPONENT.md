# ProductPriceInfo 组件说明

## 功能概述

ProductPriceInfo 组件是一个 Vue 3 组件，用于在产品页面显示价格信息和物流信息。该组件位于 ProductQuantity 组件下方，提供实时的价格计算和预计时间显示。

## 主要功能

### 1. 产品单价显示
- **默认价格**: 显示产品的销售价格 (`productData.price`)
- **变体价格**: 当用户选择颜色变体时，自动切换到变体的 `anchor_price` 字段
- **响应式更新**: 价格会根据用户的颜色选择实时更新

### 2. 产品总价计算
- **计算逻辑**: 单价 × 当前选择的数量
- **实时更新**: 当数量或颜色变体改变时自动重新计算

### 3. 预计发货时间
- **数据来源**: `productData.apiData.product.data.estimated_ship_date`
- **默认值**: 如果 API 没有提供数据，显示 "3-5 business days"

### 4. 预计到货时间
- **数据来源**: `productData.apiData.product.data.estimated_delivery_date`
- **默认值**: 如果 API 没有提供数据，显示 "7-10 business days"

## 技术实现

### 响应式数据绑定
```javascript
// 使用 toRefs 保持 Pinia store 的响应式
const storeRefs = toRefs(store);

// 计算单价 - 优先使用变体的 anchor_price
const unitPrice = computed(() => {
    if (store.selectedVariant && store.selectedVariant.anchor_price) {
        return parseFloat(store.selectedVariant.anchor_price);
    }
    if (store.productData && store.productData.price) {
        return parseFloat(store.productData.price);
    }
    return 0;
});
```

### 数据流
1. **初始化**: 组件挂载时显示产品默认价格
2. **颜色选择**: 用户选择颜色时，`selectedVariant` 更新，触发单价重新计算
3. **数量变化**: 用户修改数量时，总价自动重新计算
4. **API 数据**: 从聚合 API 端点获取发货和到货时间信息

## 文件结构

```
public/js/product/components/
├── ProductPriceInfo.js     # 组件逻辑
└── ProductPriceInfo.css    # 组件样式
```

## 样式特性

- **响应式设计**: 支持移动端和桌面端
- **清晰布局**: 价格信息和物流信息分区显示
- **视觉层次**: 总价使用更大字体和突出颜色
- **加载状态**: 支持加载状态的视觉反馈

## 集成方式

### 1. 脚本加载
组件通过 CDN 加载器自动加载：
```php
<script src="<?php echo plugin_dir_url(__FILE__) . '../js/product/components/ProductPriceInfo.js?v=' . time(); ?>"></script>
<link rel="stylesheet" href="<?php echo plugin_dir_url(__FILE__) . '../js/product/components/ProductPriceInfo.css?v=' . time(); ?>">
```

### 2. 组件注册
在 main.js 中注册：
```javascript
components: {
    ProductQuantity: window.ProductQuantity,
    ProductPriceInfo: window.ProductPriceInfo,
    // ... 其他组件
}
```

### 3. 模板使用
```html
<div class="quantity-section">
    <ProductQuantity />
</div>

<div class="price-info-section">
    <ProductPriceInfo />
</div>
```

## 测试要点

### 功能测试
1. **默认状态**: 页面加载时显示产品默认价格
2. **颜色切换**: 选择不同颜色时价格是否正确更新
3. **数量变化**: 修改数量时总价是否正确计算
4. **数据缺失**: API 数据缺失时是否显示默认值

### 响应式测试
1. **桌面端**: 在不同桌面分辨率下的显示效果
2. **移动端**: 在手机和平板上的显示效果
3. **布局适应**: 长文本和短文本的布局适应性

### 性能测试
1. **响应速度**: 颜色切换时的响应速度
2. **内存使用**: 长时间使用是否有内存泄漏
3. **计算效率**: 频繁数量变化时的计算性能

## 故障排除

### 常见问题

1. **价格不更新**
   - 检查 `selectedVariant` 是否正确设置
   - 确认 `anchor_price` 字段存在且有效
   - 验证 `toRefs` 是否正确使用

2. **总价计算错误**
   - 检查数量值是否为数字类型
   - 确认 `parseFloat` 转换是否成功
   - 验证计算逻辑是否正确

3. **时间信息不显示**
   - 检查 API 数据结构是否正确
   - 确认默认值是否设置
   - 验证数据路径是否正确

### 调试方法

1. **控制台日志**
```javascript
console.log('当前选中变体:', store.selectedVariant);
console.log('单价:', unitPrice.value);
console.log('总价:', totalPrice.value);
```

2. **Vue DevTools**
   - 查看组件状态
   - 监控 Pinia store 变化
   - 检查计算属性值

3. **网络面板**
   - 确认 API 数据正确加载
   - 检查数据结构是否符合预期

## 扩展建议

### 功能扩展
1. **货币本地化**: 支持不同货币显示
2. **税费计算**: 添加税费计算功能
3. **折扣显示**: 显示批量折扣信息
4. **运费估算**: 添加运费计算

### 性能优化
1. **计算缓存**: 缓存复杂计算结果
2. **防抖处理**: 对频繁变化的输入进行防抖
3. **懒加载**: 延迟加载非关键数据

### 用户体验
1. **动画效果**: 添加价格变化的动画
2. **加载状态**: 改进加载状态的视觉效果
3. **错误提示**: 添加更友好的错误提示