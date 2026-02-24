const { PrintSystem } = require('../index');

console.log('=== Print Output System - 基本使用示例 ===\n');

const printer = new PrintSystem({
  currency: 'USD',
  dpi: 300
});

console.log('1. 创建打印配置...');
const printingConfig = printer.createPrinting({
  title: '标准打印',
  description: '用于常规产品的标准打印配置',
  priceRuler: {
    type: 'multi',
    ranges: [
      {
        min: 1,
        max: 5,
        ppu: 2.00,
        text: 1.50,
        clipart: 2.00,
        images: 1.00
      },
      {
        min: 6,
        max: 20,
        ppu: 1.50,
        text: 1.00,
        clipart: 1.50,
        images: 0.80
      }
    ]
  }
});

console.log(`   ✓ 打印配置已创建: ${printingConfig.title}`);

console.log('\n2. 定义设计数据...');
const design = {
  width: 210,
  height: 297,
  paperSize: 'A4',
  objects: [
    {
      type: 'text',
      text: 'Hello World\n这是一个测试',
      x: 50,
      y: 50,
      fontSize: 24,
      fill: '#000000',
      fontFamily: 'Arial'
    },
    {
      type: 'image',
      src: 'https://example.com/image.jpg',
      x: 100,
      y: 150,
      width: 100,
      height: 100,
      uploaded: true
    },
    {
      type: 'rect',
      x: 50,
      y: 250,
      width: 100,
      height: 30,
      fill: '#3fc7ba'
    }
  ]
};

console.log('   ✓ 设计数据已定义');

console.log('\n3. 计算打印价格...');
const quantity = 5;
const price = printer.calculatePrice(printingConfig, design, quantity);
const formattedPrice = printer.formatPrice(price);

console.log(`   ✓ 数量: ${quantity}`);
console.log(`   ✓ 总价: ${formattedPrice}`);

console.log('\n4. 尺寸转换示例...');
const sizeConverter = printer.getSizeConverter();

console.log('   - A4 尺寸:');
console.log(`     厘米: ${sizeConverter.getPaperSize('A4', 'cm').width} x ${sizeConverter.getPaperSize('A4', 'cm').height}`);
console.log(`     英寸: ${sizeConverter.getPaperSize('A4', 'inch').width.toFixed(2)} x ${sizeConverter.getPaperSize('A4', 'inch').height.toFixed(2)}`);
console.log(`     像素: ${sizeConverter.getPaperSize('A4', 'px').width.toFixed(0)} x ${sizeConverter.getPaperSize('A4', 'px').height.toFixed(0)} @ 300 DPI`);

console.log('\n5. 获取所有打印配置...');
const allPrintings = printer.getPrintings();
console.log(`   ✓ 共有 ${allPrintings.length} 个打印配置`);

console.log('\n=== 示例完成 ===');
