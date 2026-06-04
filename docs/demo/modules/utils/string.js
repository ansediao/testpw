/**
 * 字符串工具模块
 * 展示模块封装
 */

// 私有状态
let transformationCount = 0;

// 私有工具函数
function incrementCounter() {
    transformationCount++;
}

// 公开接口
export function capitalize(str) {
    incrementCounter();
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function reverse(str) {
    incrementCounter();
    return str.split('').reverse().join('');
}

export function camelCase(str) {
    incrementCounter();
    return str
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase());
}

export function kebabCase(str) {
    incrementCounter();
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
}

export function truncate(str, length = 50, suffix = '...') {
    incrementCounter();
    if (str.length <= length) return str;
    return str.substring(0, length) + suffix;
}

export function getTransformationCount() {
    return transformationCount;
}

export function getStats() {
    return {
        totalTransformations: transformationCount,
        moduleName: 'String Utils'
    };
}
