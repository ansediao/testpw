const { PrintSizeConverter, StageSizeCalculator, DPIValidator } = require('../index');

console.log('=== 基础尺寸转换 ===');

const converter = PrintSizeConverter;

const cmToPixel = converter.cmToPixel(10);
console.log('10 厘米 =', cmToPixel, '像素');

const inchToPixel = converter.inchToPixel(4);
console.log('4 英寸 =', inchToPixel, '像素');

const pixelToCm = converter.pixelToCm(1181);
console.log('1181 像素 =', pixelToCm, '厘米');

const pixelToInch = converter.pixelToInch(472);
console.log('472 像素 =', pixelToInch, '英寸');

console.log('\n=== 尺寸对象转换 ===');

const sizeInCm = { width: 21, height: 29.7, unit: 'cm' };
const sizeInPixel = converter.convertSize(sizeInCm, 'px');
console.log('A4 (cm) -> 像素:', sizeInPixel);

const sizeBack = converter.convertSize(sizeInPixel, 'cm');
console.log('像素 -> cm:', sizeBack);

console.log('\n=== 舞台尺寸计算 ===');

const stageCalc = new StageSizeCalculator({
  printSize: { width: 21, height: 29.7, unit: 'cm' },
  stageWidth: 800,
  stageHeight: 1131,
  dpi: 300,
  orientation: 'portrait'
});

const printPixels = stageCalc.getPrintSizeInPixels();
console.log('打印尺寸 (像素):', printPixels);

const multiplier = stageCalc.calculateMultiplier(800);
console.log('缩放倍率:', multiplier);

const objSize = stageCalc.calculateObjectPrintSize(
  { width: 200, height: 200 },
  800,
  800,
  1131
);
console.log('对象打印尺寸:', stageCalc.formatSize(objSize));

console.log('\n=== DPI 验证 ===');

const validator = new DPIValidator();

const img = { width: 2480, height: 3508 };
const printSize = { width: 21, height: 29.7, unit: 'cm' };

const actualDPI = validator.calculateActualDPI(img, printSize);
console.log('实际 DPI:', actualDPI);

const minValid = validator.validateMinDPI(img, printSize, 150);
console.log('满足最小 150 DPI:', minValid);
