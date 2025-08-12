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
define( 'MY_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'MY_PLUGIN_ICONS_URL', MY_PLUGIN_URL . 'assets/images/icons/' );



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
function pw_admin_register_action_scheduler_hooks() {
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



add_action('manage_product_posts_custom_column', function ($column, $post_id) {
    if ($column === 'name') {
        $product = wc_get_product($post_id);
        if ($cross_ids = $product->get_cross_sell_ids()) {
            echo '<div class="cross-sells-tooltip">▲ ' . count($cross_ids) . ' sub-products
                <div class="tooltip">' . implode(
                '<br>',
                array_map('get_the_title', $cross_ids)
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
