const PAPER_SIZES = require('./constants/paperSizes');

class SizeConverter {
  constructor(options = {}) {
    this.dpi = options.dpi || 300;
  }

  convert(value, fromUnit, toUnit) {
    if (fromUnit === toUnit) return value;

    let inCm = value;

    switch (fromUnit) {
      case 'inch':
        inCm = value * 2.54;
        break;
      case 'px':
        inCm = (value / this.dpi) * 2.54;
        break;
      case 'mm':
        inCm = value / 10;
        break;
    }

    switch (toUnit) {
      case 'inch':
        return inCm / 2.54;
      case 'px':
        return (inCm * this.dpi) / 2.54;
      case 'mm':
        return inCm * 10;
      default:
        return inCm;
    }
  }

  getPaperSize(format, unit = 'cm') {
    const size = PAPER_SIZES[format.toUpperCase()];
    if (!size) {
      throw new Error(`Unknown paper format: ${format}`);
    }

    return {
      width: this.convert(size.width, size.unit, unit),
      height: this.convert(size.height, size.unit, unit),
      unit: unit
    };
  }

  swapOrientation(size) {
    return {
      width: size.height,
      height: size.width,
      unit: size.unit
    };
  }
}

module.exports = SizeConverter;
