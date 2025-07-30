# Vue 3 + Pinia 响应式系统最佳实践

## 概述

本文档记录了在 PW Canvas 插件开发过程中发现的 Vue 3 + Pinia 响应式系统的关键问题和解决方案。这些实践确保了组件能够正确响应数据变化，避免常见的响应式失效问题。

## 核心问题：响应式绑定失效

### 问题描述

在 Vue 3 + Pinia 环境中，直接解构或返回 store 属性会导致响应式连接断开：

```javascript
// ❌ 错误：直接返回 store 属性会失去响应式
setup() {
    const store = useProductStore();
    return {
        variants: store.variants,  // 这不是响应式的！
        loading: store.loading
    };
}
```

### 根本原因

1. **Proxy 代理机制**: Vue 3 使用 Proxy 来追踪数据变化
2. **解构断开连接**: 直接解构会断开 Proxy 连接
3. **Pinia 特殊性**: Pinia store 的属性需要特殊处理才能保持响应式

## 解决方案

### 方案一：使用 toRefs（推荐）

```javascript
setup() {
    const { toRefs } = Vue;
    const store = useProductStore();
    const storeRefs = toRefs(store);
    
    return {
        variants: storeRefs.variants,      // ✅ 保持响应式
        loading: storeRefs.loading,
        selectedVariant: storeRefs.selectedVariant
    };
}
```

### 方案二：使用计算属性

```javascript
setup() {
    const store = useProductStore();
    
    return {
        variants: Vue.computed(() => store.variants),           // ✅ 响应式
        loading: Vue.computed(() => store.loading),
        selectedVariant: Vue.computed(() => store.selectedVariant)
    };
}
```

### 方案三：直接在模板中使用 store

```javascript
setup() {
    const store = useProductStore();
    return { store };  // ✅ 在模板中使用 store.variants
}

// 模板中：{{ store.variants.length }}
```

## 数据监听最佳实践

### 监听 Store 数据变化

```javascript
setup() {
    const { watch, onMounted } = Vue;
    const store = useProductStore();
    
    const updateComponentState = () => {
        // 根据 store 数据更新组件状态
        if (store.productData && store.productData.apiData) {
            // 处理数据...
        }
    };
    
    // 组件挂载时检查数据
    onMounted(() => {
        if (store.isDataFetched && store.productData) {
            updateComponentState();
        }
    });
    
    // 监听数据获取状态
    watch(() => store.isDataFetched, (newValue) => {
        if (newValue && store.productData) {
            updateComponentState();
        }
    });
    
    // 监听具体数据变化
    watch(() => store.productData, (newData) => {
        if (newData && newData.apiData) {
            updateComponentState();
        }
    });
}
```

## API 调用防重复机制

### Store 层面的防重复实现

```javascript
const useProductStore = Pinia.defineStore('product', () => {
    const productData = Vue.ref(null);
    const loading = Vue.ref(false);
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
        
        // 创建新的请求 Promise
        fetchPromise.value = (async () => {
            loading.value = true;
            try {
                const apiData = await window.productDataAPI.fetchCurrentProductData();
                
                // 处理数据
                productData.value = processApiData(apiData);
                isDataFetched.value = true;
                
                return productData.value;
            } catch (error) {
                throw error;
            } finally {
                loading.value = false;
                fetchPromise.value = null;
            }
        })();
        
        return fetchPromise.value;
    };
    
    return {
        productData,
        loading,
        isDataFetched,
        fetchProductData
    };
});
```

## 组件开发模式

### 标准组件结构

```javascript
const MyComponent = {
    name: 'MyComponent',
    template: `
        <div class="my-component">
            <div v-if="loading">Loading...</div>
            <div v-else-if="error">Error: {{ error }}</div>
            <div v-else-if="data">
                <!-- 组件内容 -->
            </div>
        </div>
    `,
    setup() {
        const { toRefs, watch, onMounted } = Vue;
        const store = useProductStore();
        
        // 使用 toRefs 保持响应式
        const storeRefs = toRefs(store);
        
        // 本地响应式状态
        const localState = Vue.ref(null);
        
        // 更新本地状态的方法
        const updateLocalState = () => {
            if (store.productData) {
                localState.value = processStoreData(store.productData);
            }
        };
        
        // 生命周期
        onMounted(() => {
            if (store.isDataFetched) {
                updateLocalState();
            }
        });
        
        // 数据监听
        watch(() => store.productData, (newData) => {
            if (newData) {
                updateLocalState();
            }
        });
        
        return {
            // Store 响应式数据
            loading: storeRefs.loading,
            error: storeRefs.error,
            data: storeRefs.productData,
            
            // 本地状态
            localState
        };
    }
};
```

## 常见陷阱和解决方案

### 陷阱 1：条件渲染导致的响应式问题

```javascript
// ❌ 错误：条件判断阻止了组件渲染
template: `
    <div v-if="showComponent" class="component">
        <div v-if="variants.length === 0">无数据</div>
        <div v-else>有数据</div>
    </div>
`

// showComponent 为 false 时，整个组件不渲染，
// 即使后来 variants 有数据，也不会显示

// ✅ 正确：分离条件判断
template: `
    <div class="component">
        <div v-if="loading">Loading...</div>
        <div v-else-if="variants.length === 0">无数据</div>
        <div v-else>有数据</div>
    </div>
`
```

### 陷阱 2：异步数据的时序问题

```javascript
// ❌ 错误：组件可能在数据加载前就渲染了
onMounted(() => {
    // 假设数据已经存在
    processData(store.variants);
});

// ✅ 正确：检查数据状态并监听变化
onMounted(() => {
    if (store.isDataFetched && store.variants) {
        processData(store.variants);
    }
});

watch(() => store.variants, (newVariants) => {
    if (newVariants && newVariants.length > 0) {
        processData(newVariants);
    }
});
```

### 陷阱 3：Store 实例化时机问题

```javascript
// ❌ 错误：可能在 Pinia 初始化前访问 store
const productStore = typeof window.useProductStore === 'function' 
    ? window.useProductStore() 
    : {};

// ✅ 正确：直接使用，确保在正确的上下文中
const productStore = useProductStore();
```

## 调试技巧

### 1. 使用 Vue DevTools

- 安装 Vue DevTools 浏览器扩展
- 检查组件的响应式状态
- 监控 Pinia store 的数据变化

### 2. 临时调试代码

```javascript
// 在组件中添加临时调试
watch(() => store.variants, (newValue, oldValue) => {
    console.log('Variants changed:', { old: oldValue, new: newValue });
}, { deep: true, immediate: true });

// 检查响应式绑定
const debugVariants = Vue.computed(() => {
    console.log('Computed variants accessed:', store.variants);
    return store.variants;
});
```

### 3. 数据流追踪

```javascript
// 在 Store 中添加调试
const setVariants = (vars) => {
    console.log('Setting variants:', vars);
    variants.value = vars;
    console.log('Variants set, current value:', variants.value);
};
```

## 性能优化建议

### 1. 避免不必要的响应式

```javascript
// ❌ 避免：对静态数据使用响应式
const staticConfig = Vue.ref({
    apiUrl: '/api/products',
    timeout: 5000
});

// ✅ 推荐：静态数据直接使用
const staticConfig = {
    apiUrl: '/api/products',
    timeout: 5000
};
```

### 2. 使用 shallowRef 优化大对象

```javascript
// 对于大型对象，如果不需要深度响应式
const largeData = Vue.shallowRef(null);
```

### 3. 合理使用计算属性

```javascript
// ✅ 计算属性会缓存结果
const expensiveComputation = Vue.computed(() => {
    return store.variants.map(variant => {
        // 复杂计算...
        return processVariant(variant);
    });
});
```

## 总结

1. **始终使用 `toRefs` 或计算属性**来保持 Pinia store 的响应式
2. **在 Store 层面实现防重复调用机制**，避免多个组件重复请求
3. **使用 `watch` 监听数据变化**，处理异步数据加载
4. **分离条件渲染逻辑**，避免阻止组件更新
5. **合理使用调试工具**，快速定位响应式问题

这些实践确保了 Vue 3 + Pinia 应用的稳定性和性能，避免了常见的响应式陷阱。