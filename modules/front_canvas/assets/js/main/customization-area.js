(function () {
    'use strict';

    let hasBoundLayerPanelViewSwitch = false;

    const pwcaGetCanvasStore = () => {
        const uiStateAccess = window.pwcaUiStateAccess || null;
        if (!uiStateAccess || typeof uiStateAccess.getCanvasStore !== 'function') {
            return null;
        }

        return uiStateAccess.getCanvasStore();
    };

    const waitForStore = (callback) => {
        const store = pwcaGetCanvasStore();
        if (store) {
            callback(store);
            return;
        }
        window.setTimeout(() => {
            waitForStore(callback);
        }, 100);
    };

    const setupStoreWatcher = (store) => {
        let previousLoadingState = store.isLoadingProductData;

        if (!store.isLoadingProductData && store.views && store.views.length > 0) {
            createViewButtons(store);
        }

        store.$subscribe((mutation, state) => {
            if (
                mutation.storeId === 'canvas' &&
                previousLoadingState === true &&
                state.isLoadingProductData === false &&
                state.views &&
                state.views.length > 0
            ) {
                createViewButtons(store);
            }
            previousLoadingState = state.isLoadingProductData;
        });
    };

    const createViewButtons = (store) => {
        const container = document.getElementById('pw-view-switcher-container');
        if (!container || !Array.isArray(store.views)) {
            return;
        }

        const views = store.views;
        
        if (!views.length) {
            container.innerHTML = '';
            container.style.display = 'none';
            return;
        }

        container.style.display = '';
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

        if (!hasBoundLayerPanelViewSwitch) {
            document.addEventListener('layerPanelViewSwitch', (event) => {
                const viewId = event.detail && event.detail.viewId ? event.detail.viewId : null;
                if (!viewId) {
                    return;
                }

                const nextContainer = document.getElementById('pw-view-switcher-container');
                if (!nextContainer) {
                    return;
                }

                const targetButton = nextContainer.querySelector('[data-view-id="' + viewId + '"]');
                if (targetButton && !targetButton.classList.contains('active')) {
                    nextContainer.querySelectorAll('.viewer-switch-btn').forEach((btn) => {
                        btn.classList.remove('active');
                    });
                    targetButton.classList.add('active');
                }
            });

            hasBoundLayerPanelViewSwitch = true;
        }
    };

    const initViewSwitcher = () => {
        waitForStore(setupStoreWatcher);
    };

    document.addEventListener('DOMContentLoaded', initViewSwitcher);
})();
