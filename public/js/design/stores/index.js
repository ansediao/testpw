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
        // 预期发货日期
        estimatedDeliveryDate: '2024-12-31',
        // 预期到货日期
        estimatedArrivalDate: '2025-01-15',


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
            const previousViewId = this.activeViewId;
            
            // 如果切换到相同视图，直接返回
            if (previousViewId === viewId) {
                return;
            }
            
            // 保存当前视图的图层数据
            if (previousViewId && this.layers.length > 0) {
                this.viewLayers[previousViewId] = [...this.layers];
            }
            if (previousViewId && this.layerGroups.length > 0) {
                this.viewLayerGroups[previousViewId] = [...this.layerGroups];
            }
            
            // 切换到新视图
            this.activeViewId = viewId;
            
            // 加载新视图的图层数据
            this.layers = this.viewLayers[viewId] || [];
            this.layerGroups = this.viewLayerGroups[viewId] || [];
            
            console.log(`View switched: ${previousViewId} -> ${viewId}, layers count: ${this.layers.length}`);
        },
        // 异步获取产品数据
        async fetchProductData(pwId) {
            this.setLoadingProductData(true);
            this.setProductDataError(null);
            try {
                const response = await axios.get(`/wp-json/pw/v1/product-data/${pwId}`);
                this.setProductData(response.data);
                console.log('Product data retrieved successfully:', response.data);
                // 从产品数据中提取视图信息
                // this.extractViewsFromProductData(response.data);
                this.setViewsFromProductData(response.data);

                return response.data;
            } catch (error) {
                console.error('Failed to retrieve product data:', error);
                this.setProductDataError(error.message || 'Failed to retrieve product data');
                throw error;
            } finally {
                this.setLoadingProductData(false);
            }
        },
        // 更新预期日期
        updateEstimatedDates(deliveryDate, arrivalDate) {
            if (deliveryDate) this.estimatedDeliveryDate = deliveryDate;
            if (arrivalDate) this.estimatedArrivalDate = arrivalDate;
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
            
            console.log('Extracted view information:', views);
        },
        // 直接从 productData.templates.view 数组  中赋值
        setViewsFromProductData(productData) {
            console.log('=== setViewsFromProductData Debug Info ===');
            console.log('Complete productData:', productData);
            console.log('productData.templates:', productData?.templates);
            console.log('productData.templates.view:', productData?.templates?.view);
            
            // 检查数据结构是否正确
            if (!productData) {
                console.error('Error: productData is null or undefined');
                return;
            }
            
            if (!productData.templates) {
                console.error('Error: productData.templates is null or undefined');
                console.log('Available productData keys:', Object.keys(productData));
                return;
            }
            
            if (!productData.templates.views) {
                console.error('Error: productData.templates.views is null or undefined');
                console.log('Available templates keys:', Object.keys(productData.templates));
                return;
            }
            
            if (!Array.isArray(productData.templates.views)) {
                console.error('Error: productData.templates.view is not an array');
                console.log('Type of productData.templates.view:', typeof productData.templates.views);
                console.log('Value of productData.templates.view:', productData.templates.views);
                return;
            }
            
            console.log('View array length:', productData.templates.views.length);
            console.log('View array contents:', productData.templates.views);
            
            try {
                this.setViews(productData.templates.views);
                console.log('Successfully set views');
                
                // 默认激活第一个视图
                if (productData.templates.views.length > 0) {
                    const firstView = productData.templates.views[0];
                    console.log('First view:', firstView);
                    console.log('First view ID:', firstView?.id);
                    
                    if (firstView && firstView.id) {
                        this.setActiveViewId(firstView.id);
                        console.log('Successfully set active view ID:', firstView.id);
                    } else {
                        console.error('Error: First view does not have an id property');
                    }
                } else {
                    console.warn('Warning: No views available to activate');
                }
            } catch (error) {
                console.error('Error in setViewsFromProductData:', error);
                console.error('Error stack:', error.stack);
            }
            
            console.log('=== End setViewsFromProductData Debug Info ===');
        }

        


    },
});

// 5. 创建 Pinia 实例，后续所有 Vue 应用都要 use(pinia) 才能访问全局状态
export const pinia = createPinia();

// 6. 导入打印方式store
import { usePrintMethodStore } from './printMethodStore.js';

// 7. 重新导出打印方式store
export { usePrintMethodStore };

// 8. 将 store 暴露到全局，让非 Vue 组件也能访问
window.useCanvasStore = useCanvasStore;
window.usePrintMethodStore = usePrintMethodStore;

// 9. 通知其他脚本stores已准备就绪
let eventTriggered = false;

const triggerReadyEvent = () => {
    if (eventTriggered) {
        return;
    }
    
    // 触发自定义事件，通知其他脚本 Pinia 已准备就绪
    document.dispatchEvent(new CustomEvent('canvasPiniaReady', {
        detail: {
            pinia,
            useCanvasStore: window.useCanvasStore,
            usePrintMethodStore: window.usePrintMethodStore
        }
    }));
    
    eventTriggered = true;
};

document.addEventListener('DOMContentLoaded', triggerReadyEvent);

// 如果DOM已经加载完成，立即触发
if (document.readyState === 'loading') {
    // DOM还在加载中，等待DOMContentLoaded事件
} else {
    // DOM已经加载完成，立即触发
    setTimeout(triggerReadyEvent, 0);
}
