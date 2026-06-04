/**
 * 计数器组件模块
 * 被 import map 映射为 @components/counter
 * 演示带状态的 ES 模块类
 */

export class Counter {
  #count = 0   // 私有字段，外部不可访问

  increment() {
    this.#count++
  }

  decrement() {
    this.#count--
  }

  reset() {
    this.#count = 0
  }

  get value() {
    return this.#count
  }
}
