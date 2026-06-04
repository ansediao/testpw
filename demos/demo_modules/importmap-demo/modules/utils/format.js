/**
 * 格式化工具模块
 * 被 import map 映射为 @utils/format
 */

export function formatDate(date) {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
}

export function formatTime(date) {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 未 export = 私有，外部不可访问
function padZero(n) {
  return String(n).padStart(2, '0')
}
