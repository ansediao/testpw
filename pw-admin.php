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
 * Plugin Name:       PW Admin
 * Plugin URI:        https://www.pw.com
 * Description:       PW Admin
 * Version:           1.0.0
 * Author:            PW
 * Author URI:        https://www.pw.com/
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       pw-admin
 * Domain Path:       /languages
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
            echo '<div class="cross-sells-tooltip">▲ ' . count($cross_ids) . '个子产品
                <div class="tooltip">' . implode(
                '<br>',
                array_map('get_the_title', $cross_ids)
            ) . '</div>
                </div>';
        }
    }
}, 10, 2);



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

function pw_canvas_public_enqueue_scripts()
{


    // 如果当前路径不包含 pwcanvas/?product_id= 就不继续执行
    $request_uri = $_SERVER['REQUEST_URI'];
    if (strpos($request_uri, 'pwcanvas/?product_id=') === false) {
        return;
    }



    /**
     * 1. 使用 wp_enqueue_script 以 WordPress 的方式加载 Vue.js
     * 我们从 CDN 加载，并为其指定一个句柄 'vue-js'。
     */
    wp_enqueue_script(
        'vue-js', // 为 Vue 定义一个唯一的句柄
        'https://unpkg.com/vue@3.3.4/dist/vue.global.js', // Vue 的 CDN 链接
        array(), // Vue 本身没有依赖
        '3.3.4', // 指定版本号
        false // true 表示在 <body> 底部加载，提升性能
    );

    /**
     * 2. 加载你自己的 app.js 脚本
     * 注意：我们将 'vue-js' 添加到了依赖数组中。
     */
    wp_enqueue_script(
        'my-app-script', // 你的脚本句柄
        plugins_url('public/js/app.js', __FILE__),
        array('vue-js'), // <-- 重要！声明此脚本依赖于 'vue-js'
        filemtime(plugin_dir_path(__FILE__) . 'public/js/app.js'), // <-- 使用文件修改时间作为版本号
        false // 在 <body> 底部加载 (建议将 false 改为 true 保持一致)
    );

    // 为 my-app-script 添加 type="module" 属性的过滤器保持不变
    add_filter('script_loader_tag', 'add_type_attribute_to_my_script', 10, 3);

    /**
     * 3. 使用 wp_localize_script 传递数据
     * 这部分代码保持不变，它会把数据附加到 'my-app-script' 上。
     */

    // 获取产品id
    $product_id = $_GET['product_id'];
    // 获取标题
    $product = wc_get_product($product_id);
    $product_name = $product->get_name();
    // 获取封面图片  光影图层
    $product_image_id = $product->get_image_id();
    if ($product_image_id) {
        $shadow_details_image_url = wp_get_attachment_image_url($product_image_id, 'full');
    }
    // 获取 颜色 图层
    $color_image_url = get_post_meta($product_id, 'pw_mainIMG_color', true);
    // 获取3D模型文件
    $model_3d_url = get_post_meta($product_id, 'pw_3d_file', true);
    // 获取容器图层
    $pw_container  = get_post_meta($product_id, 'pw_container', true);
    // 获取 4格图层
    $pw_4_grid = get_post_meta($product_id, 'pw_4-grid', true);
    // 背景
    $pw_bg = get_post_meta($product_id, 'pw_bg', true);

    $pw_productType = get_post_meta($product_id, 'pw_productType', true);
    // 平面产品
    if ($pw_productType == 1) {
        $image_size = getimagesize($shadow_details_image_url);
        $image_width = $image_size[0];
        $image_height = $image_size[1];
        // 计算等比例高度（基于500px宽度）
        $canvas_width = 500;
        $canvas_height = round(($canvas_width / $image_width) * $image_height);
    }



    // 如果 $pw_4_grid 存在且不为空 那么 获取尺寸信息
    // if ($pw_4_grid) {
    //     $image_url = $pw_4_grid;

    //     // 获取图片尺寸
    //     $image_size = getimagesize($pw_4_grid);
    //     $image_width = $image_size[0];
    //     $image_height = $image_size[1];
    //     // 计算等比例高度（基于500px宽度）
    //     $canvas_width = 500;
    //     $canvas_height = round(($canvas_width / $image_width) * $image_height);
    // }



    $data = array(
        'product_id' => $product_id,
        'product_name' => $product_name,
        'pw_productType' => $pw_productType, //产品类型
        'shadow_details_image_url' => $shadow_details_image_url, //光影图层
        'color_image_url' => $color_image_url, //底色
        'model_3d_url' => $model_3d_url, //3D模型
        'pw_container' => $pw_container, //容器图层
        'pw_4_grid' => $pw_4_grid, //4格图层
        'pw_bg' => $pw_bg, //背景图层
        'canvas_width'=> $canvas_width, //画布宽度
        'canvas_height'=> $canvas_height, //画布高度


        // ... 其他你需要传递的数据
    );
    wp_localize_script('my-app-script', 'productData', $data);
}

// 将函数挂载到 'wp_enqueue_scripts' 动作上
add_action('wp_enqueue_scripts', 'pw_canvas_public_enqueue_scripts');

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
