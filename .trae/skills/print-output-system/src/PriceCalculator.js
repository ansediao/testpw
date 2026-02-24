const PRICE_TYPES = require('./constants/priceTypes');

class PriceCalculator {
  constructor(options = {}) {
    this.customCalculators = {};
    this.options = options;
  }

  calculate(type, params) {
    if (this.customCalculators[type]) {
      return this.customCalculators[type](params);
    }

    switch (type) {
      case 'multi':
        return this.calculateMulti(params);
      case 'color':
        return this.calculateColor(params);
      case 'size':
        return this.calculateSize(params);
      case 'fixed':
        return this.calculateFixed(params);
      case 'line':
        return this.calculateLine(params);
      case 'character':
        return this.calculateCharacter(params);
      case 'acreage':
        return this.calculateAcreage(params);
      default:
        throw new Error(`Unknown price type: ${type}`);
    }
  }

  calculateMulti(params) {
    const { resourceCounts, priceRanges, quantity = 1 } = params;
    let total = 0;

    for (const [resource, count] of Object.entries(resourceCounts)) {
      const pricePerUnit = this.getPriceFromRange(priceRanges, quantity, resource);
      total += count * pricePerUnit;
    }

    return total * quantity;
  }

  calculateColor(params) {
    const { colorCount, priceRanges, quantity = 1 } = params;
    const pricePerColor = this.getPriceFromRange(priceRanges, quantity, 'full-color');
    return colorCount * pricePerColor * quantity;
  }

  calculateSize(params) {
    const { size, priceRanges, quantity = 1 } = params;
    const pricePerUnit = this.getPriceFromRange(priceRanges, quantity, size);
    return pricePerUnit * quantity;
  }

  calculateFixed(params) {
    const { fixedPrice, quantity = 1, views = 1 } = params;
    return fixedPrice * views * quantity;
  }

  calculateLine(params) {
    const { lineCount, priceRanges, quantity = 1 } = params;
    const pricePerLine = this.getPriceFromRange(priceRanges, quantity, '1-line');
    return lineCount * pricePerLine * quantity;
  }

  calculateCharacter(params) {
    const { charCount, priceRanges, quantity = 1 } = params;
    const pricePerChar = this.getPriceFromRange(priceRanges, quantity, '1-character');
    return charCount * pricePerChar * quantity;
  }

  calculateAcreage(params) {
    const { width, height, pricePerSquareInch, quantity = 1 } = params;
    const area = width * height;
    return area * pricePerSquareInch * quantity;
  }

  getPriceFromRange(priceRanges, quantity, option = null) {
    for (const range of priceRanges) {
      if (quantity >= range.min && quantity <= range.max) {
        if (option && range[option] !== undefined) {
          return range[option];
        }
        if (range.ppu !== undefined) {
          return range.ppu;
        }
        if (range.price !== undefined) {
          return range.price;
        }
      }
    }
    return 0;
  }

  addRule(type, rule) {
    if (!PRICE_TYPES[type]) {
      PRICE_TYPES[type] = {
        label: type,
        description: 'Custom price type',
        options: []
      };
    }
  }

  registerCalculator(type, calculatorFn) {
    this.customCalculators[type] = calculatorFn;
  }

  getPriceTypes() {
    return PRICE_TYPES;
  }
}

module.exports = PriceCalculator;
