// src/stores/printMethodStore.js

import {
    fetchCustomColorsByListId,
    fetchPrintMethodsByIds
} from '../api/print-method-api.js';
import {
    attachCustomColorsToMethod,
    convertApiDataToInternalFormat,
    normalizePrintMethodsApiPayload
} from './print-method-mapper.js';

// 确保Pinia已加载
if (!window.Pinia) {
    throw new Error('Pinia is not loaded. Please ensure Pinia is loaded before this script.');
}

function pwcaResolveGroupPrintMethodId(state, groupOrId) {
    const groupId =
        groupOrId && typeof groupOrId === 'object'
            ? groupOrId.id
            : groupOrId;

    if (!groupId) {
        return null;
    }

    let methodId = state.groupPrintMethodMap[groupId];
    if (!methodId) {
        const match = String(groupId).match(/print-method-(.+)$/);
        if (match) {
            methodId = match[1];
        }
    }

    return methodId || null;
}

function pwcaResolveLayerPrintMethodId(state, layerOrId) {
    const layerId =
        layerOrId && typeof layerOrId === 'object'
            ? layerOrId.id
            : layerOrId;

    if (!layerId) {
        return null;
    }

    let methodId = state.layerPrintMethodMap[layerId];
    if (methodId) {
        return methodId;
    }

    if (layerOrId && typeof layerOrId === 'object' && layerOrId.groupId) {
        return pwcaResolveGroupPrintMethodId(state, layerOrId.groupId);
    }

    return null;
}

// 打印方式管理 Store
export const usePrintMethodStore = window.Pinia.defineStore('printMethod', {
    state: () => ({
        // 按视图存储的打印方式数据 { viewId: [printMethods] }
        viewPrintMethods: {},
        
        // 当前视图的打印方式数组（从 viewPrintMethods 中获取）
        currentViewPrintMethods: [],

        // 当前选中的打印方式ID
        selectedPrintMethodId: null,

        // 图层与打印方式的映射关系
        layerPrintMethodMap: {},

        // 图层组与打印方式的映射关系
        groupPrintMethodMap: {},
        
        // 按视图分组：记录“已使用”的印刷方式（仅当元素实际使用时才记录）
        usedPrintMethodsByView: {}, // { [viewId]: { [methodId]: methodObject } }
        // 计数器：用于增减引用，自动删除未使用的方式
        usedPrintMethodCountsByView: {}, // { [viewId]: { [methodId]: number } }
        
        // API 相关状态
        loadingPrintMethods: false,
        printMethodsError: null
    }),

    getters: {
        // 获取所有印刷方式（当前视图）
        getAllPrintMethods: (state) => {
            return state.currentViewPrintMethods;
        },

        // 根据ID获取印刷方式（当前视图）
        getPrintMethodById: (state) => (id) => {
            return state.currentViewPrintMethods.find(method => method.id === id);
        },

        // 获取指定视图的所有印刷方式
        getViewPrintMethods: (state) => (viewId) => {
            return state.viewPrintMethods[viewId] || [];
        },

        // 根据视图ID和印刷方式ID获取印刷方式
        getViewPrintMethodById: (state) => (viewId, methodId) => {
            const viewMethods = state.viewPrintMethods[viewId] || [];
            return viewMethods.find(method => method.id === methodId);
        },

        // 获取当前选中的打印方式对象
        selectedPrintMethod: (state) => {
            return state.currentViewPrintMethods.find(method => method.id === state.selectedPrintMethodId);
        },

        // 获取当前选中的印刷方式
        getSelectedPrintMethod: (state) => {
            if (!state.selectedPrintMethodId) return null;
            return state.currentViewPrintMethods.find(method => method.id === state.selectedPrintMethodId);
        },

        // 获取图层的打印方式
        getLayerPrintMethod: (state) => (layerOrId) => {
            const methodId = pwcaResolveLayerPrintMethodId(state, layerOrId);
            return methodId ? state.currentViewPrintMethods.find(method => method.id === methodId) : null;
        },

        // 获取可用的印刷方式（排除已删除的，当前视图）
        getAvailablePrintMethods: (state) => {
            return state.currentViewPrintMethods.filter(method => method.status === 1);
        },

        // 获取指定视图的可用印刷方式
        getViewAvailablePrintMethods: (state) => (viewId) => {
            const viewMethods = state.viewPrintMethods[viewId] || [];
            return viewMethods.filter(method => method.status === 1);
        },

        // 获取默认印刷方式（当前视图）
        getDefaultPrintMethod: (state) => {
            return state.currentViewPrintMethods.find(method => method.set_as_default === true);
        },

        // 获取指定视图的默认印刷方式
        getViewDefaultPrintMethod: (state) => (viewId) => {
            const viewMethods = state.viewPrintMethods[viewId] || [];
            return viewMethods.find(method => method.set_as_default === true);
        },

        // 获取加载状态
        isLoadingPrintMethods: (state) => {
            return state.loadingPrintMethods;
        },

        // 获取印刷方式加载错误信息
        getPrintMethodsError: (state) => {
            return state.printMethodsError;
        },

        // 检查图层是否允许复制
        isLayerCopyAllowed: (state) => (layerOrId) => {
            const methodId = pwcaResolveLayerPrintMethodId(state, layerOrId);
            if (!methodId) return true;

            const method = state.currentViewPrintMethods.find(m => m.id === methodId);
            if (!method) return true;

            return method.features.allowCopy;
        },

        // 检查图层是否允许删除
        isLayerDeleteAllowed: (state) => (layerOrId) => {
            const methodId = pwcaResolveLayerPrintMethodId(state, layerOrId);
            if (!methodId) return true;

            const method = state.currentViewPrintMethods.find(m => m.id === methodId);
            return method ? method.features.allowDelete : true;
        },

        // 检查图层组是否允许复制（基于组的打印方式）
        isGroupCopyAllowed: (state) => (groupOrId) => {
            const methodId = pwcaResolveGroupPrintMethodId(state, groupOrId);
            if (!methodId) return true; // 如果没有指定打印方式，默认允许

            const method = state.currentViewPrintMethods.find(m => m.id === methodId);
            return method ? method.features.allowCopy : true;
        },

        // 检查图层组是否允许删除（基于组的打印方式）
        isGroupDeleteAllowed: (state) => (groupOrId) => {
            const methodId = pwcaResolveGroupPrintMethodId(state, groupOrId);
            if (!methodId) return true;

            const method = state.currentViewPrintMethods.find(m => m.id === methodId);
            return method ? method.features.allowDelete : true;
        },

        // 根据图层组ID获取对应的打印方式
        getGroupPrintMethod: (state) => (groupOrId) => {
            const methodId = pwcaResolveGroupPrintMethodId(state, groupOrId);
            return methodId ? state.currentViewPrintMethods.find(method => method.id === methodId) : null;
        },

        // 检查是否只有单个印刷方式
        isSinglePrintMethod: (state) => {
            return state.currentViewPrintMethods.length === 1;
        },

        // 检查是否允许切换印刷方式
        canSwitchPrintMethod: (state) => {
            return state.currentViewPrintMethods.length > 1;
        },

        // 某视图下“已使用”的印刷方式（数组，去重、统一格式）
        getUsedPrintMethodsByView: (state) => (viewId) => {
            const map = state.usedPrintMethodsByView[viewId] || {};
            return Object.values(map);
        },
        // 某视图下“已使用”的印刷方式（映射，按ID）
        getUsedPrintMethodsMapByView: (state) => (viewId) => state.usedPrintMethodsByView[viewId] || {},
        // 某视图下“已使用”的印刷方式ID列表
        getUsedPrintMethodIdsByView: (state) => (viewId) => Object.keys(state.usedPrintMethodsByView[viewId] || {}),
        // 判断某印刷方式在指定视图下是否已被使用
        isPrintMethodUsedInView: (state) => (viewId, methodId) => Boolean((state.usedPrintMethodsByView[viewId] || {})[methodId]),
        
        // 获取“所有视图中”且 apiData.moq_enabled 为真时，对应 apiData.moq_quantity 的最大值
        // 若无符合条件的记录，则返回 0
        getMaxUsedMoqQuantity: (state) => {
            let max = 0;
            const viewsMap = state.usedPrintMethodsByView || {};
            for (const viewId in viewsMap) {
                if (!Object.prototype.hasOwnProperty.call(viewsMap, viewId)) continue;
                const methodsMap = viewsMap[viewId] || {};
                for (const methodId in methodsMap) {
                    if (!Object.prototype.hasOwnProperty.call(methodsMap, methodId)) continue;
                    const method = methodsMap[methodId];
                    if (!method || !method.apiData) continue;
                    const api = method.apiData;
                    // 兼容多种布尔表示: true/1/'1'/'true'
                    const moqEnabled = api.moq_enabled === true || api.moq_enabled === 1 || api.moq_enabled === '1' || api.moq_enabled === 'true';
                    if (!moqEnabled) continue;
                    const qty = Number(api.moq_quantity);
                    if (Number.isFinite(qty) && qty > max) {
                        max = qty;
                    }
                }
            }
            return max;
        },
        
        // 获取所有视图中已使用印刷方式的print_cost总和（每种印刷方式只计算一次）
        getTotalPrintCostFromUsedMethods: (state) => {
            const uniqueMethodIds = new Set();
            let totalCost = 0;
            
            const viewsMap = state.usedPrintMethodsByView || {};
            for (const viewId in viewsMap) {
                if (!Object.prototype.hasOwnProperty.call(viewsMap, viewId)) continue;
                const methodsMap = viewsMap[viewId] || {};
                
                for (const methodId in methodsMap) {
                    if (!Object.prototype.hasOwnProperty.call(methodsMap, methodId)) continue;
                    
                    // 确保每种印刷方式只计算一次
                    if (uniqueMethodIds.has(methodId)) continue;
                    uniqueMethodIds.add(methodId);
                    
                    const method = methodsMap[methodId];
                    if (!method || !method.apiData) continue;
                    
                    const printCost = Number(method.apiData.print_cost);
                    if (Number.isFinite(printCost) && printCost > 0) {
                        totalCost += printCost;
                    }
                }
            }
            
            return totalCost;
        }
    },

    actions: {
        /**
         * 根据 printingMethodIds 数组通过后端聚合层获取印刷方式数据
         * @param {Array} printingMethodIds - 印刷方式ID数组
         * @returns {Promise<Array>} 印刷方式数据数组
         */
        async fetchPrintMethods(printingMethodIds) {
            if (!printingMethodIds || !Array.isArray(printingMethodIds) || printingMethodIds.length === 0) {
                return [];
            }

            this.loadingPrintMethods = true;
            this.printMethodsError = null;

            try {
                const result = await fetchPrintMethodsByIds(printingMethodIds);
                const apiMethods = normalizePrintMethodsApiPayload(result);
                const convertedData = await Promise.all(
                    apiMethods.map(async (apiMethod) => {
                        let convertedMethod = convertApiDataToInternalFormat(apiMethod);

                        if (apiMethod.color_list_id) {
                            try {
                                const customColors = await fetchCustomColorsByListId(apiMethod.color_list_id);
                                convertedMethod = attachCustomColorsToMethod(convertedMethod, customColors);
                            } catch (colorError) {
                            }
                        }

                        return convertedMethod;
                    })
                );

                return convertedData;
            } catch (error) {
                this.printMethodsError = error.message;
                return [];
            } finally {
                this.loadingPrintMethods = false;
            }
        },
        // 为视图设置打印方式数据
        async setViewPrintMethods(viewId, printingMethodIds, options = {}) {
            const printMethods = await this.fetchPrintMethods(printingMethodIds);
            this.viewPrintMethods[viewId] = printMethods;
            
            // 注意：不在此处写入“已使用”的集合，只有当元素实际分配时才记录
            
            // 如果当前没有激活的视图，或者设置的是当前激活视图，更新当前打印方式
            const activeViewId = options.activeViewId || null;
            if (!activeViewId || activeViewId === viewId) {
                this.currentViewPrintMethods = printMethods;
                // 设置默认选中的打印方式
                if (printMethods.length > 0 && !this.selectedPrintMethodId) {
                    this.selectedPrintMethodId = printMethods[0].id;
                }
            }
        },
        
        // 切换到指定视图的打印方式
        switchToViewPrintMethods(viewId) {
            const printMethods = this.viewPrintMethods[viewId] || [];
            this.currentViewPrintMethods = printMethods;
            
            // 重置选中的打印方式
            if (printMethods.length > 0) {
                this.selectedPrintMethodId = printMethods[0].id;
            } else {
                this.selectedPrintMethodId = null;
            }
        },
        
        // 记录某视图下某印刷方式被使用（引用计数）
        recordPrintMethodUsage(viewId, methodId) {
            if (!viewId || methodId == null) return;
            if (!this.usedPrintMethodCountsByView[viewId]) this.usedPrintMethodCountsByView[viewId] = {};
            if (!this.usedPrintMethodsByView[viewId]) this.usedPrintMethodsByView[viewId] = {};

            // 首次引用时，放入完整对象
            if (!this.usedPrintMethodCountsByView[viewId][methodId]) {
                // 尝试在该视图的配置中查找完整对象
                const methodList = this.viewPrintMethods[viewId] || [];
                const found = methodList.find(m => m.id === methodId) || this.currentViewPrintMethods.find(m => m.id === methodId);
                if (found) {
                    this.usedPrintMethodsByView[viewId][methodId] = found;
                    this.usedPrintMethodCountsByView[viewId][methodId] = 1;
                } else {
                    // 未找到完整对象则忽略
                    return;
                }
            } else {
                this.usedPrintMethodCountsByView[viewId][methodId] += 1;
            }
        },

        // 撤销记录（引用计数为0则移除）
        unrecordPrintMethodUsage(viewId, methodId) {
            if (!viewId || methodId == null) return;
            const counts = this.usedPrintMethodCountsByView[viewId];
            if (!counts || !counts[methodId]) return;

            counts[methodId] -= 1;
            if (counts[methodId] <= 0) {
                delete counts[methodId];
                if (this.usedPrintMethodsByView[viewId]) {
                    delete this.usedPrintMethodsByView[viewId][methodId];
                }
            }
        },

        // 获取视图的打印方式数据
        retrieveViewPrintMethods(viewId) {
            return this.viewPrintMethods[viewId] || [];
        },

        // 设置选中的打印方式
        setSelectedPrintMethod(methodId) {
            if (this.currentViewPrintMethods.find(method => method.id === methodId)) {
                this.selectedPrintMethodId = methodId;
            }
        },

        // 为图层分配打印方式（仅当元素实际分配时，才记录为“已使用”）
        assignLayerPrintMethod(layerId, methodId) {
            if (this.currentViewPrintMethods.find(method => method.id === methodId)) {
                this.layerPrintMethodMap[layerId] = methodId;
            }
        },

        // 取消图层的打印方式分配
        unassignLayerPrintMethod(layerId) {
            const methodId = this.layerPrintMethodMap[layerId];
            if (methodId != null) {
                delete this.layerPrintMethodMap[layerId];
            }
        },

        // 为图层组分配打印方式
        assignGroupPrintMethod(groupId, methodId) {
            if (!groupId) return;
            if (this.currentViewPrintMethods.find(method => method.id === methodId)) {
                this.groupPrintMethodMap[groupId] = methodId;
            }
        },

        // 取消图层组的打印方式分配
        unassignGroupPrintMethod(groupId) {
            if (!groupId) return;
            const methodId = this.groupPrintMethodMap[groupId];
            if (methodId != null) {
                delete this.groupPrintMethodMap[groupId];
            }
        },

        // 基于当前分配关系，重新计算某视图下“已使用”的印刷方式
        recomputeUsedPrintMethodsForView(viewId, layers = []) {
            if (!viewId) return;
            const methodIds = new Set();

            // 1) 图层直接分配
            for (const layer of layers) {
                const lid = layer.id;
                const mid = this.layerPrintMethodMap[lid];
                if (mid != null) methodIds.add(mid);

                // 2) 图层组分配
                if (layer.groupId) {
                    const fromMap = this.groupPrintMethodMap[layer.groupId];
                    if (fromMap != null) methodIds.add(fromMap);
                    // 3) 通过组ID约定推断（print-method-<id>）
                    const match = String(layer.groupId).match(/^print-method-(.+)$/);
                    if (match && match[1]) methodIds.add(match[1]);
                }
            }

            // 重建映射和计数
            this.usedPrintMethodsByView[viewId] = {};
            this.usedPrintMethodCountsByView[viewId] = {};

            const list = this.viewPrintMethods[viewId] || [];
            for (const id of methodIds) {
                const obj = list.find(m => String(m.id) === String(id));
                if (obj) {
                    this.usedPrintMethodsByView[viewId][obj.id] = obj;
                    this.usedPrintMethodCountsByView[viewId][obj.id] = 1; // 计数重建为至少1
                }
            }
        },

        // 重新计算所有视图的“已使用”集合
        recomputeUsedPrintMethodsForAllViews(viewLayersByView = {}) {
            for (const viewId of Object.keys(this.viewPrintMethods)) {
                this.recomputeUsedPrintMethodsForView(
                    viewId,
                    Array.isArray(viewLayersByView[viewId]) ? viewLayersByView[viewId] : []
                );
            }
        },

        // 批量恢复印刷方式映射（用于状态恢复）
        restorePrintMethodMappings(viewId, { layerMap, groupMap, viewLayers = [] }) {
            // 恢复图层映射
            if (layerMap && typeof layerMap === 'object') {
                Object.entries(layerMap).forEach(([layerId, methodId]) => {
                    this.layerPrintMethodMap[layerId] = methodId;
                });
            }
            
            // 恢复图层组映射
            if (groupMap && typeof groupMap === 'object') {
                Object.entries(groupMap).forEach(([groupId, methodId]) => {
                    this.groupPrintMethodMap[groupId] = methodId;
                });
            }
            
            // 重新计算已使用的印刷方式
            this.recomputeUsedPrintMethodsForView(viewId, viewLayers);
        },

        // 验证图层是否符合打印方式要求
        validateLayerForPrintMethod(layer, methodId) {
            const method = this.getPrintMethodById(methodId);
            if (!method) return { valid: false, errors: ['Print method not found'] };

            const errors = [];

            // 检查图层类型是否支持
            if (!method.features.supportedTypes.includes(layer.type)) {
                errors.push(`Layer type '${layer.type}' is not supported by this print method`);
            }

            return {
                valid: errors.length === 0,
                errors: errors
            };
        }
    }
});

// 将打印方式store暴露到全局
window.pwcaUsePrintMethodStore = usePrintMethodStore;
