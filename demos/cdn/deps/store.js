/**
 * store.js —— Pinia 状态管理示例
 *
 * 说明：定义一个简单的"画布对象"store，集中管理 fabric 对象与 UI 状态。
 *       业务里只从 deps.js 导入，store 文件本身不写 CDN 地址。
 */
import { defineStore } from './deps.js';
import { ref, computed } from './deps.js';

export const useCanvasStore = defineStore('canvas', () => {
  // ---- state ----
  const color = ref('#3a86ff');
  const text = ref('Hello PWCA');
  const objectCount = ref(0);
  const lastAction = ref('初始化');

  // ---- getters ----
  const summary = computed(() => `${lastAction.value} · 当前 ${objectCount.value} 个对象`);

  // ---- actions ----
  function setColor(v) {
    color.value = v;
    lastAction.value = `更换颜色为 ${v}`;
  }
  function setText(v) {
    text.value = v;
    lastAction.value = `更新文字为 ${v}`;
  }
  function setObjectCount(n) {
    objectCount.value = n;
  }
  function note(action) {
    lastAction.value = action;
  }

  return { color, text, objectCount, lastAction, summary, setColor, setText, setObjectCount, note };
});
