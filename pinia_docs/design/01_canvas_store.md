# useCanvasStore（ID: canvas）

- 页面：设计画布页（`public/js/design/`）
- 模块路径：`public/js/design/stores/index.js`
- 全局访问器：`window.useCanvasStore()`
- 关联：导入并使用 `usePrintMethodStore` 以同步各视图的印刷方式
- 外部接口：`GET /wp-json/pw/v1/product-data/{pwId}`（加载产品数据）

## 概述
管理多视图的图层状态、分组、当前激活视图/画布、产品数据片段与视图流程（`view_flow`），并在视图切换时协调印刷方式 Store 的当前视图数据。

## State（核心字段）
- `canvasStates`: 每个画布的状态快照（序列化对象，不存放 Fabric 实例）
- `activeCanvasId`: 当前激活画布ID
- `layers`: 当前激活视图的图层列表
- `viewLayers`: 各视图的图层映射 `{ viewId: [layers] }`
- `activeObjectId`: 当前选中对象ID
- `actionRequest`: 全局动作请求（跨组件通信）
- `layerGroups`: 当前激活视图的图层组列表
- `viewLayerGroups`: 各视图图层组映射 `{ viewId: [groups] }`
- `activeGroupId`: 当前激活图层组ID
- `productData`: 产品数据（来自内部 REST）
- `isLoadingProductData`: 产品数据加载状态
- `productDataError`: 产品数据加载错误信息
- `views`: 视图数组（来自 `productData.templates.views`）
- `activeView`: 当前激活视图对象
- `activeViewId`: 当前激活视图ID
- `productViewFlow`: 视图流程类型（如 `single_view`/`multi_view`）
- `selectedColorsByView`: 各视图下用户选择的颜色数据 `{ [viewId]: colorVariantObj }`

## Getters（只做计算）
- `moqItemsDesignRaw` / `moqItemsDesignEnabled` / `shouldShowMoqDesign`: 基于 `productData.customization_settings` 判断“按设计 MOQ”是否显示
- `moqItemsColorRaw` / `moqItemsColorEnabled` / `shouldShowMoqColor`: 判断“按颜色 MOQ”是否显示
- `hasAnyGroupedLayersAcrossViews`: 是否任一视图存在被分组图层（依据 `layer.groupId`）
- `getSelectedColorByView(viewId)`: 获取指定视图选色
- `currentViewSelectedColor`: 获取当前视图选色
- `getTotalMaxRtsForBulkOrder`: 汇总各视图 `rts_for_bulk_order` 最大值
- `getTotalMaxRtsForSampleOrder`: 汇总各视图 `rts_for_sample_order` 最大值

## Actions（变更与异步）
- 视图/层：
  - `setActiveCanvasId(id)`、`updateCanvasState(id, state)`
  - `setLayers(layers)`、`setActiveObjectId(id)`、`requestAction(payload)`
  - `setViewLayers(viewId, layers)`、`getViewLayers(viewId)`
  - `addLayerToView(viewId, layer)`、`removeLayerFromView(viewId, layerId)`
  - `setLayerGroups(groups)`、`setActiveGroupId(id)`
  - `setViewLayerGroups(viewId, groups)`、`getViewLayerGroups(viewId)`
- 产品/视图：
  - `setProductData(data)`、`setLoadingProductData(bool)`、`setProductDataError(err)`
  - `setViews(views)`、`setActiveView(view)`、`setProductViewFlow(viewFlow)`、`getProductViewFlow()`
  - `setActiveViewId(viewId)`: 切换视图时同步 `layers` 与 `layerGroups`，并调用 `printMethodStore.switchToViewPrintMethods(viewId)`
  - 颜色选择：`setSelectedColorByView(viewId, colorData)`、`clearSelectedColorByView(viewId)`、`clearAllSelectedColors()`
- 异步：
  - `fetchProductData(pwId)`: 调用内部 `GET /wp-json/pw/v1/product-data/{pwId}` 获取产品数据并设置视图
  - `setViewsFromProductData(productData)`: 赋值 `templates.views`、设置 `productViewFlow`、为每视图加载印刷方式、默认激活首视图
  - `loadPrintMethodsForAllViews()`: 遍历 `views`，调用 `printMethodStore.setViewPrintMethods(view.id, view.printing_method_list_id)`

## 控制台测试示例
- 读取并加载产品数据：
  ```js
  const cs = window.useCanvasStore();
  await cs.fetchProductData(12345); // 替换为真实 PW 产品ID
  cs.views.map(v => v.id);
  ```
- 切换视图并检查层/组同步：
  ```js
  const first = cs.views[0].id;
  cs.setActiveViewId(first);
  cs.getViewLayers(first);
  cs.getViewLayerGroups(first);
  ```
- 校验 MOQ 展示逻辑与颜色选择：
  ```js
  cs.shouldShowMoqDesign; // true/false
  cs.shouldShowMoqColor;  // true/false
  cs.setSelectedColorByView(first, { rts_for_bulk_order: 2, rts_for_sample_order: 1 });
  cs.getTotalMaxRtsForBulkOrder;   // 汇总数值
  cs.getTotalMaxRtsForSampleOrder; // 汇总数值
  ```

## 注意事项
- 不在 Store 中持有 Fabric Canvas 实例；所有 Canvas 操作通过 CanvasManager。
- Getter 仅做计算；异步逻辑与状态修改统一放在 Actions。
- 切换视图需同步印刷方式 Store 的当前视图方法集。