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
    console.log('Canvas customization area script loaded');
    
    // Wait for Pinia store to be available
    function waitForStore() {
        console.log('Checking for Pinia store...', typeof window.useCanvasStore);
        
        if (typeof window.useCanvasStore === "function") {
            console.log('Pinia store found, setting up watcher');
            const store = window.useCanvasStore();
            let previousLoadingState = store.isLoadingProductData;
            
            console.log('Initial loading state:', previousLoadingState);
            console.log('Current productData:', store.productData);
            
            // If data is already loaded, create buttons immediately
            if (!store.isLoadingProductData && store.productData) {
                console.log('Data already loaded, creating buttons immediately');
                createViewButtons(store.productData);
            }
            
            // Monitor isLoadingProductData changes
            const unwatch = store.$subscribe((mutation, state) => {
                console.log('Store state changed:', {
                    storeId: mutation.storeId,
                    previousLoading: previousLoadingState,
                    currentLoading: state.isLoadingProductData,
                    hasProductData: !!state.productData
                });
                
                if (mutation.storeId === "canvas" && 
                    previousLoadingState === true && 
                    state.isLoadingProductData === false) {
                    
                    console.log('Loading completed, creating buttons');
                    // Loading completed, create buttons
                    createViewButtons(state.productData);
                }
                previousLoadingState = state.isLoadingProductData;
            });
        } else {
            console.log('Pinia store not available yet, retrying in 100ms');
            // Retry if store not available yet
            setTimeout(waitForStore, 100);
        }
    }
    
    function createViewButtons(productData) {
        console.log('createViewButtons called with:', productData);
        
        const store = window.useCanvasStore();
        if (!store) {
            console.log('Store not available');
            return;
        }
        
        const container = document.getElementById("pw-view-switcher-container");
        if (!container) {
            console.log('Container not found!');
            return;
        }
        
        console.log('Container found, clearing existing content');
        
        // Clear existing buttons
        container.innerHTML = "";
        
        // 从 store 获取视图信息
        const views = store.views;
        if (!views || views.length === 0) {
            console.log('No views found in store');
            return;
        }
        
        console.log('Creating buttons for views:', views);
        
        views.forEach((view, index) => {
            const button = document.createElement('button');
            button.className = 'viewer-switch-btn';
            button.textContent = view.name;
            button.setAttribute('data-view-id', view.id);
            button.setAttribute('data-view-data', JSON.stringify(view.data));
            
            // 第一个按钮默认激活
            if (index === 0) {
                button.classList.add('active');
            }
            
            // 添加点击事件
            button.addEventListener('click', function() {
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
                
                console.log('Switched to view:', view.name);
            });
            
            container.appendChild(button);
            console.log('Button created for view:', view.name);
        });
        
        // 默认激活第一个视图
        if (views.length > 0) {
            store.setActiveViewId(views[0].id);
            switchToView(views[0]);
        }
        
        console.log('View buttons creation completed. Total buttons created:', views.length);
    }
    
    function switchToView(view) {
        console.log('Switching to view:', view);
        
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
        const store = window.useCanvasStore();
        const canvas = store.viewCanvases[view.id];
        if (canvas) {
            // 更新全局 canvas 引用
            if (window.setGlobalCanvas) {
                window.setGlobalCanvas(canvas);
            } else {
                window.canvas = canvas;
                window.fabricCanvas = canvas;
            }
            
            // 重新渲染 canvas
            canvas.renderAll();
        }
    }
    
    // Start monitoring
    waitForStore();
});
</script>
<?php




