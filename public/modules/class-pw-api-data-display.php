<?php
/**
 * API Data Display Module
 * 
 * @package    Pw_Admin
 * @subpackage Pw_Admin/public/modules
 * @author     PW <pw@pwcom>
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Pw_Api_Data_Display {

    /**
     * Initialize hooks
     */
    public function __construct() {
        add_action('pw_admin_single_product_custom_content', array($this, 'display_sync_product_api_data'), 999);
    }

    /**
     * Display sync product API data (admin only)
     */
    public function display_sync_product_api_data() {
        if (!is_super_admin()) {
            return;
        }

        global $product;
        if (!is_a($product, 'WC_Product')) {
            return;
        }

        $product_id = $product->get_id();
        $pw_isSyncProduct = get_post_meta($product_id, 'pw_isSyncProduct', true);
        
        if ($pw_isSyncProduct !== '1') {
            return;
        }

        $api = new Pw_Admin_Promowares_Api();
        $api_response = $api->get_product_by_woo_id($product_id);
        
        // Output collapsible container
        ?>
        
        <div id="pw-sync-product-container" class="pw-sync-product-data" style="background: #f9f9f9; border: 1px solid #ddd; margin: 15px 0; border-radius: 4px;">
            <!-- Collapsible header -->
            <div id="pw-sync-header" style="padding: 15px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd;">
                <h4 style="margin: 0; color: #333;">产品详细信息</h4>
                <span id="pw-sync-toggle" style="font-size: 18px; color: #666; transition: transform 0.3s ease;">▼</span>
            </div>
            
            <!-- Collapsible content area -->
            <div id="pw-sync-body" style="display: none; padding: 15px;">
                <div id="pw-sync-loading" style="text-align: center; padding: 20px; display: none;">
                    <img src="<?php echo esc_url(MY_PLUGIN_URL . 'assets/images/icons/spinner.gif'); ?>" alt="加载中..." style="width: 32px; height: 32px;">
                    <p style="margin-top: 10px; color: #666;">正在获取产品信息...</p>
                </div>
                <div id="pw-sync-content" style="display: none;"></div>
            </div>
        </div>

        <style>
        #pw-sync-header:hover {
            background-color: #f0f0f0;
        }
        
        #pw-sync-toggle.expanded {
            transform: rotate(180deg);
        }
        
        .pw-sync-slide-down {
            animation: slideDown 0.3s ease-out;
        }
        
        .pw-sync-slide-up {
            animation: slideUp 0.3s ease-out;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                max-height: 0;
            }
            to {
                opacity: 1;
                max-height: 500px;
            }
        }
        
        @keyframes slideUp {
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
            $('#pw-sync-header').click(function() {
                if (!isExpanded) {
                    // Expand
                    $('#pw-sync-body').removeClass('pw-sync-slide-up').addClass('pw-sync-slide-down').show();
                    $('#pw-sync-toggle').addClass('expanded');
                    isExpanded = true;
                    
                    // Load data if not already loaded
                    if (!isLoaded) {
                        $('#pw-sync-loading').show();
                        
                        // Simulate async loading effect, then use already fetched API data
                        setTimeout(function() {
                            <?php
                            if (is_wp_error($api_response)) {
                                $error_message = $api_response->get_error_message();
                                ?>
                                // Hide loading and show error
                                $('#pw-sync-loading').hide();
                                $('#pw-sync-content').html('<div class="pw-api-error" style="background: #ffebee; border: 1px solid #f44336; padding: 10px; border-radius: 4px;"><strong>API 错误:</strong> <?php echo esc_js($error_message); ?></div>').show();
                                <?php
                            } else {
                                // Format and display JSON data (reuse already fetched API response)
                                $json_html = '<pre style="background: #fff; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px; line-height: 1.4; border: 1px solid #e0e0e0; white-space: pre-wrap; word-wrap: break-word;">' . esc_html(json_encode($api_response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . '</pre>';
                                ?>
                                // Hide loading and display JSON content
                                $('#pw-sync-loading').hide();
                                $('#pw-sync-content').html(<?php echo wp_json_encode($json_html); ?>).show();
                                <?php
                            }
                            ?>
                            isLoaded = true;
                        }, 500); // 500ms delay to show loading effect
                    }
                } else {
                    // Collapse
                    $('#pw-sync-body').removeClass('pw-sync-slide-down').addClass('pw-sync-slide-up');
                    setTimeout(function() {
                        $('#pw-sync-body').hide();
                    }, 300);
                    $('#pw-sync-toggle').removeClass('expanded');
                    isExpanded = false;
                }
            });
        });
        </script>
        
        <?php
    }
}