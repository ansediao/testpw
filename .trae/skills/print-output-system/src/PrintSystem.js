const PrintingConfig = require('./PrintingConfig');
const PriceCalculator = require('./PriceCalculator');
const Exporter = require('./Exporter');
const SizeConverter = require('./SizeConverter');

class PrintSystem {
  constructor(options = {}) {
    this.options = {
      uploadPath: './uploads',
      currency: 'USD',
      decimalSeparator: '.',
      thousandSeparator: ',',
      numberDecimals: 2,
      currencyPosition: 'left',
      dpi: 300,
      ...options
    };

    this.printingConfigs = new Map();
    this.priceCalculator = new PriceCalculator(this.options);
    this.exporter = new Exporter(this.options);
    this.sizeConverter = new SizeConverter({ dpi: this.options.dpi });
  }

  createPrinting(config) {
    const printing = new PrintingConfig(config);
    this.printingConfigs.set(printing.id, printing);
    return printing;
  }

  getPrinting(id) {
    return this.printingConfigs.get(id);
  }

  getPrintings(activeOnly = false) {
    let printings = Array.from(this.printingConfigs.values());
    if (activeOnly) {
      printings = printings.filter(p => p.active);
    }
    return printings;
  }

  updatePrinting(id, updates) {
    const printing = this.getPrinting(id);
    if (!printing) {
      throw new Error(`Printing config not found: ${id}`);
    }
    Object.assign(printing, updates);
    printing.updatedAt = new Date().toISOString();
    return printing;
  }

  deletePrinting(id) {
    return this.printingConfigs.delete(id);
  }

  async export(options) {
    return await this.exporter.export(options);
  }

  calculatePrice(printingConfig, design, quantity = 1) {
    const { priceRuler } = printingConfig;
    
    const params = this.buildPriceParams(design, priceRuler.type, quantity);
    params.priceRanges = priceRuler.ranges || [];
    params.quantity = quantity;

    return this.priceCalculator.calculate(priceRuler.type, params);
  }

  buildPriceParams(design, priceType, quantity) {
    switch (priceType) {
      case 'multi':
        return {
          resourceCounts: this.countResources(design)
        };
      case 'color':
        return {
          colorCount: this.countColors(design)
        };
      case 'size':
        return {
          size: design.paperSize || 'A4'
        };
      case 'fixed':
        return {
          fixedPrice: design.fixedPrice || 0,
          views: design.views || 1
        };
      case 'line':
        return {
          lineCount: this.countLines(design)
        };
      case 'character':
        return {
          charCount: this.countCharacters(design)
        };
      case 'acreage':
        return {
          width: design.width || 0,
          height: design.height || 0,
          pricePerSquareInch: design.pricePerSquareInch || 0
        };
      default:
        return {};
    }
  }

  countResources(design) {
    const counts = {
      text: 0,
      clipart: 0,
      images: 0,
      vector: 0,
      upload: 0
    };

    if (design.objects) {
      for (const obj of design.objects) {
        switch (obj.type) {
          case 'text':
            counts.text++;
            break;
          case 'clipart':
            counts.clipart++;
            break;
          case 'image':
            if (obj.uploaded) {
              counts.upload++;
            } else {
              counts.images++;
            }
            break;
          case 'svg':
          case 'vector':
            counts.vector++;
            break;
        }
      }
    }

    return counts;
  }

  countColors(design) {
    const colors = new Set();
    if (design.objects) {
      for (const obj of design.objects) {
        if (obj.fill) {
          colors.add(obj.fill);
        }
        if (obj.stroke) {
          colors.add(obj.stroke);
        }
      }
    }
    return colors.size;
  }

  countLines(design) {
    let lines = 0;
    if (design.objects) {
      for (const obj of design.objects) {
        if (obj.type === 'text' && obj.text) {
          lines += obj.text.split('\n').length;
        }
      }
    }
    return lines;
  }

  countCharacters(design) {
    let chars = 0;
    if (design.objects) {
      for (const obj of design.objects) {
        if (obj.type === 'text' && obj.text) {
          chars += obj.text.length;
        }
      }
    }
    return chars;
  }

  formatPrice(price) {
    let formatted = Number(price).toFixed(this.options.numberDecimals);
    
    formatted = formatted.replace('.', this.options.decimalSeparator);
    const parts = formatted.split(this.options.decimalSeparator);
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, this.options.thousandSeparator);
    formatted = parts.join(this.options.decimalSeparator);

    if (this.options.currencyPosition === 'left') {
      return `${this.options.currency}${formatted}`;
    }
    return `${formatted}${this.options.currency}`;
  }

  download(exportResult, filename) {
    if (typeof window !== 'undefined') {
      const blob = this.dataToBlob(exportResult);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      return {
        data: exportResult.data,
        filename,
        mimeType: exportResult.mimeType
      };
    }
  }

  dataToBlob(exportResult) {
    if (exportResult.data.startsWith('data:')) {
      const base64 = exportResult.data.split(',')[1];
      const bytes = atob(base64);
      const array = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) {
        array[i] = bytes.charCodeAt(i);
      }
      return new Blob([array], { type: exportResult.mimeType });
    }
    return new Blob([exportResult.data], { type: exportResult.mimeType });
  }

  registerPriceCalculator(type, calculatorFn) {
    this.priceCalculator.registerCalculator(type, calculatorFn);
  }

  registerExporter(format, exporterFn) {
    this.exporter.registerExporter(format, exporterFn);
  }

  getSizeConverter() {
    return this.sizeConverter;
  }

  getPriceCalculator() {
    return this.priceCalculator;
  }

  getExporter() {
    return this.exporter;
  }
}

module.exports = PrintSystem;
