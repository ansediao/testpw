# Vue 3 + Pinia + Axios CDN 集成

## 概述

PW Canvas 插件现在支持在产品页面通过 CDN 方式加载 Vue 3、Pinia 和 Axios，为现代前端开发提供完整的响应式框架支持。

## 核心模块

### CDN 加载器模块 (`class-pw-cdn-loader.php`)

负责在产品页面加载必要的 CDN 脚本：

- **Vue 3**: `https://unpkg.com/vue@3/dist/vue.global.js`
- **VueDemi**: `https://unpkg.com/vue-demi@0.14.5/lib/index.iife.js` (Pinia 依赖)
- **Pinia**: `https://unpkg.com/pinia@2/dist/pinia.iife.js`
- **Axios**: `https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js`

#### 加载条件
- 仅在产品页面 (`is_product()`) 加载
- 仅对同步产品 (`pw_isSyncProduct = '1'`) 加载
- 防重复加载机制
- 钩子优先级：5 (确保在其他模块之前加载)

#### 全局变量
加载完成后创建以下全局变量：
```javascript
window.pwVue = Vue;           // Vue 3 实例
window.pwPinia = pinia;       // Pinia 实例
window.pwAxios = axios;       // Axios 实例
window.PiniaDefineStore = Pinia.defineStore; // defineStore 函数
```

### 事件系统

#### pwCdnLoaded 事件
当所有 CDN 脚本加载完成后触发自定义事件：

```javascript
document.addEventListener('pwCdnLoaded', function(event) {
    const { vue: Vue, pinia, axios, defineStore } = event.detail;
    
    // 现在可以安全使用这些库
});
```

## 使用方法

### 基础 Vue 3 应用

```javascript
document.addEventListener('pwCdnLoaded', function(event) {
    const { vue: Vue } = event.detail;
    const { createApp, ref, onMounted } = Vue;
    
    const app = createApp({
        setup() {
            const message = ref('Hello Vue 3!');
            const count = ref(0);
            
            const increment = () => count.value++;
            
            onMounted(() => {
                console.log('Vue 应用已挂载');
            });
            
            return { message, count, increment };
        },
        template: `
            <div>
                <h4>{{ message }}</h4>
                <p>计数: {{ count }}</p>
                <button @click="increment()">增加</button>
            </div>
        `
    });
    
    app.mount('#my-vue-app');
});
```

### Vue 3 + Pinia 状态管理

```javascript
document.addEventListener('pwCdnLoaded', function(event) {
    const { vue: Vue, pinia, defineStore } = event.detail;
    
    // 创建 Pinia store
    const useCounterStore = defineStore('counter', {
        state: () => ({
            count: 0,
            items: []
        }),
        actions: {
            increment() {
                this.count++;
            },
            async fetchItems() {
                // 异步操作
                const response = await fetch('/api/items');
                this.items = await response.json();
            }
        }
    });
    
    // 创建 Vue 应用
    const { createApp } = Vue;
    const app = createApp({
        setup() {
            const store = useCounterStore();
            return { store };
        },
        template: `
            <div>
                <p>计数: {{ store.count }}</p>
                <button @click="store.increment()">增加</button>
                <button @click="store.fetchItems()">获取数据</button>
            </div>
        `
    });
    
    app.use(pinia);
    app.mount('#pinia-app');
});
```

### 集成 Axios API 调用

```javascript
document.addEventListener('pwCdnLoaded', function(event) {
    const { vue: Vue, axios, defineStore } = event.detail;
    
    const useApiStore = defineStore('api', {
        state: () => ({
            data: null,
            loading: false,
            error: null
        }),
        actions: {
            async fetchData(endpoint) {
                this.loading = true;
                this.error = null;
                
                try {
                    const response = await axios.get(endpoint);
                    this.data = response.data;
                } catch (error) {
                    this.error = error.message;
                } finally {
                    this.loading = false;
                }
            }
        }
    });
    
    // 使用 store...
});
```

## 模块开发规范

### 创建新的 Vue 模块

1. **继承基础模块结构**：
```php
class Pw_My_Vue_Module {
    public function __construct() {
        add_action('pw_admin_single_product_custom_content', array($this, 'display_component'), 50);
    }
    
    public function display_component() {
        // 检查产品条件
        global $product;
        if (!is_a($product, 'WC_Product')) return;
        
        $product_id = $product->get_id();
        $pw_isSyncProduct = get_post_meta($product_id, 'pw_isSyncProduct', true);
        if ($pw_isSyncProduct !== '1') return;
        
        // 输出 HTML 和 JavaScript
    }
}
```

2. **监听 CDN 加载事件**：
```javascript
document.addEventListener('pwCdnLoaded', function(event) {
    // 初始化你的 Vue 组件
});
```

3. **注册模块**：
在 `public/class-pw-admin-public.php` 中添加：
```php
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-my-vue-module.php';
// 在 initialize_modules() 中添加：
new Pw_My_Vue_Module();
```

### 优先级管理

- **CDN 加载器**: 优先级 5
- **基础组件**: 优先级 10-30
- **复杂组件**: 优先级 40-60
- **示例组件**: 优先级 60+

### 调试支持

CDN 加载器包含详细的控制台日志：
- 脚本加载状态检查
- Pinia 对象属性显示
- 事件分发确认
- 错误信息输出

## 示例模块

### 简单示例 (`class-pw-vue-simple.php`)
- 基础 Vue 3 功能演示
- 不依赖 Pinia
- 包含响应式数据和方法

### 完整示例 (`class-pw-vue-example.php`)
- Vue 3 + Pinia + Axios 集成
- 状态管理演示
- API 调用示例

## 响应式系统最佳实践

### Pinia Store 响应式绑定

**❌ 错误做法 - 直接解构会失去响应式**：
```javascript
setup() {
    const store = useProductStore();
    return {
        variants: store.variants,  // 失去响应式连接！
        loading: store.loading
    };
}
```

**✅ 正确做法 - 使用 toRefs 保持响应式**：
```javascript
setup() {
    const { toRefs } = Vue;
    const store = useProductStore();
    const storeRefs = toRefs(store);
    
    return {
        variants: storeRefs.variants,  // 保持响应式
        loading: storeRefs.loading
    };
}
```

**✅ 替代方案 - 使用计算属性**：
```javascript
setup() {
    const store = useProductStore();
    
    return {
        variants: Vue.computed(() => store.variants),
        loading: Vue.computed(() => store.loading)
    };
}
```

### API 调用防重复机制

**实现单次 API 调用的 Store 模式**：
```javascript
const useProductStore = Pinia.defineStore('product', () => {
    const isDataFetched = Vue.ref(false);
    const fetchPromise = Vue.ref(null);
    
    const fetchProductData = async () => {
        // 防重复调用
        if (isDataFetched.value && productData.value) {
            return productData.value;
        }
        
        // 防并发调用
        if (fetchPromise.value) {
            return fetchPromise.value;
        }
        
        fetchPromise.value = (async () => {
            try {
                const apiData = await window.productDataAPI.fetchCurrentProductData();
                // 处理数据...
                isDataFetched.value = true;
                return productData.value;
            } finally {
                fetchPromise.value = null;
            }
        })();
        
        return fetchPromise.value;
    };
    
    return { fetchProductData, isDataFetched };
});
```

### 组件数据监听模式

**监听 Store 数据变化**：
```javascript
setup() {
    const { watch, onMounted } = Vue;
    const store = useProductStore();
    
    const updateComponentState = () => {
        // 更新组件状态
    };
    
    onMounted(() => {
        // 如果数据已存在，立即更新
        if (store.isDataFetched && store.productData) {
            updateComponentState();
        }
    });
    
    // 监听数据变化
    watch(() => store.isDataFetched, (newValue) => {
        if (newValue && store.productData) {
            updateComponentState();
        }
    });
    
    watch(() => store.productData, (newData) => {
        if (newData) {
            updateComponentState();
        }
    });
}
```

## 架构最佳实践

1. **条件加载**: 仅在需要的产品页面加载 CDN 脚本
2. **事件驱动**: 使用 `pwCdnLoaded` 事件确保脚本加载完成
3. **统一数据流**: 所有 API 调用通过 Store 统一管理，避免组件直接调用
4. **响应式绑定**: 使用 `toRefs` 或计算属性保持 Pinia store 的响应式
5. **防重复请求**: 在 Store 层面实现请求去重和状态管理
6. **错误处理**: 包含适当的错误处理和回退机制
7. **性能优化**: 避免重复加载和不必要的初始化
8. **调试友好**: 在开发环境包含必要的调试信息

## 故障排除

### 常见问题

1. **defineStore is not a function**
   - 确保使用 `event.detail.defineStore` 而不是 `pinia.defineStore`
   - 检查 CDN 脚本加载顺序

2. **Vue 应用无法挂载**
   - 确认目标 DOM 元素存在
   - 检查 `pwCdnLoaded` 事件是否正确触发

3. **Axios 请求失败**
   - 检查 WordPress REST API 端点
   - 确认 nonce 验证（如需要）

4. **组件数据不更新（响应式失效）**
   - 检查是否直接解构了 Pinia store
   - 使用 `toRefs()` 或计算属性保持响应式
   - 确认 Store 中的数据是用 `Vue.ref()` 或 `Vue.reactive()` 创建的

5. **重复 API 调用**
   - 检查是否有多个组件同时调用 API
   - 在 Store 层面实现防重复调用机制
   - 确保只在应用初始化时调用一次数据获取

6. **数据获取时序问题**
   - 组件挂载时数据可能还未加载完成
   - 使用 `watch` 监听数据变化
   - 在 `onMounted` 中检查数据是否已存在

### 调试步骤

1. 打开浏览器开发者工具
2. 查看控制台日志确认脚本加载状态
3. 检查网络面板确认 CDN 资源加载
4. 验证 `pwCdnLoaded` 事件是否触发
5. 检查 Vue 应用挂载状态
6. 使用 Vue DevTools 检查组件状态和 Pinia store
7. 检查响应式绑定是否正常工作

## 当前产品页面架构

### 文件结构
```
public/js/product/
├── main.js                    # 应用入口和初始化
├── api/
│   └── productDataAPI.js      # 统一 API 调用模块
├── stores/
│   └── productStore.js        # Pinia 状态管理
└── components/
    ├── ColorVariants.js       # 颜色变体选择器
    ├── CheckboxOptions.js     # 复选框选项
    ├── ProductQuantity.js     # 数量选择器
    └── AddToCart.js          # 添加到购物车
```

### 数据流架构

1. **应用初始化** (`main.js`)
   - 检查依赖加载状态
   - 创建 Vue 应用和 Pinia 实例
   - 设置产品 ID 并触发数据获取

2. **API 聚合** (`productDataAPI.js`)
   - 统一的 API 调用接口
   - 错误处理和重试机制
   - 支持单个和批量数据获取

3. **状态管理** (`productStore.js`)
   - 集中管理所有产品相关状态
   - 防重复 API 调用机制
   - 响应式数据更新

4. **组件消费** (各个组件)
   - 使用 `toRefs` 保持响应式绑定
   - 监听 Store 数据变化
   - 避免直接 API 调用

### 组件通信模式

```javascript
// Store 作为唯一数据源
const useProductStore = Pinia.defineStore('product', () => {
    const variants = Vue.ref([]);
    const selectedVariant = Vue.ref(null);
    
    return { variants, selectedVariant };
});

// 组件 A：颜色选择器
const ColorVariants = {
    setup() {
        const store = useProductStore();
        const storeRefs = toRefs(store);
        
        return {
            variants: storeRefs.variants,
            selectedVariant: storeRefs.selectedVariant
        };
    }
};

// 组件 B：价格显示器
const PriceDisplay = {
    setup() {
        const store = useProductStore();
        
        const currentPrice = Vue.computed(() => {
            return store.selectedVariant?.price || 0;
        });
        
        return { currentPrice };
    }
};
```

### 性能优化策略

1. **单次数据获取**: 应用启动时统一获取所有数据
2. **响应式更新**: 数据变化时所有相关组件自动更新
3. **按需渲染**: 使用 `v-if` 和 `v-show` 优化渲染性能
4. **计算属性缓存**: 使用 `computed` 缓存复杂计算结果