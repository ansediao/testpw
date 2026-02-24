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
