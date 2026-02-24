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
