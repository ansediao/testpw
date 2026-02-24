# Print Output System

## 功能简介

通用的打印输出系统，支持多种格式导出、价格计算、打印配置管理。适用于产品设计器、编辑器等需要打印/导出功能的项目。

## 功能特性

### 核心功能
- **多格式导出**：支持 PNG、SVG、PDF 三种主要格式
- **打印配置管理**：完整的打印配置创建、编辑、管理
- **价格计算**：8种灵活的价格计算方式
- **资源管理**：字体、剪贴画、模板等资源配置
- **尺寸转换**：厘米、英寸、像素单位转换
- **裁剪标记**：支持裁剪标记生成
- **完整参数配置**：灵活的布局、组件、工具栏配置

## 技术栈要求

- 前端：JavaScript（支持任何现代前端框架）
- 后端：任何后端语言（示例使用 PHP，可适配其他语言）
- 依赖库：
  - 前端：PDFKit.js（可选，用于 PDF 生成）
  - 后端：TCPDF 或类似的 PDF 库（可选）
  - Canvas 处理：Fabric.js 或类似库（可选）

## 安装和配置

### 基本配置参数

#### 打印配置项
```javascript
{
  "title": "打印标题",
  "description": "描述",
  "thumbnail": "缩略图",
  "active": true,
  "price_ruler": {
    "type": "multi|color|size|fixed|line|character|acreage",
    "ranges": [...]
  },
  "resources": {
    "fonts": {...},
    "cliparts": {...},
    "templates": {...}
  },
  "layout": {
    "components": [...],
    "actions": [...],
    "toolbars": [...]
  }
}
```

#### 导出参数
```javascript
{
  "format": "png|svg|pdf",
  "include_base": true,
  "full": true,
  "overflow": true,
  "size": "A4",
  "orientation": "portrait|landscape",
  "unit": "cm|inch|px",
  "cropmarks": true,
  "all_pages": true
}
```

## 使用指南

### 1. 初始化打印系统
```javascript
const PrintSystem = require('./print-system');

const printer = new PrintSystem({
  uploadPath: '/path/to/uploads',
  currency: 'USD',
  decimalSeparator: '.',
  thousandSeparator: ','
});
```

### 2. 创建打印配置
```javascript
const printingConfig = printer.createPrinting({
  title: '标准打印',
  priceRuler: {
    type: 'multi',
    ranges: [
      { min: 1, max: 5, price: 10 },
      { min: 6, max: 10, price: 8 }
    ]
  }
});
```

### 3. 导出设计
```javascript
// 前端导出
const result = await printer.export({
  canvas: designCanvas,
  format: 'pdf',
  size: 'A4',
  include_base: true
});

// 保存文件
printer.download(result, 'design.pdf');
```

## API 文档

### 核心类
- `PrintSystem`：主系统类
- `PrintingConfig`：打印配置类
- `PriceCalculator`：价格计算器类
- `Exporter`：导出器类
- `SizeConverter`：尺寸转换器类

### 核心方法

#### PrintSystem
- `createPrinting(config)`：创建打印配置
- `getPrintings()`：获取所有打印配置
- `export(options)`：导出设计
- `calculatePrice(config, design)`：计算价格
- `download(data, filename)`：下载文件

#### PrintingConfig
- `setTitle(title)`：设置标题
- `setPriceRuler(ruler)`：设置价格标尺
- `setResource(type, config)`：设置资源
- `setLayout(layout)`：设置布局
- `activate()`：激活配置
- `deactivate()`：禁用配置

#### PriceCalculator
- `calculate(type, params)`：计算价格
- `addRule(type, rule)`：添加价格规则

#### Exporter
- `exportPNG(options)`：导出 PNG
- `exportSVG(options)`：导出 SVG
- `exportPDF(options)`：导出 PDF

#### SizeConverter
- `convert(value, fromUnit, toUnit)`：转换尺寸
- `getPaperSize(format, unit)`：获取纸张尺寸

## 价格计算类型

| 类型 | 描述 |
|------|------|
| multi | 按资源数量计算（文字、剪贴画、图片、上传） |
| color | 按颜色数量计算 |
| size | 按尺寸计算（A0-A6） |
| fixed | 固定价格 |
| line | 按行数计算 |
| character | 按字符数计算 |
| acreage | 按面积计算 |

## 尺寸系统

### 纸张尺寸（单位：厘米
- A0: 84.1 × 118.9
- A1: 59.4 × 84.1
- A2: 42.0 × 59.4
- A3: 29.7 × 42.0
- A4: 21.0 × 29.7
- A5: 14.8 × 21.0
- A6: 10.5 × 14.8

### 单位转换
- 1 英寸 = 2.54 厘米
- 1 厘米 = 118.11 像素 (300 DPI)

## 示例代码

### 完整导出流程
```javascript
// 1. 初始化系统
const printer = new PrintSystem({
  dpi: 300
});

// 2. 获取设计数据
const design = {
  width: 210,
  height: 297,
  objects: [...]
};

// 3. 配置打印配置
const config = printer.getPrinting('standard');

// 4. 计算价格
const price = printer.calculatePrice(config, design);

// 5. 导出
const result = await printer.export({
  design: design,
  format: 'pdf',
  include_base: true
});

// 6. 下载
printer.download(result, 'my-design.pdf');
```

## 注意事项

1. 确保有足够的磁盘空间用于存储导出文件
2. 高分辨率导出会消耗较多内存
3. PDF 生成可能需要较长时间
4. 建议在后台处理大量导出时考虑异步处理
5. 确保所有外部资源（图片、字体）正确加载

## 扩展开发

### 自定义价格计算
```javascript
printer.registerPriceCalculator('custom', (params) => {
  return params.quantity * params.basePrice;
});
```

### 自定义导出格式
```javascript
printer.registerExporter('eps', (options) => {
  // 自定义 EPS 导出逻辑
});
```

## 目录结构

```
print-output-system/
├── index.js
├── SKILL.md
├── src/
│   ├── PrintSystem.js
│   ├── PrintingConfig.js
│   ├── PriceCalculator.js
│   ├── Exporter.js
│   ├── SizeConverter.js
│   └── constants/
│   │   ├── paperSizes.js
│   │   ├── priceTypes.js
│   │   └── units.js
│   └── utils/
│   │   ├── fileUtils.js
│   │   └── imageUtils.js
│   └── adapters/
│       ├── FabricAdapter.js
│       └── TCPDFAdapter.js
└── examples/
    ├── basic-usage.js
    ├── price-calculation.js
    └── custom-formats.js
```
