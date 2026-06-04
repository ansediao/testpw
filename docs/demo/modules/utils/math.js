/**
 * 数学工具模块
 * 展示模块作用域隔离
 */

// 私有变量 - 不会暴露到全局
let calculationHistory = [];
const PI = 3.14159;

// 私有函数 - 不会暴露到全局
function addToHistory(operation, result) {
    calculationHistory.push({
        operation,
        result,
        timestamp: new Date().toISOString()
    });
}

// 公开接口 - 通过 export 暴露
export function add(a, b) {
    const result = a + b;
    addToHistory(`${a} + ${b}`, result);
    return result;
}

export function multiply(a, b) {
    const result = a * b;
    addToHistory(`${a} × ${b}`, result);
    return result;
}

export function power(base, exponent) {
    const result = Math.pow(base, exponent);
    addToHistory(`${base}^${exponent}`, result);
    return result;
}

export function getCircleArea(radius) {
    const area = PI * radius * radius;
    addToHistory(`π × ${radius}²`, area);
    return area;
}

export function getHistory() {
    return [...calculationHistory]; // 返回副本，防止修改
}

export function clearHistory() {
    calculationHistory = [];
}
