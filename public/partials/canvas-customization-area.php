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
        
        if (!productData) {
            console.log('No productData provided');
            return;
        }
        
        if (!productData.templates || !productData.templates.data) {
            console.log('No templates.data found in productData');
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
        
        let buttonsCreated = 0;
        
        // Check for main_custom_view - 修正数据路径
        const customView = productData.templates.data.custom_view;
        if (!customView) {
            console.log('No custom_view found in templates.data');
            return;
        }
        
        const mainCustomView = customView.main_custom_view;
        if (!mainCustomView) {
            console.log('No main_custom_view found');
        } else {
            console.log('Found main_custom_view:', mainCustomView);
            const mainButton = document.createElement('button');
            mainButton.className = 'viewer-switch-btn';
            mainButton.textContent = mainCustomView.view_name || 'Main View';
            mainButton.setAttribute('data-view-data', JSON.stringify(mainCustomView));
            container.appendChild(mainButton);
            buttonsCreated++;
            console.log('Main button created:', mainButton.textContent);
        }
        
        // Check for sub_custom_view array
        const subCustomViews = customView.sub_custom_view;
        if (!Array.isArray(subCustomViews)) {
            console.log('No sub_custom_view array found');
        } else {
            console.log('Found sub_custom_view array with', subCustomViews.length, 'items');
            subCustomViews.forEach((subView, index) => {
                console.log(`Creating sub button ${index + 1}:`, subView);
                const subButton = document.createElement('button');
                subButton.className = 'viewer-switch-btn';
                subButton.textContent = subView.view_name || `Sub View ${index + 1}`;
                subButton.setAttribute('data-view-data', JSON.stringify(subView));
                container.appendChild(subButton);
                buttonsCreated++;
                console.log('Sub button created:', subButton.textContent);
            });
        }
        
        console.log('View buttons creation completed. Total buttons created:', buttonsCreated);
        console.log('Container innerHTML after creation:', container.innerHTML);
    }
    
    // Start monitoring
    waitForStore();
});
</script>
<?php




