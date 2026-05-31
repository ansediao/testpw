(function () {
    function pwcaGetCanvasStore() {
        if (typeof window.useCanvasStore !== 'function') {
            return null;
        }

        try {
            return window.useCanvasStore();
        } catch (error) {
            return null;
        }
    }

    function pwcaGetPrintMethodStore() {
        if (typeof window.usePrintMethodStore !== 'function') {
            return null;
        }

        try {
            return window.usePrintMethodStore();
        } catch (error) {
            return null;
        }
    }

    function pwcaGetActiveViewId() {
        const store = pwcaGetCanvasStore();
        return store && store.activeViewId ? store.activeViewId : null;
    }

    function pwcaGetViews() {
        const store = pwcaGetCanvasStore();
        return store && Array.isArray(store.views) ? store.views : [];
    }

    function pwcaFindViewById(viewId) {
        if (!viewId) {
            return null;
        }

        return pwcaGetViews().find((view) => view && view.id === viewId) || null;
    }

    function pwcaGetCurrentView() {
        return pwcaFindViewById(pwcaGetActiveViewId());
    }

    function pwcaGetProductVariants() {
        const store = pwcaGetCanvasStore();
        const variants =
            store &&
            store.productData &&
            store.productData.variants &&
            store.productData.variants.data;

        return Array.isArray(variants) ? variants : [];
    }

    function pwcaHasProductVariants() {
        return pwcaGetProductVariants().length > 0;
    }

    function pwcaGetCanvasByViewId(viewId) {
        if (!viewId || !window.CanvasManager || typeof window.CanvasManager.getCanvas !== 'function') {
            return null;
        }

        return window.CanvasManager.getCanvas(viewId);
    }

    function pwcaGetAllViewIds() {
        const viewIdsFromStore = pwcaGetViews()
            .map((view) => (view && view.id ? view.id : null))
            .filter((viewId) => typeof viewId === 'string' && viewId !== '');

        if (viewIdsFromStore.length > 0) {
            return viewIdsFromStore;
        }

        if (window.CanvasManager && typeof window.CanvasManager.getViewIds === 'function') {
            return window.CanvasManager.getViewIds() || [];
        }

        if (window.CanvasManager && typeof window.CanvasManager.getAllCanvasIds === 'function') {
            return (window.CanvasManager.getAllCanvasIds() || []).filter((canvasId) => {
                return typeof canvasId === 'string' && canvasId.indexOf('baseCanvas-') !== 0;
            });
        }

        return [];
    }

    function pwcaGetAllViewCanvases() {
        return pwcaGetAllViewIds()
            .map((viewId) => pwcaGetCanvasByViewId(viewId))
            .filter((canvas) => canvas !== null);
    }

    function pwcaGetBaseCanvasByViewId(viewId) {
        if (!viewId) {
            return null;
        }

        const baseCanvasId = `baseCanvas-${viewId}`;

        if (window.CanvasManager && typeof window.CanvasManager.getCanvas === 'function') {
            const managedCanvas = window.CanvasManager.getCanvas(baseCanvasId);
            if (managedCanvas) {
                return managedCanvas;
            }
        }

        const baseCanvasElement = document.getElementById(baseCanvasId);
        if (baseCanvasElement && baseCanvasElement.__fabricCanvas) {
            return baseCanvasElement.__fabricCanvas;
        }

        return null;
    }

    function pwcaGetActiveCanvas() {
        if (typeof window.pwcaGetActiveCanvas === 'function') {
            const activeCanvas = window.pwcaGetActiveCanvas();
            if (activeCanvas) {
                return activeCanvas;
            }
        }

        if (window.CanvasManager && typeof window.CanvasManager.getActiveCanvas === 'function') {
            const activeCanvas = window.CanvasManager.getActiveCanvas();
            if (activeCanvas) {
                return activeCanvas;
            }
        }

        const activeViewId = pwcaGetActiveViewId();
        if (activeViewId) {
            const activeCanvas = pwcaGetCanvasByViewId(activeViewId);
            if (activeCanvas) {
                return activeCanvas;
            }
        }

        return window.canvas || window.fabricCanvas || null;
    }

    function pwcaGetActiveObject() {
        const activeCanvas = pwcaGetActiveCanvas();

        if (!activeCanvas || typeof activeCanvas.getActiveObject !== 'function') {
            return null;
        }

        return activeCanvas.getActiveObject() || null;
    }

    function pwcaGetCurrentActiveTab() {
        if (typeof window.pwcaGetCurrentActiveTab !== 'function') {
            return null;
        }

        return window.pwcaGetCurrentActiveTab();
    }

    function pwcaGetActiveObjectType() {
        const activeObject = pwcaGetActiveObject();
        return activeObject && activeObject.type ? activeObject.type : null;
    }

    function pwcaGetCurrentBaseCanvas() {
        const activeViewId = pwcaGetActiveViewId();
        return activeViewId ? pwcaGetBaseCanvasByViewId(activeViewId) : null;
    }

    function pwcaGetCurrentViewLayers() {
        const store = pwcaGetCanvasStore();
        const activeViewId = pwcaGetActiveViewId();

        if (!store || !activeViewId || typeof store.getViewLayers !== 'function') {
            return [];
        }

        return store.getViewLayers(activeViewId) || [];
    }

    function pwcaIsFirstView(viewId) {
        const views = pwcaGetViews();
        if (!viewId || views.length === 0) {
            return false;
        }

        return views[0] && views[0].id === viewId;
    }

    function pwcaFindCurrentViewLayerById(layerId) {
        if (!layerId) {
            return null;
        }

        return pwcaGetCurrentViewLayers().find((layer) => layer && layer.id === layerId) || null;
    }

    function pwcaGetPrintMethodForObject(obj) {
        if (!obj) {
            return null;
        }

        const printMethodStore = pwcaGetPrintMethodStore();
        if (!printMethodStore) {
            return null;
        }

        let method = null;
        if (obj.id && typeof printMethodStore.getLayerPrintMethod === 'function') {
            method = printMethodStore.getLayerPrintMethod(obj);
        }

        if (!method && obj.groupId && typeof printMethodStore.getGroupPrintMethod === 'function') {
            method = printMethodStore.getGroupPrintMethod(obj.groupId);
        }

        return method || null;
    }

    window.pwcaUiStateAccess = {
        pwcaGetCanvasStore,
        pwcaGetPrintMethodStore,
        pwcaGetActiveViewId,
        pwcaGetViews,
        pwcaFindViewById,
        pwcaGetCurrentView,
        pwcaGetProductVariants,
        pwcaHasProductVariants,
        pwcaGetCanvasByViewId,
        pwcaGetAllViewIds,
        pwcaGetAllViewCanvases,
        pwcaGetBaseCanvasByViewId,
        pwcaGetActiveCanvas,
        pwcaGetActiveObject,
        pwcaGetCurrentActiveTab,
        pwcaGetActiveObjectType,
        pwcaGetCurrentBaseCanvas,
        pwcaGetCurrentViewLayers,
        pwcaFindCurrentViewLayerById,
        pwcaGetPrintMethodForObject,
        pwcaIsFirstView
    };
})();
