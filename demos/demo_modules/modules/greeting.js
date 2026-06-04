/**
 * 打招呼模块
 * 使用 ES Module 的 export 导出功能
 */

export function greet(name) {
  return `你好，${name}！欢迎使用 ES 模块 🎉`
}

export function farewell(name) {
  return `再见，${name}！`
}

// 这个函数没有 export，外部无法访问（私有）
function internalHelper() {
  return '我是私有函数'
}
