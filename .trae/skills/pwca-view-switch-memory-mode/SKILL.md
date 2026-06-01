---
name: "pwca-view-switch-memory-mode"
description: "PWCA 设计页多视图内存态切换方案。Invoke when working on view switching, active canvas sync, layer panel view sync, or decoupling save/restore from normal switches."
---

# PWCA 设计页视图切换内存态方案

## 适用场景

- 当需求涉及设计页多视图切换卡顿、切换时报错、切换后图层/工具栏不同步时调用。
- 当需要修改 `store.setActiveViewId()`、`pwcaViewSwitchFacade.switchToView()`、`CanvasManager` 激活逻辑时调用。
- 当需要把普通视图切换与 `CanvasStateManager` 的保存/恢复能力解耦时调用。
- 当需要排查 `layerPanelViewSwitch`、`window.canvas`、`window.fabricCanvas` 跟随当前视图的同步问题时调用。

## 当前已落地方案

### 目标原则

1. 普通切换只做“内存态切换 + 显示激活视图”，不做 JSON save/restore。
2. 每个视图的 Fabric Canvas 在多视图初始化后常驻内存，不在切换时重建。
3. `CanvasStateManager` 仅保留按需持久化和外部恢复职责，不再参与高频视图切换。

### 职责边界

| 层 | 文件 | 职责 |
|---|---|---|
| Store 主状态切换 | `modules/front_canvas/assets/js/design/stores/index.js` | 更新 `activeViewId/activeView`、切换 `layers/layerGroups`、同步印刷方式、清理选中态 |
| DOM 与激活画布同步 | `modules/front_canvas/assets/js/main/view-switch-facade.js` | 统一切换入口、显示目标 `.view-container`、切换 `CanvasManager`、更新 `window.canvas/window.fabricCanvas`、清理其他画布选中态 |
| 持久化与外部恢复 | `modules/front_canvas/assets/js/design/utils/canvas-state-integration.js` | 初始化 `CanvasStateManager`、监听画布/Store 变化并按需保存、执行 `applyExternalState()` |
| 本地状态存储 | `modules/front_canvas/assets/js/design/utils/canvas-state-manager.js` | `saveViewState()`、`saveAllViewStates()`、`restoreViewState()`、`loadExternalState()` |

## 核心调用链

```text
外围 UI / 图层面板 / 视图按钮
  -> window.pwcaViewSwitchFacade.switchToView(viewId, options)
    -> store.setActiveViewId(viewId)
      -> 保存当前视图 viewLayers/viewLayerGroups（即使为空数组也要写回）
      -> 更新 activeViewId / activeView
      -> 加载目标视图的 layers / layerGroups
      -> 清空 activeObjectId / activeGroupId
      -> 同步印刷方式
    -> syncViewContainers(viewId)
    -> syncCanvasManager(viewId)
      -> CanvasManager.setActiveCanvas(viewId)
      -> 更新 window.canvas / window.fabricCanvas
      -> discard 其他画布选中态
    -> dispatch layerPanelViewSwitch
```

## 已落地实现约束

### `store.setActiveViewId()` 必须满足

- 普通切换中禁止再调用 `canvasStateIntegration.handleViewSwitch()` 做 `save/restore`。
- 切走当前视图前，必须把 `this.layers` 和 `this.layerGroups` 写回 `viewLayers/viewLayerGroups`。
- 即使当前图层为空，也必须写回空数组，否则会残留旧视图数据。
- 切到新视图后，必须同步：
  - `activeViewId`
  - `activeView`
  - `layers`
  - `layerGroups`
  - `activeObjectId = null`
  - `activeGroupId = null`
- 切换后仍要触发当前视图印刷方式同步。

### `view-switch-facade.js` 必须满足

- 作为外围统一视图切换入口，优先使用 `window.pwcaViewSwitchFacade.switchToView(viewId, options)`。
- 负责：
  - 隐藏所有 `.view-container`
  - 显示目标容器
  - `CanvasManager.setActiveCanvas(viewId)`
  - 更新 `window.canvas` / `window.fabricCanvas`
  - 清理其他视图画布选中态
  - 派发 `layerPanelViewSwitch`
- 不负责本地状态恢复。

### `canvas-state-integration.js` 必须满足

- 保留画布监听器和 Store watcher。
- 允许通过对象变更、防抖 watcher 触发按需保存。
- `handleViewSwitch()` 仅保留兼容壳，普通切换中不得再做：
  - `saveViewState(previousViewId)`
  - `restoreViewState(newViewId)`
- 外部恢复仍走：
  - `applyExternalState(externalState)`
  - `_restoreAllViewStates()`

### 外围脚本约束

- `customization-area.js` 只更新视图按钮激活态，不要在 `layerPanelViewSwitch` 监听里重复执行 `syncViewContainers()` / `syncCanvasManager()`。
- 任何新的外围脚本如果想切视图，优先走 facade，不要直接同时操作 Store、DOM、CanvasManager 三套状态。

## 为什么这样改

- 避免高频切换时重复 JSON 序列化/反序列化 Fabric 对象。
- 降低弧形文字、`clipPath`、filter、嵌套图片结构在 restore 时出错的概率。
- 把“普通切换问题”和“页面恢复/购物车编辑恢复问题”分离，便于排查。
- 让切换逻辑只依赖内存中已经存在的 Fabric Canvas 实例，减少卡顿和时序抖动。

## 常见误区

- 不要把“切换视图”等同于“恢复视图状态”。
- 不要为了切换视图去重新初始化 Canvas 或重新挂载整个视图组件。
- 不要把 Fabric Canvas 实例放进深响应式状态里。
- 不要在多个外围监听器里重复做 DOM 显隐和激活画布同步。
- 不要依赖“切换后对象会被重新生成”的旧行为。

## 允许保留的恢复场景

- 页面刷新后的状态恢复
- 离开页面前的草稿保存
- 手动保存草稿
- 购物车编辑回填
- 服务器返回外部状态后的覆盖恢复

## 排查清单

当用户反馈“视图切换不顺畅”时，按下面顺序查：

1. 是否仍有代码在普通切换时调用 `saveViewState()` 或 `restoreViewState()`。
2. 是否有外围脚本绕过 facade，直接操作 `store.setActiveViewId()` 后又手动改 DOM。
3. 是否有监听器在 `layerPanelViewSwitch` 后重复 `syncCanvasManager()`。
4. 切换后 `window.canvas`、`window.fabricCanvas`、`CanvasManager.getCurrentViewId()` 是否一致。
5. 清空某视图图层后切走再切回，`viewLayers[viewId]` 是否被正确写成空数组。
6. 图层面板高亮是否被旧的 `activeObjectId/activeGroupId` 污染。

## 本次落地涉及文件

- `modules/front_canvas/assets/js/design/stores/index.js`
- `modules/front_canvas/assets/js/design/utils/canvas-state-integration.js`
- `modules/front_canvas/assets/js/main/view-switch-facade.js`
- `modules/front_canvas/assets/js/main/customization-area.js`
- 设计文档：`docs/JS/设计页视图切换内存态重构计划.md`

## 推荐改动方式

- 先确认需求属于“普通切换”还是“外部恢复”。
- 如果是普通切换，只改 Store + facade + 外围同步链，不碰 `restoreViewState()`。
- 如果是购物车编辑或草稿恢复，优先检查 `applyExternalState()` 和 `_restoreAllViewStates()`。
- 若新增视图切换入口，统一接到 `window.pwcaViewSwitchFacade.switchToView()`。
