<?php
/**
 * Canvas Customization Area - View Switcher
 * 
 * This file displays the view switcher buttons for the canvas customization area.
 * It handles both legacy mode (using post meta) and API mode (using direct API communication).
 */

// Check if this is a synchronized product
$pw_isSyncProduct = get_post_meta($product_id, 'pw_isSyncProduct', true);
$api_product_id = get_post_meta($product_id, 'pw_id', true);

// Initialize view container
echo '<div class="pw-view-switcher-container" id="pw-view-switcher-container">';

echo '</div>';

// Add JavaScript to monitor Pinia state changes and create buttons dynamically
?>
<script>
document.addEventListener("DOMContentLoaded", function() {
    // Wait for Pinia store to be available
    function waitForStore() {
        if (typeof window.useCanvasStore === "function") {
            const store = window.useCanvasStore();
            let previousLoadingState = store.isLoadingProductData;
            
            // If data is already loaded, create buttons immediately
            if (!store.isLoadingProductData && store.productData) {
                createViewButtons(store.productData);
            }
            
            // Monitor isLoadingProductData changes
            const unwatch = store.$subscribe((mutation, state) => {
                if (mutation.storeId === "canvas" && 
                    previousLoadingState === true && 
                    state.isLoadingProductData === false) {
                    
                    // Loading completed, create buttons
                    createViewButtons(state.productData);
                }
                previousLoadingState = state.isLoadingProductData;
            });
        } else {
            // Retry if store not available yet
            setTimeout(waitForStore, 100);
        }
    }
    
    function createViewButtons(productData) {
        const store = window.useCanvasStore();
        if (!store) {
            return;
        }
        
        const container = document.getElementById("pw-view-switcher-container");
        if (!container) {
            return;
        }
        
        // Clear existing buttons
        container.innerHTML = "";
        
        // 从 store 获取视图信息
        const views = store.productData.templates.views;
        if (!views || views.length === 0) {
            return;
        }
        
        views.forEach((view, index) => {
            const button = document.createElement('button');
            button.className = 'viewer-switch-btn';
            button.textContent = view.view_name || view.name;
            button.setAttribute('data-view-id', view.id);
            button.setAttribute('data-view-data', JSON.stringify(view.data));
            
            // 第一个按钮默认激活
            if (index === 0) {
                button.classList.add('active');
            }
            
            // 添加点击事件
            button.addEventListener('click', function() {
                // 检查是否已经是当前激活的按钮
                if (button.classList.contains('active')) {
                    return;
                }
                
                // 移除所有按钮的激活状态
                container.querySelectorAll('.viewer-switch-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // 激活当前按钮
                button.classList.add('active');
                
                // 更新 store 中的激活视图
                store.setActiveViewId(view.id);
                
                // 触发视图切换
                switchToView(view);

                toggleHistoryButtons(view.id);

                // 同步通知视图切换事件（供颜色同步监听使用）
                document.dispatchEvent(new CustomEvent('layerPanelViewSwitch', { detail: { viewId: view.id } }));
            });
            
            container.appendChild(button);
        });
        
        // 默认激活第一个视图
        if (views.length > 0) {
            store.setActiveViewId(views[0].id);
            switchToView(views[0]);

            createHistoryButtons(views);
            toggleHistoryButtons(views[0].id);

            // 同步通知视图切换事件（供颜色同步监听使用）
            document.dispatchEvent(new CustomEvent('layerPanelViewSwitch', { detail: { viewId: views[0].id } }));
        }
        
        // 监听图层面板的视图切换事件
        document.addEventListener('layerPanelViewSwitch', function(event) {
            const viewId = event.detail.viewId;

            
            // 找到对应的视图按钮并激活
            const targetButton = container.querySelector(`[data-view-id="${viewId}"]`);
            if (targetButton && !targetButton.classList.contains('active')) {
                // 移除所有按钮的激活状态
                container.querySelectorAll('.viewer-switch-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // 激活目标按钮
                targetButton.classList.add('active');
                
                // 找到对应的视图数据
                const targetView = views.find(v => v.id === viewId);
                if (targetView) {
                    switchToView(targetView);
                    toggleHistoryButtons(viewId);
                }
            }
        });
    }

    function createHistoryButtons(views) {
        const container = document.getElementById('history-controls');
        if (!container) return;
        container.innerHTML = '';
        views.forEach(view => {
            const group = document.createElement('div');
            group.className = 'history-btn-group';
            group.id = `history-group-${view.id}`;
            group.style.display = 'none';

            const forward = document.createElement('button');
            forward.id = `forward-${view.id}`;
            forward.className = 'history-btn forward';
            forward.innerHTML = '<svg class="icon" width="16px" height="16px" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M516.7 150.7c4.3-0.1 8.6 0.1 12.9 0.1V49.2c0-27.8 31.2-44.3 54.2-28.7l364.6 247.6c15.8 10.8 20 32.3 9.2 48.2-2.5 3.6-5.6 6.7-9.2 9.2L583.7 573.1c-23 15.6-54.2-0.8-54.2-28.7V441.7c-175.7-2.1-321.7 120.5-328.8 279-5.4 121.6 72.6 229.4 188.2 279.2 2.1 0.9 4.3 2.7 4.1 6.3-0.2 2.9-3.2 3.8-5.8 3C202.1 954.8 65.8 794.9 60.7 602.4c-6.5-242.6 197.7-444.8 456-451.7z" fill="currentColor"/></svg>';
            const backward = document.createElement('button');
            backward.id = `backward-${view.id}`;
            backward.className = 'history-btn backward';
            backward.innerHTML = '<svg class="icon" width="16px" height="16px" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M507.393443 140.244069h-13.307831V35.828777c-0.51184-19.961747-16.890709-35.828777-36.852456-35.828777-7.165755 0-13.819671 2.047359-19.961747 6.142076L57.998216 261.03823c-16.378869 11.260473-20.473587 33.269578-9.213114 49.648447 2.559198 3.582878 5.630236 7.165755 9.213114 9.213114l379.273193 254.896154c16.378869 11.260473 39.411654 6.653916 50.160287-9.724953 4.094717-5.630236 6.142076-12.795992 6.142076-19.961747V439.670273c172.489968-11.772312 322.970829 115.163925 341.397057 287.142053 2.047359 127.448077-76.26411 242.100162-195.522752 287.142053-2.559198 1.023679-4.606557 3.582878-4.606557 6.653915 0.51184 2.559198 3.071038 4.094717 5.630236 3.071038h0.51184c192.451715-50.672127 329.624745-220.091056 339.861538-418.684847-2.559198-259.502711-214.46082-467.309615-473.451691-464.750416z" fill="currentColor"/></svg>';

            forward.addEventListener('click', function() {
                window.stepHistory('forward', view.id);
            });
            backward.addEventListener('click', function() {
                window.stepHistory('backward', view.id);
            });

            group.appendChild(forward);
            group.appendChild(backward);
            container.appendChild(group);
        });
    }

    function toggleHistoryButtons(activeViewId) {
        const container = document.getElementById('history-controls');
        if (!container) return;
        container.querySelectorAll('.history-btn-group').forEach(el => {
            el.style.display = 'none';
        });
        const activeGroup = document.getElementById(`history-group-${activeViewId}`);
        if (activeGroup) activeGroup.style.display = 'flex';
        if (typeof window.updateHistoryButtons === 'function') {
            window.updateHistoryButtons(activeViewId);
        }
    }
    
    function switchToView(view) {
        
        const store = window.useCanvasStore();
        
        // 注释掉重复切换检查，因为图层面板可能已经更新了activeViewId
        // if (store.activeViewId === view.id) {
        //     return;
        // }
        
        // 隐藏所有视图容器
        const allViewContainers = document.querySelectorAll('.view-container');
        allViewContainers.forEach(container => {
            container.style.display = 'none';
        });
        
        // 显示对应的视图容器
        const viewContainer = document.getElementById(`view-container-${view.id}`);
        if (viewContainer) {
            viewContainer.style.display = 'block';
        }
        
        // 获取对应的 canvas 实例
        const canvas = window.CanvasManager ? window.CanvasManager.getCanvas(view.id) : null;
        
        // 更新 CanvasManager 的激活画布
        if (window.CanvasManager) {
            window.CanvasManager.setActiveCanvas(view.id);
        }
        
        if (canvas) {

            
            // 取消所有视图上所有元素的选中状态
            const allCanvasIds = window.CanvasManager ? window.CanvasManager.getAllCanvasIds() : [];
            allCanvasIds.forEach(canvasId => {
                const viewCanvas = window.CanvasManager ? window.CanvasManager.getCanvas(canvasId) : null;
                if (viewCanvas && typeof viewCanvas.discardActiveObject === 'function') {
                    viewCanvas.discardActiveObject();
                    viewCanvas.renderAll();
                }
            });
            
            // 更新全局 canvas 引用
            if (window.setGlobalCanvas) {
                window.setGlobalCanvas(canvas);
            } else {
                window.canvas = canvas;
                window.fabricCanvas = canvas;
            }
            
            // 重新渲染 canvas
            canvas.renderAll();
            
            // 如果画布为空且有API数据，则渲染API数据
            // if (canvas.getObjects().length === 0 && view.data) {
            //     renderViewFromApiData(view, canvas);
            // }
        } else {
            
            // 如果canvas不存在，创建新的canvas
            // if (view.data) {
            //     createCanvasForView(view);
            // }
        }
    }
    
    // 从API数据渲染视图内容
    function renderViewFromApiData(view, canvas) {
        if (!view.data || !canvas) return;
        
        const layerConfig = getLayerConfigFromViewData(view.data);
        if (!layerConfig || !layerConfig.layer_config || !layerConfig.layer_config.layers) {
            return;
        }
        
        // canvas-api-renderer.js 已停用
        // if (typeof window.renderCanvasFromAPI === 'function') {
        //     // 清空现有内容
        //     canvas.clear();
            
        //     // 重新渲染
        //     window.renderCanvasFromAPI(canvas.lowerCanvasEl.id, layerConfig)
        //         .then(newCanvas => {
                    
        //             // CanvasManager 会自动管理 Canvas 实例，无需更新 store
                    
        //             // 更新全局引用
        //             if (window.setGlobalCanvas) {
        //                 window.setGlobalCanvas(newCanvas);
        //             } else {
        //                 window.canvas = newCanvas;
        //                 window.fabricCanvas = newCanvas;
        //             }
        //         })
        //         .catch(error => {
        //             console.error('Failed to render view from API data:', error);
        //         });
        // }
    }
    
    // 为视图创建新的canvas
    function createCanvasForView(view) {
        if (!view.data) return;
        
        const canvasId = `mainCanvas-${view.id}`;
        const canvasElement = document.getElementById(canvasId);
        
        if (!canvasElement) {
            return;
        }
        // canvas-api-renderer.js 已停用
        // if (typeof window.initCanvasForView === 'function') {
        //     window.initCanvasForView(canvasId, view)
        //         .then(newCanvas => {
        //             if (newCanvas) {
                        
        //                 // CanvasManager 会自动管理 Canvas 实例，无需手动添加到 store
                        
        //                 // 更新全局引用
        //                 if (window.setGlobalCanvas) {
        //                     window.setGlobalCanvas(newCanvas);
        //                 } else {
        //                     window.canvas = newCanvas;
        //                     window.fabricCanvas = newCanvas;
        //                 }
        //             }
        //         })
        //         .catch(error => {
        //             console.error('Failed to create canvas for view:', error);
        //         });
        // }
    }
    
    // 从视图数据获取图层配置
    function getLayerConfigFromViewData(viewData) {
        if (!viewData) return null;
        
        if (viewData.layer_config) {
            return viewData;
        }
        
        if (viewData.data && viewData.data.layer_config) {
            return viewData.data;
        }
        
        return null;
    }
    
    // Start monitoring
    waitForStore();
});
</script>
<?php




