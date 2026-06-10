(function () {
    'use strict';

    function pwcaGetUiStateAccess() {
        return window.pwcaUiStateAccess || null;
    }

    function pwcaGetCanvasStore() {
        const uiStateAccess = pwcaGetUiStateAccess();
        if (uiStateAccess && typeof uiStateAccess.pwcaGetCanvasStore === 'function') {
            return uiStateAccess.pwcaGetCanvasStore();
        }

        return null;
    }

    function pwcaGetViews() {
        const uiStateAccess = pwcaGetUiStateAccess();
        if (uiStateAccess && typeof uiStateAccess.pwcaGetViews === 'function') {
            return uiStateAccess.pwcaGetViews();
        }

        const store = pwcaGetCanvasStore();
        return store && Array.isArray(store.views) ? store.views : [];
    }

    function pwcaGetCurrentActiveViewId() {
        const uiStateAccess = pwcaGetUiStateAccess();
        if (uiStateAccess && typeof uiStateAccess.pwcaGetActiveViewId === 'function') {
            return uiStateAccess.pwcaGetActiveViewId();
        }

        const store = pwcaGetCanvasStore();
        return store && store.activeViewId ? store.activeViewId : null;
    }

    function pwcaGetCanvasByViewId(viewId) {
        const uiStateAccess = pwcaGetUiStateAccess();
        if (uiStateAccess && typeof uiStateAccess.pwcaGetCanvasByViewId === 'function') {
            return uiStateAccess.pwcaGetCanvasByViewId(viewId);
        }

        return null;
    }

    function pwcaGetAllViewCanvases() {
        const uiStateAccess = pwcaGetUiStateAccess();
        if (uiStateAccess && typeof uiStateAccess.pwcaGetAllViewCanvases === 'function') {
            return uiStateAccess.pwcaGetAllViewCanvases();
        }

        return [];
    }

    function pwcaWaitForStore(callback, attempts = 0) {
        const store = pwcaGetCanvasStore();
        if (store) {
            callback(store);
            return;
        }

        if (attempts > 100) {
            return;
        }

        window.setTimeout(() => {
            pwcaWaitForStore(callback, attempts + 1);
        }, 100);
    }

    function pwcaGetViewById(store, viewId) {
        const views = store && Array.isArray(store.views) ? store.views : pwcaGetViews();
        if (!Array.isArray(views) || views.length === 0) {
            return null;
        }

        return views.find((view) =>
            view &&
            (
                view.id === viewId ||
                view.view_id === viewId ||
                String(view.id) === String(viewId)
            )
        ) || null;
    }

    function pwcaSyncViewContainers(viewId) {
        document.querySelectorAll('.pwca-view-container').forEach((container) => {
            container.style.display = 'none';
        });

        const targetContainer = document.getElementById(`view-container-${viewId}`);
        if (targetContainer) {
            targetContainer.style.display = 'block';
        }
    }

    function pwcaSyncCanvasManager(viewId) {
        const canvasManager = window.pwcaCanvasManager;
        if (!canvasManager) {
            return null;
        }

        if (typeof canvasManager.setActiveCanvas === 'function') {
            canvasManager.setActiveCanvas(viewId);
        }

        const canvas = typeof canvasManager.getCanvas === 'function'
            ? (pwcaGetCanvasByViewId(viewId) || canvasManager.getCanvas(viewId))
            : pwcaGetCanvasByViewId(viewId);

        if (!canvas) {
            return null;
        }

        pwcaGetAllViewCanvases().forEach((viewCanvas) => {
            if (viewCanvas && typeof viewCanvas.discardActiveObject === 'function') {
                viewCanvas.discardActiveObject();
                if (typeof viewCanvas.renderAll === 'function') {
                    viewCanvas.renderAll();
                }
            }
        });

        if (typeof window.pwcaSetGlobalCanvas === 'function') {
            window.pwcaSetGlobalCanvas(canvas);
        } else {
            window.pwcaCanvas = canvas;
            window.pwcaFabricCanvas = canvas;
        }

        if (typeof canvas.renderAll === 'function') {
            canvas.renderAll();
        }

        return canvas;
    }

    function pwcaEmitViewSwitch(viewId, source) {
        document.dispatchEvent(new CustomEvent('layerPanelViewSwitch', {
            detail: {
                viewId,
                source: source || 'pwca-view-switch-facade'
            }
        }));
    }

    function pwcaSwitchToView(viewId, options = {}) {
        pwcaWaitForStore((store) => {
            const targetView = pwcaGetViewById(store, viewId);
            if (!targetView) {
                return;
            }

            const shouldUpdateStore = options.updateStore !== false;
            const shouldDispatchEvent = options.dispatchEvent !== false;
            const forceDomSync = options.forceDomSync === true;
            const source = options.source || 'pwca-view-switch-facade';

            if (shouldUpdateStore && typeof store.setActiveViewId === 'function') {
                store.setActiveViewId(targetView.id);
            }

            if (forceDomSync || pwcaGetCurrentActiveViewId() === targetView.id) {
                pwcaSyncViewContainers(targetView.id);
                pwcaSyncCanvasManager(targetView.id);
            }

            if (shouldDispatchEvent) {
                pwcaEmitViewSwitch(targetView.id, source);
            }
        });
    }

    window.pwcaViewSwitchFacade = {
        waitForStore: pwcaWaitForStore,
        getViewById: pwcaGetViewById,
        syncViewContainers: pwcaSyncViewContainers,
        syncCanvasManager: pwcaSyncCanvasManager,
        switchToView: pwcaSwitchToView
    };
})();
