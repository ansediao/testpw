<?php
/**
 * CDN Loader Module
 * 
 * Loads Vue 3, Pinia, and Axios from CDN on product pages
 * 
 * @package    Pw_Admin
 * @subpackage Pw_Admin/public/modules
 * @author     PW <pw@pwcom>
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Pw_CDN_Loader {

    /**
     * Initialize hooks
     */
    public function __construct() {
        add_action('pw_admin_single_product_custom_content', array($this, 'load_cdn_scripts'), 5);
        add_action('wp_footer', array($this, 'add_product_data_helper'));
    }

    /**
     * Load CDN scripts on product pages
     * 
     * Uses priority 5 to ensure scripts are loaded early before other modules
     */
    public function load_cdn_scripts() {
        global $product;
        
        // Ensure we're on a product page with a valid product
        if (!is_a($product, 'WC_Product')) {
            return;
        }

        $product_id = $product->get_id();
        $pw_isSyncProduct = get_post_meta($product_id, 'pw_isSyncProduct', true);
        
        // Only load CDN scripts for synchronized products
        if ($pw_isSyncProduct !== '1') {
            return;
        }

        // Check if scripts are already loaded to prevent duplicates
        static $scripts_loaded = false;
        if ($scripts_loaded) {
            return;
        }
        
        $scripts_loaded = true;
        
        ?>
        <!-- PW Canvas CDN Scripts -->
        <div id="pw-cdn-scripts">
            <!-- 引入 Layui CSS -->
            <link href="//unpkg.com/layui@2.11.5/dist/css/layui.css" rel="stylesheet">
            <!-- 引入 Layui JS -->
            <script src="//unpkg.com/layui@2.11.5/dist/layui.js"></script>
            
            <!-- 引入 Vue 3 -->
            <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
            
            <!-- 引入 VueDemi（Pinia 的依赖） -->
            <script src="https://unpkg.com/vue-demi@0.14.5/lib/index.iife.js"></script>
            
            <!-- 引入 Pinia -->
            <script src="https://unpkg.com/pinia@2/dist/pinia.iife.js"></script>
            
            <!-- 引入 Axios -->
            <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
            
            <!-- 引入 Fabric.js for Canvas functionality -->
            <script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js"></script>
            
            <!-- 引入 Canvas 管理器 -->
            <script src="<?php echo plugin_dir_url(__FILE__) . '../js/canvas-manager.js?v=' . time(); ?>"></script>
            
            <!-- 引入产品图片Canvas功能 -->
            <script src="<?php echo plugin_dir_url(__FILE__) . '../js/product/product-image-canvas.js?v=' . time(); ?>"></script>
            
            <!-- 引入数据获取模块 -->
            <script src="<?php echo plugin_dir_url(__FILE__) . '../js/product/api/productDataAPI.js?v=' . time(); ?>"></script>
            
            <!-- 引入 Pinia Store -->
            <script src="<?php echo plugin_dir_url(__FILE__) . '../js/product/stores/productStore.js?v=' . time(); ?>"></script>
            
            <!-- 引入工具函数 -->
            <script src="<?php echo 'https://stage.canvas.939666.xyz/wp-content/uploads/wpcodebox/246.js?v=' . time(); ?>"></script>
            <script src="<?php echo plugin_dir_url(__FILE__) . '../js/utils/messageUtils.js?v=' . time(); ?>"></script>
            
            <!-- 引入 Vue 组件 -->
            <script src="<?php echo plugin_dir_url(__FILE__) . '../js/product/components/QuantityDiscountSlider.js?v=' . time(); ?>"></script>
            <script src="<?php echo plugin_dir_url(__FILE__) . '../js/product/components/ProductQuantity.js?v=' . time(); ?>"></script>
            <script src="<?php echo plugin_dir_url(__FILE__) . '../js/product/components/ProductPriceInfo.js?v=' . time(); ?>"></script>
            <script src="<?php echo plugin_dir_url(__FILE__) . '../js/product/components/AddToCart.js?v=' . time(); ?>"></script>
            <script src="<?php echo plugin_dir_url(__FILE__) . '../js/product/components/ColorVariants.js?v=' . time(); ?>"></script>
            <script src="<?php echo plugin_dir_url(__FILE__) . '../js/product/components/CheckboxOptions.js?v=' . time(); ?>"></script>
            <script src="<?php echo plugin_dir_url(__FILE__) . '../js/product/components/ProductAccessories.js?v=' . time(); ?>"></script>

            <!-- 产品页 按钮 -->
            <?php $css_timestamp = time(); ?>
            <link rel="stylesheet" href="https://stage.canvas.939666.xyz/wp-content/uploads/wpcodebox/241.css?v=<?php echo $css_timestamp; ?>">
            <!-- 组件样式文件 -->
            <link rel="stylesheet" href="https://stage.canvas.939666.xyz/wp-content/uploads/wpcodebox/244.css?v=<?php echo $css_timestamp; ?>">
            <link rel="stylesheet" href="https://stage.canvas.939666.xyz/wp-content/uploads/wpcodebox/248.css?v=<?php echo $css_timestamp; ?>">
                        <!-- 产品页 规格选择 -->

            <link rel="stylesheet" href="https://stage.canvas.939666.xyz/wp-content/uploads/wpcodebox/250.css?v=<?php echo $css_timestamp; ?>">


            <link rel="stylesheet" href="<?php echo plugin_dir_url(__FILE__) . '../js/product/components/CheckboxOptions.css?v=' . time(); ?>">
            <link rel="stylesheet" href="<?php echo plugin_dir_url(__FILE__) . '../js/product/components/ProductPriceInfo.css?v=' . time(); ?>">
            <link rel="stylesheet" href="<?php echo plugin_dir_url(__FILE__) . '../js/product/components/ProductQuantity.css?v=' . time(); ?>">
            <link rel="stylesheet" href="<?php echo plugin_dir_url(__FILE__) . '../js/product/components/QuantityDiscountSlider.css?v=' . time(); ?>">
            <link rel="stylesheet" href="<?php echo plugin_dir_url(__FILE__) . '../js/product/components/ProductAccessories.css?v=' . time(); ?>">
                        
            <!-- 引入产品页面主脚本 -->
            <script src="<?php echo plugin_dir_url(__FILE__) . '../js/product/main.js?v=' . time(); ?>"></script>
            
            <?php if (defined('WP_DEBUG') && WP_DEBUG): ?>
            <!-- 开发环境：Pinia同步示例 -->
            <script src="<?php echo plugin_dir_url(__FILE__) . '../js/utils/pinia-sync-examples.js?v=' . time(); ?>"></script>
            <?php endif; ?>
        </div>
        <div id="vue-dynamic-product-area" 
             data-product-id="<?php echo esc_attr( $product->get_id() ); ?>"></div>    
        
        <?php
    }

    /**
     * Add product data helper for Vue components
     * 
     * Provides product meta information for API calls
     */
    public function add_product_data_helper() {
        global $product;
        
        // Only add on product pages with synchronized products
        if (!is_a($product, 'WC_Product')) {
            return;
        }

        $product_id = $product->get_id();
        $pw_isSyncProduct = get_post_meta($product_id, 'pw_isSyncProduct', true);
        $pw_id = get_post_meta($product_id, 'pw_id', true);
        
        if ($pw_isSyncProduct !== '1' || empty($pw_id)) {
            return;
        }

        ?>
        <script>
        // 为 Vue/Pinia 提供产品基础信息
        window.pwProductConfig = {
            pwId: '<?php echo esc_js($pw_id); ?>',
            productId: <?php echo intval($product_id); ?>,
            restApiUrl: '<?php echo rest_url('pw/v1/product-data/'); ?>',
            nonce: '<?php echo wp_create_nonce('wp_rest'); ?>'
        };
        </script>
        <?php
    }
}