# PW Canvas 模块化架构开发指南

本文档指导工程师按照现有架构添加新的产品页面模块。

## 📁 项目结构

```
cuz_cart_checkout/
├── public/
│   ├── js/product/
│   │   ├── api/
│   │   │   └── productDataAPI.js          # API 通信模块
│   │   ├── components/
│   │   │   ├── ProductInfo.js             # 产品信息组件
│   │   │   ├── ProductQuantity.js         # 数量选择组件
│   │   │   ├── AddToCart.js               # 加购物车组件
│   │   │   ├── ColorVariants.js           # 颜色变体组件
│   │   │   └── ColorVariants.css          # 组件样式
│   │   ├── stores/
│   │   │   └── productStore.js            # Pinia 状态管理
│   │   └── main.js                        # Vue 应用入口
│   └── modules/
│       └── class-pw-cdn-loader.php        # CDN 资源加载器
└── README_MODULE_DEVELOPMENT.md           # 本文档
```

## 🎯 架构概述

### 技术栈
- **前端框架**: Vue 3 (Composition API)
- **状态管理**: Pinia
- **HTTP 客户端**: Axios
- **CSS**: 原生 CSS + 组件级样式
- **后端**: WordPress Plugin + REST API

### 核心原则
1. **模块化**: 每个功能独立为一个 Vue 组件
2. **状态共享**: 通过 Pinia store 共享数据
3. **API 驱动**: 通过 REST API 获取数据
4. **Composition API**: 使用 Vue 3 组合式 API
5. **渐进增强**: 支持模块独立加载和容错

## 🚀 添加新模块步骤

### 步骤 1: 创建 Vue 组件

在 `public/js/product/components/` 目录下创建新组件文件：

```javascript
// 示例: public/js/product/components/NewModule.js

/**
 * 新模块组件
 * 描述组件功能
 */

const NewModule = {
    name: 'NewModule',
    
    template: \`
        <div class="pw-new-module">
            <div class="module-header">
                <h4>{{ title }}</h4>
            </div>
            
            <div class="module-content">
                <div v-if="loading" class="loading">加载中...</div>
                <div v-else-if="error" class="error">{{ error }}</div>
                <div v-else>
                    <!-- 您的模块内容 -->
                    <p>{{ data?.someField || '暂无数据' }}</p>
                </div>
            </div>
        </div>
    \`,
    
    setup() {
        // 1. 导入 Vue API
        const { ref, onMounted, computed } = Vue;
        
        // 2. 访问 Pinia store
        const productStore = useProductStore();
        
        // 3. 响应式数据
        const loading = ref(true);
        const error = ref('');
        const data = ref(null);
        const title = ref('新模块');
        
        // 4. 计算属性
        const shouldDisplay = computed(() => {
            return !loading.value && data.value;
        });
        
        // 5. 方法
        const loadData = async () => {
            try {
                loading.value = true;
                error.value = '';
                
                // 获取产品数据
                const productData = await window.productDataAPI.fetchCurrentProductData();
                
                // 处理数据
                if (productData.has_your_feature) {
                    data.value = productData.your_feature_data;
                }
                
            } catch (err) {
                console.error('新模块加载失败:', err);
                error.value = '加载失败: ' + err.message;
            } finally {
                loading.value = false;
            }
        };
        
        const handleUserAction = (param) => {
            // 处理用户交互
            console.log('用户操作:', param);
            
            // 更新 store（可选）
            if (productStore.setSomeData) {
                productStore.setSomeData(param);
            }
        };
        
        // 6. 生命周期
        onMounted(() => {
            // 延迟加载确保依赖就绪
            setTimeout(loadData, 1000);
        });
        
        // 7. 返回模板需要的数据和方法
        return {
            loading,
            error,
            data,
            title,
            shouldDisplay,
            handleUserAction
        };
    }
};

// 8. 导出到全局
window.NewModule = NewModule;
```

### 步骤 2: 创建组件样式（可选）

```css
/* public/js/product/components/NewModule.css */

.pw-new-module {
    background: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    margin: 15px 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.module-header h4 {
    margin: 0 0 15px 0;
    font-size: 18px;
    color: #333;
    font-weight: 600;
}

.module-content .loading,
.module-content .error {
    text-align: center;
    padding: 20px;
    color: #666;
}

.module-content .error {
    color: #d63638;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .pw-new-module {
        padding: 15px;
        margin: 10px 0;
    }
}
```

### 步骤 3: 在 CDN Loader 中注册

修改 `public/modules/class-pw-cdn-loader.php`：

```php
// 在组件加载部分添加
<script src="<?php echo plugin_dir_url(__FILE__) . '../js/product/components/NewModule.js?v=' . time(); ?>"></script>

<!-- 如果有样式文件 -->
<link rel="stylesheet" href="<?php echo plugin_dir_url(__FILE__) . '../js/product/components/NewModule.css?v=' . time(); ?>">
```

### 步骤 4: 在主应用中注册

修改 `public/js/product/main.js`：

```javascript
// 1. 在模块检查中添加
const modulesLoaded = {
    store: !!window.useProductStore,
    productInfo: !!window.ProductInfo,
    productQuantity: !!window.ProductQuantity,
    addToCart: !!window.AddToCart,
    colorVariants: !!window.ColorVariants,
    newModule: !!window.NewModule  // 添加这行
};

// 2. 在组件注册中添加
components: {
    ProductInfo: window.ProductInfo,
    ProductQuantity: window.ProductQuantity,
    AddToCart: window.AddToCart,
    ColorVariants: window.ColorVariants,
    NewModule: window.NewModule  // 添加这行
},

// 3. 在模板中添加
template: \`
    <div class="pw-vue-modular-app">
        <div class="app-header">
            <h2>Modular Product Page</h2>
            <p>Product ID: {{ store.productId }}</p>
        </div>
        
        <div class="app-content">
            <div class="product-section">
                <ProductInfo />
            </div>
            
            <div class="color-variants-section">
                <ColorVariants />
            </div>
            
            <!-- 添加新模块 -->
            <div class="new-module-section">
                <NewModule />
            </div>
            
            <div class="quantity-section">
                <ProductQuantity />
            </div>
            
            <div class="cart-section">
                <AddToCart />
            </div>
        </div>
        
        <div class="app-footer">
            <p><small>Powered by Vue 3 + Pinia</small></p>
        </div>
    </div>
\`
```

### 步骤 5: 扩展 Pinia Store（可选）

如果需要与其他组件共享状态，修改 `public/js/product/stores/productStore.js`：

```javascript
// 使用 Vue 3 Composition API 的 Pinia store
const useProductStore = Pinia.defineStore('product', () => {
    // State - 使用 ref 和 reactive 定义响应式数据
    const productId = Vue.ref(null);
    const productData = Vue.ref(null);
    const loading = Vue.ref(false);
    const error = Vue.ref(null);
    const selectedVariant = Vue.ref(null);
    const variants = Vue.ref([]);
    const quantity = Vue.ref(1);
    const selectedOptions = Vue.reactive({});
    const showDetails = Vue.ref(false);
    const activeTab = Vue.ref('description');
    
    // Getters - 使用 computed 定义计算属性
    const isLoading = Vue.computed(() => loading.value);
    const hasError = Vue.computed(() => error.value !== null);
    const totalPrice = Vue.computed(() => {
        if (selectedVariant.value && selectedVariant.value.price) {
            return parseFloat(selectedVariant.value.price) * quantity.value;
        }
        if (!productData.value || !productData.value.price) return 0;
        return productData.value.price * quantity.value;
    });
    const canAddToCart = Vue.computed(() => {
        return productData.value && quantity.value > 0 && !loading.value;
    });
    const hasVariants = Vue.computed(() => variants.value.length > 0);
    const selectedVariantPrice = Vue.computed(() => {
        return selectedVariant.value ? parseFloat(selectedVariant.value.price) : 0;
    });
    
    // Actions - 使用普通函数定义方法
    const setProductId = (id) => {
        productId.value = id;
    };
    
    const setProductData = (data) => {
        productData.value = data;
    };
    
    const setLoading = (status) => {
        loading.value = status;
    };
    
    const setError = (err) => {
        error.value = err;
    };
    
    const updateQuantity = (qty) => {
        quantity.value = Math.max(1, qty);
    };
    
    const setSelectedOption = (key, value) => {
        selectedOptions[key] = value;
    };
    
    const toggleDetails = () => {
        showDetails.value = !showDetails.value;
    };
    
    const setActiveTab = (tab) => {
        activeTab.value = tab;
    };
    
    const setSelectedVariant = (variant) => {
        selectedVariant.value = variant;
        console.log('Store: 设置选中变体', variant);
    };
    
    const setVariants = (vars) => {
        variants.value = vars;
    };
    
    const fetchProductData = async () => {
        if (!productId.value) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.get(`/api/product/${productId.value}`);
            setProductData(response.data);
        } catch (err) {
            setError(err.message);
            console.error('Failed to fetch product data:', err);
        } finally {
            setLoading(false);
        }
    };
    
    const addToCart = async () => {
        if (!canAddToCart.value) return;
        
        setLoading(true);
        try {
            const cartData = {
                productId: productId.value,
                quantity: quantity.value,
                options: selectedOptions,
                variant: selectedVariant.value
            };
            
            await axios.post('/api/cart/add', cartData);
            console.log('Added to cart:', cartData);
        } catch (err) {
            setError(err.message);
            console.error('Failed to add to cart:', err);
        } finally {
            setLoading(false);
        }
    };
    
    // 返回所有需要在组件中访问的状态、计算属性和方法
    return {
        // State
        productId,
        productData,
        loading,
        error,
        selectedVariant,
        variants,
        quantity,
        selectedOptions,
        showDetails,
        activeTab,
        
        // Getters
        isLoading,
        hasError,
        totalPrice,
        canAddToCart,
        hasVariants,
        selectedVariantPrice,
        
        // Actions
        setProductId,
        setProductData,
        setLoading,
        setError,
        updateQuantity,
        setSelectedOption,
        toggleDetails,
        setActiveTab,
        setSelectedVariant,
        setVariants,
        fetchProductData,
        addToCart
    };
});

// 导出以供模块使用
window.useProductStore = useProductStore;
```

## 📋 开发规范

### Vue 组件规范

1. **命名规范**
   - 组件名使用 PascalCase: `ColorVariants`, `ProductInfo`
   - 文件名与组件名一致: `ColorVariants.js`
   - CSS 类名使用 kebab-case: `pw-color-variants`

2. **组件结构**
   ```javascript
   const ComponentName = {
       name: 'ComponentName',        // 组件名称
       template: `...`,              // 模板
       setup() {                     // Composition API
           // 导入 API
           // 响应式数据
           // 计算属性  
           // 方法
           // 生命周期
           // 返回
       }
   };
   ```

3. **状态管理**
   - 组件内部状态使用 `ref()` 或 `reactive()`
   - 跨组件状态通过 Pinia store 管理
   - 异步操作优先在组件内处理

4. **错误处理**
   - 所有异步操作都要有 try-catch
   - 提供友好的错误提示
   - 在控制台输出详细错误信息

### API 数据获取

```javascript
// 标准的数据获取模式
const loadData = async () => {
    try {
        loading.value = true;
        error.value = '';
        
        // 检查 API 是否可用
        if (typeof window.productDataAPI === 'undefined') {
            throw new Error('productDataAPI 未加载');
        }
        
        // 获取产品数据
        const productData = await window.productDataAPI.fetchCurrentProductData();
        
        // 验证数据
        if (!productData.has_your_feature) {
            // 处理无数据情况
            return;
        }
        
        // 处理数据
        data.value = productData.your_feature_data;
        
    } catch (err) {
        console.error('模块加载失败:', err);
        error.value = '加载失败: ' + err.message;
    } finally {
        loading.value = false;
    }
};
```

### CSS 样式规范

1. **类名前缀**: 所有样式类名以 `pw-` 开头
2. **模块化**: 每个组件有独立的 CSS 文件
3. **响应式**: 提供移动端适配
4. **命名规范**: 使用 BEM 方法论

```css
/* 示例样式结构 */
.pw-module-name {                    /* 组件根容器 */
    /* 基础样式 */
}

.pw-module-name__element {           /* 元素 */
    /* 元素样式 */
}

.pw-module-name__element--modifier { /* 修饰符 */
    /* 修饰样式 */
}

.pw-module-name .loading,           /* 状态类 */
.pw-module-name .error {
    /* 状态样式 */
}

@media (max-width: 768px) {         /* 响应式 */
    .pw-module-name {
        /* 移动端样式 */
    }
}
```

## 🔧 调试和测试

### 调试工具

1. **控制台输出**
   ```javascript
   console.log('模块名称：操作描述', data);
   console.error('模块名称：错误信息', error);
   ```

2. **Vue DevTools**
   - 安装 Vue DevTools 浏览器扩展
   - 查看组件状态和 Pinia store

3. **API 调试**
   - `productDataAPI` 会自动输出详细的 API 调用信息
   - 检查网络面板查看 REST API 请求

### 测试checklist

- [ ] 组件在有数据时正常显示
- [ ] 组件在无数据时显示占位信息
- [ ] 组件在加载时显示加载状态
- [ ] 组件在出错时显示错误信息
- [ ] 组件在移动端正常显示
- [ ] 组件与 store 的数据同步正常
- [ ] 控制台无错误输出

## 🎨 现有模块参考

### ColorVariants 组件
- **功能**: 产品颜色变体选择
- **数据来源**: `productData.variants.data`
- **触发条件**: `has_variants: true`
- **状态管理**: 选中变体存储在 store 中
- **文件**: `components/ColorVariants.js` + `ColorVariants.css`

### ProductInfo 组件
- **功能**: 基础产品信息显示
- **状态管理**: 产品数据存储在 store 中
- **文件**: `components/ProductInfo.js`

## 🚨 常见问题

### Q: 组件不显示？
A: 检查以下几点：
1. 组件是否正确注册到 `main.js`
2. CDN Loader 是否加载了组件文件
3. 控制台是否有 JavaScript 错误
4. 组件的显示条件是否满足

### Q: 数据获取失败？
A: 检查：
1. `productDataAPI` 是否加载
2. 产品是否有 `pw_id` meta
3. REST API 端点是否正常
4. 控制台网络面板查看请求状态

### Q: 样式不生效？
A: 检查：
1. CSS 文件是否正确加载
2. 类名是否拼写正确
3. CSS 选择器权重是否足够
4. 浏览器开发者工具查看样式覆盖情况

### Q: Store 状态不同步？
A: 检查：
1. 是否正确调用 store 的 action
2. Pinia store 是否正确初始化
3. 组件是否正确访问 store

## 📚 相关文档

- [Vue 3 Composition API 文档](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Pinia 状态管理文档](https://pinia.vuejs.org/)
- [Axios HTTP 客户端文档](https://axios-http.com/)
- [WordPress REST API 文档](https://developer.wordpress.org/rest-api/)

## 🔄 更新记录

- **v1.0.0** (2025-01-29): 初始版本，包含基础架构和 ColorVariants 模块示例
- **v1.1.0** (2025-01-30): 更新 Pinia store 为 Vue 3 Composition API 语法