const { PrintSystem, PRICE_TYPES } = require('../index');

console.log('=== Print Output System - 价格计算示例 ===\n');

const printer = new PrintSystem({
  currency: 'USD',
  decimalSeparator: '.',
  thousandSeparator: ',',
  currencyPosition: 'left'
});

const sampleDesign = {
  width: 210,
  height: 297,
  paperSize: 'A4',
  objects: [
    { type: 'text', text: 'Hello World', x: 50, y: 50, fill: '#000000' },
    { type: 'text', text: '第二行文字', x: 50, y: 100, fill: '#000000' },
    { type: 'image', x: 50, y: 150, width: 100, height: 100, uploaded: true },
    { type: 'clipart', x: 200, y: 150, width: 50, height: 50 }
  ]
};

console.log('示例设计包含:');
console.log('  - 2 个文字对象');
console.log('  - 1 个上传图片');
console.log('  - 1 个剪贴画');
console.log('');

console.log('1. Multi - 按资源数量计算:');
const multiConfig = printer.createPrinting({
  title: 'Multi Price',
  priceRuler: {
    type: 'multi',
    ranges: [
      {
        min: 1,
        max: 10,
        text: 1.00,
        clipart: 2.00,
        images: 3.00,
        vector: 1.50,
        upload: 5.00
      }
    ]
  }
});
const multiPrice = printer.calculatePrice(multiConfig, sampleDesign, 1);
console.log(`   ${printer.formatPrice(multiPrice)} (2×$1 + 1×$2 + 1×$5)`);
console.log('');

console.log('2. Color - 按颜色数量计算:');
const colorConfig = printer.createPrinting({
  title: 'Color Price',
  priceRuler: {
    type: 'color',
    ranges: [
      { min: 1, max: 100, ppu: 5.00, 'full-color': 5.00 }
    ]
  }
});
const colorDesign = { ...sampleDesign };
colorDesign.objects[0].fill = '#ff0000';
colorDesign.objects[1].fill = '#00ff00';
const colorPrice = printer.calculatePrice(colorConfig, colorDesign, 1);
console.log(`   ${printer.formatPrice(colorPrice)} (2种颜色 × $5)`);
console.log('');

console.log('3. Size - 按纸张尺寸计算:');
const sizeConfig = printer.createPrinting({
  title: 'Size Price',
  priceRuler: {
    type: 'size',
    ranges: [
      { 
        min: 1, 
        max: 100, 
        ppu: 1.00,
        'A0': 10.00,
        'A1': 8.00,
        'A2': 6.00,
        'A3': 4.00,
        'A4': 2.00,
        'A5': 1.00
      }
    ]
  }
});
const a4Price = printer.calculatePrice(sizeConfig, { ...sampleDesign, paperSize: 'A4' }, 1);
const a3Price = printer.calculatePrice(sizeConfig, { ...sampleDesign, paperSize: 'A3' }, 1);
console.log(`   A4: ${printer.formatPrice(a4Price)}`);
console.log(`   A3: ${printer.formatPrice(a3Price)}`);
console.log('');

console.log('4. Fixed - 固定价格:');
const fixedConfig = printer.createPrinting({
  title: 'Fixed Price',
  priceRuler: {
    type: 'fixed',
    ranges: [
      { min: 1, max: 100, price: 10.00 }
    ]
  }
});
const fixedDesign = { ...sampleDesign, fixedPrice: 10.00, views: 2 };
const fixedPrice = printer.calculatePrice(fixedConfig, fixedDesign, 1);
console.log(`   ${printer.formatPrice(fixedPrice)} (固定 $10 × 2 面)`);
console.log('');

console.log('5. Line - 按行数计算:');
const lineConfig = printer.createPrinting({
  title: 'Line Price',
  priceRuler: {
    type: 'line',
    ranges: [
      { 
        min: 1, 
        max: 100, 
        ppu: 2.00,
        '1-line': 2.00,
        '2-line': 1.80,
        '3-line': 1.50
      }
    ]
  }
});
const lineDesign = {
  ...sampleDesign,
  objects: [
    { type: 'text', text: '第一行\n第二行\n第三行', x: 50, y: 50 }
  ]
};
const linePrice = printer.calculatePrice(lineConfig, lineDesign, 1);
console.log(`   ${printer.formatPrice(linePrice)} (3行 × $2)`);
console.log('');

console.log('6. Character - 按字符数计算:');
const charConfig = printer.createPrinting({
  title: 'Character Price',
  priceRuler: {
    type: 'character',
    ranges: [
      { 
        min: 1, 
        max: 1000, 
        ppu: 0.10,
        '1-character': 0.10,
        '2-character': 0.09,
        '3-character': 0.08
      }
    ]
  }
});
const charDesign = {
  ...sampleDesign,
  objects: [
    { type: 'text', text: 'Hello', x: 50, y: 50 }
  ]
};
const charPrice = printer.calculatePrice(charConfig, charDesign, 1);
console.log(`   ${printer.formatPrice(charPrice)} (5字符 × $0.10)`);
console.log('');

console.log('7. Acreage - 按面积计算:');
const acreageConfig = printer.createPrinting({
  title: 'Acreage Price',
  priceRuler: {
    type: 'acreage',
    ranges: [
      { min: 1, max: 1000, price: 0.50 }
    ]
  }
});
const acreageDesign = {
  ...sampleDesign,
  width: 10,
  height: 10,
  pricePerSquareInch: 0.50
};
const acreagePrice = printer.calculatePrice(acreageConfig, acreageDesign, 1);
console.log(`   ${printer.formatPrice(acreagePrice)} (10×10 × $0.50 = $50)`);
console.log('');

console.log('8. 自定义价格计算器:');
printer.registerPriceCalculator('weight', (params) => {
  return params.weight * params.pricePerKg;
});
const weightPrice = printer.getPriceCalculator().calculate('weight', {
  weight: 2.5,
  pricePerKg: 10.00
});
console.log(`   自定义按重量: ${printer.formatPrice(weightPrice)} (2.5kg × $10)`);
console.log('');

console.log('=== 示例完成 ===');
