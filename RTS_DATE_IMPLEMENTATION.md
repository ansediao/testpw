# RTS Date 实现总结

## 功能概述

实现了根据业务逻辑动态计算 "Estimated Ship Date" 的功能。计算公式为：

**当前日期 + rts_date_starts_from + (buySampleChecked ? rts_for_sample_order : rts_for_bulk_order)**

## 修改的文件

### 1. `public/js/product/stores/productStore.js`

#### 新增状态变量：
```javascript
const rts_date_starts_from = Vue.ref(3);      // 基础发货天数
const rts_for_bulk_order = Vue.ref(2);        // 批量订单额外天数
const rts_for_sample_order = Vue.ref(1);      // 样品订单额外天数
```

#### 新增计算属性：
```javascript
const estimatedShipDate = Vue.computed(() => {
    const currentDate = new Date();
    let totalDays = rts_date_starts_from.value;
    
    if (buySampleChecked.value) {
        totalDays += rts_for_sample_order.value;
    } else {
        totalDays += rts_for_bulk_order.value;
    }
    
    const shipDate = new Date(currentDate);
    shipDate.setDate(currentDate.getDate() + totalDays);
    
    const month = String(shipDate.getMonth() + 1).padStart(2, '0');
    const day = String(shipDate.getDate()).padStart(2, '0');
    const year = shipDate.getFullYear();
    
    return `${month}/${day}/${year}`;
});
```

#### 新增设置方法：
```javascript
const setRtsDateStartsFrom = (days) => {
    rts_date_starts_from.value = parseInt(days) || 3;
};

const setRtsForBulkOrder = (days) => {
    rts_for_bulk_order.value = parseInt(days) || 2;
};

const setRtsForSampleOrder = (days) => {
    rts_for_sample_order.value = parseInt(days) || 1;
};
```

#### API 数据处理：
在 `fetchProductData` 方法中添加了从 `product.shipping_info` 路径读取相关配置的逻辑：

```javascript
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

### 2. `public/js/product/components/ProductPriceInfo.js`

#### 修改发货日期计算：
将原来的静态发货时间改为使用 store 中计算的动态日期：

```javascript
// 使用 store 中计算的预计发货时间
const estimatedShipDate = computed(() => {
    return store.estimatedShipDate;
});
```

## 业务逻辑

### 计算规则：
1. **基础天数**: `rts_date_starts_from` (默认: 3天)
2. **订单类型判断**:
   - 如果 `buySampleChecked` 为 `true`: 使用 `rts_for_sample_order` (默认: 1天)
   - 如果 `buySampleChecked` 为 `false`: 使用 `rts_for_bulk_order` (默认: 2天)
3. **日期格式**: MM/DD/YYYY

### 示例计算：
- **批量订单**: 当前日期 + 3天 + 2天 = 5天后
- **样品订单**: 当前日期 + 3天 + 1天 = 4天后

### 显示控制：
- 只有当 `store.rts_date` 为 `true` 时才显示 "Estimated Ship Date:" 行
- "Estimated Delivery:" 行始终显示

## API 数据结构

系统从聚合 API 的 `product.shipping_info` 路径获取以下数据：

```json
{
  "product": {
    "data": {
      "rts_date": true,
      "shipping_info": {
        "rts_date_starts_from": 3,
        "rts_for_bulk_order": 2,
        "rts_for_sample_order": 1
      }
    }
  }
}
```

### 数据字段说明：
- **rts_date**: 控制是否显示 "Estimated Ship Date" 行
- **rts_date_starts_from**: 基础发货天数
- **rts_for_bulk_order**: 批量订单额外处理天数（从 shipping_info 获取）
- **rts_for_sample_order**: 样品订单额外处理天数（从 shipping_info 获取）

## 测试文件

创建了 `test-rts-date.html` 测试文件，包含：
- 显示控制测试 (显示/隐藏 RTS Date)
- 订单类型切换测试 (批量订单/样品订单)
- 时间参数调整测试 (可调整各个时间参数)
- 实时日期计算显示

## 使用方法

### 在组件中使用：
```javascript
const store = useProductStore();

// 获取计算的发货日期
console.log(store.estimatedShipDate); // "01/15/2025"

// 控制显示
store.setRtsDate(true);  // 显示 Estimated Ship Date
store.setRtsDate(false); // 隐藏 Estimated Ship Date

// 设置订单类型
store.setBuySampleChecked(true);  // 样品订单
store.setBuySampleChecked(false); // 批量订单

// 自定义时间参数
store.setRtsDateStartsFrom(5);    // 基础5天
store.setRtsForBulkOrder(3);      // 批量订单额外3天
store.setRtsForSampleOrder(1);    // 样品订单额外1天
```

## 响应式特性

- 当 `buySampleChecked` 状态改变时，发货日期会自动重新计算
- 当任何时间参数改变时，发货日期会实时更新
- 当 `rts_date` 改变时，显示状态会立即响应

## 兼容性

- 所有参数都有合理的默认值
- 如果 API 数据不可用，使用默认配置
- 向后兼容现有的产品数据结构