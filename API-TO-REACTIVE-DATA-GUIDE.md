# API 数据提取到响应式状态管理指南

## 概述

本指南说明如何从 Promowares API 中提取数据，并将其转换为 Pinia 状态管理中的响应式数据，供所有 Vue 组件使用。

## 架构概览

```
API 数据 → productStore.js → Vue 组件
    ↓           ↓              ↓
聚合端点    响应式状态      组件消费
```

## 1. API 数据源

### 聚合 API 端点
```
GET /wp-json/pw/v1/product-data/{product_id}
```

### API 响应结构
```json
{
  "has_product_data": true,
  "product": {
    "data": {
      "id": 123,
      "name": "产品名称",
      "price": 29.99,
      "moq_setting": {
        "minimum_order_quantity": 10,
        "batch_quantity": 5,
        "sell_in_batch": true
      },
      "quantity_discount": [
        {"min_qty": 10, "discount": 0.05},
        {"min_qty": 50, "discount": 0.10}
      ]
    }
  },
  "has_variants": true,
  "variants": {
    "data": [
      {
        "id": 1,
        "color": "red",
        "price": 29.99,
        "anchor_price": 25.99
      }
    ]
  },
  "has_woocommerce_product": true,
  "woocommerce": {
    "id": 456,
    "name": "WooCommerce 产品名",
    "price": "29.99",
    "stock_status": "instock"
  }
}
```

## 2. 数据提取模式

### 在 productStore.js 中的 fetchProductData 方法

```javascript
const fetchProductData = async () => {
    try {
        // 1. 获取 API 数据
        const apiData = await window.productDataAPI.fetchCurrentProductData();

        // 2. 处理 WooCommerce 产品数据
        if (apiData.has_woocommerce_product && apiData.woocommerce) {
            const wooData = apiData.woocommerce;
            setProductData({
                id: wooData.id,
                name: wooData.name,
                price: parseFloat(wooData.price) || 0,
                // ... 其他字段
                apiData: apiData // 存储完整的 API 数据
            });
        }

        // 3. 处理特定业务数据
        if (apiData.has_product_data && apiData.product && apiData.product.data) {
            const productApiData = apiData.product.data;

            // 提取 MOQ 设置
            if (productApiData.moq_setting) {
                setMoqSettings(productApiData.moq_setting);
            }

            // 提取折扣设置
            if (productApiData.quantity_discount) {
                setQuantityDiscounts(productApiData.quantity_discount);
            }
        }

        // 4. 处理变体数据
        if (apiData.has_variants && apiData.variants && apiData.variants.data) {
            setVariants(apiData.variants.data);
        }

    } catch (err) {
        setError(err.message);
    }
};
```

## 3. 添加新的响应式数据字段

### 步骤 1: 在 Store 中定义状态

```javascript
const useProductStore = Pinia.defineStore('product', () => {
    // 现有状态...
    
    // 新增状态 - 例如：产品规格
    const productSpecs = Vue.ref({
        material: '',
        dimensions: {},
        weight: 0,
        colors: []
    });
    
    // 新增状态 - 例如：运输信息
    const shippingInfo = Vue.ref({
        estimated_days: 0,
        shipping_cost: 0,
        free_shipping_threshold: 0
    });
    
    // 计算属性
    const hasSpecs = Vue.computed(() => {
        return productSpecs.value.material !== '';
    });
    
    // 设置方法
    const setProductSpecs = (specs) => {
        if (specs) {
            productSpecs.value = {
                material: specs.material || '',
                dimensions: specs.dimensions || {},
                weight: specs.weight || 0,
                colors: specs.colors || []
            };
        }
    };
    
    const setShippingInfo = (info) => {
        if (info) {
            shippingInfo.value = {
                estimated_days: info.estimated_days || 0,
                shipping_cost: info.shipping_cost || 0,
                free_shipping_threshold: info.free_shipping_threshold || 0
            };
        }
    };
    
    // 返回状态和方法
    return {
        // 状态
        productSpecs,
        shippingInfo,
        
        // 计算属性
        hasSpecs,
        
        // 方法
        setProductSpecs,
        setShippingInfo,
        
        // ... 其他现有的返回值
    };
});
```

### 步骤 2: 在 fetchProductData 中提取数据

```javascript
// 在 fetchProductData 方法中添加
if (apiData.has_product_data && apiData.product && apiData.product.data) {
    const productApiData = apiData.product.data;

    // 现有的 MOQ 处理...
    
    // 新增：提取产品规格
    if (productApiData.specifications) {
        setProductSpecs(productApiData.specifications);
    }
    
    // 新增：提取运输信息
    if (productApiData.shipping_info) {
        setShippingInfo(productApiData.shipping_info);
    }
}
```

### 步骤 3: 在组件中使用

```javascript
const ProductSpecsComponent = {
    setup() {
        const store = useProductStore();
        const { toRefs } = Vue;
        const storeRefs = toRefs(store);
        
        return {
            productSpecs: storeRefs.productSpecs,
            hasSpecs: storeRefs.hasSpecs,
            shippingInfo: storeRefs.shippingInfo
        };
    },
    
    template: `
        <div v-if="hasSpecs" class="product-specs">
            <h4>产品规格</h4>
            <p>材质: {{ productSpecs.material }}</p>
            <p>重量: {{ productSpecs.weight }}kg</p>
            
            <div class="shipping-info">
                <p>预计发货: {{ shippingInfo.estimated_days }} 天</p>
                <p>运费: ${{ shippingInfo.shipping_cost }}</p>
            </div>
        </div>
    `
};
```

## 4. 数据提取最佳实践

### 4.1 数据验证和默认值

```javascript
const setProductSpecs = (specs) => {
    if (!specs || typeof specs !== 'object') {
        console.warn('Invalid specs data:', specs);
        return;
    }
    
    productSpecs.value = {
        material: specs.material || '未知',
        dimensions: {
            length: specs.dimensions?.length || 0,
            width: specs.dimensions?.width || 0,
            height: specs.dimensions?.height || 0
        },
        weight: parseFloat(specs.weight) || 0,
        colors: Array.isArray(specs.colors) ? specs.colors : []
    };
};
```

### 4.2 嵌套数据处理

```javascript
// 处理深层嵌套的 API 数据
if (apiData.has_product_data && 
    apiData.product && 
    apiData.product.data && 
    apiData.product.data.advanced_settings) {
    
    const advancedSettings = apiData.product.data.advanced_settings;
    
    // 提取嵌套的配置
    if (advancedSettings.customization_options) {
        setCustomizationOptions(advancedSettings.customization_options);
    }
    
    if (advancedSettings.pricing_rules) {
        setPricingRules(advancedSettings.pricing_rules);
    }
}
```

### 4.3 数组数据处理

```javascript
const setQuantityDiscounts = (discounts) => {
    if (!Array.isArray(discounts)) {
        console.warn('Discounts should be an array:', discounts);
        return;
    }
    
    quantityDiscounts.value = discounts.map(discount => ({
        min_qty: parseInt(discount.min_qty) || 0,
        discount: parseFloat(discount.discount) || 0,
        label: discount.label || `${discount.min_qty}+ 件`
    }));
};
```

### 4.4 条件数据提取

```javascript
// 根据产品类型提取不同数据
if (apiData.has_product_data && apiData.product && apiData.product.data) {
    const productApiData = apiData.product.data;
    const productType = productApiData.product_type;
    
    // 根据产品类型提取特定数据
    switch (productType) {
        case 'customizable':
            if (productApiData.customization_settings) {
                setCustomizationSettings(productApiData.customization_settings);
            }
            break;
            
        case 'bulk_only':
            if (productApiData.bulk_settings) {
                setBulkSettings(productApiData.bulk_settings);
            }
            break;
            
        default:
            // 标准产品处理
            break;
    }
}
```

## 5. 错误处理和调试

### 5.1 数据提取错误处理

```javascript
const extractApiData = (apiData, path, defaultValue = null) => {
    try {
        const keys = path.split('.');
        let current = apiData;
        
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return defaultValue;
            }
        }
        
        return current;
    } catch (error) {
        console.warn(`Failed to extract data from path: ${path}`, error);
        return defaultValue;
    }
};

// 使用示例
const moqSetting = extractApiData(apiData, 'product.data.moq_setting', {
    minimum_order_quantity: 1,
    batch_quantity: 1,
    sell_in_batch: false
});
```

### 5.2 调试工具

```javascript
// 添加调试方法到 Store
const debugApiData = () => {
    if (productData.value?.apiData) {
        console.group('🔍 API Data Debug');
        console.log('Full API Response:', productData.value.apiData);
        console.log('Product Data:', productData.value.apiData.product?.data);
        console.log('Variants:', productData.value.apiData.variants?.data);
        console.log('WooCommerce:', productData.value.apiData.woocommerce);
        console.groupEnd();
    }
};

// 在返回值中包含调试方法
return {
    // ... 其他返回值
    debugApiData
};
```

## 6. 完整示例：添加产品评级功能

### API 数据结构
```json
{
  "product": {
    "data": {
      "rating_info": {
        "average_rating": 4.5,
        "total_reviews": 128,
        "rating_breakdown": {
          "5": 80,
          "4": 30,
          "3": 12,
          "2": 4,
          "1": 2
        }
      }
    }
  }
}
```

### Store 实现
```javascript
// 1. 添加状态
const ratingInfo = Vue.ref({
    average_rating: 0,
    total_reviews: 0,
    rating_breakdown: {}
});

// 2. 添加计算属性
const hasRatings = Vue.computed(() => {
    return ratingInfo.value.total_reviews > 0;
});

const ratingStars = Vue.computed(() => {
    return Math.round(ratingInfo.value.average_rating);
});

// 3. 添加设置方法
const setRatingInfo = (rating) => {
    if (rating) {
        ratingInfo.value = {
            average_rating: parseFloat(rating.average_rating) || 0,
            total_reviews: parseInt(rating.total_reviews) || 0,
            rating_breakdown: rating.rating_breakdown || {}
        };
    }
};

// 4. 在 fetchProductData 中提取
if (productApiData.rating_info) {
    setRatingInfo(productApiData.rating_info);
}

// 5. 返回状态
return {
    ratingInfo,
    hasRatings,
    ratingStars,
    setRatingInfo,
    // ... 其他返回值
};
```

### 组件使用
```javascript
const ProductRating = {
    setup() {
        const store = useProductStore();
        const { toRefs } = Vue;
        const storeRefs = toRefs(store);
        
        return {
            ratingInfo: storeRefs.ratingInfo,
            hasRatings: storeRefs.hasRatings,
            ratingStars: storeRefs.ratingStars
        };
    },
    
    template: `
        <div v-if="hasRatings" class="product-rating">
            <div class="stars">
                <span v-for="n in 5" :key="n" 
                      :class="['star', { filled: n <= ratingStars }]">
                    ★
                </span>
            </div>
            <span class="rating-text">
                {{ ratingInfo.average_rating.toFixed(1) }} 
                ({{ ratingInfo.total_reviews }} 评价)
            </span>
        </div>
    `
};
```

## 7. 总结

### 数据流程
1. **API 调用** → 获取聚合数据
2. **数据验证** → 检查数据结构和有效性
3. **状态更新** → 调用相应的 setter 方法
4. **响应式传播** → 所有使用该数据的组件自动更新

### 关键原则
- **单一数据源**: 所有数据通过 Pinia Store 管理
- **响应式绑定**: 使用 `toRefs` 保持响应式连接
- **数据验证**: 始终验证 API 数据并提供默认值
- **错误处理**: 优雅处理数据提取失败的情况
- **调试友好**: 提供调试工具和详细日志

通过遵循这个模式，可以轻松地从 API 中提取任何数据并将其转换为响应式状态，供所有 Vue 组件使用。