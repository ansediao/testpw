(function () {
    'use strict';

    function getUiStateAccess() {
        return window.pwcaUiStateAccess || null;
    }

    function getCanvasStore() {
        const uiStateAccess = getUiStateAccess();
        if (uiStateAccess && typeof uiStateAccess.pwcaGetCanvasStore === 'function') {
            return uiStateAccess.pwcaGetCanvasStore();
        }

        return null;
    }

    function getViews() {
        const uiStateAccess = getUiStateAccess();
        if (uiStateAccess && typeof uiStateAccess.pwcaGetViews === 'function') {
            return uiStateAccess.pwcaGetViews();
        }

        const store = getCanvasStore();
        return store && Array.isArray(store.views) ? store.views : [];
    }

    function getCurrentActiveViewId() {
        const uiStateAccess = getUiStateAccess();
        if (uiStateAccess && typeof uiStateAccess.pwcaGetActiveViewId === 'function') {
            return uiStateAccess.pwcaGetActiveViewId();
        }

        const store = getCanvasStore();
        return store && store.activeViewId ? store.activeViewId : null;
    }

    function getCanvasByViewId(viewId) {
        const uiStateAccess = getUiStateAccess();
        if (uiStateAccess && typeof uiStateAccess.pwcaGetCanvasByViewId === 'function') {
            return uiStateAccess.pwcaGetCanvasByViewId(viewId);
        }

        return null;
    }

    function getAllViewCanvases() {
        const uiStateAccess = getUiStateAccess();
        if (uiStateAccess && typeof uiStateAccess.pwcaGetAllViewCanvases === 'function') {
            return uiStateAccess.pwcaGetAllViewCanvases();
        }

        return [];
    }

    function waitForStore(callback, attempts = 0) {
        const store = getCanvasStore();
        if (store) {
            callback(store);
            return;
        }

        if (attempts > 100) {
            return;
        }

        window.setTimeout(() => {
            waitForStore(callback, attempts + 1);
        }, 100);
    }

    function getViewById(store, viewId) {
        const views = store && Array.isArray(store.views) ? store.views : getViews();
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

    function syncViewContainers(viewId) {
        document.querySelectorAll('.view-container').forEach((container) => {
            container.style.display = 'none';
        });

        const targetContainer = document.getElementById(`view-container-${viewId}`);
        if (targetContainer) {
            targetContainer.style.display = 'block';
        }
    }

    function syncCanvasManager(viewId) {
        const canvasManager = window.CanvasManager;
        if (!canvasManager) {
            return null;
        }

        if (typeof canvasManager.setActiveCanvas === 'function') {
            canvasManager.setActiveCanvas(viewId);
        }

        const canvas = typeof canvasManager.getCanvas === 'function'
            ? (getCanvasByViewId(viewId) || canvasManager.getCanvas(viewId))
            : getCanvasByViewId(viewId);

        if (!canvas) {
            return null;
        }

        getAllViewCanvases().forEach((viewCanvas) => {
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
            window.canvas = canvas;
            window.fabricCanvas = canvas;
        }

        if (typeof canvas.renderAll === 'function') {
            canvas.renderAll();
        }

        return canvas;
    }

    function emitViewSwitch(viewId, source) {
        document.dispatchEvent(new CustomEvent('layerPanelViewSwitch', {
            detail: {
                viewId,
                source: source || 'pwca-view-switch-facade'
            }
        }));
    }

    function switchToView(viewId, options = {}) {
        waitForStore((store) => {
            const targetView = getViewById(store, viewId);
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

            if (forceDomSync || getCurrentActiveViewId() === targetView.id) {
                syncViewContainers(targetView.id);
                syncCanvasManager(targetView.id);
            }

            if (shouldDispatchEvent) {
                emitViewSwitch(targetView.id, source);
            }
        });
    }

    window.pwcaViewSwitchFacade = {
        waitForStore,
        getViewById,
        syncViewContainers,
        syncCanvasManager,
        switchToView
    };
})();
