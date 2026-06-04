/**
 * deps.js —— 统一管理所有第三方 CDN 依赖（ES 模块版本）
 *
 * 规则：
 *  1. 只使用 esm.sh / jsdelivr.net 的 ES 模块版本（支持 import 语法）
 *  2. 锁定精确版本号，避免 latest 带来的兼容性问题
 *  3. 所有依赖从此文件统一 re-export，其他模块只从这里导入
 */

// 1) Vue 3 组合式 API（ref / reactive / computed / watch / onMounted ...）
//    注意：必须用 esm-bundler 版本（含 compiler-dom），
//    这样在浏览器里直接用 <template> 字符串 / #app.innerHTML 才会被编译。
export {
  createApp,
  ref,
  reactive,
  computed,
  watch,
  watchEffect,
  onMounted,
  onUnmounted,
  nextTick,
  defineComponent,
  h,
} from 'https://esm.sh/vue@3.4.21/dist/vue.esm-bundler.js';

// 2) Fabric.js —— 2D 画布（默认导出是命名空间）
export { fabric } from 'https://esm.sh/fabric@5.3.0';

// 3) lodash-es —— 按需导入工具函数
export { debounce, throttle, cloneDeep, pick, omit } from 'https://esm.sh/lodash-es@4.17.21';

// 4) Pinia —— 状态管理
export { createPinia, defineStore, storeToRefs } from 'https://esm.sh/pinia@2.1.7';

// 5) MicroModal —— 弹窗（项目统一使用 micromodal）
export { default as MicroModal } from 'https://esm.sh/micromodal@0.4.10';
