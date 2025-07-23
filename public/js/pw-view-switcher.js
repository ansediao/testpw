/**
 * PW Canvas View Switcher
 * 
 * Handles switching between different views (main view and sub views)
 * in the canvas customization area using direct API communication.
 * 
 * @since 1.0.0
 */

(function() {
    'use strict';

    // Current active view data
    let currentViewData = null;
    let currentViewType = 'main';
    let canvasInitialized = false;
    let maxRetries = 10;
    let retryCount = 0;
    let retryInterval = 500; // ms
    
    /**
     * Initialize the view switcher
     */
    function initViewSwitcher() {
        // Listen for view change events
        document.addEventListener('pw_view_changed', function(event) {
            const viewType = event.detail.viewType;
            const viewData = event.detail.viewData;
            
            currentViewType = viewType;
            currentViewData = viewData;
            
            // Update canvas with new view data
            if (canvasInitialized) {
                updateCanvasWithViewData(viewData);
            } else {
                initCanvasWithViewData(viewData);
            }
        });
        
        // Listen for canvas ready event
        document.addEventListener('pw_canvas_ready', function() {
            // If we already have view data, initialize the canvas
            if (currentViewData) {
                initCanvasWithViewData(currentViewData);
            }
        });
    }
    
    /**
     * Initialize canvas with view data
     * 
     * @param {Object} viewData The view data
     */
    function initCanvasWithViewData(viewData) {
        if (!viewData) return;
        
        // Get view configuration
        const viewName = viewData.view_name || 'Main View';
        const layerConfig = viewData.layer_config || {};
        const layers = layerConfig.layers || [];
        
        console.log(`Initializing canvas with ${viewName} data`);
        
        // Initialize canvas with layers
        if (window.pwCanvasApp && typeof window.pwCanvasApp.initializeWithLayers === 'function') {
            try {
                window.pwCanvasApp.initializeWithLayers(layers);
                canvasInitialized = true;
                retryCount = 0;
                
                // Update color options if available
                if (viewData.view_color_list && typeof window.pwCanvasApp.updateColorOptions === 'function') {
                    window.pwCanvasApp.updateColorOptions(viewData.view_color_list);
                }
                
                // Trigger canvas initialized event
                const canvasInitializedEvent = new CustomEvent('pw_canvas_initialized', {
                    detail: {
                        viewType: currentViewType,
                        viewData: viewData
                    }
                });
                document.dispatchEvent(canvasInitializedEvent);
            } catch (e) {
                console.error('Error initializing canvas:', e);
                retryInitialization(viewData);
            }
        } else {
            // If canvas app is not ready yet, wait and try again
            retryInitialization(viewData);
        }
    }
    
    /**
     * Retry canvas initialization
     * 
     * @param {Object} viewData The view data
     */
    function retryInitialization(viewData) {
        if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Canvas not ready, retrying in ${retryInterval}ms (attempt ${retryCount}/${maxRetries})...`);
            
            setTimeout(function() {
                initCanvasWithViewData(viewData);
            }, retryInterval);
        } else {
            console.error('Failed to initialize canvas after maximum retries');
            // Show error message to user
            const container = document.getElementById('pw-view-switcher-container');
            if (container) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'pw-api-error';
                errorDiv.textContent = '无法初始化画布。请刷新页面重试。';
                container.appendChild(errorDiv);
            }
        }
    }
    
    /**
     * Update canvas with view data
     * 
     * @param {Object} viewData The view data
     */
    function updateCanvasWithViewData(viewData) {
        if (!viewData) return;
        
        // Get view configuration
        const viewName = viewData.view_name || 'View';
        const layerConfig = viewData.layer_config || {};
        const layers = layerConfig.layers || [];
        
        console.log(`Updating canvas with ${viewName} data`);
        
        try {
            // Clear current canvas
            if (window.pwCanvasApp && typeof window.pwCanvasApp.clearCanvas === 'function') {
                window.pwCanvasApp.clearCanvas();
            }
            
            // Load new layers
            if (window.pwCanvasApp && typeof window.pwCanvasApp.loadLayers === 'function') {
                window.pwCanvasApp.loadLayers(layers);
            }
            
            // Update color options if available
            if (viewData.view_color_list && window.pwCanvasApp && typeof window.pwCanvasApp.updateColorOptions === 'function') {
                window.pwCanvasApp.updateColorOptions(viewData.view_color_list);
            }
            
            // Trigger custom event for other components to update
            const viewUpdatedEvent = new CustomEvent('pw_canvas_view_updated', {
                detail: {
                    viewType: currentViewType,
                    viewData: viewData
                }
            });
            document.dispatchEvent(viewUpdatedEvent);
        } catch (e) {
            console.error('Error updating canvas:', e);
            const container = document.getElementById('pw-view-switcher-container');
            if (container) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'pw-api-error';
                errorDiv.textContent = '更新画布视图时出错。请刷新页面重试。';
                container.appendChild(errorDiv);
            }
        }
    }
    
    /**
     * Direct API call to fetch view data
     * 
     * @param {string} apiProductId The API product ID
     * @param {function} callback Callback function to handle the response
     */
    function fetchViewDataFromApi(apiProductId, callback) {
        // Get API settings from localized data
        const apiSettings = window.pwApiSettings || {};
        const apiUrl = apiSettings.apiUrl || 'https://dev.promowares.com/api/v1';
        const apiToken = apiSettings.apiToken || '';
        
        if (!apiToken) {
            console.error('API token not available');
            callback(new Error('API token not available'), null);
            return;
        }
        
        // Make API request
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `${apiUrl}/custom-templates/product/${apiProductId}`, true);
        xhr.setRequestHeader('Authorization', `Bearer ${apiToken}`);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 400) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    callback(null, response);
                } catch (e) {
                    console.error('Error parsing JSON response:', e);
                    callback(new Error('Invalid JSON response'), null);
                }
            } else {
                console.error('API request failed with status:', xhr.status);
                callback(new Error(`API request failed with status: ${xhr.status}`), null);
            }
        };
        
        xhr.onerror = function() {
            console.error('Network error during API request');
            callback(new Error('Network error during API request'), null);
        };
        
        xhr.send();
    }
    
    // Initialize when document is ready
    document.addEventListener('DOMContentLoaded', function() {
        initViewSwitcher();
        
        // Check if canvas is already initialized
        if (window.pwCanvasApp) {
            canvasInitialized = true;
        }
    });
    
    // Expose public methods
    window.pwViewSwitcher = {
        fetchViewDataFromApi: fetchViewDataFromApi,
        updateCanvasWithViewData: updateCanvasWithViewData
    };

})();