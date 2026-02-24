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
