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

- `4-Grid Flow` 当前固定输出 5 张图
- 第 1 张图：`4-Grid Print`（印刷排版图）
- 第 2~5 张图：四方向效果图
  - 第 2 张：`正视图`（Front View）— 分区 2+3
  - 第 3 张：`右视图`（Right View）— 分区 3+4
  - 第 4 张：`左视图`（Left View）— 分区 1+2
  - 第 5 张：`后视图`（Back View）— 分区 4+1（拼接）

### 2.1 enabled 字段 — 控制每张图的显示/隐藏

每个 `previewImageConfigs` 配置项都有一个 `enabled` 字段：

- `enabled: true` — 该图正常生成并显示在预览弹窗中（默认）
- `enabled: false` — 跳过该图，不生成、不在弹窗中显示

过滤逻辑位于：
- `grid-preview.js` 的 `generate4GridImagesForView()`：生成前过滤掉 `enabled === false` 的配置
- `universal-preview.js` 的 `showUniversalViewPreview()`：提取标签列表时同步过滤

若所有配置都被禁用（`enabled` 全为 `false`），则降级为普通截图模式 `captureViewImage(view)`。

示例：只想显示四方向效果图而不显示印刷排版图：

```js
{
  key: 'print-sheet',
  label: '4-Grid Print',
  enabled: false,   // ← 隐藏印刷排版图
  ...
}
```

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

### 4. 四方向效果图规则（正/右/左/后视图）

4-Grid Flow 的画布被等分为 4 个分区（从左到右 1~4）。四张效果图分别对应不同的两分区组合：

- 模式：`gridMockup`
- 尺寸参考层：`Background Layer`
- 目标尺寸：读取 `Background Layer.layer_data.dimensions.layerSize`
- 每张图按 mockup 思路重组：
  - `Background Layer`
  - `Base Layer`
  - `Overlay Layer`
  - active canvas 的裁切区域
- 不要直接复用当前 capture 结果再缩放，因为 4-Grid Flow 初始化时本来会跳过部分辅助层，直接复用会丢背景/底色/高光

画布分区与视图对应关系：

```
|  1  |  2  |  3  |  4  |
| 左视图  | 正视图  | 右视图  |
|   后视图(4+1拼接)     |
```

#### 正视图 (Front View) — 分区 2+3

```js
{
  key: 'mockup-front',
  label: '正视图',
  enabled: true,
  mode: 'gridMockup',
  sizeReferenceLayer: 'Background Layer',
  cropConfig: { x: 0.25, y: 0, width: 0.5, height: 1 },
  backgroundLayerName: 'Background Layer',
  baseLayerName: 'Base Layer',
  overlayLayerName: 'Overlay Layer',
  mappingLayerName: 'Mapping Layer'
}
```

#### 右视图 (Right View) — 分区 3+4

```js
{
  key: 'mockup-right',
  label: '右视图',
  cropConfig: { x: 0.5, y: 0, width: 0.5, height: 1 },
  // 其余字段同正视图
}
```

#### 左视图 (Left View) — 分区 1+2

```js
{
  key: 'mockup-left',
  label: '左视图',
  cropConfig: { x: 0, y: 0, width: 0.5, height: 1 },
  // 其余字段同正视图
}
```

#### 后视图 (Back View) — 分区 4+1（拼接）

后视图较为特殊，因为分区 4 和分区 1 不连续，需要使用 `extraCrop` 机制将两个不连续的分区拼接为一张图：

```js
{
  key: 'mockup-back',
  label: '后视图',
  cropConfig: {
    x: 0.75,          // 主裁切：分区 4
    y: 0,
    width: 0.25,
    height: 1,
    extraCrop: {
      x: 0,           // 额外裁切：分区 1
      y: 0,
      width: 0.25,
      height: 1
    }
  },
  // 其余字段同正视图
}
```

`extraCrop` 的处理逻辑在 `drawCroppedCanvasRegionWithWindowEffect()` 中：
- 主裁切区域（分区4）先绘制到结果画布的左侧
- `extraCrop` 区域（分区1）绘制到结果画布的右侧
- 最终合成一张宽度为 `width + extraCrop.width` 的完整图片

### 4.1 gridMockup 模式的真实图层渲染规则

- `gridMockup` 模式中的 `Background Layer`、`Base Layer`、`Overlay Layer` 必须按各自图层配置里的真实信息绘制：
  - `layer_data.dimensions.layerSize`
  - `layer_data.position.coordinates`
  - `layer_data.position.anchorPoint`
- 不要再使用“按目标画布高度居中缩放”的简化逻辑绘制 `Base Layer` 或 `Overlay Layer`
- 如果继续复用旧的 `drawLayerImageForGrid()` / `drawLayerImageForGridWithColor()` 来直接画第二张图，会出现：
  - `Overlay Layer` 看起来比 `Base Layer` 明显更大
  - 遮罩轮廓和真实产品图层不一致
  - 裁剪后的文字/图片边缘与杯体主体错位
- 当前正确做法是：
  - 第二张图合成时，传入完整 `layer` 对象，而不是只传 `imageURL`
  - 通过图层尺寸与坐标计算 placement 后再 `drawImage`
  - 若 `Base Layer` 需要着色，也是在其真实尺寸内先生成 tinted canvas，再按真实 placement 落图

推荐实现方式：

```js
await pwcaDrawLayerForGridComposite(ctx, baseLayer, canvasWidth, canvasHeight, {
  tintColor: explicitColor,
  captureBoundary: true
});

await pwcaDrawLayerForGridComposite(ctx, overlayLayer, canvasWidth, canvasHeight);
```

### 5. 裁切规则

- `gridMockup` 的裁切区域由 `cropConfig` 控制
- 如果需要微调第二张图的位置，优先改 `cropConfig`
- 不要为了“看起来更正”去直接改第一张图的输出尺寸来源

### 5.1 效果图的两层裁切含义

- 在 `gridMockup` 模式的效果图中，设计内容通常会经历两层处理：
- 第 1 层：`cropConfig`
  - 先从 `activeCanvas` 中截取指定区域
  - 默认 `4-Grid Flow` 配置为中间半幅：`x: 0.25, width: 0.5`
- 第 2 层：`Base Layer` 轮廓遮罩
  - 裁切后的设计内容不会直接整块贴回去
  - 还会再以 `Base Layer` 的非透明区域作为 mask 执行一次 `source-in`
- 因此，“文字和图片被裁掉”不一定是 Fabric 画布问题，很多时候是第二张图预览阶段被 `cropConfig + Base Layer mask` 二次裁切

### 5.2 蒙版来源约束

- 效果图的 mask 来源应是当前 view 的 `Base Layer`
- mask 不能再按“整张目标图居中拉伸”的方式重建
- mask 必须与第二张图里已经绘制的 `Base Layer` 使用同一套尺寸、坐标与着色规则，否则会出现：
  - 文字/图片裁切边界偏移
  - 设计内容明明在杯体内，预览里却被切掉
  - `Overlay`、`Base`、设计内容三者轮廓对不齐
- 推荐做法是把 `maskLayer` 直接传入裁切函数，在函数内部按真实 layer placement 生成 mask，而不是只传一个 `baseImageUrl`

## 推荐实现方式

### 1. 新增 flow 专属输出时

1. 在 `view-flow-resolver.js` 增加/修改 `previewImageConfigs`
2. 给每张图定义：
   - `key`：唯一标识
   - `label`：弹窗缩略图显示名称
   - `enabled`：是否启用（`true`/`false`）
   - `mode`：出图模式（`layerComposite` / `gridMockup` / `capturedView`）
   - `sizeReferenceLayer`：尺寸参考图层名
   - 所需图层名或 `cropConfig`
   - 若需要拼接不连续区域，可通过 `cropConfig.extraCrop` 定义额外裁切区
3. 在 `grid-preview.js` 只补对应 `mode` 的执行器
4. 让 `showUniversalViewPreview()` 自动消费配置标签（已过滤 `enabled`）

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
- 不要在第二张图里把 `Base Layer` / `Overlay Layer` 当成普通素材图做整图居中缩放
- 不要只依赖 `imageURL` 重新生成第二张图图层，忽略原始 `layerSize` 和 `coordinates`
- 不要让 `Base Layer` 的显示逻辑和 `Base Layer` 的 mask 逻辑各走一套尺寸算法
- 不要在 `view-flow-resolver.js` 之外散落方向视图的 `cropConfig` 定义（正/右/左/后视图的 crop 必须集中在配置里）
- 不要绕过 `enabled` 字段直接过滤配置数组或硬编码跳过某些图；控制显示/隐藏应统一使用 `enabled` 字段

## 关联说明

- 如果问题是“图层坐标、bottom-left 转换、舞台尺寸来源”相关，优先结合 `pwca-layer-placement-guide`
- 如果问题是“顶部按钮、工具栏状态、控制栏 Vue 组件结构”相关，优先结合 `pwca-canvas-designer`
- 如果问题是“图片着色、tint、渐变叠色”相关，优先结合 `image-colorization`
