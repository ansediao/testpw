# API 聚合系统

## 概述

PW Canvas 插件实现了 BFF（Backend for Frontend）模式的API聚合系统，通过单一端点聚合多个数据源，为前端提供统一的数据接口。

## 核心架构

### 聚合端点
- **端点**: `GET /wp-json/pw/v1/product-data/{product_id}`
- **实现类**: `Pw_Admin_Promowares_Api`
- **方法**: `get_aggregated_product_data()`

### 数据源集成

#### 1. Promowares API 数据源
```php
// 基础产品数据
GET https://dev.promowares.com/api/v1/products/{id}

// 产品模板数据
GET https://dev.promowares.com/api/v1/custom-templates/product/{id}

// 产品变体数据
GET https://dev.promowares.com/api/v1/plugin/variant_product/{id}
```

#### 2. 外部 Mock API 数据源
```php
// Mock 数据
GET https://mock.apipost.net/mock/2adf9164a465000/mock/2adf9164a465000/
```

#### 3. WooCommerce 数据源
```php
// 本地 WooCommerce 产品数据
$woo_product = wc_get_product($product_id);
```

## 响应数据结构

### 完整响应格式
```json
{
  "product": {
    "data": "Promowares基础产品数据"
  },
  "templates": {
    "data": "产品模板数据"
  },
  "variants": {
    "data": "产品变体/颜色数据"
  },
  "mock_data": {
    "data": "外部Mock API数据"
  },
  "woocommerce": {
    "id": 123,
    "name": "产品名称",
    "price": "29.99",
    "price_html": "$29.99",
    "stock_status": "instock",
    "in_stock": true,
    "permalink": "https://example.com/product/..."
  },
  "computed": {
    "is_customizable": true,
    "has_color_variants": true,
    "available_colors": ["red", "blue", "green"],
    "is_purchasable": true,
    "show_price": true,
    "mock_features": {
      "available_features": [],
      "recommendations": [],
      "settings": {},
      "metadata": {},
      "flags": {},
      "metrics": {},
      "raw_data": {}
    },
    "status": {
      "api_connected": true,
      "has_templates": true,
      "has_variants": true,
      "has_mock_data": true,
      "woo_synced": true,
      "ready_for_customization": true,
      "mock_enhanced": true
    }
  },
  "has_product_data": true,
  "has_templates": true,
  "has_variants": true,
  "has_mock_data": true,
  "has_woocommerce_product": true
}
```

## 业务逻辑计算

### 计算字段说明
- **is_customizable**: 基于模板数据判断产品是否可定制
- **has_color_variants**: 基于变体数据判断是否有颜色选项
- **available_colors**: 从变体数据中提取可用颜色列表
- **is_purchasable**: 综合库存和价格判断是否可购买
- **show_price**: 判断是否显示价格信息
- **mock_features**: 处理后的Mock数据特性

### Mock数据处理
系统自动从Mock数据中提取：
- `available_features`: 功能列表
- `recommendations`: 推荐内容
- `settings`: 配置信息
- `metadata`: 元数据
- `flags`: 布尔标志（自动识别）
- `metrics`: 数值指标（自动识别）
- `raw_data`: 原始数据备份

## 前端使用指南

### JavaScript 基础用法
```javascript
// 获取聚合数据
async function getProductData(productId) {
  try {
    const response = await fetch(`/wp-json/pw/v1/product-data/${productId}`);
    const data = await response.json();
    
    // 使用聚合数据
    if (data.computed.is_customizable) {
      showCustomizationOptions();
    }
    
    if (data.computed.has_color_variants) {
      renderColorSelector(data.computed.available_colors);
    }
    
    if (data.has_mock_data) {
      processEnhancedFeatures(data.computed.mock_features);
    }
    
    return data;
  } catch (error) {
    console.error('获取产品数据失败:', error);
    return null;
  }
}
```

### Vue.js 组件集成
```javascript
export default {
  data() {
    return {
      productData: null,
      loading: true,
      error: null
    }
  },
  
  async mounted() {
    await this.loadProductData();
  },
  
  methods: {
    async loadProductData() {
      try {
        this.loading = true;
        const response = await fetch(`/wp-json/pw/v1/product-data/${this.productId}`);
        this.productData = await response.json();
        
        // 根据聚合数据设置组件状态
        this.setupComponentState();
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    
    setupComponentState() {
      const { computed } = this.productData;
      
      // 设置定制选项
      this.showCustomizer = computed.is_customizable;
      
      // 设置颜色选择器
      this.colors = computed.available_colors;
      
      // 设置购买状态
      this.canPurchase = computed.is_purchasable;
      
      // 处理Mock增强功能
      if (computed.mock_features.flags?.showSpecialOffer) {
        this.showSpecialOffer = true;
      }
    }
  }
}
```

### React Hook 使用
```javascript
import { useState, useEffect } from 'react';

function useProductData(productId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(`/wp-json/pw/v1/product-data/${productId}`);
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (productId) {
      fetchData();
    }
  }, [productId]);
  
  return { data, loading, error };
}

// 在组件中使用
function ProductComponent({ productId }) {
  const { data, loading, error } = useProductData(productId);
  
  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;
  if (!data) return <div>无数据</div>;
  
  return (
    <div>
      {data.computed.is_customizable && <CustomizationPanel />}
      {data.computed.has_color_variants && (
        <ColorSelector colors={data.computed.available_colors} />
      )}
      {data.has_mock_data && (
        <EnhancedFeatures features={data.computed.mock_features} />
      )}
    </div>
  );
}
```

## 错误处理

### 容错机制
- 单个数据源失败不影响其他数据源
- 每个数据源都有独立的错误状态字段
- 提供详细的错误信息用于调试

### 错误响应示例
```json
{
  "has_product_data": false,
  "product_error": "API returned status code: 404",
  "has_templates": true,
  "templates": { "data": "..." },
  "has_mock_data": false,
  "mock_data_error": "Connection timeout",
  "computed": {
    "status": {
      "api_connected": false,
      "has_templates": true,
      "mock_enhanced": false
    }
  }
}
```

## 性能优化

### 缓存策略
- 可在 `call_promowares_api()` 和 `call_mock_api()` 方法中添加缓存
- 建议使用 WordPress Transients API 进行缓存
- 缓存时间建议：产品数据 15分钟，Mock数据 1小时

### 并发请求
- 当前实现为串行请求，可优化为并行请求
- 使用 `wp_remote_request()` 的异步特性
- 考虑实现请求超时和重试机制

## 扩展指南

### 添加新数据源
1. 在 `get_aggregated_product_data()` 中添加新的API调用
2. 创建对应的 `call_xxx_api()` 方法
3. 更新 `compute_business_logic()` 处理新数据
4. 更新响应结构文档

### 自定义业务逻辑
1. 修改 `compute_business_logic()` 方法
2. 添加新的计算字段
3. 更新前端使用文档

## 安全考虑

### API 安全
- Promowares API 使用 JWT 令牌认证
- Mock API 无敏感数据，可公开访问
- 所有外部请求都有超时限制

### 数据验证
- 所有外部API响应都进行JSON验证
- 使用 WordPress 数据清理函数
- 错误信息不暴露内部实现细节

## 监控和调试

### 日志记录
- 使用 `error_log()` 记录API调用失败
- 记录响应时间用于性能监控
- 记录数据源可用性统计

### 调试工具
- 响应中包含详细的状态信息
- 每个数据源都有独立的成功/失败标志
- 提供原始错误信息用于问题排查