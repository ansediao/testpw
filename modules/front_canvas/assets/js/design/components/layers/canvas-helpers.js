// 与 Fabric 画布交互的通用帮助函数
// 负责：获取画布实例、同步图层属性到画布、复制/删除画布对象、蒙版画布显隐

export function createCanvasHelpers(store) {
    const getCanvasInstance = () => {
        if (window.pwcaCanvasManager) {
            return window.pwcaCanvasManager.getActiveCanvas();
        }

        let canvasInstance = window.pwcaCanvas || window.pwcaFabricCanvas;

        if (!canvasInstance) {
            if (store.activeViewId) {
                const canvasElement = document.querySelector(
                    `#mainCanvas-${store.activeViewId}`
                );
                if (canvasElement && canvasElement.__fabricCanvas) {
                    canvasInstance = canvasElement.__fabricCanvas;
                }
            }

            if (!canvasInstance) {
                const canvasElement = document.querySelector('#mainCanvas');
                if (canvasElement && canvasElement.__fabricCanvas) {
                    canvasInstance = canvasElement.__fabricCanvas;
                }
            }
        }

        return canvasInstance;
    };

    const syncLayerSelectionToCanvas = (layerId) => {
        const canvasInstance = getCanvasInstance();

        if (canvasInstance) {
            const obj = canvasInstance.getObjects().find((o) => o.id === layerId);
            if (obj) {
                canvasInstance.setActiveObject(obj);
                canvasInstance.renderAll();
            }
        }
    };

    const syncLayerVisibilityToCanvas = (layerId, visible) => {
        const canvasInstance = getCanvasInstance();

        if (canvasInstance) {
            const obj = canvasInstance.getObjects().find((o) => o.id === layerId);
            if (obj) {
                obj.set('visible', visible);
                canvasInstance.renderAll();
            }
        }
    };

    const syncLayerLockToCanvas = (layerId, locked) => {
        const canvasInstance = getCanvasInstance();

        if (canvasInstance) {
            const obj = canvasInstance.getObjects().find((o) => o.id === layerId);
            if (obj) {
                obj.set('selectable', !locked);
                obj.set('evented', !locked);
                canvasInstance.renderAll();
            }
        }
    };

    // 复制画布对象，并同步到当前视图的图层列表
    const duplicateCanvasObject = (layerId, layerInfo = {}) => {
        const canvasInstance = getCanvasInstance();

        if (canvasInstance) {
            const obj = canvasInstance.getObjects().find((o) => o.id === layerId);
            if (obj) {
                obj.clone((cloned) => {
                    const newId = `layer_${Date.now()}`;
                    const newLayerName =
                        layerInfo.name ||
                        (obj.layerName || obj.text || 'Layer') + '_副本';
                    const newLayerType =
                        layerInfo.type || obj.layerType || obj.type;

                    cloned.set({
                        left: cloned.left + 10,
                        top: cloned.top + 10,
                        id: newId,
                        layerName: newLayerName,
                        layerType: newLayerType,
                        visible:
                            layerInfo.visible !== undefined
                                ? layerInfo.visible
                                : obj.visible !== false,
                        selectable:
                            layerInfo.locked !== undefined
                                ? !layerInfo.locked
                                : obj.selectable,
                        groupId: layerInfo.groupId || null,
                        groupOrder: layerInfo.groupOrder || 0
                    });

                    canvasInstance.add(cloned);
                    canvasInstance.setActiveObject(cloned);
                    canvasInstance.renderAll();

                    const currentViewId = store.activeViewId;
                    if (currentViewId) {
                        const newLayer = {
                            id: newId,
                            name: newLayerName,
                            type: newLayerType,
                            visible:
                                layerInfo.visible !== undefined
                                    ? layerInfo.visible
                                    : true,
                            locked:
                                layerInfo.locked !== undefined
                                    ? layerInfo.locked
                                    : false,
                            groupId: layerInfo.groupId || null,
                            groupOrder: layerInfo.groupOrder || 0
                        };

                        const currentViewLayers =
                            store.getViewLayers(currentViewId);
                        const existingLayer = currentViewLayers.find(
                            (layer) => layer.id === newId
                        );
                        if (!existingLayer) {
                            store.addLayerToView(currentViewId, newLayer);
                        }

                        store.setActiveObjectId(newId);

                        setTimeout(() => {
                            const refreshEvent = new CustomEvent(
                                'layerThumbnailRefresh',
                                {
                                    detail: { layerId: newId }
                                }
                            );
                            document.dispatchEvent(refreshEvent);
                        }, 100);
                    }
                });
            }
        }
    };

    const deleteCanvasObject = (layerId) => {
        const canvasInstance = getCanvasInstance();

        if (canvasInstance) {
            const obj = canvasInstance.getObjects().find((o) => o.id === layerId);
            if (obj) {
                canvasInstance.remove(obj);
                canvasInstance.renderAll();
            }
        }
    };

    const isLayerInGroup = (layerId) => {
        const currentViewId = store.activeViewId;
        if (!currentViewId) {
            return false;
        }

        const currentViewLayers = store.getViewLayers(currentViewId);
        const layer = currentViewLayers.find((l) => l.id === layerId);
        return layer && layer.groupId;
    };

    const controlMaskCanvasVisibility = (layerId) => {
        const currentViewId = store.activeViewId;
        if (!currentViewId) {
            return;
        }

        const maskWrapper = document.getElementById(
            `maskWrapper-${currentViewId}`
        );
        if (!maskWrapper) {
            return;
        }

        const grouped = layerId ? isLayerInGroup(layerId) : false;
        maskWrapper.style.display = grouped ? 'block' : 'none';
    };

    return {
        getCanvasInstance,
        syncLayerSelectionToCanvas,
        syncLayerVisibilityToCanvas,
        syncLayerLockToCanvas,
        duplicateCanvasObject,
        deleteCanvasObject,
        controlMaskCanvasVisibility
    };
}