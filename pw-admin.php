<?php

/**
 * The plugin bootstrap file
 *
 * This file is read by WordPress to generate the plugin information in the plugin
 * admin area. This file also includes all of the dependencies used by the plugin,
 * registers the activation and deactivation functions, and defines a function
 * that starts the plugin.
 *
 * @link              https://www.pw.com
 * @since             1.0.0
 * @package           Pw_Admin
 *
 * @wordpress-plugin
 * Plugin Name:       PW Canvas
 * Plugin URI:        https://www.pw.com
 * Description:       PW Canvas
 * Version:           1.0.0
 * Author:            PW
 * Author URI:        https://www.pw.com/
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       pw-admin
 * Domain Path:       /languages
 * Requires Plugins:  woocommerce, flamingo
 */

// If this file is called directly, abort.
if (! defined('WPINC')) {
    die;
}

/**
 * Currently plugin version.
 * Start at version 1.0.0 and use SemVer - https://semver.org
 * Rename this for your plugin and update it as you release new versions.
 */
define('PW_ADMIN_VERSION', '1.0.1');

// 定义插件根目录URL常量
define('MY_PLUGIN_URL', plugin_dir_url(__FILE__));
define('MY_PLUGIN_ICONS_URL', MY_PLUGIN_URL . 'assets/images/icons/');



/**
 * The code that runs during plugin activation.
 * This action is documented in includes/class-pw-admin-activator.php
 */
function activate_pw_admin()
{
    require_once plugin_dir_path(__FILE__) . 'includes/class-pw-admin-activator.php';
    Pw_Admin_Activator::activate();
}

/**
 * The code that runs during plugin deactivation.
 * This action is documented in includes/class-pw-admin-deactivator.php
 */
function deactivate_pw_admin()
{
    require_once plugin_dir_path(__FILE__) . 'includes/class-pw-admin-deactivator.php';
    Pw_Admin_Deactivator::deactivate();
}

register_activation_hook(__FILE__, 'activate_pw_admin');
register_deactivation_hook(__FILE__, 'deactivate_pw_admin');

/**
 * The core plugin class that is used to define internationalization,
 * admin-specific hooks, and public-facing site hooks.
 */
require plugin_dir_path(__FILE__) . 'includes/class-pw-admin.php';

/**
 * Begins execution of the plugin.
 *
 * Since everything within the plugin is registered via hooks,
 * then kicking off the plugin from this point in the file does
 * not affect the page life cycle.
 *
 * @since    1.0.0
 */
function run_pw_admin()
{

    $plugin = new Pw_Admin();
    $plugin->run();
}
run_pw_admin();

// 注册Action Scheduler hooks
function pw_admin_register_action_scheduler_hooks()
{
    // 处理单个产品导入
    add_action('import_single_product', 'import_single_product');

    // 处理组合产品组导入
    add_action('import_composite_product_group', 'import_composite_product_group');

    // 处理容器规则
    add_action('process_container_rules', 'process_container_rules');
}
add_action('init', 'pw_admin_register_action_scheduler_hooks');

// 确保admin类中的函数可以被Action Scheduler调用
require_once plugin_dir_path(__FILE__) . 'admin/class-pw-admin-admin.php';

// function mytheme_enqueue_styles()
// {
//     // Check if ‘wc-cart-fragments’ script is already enqueued or registered
//     if (! wp_script_is('wc-cart-fragments', 'enqueued') && wp_script_is('wc-cart-fragments', 'registered')) {
//         // Enqueue the ‘wc-cart-fragments’ script
//         wp_enqueue_script('wc-cart-fragments');
//     }
// }
// add_action('wp_enqueue_scripts', 'mytheme_enqueue_styles');
function add_custom_cart_js()
{
    if (is_cart()) {
?>
        <script type="text/javascript">
            // Native
            document.body.addEventListener('wc_fragments_refreshed', function() {
                console.log("POJS handled the event");
                // 查找所有包含图片URL的元素
                const customImageElements = document.querySelectorAll('.wc-block-components-product-details__value');
                console.log(customImageElements);
                customImageElements.forEach(element => {
                    const imageUrl = element.textContent.trim();
                    // 检查文本内容是否为图片URL
                    if (imageUrl.match(/\.(jpeg|jpg|gif|png)$/i)) {
                        // 创建图片元素
                        const img = document.createElement('img');
                        img.src = imageUrl;
                        img.style.maxWidth = '100px'; // 设置图片最大宽度
                        img.style.height = 'auto';
                        // 替换文本内容为图片
                        element.textContent = '';
                        element.appendChild(img);
                    }
                });
            });
            document.body.dispatchEvent(new Event('wc_fragments_refreshed'));
        </script>
    <?php
    }
}
add_action('wp_footer', 'add_custom_cart_js');



function add_custom_cart_js2()
{
    if (is_cart()) {
    ?>
        <script type="text/javascript">
            jQuery(document).ready(function($) {
                // 监听 WooCommerce 购物车内容更新完成事件
                $('body').on('updated_wc_div', function() {
                    console.log("WooCommerce 购物车元素加载完成");

                    // 查找所有包含图片URL的元素
                    const customImageElements = document.querySelectorAll('.wc-block-components-product-details__value');
                    console.log(customImageElements);

                    customImageElements.forEach(element => {
                        const imageUrl = element.textContent.trim();
                        // 检查文本内容是否为图片URL
                        if (imageUrl.match(/\.(jpeg|jpg|gif|png)$/i)) {
                            // 创建图片元素
                            const img = document.createElement('img');
                            img.src = imageUrl;
                            img.style.maxWidth = '100px'; // 设置图片最大宽度
                            img.style.height = 'auto';

                            // 替换文本内容为图片
                            element.textContent = '';
                            element.appendChild(img);
                        }
                    });
                });
            });
        </script>
<?php
    }
}
add_action('wp_footer', 'add_custom_cart_js2');



// 在后台产品列表中隐藏所有子产品
add_action('pre_get_posts', function ($query) {
    // 只在后台产品列表页面执行
    if (!is_admin() || !$query->is_main_query()) {
        return;
    }

    // 确保是产品列表页面
    if ($query->get('post_type') !== 'product') {
        return;
    }

    // 获取所有父产品的子产品ID列表
    global $wpdb;
    $child_product_ids = $wpdb->get_col(
        "SELECT DISTINCT meta_value 
         FROM {$wpdb->postmeta} 
         WHERE meta_key = '_children' 
         AND meta_value != ''"
    );

    // 将序列化的数组转换为单个ID数组
    $all_child_ids = array();
    foreach ($child_product_ids as $serialized_ids) {
        $ids = maybe_unserialize($serialized_ids);
        if (is_array($ids)) {
            $all_child_ids = array_merge($all_child_ids, $ids);
        }
    }

    // 去重并确保都是数字
    $all_child_ids = array_unique(array_filter(array_map('intval', $all_child_ids)));

    // 如果有子产品ID，则排除它们
    if (!empty($all_child_ids)) {
        $query->set('post__not_in', $all_child_ids);
    }
});

add_action('manage_product_posts_custom_column', function ($column, $post_id) {
    if ($column === 'name') {
        $product = wc_get_product($post_id);
        // if ($cross_ids = $product->get_cross_sell_ids()) {
        //     echo '<div class="cross-sells-tooltip">▲ ' . count($cross_ids) . ' sub-products
        //         <div class="tooltip">' . implode(
        //         '<br>',
        //         array_map('get_the_title', $cross_ids)
        //     ) . '</div>
        //         </div>';
        // }
        $child_product_ids = get_post_meta($post_id, '_children', true);
        if ($child_product_ids) {
            echo '<div class="cross-sells-tooltip">▲ ' . count($child_product_ids) . ' sub-products
                <div class="tooltip">' . implode(
                '<br>',
                array_map(function ($post_id) {
                    return '<i class="iconfont icon-xiaji"></i> ' . get_the_title($post_id);
                }, $child_product_ids)
            ) . '</div>
                </div>';
        }
    }
}, 20, 2);



function get_pw_design_images()
{
    // 查询所有pw_design文章类型的文章
    $args = array(
        'post_type' => 'pw_design',
        'posts_per_page' => -1, // 获取所有文章
    );
    $query = new WP_Query($args);

    $images = array();

    // 遍历文章并获取封面图片
    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();
            $thumbnail_id = get_post_thumbnail_id();
            $thumbnail_url = wp_get_attachment_image_url($thumbnail_id, 'full');
            if ($thumbnail_url) {
                $images[] = array('url' => $thumbnail_url);
            }
        }
    }
    wp_reset_postdata();

    // 返回JSON响应
    wp_send_json_success($images);
}

add_action('rest_api_init', function () {
    register_rest_route('pw/v1', '/getPwDesignImages', array(
        'methods' => 'GET',
        'callback' => 'get_pw_design_images',
    ));
});

/**
 * 为特定的脚本句柄添加 type="module" 属性。
 *
 * @param string $tag    完整的 <script> 标签 HTML.
 * @param string $handle 脚本的句柄.
 * @param string $src    脚本的源 URL.
 * @return string        修改后的 <script> 标签.
 */
function add_type_attribute_to_my_script($tag, $handle, $src)
{
    // 只为我们的目标脚本 'my-app-script' 添加属性
    if ('my-app-script' === $handle) {
        $tag = '<script type="module" src="' . esc_url($src) . '" id="' . esc_attr($handle) . '-js"></script>';
    }

    return $tag;
}

add_action('woocommerce_shipping_init', 'pwca_shipping_method_init');
function pwca_shipping_method_init()
{
    class WC_Pwca_Shipping_Method extends WC_Shipping_Method
    {
        public function __construct($instance_id = 0)
        {
            $this->id = 'pwca_shipping_method';
            $this->instance_id = absint($instance_id);
            $this->method_title = __('PW Shipping', 'woocommerce');
            $this->method_description = __('PW shipping method with API integration', 'woocommerce');
            $this->supports = array(
                'shipping-zones',
                'instance-settings',
                'instance-settings-modal',
            );
            $this->init();
        }

        public function init()
        {
            $this->init_form_fields();
            $this->init_settings();
            $this->title = $this->get_option('title', __('PW Shipping', 'woocommerce'));
            add_action('woocommerce_update_options_shipping_' . $this->id, array($this, 'process_admin_options'));
        }

        public function init_form_fields()
        {
            $this->instance_form_fields = array(
                'title' => array(
                    'title' => __('Shipping Title', 'woocommerce'),
                    'type' => 'text',
                    'description' => __('The title shown to customers during checkout.', 'woocommerce'),
                    'default' => __('PW Shipping', 'woocommerce'),
                ),
            );
        }

        public function calculate_shipping($package = array())
        {
            $rate = $this->get_shipping_rate($package);
            if ($rate) {
                $this->add_rate($rate);
            }
        }

        private function get_shipping_rate($package)
        {
            $weight = 0;
            $country_code = $package['destination']['country'];
            foreach ($package['contents'] as $item) {
                $product = $item['data'];
                // $weight += $product->get_weight() * $item['quantity'];
                $weight += $item['quantity'];
            }

            // 调用 API 获取运费
            $shipping_rate = $this->fetch_shipping_rate($country_code, $weight, 'PK1792');

            if ($shipping_rate && isset($shipping_rate['totalFee'])) {
                return array(
                    'id' => $this->id . '_' . $this->instance_id,
                    'label' => $this->title,
                    'cost' => $shipping_rate['totalFee'],
                    'taxes' => '',
                    'calc_tax' => 'per_order',
                );
            }
            return false;
        }

        private function fetch_shipping_rate($country_code, $weight, $shipping_method)
        {
            $api_url = 'https://dev.promowares.com/api/v1/shipping/calculate';
            $token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NDE4MTYxMjgsInRlYW0iOiIxIiwidXNlcl9pZCI6MX0.60D-NUbUBa_n3KXyNrhnoN964IjwIFJtGUVDCSnKYFM';

            $args = array(
                'headers' => array(
                    'Authorization' => $token,
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                    'Accept-Encoding' => 'gzip, deflate, br',
                    'User-Agent' => 'PostmanRuntime-ApipostRuntime/1.1.0',
                    'Connection' => 'keep-alive',
                ),
                'body' => json_encode(array(
                    'country_code' => $country_code,
                    'weight' => strval($weight),
                    'shipping_method' => $shipping_method,
                )),
                'method' => 'POST',
                'timeout' => 30,
            );

            $response = wp_remote_post($api_url, $args);
            error_log('Shipping Args: ' . print_r($args, true));
            if (is_wp_error($response)) {
                error_log('Shipping API Error: ' . $response->get_error_message());
                return false;
            }

            $body = wp_remote_retrieve_body($response);
            error_log('Shipping API Response: ' . print_r($body, true));
            $data = json_decode($body, true);
            error_log('Decoded API Data: ' . print_r($data, true));

            if ($data && $data['code'] === 200 && !empty($data['data']['raw_response']['data'])) {
                // 返回第一个匹配的运费数据
                return $data['data']['raw_response']['data'][0];
            }

            return false;
        }
    }
}

add_filter('woocommerce_shipping_methods', 'add_pwca_shipping_method');
function add_pwca_shipping_method($methods)
{
    $methods['pwca_shipping_method'] = 'WC_Pwca_Shipping_Method';
    return $methods;
}

// 添加计算运费按钮和刷新订单区域功能
add_action('woocommerce_review_order_before_shipping', 'pwca_add_calculate_shipping_button');
function pwca_add_calculate_shipping_button()
{
    if (is_checkout() && !defined('DOING_AJAX')) {
        // 添加标题
        echo '<div class="pwca-calculate-shipping-title" style="margin-bottom: 10px;">' . __('YOUR ORDER', 'woocommerce') . '</div>';

        echo '<div class="pwca-calculate-shipping-container" style="margin-bottom: 15px;">';
        echo '<button type="button" class="button pwca-calculate-shipping-btn" id="pwca-calculate-shipping">' . __('Calculate Shipping', 'woocommerce') . '</button>';
        echo '</div>';
        
        // 添加JavaScript处理按钮点击事件
        wc_enqueue_js('
            jQuery(document).ready(function($) {
                // 确保只有一个按钮存在
                if ($("#pwca-calculate-shipping").length > 1) {
                    $("#pwca-calculate-shipping:not(:first)").remove();
                }
                
                // 计算运费按钮点击事件
                $(document).on("click", "#pwca-calculate-shipping", function() {
                    var button = $(this);
                    
                    // 防止重复点击
                    if (button.prop("disabled")) {
                        return;
                    }
                    
                    // 添加加载状态
                    button.prop("disabled", true).addClass("loading").text("' . __('Calculating...', 'woocommerce') . '");
                    
                    // 触发 WooCommerce 更新结账页面
                    $("body").trigger("update_checkout");
                    
                    // 监听更新完成事件（只绑定一次）
                    $(document.body).off("updated_checkout.pwca").on("updated_checkout.pwca", function() {
                        // 移除加载状态
                        button.prop("disabled", false).removeClass("loading").text("' . __('Calculate Shipping', 'woocommerce') . '");
                        
                        // 显示成功消息
                        if (!$(".pwca-shipping-calculated").length) {
                            button.after("<span class=\"pwca-shipping-calculated\" style=\"color: #4caf50; margin-left: 10px;\">✓ ' . __('Shipping calculated', 'woocommerce') . '</span>");
                            setTimeout(function() {
                                $(".pwca-shipping-calculated").fadeOut(500, function() {
                                    $(this).remove();
                                });
                            }, 3000);
                        }
                    });
                });
                
                // 监听 checkout 更新事件，确保按钮状态正确
                $(document.body).on("update_checkout", function() {
                    console.log("WooCommerce checkout update triggered");
                });
                
                $(document.body).on("updated_checkout", function() {
                    console.log("WooCommerce checkout update completed");
                });
            });
        ');
    }
}

// 添加自定义CSS样式
add_action('wp_head', 'pwca_calculate_shipping_styles');
function pwca_calculate_shipping_styles()
{
    if (is_checkout()) {
        echo '<style>
            .pwca-calculate-shipping-container {
               
                padding: 10px 0;
                border-bottom: 1px solid #e0e0e0;
            }
            
            .pwca-calculate-shipping-btn {
                background: #007cba;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s ease;
            }
            
            .pwca-calculate-shipping-btn:hover {
                background: #005a87;
            }
            
            .pwca-calculate-shipping-btn:disabled {
                background: #ccc;
                cursor: not-allowed;
            }
            
            .pwca-calculate-shipping-btn.loading {
                position: relative;
                padding-right: 30px;
            }
            
            .pwca-calculate-shipping-btn.loading:after {
                content: "";
                position: absolute;
                right: 10px;
                top: 50%;
                width: 12px;
                height: 12px;
                margin-top: -6px;
                border: 2px solid #ffffff;
                border-top: 2px solid transparent;
                border-radius: 50%;
                animation: pwca-spin 1s linear infinite;
            }
            
            @keyframes pwca-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
        <script>
        jQuery(document).ready(function($) {
            // 确保页面上只有一个计算运费按钮
            function ensureSingleCalculateButton() {
                var buttons = $(".pwca-calculate-shipping-container");
                if (buttons.length > 1) {
                    buttons.not(":first").remove();
                    console.log("PW Canvas: Removed duplicate calculate shipping buttons");
                }
            }
            
            // 初始清理
            ensureSingleCalculateButton();
            
            // 监听 WooCommerce 更新事件
            $(document.body).on("updated_checkout", function() {
                setTimeout(ensureSingleCalculateButton, 100);
            });
            
            // 监听 AJAX 完成事件
            $(document).ajaxComplete(function() {
                setTimeout(ensureSingleCalculateButton, 100);
            });
        });
        </script>';
    }
}
