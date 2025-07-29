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
            <!-- 引入 Vue 3 -->
            <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
            
            <!-- 引入 VueDemi（Pinia 的依赖） -->
            <script src="https://unpkg.com/vue-demi@0.14.5/lib/index.iife.js"></script>
            
            <!-- 引入 Pinia -->
            <script src="https://unpkg.com/pinia@2/dist/pinia.iife.js"></script>
            
            <!-- 引入 Axios -->
            <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        </div>
        <div id="vue-dynamic-product-area" data-product-id="<?php echo esc_attr( $product->get_id() ); ?>"></div>    
        
        <?php
    }
}