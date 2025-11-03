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
            // 首先检查session中是否有用户选择的运费
            $selected_cost = WC()->session->get('pwca_selected_shipping_cost');
            $selected_service = WC()->session->get('pwca_selected_shipping_service');

            // 添加调试日志
            error_log('PWCA Shipping Debug - Selected Cost: ' . $selected_cost . ', Service: ' . $selected_service);

            if ($selected_cost !== null && $selected_cost !== false && $selected_service) {
                // 确保运费为数字类型
                $cost = floatval($selected_cost);

                return array(
                    'id' => $this->id . '_' . $this->instance_id,
                    'label' => 'Shipping Options: ' . $selected_service,
                    'cost' => $cost,
                    'taxes' => '',
                    'calc_tax' => 'per_order',
                    'meta_data' => array(
                        'pwca_shipping_service' => $selected_service,
                        'pwca_shipping_cost' => $cost
                    )
                );
            }

            // 如果没有选择的运费，返回默认的占位符运费
            // 这样可以确保在用户选择运费之前，checkout 页面也能正常显示
            return array(
                'id' => $this->id . '_' . $this->instance_id,
                'label' => 'Shipping Options: Please calculate shipping',
                'cost' => 0,
                'taxes' => '',
                'calc_tax' => 'per_order',
                'meta_data' => array(
                    'pwca_shipping_service' => 'Not selected',
                    'pwca_shipping_cost' => 0
                )
            );
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

        // 新增方法：获取所有运费选项
        public function fetch_all_shipping_options($country_code, $weight, $shipping_method)
        {
            // 使用独立的API函数
            return pwca_fetch_shipping_options_from_api($country_code, $weight, $shipping_method);
        }
    }
}

add_filter('woocommerce_shipping_methods', 'add_pwca_shipping_method');
function add_pwca_shipping_method($methods)
{
    $methods['pwca_shipping_method'] = 'WC_Pwca_Shipping_Method';
    return $methods;
}

// 确保 PWCA shipping method 在所有 shipping zones 中可用
add_action('woocommerce_shipping_zone_method_added', 'pwca_ensure_shipping_method_available', 10, 3);
function pwca_ensure_shipping_method_available($instance_id, $method_id, $zone_id)
{
    if ($method_id === 'pwca_shipping_method') {
        error_log('PWCA Shipping method added to zone: ' . $zone_id);
    }
}

// 在插件激活时自动添加 shipping method 到默认 zone
add_action('woocommerce_init', 'pwca_auto_add_shipping_method');
function pwca_auto_add_shipping_method()
{
    // 仅在未完成全局注册时执行
    $added_all = get_option('pwca_shipping_method_added_all_zones', false);
    if ($added_all) {
        return;
    }

    // 获取所有已定义的配送区域
    $zones = WC_Shipping_Zones::get_zones();

    // 构建区域 ID 列表，并包含默认区域（ID 为 0）
    $zone_ids = array_map('intval', array_keys($zones));
    $zone_ids[] = 0; // 默认区域（未被其他区域覆盖的地区）

    foreach ($zone_ids as $zone_id) {
        // 获取区域对象（默认区域需使用 new WC_Shipping_Zone(0)）
        $zone = ($zone_id === 0) ? new WC_Shipping_Zone(0) : WC_Shipping_Zones::get_zone($zone_id);
        if (!$zone) {
            continue;
        }

        // 检查该区域是否已存在我们的运费方法
        $methods = $zone->get_shipping_methods();
        $has_pwca = false;
        foreach ($methods as $method) {
            if ($method->id === 'pwca_shipping_method') {
                $has_pwca = true;
                break;
            }
        }

        // 不存在则添加
        if (!$has_pwca) {
            $zone->add_shipping_method('pwca_shipping_method');
            error_log('PWCA Shipping method auto-added to zone: ' . $zone_id);
        }
    }

    // 标记已完成全局注册，避免重复执行
    update_option('pwca_shipping_method_added_all_zones', true);
}

// 独立的API调用函数，用于获取所有运费选项
function pwca_fetch_shipping_options_from_api($country_code, $weight, $shipping_method = 'PK1792')
{
    $api_url = 'https://dev.promowares.com/api/v1/shipping/calculate';
    $token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NDE4MTYxMjgsInRlYW0iOiIxIiwidXNlcl9pZCI6MX0.60D-NUbUBa_n3KXyNrhnoN964IjwIFJtGUVDCSnKYFM';

    $request_data = array(
        'country_code' => $country_code,
        'weight' => strval($weight),
        'shipping_method' => $shipping_method,
    );

    // 详细的请求日志
    error_log('PWCA API Request - URL: ' . $api_url);
    error_log('PWCA API Request - Data: ' . json_encode($request_data));
    error_log('PWCA API Request - Country: ' . $country_code . ', Weight: ' . $weight);

    $args = array(
        'headers' => array(
            'Authorization' => $token,
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ),
        'body' => json_encode($request_data),
        'method' => 'POST',
        'timeout' => 15,
    );

    $response = wp_remote_post($api_url, $args);

    if (is_wp_error($response)) {
        error_log('PWCA Shipping API WP Error: ' . $response->get_error_message());
        return array(
            'code' => 500,
            'message' => 'Shipping API connection failed: ' . $response->get_error_message(),
            'data' => null,
            'error' => true
        );
    }

    $response_code = wp_remote_retrieve_response_code($response);
    $body = wp_remote_retrieve_body($response);

    // 详细的响应日志
    error_log('PWCA API Response - Code: ' . $response_code);
    error_log('PWCA API Response - Body: ' . $body);

    $data = json_decode($body, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log('PWCA API JSON Decode Error: ' . json_last_error_msg());
        return array(
            'code' => 500,
            'message' => 'Shipping API response format error: ' . json_last_error_msg(),
            'data' => null,
            'error' => true
        );
    }

    error_log('PWCA API Parsed Data: ' . print_r($data, true));

    // 检查API响应是否成功
    if ($response_code === 200 && $data && isset($data['code']) && $data['code'] === 200) {
        if (isset($data['data']['raw_response']['data']) && !empty($data['data']['raw_response']['data'])) {
            error_log('PWCA API Success - Using real API data');
            return $data;
        } else {
            error_log('PWCA API Error - Missing or empty data in response structure');
            error_log('PWCA API Data Structure: ' . print_r($data, true));
        }
    } else {
        error_log('PWCA API Error - Invalid response code or data structure');
        if ($data && isset($data['message'])) {
            error_log('PWCA API Error Message: ' . $data['message']);
        }
    }

    // API失败或返回错误，返回真实的错误状态
    error_log('PWCA Shipping API failed (Code: ' . $response_code . '), no shipping options available');
    return array(
        'code' => $response_code ?: 500,
        'message' => 'Shipping options unavailable - API error',
        'data' => null,
        'error' => true
    );
}



// AJAX处理函数：获取运费选项
add_action('wp_ajax_pwca_get_shipping_options', 'pwca_handle_get_shipping_options');
add_action('wp_ajax_nopriv_pwca_get_shipping_options', 'pwca_handle_get_shipping_options');
function pwca_handle_get_shipping_options()
{
    // 验证nonce
    if (!wp_verify_nonce($_POST['nonce'], 'pwca_shipping_nonce')) {
        wp_send_json_error('Security check failed');
        return;
    }

    // 获取购物车信息
    if (!WC()->cart) {
        wp_send_json_error('Cart not available');
        return;
    }

    // 计算总重量
    $weight = 0;
    $cart_items = WC()->cart->get_cart();

    foreach ($cart_items as $cart_item_key => $cart_item) {
        $product = $cart_item['data'];
        $product_weight = $product->get_weight();
        $quantity = $cart_item['quantity'];

        if ($product_weight) {
            $weight += floatval($product_weight) * $quantity;
        }
    }

    // 如果没有重量，设置默认值
    if ($weight <= 0) {
        $weight = 1; // 默认1kg
    }

    // 获取目标国家
    $country_code = WC()->customer->get_shipping_country();
    if (empty($country_code)) {
        $country_code = WC()->customer->get_billing_country();
    }
    if (empty($country_code)) {
        $country_code = 'US'; // 默认美国
    }

    // 调用API获取运费选项
    error_log('PWCA AJAX - Calling API with Country: ' . $country_code . ', Weight: ' . $weight);
    $shipping_options = pwca_fetch_shipping_options_from_api($country_code, $weight, 'PK1792');

    if ($shipping_options && isset($shipping_options['code']) && $shipping_options['code'] === 200) {
        $message = 'Shipping options loaded successfully from API';
        error_log('PWCA AJAX - Using real API data');

        wp_send_json_success(array(
            'data' => $shipping_options,
            'message' => $message
        ));
    } else {
        // 处理API错误
        $error_message = 'Unable to calculate shipping costs. Please try again later.';
        if ($shipping_options && isset($shipping_options['message'])) {
            $error_message = $shipping_options['message'];
        }

        error_log('PWCA AJAX - API failure: ' . $error_message);
        wp_send_json_error($error_message);
    }
}

// AJAX处理函数：更新选中的运费
add_action('wp_ajax_pwca_update_shipping_cost', 'pwca_handle_update_shipping_cost');
add_action('wp_ajax_nopriv_pwca_update_shipping_cost', 'pwca_handle_update_shipping_cost');
function pwca_handle_update_shipping_cost()
{
    // 验证nonce
    if (!wp_verify_nonce($_POST['nonce'], 'pwca_shipping_nonce')) {
        wp_send_json_error('Security check failed');
        return;
    }

    $selected_cost = floatval($_POST['shipping_cost']);
    $service_name = sanitize_text_field($_POST['service_name']);

    // 将选中的运费存储到session中
    WC()->session->set('pwca_selected_shipping_cost', $selected_cost);
    WC()->session->set('pwca_selected_shipping_service', $service_name);

    // 强制清除 WooCommerce shipping packages 缓存
    WC()->shipping()->reset_shipping();

    // 清除购物车缓存，强制重新计算
    if (WC()->cart) {
        WC()->cart->calculate_shipping();
        WC()->cart->calculate_totals();
    }

    wp_send_json_success(array(
        'cost' => $selected_cost,
        'service' => $service_name,
        'debug' => array(
            'session_cost' => WC()->session->get('pwca_selected_shipping_cost'),
            'session_service' => WC()->session->get('pwca_selected_shipping_service')
        )
    ));
}

// 添加计算运费按钮和刷新订单区域功能
add_action('woocommerce_after_order_notes', 'pwca_add_calculate_shipping_button');
function pwca_add_calculate_shipping_button()
{
    if (is_checkout() && !defined('DOING_AJAX')) {
        // 添加标题
        echo '<div class="pwca-calculate-shipping-title" style="margin-bottom: 10px;">' . __('YOUR ORDER', 'woocommerce') . '</div>';

        echo '<div class="pwca-calculate-shipping-container" style="margin-bottom: 15px;">';
        echo '<button type="button" class="button pwca-calculate-shipping-btn" id="pwca-calculate-shipping">' . __('Calculate Shipping', 'woocommerce') . '</button>';
        echo '<div id="pwca-shipping-options" style="display: none; margin-top: 15px;"></div>';
        echo '</div>';

        // 添加nonce用于AJAX安全验证
        wp_localize_script('jquery', 'pwca_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('pwca_shipping_nonce')
        ));

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
                    
                    // 隐藏之前的运费选项
                    $("#pwca-shipping-options").hide();
                    
                    // 调用AJAX获取运费选项
                    $.ajax({
                        url: pwca_ajax.ajax_url,
                        type: "POST",
                        data: {
                            action: "pwca_get_shipping_options",
                            nonce: pwca_ajax.nonce
                        },
                        success: function(response) {
                            button.prop("disabled", false).removeClass("loading").text("' . __('Calculate Shipping', 'woocommerce') . '");
                            
                            if (response.success) {
                                // 清除之前的通知
                                $(".pwca-woocommerce-info, .pwca-woocommerce-error").remove();
                                
                                // 检查响应数据结构
                                var shippingData = response.data.data || response.data;
                                if (shippingData && shippingData.data && shippingData.data.raw_response && shippingData.data.raw_response.data) {
                                    // 显示成功消息
                                    var notice = "<div class=\"pwca-woocommerce-message\" style=\"margin-bottom: 15px; padding: 10px; border-left: 4px solid #46b450; background: #ecf7ed;\">" + response.data.message + "</div>";
                                    $("#pwca-shipping-options").before(notice);
                                    
                                    displayShippingOptions(shippingData.data.raw_response.data);
                                } else {
                                    alert("' . __('Unable to load shipping options. Please try again.', 'woocommerce') . '");
                                }
                            } else {
                                var errorMsg = response.data || "' . __('Failed to calculate shipping costs', 'woocommerce') . '";
                                alert(errorMsg);
                            }
                        },
                        error: function() {
                            button.prop("disabled", false).removeClass("loading").text("' . __('Calculate Shipping', 'woocommerce') . '");
                            alert("' . __('Error occurred while calculating shipping', 'woocommerce') . '");
                        }
                    });
                });
                
                // 显示运费选项表格
                function displayShippingOptions(options) {
                    var html = "<h4>' . __('Shipping Options', 'woocommerce') . '</h4>";
                    html += "<table class=\"pwca-shipping-table\">";
                    html += "<thead><tr>";
                    html += "<th>' . __('Select', 'woocommerce') . '</th>";
                    html += "<th>' . __('Service', 'woocommerce') . '</th>";
                    html += "<th>' . __('Delivery Time', 'woocommerce') . '</th>";
                    html += "<th>' . __('Cost', 'woocommerce') . '</th>";
                    html += "</tr></thead><tbody>";
                    
                    for (var i = 0; i < options.length; i++) {
                        var option = options[i];
                        var checked = i === 0 ? "checked" : ""; // 默认选中第一个
                        
                        // 处理API响应数据格式
                        var serviceName = option.serviceCnName || "Unknown Service";
                        var cost = option.totalFee || 0;
                        var deliveryTime = option.effectiveness || "Unknown";
                        
                        // 确保delivery_time格式正确
                        if (typeof deliveryTime === "string" && deliveryTime.indexOf("day") === -1) {
                            deliveryTime = deliveryTime + " ' . __('days', 'woocommerce') . '";
                        }
                        
                        html += "<tr>";
                        html += "<td><input type=\"radio\" name=\"pwca_shipping_option\" value=\"" + i + "\" " + checked + " data-cost=\"" + cost + "\" data-service=\"" + serviceName + "\"></td>";
                        html += "<td>" + serviceName + "</td>";
                        html += "<td>" + deliveryTime + "</td>";
                        html += "<td>$" + parseFloat(cost).toFixed(2) + "</td>";
                        html += "</tr>";
                    }
                    
                    html += "</tbody></table>";
                    
                    $("#pwca-shipping-options").html(html).show();
                    
                    // 默认选中第一个选项并更新运费
                    if (options.length > 0) {
                        var firstOption = options[0];
                        var firstCost = firstOption.totalFee || 0;
                        var firstName = firstOption.serviceCnName || "Unknown Service";
                        updateShippingCost(firstCost, firstName);
                    }
                }
                
                // 监听运费选项变化
                $(document).on("change", "input[name=\"pwca_shipping_option\"]", function() {
                    var cost = parseFloat($(this).data("cost"));
                    var service = $(this).data("service");
                    updateShippingCost(cost, service);
                });
                
                // 更新运费显示文字的函数
                function updateShippingDisplayText(service, cost) {
                    // 设置标志表示用户已选择运费
                    window.pwcaHasSelectedShipping = true;
                    
                    // 首先显示运费行（如果之前被隐藏）
                    $(".shipping").show();
                    
                    // 查找运费显示的 td 元素
                    $(".shipping td").each(function() {
                        var $td = $(this);
                        // 显示运费行
                        $td.closest("tr").show();
                        // 构建新的显示文字
                        var newText = "Shipping Options: " + service + ": $" + parseFloat(cost).toFixed(2);
                        $td.html(newText);
                        console.log("Updated shipping display text to:", newText);
                    });
                    
                    // 也更新可能的其他运费显示位置
                    $(".woocommerce-shipping-totals td").each(function() {
                        var $td = $(this);
                        $td.closest("tr").show();
                        var newText = "Shipping Options: " + service + ": $" + parseFloat(cost).toFixed(2);
                        $td.html(newText);
                    });
                }
                
                // 更新运费
                function updateShippingCost(cost, service) {
                    // 显示加载状态
                    $("#pwca-shipping-options").append("<div class=\"pwca-shipping-updating\">Updating shipping cost...</div>");
                    
                    $.ajax({
                        url: pwca_ajax.ajax_url,
                        type: "POST",
                        data: {
                            action: "pwca_update_shipping_cost",
                            nonce: pwca_ajax.nonce,
                            shipping_cost: cost,
                            service_name: service
                        },
                        success: function(response) {
                            // 移除加载状态
                            $(".pwca-shipping-updating").remove();
                            
                            if (response.success) {
                                console.log("PWCA Shipping updated:", response.data);
                                
                                // 立即更新运费显示文字
                                updateShippingDisplayText(service, cost);
                                
                                // 强制重新计算运费和总价
                                if (typeof wc_checkout_params !== "undefined") {
                                    // 触发 WooCommerce checkout 更新
                                    $("body").trigger("update_checkout");
                                    
                                    // 强制重新计算购物车总价
                                    setTimeout(function() {
                                        // 再次触发更新确保运费计算正确
                                        $("body").trigger("update_checkout");
                                        
                                        // 强制刷新运费计算
                                        $("body").trigger("wc_fragments_refresh");
                                        
                                        // 再次确保显示文字正确
                                        updateShippingDisplayText(service, cost);
                                        
                                        console.log("PWCA: Forced shipping recalculation completed");
                                    }, 500);
                                    
                                    // 额外的延迟确保所有计算完成
                                    setTimeout(function() {
                                        $("body").trigger("update_checkout");
                                        console.log("PWCA: Final checkout update triggered");
                                    }, 1000);
                                }
                                
                                // 显示成功消息
                                var successMsg = "<div class=\"pwca-woocommerce-message\">Shipping cost updated: $" + parseFloat(cost).toFixed(2) + " for " + service + "</div>";
                                $("#pwca-shipping-options").before(successMsg);
                                
                                // 3秒后移除成功消息
                                setTimeout(function() {
                                    $(".pwca-woocommerce-message").fadeOut();
                                }, 3000);
                            } else {
                                alert("Failed to update shipping cost");
                            }
                        },
                        error: function() {
                            $(".pwca-shipping-updating").remove();
                            alert("Error updating shipping cost");
                        }
                    });
                }
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
            
            /* 运费选项表格样式 */
            #pwca-shipping-options h4 {
                margin: 0 0 10px 0;
                font-size: 16px;
                color: #333;
            }
            
            .pwca-shipping-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
                background: #fff;
                border: 1px solid #ddd;
            }
            
            .pwca-shipping-table th,
            .pwca-shipping-table td {
                padding: 12px 8px;
                text-align: left;
                border-bottom: 1px solid #ddd;
            }
            
            .pwca-shipping-table th {
                background: #f8f9fa;
                font-weight: 600;
                color: #333;
            }
            
            .pwca-shipping-table tr:hover {
                background: #f8f9fa;
            }
            
            .pwca-shipping-table input[type="radio"] {
                margin: 0;
                cursor: pointer;
            }
            
            .pwca-shipping-table td:first-child {
                text-align: center;
                width: 60px;
            }
            
            .pwca-shipping-table td:last-child {
                font-weight: 600;
                color: #007cba;
            }
            
            /* 运费更新状态样式 */
            .pwca-shipping-updating {
                background: #f0f8ff;
                border: 1px solid #007cba;
                padding: 8px 12px;
                margin: 10px 0;
                border-radius: 4px;
                color: #007cba;
                font-size: 14px;
                text-align: center;
            }
            
            /* 成功消息样式 */
            .pwca-woocommerce-message {
                background: #d4edda;
                border: 1px solid #c3e6cb;
                color: #155724;
                padding: 10px 15px;
                margin: 10px 0;
                border-radius: 4px;
                font-size: 14px;
            }
            
            /* 隐藏 WooCommerce 默认的运费选择器 */
            .woocommerce-checkout #shipping_method {
                display: none !important;
            }
            
            .woocommerce-checkout .shipping-calculator-form {
                display: none !important;
            }
            
            /* 隐藏运费选择的单选按钮和标签 */
            .woocommerce-checkout .woocommerce-shipping-methods {
                display: none !important;
            }
            
            .woocommerce-checkout .woocommerce-shipping-methods li {
                display: none !important;
            }
            
            /* 只显示运费金额，不显示选择器 */
            .woocommerce-checkout .shipping td {
                position: relative;
            }
            
            .woocommerce-checkout .shipping .woocommerce-shipping-methods {
                display: none !important;
            }
            
            /* 确保运费标签正确显示 */
            .woocommerce-checkout .shipping th,
            .woocommerce-checkout .shipping td {
                text-align: left;
            }
            
            /* 隐藏运费计算器按钮（如果存在） */
            .woocommerce-checkout .shipping-calculator-button {
                display: none !important;
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
            
            // 隐藏 WooCommerce 默认运费选择器的函数
            function hideWooCommerceShippingSelector() {
                // 隐藏运费选择的单选按钮
                $(".woocommerce-shipping-methods").hide();
                $(".woocommerce-shipping-methods li").hide();
                $("#shipping_method").hide();
                $(".shipping-calculator-form").hide();
                $(".shipping-calculator-button").hide();
                
                // 检查是否有用户选择的运费
                var hasSelectedShipping = window.pwcaHasSelectedShipping || false;
                
                // 处理运费显示
                $(".shipping td").each(function() {
                    var $td = $(this);
                    var $methods = $td.find(".woocommerce-shipping-methods");
                    
                    if ($methods.length > 0) {
                        if (hasSelectedShipping) {
                            // 如果用户已选择运费，显示选中的运费信息
                            var $selectedMethod = $methods.find("input:checked").parent();
                            if ($selectedMethod.length > 0) {
                                var shippingText = $selectedMethod.text().trim();
                                // 检查是否是 "Please calculate shipping" 的默认状态
                                if (shippingText.includes("Please calculate shipping")) {
                                    $td.html("Shipping: Please calculate shipping");
                                } else {
                                    $td.html(shippingText);
                                }
                            }
                        } else {
                            // 初始状态：完全隐藏运费行
                            $td.closest("tr").hide();
                        }
                    }
                });
                
                console.log("PW Canvas: Hidden WooCommerce shipping selector, hasSelectedShipping:", hasSelectedShipping);
            }
            
            // 初始化运费状态标志
            window.pwcaHasSelectedShipping = false;
            
            // 页面加载时隐藏选择器
            hideWooCommerceShippingSelector();
            
            // 监听 checkout 更新事件
            $(document.body).on("updated_checkout", function() {
                setTimeout(hideWooCommerceShippingSelector, 200);
            });
            
            // 监听 AJAX 完成事件
            $(document).ajaxComplete(function(event, xhr, settings) {
                // 检查是否是 checkout 相关的 AJAX 请求
                if (settings.url && (settings.url.indexOf("update_order_review") > -1 || settings.url.indexOf("checkout") > -1)) {
                    setTimeout(hideWooCommerceShippingSelector, 200);
                }
            });
        });
        </script>';
    }
}

// 添加 WooCommerce hooks 确保运费正确更新
add_action('woocommerce_checkout_update_order_review', 'pwca_force_shipping_recalculation');
function pwca_force_shipping_recalculation($post_data)
{
    // 解析 POST 数据
    parse_str($post_data, $data);

    // 检查是否有选中的运费
    $selected_cost = WC()->session->get('pwca_selected_shipping_cost');
    $selected_service = WC()->session->get('pwca_selected_shipping_service');

    if ($selected_cost !== null && $selected_cost !== false) {
        // 强制重新计算运费与总价
        WC()->shipping()->reset_shipping();
        if (WC()->cart) {
            WC()->cart->calculate_shipping();
            WC()->cart->calculate_totals();
        }
    }
}

// 确保在 checkout 页面加载时显示正确的运费
add_action('woocommerce_checkout_init', 'pwca_init_checkout_shipping');
function pwca_init_checkout_shipping()
{
    // 检查是否有选中的运费
    // $selected_cost = WC()->session->get('pwca_selected_shipping_cost');
    // $selected_service = WC()->session->get('pwca_selected_shipping_service');

    if ($selected_cost !== null && $selected_cost !== false) {
        // 强制重新计算运费以确保显示正确
        WC()->shipping()->reset_shipping();
        if (WC()->cart) {
            WC()->cart->calculate_shipping();
            WC()->cart->calculate_totals();
        }
    }
}

// 确保运费方法只显示一个选项（不显示选择器）
add_filter('woocommerce_package_rates', 'pwca_filter_shipping_methods', 10, 2);
function pwca_filter_shipping_methods($rates, $package)
{
    // 检查是否有我们的运费方法
    $pwca_rates = array();
    foreach ($rates as $rate_id => $rate) {
        if (strpos($rate_id, 'pwca_shipping_method') !== false) {
            $pwca_rates[$rate_id] = $rate;
        }
    }

    // 如果有我们的运费方法，只返回我们的方法
    if (!empty($pwca_rates)) {
        return $pwca_rates;
    }

    // 否则返回原始的运费方法
    return $rates;
}

// 添加 AJAX 处理来清除运费选择
add_action('wp_ajax_pwca_clear_shipping_selection', 'pwca_handle_clear_shipping_selection');
add_action('wp_ajax_nopriv_pwca_clear_shipping_selection', 'pwca_handle_clear_shipping_selection');
function pwca_handle_clear_shipping_selection()
{
    // 验证nonce
    if (!wp_verify_nonce($_POST['nonce'], 'pwca_shipping_nonce')) {
        wp_send_json_error('Security check failed');
        return;
    }

    // 清除 session 中的运费数据
    WC()->session->set('pwca_selected_shipping_cost', null);
    WC()->session->set('pwca_selected_shipping_service', null);

    // 强制重新计算
    WC()->shipping()->reset_shipping();
    if (WC()->cart) {
        WC()->cart->calculate_shipping();
        WC()->cart->calculate_totals();
    }

    wp_send_json_success(array(
        'message' => 'Shipping selection cleared'
    ));
}

/**
 * 允许插件覆盖 WooCommerce 模板
 *
 * @param string $template      默认模板的路径
 * @param string $template_name 模板文件的名称 (例如 "checkout/review-order.php")
 * @param string $template_path 模板路径 (通常是 "woocommerce/")
 * @return string               新的模板路径
 */
add_filter('woocommerce_locate_template', 'my_plugin_wc_template_override', 10, 3);

function my_plugin_wc_template_override($template, $template_name, $template_path)
{

    // if (is_page('custom-checkout')) {
    //     return $template;
    // }
    // 获取您插件内部 'woocommerce' 文件夹的路径
    // __FILE__ 指向当前文件 (my-plugin.php)
    $plugin_template_path = plugin_dir_path(__FILE__) . 'woocommerce/' . $template_name;

    // 检查您插件的 'woocommerce' 文件夹中是否存在该模板文件
    if (file_exists($plugin_template_path)) {
        // 如果存在，返回您插件中的文件路径
        // 这将覆盖主题和 WooCommerce 的默认模板
        $template = $plugin_template_path;
    }

    // 如果不存在，返回原始的 $template 路径，以便 WooCommerce 正常加载
    return $template;
}
