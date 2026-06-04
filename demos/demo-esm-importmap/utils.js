/**
 * utils.js - 工具模块
 *
 * 使用 ES Modules 的 export 导出函数
 * 避免全局变量污染
 */

/**
 * 格式化日期
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 问候函数
 * @param {string} name - 名称
 * @returns {string} 问候语
 */
export function greet(name) {
    return `Hello, ${name}! 这是一个无构建工具的模块化演示`;
}

/**
 * 计算两数之和
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function add(a, b) {
    return a + b;
}

// 注意：没有 export 的变量不会暴露到外部
const privateValue = '这是私有变量，外部无法访问';
