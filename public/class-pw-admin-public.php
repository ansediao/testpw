<?php

/**
 * The public-facing functionality of the plugin.
 *
 * @link       https://www.pw.com
 * @since      1.0.0
 *
 * @package    Pw_Admin
 * @subpackage Pw_Admin/public
 */

/**
 * The public-facing functionality of the plugin.
 *
 * Defines the plugin name, version, and integrates all modular components.
 *
 * @package    Pw_Admin
 * @subpackage Pw_Admin/public
 * @author     PW <pw@pwcom>
 */
class Pw_Admin_Public
{

    /**
     * The ID of this plugin.
     *
     * @since    1.0.0
     * @access   private
     * @var      string    $plugin_name    The ID of this plugin.
     */
    private $plugin_name;

    /**
     * The version of this plugin.
     *
     * @since    1.0.0
     * @access   private
     * @var      string    $version    The current version of this plugin.
     */
    private $version;

    /**
     * Initialize the class and set its properties.
     *
     * @since    1.0.0
     * @param      string    $plugin_name       The name of the plugin.
     * @param      string    $version    The version of this plugin.
     */
    public function __construct($plugin_name, $version)
    {
        $this->plugin_name = $plugin_name;
        $this->version = $version;

        // 添加购物车重定向功能
        add_action('template_redirect', array($this, 'custom_cart_redirect_based_on_product_meta'));
    }

    /**
     * Register the stylesheets for the public-facing side of the site.
     *
     * @since    1.0.0
     */
    public function enqueue_styles()
    {
        // 添加自定义结账页面样式
        // 添加自定义购物车页面样式
    }

    /**
     * Register the JavaScript for the public-facing side of the site.
     *
     * @since    1.0.0
     */
    public function enqueue_scripts()
    {
        wp_enqueue_script($this->plugin_name, plugin_dir_url(__FILE__) . 'js/pw-admin-public.js', array('jquery'), $this->version, false);

        // 设置 AJAX URL 和 nonce 供前端使用
        wp_localize_script($this->plugin_name, 'pwAjax', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('custom-product-nonce')
        ));

        // 确保WooCommerce脚本可用
        if (class_exists('WooCommerce')) {
            wp_enqueue_script('wc-add-to-cart');
        }

    }

    /**
     * 检查购物车产品中是否包含特定的 meta key，如果包含则重定向到自定义购物车页面
     *
     * 如果购物车中有任何产品的 post meta 'pw_isSyncProduct' 的值为 '1'，
     * 则将用户从标准购物车页面重定向到 /custom-cart/。
     *
     * @since    1.0.0
     */
    public function custom_cart_redirect_based_on_product_meta()
    {
        // 1. 仅在标准购物车页面执行，并排除 AJAX 请求
        if (! is_cart() || wp_doing_ajax()) {
            return;
        }

        // 2. 确保 WooCommerce 功能可用
        if (! function_exists('WC') || ! WC()->cart) {
            return;
        }

        // 3. 定义要检查的 meta key 和 value，以及重定向的目标 URL
        $meta_key_to_check   = 'pw_isSyncProduct';
        $meta_value_to_check = '1';
        $redirect_url        = home_url('/custom-cart/'); // 自定义购物车页面的路径
        $should_redirect = false;

        // 4. 遍历购物车中的所有商品
        foreach (WC()->cart->get_cart() as $cart_item) {
            // 获取产品 ID ($cart_item['variation_id'] 可能是 0)
            $product_id = $cart_item['product_id'];

            // 获取产品的 meta 值
            $meta_value = get_post_meta($product_id, $meta_key_to_check, true);

            // 5. 检查 meta 值是否匹配
            if ($meta_value === $meta_value_to_check) {
                $should_redirect = true;
                break; // 找到一个匹配项就足够了，跳出循环以提高效率
            }
        }

        // 6. 如果需要重定向，并且当前页面不是目标页面（防止无限循环）
        if ($should_redirect) {
            global $wp;
            // 获取当前页面的完整 URL
            $current_url = home_url(add_query_arg([], $wp->request));

            // 比较当前 URL 和目标 URL，如果不同则安全重定向
            if (rtrim($current_url, '/') !== rtrim($redirect_url, '/')) {
                wp_safe_redirect($redirect_url);
                exit();
            }
        }
    }

 
}
