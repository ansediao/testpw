/**
 * 计算器模块
 * 演示带状态的模块
 */

export function calculate(a, b, operator) {
  switch (operator) {
    case '+':
      return a + b
    case '-':
      return a - b
    case '*':
      return a * b
    case '/':
      return b !== 0 ? a / b : '错误：除数不能为 0'
    default:
      return '未知运算符'
  }
}

export function factorial(n) {
  if (n < 0) return '错误：负数没有阶乘'
  if (n === 0 || n === 1) return 1
  return n * factorial(n - 1)
}
