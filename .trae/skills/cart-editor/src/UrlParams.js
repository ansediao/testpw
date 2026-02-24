/**
 * URL 参数管理工具类
 */
export class UrlParams {
  /**
   * 获取 URL 参数
   * @param {string} name - 参数名
   * @param {*} defaultValue - 默认值
   * @returns {*} 参数值
   */
  static get(name, defaultValue = null) {
    const urlParams = new URLSearchParams(window.location.search);
    const value = urlParams.get(name);
    return value !== null ? value : defaultValue;
  }

  /**
   * 设置 URL 参数（不刷新页面）
   * @param {string} name - 参数名
   * @param {*} value - 参数值
   */
  static set(name, value) {
    const url = new URL(window.location);
    if (value === null || value === undefined) {
      url.searchParams.delete(name);
    } else {
      url.searchParams.set(name, value);
    }
    window.history.replaceState({}, '', url);
  }

  /**
   * 移除 URL 参数
   * @param {string} name - 参数名
   */
  static remove(name) {
    this.set(name, null);
  }

  /**
   * 清空所有相关参数
   * @param {string[]} names - 要移除的参数名数组
   */
  static clear(names = []) {
    const url = new URL(window.location);
    names.forEach(name => url.searchParams.delete(name));
    window.history.replaceState({}, '', url);
  }
}
