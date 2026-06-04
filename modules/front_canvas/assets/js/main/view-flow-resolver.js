(function () {
    const PWCA_DEFAULT_VIEW_FLOW = 'Flat Flow';
    const PWCA_FOUR_GRID_VIEW_FLOW = '4-Grid Flow';

    /**
     * 不同 view_flow 的配置注册中心
     * 用于决定：图层路由、尺寸参考、是否启用遮罩、初始化后置处理等
     */
    const PWCA_FLOW_CONFIGS = {
        [PWCA_DEFAULT_VIEW_FLOW]: {
            // 图层路由规则：决定图层进哪个 canvas，返回 null 表示不渲染
            layerRouting: (layerName) => {
                if (['Background Layer', 'Base Layer', '4-Grid Layer'].includes(layerName)) {
                    return 'baseCanvas';
                }
                if (layerName === 'Overlay Layer') {
                    return 'overlayCanvas';
                }
                return 'mainCanvas';
            },
            // 尺寸参考图层：决定画布的基础宽高
            sizingReference: (layers) => layers[0],
            // 内容区域图层的回退顺序
            contentAreaFallbacks: ['Content Area Layer', 'Mapping Layer', 'FlexiCurve Layer', 'Base Layer'],
            // 是否启用打印区域遮罩
            hasMask: true,
            // 初始化后的特殊处理函数名 (在 multi-view-init.js 中定义)
            postInit: null,
            previewImageConfigs: null
        },
        [PWCA_FOUR_GRID_VIEW_FLOW]: {
            layerRouting: (layerName) => {
                // 4-Grid Flow 下只保留 4-Grid Layer，其它指定辅助层全部跳过
                if ([
                    'Background Layer',
                    'Base Layer',
                    'Overlay Layer',
                    'Mapping Layer',
                    'FlexiCurve Layer'
                ].includes(layerName)) {
                    return null;
                }
                if (layerName === '4-Grid Layer') {
                    return 'baseCanvas';
                }
                return 'mainCanvas';
            },
            sizingReference: (layers) => {
                return layers.find((l) => l.name === '4-Grid Layer') || layers[0];
            },
            // 内容区域图层的回退顺序
            contentAreaFallbacks: ['Content Area Layer', 'Mapping Layer', 'FlexiCurve Layer', 'Base Layer'],
            hasMask: true,
            postInit: null,
            previewImageConfigs: [
                {
                    key: 'print-sheet',
                    label: '4-Grid Print',
                    mode: 'layerComposite',
                    sizeReferenceLayer: '4-Grid Layer',
                    beforeCanvasLayers: [
                        {
                            name: '4-Grid Layer'
                        }
                    ],
                    canvasSource: {
                        mode: 'full'
                    },
                    afterCanvasLayers: []
                },
                {
                    key: 'mockup',
                    label: 'Product Preview',
                    mode: 'gridMockup',
                    sizeReferenceLayer: 'Background Layer',
                    cropConfig: {
                        x: 0.25,
                        y: 0,
                        width: 0.5,
                        height: 1
                    },
                    backgroundLayerName: 'Background Layer',
                    baseLayerName: 'Base Layer',
                    overlayLayerName: 'Overlay Layer',
                    mappingLayerName: 'Mapping Layer'
                }
            ]
        }
    };

    function pwcaGetCanvasStoreSafe(explicitStore) {
        if (explicitStore) {
            return explicitStore;
        }

        if (typeof window.useCanvasStore === 'function') {
            try {
                return window.useCanvasStore();
            } catch (e) {
                return null;
            }
        }

        return null;
    }

    function pwcaResolveViewFlow(view, explicitStore) {
        const store = pwcaGetCanvasStoreSafe(explicitStore);
        const flow = view && (
            view.view_flow ||
            (view.data && view.data.view_flow)
        );

        if (typeof flow === 'string' && flow.trim()) {
            return flow.trim();
        }

        const productFlow = store && typeof store.getProductViewFlow === 'function'
            ? store.getProductViewFlow()
            : null;

        if (typeof productFlow === 'string' && productFlow.trim()) {
            return productFlow.trim();
        }

        return PWCA_DEFAULT_VIEW_FLOW;
    }

    function pwcaIsFourGridFlow(view, explicitStore) {
        return pwcaResolveViewFlow(view, explicitStore) === PWCA_FOUR_GRID_VIEW_FLOW;
    }

    /**
     * 获取指定视图的流程配置
     */
    function pwcaGetFlowConfig(view, explicitStore) {
        const flowName = pwcaResolveViewFlow(view, explicitStore);
        return PWCA_FLOW_CONFIGS[flowName] || PWCA_FLOW_CONFIGS[PWCA_DEFAULT_VIEW_FLOW];
    }

    function pwcaGetFlowPreviewImageConfigs(view, explicitStore) {
        const flowConfig = pwcaGetFlowConfig(view, explicitStore);
        return Array.isArray(flowConfig?.previewImageConfigs) ? flowConfig.previewImageConfigs : [];
    }

    window.PWCA_DEFAULT_VIEW_FLOW = PWCA_DEFAULT_VIEW_FLOW;
    window.PWCA_FOUR_GRID_VIEW_FLOW = PWCA_FOUR_GRID_VIEW_FLOW;
    window.PWCA_FLOW_CONFIGS = PWCA_FLOW_CONFIGS;
    window.pwcaResolveViewFlow = pwcaResolveViewFlow;
    window.pwcaIsFourGridFlow = pwcaIsFourGridFlow;
    window.pwcaGetFlowConfig = pwcaGetFlowConfig;
    window.pwcaGetFlowPreviewImageConfigs = pwcaGetFlowPreviewImageConfigs;
})();
