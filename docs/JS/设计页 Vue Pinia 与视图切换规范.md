# 设计页 Vue Pinia 与视图切换规范

## 适用范围

- 设计页主状态：`modules/front_canvas/assets/js/design/stores`
- 设计页组件层：`modules/front_canvas/assets/js/design/components`
- 设计页外围脚本：`modules/front_canvas/assets/js/main`、`modules/front_canvas/assets/js/canvas`

## 设计页状态规范

- `useCanvasStore` 负责设计页主状态，包含：
  - 产品数据与视图数据
  - 当前激活视图
  - 图层与图层组
  - 当前视图的最终配置
- `usePrintMethodStore` 负责印刷方式状态，包含：
  - 视图对应的印刷方式列表
  - 当前选中的印刷方式
  - 图层 / 组到印刷方式的映射
- 新逻辑优先通过 store action 改状态，避免外围脚本直接拼接一套重复流程。

## 命名规范

- store action 使用动词开头，如 `setActiveViewId`、`ensureViewPrintMethodsLoaded`
- getter 使用结果型名称，如 `currentViewCustomizationSettings`
- 协调层 / facade 使用领域名 + 职责名，如 `pwcaViewSwitchFacade`
- 事件名保持稳定，沿用已有 `layerPanelViewSwitch`，不要继续新增语义重复的视图切换事件

## 数据与副作用边界

- store 负责状态和最小必要的业务联动
- DOM 显隐、CanvasManager 激活、全局画布引用更新，统一视为“视图切换副作用”
- 这些副作用必须集中在单一入口中处理，不能分散在多个脚本里重复实现

## 视图切换规范

- 设计页所有“切换视图”操作统一走单一入口
  - 推荐入口：`window.pwcaViewSwitchFacade.switchToView(viewId, options)`
- 允许触发视图切换的来源包括：
  - 视图按钮点击
  - 图层面板切换
  - URL 参数初始化
  - 需要强制同步当前视图 DOM 的场景
- 单一入口至少负责以下动作：
  - 校验并获取目标视图
  - 更新 store 中的激活视图
  - 显示对应 `.view-container`
  - 切换 `CanvasManager` 当前画布
  - 清理其它画布选中状态
  - 更新 `window.canvas` / `window.fabricCanvas`
  - 按需派发 `layerPanelViewSwitch`

## 外围脚本协作规范

- `customization-area.js` 只负责渲染视图按钮和同步按钮激活态，不再手写完整视图切换流程
- `url-params-handler.js` 只负责解析 URL 参数和调用统一视图切换入口
- `design/components/layers/state.js` 只暴露切换动作，不直接操作 `CanvasManager` 和 DOM
- 若某处只需要响应视图切换，优先监听 `layerPanelViewSwitch`，不要再主动重复同步 DOM

## 兼容策略

- 现有 `store.setActiveViewId()` 保留，作为底层状态动作
- 现有 `layerPanelViewSwitch` 保留，作为外围脚本与老逻辑的兼容事件
- 新代码不再直接组合 `setActiveViewId + DOM 显隐 + CanvasManager + dispatchEvent`

## 渐进式重构要求

- 第一优先级是保证视图切换行为一致
- 第二优先级是减少外围脚本对 `window.useCanvasStore()` 的重复直接操作
- 在未完成全面模块化前，允许 facade 作为过渡层存在
- 任何设计页重构都必须保持工具栏、图层面板、多视图切换、URL 视图定位不被改坏
