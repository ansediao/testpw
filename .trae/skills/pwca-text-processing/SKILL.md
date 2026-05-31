---
name: "pwca-text-processing"
description: "PWCA 文字处理与弯曲规则指南。Invoke when adding text objects, restoring API text layers, handling font defaults, or implementing/fixing arc/text_distort behavior."
---

# PWCA Text Processing

用于规范 `modules/front_canvas/` 中与文字对象相关的创建、恢复、工具栏控制、字体默认值和弯曲 `arc` 逻辑，避免把文字当成图片逻辑处理，或在 `fabric.Text` / `fabric.Textbox` / path 弯曲之间反复改乱。

## 何时调用

当出现以下任一场景时应调用本 Skill：

- 用户要求新增或修改在线设计器的文字功能
- 需要从产品 API / customization JSON 恢复 `type: "text"` 图层
- 需要处理 `layer_data.content.arc` 或工具栏 `text_distort`
- 需要修改字体默认值、字体下拉来源、字号默认值
- 需要修复文字对象在工具栏、图层面板、选区事件里的识别问题
- 需要判断某处应使用 `fabric.Text`、`fabric.Textbox` 还是 “Textbox + path”

## 适用文件

- `modules/front_canvas/assets/js/main/tab-text.js`
- `modules/front_canvas/assets/js/canvas/multi-view-init.js`
- `modules/front_canvas/assets/js/toolbar.js`
- `modules/front_canvas/assets/js/main/layers-sync.js`
- `modules/front_canvas/assets/js/main/events.js`
- `modules/front_canvas/assets/js/main/operation-panel-tabs.js`
- `modules/front_canvas/assets/js/design/stores/product-data-mapper.js`
- `modules/front_canvas/assets/js/design/stores/view-state-rebuild-helper.js`

## 核心规则

### 1. 新增文字默认使用 `fabric.Text` 还是 `fabric.Textbox`

- 用户通过文字输入面板新增对象时，先看当前项目已有实现，不要擅自全量替换。
- 当前项目中：
  - `tab-text.js` 的“新增文字”入口可继续沿用现有对象类型。
  - 从 API 图层恢复 `type: "text"` 时，应优先使用 `fabric.Textbox`，因为它依赖后端给定的 `width`。
- 如果问题发生在 `multi-view-init.js -> createFabricObjectFromLayer()`，默认按 `fabric.Textbox` 处理。

### 2. API 文本图层的字段映射

- 常见来源：`layer.layer_data.content`
- 至少要处理这些字段：

```js
{
  text,
  fontSize,
  fontFamily,
  fontColor,
  backgroundColor,
  opacity,
  arc
}
```

- 建议映射关系：

```js
new fabric.Textbox(text, {
  width,
  fontSize,
  fontFamily,
  fill: fontColor,
  backgroundColor,
  opacity: (opacity ?? 100) / 100
});
```

- `backgroundColor` 缺失时可回退空字符串，不要强行填黑色或白色。
- `opacity` 使用百分比语义时，要统一转成 Fabric 的 `0-1`。

### 3. 文字默认字体来源

- 店铺级默认字体和字号应优先来自店铺设置，不要在多个文件里各自硬编码。
- 当前项目已存在这条约束：
  - 字体选项来自 `google_font`
  - 默认字体来自首个可用字体
  - 默认字号来自 `font_size`
- 若店铺设置缺失，再回退插件内置默认值。
- 修改字体来源时，优先检查：
  - `product-data-mapper.js`
  - `tab-text.js`
  - `toolbar.js`

### 4. `arc` 的业务语义

- `layer_data.content.arc` 表示文字弯曲高度。
- 当前项目约定应按像素理解：
  - `arc: 80` 表示大约 `80px` 的弯曲高度
  - `arc: 0` 表示直线文字
  - 正值 / 负值代表两个方向的弯曲
- 不要再把 `arc` 改成百分比、角度或 0-1 浮点比例，除非用户明确要求。

### 5. 推荐的弯曲实现方式

- 在当前项目里，优先使用 “`fabric.Textbox` + `path`” 的方式实现弯曲。
- 只有用户明确要求逐字符拆分，或现有 path 方案无法满足时，才考虑 `group + char objects`。
- 推荐做法：

```js
const baseY = arc >= 0 ? textHeight / 2 : -textHeight / 2;
const controlY = baseY - arc;
const path = new fabric.Path(
  `M 0 ${baseY} Q ${textWidth / 2} ${controlY} ${textWidth} ${baseY}`
);

path.set({ fill: '' });
textObject.set('path', path);
textObject.set('backgroundColor', '');
textObject._arcValue = arc;
```

- `arc === 0` 时，应显式：

```js
textObject.set('path', null);
textObject._arcValue = 0;
```

### 6. 工具栏 `text_distort` 必须和 API `arc` 同源

- 工具栏的 Arc 滑块不应单独发明另一套弯曲算法。
- `toolbar.js` 中 `text_distort` 的控制逻辑应复用与 API 初始化同一套 path 计算。
- 控件默认值应优先读取当前对象的 `_arcValue`，不要每次都从 `0` 开始。
- 这样才能保证：
  - API 初始化出来的弯曲文字，工具栏打开时数值正确
  - 用户拖动滑块后，视觉效果与 API `arc` 一致

### 7. 文字对象识别要统一

- 当前项目常见判断散落在多个文件中。
- 只要是文字编辑链路，至少要兼容：

```js
obj.type === 'text' ||
obj.type === 'i-text' ||
obj.type === 'textbox'
```

- 如果项目中已经抽出 `pwcaIsTextLikeObject()`，后续优先复用该函数。
- 下列位置一旦漏掉 `textbox`，通常就会出问题：
  - `toolbar.js`
  - `layers-sync.js`
  - `events.js`
  - `operation-panel-tabs.js`
  - `view-state-rebuild-helper.js`

### 8. 图层面板与状态恢复

- 文字对象必须保留可被图层面板识别的元数据，例如：
  - `id`
  - `layerName`
  - `layerType`
- 状态恢复或从 canvas 重建图层列表时，`textbox` 应归类为 `text`。
- 不要因为弯曲实现改动，导致图层面板把文字显示成 `shape` 或 `other`。

## 推荐实施步骤

1. 先确认当前问题是“新增文字”、“API 恢复文字”还是“工具栏控制文字”
2. 确认目标对象类型是否应为 `fabric.Textbox`
3. 确认字体默认值是否来自店铺设置
4. 若涉及 `arc`，统一按 `px` 语义处理
5. 将工具栏 Arc 与 API 初始化复用同一套 path 弯曲函数
6. 检查 `text/textbox/i-text` 识别是否遗漏
7. 修改后检查相关文件诊断错误

## 常见错误

- 把 API 文本图层改成 `fabric.Text`，导致宽度和换行行为不稳定
- 只在 `toolbar.js` 做弯曲，忘了在 `multi-view-init.js` 初始化时处理 `arc`
- 新增了 `_arcValue`，但工具栏默认值仍然固定为 `0`
- 只判断 `type === 'text'`，导致 `textbox` 无法显示文字工具栏
- 把 `arc` 当成百分比做缩放，导致 `80` 不是 `80px`
- 用 `group` 弯曲文字后，没有同步修复图层类型和选中逻辑

## 禁止事项

- 不要把 `arc` 语义擅自改成比例值
- 不要在没有必要的情况下把文字拆成逐字符 `group`
- 不要让工具栏 Arc 和 API 初始化使用两套不同算法
- 不要只修 `toolbar.js` 而忽略 `multi-view-init.js`
- 不要漏掉 `textbox` 的识别分支

## 与其他 Skill 的关系

- 如果问题重点是“右侧工具栏渲染、按钮高亮、控制区切换”，优先结合 `pwca-canvas-designer`
- 如果问题重点是“API 图层坐标、锚点、尺寸换算、Textbox 放置”，优先结合 `pwca-layer-placement-guide`
- 如果问题重点是“字体默认值来自店铺设置或外部接口字段”，优先结合 `store-customization-settings-guide` 与 `external-api-guide`
