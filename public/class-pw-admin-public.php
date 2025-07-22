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
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-product-customization.php';
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-cart-handler.php';
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-product-inquiry.php';
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-accessory-selector.php';
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-quantity-discount.php';
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-price-calculator.php';
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-api-data-display.php';
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-auxiliary-functions.php';
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-template-handler.php';
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-product-options.php';
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-product-action-buttons.php';
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-custom-templates.php';

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
    }

    /**
     * Initialize all modular components
     */
    private function initialize_modules()
    {
        new Pw_Product_Customization();
        new Pw_Cart_Handler();
        new Pw_Product_Inquiry();
        new Pw_Accessory_Selector();
        new Pw_Quantity_Discount();
        new Pw_Price_Calculator();
        new Pw_Api_Data_Display();
        new Pw_Auxiliary_Functions();
        new Pw_Template_Handler();
        new Pw_Product_Options();
        new Pw_Product_Action_Buttons();
        new Pw_Custom_Templates();
    }

    /**
     * Register the stylesheets for the public-facing side of the site.
     *
     * @since    1.0.0
     */
    public function enqueue_styles()
    {
        wp_enqueue_style($this->plugin_name, plugin_dir_url(__FILE__) . 'css/pw-admin-public.css', array(), $this->version, 'all');
        
        // Add canvas CSS to product pages with timestamp to prevent caching
        if (is_product()) {
            wp_enqueue_style('pw-canvas-css', 'https://stage.canvas.939666.xyz/wp-content/uploads/wpcodebox/224.css', array(), microtime(true), 'all');
        }
    }

    /**
     * Register the JavaScript for the public-facing side of the site.
     *
     * @since    1.0.0
     */
    public function enqueue_scripts()
    {
        wp_enqueue_script($this->plugin_name, plugin_dir_url(__FILE__) . 'js/pw-admin-public.js', array('jquery'), $this->version, false);

        // 确保WooCommerce脚本可用
        if (class_exists('WooCommerce')) {
            wp_enqueue_script('wc-add-to-cart');
        }

        // 添加内联脚本处理购物车图片
        $script = '
            (function($) {
                // 处理购物车中的自定义图片
                function processCartImages() {
                    $(".custom-product-image").each(function() {
                        var container = $(this);
                        var imageUrl = container.data("image-url");
                        if (imageUrl) {
                            container(\'<img src="\' + imageUrl + \'" alt="定制设计" style="max-width: 100px; height: auto; display: block; border: 1px solid #ddd; padding: 5px; background: #fff;">\');
                        }
                    });
                }

                // 初始处理
                processCartImages();

                // 监听购物车更新事件
                $(document.body).on("updated_cart_totals", function() {
                    processCartImages();
                });

                // 监听结账页面更新
                $(document.body).on("updated_checkout", function() {
                    processCartImages();
                });
            })(jQuery);
        ';

        wp_add_inline_script($this->plugin_name, $script);
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
    public function add_pw_canvas_rewrite_rules() {
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
    public function add_pw_canvas_query_vars($vars) {
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


}