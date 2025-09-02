// src/stores/printMethodStore.js

// 确保Pinia已加载
if (!window.Pinia) {
    throw new Error('Pinia is not loaded. Please ensure Pinia is loaded before this script.');
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
        getLayerPrintMethod: (state) => (layerId) => {
            const methodId = state.layerPrintMethodMap[layerId];
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
        isLayerCopyAllowed: (state) => (layerId) => {
            // 1. 检查直接映射
            let methodId = state.layerPrintMethodMap[layerId];
            
            // 2. 如果没有直接映射，通过图层信息获取groupId
            if (!methodId) {
                const canvasStore = window.useCanvasStore();
                if (canvasStore && canvasStore.activeViewId) {
                    const currentLayers = canvasStore.getViewLayers(canvasStore.activeViewId);
                    const layer = currentLayers.find(l => l.id === layerId);
                    
                    if (layer && layer.groupId) {
                        // 从图层组ID推断打印方式ID
                        const match = layer.groupId.match(/^print-method-(.+)$/);
                        if (match) {
                            methodId = match[1];
                        }
                    }
                }
            }
            
            // 3. 如果仍然没有找到打印方式，默认允许
            if (!methodId) return true;
            
            // 4. 在当前视图的打印方式中查找
            const method = state.currentViewPrintMethods.find(m => m.id === methodId);
            if (!method) return true;
            
            // 5. 检查features.allowCopy（基于apiData.copyable）
            return method.features.allowCopy;
        },

        // 检查图层是否允许删除
        isLayerDeleteAllowed: (state) => (layerId) => {
            const methodId = state.layerPrintMethodMap[layerId];
            if (!methodId) return true;

            const method = state.currentViewPrintMethods.find(m => m.id === methodId);
            return method ? method.features.allowDelete : true;
        },

        // 检查图层组是否允许复制（基于组的打印方式）
        isGroupCopyAllowed: (state) => (groupId) => {
            // 先检查直接映射
            let methodId = state.groupPrintMethodMap[groupId];

            // 如果没有直接映射，从组ID推断打印方式ID
            if (!methodId) {
                const match = groupId.match(/print-method-(.+)$/);
                if (match) {
                    methodId = match[1];
                }
            }

            if (!methodId) return true; // 如果没有指定打印方式，默认允许

            const method = state.currentViewPrintMethods.find(m => m.id === methodId);
            return method ? method.features.allowCopy : true;
        },

        // 检查图层组是否允许删除（基于组的打印方式）
        isGroupDeleteAllowed: (state) => (groupId) => {
            // 先检查直接映射
            let methodId = state.groupPrintMethodMap[groupId];

            // 如果没有直接映射，从组ID推断打印方式ID
            if (!methodId) {
                const match = groupId.match(/print-method-(.+)$/);
                if (match) {
                    methodId = match[1];
                }
            }

            if (!methodId) return true;

            const method = state.currentViewPrintMethods.find(m => m.id === methodId);
            return method ? method.features.allowDelete : true;
        },

        // 根据图层组ID获取对应的打印方式
        getGroupPrintMethod: (state) => (groupId) => {
            // 先检查直接映射
            let methodId = state.groupPrintMethodMap[groupId];

            // 如果没有直接映射，从组ID推断打印方式ID
            if (!methodId) {
                const match = groupId.match(/print-method-(.+)$/);
                if (match) {
                    methodId = match[1];
                }
            }

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
                console.warn('fetchPrintMethods: 无效的 printingMethodIds 参数');
                return [];
            }

            this.loadingPrintMethods = true;
            this.printMethodsError = null;

            try {
                // 通过后端聚合层的REST API端点获取数据
                const response = await fetch('/wp-json/pw-canvas/v1/print-methods', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        printing_method_ids: printingMethodIds
                    })
                });

                if (!response.ok) {
                    throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
                }

                const result = await response.json();
                
                if (!result.success) {
                    throw new Error(result.error || '获取印刷方式数据失败');
                }
                
                // 验证并转换API数据格式
                let convertedData = [];
                // 检查API返回的数据结构，可能是嵌套的data字段
                const apiData = result.data?.data || result.data;
                
                if (apiData && Array.isArray(apiData)) {
                    convertedData = apiData.map(item => this.convertApiDataToInternalFormat(item));
                } else if (apiData) {
                    // 如果data不是数组，尝试将其包装为数组
                    console.warn('API返回的data不是数组格式:', apiData);
                    convertedData = [this.convertApiDataToInternalFormat(apiData)];
                } else {
                    console.warn('API返回的数据中没有有效的data字段:', result);
                }
                
                // 如果有部分错误，记录警告
                if (result.has_errors && result.errors) {
                    console.warn('fetchPrintMethods: 部分印刷方式获取失败', result.errors);
                }
                
                console.log('fetchPrintMethods: 成功获取印刷方式数据', convertedData);
                return convertedData;
            } catch (error) {
                console.error('fetchPrintMethods: 获取印刷方式数据失败', error);
                this.printMethodsError = error.message;
                return [];
            } finally {
                this.loadingPrintMethods = false;
            }
        },
        
        // 转换 API 数据格式为内部格式
        convertApiDataToInternalFormat(apiMethod) {
            return {
                id: apiMethod.id,
                name: apiMethod.name,
                label: apiMethod.name,
                print_method_area_height:apiMethod.print_method_area_height,
                print_method_area_width:apiMethod.print_method_area_width,
                size_unit:apiMethod.size_unit,
                code: apiMethod.code,
                description: apiMethod.description,
                features: {
                    allowCopy: apiMethod.copyable,
                    allowDelete: true, // API 中没有对应字段，默认为 true
                    allowMove: true,
                    allowResize: true,
                    allowRotate: true,
                    maxLayers: null, // API 中没有对应字段
                    supportedTypes: ['text', 'image', 'shape'], // API 中没有对应字段，默认支持所有类型
                    colorLimitations: apiMethod.printable_color === 'All Color' ? null : apiMethod.color_list_id,
                    minQuantity: apiMethod.moq_quantity,
                    printArea: {
                        width: apiMethod.print_method_area_width,
                        height: apiMethod.print_method_area_height,
                        unit: apiMethod.size_unit
                    }
                },
                settings: {
                    color: {
                        maxColors: apiMethod.printable_color === 'All Color' ? null : apiMethod.color_list_id,
                        colorType: apiMethod.printable_color === 'All Color' ? 'full' : 'limited',
                        pantoneSupport: true // API 中没有对应字段，默认为 true
                    },
                    moq: {
                        minimum: apiMethod.moq_quantity,
                        increments: 1 // API 中没有对应字段，默认为 1
                    },
                    printArea: {
                        maxWidth: apiMethod.print_method_area_width,
                        maxHeight: apiMethod.print_method_area_height,
                        shape: 'rectangle' // API 中没有对应字段，默认为矩形
                    },
                    pricing: {
                        printCost: apiMethod.print_cost,
                        anchorPrice: apiMethod.anchor_price,
                        sampleCost: apiMethod.sample_cost,
                        sampleEnabled: apiMethod.sample_enabled
                    },
                    processing: {
                        processTime: apiMethod.process_time,
                        discountEnabled: apiMethod.discount_enabled,
                        ranges: apiMethod.ranges || []
                    },
                    marks: {
                        cropMark: apiMethod.crop_mark,
                        bleedMark: apiMethod.bleed_mark,
                        bleedValue: apiMethod.bleed_value,
                        showPrintArea: apiMethod.show_print_area,
                        showContentOut: apiMethod.show_content_out,
                        sizeMark: apiMethod.size_mark
                    },
                    helper: {
                        text: apiMethod.helper_text,
                        image: apiMethod.helper_image
                    }
                },
                // 保留原始 API 数据
                apiData: apiMethod
            };
        },
        
        // 为视图设置打印方式数据
        async setViewPrintMethods(viewId, printingMethodIds) {
            const printMethods = await this.fetchPrintMethods(printingMethodIds);
            this.viewPrintMethods[viewId] = printMethods;
            
            // 注意：不在此处写入“已使用”的集合，只有当元素实际分配时才记录
            
            // 如果当前没有激活的视图，或者设置的是当前激活视图，更新当前打印方式
            const canvasStore = window.useCanvasStore();
            if (!canvasStore.activeViewId || canvasStore.activeViewId === viewId) {
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
                    // 未找到完整对象则忽略，但记录告警
                    console.warn('recordPrintMethodUsage: 未能在视图配置中找到对应的印刷方式对象', { viewId, methodId });
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
                const canvasStore = window.useCanvasStore();
                const viewId = canvasStore && canvasStore.activeViewId ? canvasStore.activeViewId : null;
                if (viewId) this.recordPrintMethodUsage(viewId, methodId);
            }
        },

        // 取消图层的打印方式分配
        unassignLayerPrintMethod(layerId) {
            const methodId = this.layerPrintMethodMap[layerId];
            if (methodId != null) {
                delete this.layerPrintMethodMap[layerId];
                const canvasStore = window.useCanvasStore();
                const viewId = canvasStore && canvasStore.activeViewId ? canvasStore.activeViewId : null;
                if (viewId) this.unrecordPrintMethodUsage(viewId, methodId);
            }
        },

        // 为图层组分配打印方式
        assignGroupPrintMethod(groupId, methodId) {
            if (!groupId) return;
            if (this.currentViewPrintMethods.find(method => method.id === methodId)) {
                this.groupPrintMethodMap[groupId] = methodId;
                const canvasStore = window.useCanvasStore();
                const viewId = canvasStore && canvasStore.activeViewId ? canvasStore.activeViewId : null;
                if (viewId) this.recordPrintMethodUsage(viewId, methodId);
            }
        },

        // 取消图层组的打印方式分配
        unassignGroupPrintMethod(groupId) {
            if (!groupId) return;
            const methodId = this.groupPrintMethodMap[groupId];
            if (methodId != null) {
                delete this.groupPrintMethodMap[groupId];
                const canvasStore = window.useCanvasStore();
                const viewId = canvasStore && canvasStore.activeViewId ? canvasStore.activeViewId : null;
                if (viewId) this.unrecordPrintMethodUsage(viewId, methodId);
            }
        },

        // 基于当前分配关系，重新计算某视图下“已使用”的印刷方式
        recomputeUsedPrintMethodsForView(viewId) {
            if (!viewId) return;
            const canvasStore = window.useCanvasStore();
            const layers = canvasStore && typeof canvasStore.getViewLayers === 'function' ? (canvasStore.getViewLayers(viewId) || []) : [];
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
        recomputeUsedPrintMethodsForAllViews() {
            for (const viewId of Object.keys(this.viewPrintMethods)) {
                this.recomputeUsedPrintMethodsForView(viewId);
            }
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
window.usePrintMethodStore = usePrintMethodStore;