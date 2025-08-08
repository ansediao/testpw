# 多视图导出PDF逻辑

## 概述

本文档详细说明了 `pw-canvas` 项目中多视图导出PDF功能的实现逻辑和工作流程。

## 核心函数

### `generateMultiViewPDF()` - 多视图PDF生成函数

**位置：** `template-canvas-display.php`

**功能：** 遍历所有视图，逐一切换并捕获每个视图的画布内容，生成包含封面和多页面的完整PDF文档。

## 工作流程

### 1. 初始化阶段

```javascript
// 获取当前激活视图ID，用于最后恢复
const originalActiveViewId = designStore.activeViewId;

// 获取所有视图列表
const allViews = designStore.views;

// 创建PDF文档实例
const { jsPDF } = window.jspdf;
const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
});

// 获取产品信息
const productName = document.querySelector('input[name="product_name"]')?.value || 'Unknown Product';
const currentTime = new Date().toLocaleString();
```

### 2. 封面页生成

```javascript
// 添加封面页
pdf.setFontSize(24);
pdf.text('Multi-View Preview', 105, 50, { align: 'center' });

pdf.setFontSize(16);
pdf.text(`Product: ${productName}`, 105, 80, { align: 'center' });
pdf.text(`Total Views: ${allViews.length}`, 105, 100, { align: 'center' });

pdf.setFontSize(12);
pdf.text(`Generated: ${currentTime}`, 105, 120, { align: 'center' });
```

**封面页内容：**
- **标题**：Multi-View Preview
- **产品名称**：从表单获取的产品名
- **视图总数**：当前项目的视图数量
- **生成时间**：PDF创建的时间戳

### 3. 视图遍历与处理

对每个视图执行以下步骤：

#### 3.1 添加新页面
```javascript
if (index > 0 || true) { // 封面后的所有页面
    pdf.addPage();
}
```

#### 3.2 视图切换逻辑

**手动DOM操作：**
```javascript
// 隐藏所有视图容器
document.querySelectorAll('.view-container').forEach(container => {
    container.style.display = 'none';
});

// 显示目标视图容器
const targetContainer = document.querySelector(`#view-${view.id}`);
if (targetContainer) {
    targetContainer.style.display = 'block';
}
```

**更新全局Canvas引用：**
```javascript
const canvasInstance = designStore.canvases[view.id];
if (canvasInstance) {
    window.canvas = canvasInstance;
}
```

**清理选中状态：**
```javascript
Object.values(designStore.canvases).forEach(canvasInstance => {
    if (canvasInstance && canvasInstance.discardActiveObject) {
        canvasInstance.discardActiveObject();
        canvasInstance.renderAll();
    }
});
```

#### 3.3 等待渲染完成
```javascript
// 等待视图切换和渲染完成
await new Promise(resolve => setTimeout(resolve, 500));
```

### 4. 图像捕获与处理

#### 4.1 捕获画布内容
```javascript
const imageDataUrl = await captureCanvas(false);
if (!imageDataUrl) {
    throw new Error('图像数据为空');
}
```

#### 4.2 图像尺寸计算

**A4页面规格：**
- 宽度：210mm
- 高度：297mm
- 可用区域：考虑边距后的实际可用空间

```javascript
// A4页面尺寸 (mm)
const pageWidth = 210;
const pageHeight = 297;
const margin = 20;
const availableWidth = pageWidth - 2 * margin;
const availableHeight = pageHeight - 2 * margin - 30; // 预留标题空间

// 计算图像缩放比例
const imgWidth = availableWidth;
const imgHeight = (availableWidth * img.height) / img.width;

// 如果图像高度超出可用空间，按高度缩放
if (imgHeight > availableHeight) {
    imgHeight = availableHeight;
    imgWidth = (availableHeight * img.width) / img.height;
}
```

### 5. PDF页面布局

#### 5.1 页面标题
```javascript
pdf.setFontSize(16);
const viewName = view.name || `视图 ${view.id}`;
pdf.text(`View: ${viewName}`, margin, margin);
```

#### 5.2 图像添加
```javascript
// 计算图像居中位置
const imgX = (pageWidth - imgWidth) / 2;
const imgY = margin + 20; // 标题下方

// 添加图像到PDF
pdf.addImage(imageDataUrl, 'PNG', imgX, imgY, imgWidth, imgHeight);
```

#### 5.3 页码信息
```javascript
pdf.setFontSize(10);
const pageInfo = `Page ${index + 1} of ${allViews.length}`;
pdf.text(pageInfo, pageWidth - margin, pageHeight - 10, { align: 'right' });
```

### 6. 最后一页特殊处理

```javascript
if (index === allViews.length - 1) {
    // 在最后一页添加生成时间
    pdf.setFontSize(10);
    pdf.text(`Generated: ${currentTime}`, margin, pageHeight - 10);
}
```

### 7. 状态恢复

```javascript
// 恢复到原始激活视图
if (originalActiveViewId) {
    // 隐藏所有视图容器
    document.querySelectorAll('.view-container').forEach(container => {
        container.style.display = 'none';
    });
    
    // 显示原始视图容器
    const originalContainer = document.querySelector(`#view-${originalActiveViewId}`);
    if (originalContainer) {
        originalContainer.style.display = 'block';
    }
    
    // 恢复全局canvas引用
    const originalCanvas = designStore.canvases[originalActiveViewId];
    if (originalCanvas) {
        window.canvas = originalCanvas;
    }
}
```

### 8. PDF保存

```javascript
// 生成文件名
const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
const filename = `${productName}_多视图规格书_${timestamp}.pdf`;

// 保存PDF
pdf.save(filename);
```

## 触发机制

### 1. 按钮事件监听

**位置：** `template-canvas-display.php`

```javascript
document.getElementById('generatePdfBtn').addEventListener('click', function() {
    if (document.querySelector('.preview-canvas-container')) {
        // 单视图模式 - 使用原有逻辑
        generateSingleViewPDF();
    } else {
        // 多视图模式 - 使用新逻辑
        generateMultiViewPDF();
    }
});
```

### 2. 模式检测逻辑

**单视图模式特征：**
- 存在 `.preview-canvas-container` 元素
- 使用原有的PDF生成逻辑
- 生成单页PDF

**多视图模式特征：**
- 不存在 `.preview-canvas-container` 元素
- 使用新的多视图PDF生成逻辑
- 生成多页PDF

## PDF文档结构

### 完整PDF结构示例

```
📄 产品名_多视图规格书_2024-01-15T10-30-00.pdf
├── 第1页：封面页
│   ├── Multi-View Preview (标题)
│   ├── Product: [产品名称]
│   ├── Total Views: [视图数量]
│   └── Generated: [生成时间]
│
├── 第2页：视图1
│   ├── View: [视图1名称] (页面标题)
│   ├── [视图1图像内容] (居中显示)
│   └── Page 1 of N (页码)
│
├── 第3页：视图2
│   ├── View: [视图2名称]
│   ├── [视图2图像内容]
│   └── Page 2 of N
│
├── ...
│
└── 第N+1页：最后视图
    ├── View: [最后视图名称]
    ├── [最后视图图像内容]
    ├── Page N of N (页码)
    └── Generated: [生成时间] (底部时间戳)
```

## 错误处理

### 1. 视图切换失败
```javascript
if (!targetContainer) {
    console.warn(`视图容器未找到: view-${view.id}`);
    continue; // 跳过当前视图，继续处理下一个
}
```

### 2. Canvas实例缺失
```javascript
if (!canvasInstance) {
    console.warn(`Canvas实例未找到: ${view.id}`);
    continue;
}
```

### 3. 图像捕获失败
```javascript
try {
    const imageDataUrl = await captureCanvas(false);
    if (!imageDataUrl) {
        throw new Error('图像数据为空');
    }
} catch (error) {
    console.error(`捕获视图 ${view.id} 失败:`, error);
    
    // 在PDF中添加错误页面
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.text(`View: ${view.name || view.id}`, margin, margin);
    pdf.setFontSize(12);
    pdf.text('Error: Failed to capture view', margin, margin + 20);
    pdf.text(`Details: ${error.message}`, margin, margin + 35);
    
    continue;
}
```

### 4. PDF生成失败
```javascript
try {
    await generateMultiViewPDF();
    console.log('多视图PDF生成成功');
} catch (error) {
    console.error('PDF生成失败:', error);
    alert('PDF生成失败，请检查控制台获取详细信息');
}
```

## 性能优化

### 1. 内存管理
```javascript
// 及时释放图像对象
img.onload = function() {
    // 处理图像...
    img = null; // 释放引用
};
```

### 2. 批量操作
- 一次性处理所有DOM操作
- 避免频繁的重排和重绘

### 3. 异步处理
- 使用 `async/await` 确保操作顺序
- 适当的延迟等待渲染完成

### 4. 进度反馈
```javascript
console.log(`正在处理视图 ${index + 1}/${allViews.length}: ${view.name || view.id}`);
```

## 依赖关系

### 1. 外部库
- **jsPDF**：PDF生成核心库
- **Fabric.js**：画布操作库

### 2. Pinia Store
- `designStore.activeViewId` - 当前激活视图
- `designStore.views` - 所有视图列表
- `designStore.canvases` - Canvas实例映射

### 3. DOM 元素
- `.view-container` - 视图容器
- `#view-{id}` - 特定视图容器
- `#generatePdfBtn` - PDF生成按钮
- `input[name="product_name"]` - 产品名称输入框

### 4. 核心函数
- `captureCanvas()` - 图像捕获函数
- `getActiveCanvasElements()` - 获取画布元素
- `getActiveCanvas()` - 获取Fabric.js实例

## 配置参数

### 1. PDF设置
```javascript
const pdfConfig = {
    orientation: 'portrait',  // 纵向
    unit: 'mm',              // 毫米单位
    format: 'a4'             // A4格式
};
```

### 2. 页面布局
```javascript
const layoutConfig = {
    pageWidth: 210,          // A4宽度
    pageHeight: 297,         // A4高度
    margin: 20,              // 页边距
    titleSpace: 30,          // 标题预留空间
    footerSpace: 20          // 页脚预留空间
};
```

### 3. 字体设置
```javascript
const fontConfig = {
    titleSize: 24,           // 封面标题字号
    subtitleSize: 16,        // 副标题字号
    bodySize: 12,            // 正文字号
    footerSize: 10           // 页脚字号
};
```

## 扩展性

该架构支持以下扩展：

### 1. 自定义PDF模板
- 支持不同的页面布局
- 自定义封面设计
- 添加公司Logo和水印

### 2. 导出配置
- 支持不同纸张尺寸（A3、A5等）
- 横向/纵向选择
- 图像质量设置

### 3. 批量处理优化
- 并行图像处理
- 进度条显示
- 取消操作支持

### 4. 高级功能
- 目录页生成
- 页眉页脚自定义
- 多语言支持
- 数字签名

## 注意事项

1. **内存使用**：大量视图时注意内存管理
2. **异步操作**：确保所有异步操作正确完成
3. **错误恢复**：单个视图失败不应影响整个PDF生成
4. **状态保持**：完成后必须恢复用户的工作状态
5. **文件命名**：避免特殊字符导致的文件名问题
6. **浏览器兼容**：确保在不同浏览器中正常工作

## 调试信息

### 控制台输出示例
```
开始生成多视图PDF...
正在处理视图 1/3: 正面视图
正在处理视图 2/3: 背面视图
正在处理视图 3/3: 侧面视图
恢复到原始视图: view-1
多视图PDF生成完成: 产品名_多视图规格书_2024-01-15T10-30-00.pdf
```

### 错误日志示例
```
警告: 视图容器未找到: view-999
错误: 捕获视图 view-2 失败: Canvas实例未初始化
```