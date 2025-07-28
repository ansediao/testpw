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

## 最佳实践

1. **条件加载**: 仅在需要的产品页面加载 CDN 脚本
2. **事件驱动**: 使用 `pwCdnLoaded` 事件确保脚本加载完成
3. **错误处理**: 包含适当的错误处理和回退机制
4. **性能优化**: 避免重复加载和不必要的初始化
5. **调试友好**: 包含控制台日志便于开发调试

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

### 调试步骤

1. 打开浏览器开发者工具
2. 查看控制台日志确认脚本加载状态
3. 检查网络面板确认 CDN 资源加载
4. 验证 `pwCdnLoaded` 事件是否触发
5. 检查 Vue 应用挂载状态