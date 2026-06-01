---
name: "pwca-render-preview-flow"
description: "PWCA 在线设计页渲染/出图流程指南。Invoke when working on renderBtn, universal preview modal, multi-view image payload, or 4-Grid Flow preview/export rules."
---

# PWCA Render Preview Flow

用于规范在线设计页从点击 `#renderBtn` 到生成预览弹窗、组装多视图图片数组、写入购物车 payload 的整条渲染/出图链路，避免再次把 4-Grid Flow 的输出数量、尺寸参考层、底图顺序或关闭回切逻辑改乱。

## 何时调用

当出现以下任一场景时应调用本 Skill：

- 用户要求修改 `#renderBtn` 点击后的出图行为
- 需要排查 `showUniversalViewPreview()`、预览弹窗关闭、缩略图切换
- 需要修改 `generateUniversalViewImages()` 或 `generate4GridImagesForView()`
- 需要调整 4-Grid Flow 的输出张数、每张图尺寸来源、底图图层、裁切规则
- 需要核对 `pw_view_images` 的 payload 结构
- 需要处理 `Design / Mockups` 顶部切换按钮与弹窗关闭之间的联动

## 适用文件

- `modules/front_canvas/assets/js/main/preview.js`
- `modules/front_canvas/assets/js/main/universal-preview.js`
- `modules/front_canvas/assets/js/main/grid-preview.js`
- `modules/front_canvas/assets/js/main/capture.js`
- `modules/front_canvas/assets/js/main/view-flow-resolver.js`
- `modules/front_canvas/assets/js/design/components/header-controls.js`
- `modules/front_canvas/assets/js/canvas/page-bootstrap.js`
- `modules/front_product/assets/js/product/api/canvasPayloadBuilder.js`

## 核心链路

### 1. 点击入口

- `#renderBtn` 的点击事件入口在 `preview.js`
- 按钮本身还绑定了 Vue 组件里的 `switchTab('viewMockup')`
- 实际渲染流程必须统一走：

```js
window.pwcaRunPreviewRenderFlow(store)
```

- 不要再新增第二套平行的 render 流程

### 2. 顶部 Design / Mockups 切换

- 顶部按钮定义在 `canvas-templates.php`
- 状态由 `header-controls.js` 的 `activeTab` 和 `switchTab()` 管理
- 当切到 `viewMockup` 时，由 `switchTab('viewMockup')` 触发预览流程
- 当预览弹窗关闭时，应回切到 `viewDesign`
- 回切不要只改 `.active` class，必须优先复用现有按钮点击或 `switchTab('viewDesign')` 逻辑

推荐做法：

```js
const designButton = document.querySelector(
  '.design-switch-btn-box .design-switch-btn[data-tab="viewDesign"]'
);

if (designButton instanceof HTMLButtonElement) {
  designButton.click();
}
```

### 3. 多视图图片生成

- 统一入口是 `grid-preview.js` 的：

```js
generateUniversalViewImages(views)
```

- 返回值规则：
  - 普通视图：返回单个 `dataURL`
  - 特殊 flow：可返回 `dataURL[]`
- 上层必须兼容两种形式，并统一包装成：

```js
{
  id,
  name,
  images: Array.isArray(imgData) ? imgData : [imgData]
}
```

### 4. 预览弹窗

- 统一使用 `showUniversalViewPreview(views)`
- 缩略图标题不要写死，应优先读取当前 flow 的配置标签
- 关闭逻辑要集中在一个 `close()` 函数里
- 关闭按钮、遮罩点击、`Escape` 都要走同一套关闭逻辑

## 4-Grid Flow 规则

### 1. 配置中心

- 4-Grid Flow 的预览/出图规则必须集中放在 `view-flow-resolver.js`
- 不要把“输出几张图、每张图怎么拼”散落在 `grid-preview.js` 多个分支里
- 当前项目使用：

```js
pwcaGetFlowPreviewImageConfigs(view)
```

- `generateUniversalViewImages()` 和预览弹窗标签都应读取同一份配置

### 2. 当前约定输出

- `4-Grid Flow` 当前固定输出 2 张图
- 第 1 张图：`4-Grid Print`
- 第 2 张图：`Product Preview`

### 3. 第一张图规则

- 模式：`layerComposite`
- 尺寸参考层：`4-Grid Layer`
- 目标尺寸：读取 `4-Grid Layer.layer_data.dimensions.layerSize`
- 底图：`4-Grid Layer`
- `4-Grid Layer` 需先画在底部，再叠加设计画布
- 设计画布当前使用整张 active canvas，而不是再次做四宫裁切

示例配置：

```js
{
  key: 'print-sheet',
  label: '4-Grid Print',
  mode: 'layerComposite',
  sizeReferenceLayer: '4-Grid Layer',
  beforeCanvasLayers: [{ name: '4-Grid Layer' }],
  canvasSource: { mode: 'full' },
  afterCanvasLayers: []
}
```

### 4. 第二张图规则

- 模式：`gridMockup`
- 尺寸参考层：`Background Layer`
- 目标尺寸：读取 `Background Layer.layer_data.dimensions.layerSize`
- 仍按 mockup 思路重组：
  - `Background Layer`
  - `Base Layer`
  - `Overlay Layer`
  - active canvas 的裁切区域
- 不要直接复用当前 capture 结果再缩放，因为 4-Grid Flow 初始化时本来会跳过部分辅助层，直接复用会丢背景/底色/高光

示例配置：

```js
{
  key: 'mockup',
  label: 'Product Preview',
  mode: 'gridMockup',
  sizeReferenceLayer: 'Background Layer',
  cropConfig: { x: 0.25, y: 0, width: 0.5, height: 1 },
  backgroundLayerName: 'Background Layer',
  baseLayerName: 'Base Layer',
  overlayLayerName: 'Overlay Layer',
  mappingLayerName: 'Mapping Layer'
}
```

### 5. 裁切规则

- `gridMockup` 的裁切区域由 `cropConfig` 控制
- 如果需要微调第二张图的位置，优先改 `cropConfig`
- 不要为了“看起来更正”去直接改第一张图的输出尺寸来源

## 推荐实现方式

### 1. 新增 flow 专属输出时

1. 在 `view-flow-resolver.js` 增加 `previewImageConfigs`
2. 给每张图定义：
   - `label`
   - `mode`
   - `sizeReferenceLayer`
   - 所需图层名或 `cropConfig`
3. 在 `grid-preview.js` 只补对应 `mode` 的执行器
4. 让 `showUniversalViewPreview()` 自动消费配置标签

### 2. 修改关闭回切行为时

1. 找 `universal-preview.js` 的 `close()`
2. 在 `close()` 里统一处理 UI 回切
3. 优先触发 `viewDesign` 按钮点击
4. 不要只做 class 切换

### 3. 修改 payload 时

1. 确认 `page-bootstrap.js` 与 `canvasPayloadBuilder.js` 都使用相同包装规则
2. 确认 `images` 永远是数组
3. 确认默认首图仍取 `viewImagesPayload[0].images[0]`

## 禁止事项

- 不要在 `preview.js`、`header-controls.js`、`grid-preview.js` 各自维护不同的出图规则
- 不要把 4-Grid Flow 的输出数量重新写死在 `generateUniversalViewImages()` 里
- 不要把预览弹窗标签写死成 `Front/Left/Right/Back`
- 不要只改按钮高亮，不触发真正的 `Design` 回切逻辑
- 不要直接使用当前已捕获的视图图像替代 `gridMockup` 的分层重组

## 关联说明

- 如果问题是“图层坐标、bottom-left 转换、舞台尺寸来源”相关，优先结合 `pwca-layer-placement-guide`
- 如果问题是“顶部按钮、工具栏状态、控制栏 Vue 组件结构”相关，优先结合 `pwca-canvas-designer`
- 如果问题是“图片着色、tint、渐变叠色”相关，优先结合 `image-colorization`
