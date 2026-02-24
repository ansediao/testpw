const PRICE_TYPES = {
  multi: {
    label: 'Multi Resource',
    description: 'Calculate price by text, clipart, images, upload count',
    options: ['text', 'clipart', 'images', 'vector', 'upload']
  },
  color: {
    label: 'Color Count',
    description: 'Calculate price by number of colors',
    options: ['full-color']
  },
  size: {
    label: 'Paper Size',
    description: 'Calculate price by paper size',
    options: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6']
  },
  fixed: {
    label: 'Fixed Price',
    description: 'Fixed price per view',
    options: ['price']
  },
  line: {
    label: 'Per Line',
    description: 'Calculate price per line',
    options: ['1-line', '2-line', '3-line']
  },
  character: {
    label: 'Per Character',
    description: 'Calculate price per character',
    options: ['1-character', '2-character', '3-character']
  },
  acreage: {
    label: 'Per Square Inch',
    description: 'Calculate price by design area',
    options: ['price']
  }
};

module.exports = PRICE_TYPES;
