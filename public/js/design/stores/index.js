// src/store/index.js

// 1. 引入 Pinia 的核心方法
// Pinia 是 Vue 官方推荐的状态管理库，用于管理全局数据（类似于 Vuex，但更轻量易用）
const { createPinia, defineStore } = window.Pinia;

// 2. 定义一个全局画布状态仓库（store）
// defineStore 用于创建一个“仓库”，可以在任意组件中访问和修改数据
// 'canvas' 是仓库的名字，后续通过 useCanvasStore() 获取仓库实例
export const useCanvasStore = defineStore('canvas', {
    // 3. state 定义所有需要全局管理的数据
    state: () => ({
        // canvasStates：存储每个画板的状态（如对象、图层等），初始有3个画板
        canvasStates: { canvas1: null, canvas2: null, canvas3: null },
        // activeCanvasId：当前激活的画板 id，默认是 canvas1
        activeCanvasId: 'canvas1',
        // layers：当前画板的所有图层对象（用于底部图层面板显示）
        layers: [],
        // activeObjectId：当前选中的对象 id（用于高亮和操作）
        activeObjectId: null,
        // actionRequest：全局动作请求（如添加、删除、克隆图层等），用于跨组件通信
        actionRequest: null,
    }),
    // 4. actions 定义所有修改 state 的方法（类似于 class 的成员方法）
    actions: {
        // 切换当前激活的画板
        setActiveCanvasId(id) { this.activeCanvasId = id; },
        // 更新指定画板的状态（如对象、图层等）
        updateCanvasState(id, state) { this.canvasStates[id] = state; },
        // 设置当前画板的所有图层
        setLayers(layers) { this.layers = layers; },
        // 设置当前选中的对象 id
        setActiveObjectId(id) { this.activeObjectId = id; },
        // 发起一个全局动作请求（如添加/删除/克隆图层），payload 为动作参数
        requestAction(payload) { this.actionRequest = { ...payload, timestamp: Date.now() }; }
    },
});

// 5. 创建 Pinia 实例，后续所有 Vue 应用都要 use(pinia) 才能访问全局状态
export const pinia = createPinia();
