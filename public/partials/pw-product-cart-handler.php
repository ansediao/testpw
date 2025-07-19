<?php

/**
 * 产品购物车处理功能
 * 
 * 处理同步产品的购物车相关逻辑
 *
 * @link       https://www.pw.com
 * @since      1.0.0
 *
 * @package    Pw_Admin
 * @subpackage Pw_Admin/public/partials
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 根据产品 meta 值条件性移除添加到购物车按钮
 * 当产品的 pw_isSyncProduct meta 值为 '1' 时，移除默认的添加到购物车功能
 * 
 * @since    1.0.0
 */
function pw_maybe_remove_add_to_cart_for_sync_products()
{
    global $product;
    
    // 确保在产品页面且产品对象存在
    if (!is_product() || !is_a($product, 'WC_Product')) {
        return;
    }
    
    // 获取指定的 meta 值
    $is_sync_product = $product->get_meta('pw_isSyncProduct');
    
    // 判断 meta 值是否为 '1'
    // 只有当条件满足时，才执行 remove_action
    if ('1' == $is_sync_product) {
        remove_action('woocommerce_simple_add_to_cart', 'woocommerce_simple_add_to_cart', 30);
    }
}

/**
 * 为同步产品添加自定义购物车按钮或消息
 * 
 * @since    1.0.0
 */
function pw_add_custom_cart_content_for_sync_products()
{
    global $product;
    
    // 确保在产品页面且产品对象存在
    if (!is_product() || !is_a($product, 'WC_Product')) {
        return;
    }
    
    // 获取指定的 meta 值
    $is_sync_product = $product->get_meta('pw_isSyncProduct');
    
    // 如果是同步产品，显示自定义内容
    if ('1' == $is_sync_product) {
        echo '<div class="pw-sync-product-notice">';
        echo '<p class="pw-sync-message">' . esc_html__('此产品需要定制，请联系我们获取报价。', 'pw-admin') . '</p>';
        echo '<button type="button" class="button alt pw-contact-button">' . esc_html__('联系定制', 'pw-admin') . '</button>';
        echo '</div>';
    }
}

// 注册钩子
add_action('woocommerce_single_product_summary', 'pw_maybe_remove_add_to_cart_for_sync_products', 20);
add_action('woocommerce_single_product_summary', 'pw_add_custom_cart_content_for_sync_products', 30);