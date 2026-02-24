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
