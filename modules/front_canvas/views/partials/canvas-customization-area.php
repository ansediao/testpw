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

               

                // 同步通知视图切换事件（供颜色同步监听使用）
                document.dispatchEvent(new CustomEvent('layerPanelViewSwitch', { detail: { viewId: view.id } }));
            });
            
            container.appendChild(button);
        });
        
        // 默认激活第一个视图
        if (views.length > 0) {
            store.setActiveViewId(views[0].id);
            switchToView(views[0]);
         

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
                }
            }
        });
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




