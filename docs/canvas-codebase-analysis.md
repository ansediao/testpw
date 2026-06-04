# PW Canvas 在线设计页面 — 代码分析与工程化改造方案

> 生成日期: 2026-06-02
> 分析范围: `modules/front_canvas/` 下所有 JS / PHP / SCSS 文件 (约 45+ 文件, ~15,000+ 行 JS 代码)

---

## 目录

1. [项目概览](#1-项目概览)
2. [技术栈现状](#2-技术栈现状)
3. [核心问题诊断](#3-核心问题诊断)
4. [逐文件问题清单](#4-逐文件问题清单)
5. [架构改造方案](#5-架构改造方案)
6. [分阶段实施路线图](#6-分阶段实施路线图)
7. [附录：文件清单与规模](#7-附录文件清单与规模)

---

## 1. 项目概览

PW Canvas 是一个 WordPress/WooCommerce 插件，为电商产品提供在线定制/设计画布功能。核心模块 `front_canvas` 包含：

- **画布引擎** — 基于 Fabric.js 5.3.1 的多视图画布编辑器
- **图层系统** — 图层管理、分组、缩略图、印刷方式绑定
- **颜色系统** — 产品变体色、渐变色、着色滤镜
- **工具栏** — 文字/图片对象的编辑控件
- **状态管理** — Pinia store + LocalStorage 持久化
- **导出** — 截图预览、PDF 导出、添加到购物车

---

## 2. 技术栈现状

| 层级 | 技术 | 加载方式 | 问题 |
|------|------|----------|------|
| **Vue 3** | vue.global.js | CDN (IIFE) | 暴露为 `window.Vue`，无法 tree-shake |
| **Pinia 2** | pinia.iife.js | CDN (IIFE) | 暴露为 `window.Pinia` |
| **VueUse** | @vueuse/shared + core | CDN (无版本号!) | 版本不可控，随时可能 breaking |
| **Fabric.js** | 5.3.1 | CDN | 无本地回退 |
| **jsPDF** | 2.5.1 | CDN | — |
| **Layui** | 2.11.5 | CDN | 与 Vue 技术栈冲突，增加包体积 |
| **SCSS** | 手动编译 | 预编译 CSS 提交 | 无 watch/build 自动化 |
| **构建工具** | **无** | — | 无 Vite/Webpack/Rollup |

**关键事实：整个项目没有 `package.json`、没有构建工具、没有代码压缩、没有 source map。25+ 个 JS 文件逐个独立加载。**

---

## 3. 核心问题诊断

### 3.1 🚨 最严重：无模块化，全靠 window.* 通信

整个代码库通过 **40+ 个 `window.*` 全局属性** 进行模块间通信：

```
window.CanvasManager          — 画布实例管理器
window.CanvasInitializationState — 初始化状态
window.pwcaUiStateAccess      — UI 状态门面 (20+ 方法)
window.useCanvasStore         — Pinia store 访问器
window.usePrintMethodStore    — 印刷方式 store 访问器
window.pwcaUpdateDynamicToolbar — 工具栏更新
window.pwcaViewSwitchFacade   — 视图切换门面
window.PrintAreaValidator     — 印刷区域校验
window.addLayerToStore        — 添加图层
window.uploadedImages         — 已上传图片数组
window.currentColor           — 当前颜色
window.pw_selectionFromLayerList — 选中标志位
window.canvas / window.fabricCanvas — 画布实例 (多个引用)
... 还有 25+ 个
```

**影响：**
- 依赖关系对工具链完全不可见
- 重构任何文件都可能产生隐性 bug
- 无法做类型检查、自动补全、dead code 检测
- 初始化顺序靠 `setTimeout` 和自定义事件"祈祷"

### 3.2 🚨 严重的代码重复

| 重复项 | 出现位置 | 重复行数 |
|--------|----------|----------|
| `pwcaGetUiStateAccess()` 等 7 个辅助函数 | canvas-state-manager.js, canvas-state-integration.js, 及至少 5 个其他文件 | ~55 行 × 7 处 |
| 布尔值规范化逻辑 | stores/index.js, stores/product-data-mapper.js, stores/printMethodStore.js | ~30 行 × 3 处 |
| 对齐操作逻辑 | toolbar.js (`alignByBoundingRect` vs `alignImgByBoundingRect`) | ~60 行 × 2 处 |
| 颜色色板创建 | toolbar.js (文字色板 vs 图片色板) | ~35 行 × 2 处 |
| 边界绘制逻辑 | boundary.js (`drawBoundary` vs `drawBoundaryForAllViews`) | ~25 行 × 2 处 |
| 队列执行逻辑 | page-bootstrap.js (startup queue vs managed queue) | ~40 行 × 2 处 |
| 网格图层渲染 | grid-preview.js (`drawLayerImageForGrid` vs `drawLayerImageForGridWithColor`) | ~18 行 × 2 处 |

### 3.3 🚨 God Object / God Function 模式

| 文件 | 行数 | 问题 |
|------|------|------|
| `canvas-state-manager.js` | **1,796** | 单类承担：存储适配、迁移、序列化、编排 |
| `multi-view-init.js` | **1,477** | 混合坐标计算、Fabric 对象创建、滤镜应用、画布初始化 |
| `operation-panel-colors.js` | **1,261** | 全部逻辑在单个 DOMContentLoaded 回调内 |
| `toolbar.js` | **1,223** | `pwcaUpdateDynamicToolbar` 函数横跨 ~930 行 |
| `page-bootstrap.js` | **1,184** | 设置读取、队列管理、购物车、PDF、预览全部合一 |
| `tab-image.js` | **847** | 上传、验证、画布放置、图片库渲染合一 |
| `stores/index.js` | **773** | Canvas/图层/分组/视图/产品/印刷/颜色/偏好 全在一个 store |
| `canvas-state-integration.js` | **637** | 7 个辅助函数 + 4 个几乎相同的防抖处理器 |
| `grid-preview.js` | **558** | 预览合成、边界检测、截图合一 |

### 3.4 🟠 初始化时序脆弱

多处代码使用 `setTimeout(500)` / `setInterval(100)` / `requestAnimationFrame` 轮询来等待依赖模块加载完成：

- `canvas-init.js` — `setTimeout(() => ..., 500)` 等待 store 就绪
- `operation-panel-colors.js` — `setInterval` 100ms 轮询等待 `applyTintFilter` 可用
- `view-switch-facade.js` — 递归 `setTimeout` 100ms × 100 次等待 store
- `layers.js` — 监听 `canvasPiniaReady` 事件 + 1 秒 `setTimeout` 兜底
- `canvas-state-integration.js` — 15 秒超时 Promise 等待初始化

这是没有统一初始化编排的直接后果。

### 3.5 🟠 错误处理缺失

大量空 `catch` 块吞掉错误：

```javascript
// 出现在 15+ 处
catch (error) { }

// 出现在 5+ 处
catch (error) { return false; }

// 出现在 3+ 处
catch (e) { resolve(null); }
```

关键路径（状态恢复、图层同步、画布初始化）的错误被静默忽略，导致问题极难排查。

### 3.6 🟠 Vue 使用模式混乱

- **3 个独立 Vue 应用实例**：Layers、HeaderControls、ProductCardFooter 各自 `createApp()` + `app.use(pinia)`
- **Composition API 子模块**使用 `Vue.ref()` / `Vue.computed()` 全局调用而非 ES import
- **模板写在 JS 字符串里**：layers.js 有 275 行 template literal，无法被 IDE 识别
- 直接访问 Vue 内部 API：`vueApp._instance.proxy.$forceUpdate()` (tab-image.js:589)

### 3.7 🟡 命名不一致

- **前缀混乱**：`pwca` 前缀 vs 无前缀 vs `pw_` 前缀
- **大小写混用**：`camelCase` (`drawBoundary`) / `PascalCase` (`CanvasManager`) / `pwca-` 前缀 camelCase (`pwcaUpdateDynamicToolbar`)
- **双命名 API**：`ui-state-access.js` 每个方法暴露两个名字 (`pwcaGetCanvasStore` + `getCanvasStore`)

### 3.8 🟡 魔法数字泛滥

| 值 | 出现位置 | 含义 |
|----|----------|------|
| `95` | canvas-init.js × 4 处 | 默认缩放比例 |
| `500` | canvas-init.js × 2 处 | setTimeout 延迟(ms) |
| `10` vs `20` | boundary.js vs export.js | BOUNDARY_MARGIN 不一致! |
| `50` | print-area-validator.js | 印刷区域缩放因子 |
| `0.1` | print-area-validator.js | 10% 重叠阈值 |
| `300000` | thumbnail.js | 缓存 TTL (5分钟) |
| `100` | 多处 | setTimeout 延迟 |

### 3.9 🟡 安全风险

- **HTML 字符串拼接未转义**：toolbar.js、tab-image.js、operation-panel-colors.js 直接拼接用户输入到 innerHTML
- **XSS 风险**：图片文件名、颜色值、设计名称未经过滤直接渲染

### 3.10 🟡 死代码

| 文件 | 死代码 |
|------|--------|
| canvas-manager.js | `WeakMap` 声明但从未使用 |
| canvas-manager.js | `getViewIds` 和 `getAllCanvasIds` 完全相同 |
| canvas-state-manager.js | `handleViewSwitch` 空方法 (注释说已弃用) |
| stores/index.js | `extractViewsFromProductData` 方法体存在但调用被注释 |
| print-area-validator.js | `adjustObjectPosition` 定义但从未调用 |
| print-area-validator.js | 4 个 debug/test 函数在生产代码中 |
| export.js | `BOUNDARY_MARGIN` 声明但未使用 |
| toolbar.js | 大段注释掉的代码 + 空 else 块 |

### 3.11 🟡 CDN 风险

- VueUse 加载**无版本号**：`https://unpkg.com/@vueuse/shared` — 版本不可控
- 无 `integrity`/`crossorigin` 属性 — 无 SRI 校验
- 无本地回退 — CDN 故障 = 应用不可用

---

## 4. 逐文件问题清单

### 4.1 canvas/ 目录 (核心引擎)

#### `canvas-init.js` (248 行)
- IIFE 包装后仍通过 `window.*` 暴露 4 个函数，封装形同虚设
- `calculateAutoZoom` 和 `calculateOptimalZoom` 功能重复
- `BOUNDARY_MARGIN = 95` 魔法数字出现 4 次无命名常量
- `typeof window.xxx === 'function'` 防御性检查 × 5 — 无模块依赖系统
- 生产代码中的 `console.log` / `console.info`

#### `canvas-manager.js` (228 行)
- `WeakMap` 声明未使用，实际使用普通对象 `{}` 存储
- `getCanvas(canvasId)` 的参数语义与 `createCanvas(canvasId, viewId)` 不匹配 — 可能的静默 bug
- `getViewIds` 和 `getAllCanvasIds` 完全重复
- `destroyCanvas` 的 DOM 查询选择器 `[__viewId]` 不会匹配任何元素（`__viewId` 是 JS 属性非 HTML 属性）— 死代码
- `restoreCanvasState` 的 catch 块吞掉错误无日志

#### `multi-view-init.js` (1,477 行)
- God module：坐标计算、Fabric 对象创建、滤镜、画布初始化、蒙版渲染混为一体
- `createFabricObjectFromLayer` 使用 Promise 包装回调 + `settled` 标志 + `setTimeout` 超时 — 脆弱
- 硬编码默认尺寸 `{width: 567, height: 567}`、印刷区域 `100×120`
- 直接修改 store 状态：`view.base_layer = ...` (line 662)
- 错误被 `console.warn` 静默处理

#### `page-bootstrap.js` (1,184 行)
- God module：设置、队列、购物车、PDF、预览、状态恢复全部合一
- startup queue 和 managed queue 两组函数几乎完全重复
- `buildAddToCartRequestBody` 手动拼接 16+ 字段 — 字段名漂移风险
- `addCustomizedProductToCart` 使用 `alert()` 显示错误
- `captureCanvasStateJson` 错误时静默返回空字符串

### 4.2 design/stores/ (状态管理)

#### `stores/index.js` (773 行)
- God store：Canvas/图层/分组/视图/产品/印刷/颜色/用户偏好全部在一个 store
- 布尔值规范化逻辑重复 3 处 (本文件 + product-data-mapper.js + printMethodStore.js)
- 5+ 个 getter 做完全相同的 `views.find(item => item.id === activeViewId)` 查询
- 大量无意义的单行 getter 代理 (如 `getShowGrid` → `state.showGrid`)
- `setActiveViewId` 直接调用 `window.usePrintMethodStore()`
- `setViewsFromProductData` 的 catch 块完全为空

#### `stores/printMethodStore.js` (523 行)
- `selectedPrintMethod` 和 `getSelectedPrintMethod` 重复
- `getAvailablePrintMethods` 和 `getViewAvailablePrintMethods` 重复
- `getDefaultPrintMethod` 和 `getViewDefaultPrintMethod` 重复
- 布尔值规范化再次重复
- 基于正则 `print-method-(.+)$` 的隐式命名约定 — 无文档且脆弱
- `recordPrintMethodUsage` / `unrecordPrintMethodUsage` 命名不规范

#### `stores/product-data-mapper.js` (646 行)
- `pwcaNormalizeBooleanLike` 和 `pwcaNormalizeLayerControlBoolean` 几乎相同
- `pwcaBuildMergedLayerControls` 有 9 个几乎相同的代码块 — 应数据驱动化
- `pwcaDeepDecodePromowaresUnicodeStrings` 手动递归 + WeakMap 循环检测 — 过于复杂
- 两个遍历函数 (`pwcaNormalizeTemplateViewNames` / `pwcaNormalizeTemplateImageUrls`) 共享相同的遍历路径
- `pwca` 前缀冗余 (已在模块中，不需要命名空间)

### 4.3 design/utils/ (工具类)

#### `utils/canvas-state-manager.js` (1,796 行)
- **最大文件** — God class 混合：存储适配、迁移、序列化、编排
- 7 个辅助函数与 `canvas-state-integration.js` 完全重复
- 几乎每个方法都以 `if (!this.initialized || !this.storage)` + `if (!viewId)` 开头
- Fabric.js 特定的清理逻辑 (`pathAlign`, `pathSide` 删除) 嵌入状态管理
- 6 个全局导出到 `window`

#### `utils/canvas-state-integration.js` (637 行)
- 7 个辅助函数与 canvas-state-manager.js **逐字重复**
- 4 个防抖处理器 `_handleXxxChange` 模式完全相同 — 应参数化
- `handleViewSwitch` 是空方法 (已弃用但未删除)
- 15 秒超时 Promise + 事件监听 — 复杂的初始化管道
- 4 个 `deep: true` watcher — 性能隐患

#### `utils/print-area-validator.js` (563 行)
- 魔法数字: `50` (缩放因子), `0.1` (阈值), `100` (延迟)
- 4 个 debug/test 函数在生产代码中
- `adjustObjectPosition` 定义但从未调用
- 事件监听器无对应的移除函数 — 泄漏风险
- `getPrintAreaBounds` 有未文档化的 `* 50` 缩放逻辑

### 4.4 design/components/ (Vue 组件)

#### `components/layers.js` (553 行)
- **275 行内联 template literal** — IDE 无法语法高亮/lint
- 分组和未分组的图层项模板近似重复 (~85 行 × 2)
- 双重挂载策略 (`canvasPiniaReady` + `DOMContentLoaded` + 1秒兜底)
- `window.addLayerToStore` 全局桥接
- 模板中通过 `${layerModalsTemplate}` 插入子模板 — 脆弱

#### `components/header-controls.js` (344 行)
- 撤销/重做使用 `canvas.toJSON()` / `loadFromJSON` 全量快照 — 内存开销大
- 图片恢复使用 `setTimeout(50ms/100ms)` 魔法延迟
- 大量全局函数依赖：`pwcaRunPreviewRenderFlow`、`pwcaRunGeneratePdfFlow`、`generateMultiViewPDF`
- 已注释掉的代码块

#### `components/layer-modals.js` (175 行)
- 导出模板字符串而非 Vue 组件 — 无法被工具链识别
- 中英文混杂的 UI 文案
- Radio 按钮未使用 `v-model` — 无响应式
- 模板中重复的深层可选链表达式

#### `components/layers/canvas-helpers.js` (200 行)
- `getCanvasInstance()` 4 级回退链 — 画布所有权不明确
- `Date.now()` 生成 ID — 碰撞风险
- DOM 操作混合在 canvas 逻辑中

#### `components/layers/operations.js` (253 行)
- `window.pw_selectionFromLayerList = true` — 通过全局标志位协调
- 使用 `window.confirm()` 删除确认 — 不适合正式产品 UI
- 中英文混杂的确认消息

#### `components/layers/thumbnail.js` (506 行)
- 每个非图片对象创建临时 `fabric.Canvas` — 开销大
- 二进制 DPI 解析 (JPEG JFIF + PNG pHYs) 混在缩略图逻辑中
- `window.uploadedImages` 全局依赖
- 6+ 处空 catch 块
- 缓存 TTL 硬编码 300000ms

#### `components/layers/print-methods.js` (265 行)
- 使用 `window.alert()` 进行验证提示
- DOM 直接查询 radio 状态而非使用 `v-model`
- 两个类似的模态框流程可以统一

#### `components/layers/state.js` (97 行)
- `Vue.computed` / `Vue.watch` 使用全局而非 import
- O(n²) 的图层组过滤逻辑
- 空 watcher body

### 4.5 main/ 目录 (功能模块)

#### `main/operation-panel-colors.js` (1,261 行)
- 全部逻辑在单个 `DOMContentLoaded` 回调 — 不可测试
- `handleColorSwatchClick` 210 行含 4 个嵌套函数
- `setInterval(100ms)` 轮询等待全局函数 — 脆弱
- 12+ 个函数导出到 `window`
- `updateColorStatusUI` 未转义的 HTML 拼接 — XSS 风险

#### `main/tab-image.js` (847 行)
- 上传、验证、画布放置、图库渲染混在单个 IIFE 中
- `vueApp._instance.proxy.$forceUpdate()` — 访问 Vue 内部 API
- HTML 构建未转义 — XSS 风险
- `pwcaRefreshActiveView` 在同一操作中被调用两次

#### `main/grid-preview.js` (558 行)
- `drawLayerImageForGrid` 和 `drawLayerImageForGridWithColor` 近似重复
- 边界检测使用 `getImageData` 逐像素扫描 — O(width×height)
- `window.cupBoundary` 等模块内通信用全局变量

#### `main/view-switch-facade.js` (182 行)
- 递归 `setTimeout` 100ms × 100 次等待 store — busy-wait
- `getViewById` 检查 `view.id` / `view.view_id` / `String(view.id)` — 数据形状不一致

#### `main/layers-sync.js` (231 行)
- `controlMainWrapperDisplayArea` 手动解析 SVG path 命令 (`M`/`L`/`Z`) — 极度脆弱
- 9 个函数导出到 `window`
- 层名生成使用 `Date.now().toString().slice(-4)` — 不唯一

#### `main/events.js` (219 行)
- 3 个几乎相同的事件处理器 (`object:moving/scaling/rotating`)
- 使用 `window.pw_selectionFromLayerList` 一次性标志位协调
- 空 catch 块

#### `main/ui-state-access.js` (272 行)
- 每个方法暴露两个名字 — API 翻倍
- `pwcaGetActiveCanvas` 4 级回退 — 画布所有权不明确
- 循环依赖：facade 调用 `window.pwcaGetCurrentActiveTab` (来自 core-init.js)

#### `main/core-init.js` (356 行)
- 混合职责：初始化状态、Tab 切换、模块可用性、画布访问
- `CanvasInitializationState` 全局可变单例

### 4.6 PHP 端

#### `class-pwca-front-canvas-assets.php` (383 行)
- 25+ 脚本的深层依赖链 — HTTP 请求瀑布流
- VueUse 未固定版本号
- 无 SRI integrity 校验
- `type="module"` 通过 filter hack 添加而非原生支持
- `filemtime` 每次请求检查 25+ 文件 — 生产环境 I/O 开销
- 无压缩/无打包
- `front_canvas` 引用 `front_product` 模块的资源 — 跨模块耦合

#### `canvas-page.php` (115 行)
- `#app` 作为通用容器而非 Vue 挂载点 — 命名误导
- `<div id="pwca-modal-root">` 在 JS 中动态创建而非模板中声明
- 滑块控件为纯 HTML + 手动 JS — 与 Vue 组件不一致

---

## 5. 架构改造方案

### 5.1 引入构建工具链 (Vite)

```
目标：用 Vite 替代手动 CDN + 逐文件加载
```

**收益：**
- ES Module 原生支持，`import/export` 替代 `window.*`
- 热更新 (HMR) 提升开发效率
- 生产环境自动压缩、tree-shaking、code-splitting
- Source map 支持
- npm 管理依赖版本

**步骤：**
1. 在 `modules/front_canvas/` 下创建 `package.json`
2. 安装 vue, pinia, @vueuse/core, fabric, jspdf 为 npm 依赖
3. 创建 `vite.config.js`，配置多入口 (canvas page 独立 bundle)
4. 将 CDN 全局变量改为 ES import
5. 通过 WordPress `wp_enqueue_script` 加载 Vite 构建产物

```javascript
// vite.config.js 示例
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        canvas: 'assets/js/canvas-entry.js',
      },
      output: {
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'css/[name]-[hash].[ext]',
      },
    },
    outDir: 'dist',
    manifest: true, // 生成 manifest.json 供 PHP 读取
  },
});
```

### 5.2 消除 window.* 全局依赖

**原则：所有模块间通信通过 ES import/export**

```javascript
// ❌ 当前
window.CanvasManager = new CanvasManager();
const store = window.useCanvasStore();

// ✅ 改造后
// canvas-manager.js
export const canvasManager = new CanvasManager();

// 任何使用处
import { canvasManager } from '../canvas-manager.js';
import { useCanvasStore } from '../stores/index.js';
const store = useCanvasStore();
```

**迁移策略 (渐进式)：**
1. 创建 `globals.js` 作为过渡层，统一管理所有 `window.*` 访问
2. 新代码全部使用 import
3. 逐步将旧文件从 `window.*` 迁移到 import

```javascript
// globals.js — 过渡层
export const getCanvasManager = () => window.CanvasManager;
export const getCanvasStore = () => window.useCanvasStore?.();
// ... 迁移完成后删除此文件
```

### 5.3 状态管理重构

#### 拆分 God Store

```javascript
// 当前: 773 行的单一 store
useCanvasStore → 画布 + 图层 + 分组 + 视图 + 产品 + 印刷 + 颜色 + 偏好

// 改造后: 按领域拆分
stores/
├── index.js              — re-export + pinia 实例
├── canvasStore.js        — 画布状态、缩放、背景 (≈80行)
├── layerStore.js         — 图层 CRUD、分组、排序 (≈120行)
├── viewStore.js          — 视图切换、视图配置 (≈100行)
├── productStore.js       — 产品数据、变体 (≈100行)
├── printMethodStore.js   — 保持现有，精简重复 getter (≈300行)
├── colorStore.js         — 颜色选择、渐变 (≈80行)
└── userPreferenceStore.js — 网格、语言、偏好 (≈40行)
```

#### 提取共享工具

```javascript
// stores/utils.js — 统一的工具函数
export function normalizeBooleanLike(value, defaultValue = undefined) {
  if (value === true || value === 1 || value === '1' || value === 'true') return true;
  if (value === false || value === 0 || value === '0' || value === 'false') return false;
  return defaultValue;
}

export function findActiveView(views, activeViewId) {
  return views.find(v => v && String(v.id) === String(activeViewId));
}
```

### 5.4 CanvasStateManager 拆分

```javascript
// 当前: 1,796 行的 God class

// 改造后:
utils/
├── storage-adapter.js     — LocalStorage 读写、配额管理、内存回退 (≈200行)
├── state-migration.js     — 版本迁移逻辑 (≈100行)
├── canvas-serializer.js   — Fabric.js 对象序列化/反序列化 (≈200行)
├── canvas-state-manager.js — 编排层：协调以上三个模块 (≈300行)
└── shared-helpers.js      — 提取的 7 个共享辅助函数 (≈60行)
```

### 5.5 消除代码重复

| 重复 | 方案 |
|------|------|
| 7 个 `pwcaGet*` 辅助函数 | 提取到 `utils/store-helpers.js`，所有文件 import |
| 3 处布尔值规范化 | 提取到 `stores/utils.js` 的 `normalizeBooleanLike()` |
| toolbar.js 对齐逻辑 | 提取 `alignByBoundingRect(object, bounds)` 统一函数 |
| toolbar.js 色板创建 | 提取 `createColorSwatches(colors, onPick)` 工厂函数 |
| boundary.js 边界绘制 | `drawBoundaryForAllViews` 调用 `drawBoundary` |
| page-bootstrap.js 队列 | 统一为 `runQueue(tasks, options)` |
| 4 个防抖变更处理器 | 参数化 `_createDebouncedHandler(timerKey, saveFn)` |

### 5.6 大文件拆分

#### toolbar.js (1,223 行 → 6 个文件)

```
toolbar/
├── index.js              — 主入口、updateDynamicToolbar 编排 (≈100行)
├── text-controls.js      — 文字工具栏控件 (字体、字号、间距) (≈200行)
├── image-controls.js     — 图片工具栏控件 (旋转、尺寸、翻转) (≈200行)
├── alignment.js          — 对齐操作 (文字+图片统一) (≈100行)
├── color-picker.js       — 颜色选择器构建 (文字+图片统一) (≈150行)
├── crop-controls.js      — 裁剪控件 (≈100行)
└── keyboard-shortcuts.js — 键盘快捷键 (≈80行)
```

#### operation-panel-colors.js (1,261 行 → 4 个文件)

```
colors/
├── index.js              — 入口、初始化编排 (≈100行)
├── color-swatches.js     — 色板渲染和点击处理 (≈300行)
├── tint-filter.js        — 着色/滤镜应用 (≈200行)
├── gradient.js           — 渐变色管理 (≈200行)
└── custom-color-picker.js — 自定义颜色选择器 (≈150行)
```

#### multi-view-init.js (1,477 行 → 4 个文件)

```
canvas/
├── multi-view-init.js    — 入口编排 (≈200行)
├── fabric-object-factory.js — Fabric.js 对象创建 (≈400行)
├── anchor-transform.js   — 锚点坐标变换 (≈200行)
├── mask-canvas.js        — 蒙版画布管理 (≈300行)
└── filter-applier.js     — 着色/渐变滤镜 (≈200行)
```

### 5.7 统一初始化编排

```javascript
// bootstrap.js — 统一初始化序列
export async function bootstrapApp() {
  const pinia = createPinia();
  
  // Phase 1: 核心 (无外部依赖)
  const canvasManager = initCanvasManager(pinia);
  const uiStateAccess = createUiStateAccess(pinia, canvasManager);
  
  // Phase 2: 数据 (依赖 Phase 1)
  await loadProductData(pinia);
  await initCanvasViews(canvasManager, pinia);
  
  // Phase 3: UI (依赖 Phase 2)
  mountLayersPanel(pinia);
  mountHeaderControls(pinia);
  mountProductCardFooter(pinia);
  initToolbar(canvasManager, uiStateAccess);
  initColorPanel(pinia, canvasManager);
  
  // Phase 4: 状态恢复 (依赖全部)
  await restoreCanvasState(canvasManager, pinia);
  
  // 通知就绪
  document.dispatchEvent(new Event('appReady'));
}
```

**替代方案：** 如果不想改造成完整的异步初始化，至少应该：
1. 用 `Promise` / `Event` 替代 `setTimeout` 轮询
2. 定义清晰的初始化阶段和依赖图
3. 将所有就绪检查集中到一个 `readiness.js` 模块

### 5.8 Vue 组件标准化

```javascript
// ❌ 当前：275 行内联 template literal
const LayersApp = {
  template: `
    <div class="layers-panel">
      <!-- 275 行 HTML -->
    </div
  `,
  setup() { ... }
};

// ✅ 改造后：使用 .vue SFC (需要 @vitejs/plugin-vue)
// LayersPanel.vue
<template>
  <div class="layers-panel">
    <LayerItem v-for="layer in ungroupedLayers" :key="layer.id" ... />
    <LayerGroup v-for="group in groups" :key="group.id" ... />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCanvasStore } from '@/stores';
// ...
</script>
```

**过渡方案 (无 Vite 时)：**
```javascript
// 使用 <script type="text/x-template"> 在 PHP 模板中
// 或使用 <template> 标签 + id 引用
const LayersApp = {
  template: '#layers-panel-template',
  setup() { ... }
};
```

### 5.9 命名规范统一

| 维度 | 规范 |
|------|------|
| 文件名 | `kebab-case.js` (如 `canvas-state-manager.js`) |
| 类名 | `PascalCase` (如 `CanvasManager`) |
| 函数/变量 | `camelCase` (如 `getActiveCanvas`) |
| 常量 | `UPPER_SNAKE_CASE` (如 `DEFAULT_ZOOM = 95`) |
| Store | `useXxxStore` (如 `useCanvasStore`) |
| Vue 组件 | `PascalCase.vue` (如 `LayerPanel.vue`) |
| **去除 `pwca` 前缀** | 模块化后通过 import 路径区分，不需要命名空间前缀 |
| **统一画布引用** | 只通过 `canvasManager.getActiveCanvas()` 获取 |

### 5.10 错误处理策略

```javascript
// utils/logger.js
export const logger = {
  warn(module, message, data) {
    console.warn(`[PW Canvas][${module}] ${message}`, data);
    // 可接入远程日志
  },
  error(module, message, error) {
    console.error(`[PW Canvas][${module}] ${message}`, error);
    // 可接入错误追踪 (Sentry 等)
  },
};

// 替代空 catch 块
// ❌ catch (error) { }
// ✅ catch (error) { logger.error('CanvasState', 'Failed to restore view', error); }
```

---

## 6. 分阶段实施路线图

### Phase 0: 基础设施 (1-2 天)

| 任务 | 优先级 | 难度 |
|------|--------|------|
| 初始化 `package.json`，安装 npm 依赖 | P0 | 低 |
| 配置 Vite 构建 | P0 | 中 |
| 创建 `vite.config.js` + WordPress 集成 | P0 | 中 |
| 设置 ESLint + Prettier 配置 | P1 | 低 |
| 固定 VueUse 版本 (当前无版本号!) | P0 | 低 |

### Phase 1: 消除高危问题 (3-5 天)

| 任务 | 优先级 | 难度 |
|------|--------|------|
| 提取 7 个共享辅助函数到 `utils/store-helpers.js` | P0 | 低 |
| 统一布尔值规范化到 `stores/utils.js` | P0 | 低 |
| 定义魔法数字为命名常量 | P0 | 低 |
| 修复 `BOUNDARY_MARGIN` 不一致 (10 vs 20) | P0 | 低 |
| 修复 `canvas-manager.js` DOM 选择器 bug | P0 | 低 |
| 移除死代码 (WeakMap、重复函数、已注释代码) | P1 | 低 |
| 清理空 catch 块 — 至少加 `console.error` | P1 | 低 |
| HTML 转义 — 防止 XSS | P0 | 低 |
| 移除生产代码中的 debug/test 函数 | P1 | 低 |

### Phase 2: 状态管理重构 (5-7 天)

| 任务 | 优先级 | 难度 |
|------|--------|------|
| 拆分 `useCanvasStore` 为 4-5 个子 store | P1 | 高 |
| 提取 `activeView` 共享 getter | P1 | 低 |
| 合并 printMethodStore 的重复 getter | P1 | 低 |
| 拆分 `CanvasStateManager` (1,796 行 → 4 模块) | P1 | 高 |
| 消除 `canvas-state-manager.js` 和 `canvas-state-integration.js` 的重复 | P1 | 中 |

### Phase 3: 大文件拆分 (5-7 天)

| 任务 | 优先级 | 难度 |
|------|--------|------|
| 拆分 `toolbar.js` (1,223 行 → 6 模块) | P1 | 中 |
| 拆分 `operation-panel-colors.js` (1,261 行 → 4 模块) | P1 | 中 |
| 拆分 `multi-view-init.js` (1,477 行 → 4 模块) | P1 | 高 |
| 拆分 `page-bootstrap.js` (1,184 行 → 3 模块) | P1 | 中 |
| 拆分 `tab-image.js` (847 行 → 3 模块) | P2 | 中 |
| 拆分 `grid-preview.js` (558 行 → 2 模块) | P2 | 低 |

### Phase 4: 全局依赖消除 (5-7 天)

| 任务 | 优先级 | 难度 |
|------|--------|------|
| 所有 `window.*` → ES import (逐文件迁移) | P1 | 高 |
| 统一初始化编排 (替代 setTimeout 轮询) | P1 | 高 |
| 单一 Vue 应用实例 (合并 3 个独立 app) | P2 | 高 |
| 统一画布引用入口 | P1 | 中 |
| 清理自定义事件总线 (12+ 种事件名) | P2 | 中 |

### Phase 5: Vue 现代化 (3-5 天)

| 任务 | 优先级 | 难度 |
|------|--------|------|
| 内联 template → `.vue` SFC 或 `<template id>` | P2 | 中 |
| `Vue.ref()` → `import { ref } from 'vue'` | P2 | 低 |
| 消除 `$forceUpdate()` 调用 | P2 | 中 |
| `window.confirm()` / `window.alert()` → Vue modal | P2 | 低 |
| layers.js 去重 (分组/未分组模板) | P2 | 中 |

### Phase 6: 工程化完善 (2-3 天)

| 任务 | 优先级 | 难度 |
|------|--------|------|
| SCSS 自动编译 (Vite 内置) | P2 | 低 |
| 常量提取 + 统一常量文件 | P2 | 低 |
| 统一错误处理 + 日志模块 | P2 | 低 |
| 国际化：中英文混杂 → 统一 i18n 方案 | P3 | 中 |
| 添加 ESLint 规则 (禁止 window.*、强制错误处理) | P2 | 低 |
| CDN 资源添加 SRI 校验 或 全部本地化 | P1 | 低 |

---

## 7. 附录：文件清单与规模

### JS 文件规模排序 (前 20)

| # | 文件 | 行数 | 字节数 | 评级 |
|---|------|------|--------|------|
| 1 | `design/utils/canvas-state-manager.js` | 1,796 | — | 🔴 God class |
| 2 | `canvas/multi-view-init.js` | 1,477 | 52KB | 🔴 God module |
| 3 | `main/operation-panel-colors.js` | 1,261 | 51KB | 🔴 God module |
| 4 | `toolbar.js` | 1,223 | 57KB | 🔴 God function |
| 5 | `canvas/page-bootstrap.js` | 1,184 | 38KB | 🔴 God module |
| 6 | `main/tab-image.js` | 847 | 30KB | 🟠 需拆分 |
| 7 | `design/stores/index.js` | 773 | — | 🟠 God store |
| 8 | `design/stores/product-data-mapper.js` | 646 | — | 🟡 偏大 |
| 9 | `design/utils/canvas-state-integration.js` | 637 | — | 🟠 大量重复 |
| 10 | `design/utils/print-area-validator.js` | 563 | — | 🟡 中等 |
| 11 | `main/grid-preview.js` | 558 | 27KB | 🟡 中等 |
| 12 | `design/components/layers.js` | 553 | — | 🟠 内联模板 |
| 13 | `design/stores/printMethodStore.js` | 523 | — | 🟡 中等 |
| 14 | `design/components/layers/thumbnail.js` | 506 | — | 🟡 中等 |
| 15 | `main/core-init.js` | 356 | 13KB | 🟢 可接受 |
| 16 | `design/components/header-controls.js` | 344 | — | 🟢 可接受 |
| 17 | `main/ui-state-access.js` | 272 | 8KB | 🟢 可接受 |
| 18 | `design/components/layers/print-methods.js` | 265 | — | 🟢 可接受 |
| 19 | `design/components/layers/operations.js` | 253 | — | 🟢 可接受 |
| 20 | `canvas-init.js` | 248 | — | 🟢 可接受 |

**总计：~15,000+ 行 JavaScript 代码，25+ 文件，0 个构建工具**

### window.* 全局变量完整清单 (40+)

| 全局变量 | 写入方 | 读取方 | 类型 |
|----------|--------|--------|------|
| `window.CanvasManager` | canvas-manager.js | 几乎所有文件 | 单例对象 |
| `window.CanvasInitializationState` | core-init.js | events.js, layers-sync.js | 单例 Map |
| `window.pwcaUiStateAccess` | ui-state-access.js | 几乎所有文件 | 门面对象 |
| `window.useCanvasStore` | stores/index.js | 多处 | 函数 |
| `window.usePrintMethodStore` | printMethodStore.js | 多处 | 函数 |
| `window.pwcaUpdateDynamicToolbar` | toolbar.js | events.js, layers-sync.js | 函数 |
| `window.pwcaViewSwitchFacade` | view-switch-facade.js | state.js | 对象 |
| `window.PrintAreaValidator` | print-area-validator.js | events.js, layers-sync.js | 对象 |
| `window.addLayerToStore` | layers.js | tab-image.js | 函数 |
| `window.uploadedImages` | tab-image.js | thumbnail.js | 数组 |
| `window.currentColor` | operation-panel-colors.js | 多处 | 字符串 |
| `window.pw_selectionFromLayerList` | operations.js | events.js | 布尔标志 |
| `window.canvas` / `window.fabricCanvas` | 多处 | 多处 | Fabric.Canvas |
| `window.triggerAutoZoomAdjustment` | canvas-init.js | multi-view-init.js | 函数 |
| `window.pwcaSetGlobalCanvas` | core-init.js | view-switch-facade.js | 函数 |
| `window.pwcaGetActiveCanvas` | core-init.js | ui-state-access.js | 函数 |
| `window.pwcaSwitchOperationPanelTab` | core-init.js | events.js | 函数 |
| `window.pwcaGetCurrentActiveTab` | core-init.js | ui-state-access.js | 函数 |
| `window.pwcaUpdatePreviewCanvas` | grid-preview.js | events.js, tab-image.js | 函数 |
| `window.captureViewForPDF` | grid-preview.js | page-bootstrap.js, export.js | 函数 |
| `window.generateMultiViewPDF` | page-bootstrap.js | header-controls.js | 函数 |
| `window.pwcaRunPreviewRenderFlow` | page-bootstrap.js | header-controls.js | 函数 |
| `window.pwcaRunGeneratePdfFlow` | page-bootstrap.js | header-controls.js | 函数 |
| `window.clearAllGradientRects` | operation-panel-colors.js | canvas-init.js | 函数 |
| `window.applyTintFilter` | multi-view-init.js | operation-panel-colors.js | 函数 |
| `window.pwcaIsTextLikeObject` | multi-view-init.js | events.js, layers-sync.js | 函数 |
| `window.pwcaTriggerPrintMethodModal` | layers.js | events.js | 函数 |
| `window.isFourGridView` | operation-panel-colors.js | grid-preview.js | 函数 |
| `window.getExplicitSelectedColor` | operation-panel-colors.js | grid-preview.js | 函数 |
| `window.pwcaGetFlowConfig` | flow-config.js | multi-view-init.js | 函数 |
| `window.ProductCardFooter` | product-card-footer.js | — | 对象 |
| `window.pwcaFrontCanvasSettings` | PHP 模板 | page-bootstrap.js | 配置对象 |
| `window.pwcaCanvasEditFromCart` | PHP 模板 | page-bootstrap.js | 布尔 |
| `window.pwcaCartKeyForCanvasEdit` | PHP 模板 | page-bootstrap.js | 字符串 |
| `window.cupBoundary` | grid-preview.js | grid-preview.js | 对象 |
| `window.baseCupBoundary` | grid-preview.js | grid-preview.js | 对象 |
| `window.isUserInitiatedAction` | core-init.js | layers-sync.js | 布尔 |
| `window.pwca_default_color` | core-init.js | — | 字符串 |
| `window.pwca_current_color` | core-init.js | page-bootstrap.js | 字符串 |
| `window.jspdf` | jsPDF CDN | page-bootstrap.js | 对象 |

### 自定义事件清单 (12+)

| 事件名 | 派发方 | 监听方 | 用途 |
|--------|--------|--------|------|
| `canvasInitializationComplete` | core-init.js | events.js, layers-sync.js | 画布初始化完成 |
| `canvasPiniaReady` | stores/index.js | layers.js | Pinia store 就绪 |
| `multiViewInitComplete` | multi-view-init.js | canvas-state-integration.js | 多视图初始化完成 |
| `canvasStateIntegrationReady` | canvas-state-integration.js | page-bootstrap.js | 状态集成就绪 |
| `layerPanelViewSwitch` | view-switch-facade.js | operation-panel-colors.js | 视图切换通知 |
| `layerThumbnailRefresh` | events.js, layers-sync.js, tab-image.js | thumbnail.js | 缩略图缓存失效 |
| `pwcaOperationPanelModulesUpdated` | core-init.js | page-bootstrap.js | 模块可见性变更 |
| `pw-color-variant-selected` | operation-panel-colors.js | page-bootstrap.js | 颜色变体选中 |
| `pw-bulk-order-rts-calculated` | operation-panel-colors.js | page-bootstrap.js | 批量订单 RTS 计算 |
| `printMethodBound` | print-methods.js | — | 印刷方式绑定 |
| `tab-switched` | operation-panel-tabs.js | — | Tab 切换 |
| `appReady` (建议新增) | bootstrap.js | 所有模块 | 统一应用就绪 |

---

> **结论：** 项目目前处于"功能驱动、无架构约束"的状态。所有代码通过 `window.*` 全局变量连接，没有构建工具，没有类型检查，大文件（1000+ 行）比比皆是，重复代码严重。但好消息是：功能逻辑本身是完备的，重构是"改进结构"而非"重写功能"。按上述 6 个 Phase 渐进式改造，可在不中断线上功能的前提下，逐步将代码库工程化到可维护状态。
