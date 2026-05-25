---
name: "pwca-canvas-designer"
description: "PWCA Canvas Designer 前端架构与工具栏系统指南。Invoke when working on text/image toolbar, canvas selection events, dynamic toolbar rendering, or front_canvas module JS structure."
---

# PWCA Canvas Designer 前端架构与工具栏系统

## 模块定位

`modules/front_canvas/` 是插件的核心前台模块，负责在线设计器的所有交互逻辑。前端 JS 资源入口位于 `assets/js/`。

## JS 文件职责地图

### 顶层入口

| 文件 | 职责 |
|------|------|
| `canvas-manager.js` | CanvasManager 单例，管理所有 Fabric.js Canvas 实例 |
| `canvas-init.js` | Canvas 初始化入口，连接 CanvasManager 与页面 DOM |
| `toolbar.js` | `updateDynamicToolbar()` — 根据选中对象类型和当前激活按钮渲染右侧控制区 HTML |

### main/ — 面板与事件

| 文件 | 职责 |
|------|------|
| `dongtai-toolbar.js` | **文字/图片工具栏（`text_toolbar` / `img_toolbar`）点击事件绑定**：切换 `active` 高亮、调用 `updateDynamicToolbar()` |
| `core-init.js` | 全局初始化状态、`switchOperationPanelTab()`、面板 Tab 切换逻辑 |
| `events.js` | `addCanvasSelectionListeners()` — Fabric `selection:created/updated/cleared` 事件 → 调用 `updateDynamicToolbar()` |
| `layers-sync.js` | `showRelevantButtonGroup()` — 选中对象后控制工具栏显示/隐藏、调用 `updateDynamicToolbar()` |
| `operation-panel-tabs.js` | 右侧操作面板 Tab 切换，图片 Tab 点击时调用 `updateDynamicToolbar(null)` 清空控制区 |
| `tab-text.js` | 文字 Tab 输入框 → 添加 Fabric.Text 到画布 |
| `tab-image.js` | 图片 Tab 上传逻辑 |

### design/ — Vue/Pinia 组件层

| 文件 | 职责 |
|------|------|
| `stores/index.js` | `useCanvasStore` — Pinia Store，驱动视图切换、产品数据、多画布状态 |
| `stores/printMethodStore.js` | `usePrintMethodStore` — 印刷方式 Store |
| `components/layers.js` | 图层面板 Vue 组件，含印刷方式绑定按钮 |
| `components/layers/print-methods.js` | 印刷方式选择逻辑 |
| `components/header-controls.js` | 顶部控制栏 |

### canvas/ — 多视图初始化

| 文件 | 职责 |
|------|------|
| `multi-view-init.js` | 多视图画布初始化、4-Grid Flow 等特殊视图处理 |
| `page-bootstrap.js` | 页面级引导、视图按钮容器生成 |

## 工具栏系统架构

### DOM 结构（来自 `views/partials/canvas-dongtai-area.php`）

```html
<!-- 文字工具栏 -->
<div class="text_toolbar">
    <button class="toolbar_button" id="text_input">Text</button>
    <button class="toolbar_button" id="text_font_style">Font</button>
    <button class="toolbar_button" id="text_rotate">Transform</button>
    <button class="toolbar_button" id="text_position">Position</button>
    <button class="toolbar_button" id="text_distort">Arc</button>
    <button class="toolbar_button" id="text_color">Color</button>
</div>

<!-- 图片工具栏 -->
<div class="img_toolbar">
    <button class="toolbar_button" id="img_input">Transform</button>
    <button class="toolbar_button" id="img_position">Position</button>
    <button class="toolbar_button" id="img_size">Crop</button>
    <button class="toolbar_button" id="img_color">Color</button>
</div>
```

### 工具栏高亮状态管理

- **绑定入口**：`dongtai-toolbar.js` 的 `pwcaInitTextToolbar()` / `pwcaInitImageToolbar()`
- **高亮原则**：两个工具栏各自独立维护 `active` 类，**禁止用全局 `.toolbar_button` 一次性清除所有激活状态**
- **正确写法**（已修复）：
  ```js
  // 文字工具栏内：只清除文字工具栏自己的按钮
  toolbar.querySelectorAll('.toolbar_button').forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');

  // 图片工具栏内：只清除图片工具栏自己的按钮
  toolbar.querySelectorAll('.toolbar_button').forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');
  ```
- **错误写法**：用 `document.querySelectorAll('.toolbar_button')` 全局清除，会导致两个工具栏互相干扰

### 控制区渲染

- **渲染函数**：`updateDynamicToolbar(obj)` 定义在 `toolbar.js`
- **渲染逻辑**：读取当前激活的文字/图片工具栏按钮 ID (`activeButtonId`)，决定向 `#content-wenzi-control` 注入哪种控制 HTML
- **调用链**：
  1. 用户点击工具栏按钮 → `dongtai-toolbar.js` → `updateDynamicToolbar(activeObject)`
  2. Fabric `selection:created/updated` → `events.js` → `updateDynamicToolbar(selectedObj)`
  3. 图层选中后 → `layers-sync.js` → `showRelevantButtonGroup()` → `updateDynamicToolbar(selectedObject)`
- **清空**：图片 Tab 点击时 `operation-panel-tabs.js` 调用 `updateDynamicToolbar(null)` 清空控制区

### 激活按钮 ID 与控制内容对照

| 按钮 ID | 控制区内容 |
|---------|-----------|
| `text_input` | 不渲染控制项（保留 `#addTextBtn_box`） |
| `text_font_style` | 字体下拉框、字号增减按钮、字距控制 |
| `text_color` | 印刷方式自定义色板或通用 color picker |
| `text_rotate` | 旋转滑块与数字输入（双向同步） |
| `text_position` | 水平/垂直对齐按钮组 |
| `text_distort` | 弧形弯曲滑块 |
| `img_input` | 旋转/宽高/镜像翻转控制 |
| `img_position` | 图片对齐按钮组 |
| `img_size` | 裁剪开始/完成/取消按钮 |
| `img_color` | 印刷方式色板或通用 tint color picker |

## 关键事件链路

```
用户点击 text_toolbar 按钮
  → dongtai-toolbar.js: pwcaInitTextToolbar()
    → switchOperationPanelTab('tab-wenzi', { preserveSelection: true })
    → 清除 .text_toolbar .toolbar_button.active
    → 当前按钮添加 active
    → updateDynamicToolbar(activeObject)
      → toolbar.js: 清空 #content-wenzi-control
      → 根据 activeButtonId 注入对应 HTML
      → 挂载事件监听（fontFamily / fontSize / color 等）

Fabric.selection:created / selection:updated
  → events.js: addCanvasSelectionListeners()
    → updateDynamicToolbar(selectedObj)
    → switchOperationPanelTab('tab-wenzi', { preserveSelection: true })
```

## 规范约束

1. **工具栏点击事件禁止在入口层拦截 UI 反馈**：按钮高亮和 `updateDynamicToolbar()` 调用必须同步执行，不应在此时做业务前置校验（如印刷方式绑定检查），校验应放到具体业务操作时。
2. **高亮状态隔离**：每个工具栏（`.text_toolbar` / `.img_toolbar`）的 `active` 类只能由各自的 `pwcaInitXxxToolbar()` 管理，禁止跨工具栏全局操作。
3. **控制区清空时机**：仅在图片 Tab 被点击（`tab-pianquan`）且无选中对象时调用 `updateDynamicToolbar(null)`，文字选中状态下不应清空。
4. **工具栏 DOM 与模板一致性**：PHP 模板 (`canvas-dongtai-area.php`) 中按钮 ID 必须与 `toolbar.js` 中 `activeButtonId` 判断分支一一对应，新增按钮需同步更新两处。

## 已知修复记录

- **2026-05-25**：修复 `text_toolbar` 按钮点击无效（高亮不切换、控制区不出现）。根因：点击事件在"未绑定印刷方式"前置判断处整体 `return`，导致高亮和渲染均未执行。修复：`dongtai-toolbar.js` 移除该前置判断，工具栏切换逻辑与具体业务操作解耦。
