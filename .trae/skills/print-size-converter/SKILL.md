---
name: "print-size-converter"
description: "实现屏幕像素与真实打印尺寸的精确转换，包括 DPI 配置、舞台尺寸计算和对象尺寸转换。适用于产品设计、打印输出等需要尺寸精确匹配的场景。"
---

# 打印尺寸转换器

## 核心原理

本 Skill 提供了一套完整的尺寸转换体系，实现屏幕像素与真实打印尺寸（厘米、英寸）之间的精确转换。基于标准 300 DPI 打印分辨率设计，同时支持自定义 DPI 配置。

## 关键常数

| 常数 | 值 | 说明 |
|------|-----|------|
| `CM_TO_PIXEL_FACTOR` | 118.095238 | 300 DPI 下 1 厘米对应的像素数 ≈ 300 / 2.54 |
| `INCH_TO_CM` | 2.54 | 1 英寸 = 2.54 厘米 |
| `DEFAULT_DPI` | 300 | 默认打印 DPI |

## 目录结构

```
print-size-converter/
├── SKILL.md
├── index.js          # JavaScript 主入口
├── lib/
│   ├── converter.js  # 核心转换函数
│   ├── stage.js      # 舞台尺寸计算
│   └── validator.js  # DPI 验证
└── examples/
    ├── basic.js      # 基础示例
    └── canvas.js     # Canvas 集成示例
```

## JavaScript 实现

### 1. 核心转换库 (lib/converter.js)

```javascript
/**
 * 打印尺寸转换器 - 核心转换模块
 */

const PrintSizeConverter = {
  DEFAULT_DPI: 300,
  CM_TO_PIXEL_FACTOR: 118.095238,
  INCH_TO_CM: 2.54,

  /**
   * 厘米转换为像素
   * @param {number} cm - 厘米数
   * @param {number} [dpi=300] - DPI 值
   * @returns {number} 像素值
   */
  cmToPixel(cm, dpi = this.DEFAULT_DPI) {
    const factor = dpi / this.DEFAULT_DPI;
    return cm * this.CM_TO_PIXEL_FACTOR * factor;
  },

  /**
   * 英寸转换为像素
   * @param {number} inch - 英寸数
   * @param {number} [dpi=300] - DPI 值
   * @returns {number} 像素值
   */
  inchToPixel(inch, dpi = this.DEFAULT_DPI) {
    return this.cmToPixel(inch * this.INCH_TO_CM, dpi);
  },

  /**
   * 像素转换为厘米
   * @param {number} pixel - 像素值
   * @param {number} [dpi=300] - DPI 值
   * @returns {number} 厘米数
   */
  pixelToCm(pixel, dpi = this.DEFAULT_DPI) {
    const factor = dpi / this.DEFAULT_DPI;
    return pixel / (this.CM_TO_PIXEL_FACTOR * factor);
  },

  /**
   * 像素转换为英寸
   * @param {number} pixel - 像素值
   * @param {number} [dpi=300] - DPI 值
   * @returns {number} 英寸数
   */
  pixelToInch(pixel, dpi = this.DEFAULT_DPI) {
    return this.pixelToCm(pixel, dpi) / this.INCH_TO_CM;
  },

  /**
   * 尺寸对象转换
   * @param {Object} size - 尺寸对象 { width, height, unit }
   * @param {string} targetUnit - 目标单位 ('px'|'cm'|'inch')
   * @param {number} [dpi=300] - DPI 值
   * @returns {Object} 转换后的尺寸
   */
  convertSize(size, targetUnit, dpi = this.DEFAULT_DPI) {
    let width = size.width;
    let height = size.height;
    const sourceUnit = size.unit || 'px';

    if (sourceUnit === targetUnit) {
      return { width, height, unit: targetUnit };
    }

    let pxWidth, pxHeight;

    if (sourceUnit === 'cm') {
      pxWidth = this.cmToPixel(width, dpi);
      pxHeight = this.cmToPixel(height, dpi);
    } else if (sourceUnit === 'inch') {
      pxWidth = this.inchToPixel(width, dpi);
      pxHeight = this.inchToPixel(height, dpi);
    } else {
      pxWidth = width;
      pxHeight = height;
    }

    let resultWidth, resultHeight;

    if (targetUnit === 'cm') {
      resultWidth = this.pixelToCm(pxWidth, dpi);
      resultHeight = this.pixelToCm(pxHeight, dpi);
    } else if (targetUnit === 'inch') {
      resultWidth = this.pixelToInch(pxWidth, dpi);
      resultHeight = this.pixelToInch(pxHeight, dpi);
    } else {
      resultWidth = pxWidth;
      resultHeight = pxHeight;
    }

    return {
      width: resultWidth,
      height: resultHeight,
      unit: targetUnit
    };
  }
};

module.exports = PrintSizeConverter;
```

### 2. 舞台尺寸计算 (lib/stage.js)

```javascript
/**
 * 舞台尺寸计算模块
 * 负责计算画布上的对象与真实打印尺寸的映射关系
 */

class StageSizeCalculator {
  /**
   * @param {Object} config - 配置
   * @param {Object} config.printSize - 打印尺寸 { width, height, unit: 'cm'|'inch' }
   * @param {number} config.stageWidth - 舞台宽度（像素）
   * @param {number} config.stageHeight - 舞台高度（像素）
   * @param {number} [config.dpi=300] - DPI 值
   * @param {string} [config.orientation='portrait'] - 方向 'portrait'|'landscape'
   */
  constructor(config) {
    this.printSize = config.printSize;
    this.stageWidth = config.stageWidth;
    this.stageHeight = config.stageHeight;
    this.dpi = config.dpi || 300;
    this.orientation = config.orientation || 'portrait';
    this.converter = require('./converter');
  }

  /**
   * 获取打印尺寸的像素值
   * @returns {Object} { width, height }
   */
  getPrintSizeInPixels() {
    return this.converter.convertSize(
      this.printSize,
      'px',
      this.dpi
    );
  }

  /**
   * 计算缩放倍率
   * 将舞台尺寸与打印尺寸进行映射
   * @param {number} limitZoneWidth - 限制区域宽度（舞台上的像素）
   * @returns {number} 缩放倍率
   */
  calculateMultiplier(limitZoneWidth) {
    const printPixels = this.getPrintSizeInPixels();
    return printPixels.width / (limitZoneWidth - 1);
  }

  /**
   * 计算 MP 值（考虑方向）
   * @param {number} limitZoneWidth - 限制区域宽度
   * @param {number} canvasWidth - Canvas 宽度
   * @param {number} canvasHeight - Canvas 高度
   * @returns {number} MP 值
   */
  calculateMP(limitZoneWidth, canvasWidth, canvasHeight) {
    const multiplier = this.calculateMultiplier(limitZoneWidth);

    if (this.orientation !== 'landscape') {
      return multiplier;
    }

    return multiplier * (canvasWidth / canvasHeight);
  }

  /**
   * 计算对象的真实打印尺寸
   * @param {Object} objSize - 对象在舞台上的尺寸 { width, height }
   * @param {number} limitZoneWidth - 限制区域宽度
   * @param {number} canvasWidth - Canvas 宽度
   * @param {number} canvasHeight - Canvas 高度
   * @param {string} [targetUnit='cm'] - 目标单位
   * @returns {Object} { width, height, unit }
   */
  calculateObjectPrintSize(
    objSize,
    limitZoneWidth,
    canvasWidth,
    canvasHeight,
    targetUnit = 'cm'
  ) {
    const mp = this.calculateMP(limitZoneWidth, canvasWidth, canvasHeight);
    const realWidthPx = objSize.width * mp;
    const realHeightPx = objSize.height * mp;

    return {
      width: this.converter.pixelToCm(realWidthPx, this.dpi),
      height: this.converter.pixelToCm(realHeightPx, this.dpi),
      unit: targetUnit
    };
  }

  /**
   * 获取格式化为两位小数的尺寸
   * @param {Object} size - 尺寸对象
   * @returns {Object} 格式化后的尺寸
   */
  formatSize(size) {
    return {
      width: Number(size.width.toFixed(2)),
      height: Number(size.height.toFixed(2)),
      unit: size.unit
    };
  }
}

module.exports = StageSizeCalculator;
```

### 3. DPI 验证器 (lib/validator.js)

```javascript
/**
 * DPI 验证模块
 * 检查图片是否满足最小/最大 DPI 要求
 */

class DPIValidator {
  /**
   * @param {Object} config - 配置
   * @param {number} [config.defaultDPI=300] - 默认 DPI
   */
  constructor(config = {}) {
    this.defaultDPI = config.defaultDPI || 300;
    this.converter = require('./converter');
  }

  /**
   * 验证图片是否满足最小 DPI 要求
   * @param {HTMLImageElement|Object} img - 图片对象
   * @param {Object} printSize - 打印尺寸 { width, height, unit }
   * @param {number} minDPI - 最小 DPI 要求
   * @returns {boolean} 是否满足要求
   */
  validateMinDPI(img, printSize, minDPI) {
    const pi = this.defaultDPI / minDPI;
    const printPixels = this.converter.convertSize(printSize, 'px', this.defaultDPI);

    if (img.width * pi < printPixels.width || img.height * pi < printPixels.height) {
      return false;
    }
    return true;
  }

  /**
   * 验证图片是否满足最大 DPI 要求
   * @param {HTMLImageElement|Object} img - 图片对象
   * @param {Object} printSize - 打印尺寸 { width, height, unit }
   * @param {number} maxDPI - 最大 DPI 要求
   * @returns {boolean} 是否满足要求
   */
  validateMaxDPI(img, printSize, maxDPI) {
    const pi = this.defaultDPI / maxDPI;
    const printPixels = this.converter.convertSize(printSize, 'px', this.defaultDPI);

    if (img.width * pi > printPixels.width || img.height * pi > printPixels.height) {
      return false;
    }
    return true;
  }

  /**
   * 计算图片实际 DPI
   * @param {HTMLImageElement|Object} img - 图片对象
   * @param {Object} printSize - 打印尺寸 { width, height, unit }
   * @returns {Object} { dpiX, dpiY, minDPI, isValid }
   */
  calculateActualDPI(img, printSize) {
    const printPixels = this.converter.convertSize(printSize, 'px', this.defaultDPI);
    
    const dpiX = (img.width / printPixels.width) * this.defaultDPI;
    const dpiY = (img.height / printPixels.height) * this.defaultDPI;
    const minDPI = Math.min(dpiX, dpiY);

    return {
      dpiX: Number(dpiX.toFixed(2)),
      dpiY: Number(dpiY.toFixed(2)),
      minDPI: Number(minDPI.toFixed(2)),
      isValid: minDPI >= this.defaultDPI
    };
  }
}

module.exports = DPIValidator;
```

### 4. 主入口 (index.js)

```javascript
/**
 * 打印尺寸转换器 - 主入口
 */

const PrintSizeConverter = require('./lib/converter');
const StageSizeCalculator = require('./lib/stage');
const DPIValidator = require('./lib/validator');

module.exports = {
  PrintSizeConverter,
  StageSizeCalculator,
  DPIValidator
};
```

## 使用示例

### 基础使用示例 (examples/basic.js)

```javascript
const { PrintSizeConverter, StageSizeCalculator, DPIValidator } = require('../index');

console.log('=== 基础尺寸转换 ===');

const converter = PrintSizeConverter;

const cmToPixel = converter.cmToPixel(10);
console.log('10 厘米 =', cmToPixel, '像素');

const inchToPixel = converter.inchToPixel(4);
console.log('4 英寸 =', inchToPixel, '像素');

const pixelToCm = converter.pixelToCm(1181);
console.log('1181 像素 =', pixelToCm, '厘米');

const pixelToInch = converter.pixelToInch(472);
console.log('472 像素 =', pixelToInch, '英寸');

console.log('\n=== 尺寸对象转换 ===');

const sizeInCm = { width: 21, height: 29.7, unit: 'cm' };
const sizeInPixel = converter.convertSize(sizeInCm, 'px');
console.log('A4 (cm) -> 像素:', sizeInPixel);

const sizeBack = converter.convertSize(sizeInPixel, 'cm');
console.log('像素 -> cm:', sizeBack);

console.log('\n=== 舞台尺寸计算 ===');

const stageCalc = new StageSizeCalculator({
  printSize: { width: 21, height: 29.7, unit: 'cm' },
  stageWidth: 800,
  stageHeight: 1131,
  dpi: 300,
  orientation: 'portrait'
});

const printPixels = stageCalc.getPrintSizeInPixels();
console.log('打印尺寸 (像素):', printPixels);

const multiplier = stageCalc.calculateMultiplier(800);
console.log('缩放倍率:', multiplier);

const objSize = stageCalc.calculateObjectPrintSize(
  { width: 200, height: 200 },
  800,
  800,
  1131
);
console.log('对象打印尺寸:', stageCalc.formatSize(objSize));

console.log('\n=== DPI 验证 ===');

const validator = new DPIValidator();

const img = { width: 2480, height: 3508 };
const printSize = { width: 21, height: 29.7, unit: 'cm' };

const actualDPI = validator.calculateActualDPI(img, printSize);
console.log('实际 DPI:', actualDPI);

const minValid = validator.validateMinDPI(img, printSize, 150);
console.log('满足最小 150 DPI:', minValid);
```

### Canvas 集成示例 (examples/canvas.js)

```javascript
/**
 * Canvas 集成示例
 * 展示如何与 Canvas/Fabric.js 等库集成使用
 */

const { PrintSizeConverter, StageSizeCalculator } = require('../index');

class CanvasPrintIntegration {
  constructor(options) {
    this.converter = PrintSizeConverter;
    this.options = {
      dpi: 300,
      printSize: { width: 21, height: 29.7, unit: 'cm' },
      canvasWidth: 800,
      canvasHeight: 1131,
      orientation: 'portrait',
      ...options
    };

    this.stageCalculator = new StageSizeCalculator({
      printSize: this.options.printSize,
      stageWidth: this.options.canvasWidth,
      stageHeight: this.options.canvasHeight,
      dpi: this.options.dpi,
      orientation: this.options.orientation
    });
  }

  setupLimitZone(limitZoneWidth) {
    this.limitZoneWidth = limitZoneWidth;
    this.multiplier = this.stageCalculator.calculateMultiplier(limitZoneWidth);
    console.log('限制区域宽度:', limitZoneWidth);
    console.log('缩放倍率:', this.multiplier);
  }

  getObjectRealSize(obj) {
    const objSize = {
      width: obj.width,
      height: obj.height
    };

    return this.stageCalculator.calculateObjectPrintSize(
      objSize,
      this.limitZoneWidth,
      this.options.canvasWidth,
      this.options.canvasHeight,
      'cm'
    );
  }

  displaySizeInfo(obj) {
    const realSize = this.getObjectRealSize(obj);
    const formatted = this.stageCalculator.formatSize(realSize);
    
    return {
      screen: {
        width: obj.width,
        height: obj.height,
        unit: 'px'
      },
      print: formatted
    };
  }
}

console.log('=== Canvas 集成示例 ===');

const integration = new CanvasPrintIntegration({
  printSize: { width: 21, height: 29.7, unit: 'cm' },
  canvasWidth: 800,
  canvasHeight: 1131
});

integration.setupLimitZone(800);

const canvasObj1 = { width: 200, height: 200 };
const sizeInfo1 = integration.displaySizeInfo(canvasObj1);
console.log('对象 1 尺寸信息:', sizeInfo1);

const canvasObj2 = { width: 400, height: 300 };
const sizeInfo2 = integration.displaySizeInfo(canvasObj2);
console.log('对象 2 尺寸信息:', sizeInfo2);
```

## API 文档

### PrintSizeConverter

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `cmToPixel(cm, dpi)` | cm: 厘米数, dpi: DPI | number | 厘米转像素 |
| `inchToPixel(inch, dpi)` | inch: 英寸数, dpi: DPI | number | 英寸转像素 |
| `pixelToCm(pixel, dpi)` | pixel: 像素值, dpi: DPI | number | 像素转厘米 |
| `pixelToInch(pixel, dpi)` | pixel: 像素值, dpi: DPI | number | 像素转英寸 |
| `convertSize(size, targetUnit, dpi)` | size: 尺寸对象, targetUnit: 目标单位, dpi: DPI | Object | 尺寸对象转换 |

### StageSizeCalculator

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `getPrintSizeInPixels()` | - | Object | 获取打印尺寸的像素值 |
| `calculateMultiplier(limitZoneWidth)` | limitZoneWidth: 限制区域宽度 | number | 计算缩放倍率 |
| `calculateMP(...)` | limitZoneWidth, canvasWidth, canvasHeight | number | 计算 MP 值（含方向） |
| `calculateObjectPrintSize(...)` | objSize, limitZoneWidth, canvasWidth, canvasHeight, targetUnit | Object | 计算对象打印尺寸 |
| `formatSize(size)` | size: 尺寸对象 | Object | 格式化尺寸为两位小数 |

### DPIValidator

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `validateMinDPI(img, printSize, minDPI)` | img, printSize, minDPI | boolean | 验证最小 DPI |
| `validateMaxDPI(img, printSize, maxDPI)` | img, printSize, maxDPI | boolean | 验证最大 DPI |
| `calculateActualDPI(img, printSize)` | img, printSize | Object | 计算实际 DPI |

## 设计理念

1. **完全抽象**：不依赖任何特定框架或库
2. **标准 DPI**：基于 300 DPI 打印标准，同时支持自定义
3. **完整功能**：包含基础转换、舞台计算、DPI 验证
4. **易于集成**：提供清晰的 API，可与任何 Canvas 库集成
5. **可扩展**：模块化设计，便于添加新功能

## 集成建议

- **Fabric.js**：使用 `StageSizeCalculator` 与 Fabric 对象的 `getWidth()`/`getHeight()` 配合
- **Konva.js**：类似地，使用 Konva 对象的尺寸属性
- **原生 Canvas**：直接使用像素数据
- **服务端使用**：所有模块均为纯 JavaScript，可在 Node.js 中运行

---

**适用场景**：产品设计工具、打印输出系统、尺寸精确匹配应用
