const SizeConverter = require('./SizeConverter');

class Exporter {
  constructor(options = {}) {
    this.options = {
      dpi: 300,
      includeBase: true,
      full: true,
      overflow: true,
      cropmarks: false,
      ...options
    };
    this.sizeConverter = new SizeConverter({ dpi: this.options.dpi });
    this.customExporters = {};
  }

  async export(options) {
    const { format, ...rest } = { ...this.options, ...options };

    switch (format.toLowerCase()) {
      case 'png':
        return await this.exportPNG(rest);
      case 'svg':
        return await this.exportSVG(rest);
      case 'pdf':
        return await this.exportPDF(rest);
      default:
        if (this.customExporters[format]) {
          return await this.customExporters[format](rest);
        }
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  async exportPNG(options) {
    const { canvas, width, height, includeBase, full, overflow } = options;

    if (!canvas) {
      return this.generatePlaceholderPNG(width, height);
    }

    return {
      data: canvas.toDataURL('image/png'),
      mimeType: 'image/png',
      format: 'png'
    };
  }

  async exportSVG(options) {
    const { canvas, includeBase, full, overflow, cropmarks, design } = options;

    if (!canvas && !design) {
      return this.generatePlaceholderSVG(options.width, options.height);
    }

    let svg;
    if (canvas) {
      svg = canvas.toSVG();
    } else {
      svg = this.designToSVG(design);
    }

    if (cropmarks) {
      svg = this.addCropmarks(svg, options);
    }

    return {
      data: svg,
      mimeType: 'image/svg+xml',
      format: 'svg'
    };
  }

  async exportPDF(options) {
    const { size, orientation, unit, cropmarks, pages } = options;

    let paperSize;
    if (typeof size === 'string') {
      paperSize = this.sizeConverter.getPaperSize(size, 'cm');
    } else {
      paperSize = {
        width: size.width,
        height: size.height,
        unit: size.unit || 'cm'
      };
    }

    if (orientation === 'landscape') {
      paperSize = this.sizeConverter.swapOrientation(paperSize);
    }

    let pdf;

    if (typeof PDFDocument !== 'undefined') {
      pdf = this.generatePDFWithPDFKit(options, paperSize);
    } else {
      pdf = this.generateSimplePDF(options, paperSize);
    }

    return {
      data: pdf,
      mimeType: 'application/pdf',
      format: 'pdf'
    };
  }

  designToSVG(design) {
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${design.width}" 
     height="${design.height}"
     viewBox="0 0 ${design.width} ${design.height}">`;

    if (design.objects) {
      for (const obj of design.objects) {
        svg += this.objectToSVG(obj);
      }
    }

    svg += '</svg>';
    return svg;
  }

  objectToSVG(obj) {
    switch (obj.type) {
      case 'text':
        return this.textToSVG(obj);
      case 'image':
        return this.imageToSVG(obj);
      case 'rect':
      case 'circle':
        return this.shapeToSVG(obj);
      default:
        return '';
    }
  }

  textToSVG(obj) {
    return `<text x="${obj.x}" y="${obj.y}" 
                 font-family="${obj.fontFamily || 'Arial'}" 
                 font-size="${obj.fontSize || 16}"
                 fill="${obj.fill || '#000000'}">
      ${obj.text || ''}
    </text>`;
  }

  imageToSVG(obj) {
    return `<image x="${obj.x}" y="${obj.y}" 
                  width="${obj.width}" height="${obj.height}" 
                  xlink:href="${obj.src || ''}"/>`;
  }

  shapeToSVG(obj) {
    if (obj.type === 'rect') {
      return `<rect x="${obj.x}" y="${obj.y}" 
                    width="${obj.width}" height="${obj.height}" 
                    fill="${obj.fill || '#000000'}"/>`;
    } else if (obj.type === 'circle') {
      return `<circle cx="${obj.x + obj.radius}" 
                     cy="${obj.y + obj.radius}" 
                     r="${obj.radius}"
                     fill="${obj.fill || '#000000'}"/>`;
    }
    return '';
  }

  addCropmarks(svg, options) {
    return svg;
  }

  generatePlaceholderPNG(width, height) {
    return {
      data: '',
      mimeType: 'image/png',
      format: 'png'
    };
  }

  generatePlaceholderSVG(width, height) {
    return {
      data: `<svg width="${width || 210}" height="${height || 297}" xmlns="http://www.w3.org/2000/svg"></svg>`,
      mimeType: 'image/svg+xml',
      format: 'svg'
    };
  }

  generatePDFWithPDFKit(options, paperSize) {
    return '';
  }

  generateSimplePDF(options, paperSize) {
    return '';
  }

  registerExporter(format, exporterFn) {
    this.customExporters[format] = exporterFn;
  }
}

module.exports = Exporter;
