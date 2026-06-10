// src/stores/canvas-state-store.js
// Canvas 画布状态 Store — 管理画布运行时状态、产品数据、视图、颜色选择

import { pwcaFetchCanvasProductData } from '../api/product-data-api.js';
import {
    pwcaClearSelectedColorByView,
    pwcaGetSelectedColorByView,
    pwcaGetTotalSelectedColorRts,
    pwcaNormalizeSelectedColorsByView,
    pwcaSetSelectedColorByView
} from './mappers/color-selection-mapper.js';
import { pwcaNormalizeViewRestorePayload } from './mappers/view-restore-mapper.js';
import { pwcaRebuildViewRestorePayload } from './mappers/view-state-rebuild-mapper.js';
import {
    pwcaBuildMergedLayerControls,
    pwcaBuildMergedViewCustomizationSettings,
    pwcaBuildViewsFromProductData,
    pwcaExtractStoreCustomizationSettings,
    pwcaIsFieldVisible,
    pwcaNormalizeModuleName,
    pwcaPrepareCanvasProductData,
    pwcaResolveDefaultTextFontFamily,
    pwcaResolveDefaultTextFontSize,
    pwcaResolveEnabledModules,
    pwcaResolveTextFontOptions
} from './mappers/product-data-mapper.js';
import { usePrintMethodStore } from './print-method-store.js';

const { createPinia, defineStore } = window.Pinia;

export const useCanvasStore = defineStore('canvas', {
    state: () => ({
        // ===== 画布运行时: canvas =====
        canvasStates: { canvas1: null, canvas2: null, canvas3: null },
        activeCanvasId: 'canvas1',
        // ===== 图层/对象: layers =====
        layers: [],
        viewLayers: {},
        activeObjectId: null,
        actionRequest: null,
        layerGroups: [],
        viewLayerGroups: {},
        activeGroupId: null,
        // ===== 状态恢复: restoring =====
        isRestoringState: false,
        // ===== 产品数据: product =====
        productData: null,
        isLoadingProductData: false,
        productDataError: '',
        // ===== 店铺定制配置: customization =====
        storeCustomizationSettings: null,
        hasStoreCustomizationSettings: false,
        storeCustomizationSettingsError: '',
        // ===== 视图管理: views =====
        views: [],
        activeView: null,
        activeViewId: null,
        productViewFlow: null,
        // ===== 颜色选择: colors =====
        selectedColorsByView: {},
        // ===== 用户偏好: preferences =====
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
        canvasStatesByProductId: window.VueUse && window.VueUse.useStorage ? window.VueUse.useStorage('pwca-canvas-states-by-product-id', {}) : {},

    }),
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
        // 是否任意视图存在被分组的图层（依赖 layer.groupId）
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
        // 最终是否显示"按设计 MOQ"
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
        // ===== 定制设置 ===== Sample Check / Inquiry Button 显示控制 =====
        showSampleCheck() {
            const computed = this.productData && this.productData.computed;
            if (!computed) return false;
            return Boolean(computed.blank_item);
        },
        showInquiryBtn() {
            const computed = this.productData && this.productData.computed;
            if (!computed) return false;
            return Boolean(computed.inquiry_button);
        },

        // ===== 获取颜色选择状态 =====
        getSelectedColorByView: (state) => (viewId) => {
            return pwcaGetSelectedColorByView(state.selectedColorsByView, viewId);
        },
        currentViewSelectedColor(state) {
            const vid = this.activeViewId;
            if (!vid) return null;
            return pwcaGetSelectedColorByView(state.selectedColorsByView, vid);
        },

        // ===== 计算各视图 rts_for_bulk_order 最大值相加 =====
        getTotalMaxRtsForBulkOrder: (state) => {
            return pwcaGetTotalSelectedColorRts(
                state.selectedColorsByView,
                'rts_for_bulk_order'
            );
        },

        // ===== 计算各视图 rts_for_sample_order 最大值相加 =====
        getTotalMaxRtsForSampleOrder: (state) => {
            return pwcaGetTotalSelectedColorRts(
                state.selectedColorsByView,
                'rts_for_sample_order'
            );
        },

        // 店铺级 customization settings 数据主体
        getStoreCustomizationSettingsData: (state) => {
            return pwcaExtractStoreCustomizationSettings(state.storeCustomizationSettings);
        },
        // 获取指定视图与店铺默认值合并后的最终配置
        getMergedViewCustomizationSettings: (state) => (viewId) => {
            const view = state.views.find((item) => item && item.id === viewId);
            return pwcaBuildMergedViewCustomizationSettings(
                view,
                state.storeCustomizationSettings
            );
        },
        // 获取当前激活视图与店铺默认值合并后的最终配置
        currentViewCustomizationSettings(state) {
            const view = state.views.find((item) => item && item.id === state.activeViewId);
            return pwcaBuildMergedViewCustomizationSettings(
                view,
                state.storeCustomizationSettings
            );
        },
        currentTextFontOptions() {
            return pwcaResolveTextFontOptions(this.currentViewCustomizationSettings);
        },
        currentDefaultTextFontFamily() {
            return pwcaResolveDefaultTextFontFamily(this.currentViewCustomizationSettings);
        },
        currentDefaultTextFontSize() {
            return pwcaResolveDefaultTextFontSize(this.currentViewCustomizationSettings);
        },
        // 当前视图最终启用模块：selected_modules > active_modules > 插件默认值
        currentViewEnabledModules() {
            return pwcaResolveEnabledModules(this.currentViewCustomizationSettings);
        },
        // 判断当前视图某模块是否启用
        isCurrentViewModuleEnabled() {
            return (moduleName) => {
                const normalizedModuleName = pwcaNormalizeModuleName(moduleName);
                if (!normalizedModuleName) {
                    return false;
                }

                return this.currentViewEnabledModules.includes(normalizedModuleName);
            };
        },
        // 获取指定视图的图层数据（只读）
        getViewLayers: (state) => (viewId) => {
            return state.viewLayers[viewId] || [];
        },
        // 获取指定视图的图层组数据（只读）
        getViewLayerGroups: (state) => (viewId) => {
            return state.viewLayerGroups[viewId] || [];
        },
        // 获取产品视图流程（只读，含回退逻辑）
        getProductViewFlow: (state) => () => {
            if (state.productViewFlow !== null) {
                return state.productViewFlow;
            }
            if (
                state.productData &&
                state.productData.templates &&
                state.productData.templates.views &&
                state.productData.templates.views.length > 0 &&
                state.productData.templates.views[0].view_flow
            ) {
                return state.productData.templates.views[0].view_flow;
            }
            return null;
        },
        // 判断合并后的 fields_visibility 中某字段是否显示
        isCurrentViewFieldVisible() {
            return (groupName, fieldKey) => {
                return pwcaIsFieldVisible(this.currentViewCustomizationSettings, groupName, fieldKey);
            };
        },
    },
    actions: {
        // ===== 状态恢复相关方法 =====
        setRestoringState(value) {
            this.isRestoringState = value;
        },
        restoreViewData(viewId, { layers, layerGroups }) {
            const normalizedPayload = pwcaNormalizeViewRestorePayload({
                layers,
                layerGroups
            });

            this.viewLayers[viewId] = normalizedPayload.layers;
            this.viewLayerGroups[viewId] = normalizedPayload.layerGroups;
            if (viewId === this.activeViewId) {
                this.layers = normalizedPayload.layers;
                this.layerGroups = normalizedPayload.layerGroups;
            }
        },
        syncCurrentViewToGlobal() {
            if (this.activeViewId) {
                this.layers = this.viewLayers[this.activeViewId] || [];
                this.layerGroups = this.viewLayerGroups[this.activeViewId] || [];
            }
        },
        setActiveCanvasId(id) { this.activeCanvasId = id; },
        updateCanvasState(id, state) { this.canvasStates[id] = state; },
        setLayers(layers) { this.layers = layers; },
        setActiveObjectId(id) { this.activeObjectId = id; },
        requestAction(payload) { this.actionRequest = { ...payload, timestamp: Date.now() }; },
        setLayerGroups(groups) { this.layerGroups = groups; },
        setActiveGroupId(id) { this.activeGroupId = id; },
        setViewLayers(viewId, layers) {
            this.viewLayers[viewId] = layers;
            if (viewId === this.activeViewId) {
                this.layers = layers;
            }
        },
        addLayerToView(viewId, layer) {
            if (!this.viewLayers[viewId]) {
                this.viewLayers[viewId] = [];
            }
            this.viewLayers[viewId].push(layer);
            if (viewId === this.activeViewId) {
                this.layers = [...this.viewLayers[viewId]];
            }
        },
        removeLayerFromView(viewId, layerId) {
            if (this.viewLayers[viewId]) {
                this.viewLayers[viewId] = this.viewLayers[viewId].filter(layer => layer.id !== layerId);
                if (viewId === this.activeViewId) {
                    this.layers = [...this.viewLayers[viewId]];
                }
            }
        },
        setViewLayerGroups(viewId, groups) {
            this.viewLayerGroups[viewId] = groups;
            if (viewId === this.activeViewId) {
                this.layerGroups = groups;
            }
        },
        setProductData(data) { this.productData = data; },
        setLoadingProductData(loading) { this.isLoadingProductData = loading; },
        setProductDataError(error) { this.productDataError = error; },
        setStoreCustomizationSettings(settings) {
            this.storeCustomizationSettings = settings;
        },
        setHasStoreCustomizationSettings(hasSettings) {
            this.hasStoreCustomizationSettings = !!hasSettings;
        },
        setStoreCustomizationSettingsError(error) {
            this.storeCustomizationSettingsError = error;
        },
        setViews(views) { this.views = views; },
        setActiveView(view) {
            this.activeView = view;
            if (view && view.id) {
                this.activeViewId = view.id;
            }
        },
        setProductViewFlow(viewFlow) { this.productViewFlow = viewFlow; },
        setActiveViewId(viewId) {
            const previousViewId = this.activeViewId;

            if (previousViewId === viewId) {
                void this.ensureViewPrintMethodsLoaded(viewId);
                return;
            }

            if (previousViewId) {
                this.viewLayers[previousViewId] = Array.isArray(this.layers)
                    ? [...this.layers]
                    : [];
                this.viewLayerGroups[previousViewId] = Array.isArray(this.layerGroups)
                    ? [...this.layerGroups]
                    : [];
            }

            this.activeViewId = viewId;

            const viewObject = this.views.find(view => view.id === viewId);
            if (viewObject) {
                this.activeView = viewObject;
            }

            this.layers = this.viewLayers[viewId] || [];
            this.layerGroups = this.viewLayerGroups[viewId] || [];
            this.activeObjectId = null;
            this.activeGroupId = null;

            const printMethodStore = usePrintMethodStore();
            if (printMethodStore) {
                printMethodStore.switchToViewPrintMethods(viewId);
            }

            void this.ensureViewPrintMethodsLoaded(viewId);
        },
        // ===== 颜色选择相关方法 =====
        setSelectedColorByView(viewId, colorData) {
            this.selectedColorsByView = pwcaSetSelectedColorByView(
                this.selectedColorsByView,
                viewId,
                colorData
            );
        },
        clearSelectedColorByView(viewId) {
            this.selectedColorsByView = pwcaClearSelectedColorByView(
                this.selectedColorsByView,
                viewId
            );
        },
        replaceSelectedColorsByView(selectedColorsByView) {
            this.selectedColorsByView = pwcaNormalizeSelectedColorsByView(
                selectedColorsByView
            );
        },
        clearAllSelectedColors() {
            this.selectedColorsByView = {};
        },
        // ===== 用户偏好设置相关方法 =====
        updateUserPreferences(preferences) {
            this.userPreferences = { ...this.userPreferences, ...preferences };
        },
        updateSinglePreference(key, value) {
            this.userPreferences[key] = value;
        },
        resetUserPreferences() {
            const defaultPreferences = {
                canvasBackgroundColor: '#ffffff',
                showGrid: true,
                gridSize: 20,
                showPrintArea: true,
                zoomLevel: 100,
                language: 'en'
            };
            this.userPreferences = window.VueUse && window.VueUse.useStorage ? window.VueUse.useStorage('pwca-user-preferences', defaultPreferences) : defaultPreferences;
        },
        async fetchProductData(pwId) {
            this.setLoadingProductData(true);
            this.setProductDataError(null);
            this.setStoreCustomizationSettingsError(null);
            try {
                const result = await pwcaFetchCanvasProductData(pwId);
                const data = pwcaPrepareCanvasProductData(result.data);

                if (result.meta && result.meta.cacheHit) {
                    // eslint-disable-next-line no-console
                    console.info('[PW Canvas] Using cached product data', { pwId });
                }

                this.setProductData(data);
                this.setStoreCustomizationSettings(data.store_customization_settings || null);
                this.setHasStoreCustomizationSettings(
                    data.has_store_customization_settings === true ||
                    !!data.store_customization_settings
                );
                this.setStoreCustomizationSettingsError(
                    data.store_customization_settings_error || null
                );
                this.setViewsFromProductData(data);

                return data;
            } catch (error) {
                this.setProductDataError(error.message || 'Failed to retrieve product data');
                throw error;
            } finally {
                this.setLoadingProductData(false);
            }
        },
        extractViewsFromProductData(productData) {
            const views = [];
            if (productData && productData.templates && productData.templates.data && productData.templates.data.custom_view) {
                const customView = productData.templates.data.custom_view;

                if (customView.main_custom_view) {
                    views.push({
                        id: 'main_view',
                        name: customView.main_custom_view.view_name || 'Main View',
                        data: customView.main_custom_view
                    });
                }

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
            if (views.length > 0) {
                this.setActiveViewId(views[0].id);
            }
        },
        setViewsFromProductData(productData) {
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
                const preparedViewState = pwcaBuildViewsFromProductData(
                    productData,
                    this.storeCustomizationSettings
                );
                const mergedViews = preparedViewState.mergedViews;

                productData.templates.views = mergedViews;
                this.setViews(mergedViews);

                if (preparedViewState.productViewFlow) {
                    this.setProductViewFlow(preparedViewState.productViewFlow);
                }

                if (preparedViewState.activeViewId) {
                    this.setActiveViewId(preparedViewState.activeViewId);
                }
            } catch (error) {
            }
        },

        async ensureViewPrintMethodsLoaded(viewId) {
            const printMethodStore = usePrintMethodStore();
            if (!printMethodStore || !viewId) {
                return;
            }

            const view = this.views.find((item) => item && item.id === viewId);
            if (
                !view ||
                !Array.isArray(view.printing_method_list_id) ||
                view.printing_method_list_id.length === 0
            ) {
                printMethodStore.switchToViewPrintMethods(viewId);
                return;
            }

            const existingPrintMethods =
                typeof printMethodStore.retrieveViewPrintMethods === 'function'
                    ? printMethodStore.retrieveViewPrintMethods(viewId)
                    : [];

            if (Array.isArray(existingPrintMethods) && existingPrintMethods.length > 0) {
                printMethodStore.switchToViewPrintMethods(viewId);
                return;
            }

            await printMethodStore.setViewPrintMethods(view.id, view.printing_method_list_id, {
                activeViewId: this.activeViewId
            });
            if (this.activeViewId === viewId) {
                printMethodStore.switchToViewPrintMethods(viewId);
            }
        },

        async ensureActiveViewPrintMethodsLoaded() {
            return this.ensureViewPrintMethodsLoaded(this.activeViewId);
        },

        async loadPrintMethodsForAllViews() {
            return this.ensureActiveViewPrintMethodsLoaded();
        },
    },
});

export const pinia = createPinia();
window.pwcaPinia = pinia;
window.pwcaUseCanvasStore = useCanvasStore;

// Expose tool functions to global scope for non-module scripts
window.pwcaBuildMergedLayerControls = pwcaBuildMergedLayerControls;
window.pwcaExtractStoreCustomizationSettings = pwcaExtractStoreCustomizationSettings;
window.pwcaNormalizeSelectedColorsByView = pwcaNormalizeSelectedColorsByView;
window.pwcaNormalizeViewRestorePayload = pwcaNormalizeViewRestorePayload;
window.pwcaRebuildViewRestorePayload = pwcaRebuildViewRestorePayload;
