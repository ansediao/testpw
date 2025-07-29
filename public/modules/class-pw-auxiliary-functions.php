<?php
/**
 * 辅助功能模块
 * 
 * 该模块提供同步产品的特殊处理功能，包括：
 * - 隐藏同步产品的价格显示
 * - 移除同步产品的"添加到购物车"按钮
 * - 确保同步产品只能通过定制界面进行购买
 * 
 * 同步产品是指从 Promowares API 同步的产品，这些产品需要通过
 * 画布定制界面进行个性化设计后才能添加到购物车。
 * 
 * @package    Pw_Admin
 * @subpackage Pw_Admin/public/modules
 * @author     PW <pw@pwcom>
 * @since      1.0.0
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Pw_Auxiliary_Functions {

    /**
     * 初始化钩子
     * 
     * 注册 WooCommerce 相关的过滤器和动作钩子，用于：
     * 1. 过滤同步产品的价格显示
     * 2. 在商店循环中移除同步产品的购买按钮
     * 3. 在单品页面移除同步产品的购买按钮
     */
    public function __construct() {
        add_filter('woocommerce_get_price_html', array($this, 'hide_sync_product_price'), 10, 2);
        add_action('woocommerce_after_shop_loop_item', array($this, 'remove_add_to_cart_for_sync_products'), 1);
        add_action('woocommerce_single_product_summary', array($this, 'remove_add_to_cart_for_sync_products_single'), 25);
    }

    /**
     * 隐藏同步产品的价格显示
     * 
     * 对于标记为同步产品的商品，隐藏其价格显示。
     * 这是因为同步产品的最终价格需要根据用户的定制选择
     * （如数量、配件等）动态计算，静态价格没有意义。
     * 
     * @param string $price 原始价格HTML
     * @param WC_Product $product WooCommerce产品对象
     * @return string 处理后的价格HTML（同步产品返回空字符串）
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
     * 在商店循环中移除同步产品的"添加到购物车"按钮
     * 
     * 在商品列表页面（如商店页面、分类页面等），移除同步产品的
     * "添加到购物车"按钮。同步产品必须通过单品页面的定制界面
     * 进行个性化设计后才能添加到购物车。
     * 
     * 该方法通过移除 WooCommerce 的默认动作钩子来实现。
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
     * 在单品页面移除同步产品的"添加到购物车"按钮
     * 
     * 在产品详情页面，移除同步产品的标准"添加到购物车"按钮。
     * 这确保用户必须使用画布定制界面来配置产品，而不能直接
     * 将未定制的产品添加到购物车。
     * 
     * 定制界面会提供专门的"添加到购物车"功能，包含用户的
     * 个性化设计数据。
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