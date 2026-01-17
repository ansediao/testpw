/*
 * 抽象 Vue 组件模板
 * 作用：提供一个标准化的 Vue 组件结构，用于封装页面中的独立功能模块，
 *      并与 Pinia 全局状态进行交互。
 *
 * 依赖：
 *   - window.Vue：从全局 Vue 运行时中解构出 createApp/ref/computed/watch 等 API。
 *   - Pinia stores：根据组件需求，从 ../stores/index.js 引入相应的 Pinia store。
 *
 * 挂载点：
 *   - 在 PHP 模板中为组件预留的 DOM 元素 ID，例如 `<div id="your-component-mount-point"></div>`。
 *
 * 设计约定：
 *   - 组件应尽可能独立，只关注自身功能和视图。
 *   - 模板字符串内部不写 HTML 注释，以避免在 DOM 中产生额外注释节点。
 *   - 保持纯函数式计算（computed）与最小副作用（watch）。
 *   - 命名规范遵循项目约定（例如：组件文件名为小写连字符，组件名为 PascalCase）。
 */

// 从全局 Vue 运行时解构出需要的 API
// ref: 用于创建响应式基本类型数据
// computed: 用于创建依赖于其他响应式数据的派生属性
// watch: 用于监听响应式数据的变化并执行副作用
const { createApp, ref, computed, watch } = window.Vue;

// 引入 Pinia 实例和组件可能需要用到的业务 Store
// 根据实际需求引入，如果不需要 Pinia，可以移除此行
import { pinia, useCanvasStore, usePrintMethodStore } from '../stores/index.js';

// 导出组件定义，便于外部引用或测试
export const YourComponentName = {
  // 组件名称，用于调试和 Vue Devtools
  name: 'YourComponentName',

  // setup 函数是 Vue 3 组合式 API 的入口
  // 在这里定义组件的响应式状态、计算属性、侦听器和方法
  setup() {
    // 1. 引入 Pinia Store 实例 (如果需要)
    //    通过调用 useStore() 函数获取 store 实例，以便访问全局状态和 action
    const canvasStore = useCanvasStore();
    const printStore = usePrintMethodStore(); // 示例：如果组件需要访问印刷方法 store

    // 2. 定义响应式状态 (ref / reactive)
    //    使用 ref 创建响应式基本类型数据，或使用 reactive 创建响应式对象/数组
    const localState = ref('初始值');
    const count = ref(0);

    // 3. 定义计算属性 (computed)
    //    计算属性是基于响应式依赖缓存的，只有当其依赖发生变化时才会重新计算。
    //    适合用于从现有状态派生新数据，或对数据进行格式化。
    const derivedData = computed(() => {
      // 示例：从 Pinia store 获取数据并进行处理
      const globalValue = canvasStore.someGlobalValue || 0;
      return `处理后的值: ${localState.value} - ${globalValue}`;
    });

    // 4. 定义侦听器 (watch)
    //    侦听器用于在响应式数据变化时执行副作用，例如：
    //    - 发送 API 请求
    //    - 执行复杂的 DOM 操作
    //    - 打印日志
    watch(count, (newCount, oldCount) => {
      // 示例：当 count 变化时，更新 Pinia store 中的某个状态
      // canvasStore.updateSomeCount(newCount);
    });

    // 5. 定义组件方法
    //    这些方法通常用于响应用户交互（如点击事件）或执行特定逻辑。
    const handleClick = () => {
      count.value++;
      // 示例：调用 Pinia store 的 action 来修改全局状态
      // canvasStore.someAction();
    };

    // 6. 返回暴露给模板的数据和方法
    //    setup 函数返回的对象中的属性和方法将可以在组件的模板中使用。
    return {
      localState,
      count,
      derivedData,
      handleClick,
      // 如果需要，也可以直接暴露 Pinia store 的 getter 或 state
      // 例如：globalValueFromStore: computed(() => canvasStore.someGlobalValue)
    };
  },

  // 组件的模板部分
  // 这里定义组件的 HTML 结构，并使用 Vue 的模板语法绑定数据和事件。
  // 确保模板有一个根元素。
  template: `
    <div class="your-component-container">
      <h2>这是一个抽象组件模板</h2>
      <p>本地状态: {{ localState }}</p>
      <p>计数器: {{ count }}</p>
      <p>派生数据: {{ derivedData }}</p>
      <button @click="handleClick">点击我增加计数</button>
      <!-- 示例：从 Pinia store 获取并显示数据 -->
      <p v-if="canvasStore.isLoadingProductData">正在加载产品数据...</p>
      <p v-else>产品名称: {{ canvasStore.productData?.name || 'N/A' }}</p>
    </div>
  `,
};

// 组件挂载的自执行函数
// 这个函数负责在页面加载完成后，将 Vue 组件实例挂载到指定的 DOM 元素上。
(function mountYourComponentName() {
  // 获取组件的挂载点 DOM 元素
  const container = document.getElementById('your-component-mount-point');
  // 如果挂载点不存在，则安全退出，避免报错
  if (!container) {
    return;
  }

  // 创建 Vue 应用实例
  const app = createApp(YourComponentName);

  // 注册 Pinia 实例到 Vue 应用中，使所有子组件都能访问 Pinia store
  // 如果组件不需要 Pinia，可以移除此行
  app.use(pinia);

  // 将 Vue 应用实例挂载到指定的 DOM 元素上
  app.mount('#your-component-mount-point');

  // (可选) 将组件实例暴露到全局 window 对象，便于在浏览器控制台进行调试
  window.YourComponentName = YourComponentName;
  
})();