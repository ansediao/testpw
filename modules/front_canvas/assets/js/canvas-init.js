// Canvas 初始化脚本 - 使用新的 CanvasManager
(function() {
    'use strict';

    // 添加初始化标志，防止重复执行
    let isInitialized = false;

    // 初始化函数
    function init() {
        // 防止重复初始化
        if (isInitialized) {
            return;
        }
        
        // 控制台日志
        console.log('Page 开始初始化画布');
        
        // 检查 CanvasManager 是否已加载
        if (typeof window.CanvasManager === 'undefined') {
            return;
        }

        // 标记为已初始化
        isInitialized = true;

        // 获取 store
        const canvasStore = window.Pinia && window.useCanvasStore ? window.useCanvasStore() : null;
        
        // 统一走多视图初始化逻辑
        if (canvasStore && canvasStore.views && canvasStore.views.length > 0) {
            initializeMultiViewCanvases(canvasStore);
        } else {
            console.warn('[PW Canvas] 未发现视图数据，无法初始化画布');
        }

        // 初始化完成后 log
        document.addEventListener('multiViewInitComplete', (e) => {
            console.log('画布初始化完成');
            
            const currentStore = window.Pinia && window.useCanvasStore ? window.useCanvasStore() : canvasStore;
            if (!currentStore || !currentStore.views) return;

            // 监听所有视图中 main 画布的操作
            currentStore.views.forEach(view => {
                const canvasId = `mainCanvas-${view.id}`;
                const canvas = window.CanvasManager.getCanvas(canvasId);
                if (canvas) {
                    canvas.on('object:modified', (e) => console.log('对象修改:', e.target));
                    canvas.on('object:added', (e) => console.log('对象添加:', e.target));
                    canvas.on('object:removed', (e) => console.log('对象删除:', e.target));
                }
            });
           
            // 尝试从 URL 获取 product_id 并应用保存的颜色
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('product_id');
            
            if (productId) {
                const storageKey = `pw_product_color_${productId}`;
                const savedColor = localStorage.getItem(storageKey);
                
                if (savedColor) {
                    setTimeout(() => {
                        if (typeof window.clearAllGradientRects === 'function') {
                            window.clearAllGradientRects();
                        }
                        if (typeof window.applyColorToAllViews === 'function') {
                            window.applyColorToAllViews(savedColor);
                        }
                        if (typeof window.updateColorStatusUI === 'function') {
                            window.updateColorStatusUI(savedColor);
                        } else {
                            window.currentColor = savedColor;
                        }
                    }, 500);
                }
            }
        });
    }

    /**
     * 初始化多视图 Canvas
     * @param {Object} canvasStore - Pinia store 实例
     */
    function initializeMultiViewCanvases(canvasStore) {
        if (!canvasStore || !canvasStore.views) return;

        canvasStore.views.forEach(view => {
            if (window.CanvasInitializationState) {
                window.CanvasInitializationState.startInitialization(view.id);
            }
        });

        canvasStore.views.forEach(view => {
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

    // 初始化缩放功能
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
                currentZoom = parseInt(this.value);
                zoomValue.textContent = currentZoom + '%';
                updateCanvasZoom(currentZoom / 100);
            });
        }
    }

    /**
     * 计算自动缩放比例
     */
    function calculateAutoZoom() {
        try {
            const multiViewContainer = document.getElementById('multi-view-container');
            const canvasBox = document.querySelector('.canvas-box');
            
            if (!multiViewContainer || !canvasBox) return 95;

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

    /**
     * 计算最优缩放比例
     */
    function calculateOptimalZoom() {
        const multiViewContainer = document.getElementById('multi-view-container');
        const canvasBox = document.querySelector('.canvas-box');
        
        if (!multiViewContainer || !canvasBox) return 95;

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

    /**
     * 更新 Canvas 缩放
     */
    function updateCanvasZoom(scale) {
        const multiViewContainer = document.getElementById('multi-view-container');
        if (multiViewContainer) {
            multiViewContainer.style.transform = `scale(${scale})`;
            multiViewContainer.style.transformOrigin = 'center center';
        }
    }

    /**
     * 触发自动缩放调整
     */
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

    // 监听视图切换事件
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

})();
