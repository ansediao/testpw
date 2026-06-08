# PW Canvas 全局变量治理方案

> 生成日期: 2026-06-04
> 范围: `modules/` 目录下的生产代码
>
> 👉 **[打开交互式时间线 →](global-variables-timeline.html)**

---

## 一、项目现状

- **无构建工具** — 所有 JS 直接由 PHP `wp_enqueue_script()` 加载
- **混合模块系统** — `design/` 子树使用 ES Module（但仍有 `window.*` 桥接），其余全部是 IIFE 或裸脚本
- **全局变量总数**: **约 180+ 个** `window.*` 属性 / 顶层声明
- **核心问题**: 模块间通信完全依赖 `window.*` 全局变量，无明确的依赖声明

---

## 二、全局变量完整清单与分析

### 2.1 Pinia Store 全局变量（跨模块状态，最高频使用）

| 全局名 | 定义文件 | 行号 | 使用文件数 | 用途 |
|--------|---------|------|-----------|------|
| `window.pinia` | `design/stores/index.js` | 660 | 5 | Pinia 实例 |
| `window.useCanvasStore` | `design/stores/index.js` | 669 | 14 | 画布状态 Store |
| `window.usePrintMethodStore` | `design/stores/index.js` + `printMethodStore.js` | 670 / 522 | 8 | **重复定义！** 印刷方式 Store |
| `window.useDesignUsageStore` | `design/stores/index.js` | 735 | 5 | 设计使用记录 Store |
| `window.useProductStore` | `product/stores/productStore.js` | 809 | 7 | 产品 Store |

### 2.2 画布核心管理

| 全局名 | 定义文件 | 行号 | 使用文件数 | 用途 |
|--------|---------|------|-----------|------|
| `window.CanvasManager` | `canvas-manager.js` | 224 | 9 | 画布管理器类/单例 |
| `window.canvas` / `window.fabricCanvas` | `core-init.js` / `page-bootstrap.js` / `multi-view-init.js` | 多处 | 4 | **重复定义！** 活动画布实例 |
| `window.pwcaGetActiveCanvas` | `core-init.js` | 344 | 4 | 获取活动画布 |
| `window.pwcaSetGlobalCanvas` | `core-init.js` | 345 | 2 | 设置全局画布 |
| `window.initCanvasSystem` | `canvas-init.js` | 249 | 1 | 画布系统初始化 |

### 2.3 UI 状态管理

| 全局名 | 定义文件 | 行号 | 使用文件数 | 用途 |
|--------|---------|------|-----------|------|
| `window.pwcaUiStateAccess` | `ui-state-access.js` | 225 | 12 | UI 状态访问器（使用最广泛） |
| `window.CanvasInitializationState` | `core-init.js` | 32 | 1 | 画布初始化状态枚举 |
| `window.isUserInitiatedAction` | `core-init.js` | 33 | 1 | 判断用户主动操作 |

### 2.4 操作面板/Tab 控制

| 全局名 | 定义文件 | 行号 | 使用文件数 | 用途 |
|--------|---------|------|-----------|------|
| `window.pwcaSwitchOperationPanelTab` | `core-init.js` | 301 | 2 | 切换操作面板 Tab |
| `window.pwcaGetCurrentActiveTab` | `core-init.js` | 302 | 1 | 获取当前活动 Tab |
| `window.pwcaListAvailableTabs` | `core-init.js` | 303 | 0 | **⚠️ 疑似未使用！** 列出可用 Tab |
| `window.pwcaGetEnabledOperationModules` | `core-init.js` | 304 | 0 | **⚠️ 疑似未使用！** 获取启用模块 |
| `window.pwcaIsOperationPanelTabAvailable` | `core-init.js` | 305 | 0 | **⚠️ 疑似未使用！** 检查 Tab 可用性 |
| `window.pwcaApplyOperationPanelModuleVisibility` | `core-init.js` | 306 / 355 | 1 | **重复定义！** 应用模块可见性 |
| `window.pwcaBindOperationPanelModuleSync` | `core-init.js` | 354 | 1 | 绑定模块同步 |
| `window.showTabControlHelp` | `core-init.js` | 307 | 0 | **⚠️ 疑似未使用！** Tab 控制帮助 |

### 2.5 颜色管理

| 全局名 | 定义文件 | 行号 | 使用文件数 | 用途 |
|--------|---------|------|-----------|------|
| `window.pwca_default_color` | `core-init.js` | 349 | 1 | 默认颜色 |
| `window.pwca_current_color` | `core-init.js` | 350 | 1 | 当前颜色 |
| `window.currentColor` | `operation-panel-colors.js` | 39 | 1 | 当前颜色（另一个！） |
| `window.getCurrentSelectedColor` | `color-utils.js` | 25 | 3 | 获取当前选中颜色 |
| `window.getExplicitSelectedColor` | `color-utils.js` | 26 | 0 | **⚠️ 疑似未使用！** |
| `window.showGradientModal` | `gradient-modal.js` | 81 | 3 | 显示渐变弹窗 |
| `window.hideGradientModal` | `gradient-modal.js` | 116 | 1 | 隐藏渐变弹窗 |
| `window.lastGradientColors` | `gradient-modal.js` | 146 | 1 | 上次渐变颜色 |
| `window.updateColorStatusUI` | `operation-panel-colors.js` | 745 | 1 | 更新颜色状态 UI |
| `window.pwca_apply_color_to_all_views` | 不确定（可能是 PHP 内联） | — | 1 | 应用颜色到所有视图 |

### 2.6 图层/工具栏

| 全局名 | 定义文件 | 行号 | 使用文件数 | 用途 |
|--------|---------|------|-----------|------|
| `window.addLayerToStore` | `layers.js` | 517 | 2 | 添加图层到 Store |
| `window.pwcaUpdateDynamicToolbar` | `dongtai-toolbar.js` | 82 | 5 | 更新动态工具栏 |
| `window.pwcaLayerCounter` | `toolbar.js` | 1080 | 1 | 图层计数器 |
| `window.pw_selectionFromLayerList` | `operations.js` | 47 | 1 | 来自图层列表的选择 |
| `window.recordDesignUsage` | `toolbar.js` | 1222 | 1 | 记录设计使用 |
| `window.queueDesignUsage` | `toolbar.js` | 1223 | 1 | 队列设计使用 |

### 2.7 预览/导出/PDF

| 全局名 | 定义文件 | 行号 | 使用文件数 | 用途 |
|--------|---------|------|-----------|------|
| `window.pwcaUpdatePreviewCanvas` | `preview.js` | 65 | 4 | 更新预览画布 |
| `window.pwcaDrawImageCurvedAndCentered` | `preview.js` | 66 | 0 | **⚠️ 疑似未使用！** 弧形图片绘制 |
| `window.pwcaCalculateArcTextProperties` | `preview.js` | 67 | 0 | **⚠️ 疑似未使用！** 弧形文字计算 |
| `window.pwcaApplyArcDistortionToTextObject` | `preview.js` | 68 | 0 | **⚠️ 疑似未使用！** 弧形文字变形 |
| `window.generateUniversalViewImages` | `grid-preview.js` | 560 | 3 | 生成通用视图图片 |
| `window.captureViewForPDF` | `capture.js` | 207 | 2 | 捕获视图用于 PDF |
| `window.captureAllViewsImages` | `capture.js` | 206 | 0 | **⚠️ 疑似未使用！** 捕获所有视图 |
| `window.captureMultiLayerCanvasWithMask` | `capture.js` | 208 | 0 | **⚠️ 疑似未使用！** 多层画布捕获 |
| `window.captureCanvasById` | `capture.js` | 209 | 0 | **⚠️ 疑似未使用！** 按 ID 捕获画布 |
| `window.closeMultiViewPreview` | `capture.js` | 210 | 0 | **⚠️ 疑似未使用！** 关闭多视图预览 |
| `window.captureViewImage` | `grid-preview.js` / `export.js` | 559 / 36 | 0 | **⚠️ 疑似未使用！重复定义！** |
| `window.generateMultiViewPDF` | `page-bootstrap.js` | 1182 | 1 | 生成多视图 PDF |
| `window.pwcaRunPreviewRenderFlow` | `page-bootstrap.js` | 1183 | 1 | 运行预览渲染流 |
| `window.pwcaRunGeneratePdfFlow` | `page-bootstrap.js` | 1184 | 1 | 运行 PDF 生成流 |

### 2.8 Grid Preview（网格预览）

| 全局名 | 定义文件 | 行号 | 使用文件数 | 用途 |
|--------|---------|------|-----------|------|
| `window.generate4GridImagesForView` | `grid-preview.js` | 551 | 0 | **⚠️ 疑似未使用！** |
| `window.generateCompositeImageForGrid` | `grid-preview.js` | 552 | 0 | **⚠️ 疑似未使用！** |
| `window.drawLayerImageForGrid` | `grid-preview.js` | 553 | 0 | **⚠️ 疑似未使用！** |
| `window.drawLayerImageForGridWithColor` | `grid-preview.js` | 554 | 0 | **⚠️ 疑似未使用！** |
| `window.drawCroppedCanvasRegionWithWindowEffect` | `grid-preview.js` | 555 | 0 | **⚠️ 疑似未使用！** |
| `window.drawCanvasWithinBoundaryForWindow` | `grid-preview.js` | 556 | 0 | **⚠️ 疑似未使用！** |
| `window.drawCanvasWithinBoundary` | `grid-preview.js` | 557 | 0 | **⚠️ 疑似未使用！** |
| `window.cropImageWithConfig` | `grid-preview.js` | 558 | 0 | **⚠️ 疑似未使用！** |

### 2.9 多视图初始化

| 全局名 | 定义文件 | 行号 | 使用文件数 | 用途 |
|--------|---------|------|-----------|------|
| `window.pwcaIsTextLikeObject` | `multi-view-init.js` | 190 | 1（toolbar.js 重复定义同名函数） | 检查文本对象 |
| `window.pwcaApplyArcPathToTextObject` | `multi-view-init.js` | 192 | 1（toolbar.js 重复定义同名函数） | 应用弧形路径 |
| `window.pwcaApplyTintFilter` | `multi-view-init.js` | 547 | 1 | 应用着色滤镜 |
| `window.pwcaApplyGradientFilter` | `multi-view-init.js` | 587 | 1 | 应用渐变滤镜 |
| `window.pwcaClearAllGradientRects` | `multi-view-init.js` | 1154 | 1 | 清除渐变矩形 |
| `window.pwcaEnsureMultiViewInitialization` | `multi-view-init.js` | 1485 | 2 | 确保多视图初始化 |
| `window.pwcaGetBaseLayerPixelBounds` | `multi-view-init.js` | 1060 | 1 | 获取基础图层像素边界 |

### 2.10 视图流程解析

| 全局名 | 定义文件 | 行号 | 使用文件数 | 用途 |
|--------|---------|------|-----------|------|
| `window.pwcaIsFourGridFlow` | `view-flow-resolver.js` | 209 | 4 | 判断四格流程 |
| `window.pwcaGetFlowConfig` | `view-flow-resolver.js` | 210 | 2 | 获取流程配置 |
| `window.pwcaGetFlowPreviewImageConfigs` | `view-flow-resolver.js` | 211 | 3 | 获取流程预览配置 |

### 2.11 缩放控制

| 全局名 | 定义文件 | 行号 | 使用文件数 | 用途 |
|--------|---------|------|-----------|------|
| `window.triggerAutoZoomAdjustment` | `canvas-init.js` | 250 | 1 | 自动缩放调整 |
| `window.updateCanvasZoom` | `canvas-init.js` | 251 | 0 | **⚠️ 疑似未使用！** 更新画布缩放 |
| `window.initializeZoom` | `canvas-init.js` | 252 | 0 | **⚠️ 疑似未使用！** 初始化缩放 |

### 2.12 图片分析

| 全局名 | 定义文件 | 行号 | 使用文件数 | 用途 |
|--------|---------|------|-----------|------|
| `window.analyzeImageInfo` | `image-analyze.js` | 70 | 0 | **⚠️ 疑似未使用！** |
| `window.getPixelData` | `image-analyze.js` | 65 | 1 | 获取像素数据 |
| `window.getTopMargin` | `image-analyze.js` | 66 | 0 | **⚠️ 疑似未使用！** |
| `window.getTopMostY` | `image-analyze.js` | 67 | 0 | **⚠️ 疑似未使用！** |
| `window.getBottomMostY` | `image-analyze.js` | 68 | 0 | **⚠️ 疑似未使用！** |
| `window.getBoundingRectHeight` | `image-analyze.js` | 69 | 0 | **⚠️ 疑似未使用！** |

### 2.13 画布状态管理

| 全局名 | 定义文件 | 行号 | 使用文件数 | 用途 |
|--------|---------|------|-----------|------|
| `window.CanvasStateManager` | `canvas-state-manager.js` | 1791 | 0 | **⚠️ 疑似未使用！** |
| `window.canvasStateManager` | `canvas-state-manager.js` | 1792 | 1 | 画布状态管理器单例 |
| `window.CANVAS_STATE_VERSION` | `canvas-state-manager.js` | 1793 | 0 | **⚠️ 疑似未使用！** |
| `window.CanvasStateDataValidator` | `canvas-state-manager.js` | 1794 | 0 | **⚠️ 疑似未使用！** |
| `window.CanvasStateErrorHandler` | `canvas-state-manager.js` | 1795 | 0 | **⚠️ 疑似未使用！** |
| `window.CanvasStateErrorTypes` | `canvas-state-manager.js` | 1796 | 0 | **⚠️ 疑似未使用！** |
| `window.CanvasStateIntegration` | `canvas-state-integration.js` | 634 | 0 | **⚠️ 疑似未使用！** |
| `window.canvasStateIntegration` | `canvas-state-integration.js` | 635 | 1 | 状态集成单例 |
| `window.pwcaEnsureCanvasStateIntegrationReady` | `canvas-state-integration.js` | 636 | 2 | 确保状态集成就绪 |

### 2.14 印刷区域校验

| 全局名 | 定义文件 | 行号 | 使用文件数 | 用途 |
|--------|---------|------|-----------|------|
| `window.PrintAreaValidator` | `print-area-validator.js` | 348 | 8 | 印刷区域校验器 |

### 2.15 图层同步

| 全局名 | 定义文件 | 行号 | 使用文件数 | 用途 |
|--------|---------|------|-----------|------|
| `window.pwcaAddCanvasLayerListeners` | `layers-sync.js` | 223 | 0 | **⚠️ 疑似未使用！** |
| `window.pwcaSyncCanvasObjectToStore` | `layers-sync.js` | 224 | 0 | **⚠️ 疑似未使用！** |
| `window.pwcaSyncSelectionToStore` | `layers-sync.js` | 225 | 0 | **⚠️ 疑似未使用！** |
| `window.pwcaUpdateDongtaiAreaButtons` | `layers-sync.js` | 226 | 0 | **⚠️ 疑似未使用！** |
| `window.pwcaShowRelevantButtonGroup` | `layers-sync.js` | 227 | 0 | **⚠️ 疑似未使用！** |
| `window.pwcaControlMaskCanvasFromMain` | `layers-sync.js` | 228 | 0 | **⚠️ 疑似未使用！** |
| `window.pwcaControlMainWrapperDisplayArea` | `layers-sync.js` | 229 | 0 | **⚠️ 疑似未使用！** |
| `window.pwcaGetLayerName` | `layers-sync.js` | 230 | 0 | **⚠️ 疑似未使用！** |
| `window.pwcaGetLayerType` | `layers-sync.js` | 231 | 0 | **⚠️ 疑似未使用！** |

### 2.16 事件系统

| 全局名 | 定义文件 | 行号 | 使用文件数 | 用途 |
|--------|---------|------|-----------|------|
| `window.pwcaInitializeCanvasEventListeners` | `events.js` | 20 | 1 | 初始化画布事件监听 |
| `window.pwcaAddCanvasEventListeners` | `events.js` | 218 | 0 | **⚠️ 疑似未使用！** |
| `window.pwcaAddCanvasSelectionListeners` | `events.js` | 219 | 0 | **⚠️ 疑似未使用！** |
| `window.pwcaTriggerPrintMethodModal` | `layers.js` | 374 | 2 | 触发印刷方式弹窗 |

### 2.17 产品模块（front_product）

| 全局名 | 定义文件 | 行号 | 使用文件数 | 用途 |
|--------|---------|------|-----------|------|
| `window.pwProductConfig` | `product/main.js` | 85 | 4 | 产品配置数据 |
| `window.pwProductData` | `product/main.js` | 91 | 1 | 产品数据 |
| `window.ProductDataAPI` | `product/api/productDataAPI.js` | 5 | 1 | 产品数据 API |
| `window.ProductResponseMapper` | `product/api/productResponseMapper.js` | 72 | 1 | 产品响应映射器 |
| `window.ProductCanvasPayloadBuilder` | `product/api/canvasPayloadBuilder.js` | 74 | 1 | 画布载荷构建器 |
| `window.ProductCartSubmitService` | `product/api/cartSubmitService.js` | 110 | 3 | 购物车提交服务 |
| `window.ProductImageCanvas` | `product/product-image-canvas.js` | 565 | 4 | 产品图片画布 |
| `window.ProductColorSelectionBridge` | `product/components/colorSelectionBridge.js` | 79 | 3 | 颜色选择桥接 |
| `window.showSuccessMessage` | `utils/messageUtils.js` | 243 | PHP 模板 | 消息提示 |
| `window.showErrorMessage` | `utils/messageUtils.js` | 244 | PHP 模板 | 错误提示 |
| `window.showInfoMessage` | `utils/messageUtils.js` | 245 | PHP 模板 | 信息提示 |
| `window.showMessage` | `utils/messageUtils.js` | 246 | PHP 模板 | 通用消息 |

### 2.18 Vue 组件（挂到 window 给 PHP 模板用）

| 全局名 | 定义文件 | 行号 | 用途 |
|--------|---------|------|------|
| `window.CheckboxOptions` | `CheckboxOptions.js` | 47 | 复选框组件 |
| `window.QuantityDiscountSlider` | `QuantityDiscountSlider.js` | 121 | 数量折扣滑块 |
| `window.ProductQuantity` | `ProductQuantity.js` | 161 | 产品数量 |
| `window.ProductPriceInfo` | `ProductPriceInfo.js` | 117 | 产品价格信息 |
| `window.AddToCart` | `AddToCart.js` | 57 | 加入购物车 |
| `window.ProductAccessories` | `ProductAccessories.js` | 245 | 产品配件 |
| `window.ColorVariants` | `ColorVariants.js` | 89 | 颜色变体 |
| `window.CustomColorsButton` | `CustomColorsButton.js` | 5 | 自定义颜色按钮 |

### 2.19 Pinia Sync 工具

| 全局名 | 定义文件 | 行号 | 使用文件数 | 用途 |
|--------|---------|------|-----------|------|
| `window.syncPiniaToElement` | `piniaSync.js` | 152 | 0 | **⚠️ 疑似未使用！** Pinia DOM 同步 |

### 2.20 页面引导/异步启动

| 全局名 | 定义文件 | 行号 | 使用文件数 | 用途 |
|--------|---------|------|-----------|------|
| `window.generateMultiViewPDF` | `page-bootstrap.js` | 1182 | 1 | PDF 生成入口 |
| `window.pwcaRunPreviewRenderFlow` | `page-bootstrap.js` | 1183 | 1 | 预览渲染流 |
| `window.pwcaRunGeneratePdfFlow` | `page-bootstrap.js` | 1184 | 1 | PDF 生成流 |
| `window.pwcaCanvasEditFromCart` | `page-bootstrap.js` | 26 | 1 | 从购物车编辑标记 |
| `window.pwcaCartKeyForCanvasEdit` | `page-bootstrap.js` | 31 | 1 | 购物车编辑 Key |
| `window.pwcaCanvasAsyncContext` | `page-bootstrap.js` | 1015 | 1 | 异步上下文 |
| `window.pwcaCanvasStartupPromise` | `page-bootstrap.js` | 1141 | 0 | **⚠️ 疑似未使用！** |
| `window.pwcaInitialCanvasState` | `page-bootstrap.js` | 1171 | 0 | **⚠️ 疑似未使用！** |

### 2.21 顶层 const/let/function（非 window，但全局作用域）

**`page-bootstrap.js`** — ~55 个顶层 `const` 箭头函数

**`multi-view-init.js`** — ~30 个顶层函数/常量

**`boundary.js`** — `BOUNDARY_MARGIN`, `drawBoundary`, `drawBoundaryForAllViews`

**`toolbar.js`** — ~14 个顶层函数

**`grid-preview.js`** — ~15 个顶层函数

---

## 三、问题汇总

### 3.1 ⚠️ 疑似未使用的全局变量（共 ~42 个）

详见交互式时间线中的「清理」阶段。

### 3.2 🔄 重复定义（6 处）

| 变量 | 定义位置 1 | 定义位置 2 | 说明 |
|------|-----------|-----------|------|
| `window.usePrintMethodStore` | `design/stores/index.js:670` | `design/stores/printMethodStore.js:522` | 同一 Store 被两个文件挂到 window |
| `window.pwcaApplyOperationPanelModuleVisibility` | `core-init.js:306` | `core-init.js:355` | 同一文件重复赋值 |
| `window.canvas` / `window.fabricCanvas` | `core-init.js:340-341` | `page-bootstrap.js:667-668` + `multi-view-init.js:630-631` | 多处重复设置 |
| `window.captureViewImage` | `export.js:36` | `grid-preview.js:559` | 两个文件都定义 |
| `pwcaGetUiStateAccess` (函数名) | `ui-state-access.js` | 6 个其他文件 | 7 个文件各自定义同名局部函数 |
| `pwcaIsTextLikeObject` | `multi-view-init.js:138` | `toolbar.js:76` | 两个文件各自定义同名函数 |

---

## 四、迁移方案

> 完整的交互式迁移时间线请查看 **[global-variables-timeline.html](global-variables-timeline.html)**

### 核心策略

```
现状: PHP wp_enqueue_script → <script> → 全局变量
目标: PHP wp_enqueue_script → <script type="module"> → import/export
```

**不需要构建工具** — 浏览器原生支持 `<script type="module">`，WordPress 通过 `wp_script_add_data($handle, 'type', 'module')` 即可。

### 预期收益

| 指标 | 迁移前 | 迁移后 |
|------|--------|--------|
| `window.*` 全局变量数 | ~95 个 | ~5 个 |
| 顶层作用域污染 | ~85 个声明 | 0 |
| 未使用全局变量 | ~42 个 | 0 |
| 重复定义 | 6 处 | 0 |
| 构建工具需求 | 无 | **无** |

**总预估工时**: 7-11 个工作日
