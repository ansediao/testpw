(function () {
    'use strict';

    const waitForStore = (callback) => {
        if (typeof window.useCanvasStore === 'function') {
            const store = window.useCanvasStore();
            callback(store);
            return;
        }
        window.setTimeout(() => {
            waitForStore(callback);
        }, 100);
    };

    const setupStoreWatcher = (store) => {
        let previousLoadingState = store.isLoadingProductData;

        if (!store.isLoadingProductData && store.productData) {
            createViewButtons(store, store.productData);
        }

        store.$subscribe((mutation, state) => {
            if (
                mutation.storeId === 'canvas' &&
                previousLoadingState === true &&
                state.isLoadingProductData === false &&
                state.productData
            ) {
                createViewButtons(store, state.productData);
            }
            previousLoadingState = state.isLoadingProductData;
        });
    };

    const createViewButtons = (store, productData) => {
        const container = document.getElementById('pw-view-switcher-container');
        if (!container || !productData || !productData.templates || !Array.isArray(productData.templates.views)) {
            return;
        }

        const views = productData.templates.views;
        if (!views.length) {
            return;
        }

        container.innerHTML = '';

        views.forEach((view, index) => {
            const button = document.createElement('button');
            button.className = 'viewer-switch-btn';
            button.textContent = view.view_name || view.name || 'View';
            button.setAttribute('data-view-id', view.id);

            if (index === 0) {
                button.classList.add('active');
            }

            button.addEventListener('click', () => {
                if (button.classList.contains('active')) {
                    return;
                }

                container.querySelectorAll('.viewer-switch-btn').forEach((btn) => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');

                window.pwcaViewSwitchFacade.switchToView(view.id, {
                    source: 'customization-area-button',
                    forceDomSync: true
                });
            });

            container.appendChild(button);
        });

        const firstView = views[0];
        if (firstView) {
            window.pwcaViewSwitchFacade.switchToView(firstView.id, {
                source: 'customization-area-init',
                forceDomSync: true
            });
        }

        document.addEventListener('layerPanelViewSwitch', (event) => {
            const viewId = event.detail && event.detail.viewId ? event.detail.viewId : null;
            if (!viewId) {
                return;
            }

            const targetButton = container.querySelector('[data-view-id="' + viewId + '"]');
            if (targetButton && !targetButton.classList.contains('active')) {
                container.querySelectorAll('.viewer-switch-btn').forEach((btn) => {
                    btn.classList.remove('active');
                });
                targetButton.classList.add('active');
            }

            const targetView = views.find((v) => v.id === viewId);
            if (targetView) {
                window.pwcaViewSwitchFacade.syncViewContainers(targetView.id);
                window.pwcaViewSwitchFacade.syncCanvasManager(targetView.id);
            }
        });
    };

    const initViewSwitcher = () => {
        waitForStore(setupStoreWatcher);
    };

    document.addEventListener('DOMContentLoaded', initViewSwitcher);
})();
