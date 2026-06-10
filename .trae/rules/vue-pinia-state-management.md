# Vue / Pinia 状态管理规范

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
// ❌ 反模式：30+ 个平铺字段
const quantity = ref(1);
const minQuantity = ref(1);
const maxQuantity = ref(9999);
// ... 25+ more

// ✅ 按领域分组
state: () => ({
    loading: false,
    error: null,
    data: null,
    quantity: {
        current: 1,
        min: 1,
        max: 9999,
        step: 1,
    },
    variant: {
        selected: null,
        list: [],
        options: {},
    },
    features: {
        quantityDiscount: true,
        colorSample: true,
    },
})
```

### 原则 3：State 初始值用有意义的值，不用 `null`

```js
// ❌ 大量初始值为 null
productData: null,      // 后续需要大量判空

// ✅ 用空数组/空对象
productData: {},
views: [],
```

---

## 二、Getter 设计四原则

### 原则 1：Getter 必须包含计算逻辑，不直接返回 State

```js
// ❌ 反模式：仅透传 state 的 getter
getUserPreferences: (state) => state.userPreferences,
getShowGrid: (state) => state.userPreferences.showGrid,

// ✅ 组件中直接访问：store.userPreferences.showGrid
// 或：storeToRefs(store).userPreferences
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

例外：Vue 模板中可通过 `v-model` 直接绑定。

### 原则 2：异步操作（API 调用）放 Action，不放组件

```js
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
├── print-method-store.js     # 印刷方式
├── design-usage-store.js     # 设计使用计费
├── user-preference-store.js  # 用户偏好 + useStorage 持久化
├── color-selection-store.js  # 视图颜色选择状态
└── mappers/                  # 数据映射工具（纯函数，不是 Store）
    ├── product-data-mapper.js
    ├── print-method-mapper.js
    └── view-restore-helper.js
```

### 跨 Store 通信原则

```js
// ❌ 反模式：通过 window 全局变量
const printMethodStore = window.pwcaUsePrintMethodStore();

// ✅ Pinia 原生方式：在 action 中直接 import 其他 store
import { usePrintMethodStore } from './print-method-store.js';

actions: {
    setActiveViewId(viewId) {
        this.activeViewId = viewId;
        const printStore = usePrintMethodStore(); // 在 action 内调用
        printStore.switchToViewPrintMethods(viewId);
    },
}
```

**注意**：跨 Store 引用只能在 `actions` 中进行，不能在 `getters` 中调用其他 Store（会破坏响应式追踪）。

---

## 五、Store 文件组织规范

### 目录结构

```
modules/<module-name>/assets/js/<context>/stores/
├── index.js                    # 主 Store（仅当 store 简单时放这里）
├── <feature>-store.js          # 按功能拆分的 Store
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

## 六、性能注意事项

### 避免过度响应式

```js
// ❌ 对不需要响应的大对象使用 ref
const hugeConfigObject = ref({...10000 properties...});

// ✅ 大配置对象用 shallowRef
const hugeConfigObject = shallowRef({...10000 properties...});
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

## 七、决策速查表

| 场景 | 选择 | 说明 |
|------|------|------|
| 数据仅本组件使用 | 组件 `ref` / `reactive` | 不需要 Store |
| 数据跨组件共享，无计算逻辑 | Store `state` | 最小化 |
| 数据跨组件共享，有计算逻辑 | Store `getter` | 放在 store 而非组件 |
| 修改数据的操作 | Store `action` | 唯一入口 |
| 简单持久化 | `useStorage`（VueUse） | 需要引入 VueUse |
| API 调用 + loading/error | Action 中手写处理 | 保持简洁 |
| 防抖/节流 | `useDebounceFn` / `useThrottleFn`（VueUse） | 需要引入 VueUse |
| 纯数据转换（不涉及状态） | 独立 mapper 函数，不放 Store | 可测试、可复用 |
| Store 超过 300 行 | 拆分 | 按领域/生命周期 |
