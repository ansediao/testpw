# usePrintMethodStore（ID: printMethod）

- 页面：设计画布页（`public/js/design/`）
- 模块路径：`public/js/design/stores/printMethodStore.js`
- 全局访问器：`window.usePrintMethodStore()`
- 关联：与 `useCanvasStore` 通过视图ID进行数据同步（`switchToViewPrintMethods(viewId)`）

## 概述
按视图管理印刷方式集合与可用性规则，提供“已使用”的印刷方式统计、默认方式选择、图层/组到印刷方式的映射，并封装从 API 数据到内部格式的转换。

## State（核心字段）
- `viewPrintMethods`: 各视图印刷方式映射 `{ [viewId]: [methods] }`
- `currentViewPrintMethods`: 当前视图的印刷方式数组
- `selectedPrintMethodId`: 当前选中的印刷方式ID
- `layerPrintMethodMap`: 图层到印刷方式的映射 `{ [layerId]: methodId }`
- `groupPrintMethodMap`: 图层组到印刷方式的映射 `{ [groupId]: methodId }`
- `usedPrintMethodsByView`: 记录某视图下已使用的印刷方式 `{ [viewId]: { [methodId]: methodObject } }`
- `usedPrintMethodCountsByView`: 已使用印刷方式的引用计数 `{ [viewId]: { [methodId]: number } }`
- `loadingPrintMethods` / `printMethodsError`: 印刷方式数据加载状态与错误信息

## Getters（只做计算）
- 集合访问：
  - `getAllPrintMethods`（当前视图）
  - `getViewPrintMethods(viewId)` / `getViewPrintMethodById(viewId, methodId)`
  - `getPrintMethodById(id)`（当前视图）
- 选择与默认：
  - `selectedPrintMethod` / `getSelectedPrintMethod`
  - `getDefaultPrintMethod` / `getViewDefaultPrintMethod(viewId)`
- 可用性与状态：
  - `getAvailablePrintMethods` / `getViewAvailablePrintMethods(viewId)`（`status === 1`）
  - `isLoadingPrintMethods` / `getPrintMethodsError`
- 权限规则：
  - `isLayerCopyAllowed(layerId)` / `isLayerDeleteAllowed(layerId)`
  - `isGroupCopyAllowed(groupId)` / `isGroupDeleteAllowed(groupId)`
  - `getGroupPrintMethod(groupId)`（从组ID或映射反推 method）
- 其他：
  - `isSinglePrintMethod` / `canSwitchPrintMethod`
  - `getUsedPrintMethodsByView(viewId)` / `getUsedPrintMethodsMapByView(viewId)` / `getUsedPrintMethodIdsByView(viewId)` / `isPrintMethodUsedInView(viewId, methodId)`
  - `getMaxUsedMoqQuantity`: 所有视图中，`apiData.moq_enabled` 为真时的 `apiData.moq_quantity` 最大值
  - `getTotalPrintCostFromUsedMethods`: 所有视图中“已使用”印刷方式的 `print_cost` 总和（每种方式只计一次）

## Actions（变更与异步）
- 加载与转换：
  - `fetchPrintMethods(printingMethodIds)`: 根据ID列表获取方式并转换为内部格式
  - `convertApiDataToInternalFormat(apiMethod)`: 将接口返回的原始对象转为统一内部结构（含 features/marks/helper 等）
- 视图方法集：
  - `setViewPrintMethods(viewId, printingMethodIds)`: 为视图设置方式集合（异步加载与转换）
  - `switchToViewPrintMethods(viewId)`: 切换当前视图方法集（通常由 `useCanvasStore` 在视图切换时触发）
  - `retrieveViewPrintMethods(viewId)`: 读取已缓存的视图方法数组
- 选择与映射：
  - `setSelectedPrintMethod(methodId)`
  - 图层：`assignLayerPrintMethod(layerId, methodId)` / `unassignLayerPrintMethod(layerId)`
  - 组：`assignGroupPrintMethod(groupId, methodId)` / `unassignGroupPrintMethod(groupId)`
- 使用统计：
  - `recordPrintMethodUsage(viewId, methodId)` / `unrecordPrintMethodUsage(viewId, methodId)`
  - `recomputeUsedPrintMethodsForView(viewId)` / `recomputeUsedPrintMethodsForAllViews()`
- 校验：
  - `validateLayerForPrintMethod(layer, methodId)`: 校验图层是否满足指定印刷方式的约束

## 控制台测试示例
- 设置并切换视图方法集：
  ```js
  const pm = window.usePrintMethodStore();
  // 假设某视图有方式ID列表
  await pm.setViewPrintMethods('view_1', ['method_a', 'method_b']);
  pm.switchToViewPrintMethods('view_1');
  pm.getAvailablePrintMethods('view_1');
  ```
- 设置默认与选择：
  ```js
  const current = pm.getAllPrintMethods;
  pm.setSelectedPrintMethod(current[0]?.id);
  pm.selectedPrintMethod; // 当前选中对象
  ```
- 图层/组映射与权限：
  ```js
  pm.assignLayerPrintMethod('layer_123', current[0]?.id);
  pm.getLayerPrintMethod('layer_123');
  pm.isLayerCopyAllowed('layer_123');

  pm.assignGroupPrintMethod('print-method-' + current[0]?.id, current[0]?.id);
  pm.getGroupPrintMethod('print-method-' + current[0]?.id);
  pm.isGroupDeleteAllowed('print-method-' + current[0]?.id);
  ```
- 使用统计与成本：
  ```js
  pm.recordPrintMethodUsage('view_1', current[0]?.id);
  pm.getUsedPrintMethodIdsByView('view_1');
  pm.getMaxUsedMoqQuantity; // 最大MOQ
  pm.getTotalPrintCostFromUsedMethods; // 总成本
  ```

## 注意事项
- 权限计算依赖当前视图的 `currentViewPrintMethods` 与图层/组映射；务必在视图切换时调用 `switchToViewPrintMethods`。
- 内部格式保持与 API 字段兼容，所有原始数据保留在 `apiData` 字段中。
- Getter 只做计算；异步加载与状态变更放在 Actions。