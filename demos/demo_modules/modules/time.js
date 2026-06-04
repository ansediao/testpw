/**
 * 时间工具模块
 * 演示默认导出和命名导出混用
 */

// 命名导出
export function getCurrentTime() {
  const now = new Date()
  return now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

export function formatDate(date) {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 默认导出（每个模块只能有一个）
export default {
  now: () => new Date(),
  timestamp: () => Date.now()
}
