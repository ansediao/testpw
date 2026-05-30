# 设计页 VueUse 与加载流程说明

## 适用范围

- `modules/front_canvas/assets/js/canvas/page-bootstrap.js`
- `modules/front_canvas/assets/js/canvas/multi-view-init.js`
- `modules/front_canvas/assets/js/main/view-flow-resolver.js`
- `modules/front_canvas/assets/js/design/stores/index.js`
- `modules/front_canvas/assets/js/design/stores/product-data-mapper.js`
- `modules/front_canvas/assets/js/design/components/header-controls.js`
- `modules/front_canvas/assets/js/design/utils/canvas-state-manager.js`
- `modules/front_canvas/assets/js/main/grid-preview.js`
- `modules/front_canvas/assets/js/main/tab-image.js`
- `modules/front_canvas/assets/js/design/utils/print-area-validator.js`

## 目标

- 说明当前设计页是怎么使用 VueUse 参与加载和初始化流程的
- 说明当前平面流程和 `4-Grid Flow` 的差异
- 说明后续如果要新增别的流程，应该从哪里接入
- 说明 `4-Grid Flow` 初始化流程出问题时，应该优先改哪些地方

## 一句话结论

- VueUse 不是设计页“流程分发器”，它主要是辅助启动队列、持久化和历史管理
- 当前建议只先记 4 个主入口：
  - `page-bootstrap.js`
  - `stores/index.js`
  - `view-flow-resolver.js`
  - `multi-view-init.js`
- 设计页真正的流程控制核心是：
  - `page-bootstrap.js` 的异步启动队列
  - `stores/index.js` 的产品数据转视图状态
  - `view-flow-resolver.js` 的流程识别
  - `multi-view-init.js` 的多视图初始化与按 `view_flow` 分支处理
- 当前只有两类主要流程：
  - 平面流程
  - `4-Grid Flow`
- 如果后面要加新流程，核心不是只改一个地方，而是要把“识别流程、初始化画布、交互约束、预览导出”这四层一起补齐

## VueUse 目前怎么参与设计页加载

### 1. `useAsyncQueue`

- 文件：`page-bootstrap.js`
- 用途：把设计页启动拆成一串异步任务，按顺序执行
- 当前任务顺序是：
  - 等待 `useCanvasStore()` 可用
  - 请求产品数据
  - 确保当前视图印刷方式已加载
  - 初始化多视图画布
  - 初始化画布状态集成
  - 编辑态时恢复购物车画布状态
- 这里 VueUse 只是提供 `useAsyncQueue`
- 如果 VueUse 不可用，会降级为手动串行 `for...of await`
- 所以这里不是强依赖，更多是把异步启动流程包成统一队列

### 2. `useStorage`

- 文件：`design/stores/index.js`
- 用途：
  - 持久化 `userPreferences`
  - 持久化 `canvasStatesByProductId`
- 文件：`design/utils/canvas-state-manager.js`
- 用途：
  - 按产品维度持久化设计页状态
  - LocalStorage 不可用或 VueUse 不可用时，降级为内存存储
- 这部分不决定“当前走平面流程还是 4 格图流程”
- 它负责的是：初始化完成后，状态怎么留存和恢复

### 3. `useRefHistory`

- 文件：`design/components/header-controls.js`
- 用途：给每个视图建立撤销 / 重做历史
- 它依赖 `multiViewInitComplete` 事件
- 也就是说，必须先完成多视图初始化，历史记录才能开始挂上去
- 这部分同样不负责流程分发，而是依赖流程初始化结果

## 当前设计页完整加载链路

## 第一层：数据与状态准备

- 页面进入后，`page-bootstrap.js` 在 `DOMContentLoaded` 或立即执行时启动异步流程
- 第一步先等待 `window.useCanvasStore()` 可用
- 然后调用 store 的 `fetchProductData(pwId)`
- `fetchProductData` 内部会继续做三件事：
  - `fetchCanvasProductData(pwId)`
  - `pwcaPrepareCanvasProductData(result.data)`
  - `setViewsFromProductData(data)`

## 第二层：视图数据成型

- `setViewsFromProductData` 会调用 `pwcaBuildViewsFromProductData(productData, storeCustomizationSettings)`
- 这个 mapper 的职责是：
  - 从 `productData.templates.views` 构建设计页视图数组
  - 合并店铺级配置和视图级配置
  - 产出 `mergedViews`
  - 取第一个视图的 `view_flow` 写入 `productViewFlow`
  - 取第一个视图作为默认激活视图
- 到这里，系统已经知道“当前产品属于什么流程”

## 第三层：多视图初始化

- `page-bootstrap.js` 会调用 `window.pwcaEnsureMultiViewInitialization(store)`
- 真正的多视图初始化在 `multi-view-init.js`
- 它会：
  - 创建每个视图的容器和三层画布
  - 计算每个视图的画布尺寸
  - 初始化 `baseCanvas`
  - 初始化 `mainCanvas`
  - 初始化 `overlayCanvas`
  - 按图层名把图层分发到不同 canvas
  - 按 `view_flow` 执行专用逻辑

## 第四层：初始化完成后的联动

- 初始化完成后会触发 `multiViewInitComplete`
- 这个事件会被后续模块消费：
  - `header-controls.js` 启动 `useRefHistory`
  - 其他模块可把它当成“画布已可用”的边界事件
- 后续还会进入：
  - 视图切换
  - 图层交互
  - 状态恢复
  - 导出与预览

## 当前平面流程怎么走

### 识别方式

- 只要 `view.view_flow !== '4-Grid Flow'`，当前逻辑基本都按平面流程处理

### 初始化特点

- `initializeMultiLayerCanvases(view, store)` 默认取第一层作为尺寸参考层
- 所有图层会根据名字路由到：
  - `baseCanvas-{view.id}`
  - `mainCanvas-{view.id}`
  - `overlayCanvas-{view.id}`
- 初始化结束后会调用 `clearContentAreaClip(view.id)`
- 也就是普通平面流程默认不走主画布裁剪

### 交互特点

- 打印区域校验走正常打印区域边界
- 颜色应用可以直接作用到 `base_layer`
- 图片上传和对象移动按普通视图规则处理
- 预览导出直接抓当前视图画布

## 当前 `4-Grid Flow` 怎么走

### 识别方式

- 多处都是直接判断：
  - `view.view_flow === '4-Grid Flow'`
  - 或回退到 `store.getProductViewFlow() === '4-Grid Flow'`

### 初始化特点

- `initializeMultiLayerCanvases(view, store)` 会优先找 `4-Grid Layer` 作为尺寸参考层
- `getTargetCanvasIdForLayer(layer, view)` 里有几个特殊规则：
  - `Background Layer` 在 `4-Grid Flow` 下直接返回 `null`，不会进任何 Fabric canvas
  - `Base Layer` / `4-Grid Layer` 进 `baseCanvas`
  - `Overlay Layer` 进 `overlayCanvas`
  - 其它默认进 `mainCanvas`
- 视图初始化完成后不会清理裁剪，而是执行 `handleFourGridContentArea(view)`

### `handleFourGridContentArea(view)` 做了什么

- 从 `view.data.layer_config.layers` 里找内容区域参考层
- 查找顺序是：
  - `Content Area Layer`
  - `Mapping Layer`
  - `FlexiCurve Layer`
  - `Base Layer`
- 然后把这个参考层重新渲染到 `baseCanvas`
- 再基于这个对象的边界，给 `mainCanvas` 设置 `clipPath`
- 这样用户真正可编辑的主画布就被限制在内容区域内

### 交互特点

- `print-area-validator.js` 对 `4-Grid Flow` 不再使用印刷区域矩形，而是直接用整个画布边界做校验
- `operation-panel-colors.js` 里对 `4-Grid Flow` 直接跳过普通底图染色逻辑
- `tab-image.js` 对当前视图是否为 `4-Grid Flow` 有单独判断
- `grid-preview.js` 会调用 `generate4GridImagesForView(view)`，生成四宫格视角图，而不是简单截当前画布

## 当前流程分支的真实落点

如果你要理解“当前系统到底在哪里按流程分叉”，优先看下面这些点：

- 数据层分叉：
  - `stores/product-data-mapper.js`
  - 这里把后端 `view_flow` 带进前端状态
- 初始化层分叉：
  - `canvas/multi-view-init.js`
  - 这里决定画布尺寸参考层、图层路由、内容区域裁剪
- 校验层分叉：
  - `design/utils/print-area-validator.js`
  - 这里决定对象拖拽检测边界怎么计算
- 交互层分叉：
  - `main/tab-image.js`
  - `main/operation-panel-colors.js`
- 预览导出层分叉：
  - `main/grid-preview.js`
  - `main/universal-preview.js`

## 后面如果要加别的流程，应该怎么加

不要只在某个文件里追加一个 `if (view.view_flow === 'xxx')` 就结束。新流程至少要补下面 5 步。

### 第 1 步：先确定流程标识

- 后端必须稳定返回新的 `view_flow`
- 前端不要写多个临时别名
- 先确定一个唯一值，例如：
  - `Cylinder Flow`
  - `Wrap Flow`
  - `Sticker Flow`

### 第 2 步：让 store 能稳定拿到这个流程

- 确认 `productData.templates.views[].view_flow` 已经存在
- 确认 `pwcaBuildViewsFromProductData()` 不会把它丢掉
- 确认 `setViewsFromProductData()` 会把 `productViewFlow` 写入 store

### 第 3 步：在 `multi-view-init.js` 增加流程初始化分发

当前代码是散落的 `if (view.view_flow === '4-Grid Flow')`。如果后续流程增多，建议先收口成统一分发函数，例如：

```js
function pwcaResolveViewFlow(view, store) {
    return (
        (view && view.view_flow) ||
        (view && view.data && view.data.view_flow) ||
        (store && typeof store.getProductViewFlow === 'function' ? store.getProductViewFlow() : null) ||
        'Flat Flow'
    );
}
```

然后让初始化入口变成：

```js
const flow = pwcaResolveViewFlow(view, store);

switch (flow) {
    case '4-Grid Flow':
        await handleFourGridInitialization(view, store);
        break;
    case 'Cylinder Flow':
        await handleCylinderInitialization(view, store);
        break;
    default:
        await handleFlatInitialization(view, store);
        break;
}
```

当前项目还没彻底做成这种注册式结构，但后面新流程建议按这个方向收口。

### 第 4 步：补齐流程相关的交互规则

新增流程后，至少检查这些文件是否需要加分支：

- `design/utils/print-area-validator.js`
  - 对象移动边界怎么算
- `main/tab-image.js`
  - 图片上传后对象落点和裁剪规则怎么算
- `main/operation-panel-colors.js`
  - 是否允许底图染色
- `main/grid-preview.js` 或其他预览文件
  - 预览图如何生成

### 第 5 步：补齐导出与恢复逻辑

如果新流程会改变画布结构，还要确认：

- 状态保存是否仍然只保存 `mainCanvas`
- 状态恢复后是否需要重新套裁剪
- 预览和导出是否需要重新拼图
- 编辑购物车回填时是否需要特殊处理

## 新流程接入建议

如果后面流程会越来越多，建议把现在分散的判断逐步收口成下面三类 helper。

### 1. 统一流程识别

- 新增一个公共 helper，例如：
  - `pwcaResolveViewFlow(view, store)`

### 2. 统一流程能力判断

- 不要 everywhere 直接写字符串比较
- 建议抽成：
  - `pwcaIsFourGridFlow(view, store)`
  - `pwcaUsesCanvasClip(view, store)`
  - `pwcaUsesWholeCanvasValidation(view, store)`
  - `pwcaRequiresGridPreview(view, store)`

### 3. 统一流程初始化入口

- 当前 `initializeMultiLayerCanvases()` 里已经混合了：
  - 通用空画布初始化
  - 图层分发
  - 4 格图裁剪处理
- 后面可拆成：
  - 通用初始化
  - 流程专用初始化
  - 初始化后修正

## `4-Grid Flow` 初始化流程有问题时，优先怎么查

排查顺序建议固定，不要一开始就改预览或改颜色逻辑。

### 第 1 类：数据是否对

- 看接口返回里这个视图的 `view_flow` 是否真的是 `4-Grid Flow`
- 看 `view.data.layer_config.layers` 是否真的包含这些层：
  - `4-Grid Layer`
  - `Content Area Layer`
  - `Mapping Layer`
  - `FlexiCurve Layer`
  - `Base Layer`
- 如果这些层缺失或命名不一致，前端现有逻辑会直接走错分支

### 第 2 类：尺寸参考层是否选对

- 当前代码优先拿 `4-Grid Layer` 做画布尺寸参考
- 如果你的产品其实没有这个层，或者这个层尺寸不对，就会出现：
  - 画布尺寸错误
  - 裁剪区域偏移
  - 拖拽区域不对
- 这类问题优先改：
  - `initializeMultiLayerCanvases()` 里 `targetLayer` 的选择规则

### 第 3 类：内容区域参考层是否选对

- 当前 `handleFourGridContentArea(view)` 会按固定顺序找参考层
- 如果你实际要裁剪的不是这些层，而是别的层，就会出现：
  - clipPath 错位
  - 只能编辑一小块
  - 根本不能编辑
- 这类问题优先改：
  - `handleFourGridContentArea(view)` 里 `contentAreaLayer` 的查找顺序

### 第 4 类：图层是不是被错误跳过了

- 当前 `Background Layer` 在 `4-Grid Flow` 下被明确跳过
- 如果某个产品的背景层实际上需要参与 Fabric 渲染，就会出现：
  - 视觉上少一层
  - 导出与页面显示不一致
- 这类问题优先改：
  - `getTargetCanvasIdForLayer(layer, view)` 的路由规则

### 第 5 类：交互校验是否还沿用旧规则

- 当前 `4-Grid Flow` 的拖拽校验直接按整画布边界
- 如果你的 4 格图实际上仍然要按局部区域校验，就会出现：
  - 对象能拖到不该去的位置
  - 自动居中逻辑看起来很奇怪
- 这类问题优先改：
  - `print-area-validator.js` 里 `isFourGrid` 分支

## `4-Grid Flow` 初始化流程出问题时，应该怎么改

下面给出按问题类型的修改建议。

### 场景 1：4 格图画布尺寸不对

优先改：

- `initializeMultiLayerCanvases(view, store)`
- `createViewContainers(views, store)`

修改原则：

- 尺寸参考层必须和真实内容区域一致
- 不要一处用 `4-Grid Layer`，另一处用 `Background Layer`
- 画布尺寸参考逻辑要在两个函数里保持一致

### 场景 2：4 格图可编辑区域错位

优先改：

- `handleFourGridContentArea(view)`
- `applyContentAreaClip(canvas, referenceObject)`

修改原则：

- 先确认参考层是谁
- 再确认 `referenceObject.getBoundingRect(true, true)` 得到的是不是你想要的区域
- 如果参考层本身位置、缩放、锚点有偏差，先修参考层创建逻辑，不要只调 clip

### 场景 3：4 格图对象能拖出区域，或被强行拉回的行为不对

优先改：

- `design/utils/print-area-validator.js`

修改原则：

- 先确认这个流程应该按整画布还是按局部区域校验
- 如果还是要按局部区域，不能继续复用现在的 `isFourGrid -> whole canvas bounds` 逻辑
- 可以为该流程单独返回一套 bounds

### 场景 4：4 格图页面显示正常，但预览 / 导出错

优先改：

- `main/grid-preview.js`
- `main/universal-preview.js`

修改原则：

- 页面渲染和导出渲染不是同一套逻辑
- 页面正常不代表导出正常
- 如果四宫格图是拼图逻辑，导出层也要同步理解这个流程

### 场景 5：4 格图初始化偶发失败或顺序错乱

优先改：

- `page-bootstrap.js`
- `multi-view-init.js`

修改原则：

- 先看是否在 `multiViewInitComplete` 前就触发了依赖逻辑
- 先看 `pwcaEnsureMultiViewInitialization(store)` 是否超时
- 先看图片图层是否被 `PWCA_IMAGE_LAYER_LOAD_TIMEOUT_MS` 跳过
- 不要先改 UI 组件，先确保底层初始化 Promise 正常完成

## 当前 `4-Grid Flow` 最容易踩坑的点

- 过度依赖图层名字
  - 只要后端换名，前端流程马上失效
- 流程判断分散
  - 现在很多文件直接写 `view.view_flow === '4-Grid Flow'`
- 同一个流程在多个层面分别分叉
  - 初始化
  - 校验
  - 染色
  - 上传
  - 预览
- 页面显示逻辑和预览导出逻辑不是同一套
  - 改了一处后，另一处可能还没同步

## 建议的后续重构方向

- 先新增统一 helper：
  - `pwcaResolveViewFlow`
  - `pwcaIsFourGridFlow`
- 再把分散在多个文件里的字符串判断逐步替换掉
- 再把 `multi-view-init.js` 中的流程专用逻辑拆成独立函数
- 当新增第 3 种流程时，建议直接引入“流程处理器”结构，不再继续堆 `if/else`

## 最小接入清单

后面新增一个新流程时，至少检查下面这些点有没有同步：

- 后端 `view_flow` 已输出
- `product-data-mapper.js` 已保留该字段
- `stores/index.js` 已写入 `productViewFlow`
- `multi-view-init.js` 已新增初始化分支
- `print-area-validator.js` 已新增边界规则
- `tab-image.js` 已新增上传 / 初始落点规则
- `operation-panel-colors.js` 已新增颜色策略
- `grid-preview.js` / `universal-preview.js` 已新增预览导出策略

## 结论

- 当前设计页“用 VueUse 管理加载流程”这句话并不完全准确
- 更准确地说是：
  - VueUse 参与了启动队列、状态持久化、历史管理
  - 设计页加载流程本身由 `page-bootstrap.js + store + multi-view-init.js` 共同管理
- 当前平面流程和 `4-Grid Flow` 的主要差异，集中在：
  - 画布尺寸参考层
  - 图层路由
  - 内容区域裁剪
  - 拖拽校验边界
  - 预览导出策略
- 后面如果要加新流程，建议从“统一流程识别 + 初始化分发 + 交互能力判断”这三层开始收口
