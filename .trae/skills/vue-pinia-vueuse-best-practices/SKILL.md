---
name: "vue-pinia-vueuse-best-practices"
description: "PWCA 项目 Vue/Pinia/VueUse 状态管理最佳实践指南。涉及 Store 设计、State/Getter/Action 职责划分、Store 拆分、VueUse 集成时使用。"
---

# Vue / Pinia / VueUse 状态管理最佳实践

本 Skill 基于 PWCA 项目实际代码分析，总结出状态管理的最佳实践和常见反模式。

---

## 一、State 设计三原则

### 原则 1：State 只存放「源数据」，不存放「派生值」

派生值一律放到 Getter。State 应该是最小化的原始数据。

```js
// ✅ 正确：派生值放 getter
state: () => ({
    items: [],           // 源数据
    feePerItem: 7,       // 源数据
}),
getters: {
    totalFee() {         // 派生值
        return this.items.reduce((sum, i) => sum + i.quantity * this.feePerItem, 0);
    }
}

// ❌ 错误：派生值放到 state
state: () => ({
    items: [],
    totalFee: 0,         // 这是 items 和 feePerItem 的派生值，不应放 state
})
```

### 原则 2：State 字段要「高内聚分组」，避免平铺

当 state 字段超过 8 个时，考虑按领域分组为嵌套对象。

```js
// ❌ 当前项目问题：product-store.js 有 30+ 个平铺 ref
const quantity = Vue.ref(1);
const minQuantity = Vue.ref(1);
const maxQuantity = Vue.ref(9999);
const stepQuantity = Vue.ref(1);
// ... 25+ more

// ✅ 按领域分组
state: () => ({
    // 数据加载
    loading: false,
    error: null,
    data: null,
    // 数量控制
    quantity: {
        current: 1,
        min: 1,
        max: 9999,
        step: 1,
    },
    // 变体/选项
    variant: {
        selected: null,
        list: [],
        options: {},
    },
    // 功能开关
    features: {
        quantityDiscount: true,
        colorSample: true,
        customColor: true,
        gradientColor: true,
    },
    // RTS 日期
    rts: {
        startsFrom: 3,
        bulkOrderDays: 2,
        sampleOrderDays: 1,
    },
})
```

### 原则 3：State 初始值用有意义的值，不用 `null`

```js
// ❌ 大量初始值为 null
productData: null,      // 后续需要大量判空
views: null,

// ✅ 用空数组/空对象
productData: {},
views: [],
```

使用 `null` 的问题在于整个代码中到处需要 `&&` 链式判空。空数组/对象配合 Optional Chaining (`?.`) 更安全。

---

## 二、Getter 设计四原则

### 原则 1：Getter 必须包含计算逻辑，不直接返回 State

```js
// ❌ 当前项目问题：canvas store 中有 7 个 getter 仅透传 state
getUserPreferences: (state) => state.userPreferences,
getCanvasBackgroundColor: (state) => state.userPreferences.canvasBackgroundColor,
getShowGrid: (state) => state.userPreferences.showGrid,
// ... 这些都是反模式，应直接访问 state.userPreferences.showGrid

// ✅ 组件中直接用：store.userPreferences.showGrid
// 或如果需要响应式访问：storeToRefs(store).userPreferences
```

**判断标准**：如果一个 getter 的代码只是 `return state.xxx` 或 `return this.xxx`，那它不需要存在。

### 原则 2：Getter 使用箭头函数 vs 普通函数的区别

```js
getters: {
    // 箭头函数 getter：参数是 state，不能通过 this 访问其他 getter
    simpleGetter: (state) => state.items.length,

    // 普通函数 getter：可通过 this 访问其他 getter
    computedGetter() {
        return this.simpleGetter > 0; // ✅ 能访问其他 getter
    },

    // 函数式 getter（返回函数）：用于需要传参的场景
    getItemById: (state) => (id) => {
        return state.items.find(i => i.id === id);
    },
}
```

### 原则 3：多个 Getter 共享逻辑时，抽取到基础 Getter

```js
// ❌ 当前项目问题：3 个 getter 重复了相同的查找+合并逻辑
currentTextFontOptions(state) {
    const view = state.views.find(item => item.id === state.activeViewId);
    const merged = pwcaBuildMergedViewCustomizationSettings(view, state.storeCustomizationSettings);
    return pwcaResolveTextFontOptions(merged);
}
currentDefaultTextFontFamily(state) {
    const view = state.views.find(item => item.id === state.activeViewId);
    const merged = pwcaBuildMergedViewCustomizationSettings(view, state.storeCustomizationSettings);
    return pwcaResolveDefaultTextFontFamily(merged);
}
// ... 第 3 个同样重复

// ✅ 抽取公共 getter
getters: {
    currentViewMergedSettings(state) {
        const view = state.views.find(item => item.id === state.activeViewId);
        return pwcaBuildMergedViewCustomizationSettings(view, state.storeCustomizationSettings);
    },
    currentTextFontOptions() {
        return pwcaResolveTextFontOptions(this.currentViewMergedSettings);
    },
    currentDefaultTextFontFamily() {
        return pwcaResolveDefaultTextFontFamily(this.currentViewMergedSettings);
    },
    currentDefaultTextFontSize() {
        return pwcaResolveDefaultTextFontSize(this.currentViewMergedSettings);
    },
}
```

### 原则 4：派生状态用 Getter，不用 Watch + State 同步

```js
// ❌ 错误：watch state 变化并同步到另一个 state（双源问题）
watch(() => store.someValue, (val) => {
    store.derivedValue = val * 2; // 有了两个"真相来源"
});

// ✅ 正确：用 getter 派生，单一来源
getters: {
    derivedValue: (state) => state.someValue * 2,
}
```

---

## 三、Action 设计三原则

### 原则 1：Action 是唯一允许修改 State 的入口

组件中不应直接修改 Store 的 state，必须通过 Action。

```js
// ❌ 直接修改
store.layers = newLayers;

// ✅ 通过 Action
store.setLayers(newLayers);
```

例外：Vue 模板中可直接通过 `v-model` 绑定，这由 Pinia 的 `storeToRefs` + `writableComputed` 或 `v-model` 直接处理。

### 原则 2：异步操作（API 调用）放 Action，不放组件

```js
// ✅ 产品数据获取在 Action 中
actions: {
    async fetchProductData(pwId) {
        this.loading = true;
        this.error = null;
        try {
            const result = await fetchCanvasProductData(pwId);
            this.data = pwcaPrepareCanvasProductData(result.data);
            return this.data;
        } catch (e) {
            this.error = e.message;
            throw e;
        } finally {
            this.loading = false;
        }
    },
}
```

### 原则 3：Action 应该是简洁的命令式操作，不做复杂计算

复杂计算逻辑放到 Getter 或外部工具函数中。

```js
// ✅ Action 简洁，复杂逻辑委托给 getter
actions: {
    setViews(views) { this.views = views; },
    setActiveViewId(viewId) {
        this.activeViewId = viewId;
        // 复杂逻辑在 getter 中自动响应
    },
}
getters: {
    activeView() {
        return this.views.find(v => v.id === this.activeViewId) || null;
    },
}
```

---

## 四、Store 拆分策略

### 问题：Canvas Store 是典型的 "God Store"

当前 `useCanvasStore` 承担了 6+ 个领域的职责，行数超过 600 行：
- 画布状态（canvasStates, layers, viewLayers）
- 产品数据（productData, fetchProductData）
- 店铺设置（storeCustomizationSettings）
- 视图管理（views, activeView, setActiveViewId）
- 用户偏好（userPreferences）
- 颜色选择（selectedColorsByView）

### 拆分原则：按「数据所有权」和「变更频率」拆分

| 拆分维度 | 说明 | 适合场景 |
|----------|------|----------|
| 按领域 | 每个 Store 管一个领域 | 画布层 / 产品数据层 / 用户设置层 |
| 按生命周期 | 区分「应用级」和「页面级」 | 全局偏好 vs 当前会话状态 |
| 按变更频率 | 高频变更与低频分离 | 用户实时交互 vs 配置数据 |

### 推荐拆分方案

```
stores/
├── canvas-state-store.js     # 画布运行时状态（layers, activeCanvas, activeObject）
├── product-data-store.js     # 产品数据加载与缓存（productData, views, 加载状态）
├── customization-store.js    # 店铺/视图定制配置（storeSettings, mergedConfig）
├── print-method-store.js     # 印刷方式（已有，保持不变）
├── design-usage-store.js     # 设计使用计费（已有，保持不变）
├── user-preference-store.js  # 用户偏好 + useStorage 持久化
├── color-selection-store.js  # 视图颜色选择状态
└── mappers/                  # 数据映射工具（纯函数，不是 Store）
    ├── product-data-mapper.js
    ├── print-method-mapper.js
    └── view-restore-helper.js
```

### 跨 Store 通信原则

```js
// ❌ 当前项目做法：通过 window 全局变量
const printMethodStore = window.pwcaUsePrintMethodStore();

// ✅ Pinia 原生方式：在 action 中直接 import 其他 store
import { usePrintMethodStore } from './print-method-store.js';

actions: {
    setActiveViewId(viewId) {
        this.activeViewId = viewId;
        const printStore = usePrintMethodStore(); // Pinia 原生，直接在 action 内调用
        printStore.switchToViewPrintMethods(viewId);
    },
}
```

**注意**：跨 Store 引用只能在 `actions` 中进行，不能在 `getters` 中调用其他 Store（会破坏响应式追踪）。

---

## 五、VueUse 集成最佳实践

### 当前项目 VueUse 使用现状

仅在一处使用了 `useStorage`，且带有回退逻辑：

```js
userPreferences: window.VueUse && window.VueUse.useStorage 
    ? window.VueUse.useStorage('pwca-user-preferences', {...}) 
    : {...}
```

### 推荐使用的 VueUse API

| VueUse API | 替代场景 | 说明 |
|------------|----------|------|
| `useStorage` | localStorage 持久化的 state | 替代手动 localStorage 读写 |
| `useSessionStorage` | sessionStorage 持久化的 state | 会话级持久化 |
| `useAsyncState` | loading + error + data 三元组 | 替代手写 `isLoading, error, data` |
| `useDebounceFn` | 搜索/输入防抖 | 搜索输入、颜色值变更 |
| `useThrottleFn` | 高频事件节流 | 滚轮缩放、拖拽事件 |
| `useCloned` | 深拷贝 | 替代 `JSON.parse(JSON.stringify())` |
| `createGlobalState` | 跨组件共享状态 | 替代全局变量 `window.xxx` |
| `useMediaQuery` | 响应式布局 | 替代手动监听 `window.resize` |
| `useEventListener` | 事件监听 | 自动清理的事件绑定 |

### useAsyncState 替代手写 loading/error/data

```js
// ❌ 当前项目：手写 loading/error/data 三元组
state: () => ({
    isLoadingProductData: false,
    productDataError: null,
    productData: null,
}),
actions: {
    async fetchProductData(pwId) {
        this.isLoadingProductData = true;
        this.productDataError = null;
        try {
            const result = await fetchCanvasProductData(pwId);
            this.productData = pwcaPrepareCanvasProductData(result.data);
        } catch (e) {
            this.productDataError = e.message;
            throw e;
        } finally {
            this.isLoadingProductData = false;
        }
    },
}

// ✅ 使用 useAsyncState（在 setup store 语法中）
import { useAsyncState } from '@vueuse/core';

const { state: productData, isLoading, error, execute } = useAsyncState(
    async (pwId) => {
        const result = await fetchCanvasProductData(pwId);
        return pwcaPrepareCanvasProductData(result.data);
    },
    null,
    { immediate: false }
);
// 调用：await execute(pwId)
// 访问：productData.value, isLoading.value, error.value
```

### useStorage 正确用法

```js
// ❌ 当前项目：带 VueUse 检测的回退（违反了回退机制规则）
userPreferences: window.VueUse && window.VueUse.useStorage
    ? window.VueUse.useStorage('pwca-user-preferences', defaults)
    : defaults,

// ✅ 直接使用，不要回退逻辑
import { useStorage } from '@vueuse/core';

// 在 defineStore setup 语法 或 state 工厂中使用
state: () => ({
    userPreferences: useStorage('pwca-user-preferences', {
        canvasBackgroundColor: '#ffffff',
        showGrid: true,
        gridSize: 20,
        showPrintArea: true,
        zoomLevel: 100,
        language: 'en',
    }),
}),
```

### useDebounceFn 典型场景

```js
// 搜索输入防抖
import { useDebounceFn } from '@vueuse/core';

// 在组件 setup 中
const debouncedSearch = useDebounceFn((query) => {
    store.searchProducts(query);
}, 300);
```

---

## 六、Product Store 迁移到 Pinia

### 当前问题

`product-store.js`（850 行）使用 IIFE + Vue ref/reactive/computed 手动实现 Store，存在以下问题：

1. 不是标准 Pinia Store，无法使用 Pinia DevTools 调试
2. `proxyRefs` 自实现，`.value` 访问方式不统一
3. 无法与其他 Pinia Store 互操作
4. 使用 `window.xxx` 全局变量暴露，而非 ES Module import/export

### 迁移步骤

```js
// ✅ 迁移后的 Pinia store
// modules/front_product/assets/js/product/stores/product-store.js

import { defineStore } from 'pinia';

export const useProductStore = defineStore('product', {
    state: () => ({
        // 数据加载
        loading: false,
        error: null,
        data: null,

        // 数量和 MOQ
        quantity: {
            current: 1,
            min: 1,
            max: 9999,
            step: 1,
            batched: false,
        },

        // 变体
        variant: {
            selected: null,
            list: [],
            options: {},
        },

        // 功能开关
        features: {
            quantityDiscount: true,
            colorSample: true,
            customColor: true,
            gradientColor: true,
        },

        // RTS 日期
        rts: {
            startsFrom: 3,
            bulkOrderDays: 2,
            sampleOrderDays: 1,
        },

        // 折扣
        discounts: [],

        // UI 状态
        ui: {
            showDetails: false,
            activeTab: 'description',
            buySampleChecked: false,
            blankProductChecked: false,
            gradientColorApplied: false,
        },

        // 配件
        accessories: {
            price: 0,
            selectedNames: [],
        },

        // 缓存控制
        isFetched: false,
        fetchPromise: null,
    }),

    getters: {
        // 价格计算
        baseUnitPrice() {
            const variantPrice = this.variant.selected?.anchor_price
                ? parseFloat(this.variant.selected.anchor_price)
                : this.variant.selected?.price
                    ? parseFloat(this.variant.selected.price)
                    : this.data?.price || 0;
            return variantPrice + this.accessories.price;
        },
        currentDiscount() {
            if (!this.features.quantityDiscount || this.ui.buySampleChecked) return 0;
            let applicable = 0;
            for (const d of this.discounts) {
                if (this.quantity.current >= d.range_from) applicable = d.discount;
            }
            return applicable;
        },
        discountedPrice() {
            if (!this.features.quantityDiscount || this.ui.buySampleChecked) {
                return this.baseUnitPrice;
            }
            return this.currentDiscount > 0
                ? this.baseUnitPrice * this.currentDiscount
                : this.baseUnitPrice;
        },
        totalPrice() {
            return this.discountedPrice * this.quantity.current;
        },

        // 数量校验
        correctedQuantity() {
            // ... 复杂数量修正逻辑
        },
        canAddToCart() {
            return this.data && this.quantity.current >= this.quantity.min && !this.loading;
        },

        // 按钮可见性
        shouldShowAddToCart() {
            return this.data && !this.loading && !this.ui.gradientColorApplied && this.ui.blankProductChecked;
        },
        shouldShowCustomize() {
            return this.data && !this.loading && !this.ui.blankProductChecked;
        },
    },

    actions: {
        async fetchProductData() {
            if (this.fetchPromise) return this.fetchPromise;
            this.loading = true;
            this.error = null;
            try {
                const result = await window.pwcaProductDataAPI.fetch(/* ... */);
                this.applyMappedProductData(result);
                this.isFetched = true;
            } catch (e) {
                this.error = e.message;
                throw e;
            } finally {
                this.loading = false;
                this.fetchPromise = null;
            }
        },
        updateQuantity(qty) {
            this.quantity.current = Math.max(
                this.quantity.min,
                Math.min(qty, this.quantity.max)
            );
        },
        setSelectedVariant(variant) {
            this.variant.selected = variant;
        },
        // ...
    },
});
```

---

## 七、Store 文件组织规范

### 目录结构

```
modules/<module-name>/assets/js/<context>/stores/
├── index.js                    # 主 Store（仅当 store 简单时放这里）
├── <feature>-store.js          # 按功能拆分的 Store
├── <feature>-store-2.js
└── mappers/                    # 数据映射纯函数（只读，不修改状态）
    ├── index.js
    └── <domain>-mapper.js
```

### 命名规范

| 类型 | 命名 | 示例 |
|------|------|------|
| Store 文件名 | `<domain>-store.js` | `canvas-state-store.js` |
| Store 变量名 | `use<Noun>Store` | `useCanvasStateStore` |
| Store id | camelCase | `'canvasState'` |
| Mapper 文件 | `<data>-mapper.js` | `product-data-mapper.js` |
| Mapper 函数 | `pwca<Action><Target>` | `pwcaBuildViewsFromProductData` |

---

## 八、性能注意事项

### 避免过度响应式

```js
// ❌ 对不需要响应的大对象使用 ref
const hugeConfigObject = Vue.ref({...10000 properties...});

// ✅ 大配置对象用 shallowRef
const hugeConfigObject = Vue.shallowRef({...10000 properties...});
```

### Getter 中避免 O(n²) 遍历

```js
// ❌ getter 中嵌套循环查找
getItemsByView: (state) => (viewId) => {
    return state.items.filter(item =>
        state.views.find(v => v.id === viewId)?.items.includes(item.id)
    );
}

// ✅ 预先建立索引
getters: {
    viewItemIndex() {
        const index = {};
        for (const v of this.views) {
            index[v.id] = new Set(v.items);
        }
        return index;
    },
},
```

### 大型列表使用 Map 而不是 Array.find()

```js
// ✅ 用 Map 替代 Array 做 ID 查找
state: () => ({
    itemsMap: {}, // { [id]: item }
}),
getters: {
    getItemById: (state) => (id) => state.itemsMap[id] || null,
}
```

---

## 九、决策速查表

| 场景 | 选择 | 说明 |
|------|------|------|
| 数据仅本组件使用 | 组件 `ref` / `reactive` | 不需要 Store |
| 数据跨组件共享，无计算逻辑 | Store `state` | 最小化 |
| 数据跨组件共享，有计算逻辑 | Store `getter` | 放在 store 而非组件 |
| 修改数据的操作 | Store `action` | 唯一入口 |
| 简单持久化 | `useStorage` / `useSessionStorage` | VueUse |
| API 调用 + loading/error | `useAsyncState`（setup store） 或 Action 中手写 | 二选一 |
| 防抖/节流 | `useDebounceFn` / `useThrottleFn` | VueUse |
| 纯数据转换（不涉及状态） | 独立 mapper 函数，不放 Store | 可测试、可复用 |
| Store 超过 300 行 | 拆分 | 按领域/生命周期 |

---

## 十、当前项目改进建议优先级

| 优先级 | 建议 | 影响范围 |
|--------|------|----------|
| **高** | 删除仅透传 state 的 getter（如 `getUserPreferences` 等 7 个） | canvas store |
| **高** | 修复重复 getter（`selectedPrintMethod` / `getSelectedPrintMethod`） | printMethod store |
| **高** | 3 个 text font getter 抽取公共 getter `currentViewMergedSettings` | canvas store |
| **中** | canvas store 按领域拆分为 3-4 个独立 store | 大规模重构 |
| **中** | product store 迁移到 Pinia，state 按领域分组 | 大规模重构 |
| **中** | 跨 Store 引用改为 Pinia 原生 `useXxxStore()` | canvas + printMethod |
| **低** | 引入 `useAsyncState` 替代手写 loading/error 三元组 | 所有 store |
| **低** | state 初始值 `null` 改为空对象/数组 | 所有 store |
