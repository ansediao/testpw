# Mask 逻辑说明文档

## 概述
Mask（遮罩）系统是PW Canvas中用于显示打印区域边界和处理分组图层显示的重要功能模块。主要包括打印区域遮罩显示和分组图层遮罩控制两个核心功能。

## 核心组件

### 1. DOM 结构
**位置**: `public/partials/canvas-design_area.php:649-650`
```html
<div class="canvas-wrapper" id="maskWrapper-${view.id}" style="z-index:40; pointer-events: none; display: none;">
    <canvas id="maskCanvas-${view.id}"></canvas>
</div>
```

**特点**:
- `z-index: 40` - 位于主画布之上
- `pointer-events: none` - 不响应鼠标事件
- `display: none` - 默认隐藏状态

### 2. 初始化逻辑
**位置**: `public/partials/canvas-design_area.php:880-961`

**函数**: `initializeMaskCanvas(canvasId, view, store)`

**主要功能**:
- 创建Fabric.js Canvas实例
- 获取打印区域尺寸（从printMethod store）
- 生成打印区域遮罩路径（四周半透明，中心镂空）
- 添加白色虚线描边标识打印边界

**遮罩样式**:
```javascript
const printAreaMask = new fabric.Path(maskPath, {
    fill: 'rgba(0, 0, 0, 0.5)',        // 半透明黑色遮罩
    fillRule: 'evenodd',               // 镂空填充规则
    stroke: '#ffffff',                 // 白色描边
    strokeWidth: 2,                    // 描边宽度
    strokeDashArray: [5, 5],           // 虚线样式
    selectable: false,                 // 不可选择
    evented: false,                    // 不响应事件
    excludeFromExport: true,           // 导出时排除
    name: 'printAreaMask'              // 对象名称
});
```

## 控制逻辑

### 1. 分组图层遮罩控制
**位置**: `public/js/main.js:918-943`

**函数**: `controlMaskCanvasFromMain(objectId)`

**触发条件**:
- 图层选择变化时
- 分组状态改变时

**显示规则**:
- 当选中的图层属于分组时：显示遮罩 (`display: block`)
- 当选中的图层不属于分组时：隐藏遮罩 (`display: none`)

### 2. 图层面板控制
**位置**: `public/js/design/components/layers.js:1173-1185`

**函数**: `controlMaskCanvasVisibility(layerId)`

**调用场景**:
- 图层选择时 (line 985)
- 图层取消选择时 (line 1100)
- 分组分配时 (line 1437)
- 图层操作时 (line 1482, 1781)

## 图像合成逻辑

### 1. 多层Canvas合成
**位置**: `public/js/main.js:1740-2038`

**函数**: `captureMultiLayerCanvasWithMask(canvasLayers, view)`

**合成顺序**:
1. `baseCanvas` (z-index: 10) - 基础层
2. `mainCanvas` + `maskCanvas` 遮罩处理 (z-index: 20) - 主要内容层
3. `overlayCanvas` (z-index: 30) - 覆盖层

**遮罩处理逻辑**:
```javascript
// 检查maskCanvas是否有内容
let hasContent = false;
for (let i = 3; i < maskData.data.length; i += 4) {
    if (maskData.data[i] > 0) {
        hasContent = true;
        break;
    }
}

if (hasContent) {
    // 应用遮罩效果
    tempCtx.globalCompositeOperation = 'destination-out';
    tempCtx.drawImage(binaryMaskCanvas, 0, 0);
}
```

### 2. PDF导出支持
**位置**: `public/js/main.js:1813-1838`

**函数**: `captureViewForPDF(viewId)`

**功能**: 为PDF生成提供包含遮罩效果的视图截图

## 技术特点

### 1. 性能优化
- 使用`pointer-events: none`避免事件冲突
- 默认隐藏状态减少渲染负担
- 仅在需要时显示遮罩

### 2. 响应式设计
- 动态获取打印区域尺寸
- 根据视图尺寸自适应遮罩大小
- 支持多视图独立控制

### 3. 状态管理
- 与Pinia store集成
- 实时响应图层状态变化
- 支持分组状态检测

## 调试方法

### 1. 控制台测试
```javascript
// 检查遮罩状态
const viewId = window.useCanvasStore().activeViewId;
const maskWrapper = document.getElementById(`maskWrapper-${viewId}`);
console.log('遮罩显示状态:', maskWrapper.style.display);

// 手动控制遮罩显示
window.controlMaskCanvasFromMain('layer-id');

// 检查遮罩Canvas实例
const maskCanvas = document.getElementById(`maskCanvas-${viewId}`);
console.log('遮罩Canvas实例:', maskCanvas.__fabricCanvas);
```

### 2. 常见问题
- 遮罩不显示：检查分组状态和DOM元素存在性
- 遮罩位置错误：检查打印区域尺寸获取
- 合成效果异常：检查Canvas图层顺序和遮罩内容

## 相关文件
- `public/partials/canvas-design_area.php` - 遮罩初始化和DOM结构
- `public/js/main.js` - 遮罩控制和图像合成逻辑
- `public/js/design/components/layers.js` - 图层面板遮罩控制
- `public/js/stores/canvas-store.js` - 状态管理支持