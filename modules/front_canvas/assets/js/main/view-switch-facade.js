(function () {
    'use strict';

    function waitForStore(callback, attempts = 0) {
        if (typeof window.useCanvasStore === 'function') {
            const store = window.useCanvasStore();
            if (store) {
                callback(store);
                return;
            }
        }

        if (attempts > 100) {
            return;
        }

        window.setTimeout(() => {
            waitForStore(callback, attempts + 1);
        }, 100);
    }

    function getViewById(store, viewId) {
        if (!store || !Array.isArray(store.views)) {
            return null;
        }

        return store.views.find((view) =>
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
            ? canvasManager.getCanvas(viewId)
            : null;

        if (!canvas) {
            return null;
        }

        const allCanvasIds = typeof canvasManager.getAllCanvasIds === 'function'
            ? canvasManager.getAllCanvasIds()
            : [];

        allCanvasIds.forEach((canvasId) => {
            const viewCanvas = canvasManager.getCanvas(canvasId);
            if (viewCanvas && typeof viewCanvas.discardActiveObject === 'function') {
                viewCanvas.discardActiveObject();
                if (typeof viewCanvas.renderAll === 'function') {
                    viewCanvas.renderAll();
                }
            }
        });

        if (typeof window.setGlobalCanvas === 'function') {
            window.setGlobalCanvas(canvas);
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

            if (forceDomSync || store.activeViewId === targetView.id) {
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
