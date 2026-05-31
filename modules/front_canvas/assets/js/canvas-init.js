// Canvas bootstrap using CanvasManager
(function() {
    'use strict';

    let isInitialized = false;

    function init() {
        if (isInitialized) {
            return;
        }

        console.log('[PW Canvas] Start canvas initialization');

        if (typeof window.CanvasManager === 'undefined') {
            return;
        }

        isInitialized = true;

        const canvasStore = window.Pinia && window.useCanvasStore ? window.useCanvasStore() : null;

        if (canvasStore && canvasStore.views && canvasStore.views.length > 0) {
            initializeMultiViewCanvases(canvasStore);
        } else {
            console.warn('[PW Canvas] No view data found, cannot initialize canvases');
        }

        document.addEventListener('multiViewInitComplete', () => {
            console.log('[PW Canvas] Canvas initialization completed');

            const currentStore = window.Pinia && window.useCanvasStore ? window.useCanvasStore() : canvasStore;
            if (!currentStore || !currentStore.views) {
                return;
            }

            currentStore.views.forEach((view) => {
                const canvasId = `mainCanvas-${view.id}`;
                const canvas = window.CanvasManager.getCanvas(canvasId);
                if (canvas) {
                    canvas.on('object:modified', (event) => console.log('Object modified:', event.target));
                    canvas.on('object:added', (event) => console.log('Object added:', event.target));
                    canvas.on('object:removed', (event) => console.log('Object removed:', event.target));
                }
            });

            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('product_id');

            if (productId) {
                const storageKey = `pw_product_color_${productId}`;
                const savedColor = localStorage.getItem(storageKey);

                if (savedColor) {
                    setTimeout(() => {
                        if (typeof window.pwcaClearAllGradientRects === 'function') {
                            window.pwcaClearAllGradientRects();
                        }
                        if (typeof window.pwca_apply_color_to_all_views === 'function') {
                            window.pwca_apply_color_to_all_views(savedColor);
                        }
                        if (typeof window.updateColorStatusUI === 'function') {
                            window.updateColorStatusUI(savedColor);
                        } else {
                            window.pwca_current_color = savedColor;
                        }
                    }, 500);
                }
            }
        });
    }

    function initializeMultiViewCanvases(canvasStore) {
        if (!canvasStore || !canvasStore.views) {
            return;
        }

        canvasStore.views.forEach((view) => {
            if (window.CanvasInitializationState) {
                window.CanvasInitializationState.startInitialization(view.id);
            }
        });

        canvasStore.views.forEach((view) => {
            const canvasId = `mainCanvas-${view.id}`;
            const canvasElement = document.getElementById(canvasId);

            if (canvasElement) {
                const canvas = window.CanvasManager.createCanvas(canvasId, view.id, {
                    width: canvasElement.clientWidth || 800,
                    height: canvasElement.clientHeight || 600,
                    backgroundColor: 'transparent'
                });

                if (view.id === canvasStore.activeViewId) {
                    window.CanvasManager.setActiveCanvas(view.id);
                }

                if (window.PrintAreaValidator) {
                    window.PrintAreaValidator.addPrintAreaValidationListeners(canvas, view.id);
                }

                setTimeout(() => {
                    if (window.CanvasInitializationState) {
                        window.CanvasInitializationState.completeInitialization(view.id);
                    }
                }, 500);
            }
        });
    }

    function initializeZoom() {
        const zoomSlider = document.getElementById('zoomSlider');
        const zoomValue = document.getElementById('zoomValue');

        if (zoomSlider && zoomValue) {
            const autoZoom = calculateAutoZoom();
            let currentZoom = autoZoom;

            zoomSlider.value = currentZoom;
            zoomValue.textContent = currentZoom + '%';
            updateCanvasZoom(currentZoom / 100);

            zoomSlider.addEventListener('input', function() {
                currentZoom = parseInt(this.value, 10);
                zoomValue.textContent = currentZoom + '%';
                updateCanvasZoom(currentZoom / 100);
            });
        }
    }

    function calculateAutoZoom() {
        try {
            const multiViewContainer = document.getElementById('multi-view-container');
            const canvasBox = document.querySelector('.canvas-box');

            if (!multiViewContainer || !canvasBox) {
                return 95;
            }

            setTimeout(() => {
                const actualZoom = calculateOptimalZoom();
                if (actualZoom !== 95) {
                    const zoomSlider = document.getElementById('zoomSlider');
                    const zoomValue = document.getElementById('zoomValue');
                    if (zoomSlider && zoomValue) {
                        zoomSlider.value = actualZoom;
                        zoomValue.textContent = actualZoom + '%';
                        updateCanvasZoom(actualZoom / 100);
                    }
                }
            }, 500);

            return 95;
        } catch (error) {
            return 95;
        }
    }

    function calculateOptimalZoom() {
        const multiViewContainer = document.getElementById('multi-view-container');
        const canvasBox = document.querySelector('.canvas-box');

        if (!multiViewContainer || !canvasBox) {
            return 95;
        }

        const originalTransform = multiViewContainer.style.transform;
        multiViewContainer.style.transform = 'scale(1)';

        const canvasBoxStyle = window.getComputedStyle(canvasBox);
        const availableHeight = canvasBox.clientHeight -
            parseFloat(canvasBoxStyle.paddingTop || 0) -
            parseFloat(canvasBoxStyle.paddingBottom || 0);

        const containerHeight = multiViewContainer.scrollHeight;
        multiViewContainer.style.transform = originalTransform;

        if (containerHeight > availableHeight) {
            const requiredScale = (availableHeight * 0.95) / containerHeight;
            return Math.max(10, Math.min(200, Math.round(requiredScale * 100)));
        }

        return 95;
    }

    function updateCanvasZoom(scale) {
        const multiViewContainer = document.getElementById('multi-view-container');
        if (multiViewContainer) {
            multiViewContainer.style.transform = `scale(${scale})`;
            multiViewContainer.style.transformOrigin = 'center center';
        }
    }

    function triggerAutoZoomAdjustment() {
        const actualZoom = calculateOptimalZoom();
        if (actualZoom !== 95) {
            const zoomSlider = document.getElementById('zoomSlider');
            const zoomValue = document.getElementById('zoomValue');
            if (zoomSlider && zoomValue) {
                zoomSlider.value = actualZoom;
                zoomValue.textContent = actualZoom + '%';
                updateCanvasZoom(actualZoom / 100);
            }
        }
    }

    function handleViewSwitch(event) {
        const { viewId } = event.detail;
        if (window.CanvasManager) {
            window.CanvasManager.setActiveCanvas(viewId);
        }
    }

    document.addEventListener('viewSwitched', handleViewSwitch);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    document.addEventListener('canvasManagerReady', init);

    window.initCanvasSystem = init;
    window.triggerAutoZoomAdjustment = triggerAutoZoomAdjustment;
    window.updateCanvasZoom = updateCanvasZoom;
    window.initializeZoom = initializeZoom;
})();
