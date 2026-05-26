# 产品页与设计页 Vue Pinia 规范

## 适用范围

- 产品页：`modules/front_product/assets/js/product`
- 设计页：`modules/front_canvas/assets/js/design`
- 目标：在不一次性推翻现有实现的前提下，统一命名、数据流和状态管理边界。

## 命名规范

- 组件名使用 `PascalCase`，文件名与组件名保持一致，如 `ProductPriceInfo.js`、`CustomColorsButton.js`。
- store 获取函数统一使用 `useXxxStore`，如 `useProductStore`、`useCanvasStore`、`usePrintMethodStore`。
- state 使用“名词 / 形容词 + 名词”命名，不用 `get` 前缀，如 `selectedVariant`、`blankProductChecked`、`gradientColorApplied`。
- getter 使用描述结果的名称，不用 `get` 前缀，如 `currentDiscount`、`discountText`、`shouldShowAddToCart`、`currentViewCustomizationSettings`。
- 只有“返回函数的 getter”或“普通工具方法”才允许使用 `getXxx` 命名。
- action 使用动词开头，如 `setBuySampleChecked`、`resetCustomColorState`、`ensureViewPrintMethodsLoaded`。
- 兼容旧代码时可以保留旧命名别名，但新代码只能使用规范命名。

## 数据分层规范

- 原始 API 数据：
  - 指后端聚合接口原样返回的数据。
  - 只能在 store 的数据入口或 API 适配层中读取。
- 标准化领域数据：
  - 指 store 写入后的业务状态，如 `variants`、`moqSettings`、`views`、`storeCustomizationSettings`。
  - 组件默认只读取这一层。
- UI 派生数据：
  - 指由 getter/computed 推导出的显示值，如 `discountText`、`estimatedDeliveryDate`、`shouldShowCustomize`。
  - 组件优先读取这一层，不自行重复推导。

## 产品页规范

- 第一阶段不强制迁移 Pinia，但 `productStore` 要按 Pinia 思路组织：
  - state 只存基础状态。
  - getter 只做派生计算。
  - action 负责状态写入、数据初始化和异步流程。
- 组件不得直接写 store 状态：
  - 禁止 `store.xxx = value`
  - 禁止 `v-model="store.xxx"` 直接双向改写共享状态
  - 必须通过 action，如 `setBlankProductChecked()`、`setSelectedVariant()`
- 组件不得直接从 `productData.apiData` 深层取值来做 UI 逻辑。
  - 到货时间、折扣文案、按钮显隐等统一由 store 提供 getter。
- 组件不得绕过 store 直接读 DOM 作为业务真值。
  - 数量、选中颜色、变体状态都以 store 为准。

## 设计页规范

- `front_canvas` 使用 Pinia 时遵循标准职责边界：
  - state 存持久化业务状态和页面共享状态。
  - getter 负责当前视图、模块可见性、最终配置等读取逻辑。
  - action 负责异步请求、视图切换、副作用协调。
- 允许为了兼容旧脚本暴露 `window.useCanvasStore` / `window.usePrintMethodStore`，但新逻辑应优先收敛到 store action，不在外围脚本重复写一套状态切换流程。
- 与店铺定制设置相关的合并结果只能有一个权威入口。
  - 当前以 `currentViewCustomizationSettings` 为准。
- `printing_method_list_id` 只在当前视图存在且需要时触发请求。
  - 禁止在初始化阶段无差别预拉所有视图的印刷方式。

## 跨模块协作规范

- 产品页与设计页互相读取状态时，优先通过公开 action / getter 协作，不直接依赖对方内部字段命名。
- 与 Fabric、CanvasManager、DOM 自定义事件的交互，尽量视为“适配层行为”，不要把这类逻辑分散到多个业务组件里。
- 若必须兼容旧事件名，保留旧事件；新增代码不要继续扩散新的随意事件名。

## 渐进式重构规则

- 每次重构先收口状态入口，再收口组件取数，再考虑拆分结构。
- 先解决“错误命名、直接改状态、重复推导”这类高风险问题，再做架构升级。
- 第一阶段允许保留兼容别名，但后续新增组件和新增 getter/action 必须直接使用规范命名。
- 局部重构时以“不改坏功能”为第一原则，避免一次性替换整条初始化链路。
