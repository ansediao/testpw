---
name: "image-colorization"
description: "项目中图片上色与颜色替换技术指南。Invoke when user asks about image coloring, color replacement, tinting, or gradient application in the project."
---

# 图片上色技术原理

本项目实现了三种图片上色/颜色替换技术，用于产品定制时的颜色变更功能。

## 一、技术方案概览

| 技术方案 | 核心API | 适用场景 | 性能 |
|---------|---------|---------|------|
| **像素级替换** | Canvas `getImageData`/`putImageData` | 静态图片处理 | 一般 |
| **渐变覆盖层** | Fabric.js `Gradient` + `globalCompositeOperation` | 产品变色、渐变色效果 | 好 |
| **BlendColor滤镜** | Fabric.js `BlendColor` filter | 快速色调调整 | 最好 |

## 二、像素级颜色替换（纯色上色）

### 核心原理
遍历图像的每个像素，将非透明区域替换为目标颜色。

### 实现代码
```javascript
function applyColorToBaseLayer(color) {
    // 创建临时画布
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // 绘制原始图像
    tempCtx.drawImage(baseLayerImage, 0, 0);
    
    // 获取图像数据
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;
    
    // 解析目标颜色
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);
    
    // 遍历像素，替换非透明区域颜色
    for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha > 10) { // 非透明像素阈值
            data[i] = r;     // 红色通道
            data[i + 1] = g; // 绿色通道
            data[i + 2] = b; // 蓝色通道
            // 保持 alpha 通道不变
        }
    }
    
    // 将修改后的图像数据放回画布
    tempCtx.putImageData(imageData, 0, 0);
    
    // 创建新的 Fabric.js 图像对象
    fabric.Image.fromURL(tempCanvas.toDataURL(), function(fabricImg) {
        // 替换原有图层
        baseCanvas.remove(baseLayerObject);
        baseCanvas.add(fabricImg);
    });
}
```

### 技术要点
- 使用 HTML5 Canvas 的 `getImageData` 和 `putImageData` API
- 遍历每个像素点（每4个值为一组：R, G, B, A）
- 判断非透明区域（alpha > 10）
- 保持 Alpha 通道不变以保留原图透明度信息

### 相关文件
- `demos/color-application-demo/index.html`

## 三、渐变覆盖层技术（渐变色上色）

### 核心原理
使用 Fabric.js 创建渐变矩形覆盖层，通过 `globalCompositeOperation: 'source-in'` 实现智能裁剪。

### 实现代码
```javascript
function applyGradientToBaseLayer(gradientConfig) {
    // 创建渐变对象
    const coords = getLinearGradientCoords(gradientConfig.direction, imageWidth, imageHeight);
    const gradient = new fabric.Gradient({
        type: 'linear',
        gradientUnits: 'pixels',
        coords: coords,
        colorStops: [
            { offset: 0, color: gradientConfig.startColor },
            { offset: 1, color: gradientConfig.endColor }
        ]
    });
    
    // 创建渐变覆盖层矩形
    const overlayRect = new fabric.Rect({
        left: baseLayerObject.left,
        top: baseLayerObject.top,
        width: imageWidth,
        height: imageHeight,
        fill: gradient,
        globalCompositeOperation: 'source-in', // 关键：智能裁剪
        name: 'Base Gradient Overlay'
    });
    
    // 添加覆盖层
    baseCanvas.add(overlayRect);
    
    // 确保图层顺序
    baseCanvas.sendToBack(baseLayerObject);      // Base图层在底层
    baseCanvas.bringForward(overlayRect);        // 渐变覆盖层在中层
    baseCanvas.bringToFront(overlayLayerObject); // Overlay图层在顶层
}
```

### 图层架构
```
┌─────────────────────────────────────┐
│         Overlay Layer（顶层）        │  ← 产品细节图（阴影、褶皱等），保持原样
│                                     │
├─────────────────────────────────────┤
│    Base Gradient Overlay（渐变层）   │  ← 颜色/渐变覆盖层，使用 source-in 裁剪
│                                     │
├─────────────────────────────────────┤
│         Base Layer（底层）           │  ← 产品基础形状图（用于裁剪模板）
└─────────────────────────────────────┘
```

### 智能裁剪原理
- **source-in**: 新图形只在与现有图形重叠的地方绘制
- **Base Layer**: 作为裁剪模板，定义了可显示的区域范围
- **渐变覆盖层**: 设置为 'source-in' 模式，只在 Base 图层已有像素的区域显示
- **透明区域**: PNG 图片的透明部分不会显示任何颜色/渐变

### 支持的渐变方向
- `to right` - 水平从左到右
- `to left` - 水平从右到左
- `to bottom` - 垂直从上到下
- `to top` - 垂直从下到上
- `to bottom right` - 对角线左上到右下
- `to bottom left` - 对角线右上到左下
- `to top right` - 对角线左下到右上
- `to top left` - 对角线右下到左上

### 相关文件
- `demos/渐变色/index.html`
- `modules/front_canvas/assets/js/main/operation-panel-colors.js`
- `modules/front_product/assets/js/product/product-image-canvas.js`

## 四、BlendColor 滤镜技术（色调滤镜）

### 核心原理
使用 Fabric.js 内置的 `BlendColor` 滤镜对图像进行非破坏性色调调整。

### 实现代码
```javascript
function applyTintFilter(layerObject, color = '#ff0000', alpha = 1) {
    if (!layerObject || typeof layerObject.applyFilters !== 'function') {
        return;
    }
    
    // 使用 Fabric.js 的 BlendColor 滤镜
    const colorFilter = new fabric.Image.filters.BlendColor({
        color: color,
        mode: 'tint',  // 模式：tint（着色）
        alpha: alpha
    });
    
    // 应用滤镜
    layerObject.filters = [colorFilter];
    layerObject.applyFilters();
    
    if (layerObject.canvas) {
        layerObject.canvas.renderAll();
    }
}
```

### 支持的混合模式
- `tint` - 着色模式（默认）
- `multiply` - 正片叠底
- `screen` - 滤色

### 相关文件
- `modules/front_canvas/assets/js/canvas/multi-view-init.js`

## 五、控制台调试命令

```javascript
// 检查渐变色弹窗是否加载
typeof window.showGradientModal

// 检查清除函数是否可用
typeof window.clearAllGradientRects

// 应用色调滤镜
window.applyTintFilter(baseLayerObject, '#ff0000', 1)

// 手动清除渐变
window.clearAllGradientRects()

// 应用渐变色到视图
window.applyGradientToView(view, '#ff0000', '#0000ff', 'to right')
```

## 六、技术选型建议

| 场景 | 推荐方案 | 原因 |
|-----|---------|------|
| 需要精确控制每个像素 | 像素级替换 | 可针对特定颜色范围进行替换 |
| 产品变色/渐变色效果 | 渐变覆盖层 | GPU加速，实时预览，图层管理清晰 |
| 快速色调调整/预览 | BlendColor滤镜 | 性能最好，非破坏性编辑 |
| 复杂形状裁剪 | 渐变覆盖层 | source-in 自动处理透明区域 |
