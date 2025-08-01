# Shipping Info API 集成验证

## 功能确认

✅ **已正确实现**: `rts_for_bulk_order` 和 `rts_for_sample_order` 都从聚合 API 的 `product.shipping_info` 中获取

## 代码实现位置

### productStore.js - fetchProductData 方法

```javascript
// 处理发货时间相关数据 - 从 shipping_info 中获取
if (productApiData.shipping_info) {
    const shippingInfo = productApiData.shipping_info;

    if (shippingInfo.rts_date_starts_from !== undefined) {
        setRtsDateStartsFrom(shippingInfo.rts_date_starts_from);
    }

    if (shippingInfo.rts_for_bulk_order !== undefined) {
        setRtsForBulkOrder(shippingInfo.rts_for_bulk_order);
    }

    if (shippingInfo.rts_for_sample_order !== undefined) {
        setRtsForSampleOrder(shippingInfo.rts_for_sample_order);
    }
}
```

## API 数据路径

### 聚合 API 响应结构
```
/wp-json/pw/v1/product-data/{product_id}
└── product
    └── data
        ├── rts_date (boolean)
        └── shipping_info
            ├── rts_date_starts_from (number)
            ├── rts_for_bulk_order (number)
            └── rts_for_sample_order (number)
```

## 数据流程

1. **API 调用**: `window.productDataAPI.fetchCurrentProductData()`
2. **数据检查**: 验证 `apiData.has_product_data` 和 `apiData.product.data`
3. **Shipping Info 处理**: 从 `productApiData.shipping_info` 提取配置
4. **状态更新**: 调用相应的 setter 方法更新 store 状态
5. **日期计算**: `estimatedShipDate` 计算属性自动重新计算
6. **UI 更新**: 组件响应式更新显示

## 默认值处理

如果 API 数据不可用，系统使用以下默认值：
- `rts_date_starts_from`: 3 天
- `rts_for_bulk_order`: 2 天  
- `rts_for_sample_order`: 1 天

## 计算逻辑

```javascript
const estimatedShipDate = Vue.computed(() => {
    const currentDate = new Date();
    let totalDays = rts_date_starts_from.value;
    
    // 根据订单类型选择额外处理时间
    if (buySampleChecked.value) {
        totalDays += rts_for_sample_order.value;  // 来自 shipping_info
    } else {
        totalDays += rts_for_bulk_order.value;    // 来自 shipping_info
    }
    
    const shipDate = new Date(currentDate);
    shipDate.setDate(currentDate.getDate() + totalDays);
    
    return formatDate(shipDate); // MM/DD/YYYY
});
```

## 测试验证

### 测试用例 1: 批量订单
- API 数据: `{ rts_date_starts_from: 3, rts_for_bulk_order: 2 }`
- buySampleChecked: `false`
- 计算结果: 当前日期 + 5 天

### 测试用例 2: 样品订单  
- API 数据: `{ rts_date_starts_from: 3, rts_for_sample_order: 1 }`
- buySampleChecked: `true`
- 计算结果: 当前日期 + 4 天

### 测试用例 3: 自定义配置
- API 数据: `{ rts_date_starts_from: 5, rts_for_bulk_order: 3, rts_for_sample_order: 2 }`
- 批量订单: 当前日期 + 8 天
- 样品订单: 当前日期 + 7 天

## 错误处理

- **API 数据缺失**: 使用默认值，不影响功能
- **数据类型错误**: `parseInt()` 处理，提供默认值
- **网络错误**: 保持现有状态，显示错误信息

## 响应式特性

- ✅ 订单类型切换时自动重新计算日期
- ✅ API 数据更新时自动应用新配置  
- ✅ 显示控制 (`rts_date`) 实时响应
- ✅ 所有参数变化都会触发 UI 更新

## 兼容性

- ✅ 向后兼容：如果 `shipping_info` 不存在，使用默认值
- ✅ 数据验证：所有数值都经过 `parseInt()` 处理
- ✅ 类型安全：使用 `!== undefined` 检查字段存在性

## 总结

系统已正确实现从聚合 API 的 `product.shipping_info` 路径获取 `rts_for_bulk_order` 和 `rts_for_sample_order` 的功能，并能根据这些数据动态计算预计发货日期。