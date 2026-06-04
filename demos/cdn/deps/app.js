/**
 * app.js —— Vue 3 + Fabric.js + Pinia + lodash-es 演示
 *
 * 关键点：
 *  - 所有依赖从 ./deps.js 统一导入（deps.js 内部锁定精确版本号）
 *  - 用 esm.sh 的 ES 模块版本，浏览器原生 <script type="module"> 即可跑
 *  - Vue 组合式 API 写在 setup() 中
 *  - 状态/异步逻辑放在 Pinia store 的 actions / getters 中
 *  - 用 lodash-es 的 debounce 做"输入节流"
 *  - 弹窗用 micromodal
 */
import {
  createApp,
  ref,
  computed,
  onMounted,
  watch,
  debounce,
  fabric,
  createPinia,
  MicroModal,
} from './deps.js';
import { useCanvasStore } from './store.js';

const app = createApp({
  setup() {
    const store = useCanvasStore();
    const canvasEl = ref(null);
    let canvas = null;

    // 节流后的文字输入同步
    const onTextInput = debounce((val) => {
      store.setText(val);
    }, 200);

    // 计算属性：依赖 store 状态
    const badge = computed(() => store.summary);

    onMounted(() => {
      // 初始化 fabric 画布
      canvas = new fabric.Canvas(canvasEl.value, {
        width: 600,
        height: 360,
        backgroundColor: '#f5f7fb',
      });

      // 示例：往画布上放一个矩形 + 一段文字
      const rect = new fabric.Rect({
        left: 60,
        top: 60,
        width: 180,
        height: 110,
        fill: store.color,
        rx: 12,
        ry: 12,
        selectable: true,
      });
      const textObj = new fabric.IText(store.text, {
        left: 280,
        top: 80,
        fontSize: 28,
        fill: '#222',
        fontFamily: 'system-ui, sans-serif',
      });
      canvas.add(rect, textObj);
      store.setObjectCount(canvas.getObjects().length);

      // 监听 store.color 变化 → 同步到 fabric 矩形
      watch(
        () => store.color,
        (val) => {
          rect.set('fill', val);
          canvas.requestRenderAll();
        }
      );

      // 监听 store.text 变化 → 同步到 fabric 文字
      watch(
        () => store.text,
        (val) => {
          textObj.set('text', val);
          canvas.requestRenderAll();
        }
      );

      // 暴露给 window 方便控制台调试
      window.__demo = { canvas, rect, textObj, store };
    });

    function onColorChange(e) {
      store.setColor(e.target.value);
    }

    function addCircle() {
      const c = new fabric.Circle({
        left: 80 + Math.random() * 300,
        top: 60 + Math.random() * 200,
        radius: 30 + Math.random() * 30,
        fill: store.color,
        opacity: 0.7,
      });
      canvas.add(c);
      store.setObjectCount(canvas.getObjects().length);
      store.note('新增圆形');
    }

    function clearCanvas() {
      canvas.clear();
      canvas.backgroundColor = '#f5f7fb';
      canvas.requestRenderAll();
      store.setObjectCount(0);
      store.note('清空画布');
    }

    function openModal() {
      MicroModal.show('demo-modal');
    }

    return {
      badge,
      canvasEl,
      onColorChange,
      onTextInput,
      addCircle,
      clearCanvas,
      openModal,
      store,
    };
  },
});

app.use(createPinia());
app.mount('#app');
