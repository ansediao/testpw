// src/stores/printMethodStore.js

// 确保Pinia已加载
if (!window.Pinia) {
    throw new Error('Pinia is not loaded. Please ensure Pinia is loaded before this script.');
}

// 打印方式管理 Store
export const usePrintMethodStore = window.Pinia.defineStore('printMethod', {
    state: () => ({
        // 打印方式配置数组
        printMethods: [
            {
                id: 'method-a',
                name: 'Print Method A',
                label: 'Print Method A',
                features: {
                    allowCopy: true,
                    allowDelete: true,
                    allowMove: true,
                    allowResize: true,
                    allowRotate: true,
                    maxLayers: null,
                    supportedTypes: ['text', 'image', 'shape'],
                    colorLimitations: null,
                    minQuantity: 1,
                    printArea: {
                        width: 200,
                        height: 200,
                        unit: 'mm'
                    }
                },
                settings: {
                    color: {
                        maxColors: null,
                        colorType: 'full',
                        pantoneSupport: true
                    },
                    moq: {
                        minimum: 1,
                        increments: 1
                    },
                    printArea: {
                        maxWidth: 200,
                        maxHeight: 200,
                        shape: 'rectangle'
                    }
                }
            },
            {
                id: 'method-b',
                name: 'Print Method B',
                label: 'Print Method B',
                features: {
                    allowCopy: false,
                    allowDelete: true,
                    allowMove: true,
                    allowResize: false,
                    allowRotate: false,
                    maxLayers: 3,
                    supportedTypes: ['text', 'image'],
                    colorLimitations: 2,
                    minQuantity: 50,
                    printArea: {
                        width: 150,
                        height: 150,
                        unit: 'mm'
                    }
                },
                settings: {
                    color: {
                        maxColors: 2,
                        colorType: 'spot',
                        pantoneSupport: true
                    },
                    moq: {
                        minimum: 50,
                        increments: 25
                    },
                    printArea: {
                        maxWidth: 150,
                        maxHeight: 150,
                        shape: 'rectangle'
                    }
                }
            },
            {
                id: 'method-c',
                name: 'Print Method C',
                label: 'Print Method C',
                features: {
                    allowCopy: true,
                    allowDelete: false,
                    allowMove: true,
                    allowResize: true,
                    allowRotate: true,
                    maxLayers: null,
                    supportedTypes: ['text'],
                    colorLimitations: 1,
                    minQuantity: 100,
                    printArea: {
                        width: 100,
                        height: 50,
                        unit: 'mm'
                    }
                },
                settings: {
                    color: {
                        maxColors: 1,
                        colorType: 'mono',
                        pantoneSupport: false
                    },
                    moq: {
                        minimum: 100,
                        increments: 50
                    },
                    printArea: {
                        maxWidth: 100,
                        maxHeight: 50,
                        shape: 'rectangle'
                    }
                }
            }
        ],

        // 当前选中的打印方式ID
        selectedPrintMethodId: 'method-a',

        // 图层与打印方式的映射关系
        layerPrintMethodMap: {},

        // 图层组与打印方式的映射关系
        groupPrintMethodMap: {}
    }),

    getters: {
        // 获取当前选中的打印方式对象
        selectedPrintMethod: (state) => {
            return state.printMethods.find(method => method.id === state.selectedPrintMethodId);
        },

        // 根据ID获取打印方式
        getPrintMethodById: (state) => (id) => {
            return state.printMethods.find(method => method.id === id);
        },

        // 获取图层的打印方式
        getLayerPrintMethod: (state) => (layerId) => {
            const methodId = state.layerPrintMethodMap[layerId];
            return methodId ? state.printMethods.find(method => method.id === methodId) : null;
        },

        // 检查图层是否允许复制
        isLayerCopyAllowed: (state) => (layerId) => {
            const methodId = state.layerPrintMethodMap[layerId];
            if (!methodId) return true;

            const method = state.printMethods.find(m => m.id === methodId);
            return method ? method.features.allowCopy : true;
        },

        // 检查图层是否允许删除
        isLayerDeleteAllowed: (state) => (layerId) => {
            const methodId = state.layerPrintMethodMap[layerId];
            if (!methodId) return true;

            const method = state.printMethods.find(m => m.id === methodId);
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

            const method = state.printMethods.find(m => m.id === methodId);
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

            const method = state.printMethods.find(m => m.id === methodId);
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

            return methodId ? state.printMethods.find(method => method.id === methodId) : null;
        }
    },

    actions: {
        // 设置选中的打印方式
        setSelectedPrintMethod(methodId) {
            if (this.printMethods.find(method => method.id === methodId)) {
                this.selectedPrintMethodId = methodId;
            }
        },

        // 为图层分配打印方式
        assignLayerPrintMethod(layerId, methodId) {
            if (this.printMethods.find(method => method.id === methodId)) {
                this.layerPrintMethodMap[layerId] = methodId;
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