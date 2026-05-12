// src/store/index.js

// 1. 引入 Pinia 的核心方法
// Pinia 是 Vue 官方推荐的状态管理库，用于管理全局数据（类似于 Vuex，但更轻量易用）
const { createPinia, defineStore } = window.Pinia;

const pwcaDecodePromowaresUnicodeText = (value) => {
    if (typeof value !== 'string' || value === '') {
        return value;
    }

    try {
        const decodeHex = (hex) => String.fromCharCode(parseInt(hex, 16));

        let normalized = value.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) =>
            decodeHex(hex)
        );

        if (/^(?:u[0-9a-fA-F]{4})+$/.test(normalized)) {
            return normalized.replace(/u([0-9a-fA-F]{4})/g, (match, hex) =>
                decodeHex(hex)
            );
        }

        return normalized.replace(/(^|[^0-9A-Za-z_\\])u([0-9a-fA-F]{4})/g, (match, prefix, hex) =>
            prefix + decodeHex(hex)
        );
    } catch (error) {
        return value;
    }
};

const pwcaNormalizeTemplateViewNames = (productData) => {
    if (!productData || !productData.templates) {
        return productData;
    }

    const templates = productData.templates;

    if (Array.isArray(templates.views)) {
        templates.views = templates.views.map((view) => ({
            ...view,
            view_name: pwcaDecodePromowaresUnicodeText(view && view.view_name),
            name: pwcaDecodePromowaresUnicodeText(view && view.name)
        }));
    }

    const customView = templates.data && templates.data.custom_view;
    if (!customView) {
        return productData;
    }

    if (customView.main_custom_view) {
        customView.main_custom_view = {
            ...customView.main_custom_view,
            view_name: pwcaDecodePromowaresUnicodeText(customView.main_custom_view.view_name)
        };
    }

    if (Array.isArray(customView.sub_custom_view)) {
        customView.sub_custom_view = customView.sub_custom_view.map((view) => ({
            ...view,
            view_name: pwcaDecodePromowaresUnicodeText(view && view.view_name)
        }));
    }

    return productData;
};

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
        // ===== 状态恢复标记 =====
        // 标记是否正在恢复状态，防止循环保存
        isRestoringState: false,
        // 产品数据相关状态
        productData: null,      // 存储从API获取的产品数据
        isLoadingProductData: false, // 产品数据加载状态
        productDataError: null, // 产品数据加载错误信息
        // 视图相关状态
        views: [],              // 存储所有视图信息
        activeView: null,       // 当前激活的视图对象
        activeViewId: null,     // 当前激活的视图ID
        productViewFlow: null,  // 产品视图流程类型，来自 productData.templates.views[0].view_flow
        // ===== 新增：按视图记录用户选择的颜色（来源于 variants.data 的颜色） =====
        // 结构：{ [viewId]: 完整的变体对象 (包含API返回的所有字段) + selectedColor }
        selectedColorsByView: {},
        // ===== 使用 VueUse useStorage 持久化存储用户偏好设置 =====
        // 通过 CDN 引入的 VueUse 功能，正确的访问方式是 window.VueUse
        // 持久化存储用户的设计偏好，如画布背景色、网格显示等
        userPreferences: window.VueUse && window.VueUse.useStorage ? window.VueUse.useStorage('pwca-user-preferences', {
            canvasBackgroundColor: '#ffffff',
            showGrid: true,
            gridSize: 20,
            showPrintArea: true,
            zoomLevel: 100,
            language: 'en'
        }) : {
            canvasBackgroundColor: '#ffffff',
            showGrid: true,
            gridSize: 20,
            showPrintArea: true,
            zoomLevel: 100,
            language: 'en'
        },
        // 使用 VueUse useStorage 持久化存储 所有视图main的tojson数据 名字中要包含产品id
        canvasStatesByProductId: window.VueUse && window.VueUse.useStorage ? window.VueUse.useStorage('pwca-canvas-states-by-product-id', {}) : {},

    }),
    // 4. getters 定义依赖状态的计算逻辑（所有依赖 Store 状态的计算放在这里）
    getters: {
        // 原始开关值
        moqItemsDesignRaw: (state) => state.productData && state.productData.customization_settings && state.productData.customization_settings.data
            ? state.productData.customization_settings.data.moq_items_design
            : undefined,
        // 标准化布尔：只要不是 false/0/'false'/'0'/null/undefined 即认为开启
        moqItemsDesignEnabled() {
            const raw = this.moqItemsDesignRaw;
            return !(raw === false || raw === 0 || raw === 'false' || raw === '0' || raw === null || raw === undefined);
        },
        // 是否任意视图存在被分组的图层（依据 layer.groupId）
        hasAnyGroupedLayersAcrossViews() {
            try {
                const viewIds = Object.keys(this.viewLayers || {});
                for (const vid of viewIds) {
                    const layers = typeof this.getViewLayers === 'function' ? this.getViewLayers(vid) : (this.viewLayers[vid] || []);
                    if (layers && layers.some(l => l && l.groupId)) return true;
                }
                if (Array.isArray(this.views)) {
                    for (const v of this.views) {
                        const vid = v && v.id;
                        if (!vid) continue;
                        const layers = typeof this.getViewLayers === 'function' ? this.getViewLayers(vid) : ((this.viewLayers && this.viewLayers[vid]) || []);
                        if (layers && layers.some(l => l && l.groupId)) return true;
                    }
                }
            } catch (e) {
            }
            return false;
        },
        // 最终是否显示“按设计 MOQ”
        shouldShowMoqDesign() {
            return this.moqItemsDesignEnabled && this.hasAnyGroupedLayersAcrossViews;
        },
        
        // 原始开关值（Color）
        moqItemsColorRaw: (state) => state.productData && state.productData.customization_settings && state.productData.customization_settings.data
            ? state.productData.customization_settings.data.moq_items_color
            : undefined,
        // 标准化布尔：与 moq_items_design 规则一致
        moqItemsColorEnabled() {
            const raw = this.moqItemsColorRaw;
            return !(raw === false || raw === 0 || raw === 'false' || raw === '0' || raw === null || raw === undefined);
        },
        // 最终是否显示“按颜色 MOQ”
        shouldShowMoqColor() {
            return this.moqItemsColorEnabled;
        },
        // ===== 新增：获取颜色选择状态 =====
        // 获取指定视图下的颜色选择
        getSelectedColorByView: (state) => (viewId) => {
            return state.selectedColorsByView[viewId] || null;
        },
        // 获取当前激活视图下的颜色选择
        currentViewSelectedColor(state) {
            const vid = this.activeViewId;
            if (!vid) return null;
            return state.selectedColorsByView[vid] || null;
        },
        
        // ===== 新增：计算各视图 rts_for_bulk_order 最大值相加 =====
        // 获取所有视图中 rts_for_bulk_order 的最大值相加
        getTotalMaxRtsForBulkOrder: (state) => {
            let total = 0;
            const colorsMap = state.selectedColorsByView || {};
            for (const viewId in colorsMap) {
                if (!Object.prototype.hasOwnProperty.call(colorsMap, viewId)) continue;
                const colorData = colorsMap[viewId];
                if (!colorData) continue;
                const rtsValue = Number(colorData.rts_for_bulk_order);
                if (Number.isFinite(rtsValue) && rtsValue > 0) {
                    total += rtsValue;
                }
            }
            return total;
        },
        
        // ===== 新增：计算各视图 rts_for_sample_order 最大值相加 =====
        // 获取所有视图中 rts_for_sample_order 的最大值相加
        getTotalMaxRtsForSampleOrder: (state) => {
            let total = 0;
            const colorsMap = state.selectedColorsByView || {};
            for (const viewId in colorsMap) {
                if (!Object.prototype.hasOwnProperty.call(colorsMap, viewId)) continue;
                const colorData = colorsMap[viewId];
                if (!colorData) continue;
                const rtsValue = Number(colorData.rts_for_sample_order);
                if (Number.isFinite(rtsValue) && rtsValue > 0) {
                    total += rtsValue;
                }
            }
            return total;
        },
        
        // ===== 用户偏好设置相关的 getter 方法 =====
        // 获取用户偏好设置
        getUserPreferences: (state) => {
            return state.userPreferences;
        },
        // 获取画布背景色
        getCanvasBackgroundColor: (state) => {
            return state.userPreferences.canvasBackgroundColor;
        },
        // 获取是否显示网格
        getShowGrid: (state) => {
            return state.userPreferences.showGrid;
        },
        // 获取网格大小
        getGridSize: (state) => {
            return state.userPreferences.gridSize;
        },
        // 获取是否显示打印区域
        getShowPrintArea: (state) => {
            return state.userPreferences.showPrintArea;
        },
        // 获取缩放级别
        getZoomLevel: (state) => {
            return state.userPreferences.zoomLevel;
        },
        // 获取语言设置
        getLanguage: (state) => {
            return state.userPreferences.language;
        },
    },
    // 5. actions 定义所有修改 state 的方法（类似于 class 的成员方法）
    actions: {
        // ===== 状态恢复相关方法 =====
        // 设置状态恢复标记
        setRestoringState(value) {
            this.isRestoringState = value;
        },
        // 批量设置视图数据（用于状态恢复）
        restoreViewData(viewId, { layers, layerGroups }) {
            this.viewLayers[viewId] = layers || [];
            this.viewLayerGroups[viewId] = layerGroups || [];
            // 如果是当前激活视图，同时更新全局 layers 和 layerGroups
            if (viewId === this.activeViewId) {
                this.layers = layers || [];
                this.layerGroups = layerGroups || [];
            }
        },
        // 强制同步当前视图的图层数据到全局状态（用于状态恢复后的同步）
        syncCurrentViewToGlobal() {
            if (this.activeViewId) {
                this.layers = this.viewLayers[this.activeViewId] || [];
                this.layerGroups = this.viewLayerGroups[this.activeViewId] || [];
            }
        },
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
        setActiveView(view) {
            this.activeView = view;
            // 直接设置activeViewId，不调用setActiveViewId方法
            if (view && view.id) {
                this.activeViewId = view.id;
            }
        },
        setProductViewFlow(viewFlow) { this.productViewFlow = viewFlow; },
        getProductViewFlow() {
            // 如果已经设置了值，直接返回
            if (this.productViewFlow !== null) {
                return this.productViewFlow;
            }
            // 否则尝试从 productData 中获取
            if (this.productData &&
                this.productData.templates &&
                this.productData.templates.views &&
                this.productData.templates.views.length > 0 &&
                this.productData.templates.views[0].view_flow) {
                return this.productData.templates.views[0].view_flow;
            }
            return null;
        },
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

            // 根据viewId查找对应的视图对象并设置为activeView
            const viewObject = this.views.find(view => view.id === viewId);
            if (viewObject) {
                this.activeView = viewObject;
            }

            // 加载新视图的图层数据
            this.layers = this.viewLayers[viewId] || [];
            this.layerGroups = this.viewLayerGroups[viewId] || [];

            // 切换视图时，同步对应的打印方式数据
            const printMethodStore = window.usePrintMethodStore();
            if (printMethodStore) {
                printMethodStore.switchToViewPrintMethods(viewId);
            }

            // 切换视图时，触发画布状态保存/恢复
            if (window.canvasStateIntegration && typeof window.canvasStateIntegration.handleViewSwitch === 'function') {
                window.canvasStateIntegration.handleViewSwitch(previousViewId, viewId);
            }
            
        },
        // ===== 新增：颜色选择相关方法 =====
        // 设置指定视图的选中颜色
        setSelectedColorByView(viewId, colorData) {
            this.selectedColorsByView[viewId] = colorData;
        },
        // 清除指定视图的选中颜色
        clearSelectedColorByView(viewId) {
            delete this.selectedColorsByView[viewId];
        },
        // 清除所有视图的选中颜色
        clearAllSelectedColors() {
            this.selectedColorsByView = {};
        },
        // ===== 用户偏好设置相关方法 =====
        // 更新用户偏好设置
        updateUserPreferences(preferences) {
            this.userPreferences = { ...this.userPreferences, ...preferences };
        },
        // 更新单个偏好设置
        updateSinglePreference(key, value) {
            this.userPreferences[key] = value;
        },
        // 重置用户偏好设置到默认值
        resetUserPreferences() {
            const defaultPreferences = {
                canvasBackgroundColor: '#ffffff',
                showGrid: true,
                gridSize: 20,
                showPrintArea: true,
                zoomLevel: 100,
                language: 'en'
            };
            // 使用与state中相同的VueUse useStorage访问方式
            this.userPreferences = window.VueUse && window.VueUse.useStorage ? window.VueUse.useStorage('pwca-user-preferences', defaultPreferences) : defaultPreferences;
        },
        // 异步获取产品数据
        async fetchProductData(pwId) {
            this.setLoadingProductData(true);
            this.setProductDataError(null);
            try {
                const response = await fetch(`/wp-json/pw/v1/product-data/${pwId}`);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                pwcaNormalizeTemplateViewNames(data);

                try {
                    const headerValue = response.headers.get('x-pw-cache') || response.headers.get('X-PW-Cache');
                    if (headerValue && String(headerValue).toUpperCase() === 'HIT') {
                        // eslint-disable-next-line no-console
                        console.info('[PW Canvas] 使用缓存的产品数据', { pwId });
                    }
                } catch (e) {
                }

                this.setProductData(data);
                // 从产品数据中提取视图信息
                // this.extractViewsFromProductData(data);
                this.setViewsFromProductData(data);

                return data;
            } catch (error) {
                this.setProductDataError(error.message || 'Failed to retrieve product data');
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

            
        },
        // 直接从 productData.templates.view 数组  中赋值
        setViewsFromProductData(productData) {
            

            // 检查数据结构是否正确
            if (!productData) {
                return;
            }

            if (!productData.templates) {
                
                return;
            }

            if (!productData.templates.views) {
                
                return;
            }

            if (!Array.isArray(productData.templates.views)) {
                
                return;
            }

            

            try {
                this.setViews(productData.templates.views);

                // 设置 productViewFlow
                if (productData.templates.views.length > 0 && productData.templates.views[0].view_flow) {
                    this.setProductViewFlow(productData.templates.views[0].view_flow);
                }

                // 为每个视图加载印刷方式数据
                this.loadPrintMethodsForAllViews();

                // 默认激活第一个视图
                if (productData.templates.views.length > 0) {
                    const firstView = productData.templates.views[0];

                    if (firstView && firstView.id) {
                        this.setActiveViewId(firstView.id);
                    } else {
                    }
                } else {
                    
                }
            } catch (error) {
            }

            
        },

        // 为所有视图加载印刷方式数据
        async loadPrintMethodsForAllViews() {
            const printMethodStore = window.usePrintMethodStore();
            if (!printMethodStore) {
                return;
            }

            for (const view of this.views) {
                if (view.printing_method_list_id && Array.isArray(view.printing_method_list_id) && view.printing_method_list_id.length > 0) {
                    
                    await printMethodStore.setViewPrintMethods(view.id, view.printing_method_list_id);
                } else {
                    
                }
            }
        }




    },
});

// 5. 创建 Pinia 实例，后续所有 Vue 应用都要 use(pinia) 才能访问全局状态
export const pinia = createPinia();
window.pinia = pinia;

// 6. 导入打印方式store
import { usePrintMethodStore } from './printMethodStore.js';

// 7. 重新导出打印方式store
export { usePrintMethodStore };

// 8. 将 store 暴露到全局，让非 Vue 组件也能访问
window.useCanvasStore = useCanvasStore;
window.usePrintMethodStore = usePrintMethodStore;

const useDesignUsageStore = defineStore('designUsage', {
    state: () => ({
        items: [],
        feePerItem: 7
    }),
    getters: {
        totalFee(state) {
            let total = 0;
            for (const it of state.items) {
                const q = Number(it.quantity || 0);
                if (Number.isFinite(q) && q > 0) {
                    total += q * state.feePerItem;
                }
            }
            return total;
        },
        list(state) {
            return state.items;
        }
    },
    actions: {
        addDesign(payload) {
            const id = payload && payload.id ? String(payload.id) : '';
            const name = payload && payload.name ? String(payload.name) : '';
            const image = payload && payload.image ? String(payload.image) : '';
            const sku = payload && payload.sku ? String(payload.sku) : '';
            let found = null;
            for (const it of this.items) {
                if ((id && it.id === id) || (!id && image && it.image === image)) {
                    found = it;
                    break;
                }
            }
            if (found) {
                found.quantity = (Number(found.quantity || 0) + 1);
                if (!found.sku && sku) found.sku = sku;
            } else {
                this.items.push({ id, name, image, sku, quantity: 1 });
            }
        },
        removeDesign(payload) {
            const id = payload && payload.id ? String(payload.id) : '';
            const image = payload && payload.image ? String(payload.image) : '';
            for (let i = 0; i < this.items.length; i++) {
                const it = this.items[i];
                const match = (id && it.id === id) || (!id && image && it.image === image);
                if (match) {
                    const nextQty = Number(it.quantity || 0) - 1;
                    if (nextQty > 0) {
                        it.quantity = nextQty;
                    } else {
                        this.items.splice(i, 1);
                    }
                    break;
                }
            }
        },
        clear() {
            this.items = [];
        }
    }
});
export { useDesignUsageStore };
window.useDesignUsageStore = useDesignUsageStore;

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
