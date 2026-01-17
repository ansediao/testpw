(function () {
    'use strict';

    function pwcaWaitForStore(callback) {
        if (typeof window.useCanvasStore === 'function') {
            const store = window.useCanvasStore();
            callback(store);
            return;
        }
        window.setTimeout(function () {
            pwcaWaitForStore(callback);
        }, 100);
    }

    function pwcaSetupStoreWatcher(store) {
        let previousLoadingState = store.isLoadingProductData;

        if (!store.isLoadingProductData && store.productData) {
            pwcaCreateViewButtons(store, store.productData);
        }

        store.$subscribe(function (mutation, state) {
            if (
                mutation.storeId === 'canvas' &&
                previousLoadingState === true &&
                state.isLoadingProductData === false &&
                state.productData
            ) {
                pwcaCreateViewButtons(store, state.productData);
            }
            previousLoadingState = state.isLoadingProductData;
        });
    }

    function pwcaCreateViewButtons(store, productData) {
        const container = document.getElementById('pw-view-switcher-container');
        if (!container || !productData || !productData.templates || !productData.templates.views) {
            return;
        }

        const views = productData.templates.views;
        if (!views.length) {
            return;
        }

        container.innerHTML = '';

        views.forEach(function (view, index) {
            const button = document.createElement('button');
            button.className = 'viewer-switch-btn';
            button.textContent = view.view_name || view.name || 'View';
            button.setAttribute('data-view-id', view.id);

            if (index === 0) {
                button.classList.add('active');
            }

            button.addEventListener('click', function () {
                if (button.classList.contains('active')) {
                    return;
                }

                container.querySelectorAll('.viewer-switch-btn').forEach(function (btn) {
                    btn.classList.remove('active');
                });
                button.classList.add('active');

                if (typeof store.setActiveViewId === 'function') {
                    store.setActiveViewId(view.id);
                }

                pwcaSwitchToView(view);

                document.dispatchEvent(
                    new CustomEvent('layerPanelViewSwitch', {
                        detail: { viewId: view.id }
                    })
                );
            });

            container.appendChild(button);
        });

        const firstView = views[0];
        if (firstView && typeof store.setActiveViewId === 'function') {
            store.setActiveViewId(firstView.id);
            pwcaSwitchToView(firstView);
            document.dispatchEvent(
                new CustomEvent('layerPanelViewSwitch', {
                    detail: { viewId: firstView.id }
                })
            );
        }

        document.addEventListener('layerPanelViewSwitch', function (event) {
            const viewId = event.detail && event.detail.viewId ? event.detail.viewId : null;
            if (!viewId) {
                return;
            }

            const targetButton = container.querySelector('[data-view-id="' + viewId + '"]');d = event.detail && event.detail.viewId ? event.detail.viewId : null;
            if (!viewId) {
                return;
            }

            const targetButton = container.querySelector('[data-view-id=\"' + viewId + '\"]');
            if (targetButton && !targetButton.classList.contains('active')) {
                container.querySelectorAll('.viewer-switch-btn').forEach(function (btn) {
                    btn.classList.remove('active');
                });
                targetButton.classList.add('active');
            }

            const targetView = views.find(function (v) {
                return v.id === viewId;
            });
            if (targetView) {
                pwcaSwitchToView(targetView);
            }
        });
    }

    function pwcaSwitchToView(view) {
        const allViewContainers = document.querySelectorAll('.view-container');
        allViewContainers.forEach(function (container) {
            container.style.display = 'none';
        });

        const viewContainer = document.getElementById('view-container-' + view.id);
        if (viewContainer) {
            viewContainer.style.display = 'block';
        }

        const canvasManager = window.CanvasManager;
        let canvas = null;

        if (canvasManager && typeof canvasManager.getCanvas === 'function') {
            canvas = canvasManager.getCanvas(view.id);
        }

        if (canvasManager && typeof canvasManager.setActiveCanvas === 'function') {
            canvasManager.setActiveCanvas(view.id);
        }

        if (canvas) {
            const allCanvasIds =
                canvasManager && typeof canvasManager.getAllCanvasIds === 'function'
                    ? canvasManager.getAllCanvasIds()
                    : [];

            allCanvasIds.forEach(function (canvasId) {
                const viewCanvas = canvasManager.getCanvas(canvasId);
                if (viewCanvas && typeof viewCanvas.discardActiveObject === 'function') {
                    viewCanvas.discardActiveObject();
                    viewCanvas.renderAll();
                }
            });

            if (typeof window.setGlobalCanvas === 'function') {
                window.setGlobalCanvas(canvas);
            } else {
                window.canvas = canvas;
                window.fabricCanvas = canvas;
            }

            canvas.renderAll();
        }
    }

    function pwcaInitViewSwitcher() {
        pwcaWaitForStore(pwcaSetupStoreWatcher);
    }

    document.addEventListener('DOMContentLoaded', pwcaInitViewSwitcher);
})();