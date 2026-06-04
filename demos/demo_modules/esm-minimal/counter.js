/**
 * counter.js — 状态模块
 * 模块内所有变量自动限定在模块作用域，不会泄漏到 window
 */

// 模块私有变量 — 外部无法直接访问
let _count = 0;

/**
 * 计数器 +1
 * @returns {number} 递增后的值
 */
export function increment() {
  return ++_count;
}

/**
 * 重置计数器
 */
export function reset() {
  _count = 0;
}

/**
 * 获取当前计数
 * @returns {number}
 */
export function getCount() {
  return _count;
}
