<?php

/**
 * Custom Templates Module
 * 
 * Handles display of custom templates from Promowares API
 *
 * @since      1.0.0
 * @package    Pw_Admin
 * @subpackage Pw_Admin/public/modules
 */

class Pw_Custom_Templates
{
    /**
     * Initialize the module
     */
    public function __construct()
    {
        // Hook into product display - right after product details (priority 51)
        add_action('pw_admin_single_product_custom_content', array($this, 'display_custom_templates'), 999);
        
        // AJAX handler for loading templates
        add_action('wp_ajax_pw_load_custom_templates', array($this, 'ajax_load_custom_templates'));
        add_action('wp_ajax_nopriv_pw_load_custom_templates', array($this, 'ajax_load_custom_templates'));
        
        // Add API settings to frontend
        add_action('wp_enqueue_scripts', array($this, 'localize_api_settings'));
    }
    
    /**
     * Localize API settings for frontend use
     */
    public function localize_api_settings() {
        if (is_product()) {
            // Get API settings
            $api_token = get_option('pw_api_token', '');
            $api_url = 'https://dev.promowares.com/api/v1';
            
            // Localize script
            wp_localize_script('pw-view-switcher', 'pwApiSettings', array(
                'apiUrl' => $api_url,
                'apiToken' => $api_token,
                'nonce' => wp_create_nonce('pw_custom_templates_nonce')
            ));
            
            // Add inline script for browsers that don't support wp_localize_script
            $inline_script = "
                if (typeof pwApiSettings === 'undefined') {
                    window.pwApiSettings = {
                        apiUrl: '{$api_url}',
                        apiToken: '{$api_token}',
                        nonce: '" . wp_create_nonce('pw_custom_templates_nonce') . "'
                    };
                }
            ";
            wp_add_inline_script('pw-view-switcher', $inline_script, 'before');
        }
    }



    /**
     * Display custom templates section on product page
     */
    public function display_custom_templates()
    {
        global $product;
        
        if (!$product || !is_a($product, 'WC_Product')) {
            return;
        }
        
        $product_id = $product->get_id();
        $pw_isSyncProduct = get_post_meta($product_id, 'pw_isSyncProduct', true);
        
        // Only show for synchronized products
        if ($pw_isSyncProduct !== '1') {
            return;
        }
        
        // Get the API product ID from WooCommerce product meta
        $api_product_id = get_post_meta($product_id, 'pw_id', true);
        
        // Pre-fetch template data for use in canvas customization
        $template_data = null;
        if (!empty($api_product_id)) {
            $template_data = $this->fetch_custom_templates($api_product_id);
            
            // Make template data available for canvas customization area
            if (!is_wp_error($template_data)) {
                // Store template data in a global variable for use in canvas-customization-area.php
                $GLOBALS['pw_custom_template_data'] = $template_data;
            }
        }
        
        ?>
        <div id="pw-custom-templates-container" class="pw-custom-templates-data" style="background: #f9f9f9; border: 1px solid #ddd; margin: 15px 0; border-radius: 4px;">
            <!-- Collapsible header -->
            <div id="pw-templates-header" style="padding: 15px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd;">
                <h4 style="margin: 0; color: #333;">自定义模板</h4>
                <span id="pw-templates-toggle" style="font-size: 18px; color: #666; transition: transform 0.3s ease;">▼</span>
            </div>
            
            <!-- Collapsible content area -->
            <div id="pw-templates-body" style="display: none; padding: 15px;">
                <div id="pw-templates-loading" style="text-align: center; padding: 20px; <?php echo (!is_wp_error($template_data) && !empty($template_data)) ? 'display: none;' : ''; ?>">
                    <img src="<?php echo esc_url(MY_PLUGIN_URL . 'assets/images/icons/spinner.gif'); ?>" alt="加载中..." style="width: 32px; height: 32px;">
                    <p style="margin-top: 10px; color: #666;">正在获取自定义模板...</p>
                </div>
                <div id="pw-templates-content" style="<?php echo (!is_wp_error($template_data) && !empty($template_data)) ? '' : 'display: none;'; ?>" data-product-id="<?php echo esc_attr($product_id); ?>">
                    <?php
                    // If we already have template data, display it
                    if (!is_wp_error($template_data) && !empty($template_data)) {
                        echo '<pre style="background: #fff; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px; line-height: 1.4; border: 1px solid #e0e0e0; white-space: pre-wrap; word-wrap: break-word;">' . 
                            json_encode($template_data, JSON_PRETTY_PRINT) . '</pre>';
                    } elseif (is_wp_error($template_data)) {
                        echo '<div class="pw-api-error" style="background: #ffebee; border: 1px solid #f44336; padding: 10px; border-radius: 4px;"><strong>API 错误:</strong> ' . esc_html($template_data->get_error_message()) . '</div>';
                    }
                    ?>
                </div>
            </div>
        </div>

        <style>
        #pw-templates-header:hover {
            background-color: #f0f0f0;
        }
        
        #pw-templates-toggle.expanded {
            transform: rotate(180deg);
        }
        
        .pw-templates-slide-down {
            animation: templatesSlideDown 0.3s ease-out;
        }
        
        .pw-templates-slide-up {
            animation: templatesSlideUp 0.3s ease-out;
        }
        
        @keyframes templatesSlideDown {
            from {
                opacity: 0;
                max-height: 0;
            }
            to {
                opacity: 1;
                max-height: 500px;
            }
        }
        
        @keyframes templatesSlideUp {
            from {
                opacity: 1;
                max-height: 500px;
            }
            to {
                opacity: 0;
                max-height: 0;
            }
        }
        </style>

        <script type="text/javascript">
        document.addEventListener('DOMContentLoaded', function() {
            var isExpanded = false;
            var isLoaded = <?php echo (!is_wp_error($template_data) && !empty($template_data)) ? 'true' : 'false'; ?>;
            
            // Collapsible/expandable functionality
            document.getElementById('pw-templates-header').addEventListener('click', function() {
                var templatesBody = document.getElementById('pw-templates-body');
                var templatesToggle = document.getElementById('pw-templates-toggle');
                
                if (!isExpanded) {
                    // Expand
                    templatesBody.classList.remove('pw-templates-slide-up');
                    templatesBody.classList.add('pw-templates-slide-down');
                    templatesBody.style.display = 'block';
                    templatesToggle.classList.add('expanded');
                    isExpanded = true;
                    
                    // Load data if not already loaded
                    if (!isLoaded) {
                        var templatesLoading = document.getElementById('pw-templates-loading');
                        var templatesContent = document.getElementById('pw-templates-content');
                        
                        templatesLoading.style.display = 'block';
                        
                        var productId = templatesContent.getAttribute('data-product-id');
                        
                        // AJAX call to load templates
                        var xhr = new XMLHttpRequest();
                        xhr.open('POST', '<?php echo admin_url('admin-ajax.php'); ?>', true);
                        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                        
                        xhr.onload = function() {
                            templatesLoading.style.display = 'none';
                            
                            if (xhr.status >= 200 && xhr.status < 400) {
                                try {
                                    var response = JSON.parse(xhr.responseText);
                                    
                                    if (response.success) {
                                        // Display JSON data in formatted way
                                        var jsonHtml = '<pre style="background: #fff; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px; line-height: 1.4; border: 1px solid #e0e0e0; white-space: pre-wrap; word-wrap: break-word;">' + 
                                            JSON.stringify(response.data, null, 2) + '</pre>';
                                        templatesContent.innerHTML = jsonHtml;
                                        templatesContent.style.display = 'block';
                                        
                                        // Refresh the page to apply template data to canvas
                                        // Only if we need to reload the canvas with new data
                                        if (document.getElementById('pw-canvas-container')) {
                                            location.reload();
                                        }
                                    } else {
                                        templatesContent.innerHTML = '<div class="pw-api-error" style="background: #ffebee; border: 1px solid #f44336; padding: 10px; border-radius: 4px;"><strong>API 错误:</strong> ' + response.data + '</div>';
                                        templatesContent.style.display = 'block';
                                    }
                                    
                                    isLoaded = true;
                                } catch (e) {
                                    console.error('Error parsing JSON response:', e);
                                    templatesContent.innerHTML = '<div class="pw-api-error" style="background: #ffebee; border: 1px solid #f44336; padding: 10px; border-radius: 4px;"><strong>解析错误:</strong> 无法解析API响应</div>';
                                    templatesContent.style.display = 'block';
                                }
                            } else {
                                templatesContent.innerHTML = '<div class="pw-api-error" style="background: #ffebee; border: 1px solid #f44336; padding: 10px; border-radius: 4px;"><strong>加载错误:</strong> 请稍后重试</div>';
                                templatesContent.style.display = 'block';
                            }
                        };
                        
                        xhr.onerror = function() {
                            templatesLoading.style.display = 'none';
                            templatesContent.innerHTML = '<div class="pw-api-error" style="background: #ffebee; border: 1px solid #f44336; padding: 10px; border-radius: 4px;"><strong>网络错误:</strong> 请检查您的网络连接</div>';
                            templatesContent.style.display = 'block';
                        };
                        
                        // Send the request
                        xhr.send('action=pw_load_custom_templates&product_id=' + encodeURIComponent(productId) + '&nonce=<?php echo wp_create_nonce('pw_custom_templates_nonce'); ?>');
                    }
                } else {
                    // Collapse
                    templatesBody.classList.remove('pw-templates-slide-down');
                    templatesBody.classList.add('pw-templates-slide-up');
                    setTimeout(function() {
                        templatesBody.style.display = 'none';
                    }, 300);
                    templatesToggle.classList.remove('expanded');
                    isExpanded = false;
                }
            });
        });
        </script>
        
        <?php
    }

    /**
     * AJAX handler to load custom templates
     */
    public function ajax_load_custom_templates()
    {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'pw_custom_templates_nonce')) {
            wp_die(__('安全验证失败', 'pw-admin'));
        }
        
        $woo_product_id = intval($_POST['product_id']);
        
        if (!$woo_product_id) {
            wp_send_json_error(__('无效的产品ID', 'pw-admin'));
        }
        
        // Get the API product ID from WooCommerce product meta
        $api_product_id = get_post_meta($woo_product_id, 'pw_id', true);
        
        if (empty($api_product_id)) {
            wp_send_json_error(__('产品未同步到API', 'pw-admin'));
        }
        
        // Get custom templates from API
        $templates_data = $this->fetch_custom_templates($api_product_id);
        
        if (is_wp_error($templates_data)) {
            wp_send_json_error($templates_data->get_error_message());
        }
        
        // Store template data in a transient for use in canvas customization
        set_transient('pw_custom_template_data_' . $woo_product_id, $templates_data, HOUR_IN_SECONDS);
        
        // Return raw JSON data for display
        wp_send_json_success($templates_data);
    }

    /**
     * Fetch custom templates from Promowares API
     * 
     * @param int $api_product_id API Product ID (pw_id)
     * @return array|WP_Error Template data or error
     */
    private function fetch_custom_templates($api_product_id)
    {
        // Get API settings
        $api_token = get_option('pw_api_token', '');
        $disable_ssl = get_option('pw_disable_ssl', false);
        
        if (empty($api_token)) {
            return new WP_Error('no_token', __('API令牌未配置', 'pw-admin'));
        }
        
        $api_url = "https://dev.promowares.com/api/v1/custom-templates/product/{$api_product_id}";
        
        $args = array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_token,
                'Content-Type' => 'application/json',
            ),
            'timeout' => 30,
        );
        
        // Disable SSL verification if needed
        if ($disable_ssl) {
            $args['sslverify'] = false;
        }
        
        $response = wp_remote_get($api_url, $args);
        
        if (is_wp_error($response)) {
            return $response;
        }
        
        $response_code = wp_remote_retrieve_response_code($response);
        $response_body = wp_remote_retrieve_body($response);
        
        if ($response_code !== 200) {
            return new WP_Error('api_error', sprintf(__('API请求失败，状态码: %d', 'pw-admin'), $response_code));
        }
        
        $data = json_decode($response_body, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return new WP_Error('json_error', __('API响应格式错误', 'pw-admin'));
        }
        
        return $data;
    }


}