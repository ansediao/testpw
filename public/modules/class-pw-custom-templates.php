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
        
        ?>
        <div id="pw-custom-templates-container" class="pw-custom-templates-data" style="background: #f9f9f9; border: 1px solid #ddd; margin: 15px 0; border-radius: 4px;">
            <!-- Collapsible header -->
            <div id="pw-templates-header" style="padding: 15px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd;">
                <h4 style="margin: 0; color: #333;">自定义模板</h4>
                <span id="pw-templates-toggle" style="font-size: 18px; color: #666; transition: transform 0.3s ease;">▼</span>
            </div>
            
            <!-- Collapsible content area -->
            <div id="pw-templates-body" style="display: none; padding: 15px;">
                <div id="pw-templates-loading" style="text-align: center; padding: 20px; display: none;">
                    <img src="<?php echo esc_url(MY_PLUGIN_URL . 'assets/images/icons/spinner.gif'); ?>" alt="加载中..." style="width: 32px; height: 32px;">
                    <p style="margin-top: 10px; color: #666;">正在获取自定义模板...</p>
                </div>
                <div id="pw-templates-content" style="display: none;" data-product-id="<?php echo esc_attr($product_id); ?>"></div>
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
        jQuery(document).ready(function($) {
            var isExpanded = false;
            var isLoaded = false;
            
            // Collapsible/expandable functionality
            $('#pw-templates-header').click(function() {
                if (!isExpanded) {
                    // Expand
                    $('#pw-templates-body').removeClass('pw-templates-slide-up').addClass('pw-templates-slide-down').show();
                    $('#pw-templates-toggle').addClass('expanded');
                    isExpanded = true;
                    
                    // Load data if not already loaded
                    if (!isLoaded) {
                        $('#pw-templates-loading').show();
                        
                        var productId = $('#pw-templates-content').data('product-id');
                        
                        // AJAX call to load templates
                        $.ajax({
                            url: '<?php echo admin_url('admin-ajax.php'); ?>',
                            type: 'POST',
                            data: {
                                action: 'pw_load_custom_templates',
                                product_id: productId,
                                nonce: '<?php echo wp_create_nonce('pw_custom_templates_nonce'); ?>'
                            },
                            success: function(response) {
                                $('#pw-templates-loading').hide();
                                
                                if (response.success) {
                                    // Display JSON data in formatted way
                                    var jsonHtml = '<pre style="background: #fff; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px; line-height: 1.4; border: 1px solid #e0e0e0; white-space: pre-wrap; word-wrap: break-word;">' + 
                                        JSON.stringify(response.data, null, 2) + '</pre>';
                                    $('#pw-templates-content').html(jsonHtml).show();
                                } else {
                                    $('#pw-templates-content').html('<div class="pw-api-error" style="background: #ffebee; border: 1px solid #f44336; padding: 10px; border-radius: 4px;"><strong>API 错误:</strong> ' + response.data + '</div>').show();
                                }
                                
                                isLoaded = true;
                            },
                            error: function(xhr, status, error) {
                                $('#pw-templates-loading').hide();
                                $('#pw-templates-content').html('<div class="pw-api-error" style="background: #ffebee; border: 1px solid #f44336; padding: 10px; border-radius: 4px;"><strong>加载错误:</strong> 请稍后重试</div>').show();
                            }
                        });
                    }
                } else {
                    // Collapse
                    $('#pw-templates-body').removeClass('pw-templates-slide-down').addClass('pw-templates-slide-up');
                    setTimeout(function() {
                        $('#pw-templates-body').hide();
                    }, 300);
                    $('#pw-templates-toggle').removeClass('expanded');
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