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
        // viewLayers：按视图分组的图层管理 { viewId: [layers] }
        viewLayers: {},
        // activeObjectId：当前选中的对象 id（用于高亮和操作）
        activeObjectId: null,
        // actionRequest：全局动作请求（如添加、删除、克隆图层等），用于跨组件通信
        actionRequest: null,
        // 图层组相关状态
        layerGroups: [],        // 图层组列表
        // viewLayerGroups：按视图分组的图层组管理 { viewId: [layerGroups] }
        viewLayerGroups: {},
        activeGroupId: null,    // 当前选中的图层组ID
        // 产品数据相关状态
        productData: null,      // 存储从API获取的产品数据
        isLoadingProductData: false, // 产品数据加载状态
        productDataError: null, // 产品数据加载错误信息
        // 视图相关状态
        views: [],              // 存储所有视图信息
        activeViewId: null,     // 当前激活的视图ID
        viewCanvases: {},       // 存储每个视图的canvas实例
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
        requestAction(payload) { this.actionRequest = { ...payload, timestamp: Date.now() }; },
        // 图层组相关方法
        setLayerGroups(groups) { this.layerGroups = groups; },
        setActiveGroupId(id) { this.activeGroupId = id; },
        // 按视图管理图层的方法
        setViewLayers(viewId, layers) { 
            this.viewLayers[viewId] = layers;
            // 如果是当前激活视图，同时更新全局layers
            if (viewId === this.activeViewId) {
                this.layers = layers;
            }
        },
        getViewLayers(viewId) { 
            return this.viewLayers[viewId] || [];
        },
        addLayerToView(viewId, layer) {
            if (!this.viewLayers[viewId]) {
                this.viewLayers[viewId] = [];
            }
            this.viewLayers[viewId].push(layer);
            // 如果是当前激活视图，同时更新全局layers
            if (viewId === this.activeViewId) {
                this.layers = [...this.viewLayers[viewId]];
            }
        },
        removeLayerFromView(viewId, layerId) {
            if (this.viewLayers[viewId]) {
                this.viewLayers[viewId] = this.viewLayers[viewId].filter(layer => layer.id !== layerId);
                // 如果是当前激活视图，同时更新全局layers
                if (viewId === this.activeViewId) {
                    this.layers = [...this.viewLayers[viewId]];
                }
            }
        },
        // 按视图管理图层组的方法
        setViewLayerGroups(viewId, groups) {
            this.viewLayerGroups[viewId] = groups;
            // 如果是当前激活视图，同时更新全局layerGroups
            if (viewId === this.activeViewId) {
                this.layerGroups = groups;
            }
        },
        getViewLayerGroups(viewId) {
            return this.viewLayerGroups[viewId] || [];
        },
        // 产品数据相关方法
        setProductData(data) { this.productData = data; },
        setLoadingProductData(loading) { this.isLoadingProductData = loading; },
        setProductDataError(error) { this.productDataError = error; },
        // 视图相关方法
        setViews(views) { this.views = views; },
        setActiveViewId(viewId) { 
            this.activeViewId = viewId;
            // 切换视图时，更新当前显示的图层和图层组
            this.layers = this.viewLayers[viewId] || [];
            this.layerGroups = this.viewLayerGroups[viewId] || [];
        },
        addViewCanvas(viewId, canvas) { this.viewCanvases[viewId] = canvas; },
        removeViewCanvas(viewId) { delete this.viewCanvases[viewId]; },
        getActiveViewCanvas() { return this.viewCanvases[this.activeViewId]; },
        // 异步获取产品数据
        async fetchProductData(pwId) {
            this.setLoadingProductData(true);
            this.setProductDataError(null);
            try {
                const response = await axios.get(`/wp-json/pw/v1/product-data/${pwId}`);
                this.setProductData(response.data);
                console.log('产品数据获取成功:', response.data);
                // 从产品数据中提取视图信息
                this.extractViewsFromProductData(response.data);
                return response.data;
            } catch (error) {
                console.error('获取产品数据失败:', error);
                this.setProductDataError(error.message || '获取产品数据失败');
                throw error;
            } finally {
                this.setLoadingProductData(false);
            }
        },
        // 从产品数据中提取视图信息
        extractViewsFromProductData(productData) {
            const views = [];
            if (productData && productData.templates && productData.templates.data && productData.templates.data.custom_view) {
                const customView = productData.templates.data.custom_view;
                
                // 添加主视图
                if (customView.main_custom_view) {
                    views.push({
                        id: 'main_view',
                        name: customView.main_custom_view.view_name || 'Main View',
                        data: customView.main_custom_view
                    });
                }
                
                // 添加子视图
                if (Array.isArray(customView.sub_custom_view)) {
                    customView.sub_custom_view.forEach((subView, index) => {
                        views.push({
                            id: `sub_view_${index}`,
                            name: subView.view_name || `Sub View ${index + 1}`,
                            data: subView
                        });
                    });
                }
            }
            
            this.setViews(views);
            // 默认激活第一个视图
            if (views.length > 0) {
                this.setActiveViewId(views[0].id);
            }
            
            console.log('提取的视图信息:', views);
        }
    },
});

// 5. 创建 Pinia 实例，后续所有 Vue 应用都要 use(pinia) 才能访问全局状态
export const pinia = createPinia();

// 6. 将 store 暴露到全局，让非 Vue 组件也能访问
window.useCanvasStore = useCanvasStore;
