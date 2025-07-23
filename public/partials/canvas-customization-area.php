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

// If this is a synchronized product with API ID, we'll use API mode
if ($pw_isSyncProduct === '1' && !empty($api_product_id)) {
    // Add loading indicator
    echo '<div id="pw-view-loading" class="pw-view-loading">
            <span class="pw-loading-spinner"></span>
            <span class="pw-loading-text">加载视图...</span>
          </div>';
    
    // We'll populate this container via AJAX
    echo '<div id="pw-view-buttons-container" style="display:none;"></div>';
    
    // Set flag for API mode
    $using_api_data = true;
} else {
    // Legacy mode - use post meta
    $color_image_url = get_post_meta($product_id, 'pw_mainIMG_color', true);
    if (!empty($color_image_url)) {
        // 将图片URL字符串按逗号分割成数组
        $image_urls = explode(',', $color_image_url);
        // 遍历数组生成按钮
        foreach ($image_urls as $index => $url) {
            $url = trim($url); // 去除可能存在的空格
            if (!empty($url)) {
                // 定义按钮名称
                $names = ['Front', 'Back', 'Left', 'Right'];
                $btn_name = isset($names[$index]) ? $names[$index] : 'View ' . ($index + 1);
                $active_class = ($index === 0) ? ' actived' : '';
                echo '<button class="viewer-switch-btn' . $active_class . '" data-image-url="' . esc_attr($url) . '" style="margin: 5px;">' .
                $btn_name .
                '</button>';
            }
        }
    }
    
    // Set flag for legacy mode
    $using_api_data = false;
}

echo '</div>';

// Add hidden container for view data
echo '<div id="pw-view-data-container" style="display:none;"></div>';

// Add JavaScript for API mode
if ($using_api_data) {
?>
<script type="text/javascript">
document.addEventListener('DOMContentLoaded', function() {
    // Product and API information
    var apiProductId = '<?php echo esc_js($api_product_id); ?>';
    var productId = '<?php echo esc_js($product_id); ?>';
    var ajaxUrl = '<?php echo esc_js(admin_url('admin-ajax.php')); ?>';
    var nonce = '<?php echo esc_js(wp_create_nonce('pw_custom_templates_nonce')); ?>';
    
    // Load view data from API
    function loadViewData() {
        // Show loading indicator
        document.getElementById('pw-view-loading').style.display = 'flex';
        document.getElementById('pw-view-buttons-container').style.display = 'none';
        
        // Make AJAX request to get template data
        var xhr = new XMLHttpRequest();
        xhr.open('POST', ajaxUrl, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 400) {
                // Hide loading indicator
                document.getElementById('pw-view-loading').style.display = 'none';
                
                try {
                    var response = JSON.parse(xhr.responseText);
                    if (response.success && response.data) {
                        // Process template data
                        processTemplateData(response.data);
                    } else {
                        // Show error
                        document.getElementById('pw-view-switcher-container').innerHTML = 
                            '<div class="pw-api-error">无法加载视图数据。请刷新页面重试。</div>';
                    }
                } catch (e) {
                    console.error('Error parsing JSON response:', e);
                    document.getElementById('pw-view-switcher-container').innerHTML = 
                        '<div class="pw-api-error">解析响应数据时出错。请刷新页面重试。</div>';
                }
            } else {
                // Hide loading indicator and show error
                document.getElementById('pw-view-loading').style.display = 'none';
                document.getElementById('pw-view-switcher-container').innerHTML = 
                    '<div class="pw-api-error">加载视图数据时出错。请刷新页面重试。</div>';
            }
        };
        
        xhr.onerror = function() {
            // Hide loading indicator and show error
            document.getElementById('pw-view-loading').style.display = 'none';
            document.getElementById('pw-view-switcher-container').innerHTML = 
                '<div class="pw-api-error">网络请求失败。请检查您的网络连接并重试。</div>';
        };
        
        // Send the request
        xhr.send('action=pw_load_custom_templates&product_id=' + encodeURIComponent(productId) + '&nonce=' + encodeURIComponent(nonce));
    }
    
    // Process template data and create view buttons
    function processTemplateData(templateData) {
        if (!templateData.data || !templateData.data.custom_view) {
            document.getElementById('pw-view-switcher-container').innerHTML = 
                '<div class="pw-api-error">视图数据格式无效。</div>';
            return;
        }
        
        var customView = templateData.data.custom_view;
        var mainView = customView.main_custom_view || null;
        var subViews = customView.sub_custom_view || [];
        var buttonsHtml = '';
        
        // Create main view button
        if (mainView) {
            var viewName = mainView.view_name || 'Main View';
            buttonsHtml += '<button class="viewer-switch-btn actived" data-view-type="main" style="margin: 5px;">' + 
                           viewName + 
                           '</button>';
                           
            // Store main view data
            var mainViewDataElement = document.createElement('div');
            mainViewDataElement.id = 'pw-main-view-data';
            mainViewDataElement.setAttribute('data-view-type', 'main');
            mainViewDataElement.style.display = 'none';
            mainViewDataElement.textContent = JSON.stringify(mainView);
            document.getElementById('pw-view-data-container').appendChild(mainViewDataElement);
            
            // Initialize canvas with main view data
            if (window.pwCanvasApp) {
                initializeCanvasWithViewData(mainView);
            }
        }
        
        // Create sub view buttons
        if (subViews && subViews.length > 0) {
            for (var i = 0; i < subViews.length; i++) {
                var subView = subViews[i];
                var subViewName = subView.view_name || 'View ' + (i + 1);
                
                buttonsHtml += '<button class="viewer-switch-btn" data-view-type="sub" data-view-index="' + i + '" style="margin: 5px;">' + 
                               subViewName + 
                               '</button>';
                               
                // Store sub view data
                var subViewDataElement = document.createElement('div');
                subViewDataElement.id = 'pw-sub-view-data-' + i;
                subViewDataElement.setAttribute('data-view-type', 'sub');
                subViewDataElement.setAttribute('data-view-index', i);
                subViewDataElement.style.display = 'none';
                subViewDataElement.textContent = JSON.stringify(subView);
                document.getElementById('pw-view-data-container').appendChild(subViewDataElement);
            }
        }
        
        // Update buttons container
        var buttonsContainer = document.getElementById('pw-view-buttons-container');
        buttonsContainer.innerHTML = buttonsHtml;
        buttonsContainer.style.display = 'block';
        
        // Attach click handlers to view buttons
        var buttons = document.querySelectorAll('.viewer-switch-btn');
        for (var j = 0; j < buttons.length; j++) {
            buttons[j].addEventListener('click', function(e) {
                // Update active state
                var allButtons = document.querySelectorAll('.viewer-switch-btn');
                for (var k = 0; k < allButtons.length; k++) {
                    allButtons[k].classList.remove('actived');
                }
                e.target.classList.add('actived');
                
                var viewType = e.target.getAttribute('data-view-type');
                var viewData = null;
                
                if (viewType === 'main') {
                    // Get main view data
                    viewData = JSON.parse(document.getElementById('pw-main-view-data').textContent);
                } else if (viewType === 'sub') {
                    // Get sub view data
                    var viewIndex = e.target.getAttribute('data-view-index');
                    viewData = JSON.parse(document.getElementById('pw-sub-view-data-' + viewIndex).textContent);
                }
                
                if (viewData) {
                    // Trigger custom event with view data
                    var viewChangedEvent = new CustomEvent('pw_view_changed', {
                        detail: {
                            viewType: viewType,
                            viewData: viewData
                        }
                    });
                    document.dispatchEvent(viewChangedEvent);
                }
            });
        }
    }
    
    // Initialize canvas with view data
    function initializeCanvasWithViewData(viewData) {
        if (!viewData) return;
        
        // Trigger custom event with view data
        var viewChangedEvent = new CustomEvent('pw_view_changed', {
            detail: {
                viewType: 'main',
                viewData: viewData
            }
        });
        document.dispatchEvent(viewChangedEvent);
    }
    
    // Load view data when document is ready
    loadViewData();
});
</script>

<style>
.pw-view-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 15px;
    background-color: #f9f9f9;
    border-radius: 4px;
    width: 100%;
}

.pw-loading-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-top-color: #3498db;
    border-radius: 50%;
    animation: pw-spin 1s linear infinite;
    margin-right: 10px;
}

.pw-loading-text {
    color: #666;
    font-size: 14px;
}

.pw-api-error {
    padding: 10px;
    background-color: #ffebee;
    border: 1px solid #f44336;
    color: #d32f2f;
    border-radius: 4px;
    margin: 10px 0;
}

@keyframes pw-spin {
    to { transform: rotate(360deg); }
}
</style>
<?php
}
