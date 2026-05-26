(function () {
    function getCanvasStore() {
        if (typeof window.useCanvasStore !== 'function') {
            return null;
        }

        try {
            return window.useCanvasStore();
        } catch (error) {
            return null;
        }
    }

    function getPrintMethodStore() {
        if (typeof window.usePrintMethodStore !== 'function') {
            return null;
        }

        try {
            return window.usePrintMethodStore();
        } catch (error) {
            return null;
        }
    }

    function getActiveViewId() {
        const store = getCanvasStore();
        return store && store.activeViewId ? store.activeViewId : null;
    }

    function getViews() {
        const store = getCanvasStore();
        return store && Array.isArray(store.views) ? store.views : [];
    }

    function findViewById(viewId) {
        if (!viewId) {
            return null;
        }

        return getViews().find((view) => view && view.id === viewId) || null;
    }

    function getCurrentView() {
        return findViewById(getActiveViewId());
    }

    function getProductVariants() {
        const store = getCanvasStore();
        const variants =
            store &&
            store.productData &&
            store.productData.variants &&
            store.productData.variants.data;

        return Array.isArray(variants) ? variants : [];
    }

    function getCanvasByViewId(viewId) {
        if (!viewId || !window.CanvasManager || typeof window.CanvasManager.getCanvas !== 'function') {
            return null;
        }

        return window.CanvasManager.getCanvas(viewId);
    }

    function getActiveCanvas() {
        if (typeof window.getActiveCanvas === 'function') {
            return window.getActiveCanvas();
        }

        if (window.CanvasManager && typeof window.CanvasManager.getActiveCanvas === 'function') {
            return window.CanvasManager.getActiveCanvas();
        }

        const activeViewId = getActiveViewId();
        return activeViewId ? getCanvasByViewId(activeViewId) : null;
    }

    function getCurrentViewLayers() {
        const store = getCanvasStore();
        const activeViewId = getActiveViewId();

        if (!store || !activeViewId || typeof store.getViewLayers !== 'function') {
            return [];
        }

        return store.getViewLayers(activeViewId) || [];
    }

    function findCurrentViewLayerById(layerId) {
        if (!layerId) {
            return null;
        }

        return getCurrentViewLayers().find((layer) => layer && layer.id === layerId) || null;
    }

    function getPrintMethodForObject(obj) {
        if (!obj) {
            return null;
        }

        const printMethodStore = getPrintMethodStore();
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
        getCanvasStore,
        getPrintMethodStore,
        getActiveViewId,
        getViews,
        findViewById,
        getCurrentView,
        getProductVariants,
        getCanvasByViewId,
        getActiveCanvas,
        getCurrentViewLayers,
        findCurrentViewLayerById,
        getPrintMethodForObject
    };
})();
