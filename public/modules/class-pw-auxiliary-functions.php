<?php
/**
 * Auxiliary Functions Module
 * 
 * @package    Pw_Admin
 * @subpackage Pw_Admin/public/modules
 * @author     PW <pw@pwcom>
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Pw_Auxiliary_Functions {

    /**
     * Initialize hooks
     */
    public function __construct() {
        add_filter('woocommerce_get_price_html', array($this, 'hide_sync_product_price'), 10, 2);
        add_action('woocommerce_after_shop_loop_item', array($this, 'remove_add_to_cart_for_sync_products'), 1);
        add_action('woocommerce_single_product_summary', array($this, 'remove_add_to_cart_for_sync_products_single'), 25);
    }

    /**
     * Hide price for sync products
     */
    public function hide_sync_product_price($price, $product) {
        if ($product && is_object($product)) {
            $product_id = $product->get_id();
            $pw_isSyncProduct = get_post_meta($product_id, 'pw_isSyncProduct', true);
            
            if ($pw_isSyncProduct === '1') {
                return '';
            }
        }
        return $price;
    }

    /**
     * Remove add to cart button for sync products in shop loop
     */
    public function remove_add_to_cart_for_sync_products() {
        global $product;
        if (!$product) {
            return;
        }
        
        $product_id = $product->get_id();
        $pw_isSyncProduct = get_post_meta($product_id, 'pw_isSyncProduct', true);
        
        if ($pw_isSyncProduct === '1') {
            remove_action('woocommerce_after_shop_loop_item', 'woocommerce_template_loop_add_to_cart');
        }
    }

    /**
     * Remove add to cart button for sync products in single product page
     */
    public function remove_add_to_cart_for_sync_products_single() {
        global $product;
        if (!$product) {
            return;
        }
        
        $product_id = $product->get_id();
        $pw_isSyncProduct = get_post_meta($product_id, 'pw_isSyncProduct', true);
        
        if ($pw_isSyncProduct === '1') {
            remove_action('woocommerce_single_product_summary', 'woocommerce_template_single_add_to_cart', 30);
        }
    }
}