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
**位置**: `public/js/main/layers-sync.js`

**函数**: `controlMaskCanvasFromMain(objectId)`

**触发条件**:
- 图层选择变化时
- 分组状态改变时

**显示规则**:
- 当选中的图层属于分组时：显示遮罩 (`display: block`)
- 当选中的图层不属于分组时：隐藏遮罩 (`display: none`)

**与clipPath的协调**:
- 分组遮罩控制主要影响maskCanvas的显示/隐藏
- clipPath功能独立运行，不受分组状态影响
- 两个功能可以同时工作，提供不同层次的视觉限制

### 2. 图层面板控制
**位置**: `public/js/design/components/layers.js:1173-1185`

**函数**: `controlMaskCanvasVisibility(layerId)`

**调用场景**:
- 图层选择时 (line 985)
- 图层取消选择时 (line 1100)
- 分组分配时 (line 1437)
- 图层操作时 (line 1482, 1781)

### 3. Fabric.js clipPath 功能
**位置**: `public/js/main/layers-sync.js`

**函数**: `controlMainWrapperDisplayArea()`

**功能概述**:
使用Fabric.js的clipPath功能替代CSS clip-path，实现更精确的画布内容裁剪控制。

**实现原理**:
1. 从maskCanvas获取printAreaMask对象
2. 解析mask路径数据，提取中心矩形区域坐标
3. 创建Fabric.js矩形对象作为clipPath
4. 应用到mainCanvas实现裁剪效果

**核心代码逻辑**:
```javascript
// 获取当前视图的maskCanvas
const maskCanvas = window.CanvasManager.getCanvas(`maskCanvas-${viewId}`);
if (!maskCanvas) return;

// 查找printAreaMask对象
const printAreaMask = maskCanvas.getObjects().find(obj => obj.name === 'printAreaMask');
if (!printAreaMask || !printAreaMask.path) return;

// 解析路径数据，提取中心矩形坐标
const pathData = printAreaMask.path;
let secondMIndex = -1;
let mCount = 0;

// 查找第二个'M'命令（内部矩形起点）
for (let i = 0; i < pathData.length; i++) {
    if (pathData[i][0] === 'M') {
        mCount++;
        if (mCount === 2) {
            secondMIndex = i;
            break;
        }
    }
}

if (secondMIndex === -1) return;

// 收集内部矩形的所有坐标点
const coordinates = [];
coordinates.push([pathData[secondMIndex][1], pathData[secondMIndex][2]]);

for (let i = secondMIndex + 1; i < pathData.length; i++) {
    if (pathData[i][0] === 'L') {
        coordinates.push([pathData[i][1], pathData[i][2]]);
    } else if (pathData[i][0] === 'Z') {
        break;
    }
}

// 计算边界坐标
const xCoords = coordinates.map(coord => coord[0]);
const yCoords = coordinates.map(coord => coord[1]);
const left = Math.min(...xCoords);
const top = Math.min(...yCoords);
const right = Math.max(...xCoords);
const bottom = Math.max(...yCoords);
const width = right - left;
const height = bottom - top;

// 创建并应用clipPath
if (width > 0 && height > 0) {
    const clipRect = new fabric.Rect({
        left: left,
        top: top,
        width: width,
        height: height,
        absolutePositioned: true
    });
    
    mainCanvas.clipPath = clipRect;
    mainCanvas.renderAll();
}
```

**触发条件**:
- 图层选择状态变化
- 无选中对象时：应用clipPath限制显示范围
- 有选中对象时：移除clipPath限制

**技术优势**:
- **精确性**: 直接使用mask数据，避免坐标转换误差
- **一致性**: 与mask显示效果完全一致
- **性能**: Fabric.js原生支持，渲染效率更高
- **灵活性**: 支持复杂路径和动态调整

## 图像合成逻辑

### 1. 多层Canvas合成
**位置**: `public/js/main/capture.js`

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
**位置**: `public/js/main/capture.js`

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

### 2. clipPath功能测试
```javascript
// 检查clipPath状态
const viewId = window.useCanvasStore().activeViewId;
const mainCanvas = window.CanvasManager.getCanvas(`mainCanvas-${viewId}`);
console.log('当前clipPath:', mainCanvas.clipPath);

// 手动触发clipPath控制
window.controlMainWrapperDisplayArea();

// 检查mask路径数据解析
const maskCanvas = window.CanvasManager.getCanvas(`maskCanvas-${viewId}`);
const printAreaMask = maskCanvas.getObjects().find(obj => obj.name === 'printAreaMask');
console.log('Mask路径数据:', printAreaMask.path);

// 测试路径解析逻辑
const pathData = printAreaMask.path;
let secondMIndex = -1;
let mCount = 0;
for (let i = 0; i < pathData.length; i++) {
    if (pathData[i][0] === 'M') {
        mCount++;
        if (mCount === 2) {
            secondMIndex = i;
            break;
        }
    }
}
console.log('第二个M命令索引:', secondMIndex);
console.log('内部矩形起点:', pathData[secondMIndex]);

// 手动移除clipPath
mainCanvas.clipPath = null;
mainCanvas.renderAll();
console.log('已移除clipPath');

// 手动应用clipPath（示例）
const clipRect = new fabric.Rect({
    left: 100,
    top: 100,
    width: 200,
    height: 200,
    absolutePositioned: true
});
mainCanvas.clipPath = clipRect;
mainCanvas.renderAll();
console.log('已应用测试clipPath');
```

### 3. 常见问题

**遮罩相关问题**:
- 遮罩不显示：检查分组状态和DOM元素存在性
- 遮罩位置错误：检查打印区域尺寸获取
- 合成效果异常：检查Canvas图层顺序和遮罩内容

**clipPath相关问题**:
- clipPath不生效：检查mainCanvas实例是否存在，maskCanvas是否正确初始化
- 裁剪区域计算错误：验证mask路径数据解析逻辑，确认第二个'M'命令位置
- 坐标解析返回NaN：检查路径数据格式，确认L命令坐标数据完整性
- clipPath尺寸为0：验证计算出的width和height值，检查坐标边界计算
- 裁剪效果与预期不符：对比mask显示区域与clipPath区域，检查absolutePositioned设置

**调试步骤**:
1. 确认CanvasManager正确加载：`window.CanvasManager`
2. 检查Canvas实例存在：`window.CanvasManager.getCanvas('canvasId')`
3. 验证mask对象：`maskCanvas.getObjects().find(obj => obj.name === 'printAreaMask')`
4. 查看路径数据：`printAreaMask.path`
5. 测试解析逻辑：运行路径解析代码片段
6. 验证clipPath应用：`mainCanvas.clipPath`

## 相关文件
- `public/partials/canvas-design_area.php` - 遮罩初始化和DOM结构
- `public/js/main/layers-sync.js` - 遮罩控制、clipPath 实现
- `public/js/main/capture.js` - 多层画布合成与截图逻辑
- `public/js/design/components/layers.js` - 图层面板遮罩控制
- `public/js/stores/canvas-store.js` - 状态管理支持
- `public/js/canvas-manager.js` - Canvas实例管理，支持clipPath功能