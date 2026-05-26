/**
 * Canvas State Integration Module
 * 画布状态集成模块 - 负责将 CanvasStateManager 集成到现有系统
 * 
 * 功能：
 * - 在页面初始化时初始化 CanvasStateManager
 * - 监听画布变更事件并触发保存
 * - 监听视图切换并保存/恢复状态
 * - 监听图层和图层组变更
 * - 监听印刷方式变更
 * - 监听颜色选择变更
 * 
 * @requires CanvasStateManager (./canvas-state-manager.js)
 * @requires Pinia stores (useCanvasStore, usePrintMethodStore)
 * @requires CanvasManager (window.CanvasManager)
 */

import { canvasStateManager, ErrorHandler } from './canvas-state-manager.js';

function pwcaGetUiStateAccess() {
    return window.pwcaUiStateAccess || null;
}

function pwcaGetCanvasStore() {
    const uiStateAccess = pwcaGetUiStateAccess();
    if (uiStateAccess && typeof uiStateAccess.getCanvasStore === 'function') {
        return uiStateAccess.getCanvasStore();
    }

    return window.useCanvasStore ? window.useCanvasStore() : null;
}

function pwcaGetPrintMethodStore() {
    const uiStateAccess = pwcaGetUiStateAccess();
    if (uiStateAccess && typeof uiStateAccess.getPrintMethodStore === 'function') {
        return uiStateAccess.getPrintMethodStore();
    }

    return window.usePrintMethodStore ? window.usePrintMethodStore() : null;
}

function pwcaGetViews() {
    const uiStateAccess = pwcaGetUiStateAccess();
    if (uiStateAccess && typeof uiStateAccess.getViews === 'function') {
        return uiStateAccess.getViews();
    }

    const canvasStore = pwcaGetCanvasStore();
    return canvasStore && Array.isArray(canvasStore.views) ? canvasStore.views : [];
}

function pwcaGetActiveViewId() {
    const uiStateAccess = pwcaGetUiStateAccess();
    if (uiStateAccess && typeof uiStateAccess.getActiveViewId === 'function') {
        return uiStateAccess.getActiveViewId();
    }

    const canvasStore = pwcaGetCanvasStore();
    return canvasStore && canvasStore.activeViewId ? canvasStore.activeViewId : null;
}

function pwcaGetCanvasByViewId(viewId) {
    const uiStateAccess = pwcaGetUiStateAccess();
    if (uiStateAccess && typeof uiStateAccess.getCanvasByViewId === 'function') {
        return uiStateAccess.getCanvasByViewId(viewId);
    }

    return window.CanvasManager ? window.CanvasManager.getCanvas(viewId) : null;
}

function pwcaIsCanvasStateRestoring() {
    const canvasStore = pwcaGetCanvasStore();
    return !!(canvasStore && canvasStore.isRestoringState);
}

/**
 * 画布状态集成类
 * 负责将 CanvasStateManager 与现有系统集成
 */
class CanvasStateIntegration {
    constructor() {
        /**
         * 是否已初始化
         * @type {boolean}
         */
        this.initialized = false;
        
        /**
         * 画布事件监听器引用（用于清理）
         * @type {Map<string, Array<{event: string, handler: Function}>>}
         */
        this.canvasListeners = new Map();
        
        /**
         * Store watcher 停止函数
         * @type {Array<Function>}
         */
        this.storeWatchers = [];
        
        /**
         * 防抖定时器
         * @type {Object}
         */
        this.debounceTimers = {
            layers: null,
            layerGroups: null,
            printMethods: null,
            colors: null
        };
        
        /**
         * 防抖延迟时间（毫秒）
         * @type {number}
         */
        this.DEBOUNCE_MS = 300;
    }
    
    /**
     * 初始化集成模块
     * 在 multiViewInitComplete 事件后调用
     */
    async init() {
        if (this.initialized) {
            ErrorHandler.logWarning('CanvasStateIntegration 已经初始化');
            return;
        }
        
        try {
            // 1. 初始化 CanvasStateManager
            const initSuccess = canvasStateManager.init();
            if (!initSuccess) {
                ErrorHandler.logWarning('CanvasStateManager 初始化失败，状态持久化功能将被禁用');
                return;
            }

            // 如果处于“从购物车编辑”模式，则初始状态由外部数据驱动，
            // 在此阶段跳过从本地存储恢复，后续通过 applyExternalState 处理。
            const skipInitialRestore = typeof window !== 'undefined' && window.pwcaCanvasEditFromCart === true;
            
            // 2. 尝试恢复已保存的状态（非购物车编辑模式）
            if (!skipInitialRestore) {
                // await this._restoreAllViewStates();
            } else {
                ErrorHandler.logInfo('检测到购物车编辑模式，初始画布状态将由外部数据恢复，跳过本地存储恢复');
            }
            
            // 3. 设置画布事件监听
            this._setupCanvasEventListeners();
            
            // 4. 设置 Store watchers
            this._setupStoreWatchers();
            
            // 5. 将实例挂载到 window 对象
            window.canvasStateIntegration = this;
            
            this.initialized = true;
            ErrorHandler.logInfo('CanvasStateIntegration 初始化成功');
            
            // 触发初始化完成事件
            document.dispatchEvent(new CustomEvent('canvasStateIntegrationReady', {
                detail: { canvasStateManager, integration: this }
            }));
        } catch (error) {
            ErrorHandler.logError('INIT_ERROR', 'CanvasStateIntegration 初始化失败', error);
        }
    }
    
    /**
     * 恢复所有视图的状态
     * @private
     */
    async _restoreAllViewStates() {
        try {
            const canvasStore = pwcaGetCanvasStore();
            const views = pwcaGetViews();
            if (!canvasStore || views.length === 0) {
                ErrorHandler.logInfo('没有视图需要恢复状态');
                return;
            }
            
            // 获取存储的状态
            const state = canvasStateManager.getState();
            if (!state || !state.views || Object.keys(state.views).length === 0) {
                ErrorHandler.logInfo('没有已保存的状态需要恢复');
                return;
            }
            
            // 恢复每个视图的状态
            for (const view of views) {
                if (state.views[view.id]) {
                    ErrorHandler.logInfo('正在恢复视图状态:', view.id);
                    await canvasStateManager.restoreViewState(view.id);
                }
            }
            
            // 恢复完成后，同步当前激活视图的数据到全局状态
            // 这确保了 layers.js 组件中使用的全局 layers 和 layerGroups 是最新的
            if (typeof canvasStore.syncCurrentViewToGlobal === 'function') {
                canvasStore.syncCurrentViewToGlobal();
                ErrorHandler.logInfo('已同步当前视图数据到全局状态');
            }
            
            ErrorHandler.logInfo('所有视图状态恢复完成');
        } catch (error) {
            ErrorHandler.logError('RESTORE_ERROR', '恢复视图状态失败', error);
        }
    }
    
    /**
     * 设置画布事件监听器
     * 监听 object:added、object:modified、object:removed 事件
     * @private
     */
    _setupCanvasEventListeners() {
        try {
            const views = pwcaGetViews();
            if (views.length === 0) {
                ErrorHandler.logWarning('无法获取视图列表，跳过画布事件监听设置');
                return;
            }
            
            // 为每个视图的画布设置事件监听
            views.forEach(view => {
                this._setupCanvasListenersForView(view.id);
            });
            
            ErrorHandler.logInfo('画布事件监听器设置完成');
        } catch (error) {
            ErrorHandler.logError('INIT_ERROR', '设置画布事件监听器失败', error);
        }
    }
    
    /**
     * 为指定视图设置画布事件监听器
     * @param {string} viewId - 视图ID
     * @private
     */
    _setupCanvasListenersForView(viewId) {
        const canvas = pwcaGetCanvasByViewId(viewId);
        if (!canvas) {
            ErrorHandler.logWarning('无法获取画布实例，viewId:', viewId);
            return;
        }
        
        // 创建防抖保存处理函数
        const debouncedSave = (e) => {
            // 检查是否正在恢复状态
            if (pwcaIsCanvasStateRestoring()) {
                return;
            }
            
            // 使用 CanvasStateManager 的防抖保存
            canvasStateManager.debouncedSaveViewState(viewId);
        };
        
        // 监听画布事件
        const events = ['object:added', 'object:modified', 'object:removed'];
        const listeners = [];
        
        events.forEach(eventName => {
            canvas.on(eventName, debouncedSave);
            listeners.push({ event: eventName, handler: debouncedSave });
        });
        
        // 保存监听器引用以便后续清理
        this.canvasListeners.set(viewId, listeners);
    }
    
    /**
     * 设置 Store watchers
     * 监听图层、图层组、印刷方式和颜色选择的变化
     * @private
     */
    _setupStoreWatchers() {
        try {
            // 检查 Vue 是否可用
            if (!window.Vue || !window.Vue.watch) {
                ErrorHandler.logWarning('Vue.watch 不可用，跳过 Store watcher 设置');
                return;
            }
            
            const { watch } = window.Vue;
            
            // 获取 stores
            const canvasStore = pwcaGetCanvasStore();
            const printMethodStore = pwcaGetPrintMethodStore();
            
            if (!canvasStore) {
                ErrorHandler.logWarning('Canvas Store 不可用，跳过 watcher 设置');
                return;
            }
            
            // 1. 监听 viewLayers 变化
            const stopLayersWatcher = watch(
                () => canvasStore.viewLayers,
                (newVal, oldVal) => {
                    this._handleLayersChange(newVal);
                },
                { deep: true }
            );
            this.storeWatchers.push(stopLayersWatcher);
            
            // 2. 监听 viewLayerGroups 变化
            const stopLayerGroupsWatcher = watch(
                () => canvasStore.viewLayerGroups,
                (newVal, oldVal) => {
                    this._handleLayerGroupsChange(newVal);
                },
                { deep: true }
            );
            this.storeWatchers.push(stopLayerGroupsWatcher);
            
            // 3. 监听 selectedColorsByView 变化
            const stopColorsWatcher = watch(
                () => canvasStore.selectedColorsByView,
                (newVal, oldVal) => {
                    this._handleColorSelectionsChange(newVal);
                },
                { deep: true }
            );
            this.storeWatchers.push(stopColorsWatcher);
            
            // 4. 监听印刷方式映射变化
            if (printMethodStore) {
                const stopLayerPrintMethodWatcher = watch(
                    () => printMethodStore.layerPrintMethodMap,
                    (newVal, oldVal) => {
                        this._handlePrintMethodMappingsChange();
                    },
                    { deep: true }
                );
                this.storeWatchers.push(stopLayerPrintMethodWatcher);
                
                const stopGroupPrintMethodWatcher = watch(
                    () => printMethodStore.groupPrintMethodMap,
                    (newVal, oldVal) => {
                        this._handlePrintMethodMappingsChange();
                    },
                    { deep: true }
                );
                this.storeWatchers.push(stopGroupPrintMethodWatcher);
            }
            
            ErrorHandler.logInfo('Store watchers 设置完成');
        } catch (error) {
            ErrorHandler.logError('INIT_ERROR', '设置 Store watchers 失败', error);
        }
    }
    
    /**
     * 处理图层变化
     * @param {Object} viewLayers - 按视图分组的图层数据
     * @private
     */
    _handleLayersChange(viewLayers) {
        // 检查是否正在恢复状态
        if (pwcaIsCanvasStateRestoring()) {
            return;
        }
        
        // 防抖处理
        if (this.debounceTimers.layers) {
            clearTimeout(this.debounceTimers.layers);
        }
        
        this.debounceTimers.layers = setTimeout(() => {
            const activeViewId = pwcaGetActiveViewId();
            if (activeViewId) {
                canvasStateManager.debouncedSaveViewState(activeViewId);
            }
        }, this.DEBOUNCE_MS);
    }
    
    /**
     * 处理图层组变化
     * @param {Object} viewLayerGroups - 按视图分组的图层组数据
     * @private
     */
    _handleLayerGroupsChange(viewLayerGroups) {
        // 检查是否正在恢复状态
        if (pwcaIsCanvasStateRestoring()) {
            return;
        }
        
        // 防抖处理
        if (this.debounceTimers.layerGroups) {
            clearTimeout(this.debounceTimers.layerGroups);
        }
        
        this.debounceTimers.layerGroups = setTimeout(() => {
            const activeViewId = pwcaGetActiveViewId();
            if (activeViewId) {
                canvasStateManager.debouncedSaveViewState(activeViewId);
            }
        }, this.DEBOUNCE_MS);
    }
    
    /**
     * 处理印刷方式映射变化
     * @private
     */
    _handlePrintMethodMappingsChange() {
        // 检查是否正在恢复状态
        if (pwcaIsCanvasStateRestoring()) {
            return;
        }
        
        // 防抖处理
        if (this.debounceTimers.printMethods) {
            clearTimeout(this.debounceTimers.printMethods);
        }
        
        this.debounceTimers.printMethods = setTimeout(() => {
            const activeViewId = pwcaGetActiveViewId();
            if (activeViewId) {
                canvasStateManager.debouncedSaveViewState(activeViewId);
            }
        }, this.DEBOUNCE_MS);
    }
    
    /**
     * 处理颜色选择变化
     * @param {Object} selectedColorsByView - 按视图分组的颜色选择数据
     * @private
     */
    _handleColorSelectionsChange(selectedColorsByView) {
        // 检查是否正在恢复状态
        if (pwcaIsCanvasStateRestoring()) {
            return;
        }
        
        // 防抖处理
        if (this.debounceTimers.colors) {
            clearTimeout(this.debounceTimers.colors);
        }
        
        this.debounceTimers.colors = setTimeout(() => {
            canvasStateManager.saveColorSelections();
        }, this.DEBOUNCE_MS);
    }
    
    /**
     * 处理视图切换
     * 在切换前保存当前视图状态，切换后恢复目标视图状态
     * @param {string} previousViewId - 前一个视图ID
     * @param {string} newViewId - 新视图ID
     */
    async handleViewSwitch(previousViewId, newViewId) {
        try {
            // 检查是否正在恢复状态
            if (pwcaIsCanvasStateRestoring()) {
                return;
            }
            
            // 1. 保存前一个视图的状态
            if (previousViewId) {
                canvasStateManager.saveViewState(previousViewId);
            }
            
            // 2. 恢复新视图的状态（如果有）
            if (newViewId) {
                const state = canvasStateManager.getState();
                if (state && state.views && state.views[newViewId]) {
                    await canvasStateManager.restoreViewState(newViewId);
                }
            }
        } catch (error) {
            ErrorHandler.logError('RESTORE_ERROR', '视图切换状态处理失败', error);
        }
    }
    
    /**
     * 清理资源
     * 移除所有事件监听器和 watchers
     */
    cleanup() {
        try {
            // 1. 移除画布事件监听器
            this.canvasListeners.forEach((listeners, viewId) => {
                const canvas = pwcaGetCanvasByViewId(viewId);
                if (canvas) {
                    listeners.forEach(({ event, handler }) => {
                        canvas.off(event, handler);
                    });
                }
            });
            this.canvasListeners.clear();
            
            // 2. 停止 Store watchers
            this.storeWatchers.forEach(stopFn => {
                if (typeof stopFn === 'function') {
                    stopFn();
                }
            });
            this.storeWatchers = [];
            
            // 3. 清除防抖定时器
            Object.values(this.debounceTimers).forEach(timer => {
                if (timer) {
                    clearTimeout(timer);
                }
            });
            
            this.initialized = false;
            ErrorHandler.logInfo('CanvasStateIntegration 资源已清理');
        } catch (error) {
            ErrorHandler.logError('CLEANUP_ERROR', '清理资源失败', error);
        }
    }
    
    /**
     * 使用外部状态（例如来自购物车的状态）覆盖当前画布状态并恢复到画布与 Store
     * @param {object} externalState - 外部提供的完整状态对象
     */
    async applyExternalState(externalState) {
        try {
            if (!externalState || typeof externalState !== 'object') {
                ErrorHandler.logWarning('applyExternalState: 外部状态无效，必须是对象');
                return;
            }

            if (!canvasStateManager.isInitialized()) {
                const ok = canvasStateManager.init();
                if (!ok) {
                    ErrorHandler.logWarning('applyExternalState: CanvasStateManager 初始化失败，无法应用外部状态');
                    return;
                }
            }

            const loaded = canvasStateManager.loadExternalState(externalState);
            if (!loaded) {
                ErrorHandler.logError('RESTORE_ERROR', 'applyExternalState: 加载外部画布状态失败');
                return;
            }

            // 使用新的状态恢复所有视图
            await this._restoreAllViewStates();
        } catch (error) {
            ErrorHandler.logError('RESTORE_ERROR', '应用外部画布状态失败', error);
        }
    }

    /**
     * 检查是否已初始化
     * @returns {boolean}
     */
    isInitialized() {
        return this.initialized;
    }
}

// 创建单例实例
const canvasStateIntegration = new CanvasStateIntegration();

// 监听 multiViewInitComplete 事件，自动初始化
document.addEventListener('multiViewInitComplete', () => {
    // 延迟初始化，确保所有画布和 stores 都已准备就绪
    setTimeout(() => {
        canvasStateIntegration.init();
    }, 500);
});

// 导出
export { CanvasStateIntegration, canvasStateIntegration };

// 挂载到全局对象
window.CanvasStateIntegration = CanvasStateIntegration;
window.canvasStateIntegration = canvasStateIntegration;
