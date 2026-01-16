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

// Load modular components
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-cdn-loader.php';
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-product-inquiry.php';
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-composite-products.php';
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-auxiliary-functions.php';
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-template-handler.php';
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-canvas-inquiry.php';
// Load partial components
require_once plugin_dir_path(__FILE__) . 'partials/pw-product-cart-handler.php';



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

        // Initialize all modular components
        $this->initialize_modules();

        // Add custom hook for modular components
        add_action('woocommerce_product_meta_end', array($this, 'trigger_pw_custom_product_hook'), 100);

        // 添加重写规则
        add_action('init', array($this, 'add_pw_canvas_rewrite_rules'));

        // 注册查询变量
        add_filter('query_vars', array($this, 'add_pw_canvas_query_vars'));

        // 添加购物车重定向功能
        add_action('template_redirect', array($this, 'custom_cart_redirect_based_on_product_meta'));
    }

    /**
     * Initialize all modular components
     */
    private function initialize_modules()
    {
        new Pw_CDN_Loader();
        new Pw_Product_Inquiry();
        new Pw_Composite_Products();
        new Pw_Auxiliary_Functions();
        new Pw_Template_Handler();
        new Pw_Canvas_Inquiry();

        // 之前php 实现的 产品页模块
        // new Pw_Product_Customization();
        // new Pw_Accessory_Selector();
        // new Pw_Quantity_Discount();
        // new Pw_Price_Calculator();
        // new Pw_Api_Data_Display();
        // new Pw_Product_Options();
        // new Pw_Product_Action_Buttons();
        // new Pw_Custom_Templates();
    }

    /**
     * Register the stylesheets for the public-facing side of the site.
     *
     * @since    1.0.0
     */
    public function enqueue_styles()
    {

        // Add canvas CSS to product pages with timestamp to prevent caching
        if (is_product()) {
            //产品页 颜色选择模块
            wp_enqueue_style('pw-canvas-css', plugin_dir_url(__FILE__) . 'css/pw-canvas.css', array(), microtime(true), 'all');
            
            // 渐变模态样式
            wp_enqueue_style('pw-gradient-modal', plugin_dir_url(__FILE__) . 'css/pw-gradient-modal.css', array(), $this->version, 'all');
        }

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
     * 触发自定义产品钩子
     * 在 woocommerce_after_single_product_summary 后触发，允许其他代码挂载自定义内容
     * 
     * @since    1.0.0
     */
    public function trigger_pw_custom_product_hook()
    {
        global $product;

        // 确保在产品页面且产品对象存在
        if (is_product() && is_a($product, 'WC_Product')) {
            /**
             * 自定义产品钩子
             * 
             * 允许其他插件或主题在产品详情页面添加自定义内容
             * 
             * @param WC_Product $product 当前产品对象
             * @param int $product_id 产品ID
             */
            do_action('pw_admin_single_product_custom_content', $product, $product->get_id());
        }
    }

    /**
     * 添加自定义重写规则
     * 
     * @since    1.0.0
     */
    public function add_pw_canvas_rewrite_rules()
    {
        add_rewrite_rule(
            '^pwcanvas/?$',
            'index.php?pw_canvas=1',
            'top'
        );

        // 仅在插件激活时刷新重写规则
        if (get_option('pw_canvas_flush_rewrite') != true) {
            flush_rewrite_rules();
            update_option('pw_canvas_flush_rewrite', true);
        }
    }

    /**
     * 添加自定义查询变量
     * 
     * @since    1.0.0
     * @param    array    $vars    查询变量数组
     * @return   array             修改后的查询变量数组
     */
    public function add_pw_canvas_query_vars($vars)
    {
        $vars[] = 'pw_canvas';
        return $vars;
    }

    /**
     * Handle canvas request
     * 
     * @since    1.0.0
     */
    public function pw_canvas_handle_request()
    {
        // 检查查询变量
        if (get_query_var('pw_canvas') == 1) {
            include(plugin_dir_path(__FILE__) . 'partials/template-canvas-display.php');
            exit; // 阻止 WordPress 加载默认模板
        }

        // 保留原有逻辑作为备用
        global $wp;
        $current_url = home_url($wp->request);
        $target_path = '/pwcanvas/';

        if (untrailingslashit($current_url) === untrailingslashit(home_url($target_path))) {
            include(plugin_dir_path(__FILE__) . 'partials/template-canvas-display.php');
            exit; // 阻止 WordPress 加载默认模板
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
