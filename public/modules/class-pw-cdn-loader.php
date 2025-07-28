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
        
        <script>
        // Initialize Vue and Pinia when DOM is ready
        document.addEventListener('DOMContentLoaded', function() {
            console.log('PW Canvas: Checking CDN script availability...');
            console.log('Vue:', typeof Vue, Vue);
            console.log('Pinia:', typeof Pinia, Pinia);
            console.log('axios:', typeof axios, axios);
            
            // Ensure all CDN scripts are loaded
            if (typeof Vue !== 'undefined' && typeof Pinia !== 'undefined' && typeof axios !== 'undefined') {
                console.log('PW Canvas: Vue 3, Pinia, and Axios loaded successfully');
                
                // Debug Pinia object
                console.log('Pinia object properties:', Object.keys(Pinia));
                console.log('Pinia.defineStore:', typeof Pinia.defineStore);
                console.log('Pinia.createPinia:', typeof Pinia.createPinia);
                
                // Create Pinia instance
                const pinia = Pinia.createPinia();
                console.log('Pinia instance created:', pinia);
                
                // Make global instances available
                window.pwVue = Vue;
                window.pwPinia = pinia;
                window.pwAxios = axios;
                window.PiniaDefineStore = Pinia.defineStore;
                
                // Trigger custom event to notify other scripts
                const event = new CustomEvent('pwCdnLoaded', {
                    detail: {
                        vue: Vue,
                        pinia: pinia,
                        axios: axios,
                        Pinia: Pinia,
                        defineStore: Pinia.defineStore
                    }
                });
                document.dispatchEvent(event);
                
                console.log('PW Canvas: pwCdnLoaded event dispatched');
            } else {
                console.error('PW Canvas: Failed to load CDN scripts');
                console.log('Available globals:', {
                    Vue: typeof Vue,
                    Pinia: typeof Pinia,
                    axios: typeof axios
                });
            }
        });
        </script>
        <?php
    }
}