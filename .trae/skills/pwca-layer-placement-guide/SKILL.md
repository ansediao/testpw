---
name: "pwca-layer-placement-guide"
description: "PWCA 图层放置规则指南。Invoke when fixing or reviewing stage size, bottom-left to Fabric coordinate conversion, or image/text layer placement in front_canvas."
---

# PWCA Layer Placement Guide

用于规范 `modules/front_canvas/assets/js/canvas/multi-view-init.js` 中 `type: "image"` 与 `type: "text"` 的舞台放置逻辑，避免不同项目说明混入后再次把坐标系、尺寸来源或 Fabric 对象类型写错。

## 何时调用

当出现以下任一场景时应调用本 Skill：

- 用户反馈在线设计页 `image` / `text` 图层位置不对
- 需要核对舞台尺寸来源
- 需要把 Promowares `bottom-left` 数据坐标转换为 Fabric `top-left`
- 需要修改 `createFabricObjectFromLayer()`、`getCanvasDimensionsForView()` 或相关渲染逻辑
- 需要判断文本应使用 `fabric.Text` 还是 `fabric.Textbox`

## 适用文件

- `modules/front_canvas/assets/js/canvas/multi-view-init.js`
- `modules/front_canvas/assets/js/main/view-flow-resolver.js`

## 核心规则

### 1. 舞台尺寸来源

- 默认先确认当前项目的 flow 规则，不要直接照搬别的项目。
- 在当前 PWCA 项目里，舞台尺寸应通过 `getCanvasDimensionsForView()` 统一获取。
- `getCanvasDimensionsForView()` 使用 flow 对应的 `sizingReference` 图层，再读取该图层 `layer_data.dimensions.layerSize`。
- 对 `4-Grid Flow`，尺寸参考层是 `4-Grid Layer`；不是 `Background Layer`。
- 除非用户明确要求切换规则，否则不要把 `4-Grid Flow` 改成使用 `Background Layer` 决定舞台尺寸。

### 2. 图层排序

- 常规渲染顺序优先检查当前项目实现。
- 如果用户要求和外部说明完全对齐，再考虑改为 `position.zIndex.value` 升序。
- 未经确认不要擅自把项目现有 `sort_order` 全量替换掉。

### 3. 坐标系转换

- Promowares 图层数据常见为 `bottom-left` 锚点语义。
- Fabric 使用 `top-left` 坐标系。
- 当 `anchorPoint === "bottom-left"` 时，应使用：

```js
left = x;
top = canvasHeight - y - layerHeight;
originX = 'left';
originY = 'top';
```

- 不要把这种情况直接映射成 Fabric 的 `originY = 'bottom'` 再重复换算，否则容易多偏移一个对象高度。
- 如果确实存在别的锚点（如 `top-left`、`center`），才使用通用 `anchorPoint -> originX/originY` 逻辑。

### 4. image 图层放置

- 类型：`type === "image"`
- 目标尺寸取自 `layer_data.dimensions.layerSize.width/height`
- 若宽高 `<= 0`，直接跳过渲染
- 定位按 `bottom-left -> top-left` 公式换算
- 图片使用：

```js
scaleX = targetWidth / img.width;
scaleY = targetHeight / img.height;
```

- `scaleX` / `scaleY` 可以独立，属于非等比拉伸
- 图片对象通常使用 `fabric.Image`
- 不要在 `anchorPoint === "center"` 时调用 `canvas.centerObject()` 覆盖后端数据位置

### 5. text 图层放置

- 类型：`type === "text"`
- 应优先使用 `fabric.Textbox`，不是 `fabric.Text`
- `width = layer_data.dimensions.layerSize.width`
- `layerSize.height` 仅用于 `bottom-left -> top-left` 坐标换算，不直接传给 Textbox 高度
- 若 `width <= 0` 或 `height <= 0`，直接跳过渲染
- 常见属性：

```js
new fabric.Textbox(text, {
  left,
  top,
  width,
  angle,
  fontSize,
  fontFamily,
  fill,
  originX: 'left',
  originY: 'top'
});
```

### 6. 缩放与位置不要混用

- 页面缩放应只作用于舞台容器显示层，例如 `#multi-view-container { transform: scale(...) }`
- 不要为了“看起来对齐”去改 Fabric 内部对象坐标
- 页面缩放前后，Fabric 对象的 `left/top` 和新增元素坐标应保持一致

## 推荐实施步骤

1. 先确认当前 view 的 `view_flow`
2. 再确认舞台尺寸参考层
3. 读取图层的 `layerSize.width/height`
4. 若 `anchorPoint === "bottom-left"`，按画布高度执行坐标转换
5. `image` 使用 `fabric.Image + scaleX/scaleY`
6. `text` 使用 `fabric.Textbox + width`
7. 修改后检查 `multi-view-init.js` 诊断错误

## 禁止事项

- 不要把 `bottom-left` 一律转成 Fabric `originY = 'bottom'`
- 不要把文本继续用 `fabric.Text`，除非用户明确要求
- 不要在没有确认的情况下更改所有 flow 的舞台尺寸来源
- 不要为了修定位问题去改页面缩放逻辑

## 参考定位公式

```js
function getPlacement(canvasHeight, x, y, width, height, anchorPoint) {
  if (anchorPoint === 'bottom-left') {
    return {
      left: x,
      top: canvasHeight - y - height,
      originX: 'left',
      originY: 'top'
    };
  }

  return {
    left: x,
    top: y,
    originX: 'left',
    originY: 'top'
  };
}
```

## 关联说明

- 如果问题是“工具栏按钮、选中事件、右侧控制面板”相关，优先调用 `pwca-canvas-designer`
- 如果问题是“图片上色、渐变、tint/filter”相关，优先调用 `image-colorization`
- 如果问题是“图层在舞台上的坐标、尺寸、Textbox/Image 放置”相关，优先调用本 Skill
