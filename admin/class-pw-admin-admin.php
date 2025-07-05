<?php

/**
 * The admin-specific functionality of the plugin.
 *
 * @link       https://www.pw.com
 * @since      1.0.0
 *
 * @package    Pw_Admin
 * @subpackage Pw_Admin/admin
 */

/**
 * The admin-specific functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the admin-specific stylesheet and JavaScript.
 *
 * @package    Pw_Admin
 * @subpackage Pw_Admin/admin
 * @author     PW <pw@pwcom>
 */
class Pw_Admin_Admin
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
     * @param      string    $plugin_name       The name of this plugin.
     * @param      string    $version    The version of this plugin.
     */
    public function __construct($plugin_name, $version)
    {

        $this->plugin_name = $plugin_name;
        $this->version = $version;
    }

    /**
     * Register the stylesheets for the admin area.
     *
     * @since    1.0.0
     */
    public function enqueue_styles()
    {

        /**
         * This function is provided for demonstration purposes only.
         *
         * An instance of this class should be passed to the run() function
         * defined in Pw_Admin_Loader as all of the hooks are defined
         * in that particular class.
         *
         * The Pw_Admin_Loader will then create the relationship
         * between the defined hooks and the functions defined in this
         * class.
         */

        wp_enqueue_style($this->plugin_name, plugin_dir_url(__FILE__) . 'css/pw-admin-admin.css', array(), $this->version, 'all');
    }

    /**
     * Register the JavaScript for the admin area.
     *
     * @since    1.0.0
     */
    public function enqueue_scripts($hook)
    {
        /**
         * This function is provided for demonstration purposes only.
         *
         * An instance of this class should be passed to the run() function
         * defined in Pw_Admin_Loader as all of the hooks are defined
         * in that particular class.
         *
         * The Pw_Admin_Loader will then create the relationship
         * between the defined hooks and the functions defined in this
         * class.
         */

        // 加载 jsPDF 库 (This is for another feature, keeping it)
        wp_enqueue_script('jspdf', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', array(), '2.5.1', true);

        // 添加中文字体支持 (This is for another feature, keeping it)
        wp_enqueue_script('jspdf-customfonts', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-customfonts/0.0.72/jspdf.customfonts.min.js', array('jspdf'), '0.0.72', true);

        // 添加自动表格支持 (This is for another feature, keeping it)
        wp_enqueue_script('jspdf-autotable', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.29/jspdf.plugin.autotable.min.js', array('jspdf'), '3.5.29', true);

        // 最后加载自定义脚本
        $js_file = plugin_dir_url(__FILE__) . 'js/pw-admin-admin.js';
        wp_enqueue_script($this->plugin_name, $js_file, array('jquery', 'jspdf'), $this->version, true);

    }
}




// 检查 WooCommerce 是否已激活
function pw_check_woocommerce_active()
{
    return in_array('woocommerce/woocommerce.php', apply_filters('active_plugins', get_option('active_plugins')));
}

// 添加自定义菜单
function pw_add_custom_menu()
{
    // 检查 WooCommerce 是否激活
    if (!pw_check_woocommerce_active()) {
        return;
    }

    // 添加主菜单
    add_menu_page(
        'Promoware', // 页面标题
        'Promoware', // 菜单标题
        'read', // 所需权限
        'pw-dashboard', // 菜单别名
        'pw_main_menu_page', // 回调函数
        'dashicons-admin-generic', // 图标
        55 // 位置 (WooCommerce 产品菜单位置是 57)
    );

    // 添加一个自定义的二级菜单
    add_submenu_page(
        'pw-dashboard', // 父菜单别名
        'Dashboard', // 页面标题
        'Dashboard', // 二级菜单标题
        'read', // 所需权限
        'pw-dashboard-settings', // 菜单别名
        'pw_submenu_page_callback' // 回调函数
    );

    // 添加子菜单
    add_submenu_page(
        'pw-dashboard', // 父菜单别名
        'Design Library', // 页面标题
        'Design Library', // 菜单标题
        'read', // 所需权限
        'pw-submenu-design-library', // 菜单别名
        'pw_submenu_design_library' // 回调函数
    );

    add_submenu_page(
        'pw-dashboard', // 父菜单别名
        'Designs', // 页面标题
        'Designs', // 菜单标题
        'read', // 所需权限
        'pw-submenu-designs', // 菜单别名
        'pw_submenu_designs' // 回调函数
    );

    add_submenu_page(
        'pw-dashboard', // 父菜单别名
        'Tags', // 页面标题
        'Tags', // 菜单标题
        'read', // 所需权限
        'pw-submenu-tags', // 菜单别名
        'pw_submenu_tags' // 回调函数
    );
    // --- 开始集成 PW Design 相关菜单 ---

    // 子菜单：Design Library (所有 PW Design 文章列表)
    // 使用 'edit_posts' 权限通常适合查看和编辑文章列表
    // 如果您的 CPT capability_type 是 'post'，则 'edit_posts' 是合适的
    // 如果是自定义的 capability_type 如 'pw_design_item'，则应为 'edit_pw_design_items'
    // 为简单起见，我们用 'edit_posts'， WordPress 会进一步检查针对 'pw_design' 的权限
    $pw_design_post_type_obj = get_post_type_object('pw_design');
    $pw_design_capability_edit = $pw_design_post_type_obj ? $pw_design_post_type_obj->cap->edit_posts : 'edit_posts';


    add_submenu_page(
        'pw-dashboard',                         // 父菜单别名
        'Home Page for Design',                 // 页面标题
        'Manage Designs',                       // 菜单标题
        $pw_design_capability_edit,             // 所需权限
        'pw-manage-designs',                    // 菜单别名
        'pw_manage_designs_page'                // 回调函数
    );

    // 子菜单：Add New Design (添加新的 PW Design 文章)
    $pw_design_capability_create = $pw_design_post_type_obj ? $pw_design_post_type_obj->cap->create_posts : 'edit_posts';
    add_submenu_page(
        'pw-dashboard',                         // 父菜单别名
        'Add New PW Design',                    // 页面标题
        'Add New Design',                       // 菜单标题 (可以自定义，例如沿用您的 'Designs')
        $pw_design_capability_create,           // 所需权限 (创建文章)
        'post-new.php?post_type=pw_design',     // 菜单别名
        ''                                      // 回调函数
    );

    // 子菜单：Design Categories (管理 PW Design 分类)
    // 通常使用 'manage_categories' 或特定分类法的 'manage_terms' 权限
    $pw_design_category_tax_obj = get_taxonomy('pw_design_category');
    $pw_design_cat_capability = $pw_design_category_tax_obj ? $pw_design_category_tax_obj->cap->manage_terms : 'manage_categories';

    add_submenu_page(
        'pw-dashboard',                         // 父菜单别名
        'PW Design Categories',                 // 页面标题
        'Design Categories',                    // 菜单标题
        $pw_design_cat_capability,              // 所需权限
        'edit-tags.php?taxonomy=pw_design_category&post_type=pw_design', // 菜单别名
        ''                                      // 回调函数
    );

    // 子菜单：Design Tags (管理 PW Design 标签)
    $pw_design_tag_tax_obj = get_taxonomy('pw_design_tag');
    $pw_design_tag_capability = $pw_design_tag_tax_obj ? $pw_design_tag_tax_obj->cap->manage_terms : 'manage_categories';
    add_submenu_page(
        'pw-dashboard',                         // 父菜单别名
        'PW Design Tags',                       // 页面标题
        'Design Tags',                          // 菜单标题 (可以自定义，例如沿用您的 'Tags')
        $pw_design_tag_capability,              // 所需权限
        'edit-tags.php?taxonomy=pw_design_tag&post_type=pw_design',   // 菜单别名
        ''                                      // 回调函数
    );

    // --- 结束集成 PW Design 相关菜单 ---

    // 您原有的其他子菜单 (如果需要保留，并确保它们不与上面的重复)
    // 例如，如果您原来的 'Design Library', 'Designs', 'Tags' 有完全不同的自定义页面内容，
    // 您可能需要为上面的 CPT 管理链接使用新的菜单标题。
    // 如果您的意图就是用 CPT 管理页面替换它们，则上面的代码已完成此操作。
}
add_action('admin_menu', 'pw_add_custom_menu');


// 隐藏主菜单自动生成的二级菜单（使用CSS而不是移除）
add_action('admin_head', function () {
    echo '<style>
        #adminmenu .wp-submenu a[href="admin.php?page=pw-dashboard"] {
            display: none !important;
        }
    </style>';
});

// 顶级菜单页面回调函数
function pw_main_menu_page()
{

    if (isset($_POST['sync_products'])) {
        // 触发产品同步
        schedule_product_import();
        echo '<div class="updated"><p>产品导入已开始！</p></div>';
    }
?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>


        <?php wp_nonce_field('pw_dashboard_settings', 'pw_dashboard_nonce'); ?>

        <p>
            <input type="text" name="pw_token" id="pw_token" class="regular-text" placeholder="Enter API Token">
            <input type="button" name="pw_check" id="pw_check" class="button" value="Connect">
        </p>
        <div id="pw_loading" style="display:none;"><span class="spinner is-active"></span> Verifying...</div>
        <div id="pw_result"></div>

        <p>
            <label for="pw_currency">Currency</label>
            <select name="pw_currency" id="pw_currency">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CNY">CNY</option>
                <option value="JPY">JPY</option>
            </select>
        </p>

        <h1>Product Importer</h1>
        <form method="post" action="">
            <input type="submit" name="sync_products" class="button button-primary" value="Sync Products">
        </form>
        <div id="progress-bar-container">
            <div id="progress-bar"></div>
            <div id="progress-text">0/0</div>
        </div>
    </div>
    <style>
        #progress-bar-container {
            width: 100%;
            background-color: #f1f1f1;
            margin-top: 10px;
        }

        #progress-bar {
            width: 0;
            height: 30px;
            background-color: #4caf50;
            text-align: center;
            line-height: 30px;
            color: white;
        }

        #progress-text {
            text-align: center;
            margin-top: 5px;
        }
    </style>
    <script>
        jQuery(document).ready(function($) {
            function updateProgress() {
                $.post(ajaxurl, {
                    action: 'check_import_progress'
                }, function(response) {
                    var total = response.total;
                    var completed = response.completed;
                    var percentage = (completed / total) * 100;

                    $('#progress-bar').width(percentage + '%');
                    $('#progress-text').text(completed + '/' + total);

                    if (completed < total) {
                        setTimeout(updateProgress, 1000);
                    }
                });
            }

            $('#sync_products').on('click', function() {
                setTimeout(updateProgress, 1000);
            });

            // Token验证功能
            $('#pw_check').on('click', function() {
                var token = $('#pw_token').val().trim();
                if (!token) {
                    alert('请输入Token');
                    return;
                }

                $('#pw_loading').show();
                $('#pw_result').html('');

                $.ajax({
                    url: ajaxurl, // 使用WordPress AJAX接口
                    type: 'POST',
                    data: {
                        action: 'pw_proxy_api_request',
                        endpoint: 'auth/user-info',
                        token: token
                    },
                    success: function(response) {
                        $('#pw_loading').hide();
                        if (response.code === 200 && response.message === 'success' &&
                            response.data && response.data.user_id === 1 && response.data.team === "1") {
                            $('#pw_result').html('<div class="notice notice-success"><p>验证成功</p></div>');
                        } else {
                            $('#pw_result').html('<div class="notice notice-error"><p>验证失败: 无效的响应格式</p></div>');
                        }
                    },
                    error: function(xhr) {
                        $('#pw_loading').hide();
                        var errorMsg = xhr.responseJSON ? JSON.stringify(xhr.responseJSON) : '验证失败';
                        $('#pw_result').html('<div class="notice notice-error"><p>' + errorMsg + '</p></div>');
                    }
                });
            });
        });
    </script>
<?php
}


// 获取API数据
function get_products_from_api()
{
    $response = wp_remote_get('https://dev.promowares.com/api/v1/products', array(
        'headers' => array(
            'accept' => 'application/json',
            'Authorization' => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NDE4MTYxMjgsInRlYW0iOiIxIiwidXNlcl9pZCI6MX0.60D-NUbUBa_n3KXyNrhnoN964IjwIFJtGUVDCSnKYFM',
        ),
    ));

    if (is_wp_error($response)) {
        return false;
    }

    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);

    return $data['data']['list'];
}

// 调度产品导入任务
function schedule_product_import()
{
    $products = get_products_from_api();

    if (!empty($products)) {
        foreach ($products as $product) {
            // 为每个产品添加一个任务到 Action Scheduler
            as_schedule_single_action(time(), 'import_single_product', array($product));
        }
    }
}

// 处理单个产品导入
add_action('import_single_product', 'import_single_product');
function import_single_product($product)
{
    // 创建 WooCommerce 产品
    $post_id = wp_insert_post(array(
        'post_title' => $product['name'],
        'post_content' => $product['description'],
        'post_excerpt' => $product['short_description'],
        'post_status' => 'publish',
        'post_type' => 'product',
    ));

    if ($post_id) {
        // 设置产品元数据
        update_post_meta($post_id, '_price', $product['price']);
        update_post_meta($post_id, '_regular_price', $product['anchor_price']);
        update_post_meta($post_id, '_sku', $product['sku']);
        update_post_meta($post_id, 'pw_isSyncProduct', true);
    }
}

// 检查导入进度
add_action('wp_ajax_check_import_progress', 'check_import_progress');
function check_import_progress()
{
    // 获取所有待处理的任务数量
    $pending_actions = as_get_scheduled_actions(array(
        'status' => 'pending',
        'hook' => 'import_single_product',
        'per_page' => -1,
    ));

    // 获取已完成的任务数量
    $completed_actions = as_get_scheduled_actions(array(
        'status' => 'complete',
        'hook' => 'import_single_product',
        'per_page' => -1,
    ));

    $total = count($pending_actions) + count($completed_actions);
    $completed = count($completed_actions);

    wp_send_json(array(
        'total' => $total,
        'completed' => $completed,
    ));
}

function pw_check_smtp_configured()
{
    // 创建一个临时的PHPMailer实例来检查配置
    $phpmailer = new PHPMailer\PHPMailer\PHPMailer();

    // 应用WordPress的phpmailer_init钩子
    do_action_ref_array('phpmailer_init', array(&$phpmailer));

    // 检查是否启用了SMTP
    if ($phpmailer->isSMTP() && !empty($phpmailer->Host)) {
        return true;
    }

    return false;
}

// 二级菜单页面回调函数
function pw_submenu_page_callback()
{
    // 获取当前选项卡
    $current_tab = isset($_GET['tab']) ? sanitize_text_field($_GET['tab']) : 'dashboard';

    // 定义选项卡
    $tabs = array(
        'dashboard' => 'Dashboard',
        'settings' => 'Settings',
        'status' => 'Status',
        'product_request' => 'Product Requirement',
        'support' => 'Support'
    );

    // 页面开始
?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

        <nav class="nav-tab-wrapper wp-clearfix">
            <?php
            // 生成选项卡
            foreach ($tabs as $tab => $name) {
                $class = ($tab == $current_tab) ? 'nav-tab nav-tab-active' : 'nav-tab';
                echo '<a href="?page=pw-dashboard-settings&tab=' . esc_attr($tab) . '" class="' . esc_attr($class) . '">' . esc_html($name) . '</a>';
            }
            ?>
        </nav>

        <div class="tab-content">
            <?php
            // 根据当前选项卡显示内容
            switch ($current_tab) {
                case 'dashboard':
                    echo '<div class="tab-pane active">';
                    echo '<h2>Dashboard</h2>';

                    // 添加统计信息卡片
                    echo '<div class="pw-stats-container">';


                    // 获取今天的起始和结束时间字符串 (基于服务器/WordPress的本地时间)
                    $today_start_datetime_str = date('Y-m-d') . ' 00:00:00'; // 今天 00:00:00
                    $today_end_datetime_str   = date('Y-m-d') . ' 23:59:59'; // 今天 23:59:59
                    // 获取所有已注册的订单状态的 slugs
                    $all_order_statuses = array_keys(wc_get_order_statuses());
                    // 设置参数以获取今天创建的所有订单对象
                    $args_todays_orders = array(
                        'status'        => $all_order_statuses, // 包含所有状态的订单
                        'limit'         => -1,                   // 获取所有匹配的订单，不进行分页
                        'date_created'  => $today_start_datetime_str . '...' . $today_end_datetime_str, // 筛选创建日期为今天的订单
                        // 'return' => 'objects' 是 wc_get_orders() 的默认行为，会返回 WC_Order 对象数组
                    );
                    // 使用 wc_get_orders() 获取今天的订单对象数组
                    $todays_orders = wc_get_orders($args_todays_orders);
                    // 初始化计数器和金额变量
                    $todays_total_order_count = 0;
                    $todays_gross_total_amount = 0;
                    $todays_net_total_amount = 0;
                    if (! empty($todays_orders)) {
                        // 直接从获取到的订单对象数组中计算订单总数
                        $todays_total_order_count = count($todays_orders);
                        // 遍历今天的订单以计算总金额
                        foreach ($todays_orders as $order) {
                            // 确保 $order 是一个 WC_Order 对象
                            if (is_a($order, 'WC_Order')) {
                                $order_total = $order->get_total(); // 获取订单总金额 <sup data-citation="1"><a href="https://www.nuvei.com/zh/platforms/woocommerce?818a72c6_page=5&818a72f8_page=9" target="_blank" title="WooCommerce">1</a></sup><sup data-citation="3"><a href="https://m.amz123.com/ask/5lsrxacM" target="_blank" title="woocommerce商品頁面修改">3</a></sup>
                                $todays_gross_total_amount += $order_total;
                                $order_refunded_total = $order->get_total_refunded(); // 获取订单已退款总额 <sup data-citation="1"><a href="https://www.nuvei.com/zh/platforms/woocommerce?818a72c6_page=5&818a72f8_page=9" target="_blank" title="WooCommerce">1</a></sup>
                                $todays_net_total_amount += ($order_total - $order_refunded_total);
                            }
                        }
                    }


                    // 今日订单统计
                    echo '<div class="pw-stat-card">';
                    echo '<div class="pw-stat-value">' . wc_price($todays_gross_total_amount) . '</div>';
                    echo '<div class="pw-stat-label">' . $todays_total_order_count . ' ORDERS today</div>';
                    echo '<div class="pw-stat-icon"><span class="dashicons dashicons-chart-bar"></span></div>';
                    echo '</div>';


                    // 最近7天订单统计
                    $end_date_str   = date('Y-m-d') . ' 23:59:59';                        // 今天的结束时间
                    $start_date_str = date('Y-m-d', strtotime('-6 days')) . ' 00:00:00'; // 6天前的00:00:00，以包含完整的7天
                    // 获取所有已注册的订单状态的 slugs
                    $all_order_statuses = array_keys(wc_get_order_statuses());
                    // 设置参数以获取过去7天内创建的所有订单对象
                    $args_last_7_days_orders = array(
                        'status'        => $all_order_statuses, // 包含所有状态的订单
                        'limit'         => -1,                   // 获取所有匹配的订单，不进行分页
                        'date_created'  => $start_date_str . '...' . $end_date_str, // 筛选创建日期为过去7天的订单
                        // 'return' => 'objects' 是 wc_get_orders() 的默认行为，会返回 WC_Order 对象数组
                    );
                    // 使用 wc_get_orders() 获取过去7天的订单对象数组
                    $last_7_days_orders = wc_get_orders($args_last_7_days_orders);
                    // 初始化计数器和金额变量
                    $last_7_days_total_order_count = 0;
                    $last_7_days_gross_total_amount = 0;
                    $last_7_days_net_total_amount = 0;
                    if (! empty($last_7_days_orders)) {
                        // 直接从获取到的订单对象数组中计算订单总数
                        $last_7_days_total_order_count = count($last_7_days_orders);
                        // 遍历过去7天的订单以计算总金额
                        foreach ($last_7_days_orders as $order) {
                            // 确保 $order 是一个 WC_Order 对象
                            if (is_a($order, 'WC_Order')) {
                                $order_total = $order->get_total(); // 获取订单总金额 <sup data-citation="1"><a href="https://int.balmain.com/en/search/show?q=INDEXER" target="_blank" title="Search results for INDEXER | BALMAIN">1</a></sup><sup data-citation="3"><a href="https://blog.csdn.net/weixin_36455001/article/details/116253618" target="_blank" title="php 统计每日订单数,laravel 统计每日订单-CSDN博客">3</a></sup>
                                $last_7_days_gross_total_amount += $order_total;
                                $order_refunded_total = $order->get_total_refunded(); // 获取订单已退款总额 <sup data-citation="1"><a href="https://int.balmain.com/en/search/show?q=INDEXER" target="_blank" title="Search results for INDEXER | BALMAIN">1</a></sup>
                                $last_7_days_net_total_amount += ($order_total - $order_refunded_total);
                            }
                        }
                    }

                    echo '<div class="pw-stat-card">';
                    echo '<div class="pw-stat-value">' . wc_price($last_7_days_gross_total_amount) . '</div>';
                    echo '<div class="pw-stat-label">' . $last_7_days_total_order_count . ' ORDERS last 7 days</div>';
                    echo '<div class="pw-stat-icon"><span class="dashicons dashicons-calendar-alt"></span></div>';
                    echo '</div>';

                    // 所有订单统计
                    $all_order_statuses = array_keys(wc_get_order_statuses());
                    // 设置参数以获取所有订单的ID
                    $args = array(
                        'status' => $all_order_statuses, // 指定所有订单状态
                        'limit'  => -1,                   // -1 表示获取所有匹配的订单，不进行分页
                        'return' => 'ids',                // 仅返回订单ID，效率更高
                    );
                    // 使用 wc_get_orders() 获取订单ID数组
                    $order_ids = wc_get_orders($args);
                    // 计算订单总数
                    $total_orders_count = count($order_ids);

                    // 获取所有已注册的订单状态的 slugs
                    $all_order_statuses = array_keys(wc_get_order_statuses());
                    // 设置参数以获取所有订单对象
                    $args = array(
                        'status' => $all_order_statuses, // 指定所有订单状态
                        'limit'  => -1,                   // -1 表示获取所有匹配的订单
                        // 'return' => 'objects' 是 wc_get_orders() 的默认行为，会返回 WC_Order 对象数组
                    );
                    // 使用 wc_get_orders() 获取订单对象数组
                    $all_orders = wc_get_orders($args);
                    $gross_total_amount = 0;
                    if (! empty($all_orders)) {
                        foreach ($all_orders as $order) {
                            // 确保 $order 是一个 WC_Order 对象
                            if (is_a($order, 'WC_Order')) {
                                $gross_total_amount += $order->get_total(); // 获取订单总金额 <sup data-citation="1"><a href="https://www.wpzhiku.com/wc-get-orders/" target="_blank" title="WooCommerce 中的wc_get_orders() 函数">1</a></sup><sup data-citation="3"><a href="https://www.wpzhiku.com/woocommerce-order-lei-de-suo/" target="_blank" title="WooCommerce Order 类的所有Get方法，以面向对象的 ...">3</a></sup>
                            }
                        }
                    }

                    echo '<div class="pw-stat-card">';
                    echo '<div class="pw-stat-value">' . wc_price($gross_total_amount) . '</div>';
                    echo '<div class="pw-stat-label">' . $total_orders_count . ' ORDERS</div>';
                    echo '<div class="pw-stat-icon"><span class="dashicons dashicons-chart-line"></span></div>';
                    echo '</div>';

                    echo '</div>';

                    // 添加快捷导航图标
                    echo '<div class="pw-quick-nav">';

                    // 订单图标
                    echo '<div class="pw-nav-item">';
                    echo '<a href="#">';
                    echo '<div class="pw-nav-icon"><span class="dashicons dashicons-cart"></span></div>';
                    echo '<div class="pw-nav-label">Orders</div>';
                    echo '</a>';
                    echo '</div>';

                    // 商店图标
                    echo '<div class="pw-nav-item">';
                    echo '<a href="#">';
                    echo '<div class="pw-nav-icon"><span class="dashicons dashicons-store"></span></div>';
                    echo '<div class="pw-nav-label">Stores</div>';
                    echo '</a>';
                    echo '</div>';

                    // 产品图标
                    echo '<div class="pw-nav-item">';
                    echo '<a href="#">';
                    echo '<div class="pw-nav-icon"><span class="dashicons dashicons-products"></span></div>';
                    echo '<div class="pw-nav-label">Products</div>';
                    echo '</a>';
                    echo '</div>';

                    // 账单图标
                    echo '<div class="pw-nav-item">';
                    echo '<a href="#">';
                    echo '<div class="pw-nav-icon"><span class="dashicons dashicons-money-alt"></span></div>';
                    echo '<div class="pw-nav-label">Billing</div>';
                    echo '</a>';
                    echo '</div>';

                    // 设计图标
                    echo '<div class="pw-nav-item">';
                    echo '<a href="#">';
                    echo '<div class="pw-nav-icon"><span class="dashicons dashicons-art"></span></div>';
                    echo '<div class="pw-nav-label">Designs</div>';
                    echo '</a>';
                    echo '</div>';

                    echo '</div>';

                    // 添加样式
                    echo '<style>
                        .pw-stats-container {
                            display: flex;
                            justify-content: space-between;
                            margin-bottom: 30px;
                            flex-wrap: wrap;
                        }
                        .pw-stat-card {
                            background: #fff;
                            border-radius: 8px;
                            padding: 20px;
                            width: 30%;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                            position: relative;
                            min-width: 200px;
                            margin-bottom: 15px;
                        }
                        .pw-stat-value {
                            font-size: 28px;
                            font-weight: bold;
                            margin-bottom: 5px;
                        }
                        .pw-stat-label {
                            color: #777;
                            font-size: 14px;
                        }
                        .pw-stat-icon {
                            position: absolute;
                            right: 20px;
                            top: 20px;
                            background: #f5f5f5;
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        .pw-stat-icon .dashicons {
                            font-size: 20px;
                            width: 20px;
                            height: 20px;
                            color: #555;
                        }
                        
                        .pw-quick-nav {
                            display: flex;
                            justify-content: space-between;
                            margin-top: 20px;
                            flex-wrap: wrap;
                        }
                        .pw-nav-item {
                            background: #fff;
                            border-radius: 8px;
                            padding: 15px;
                            width: 18%;
                            min-width: 120px;
                            text-align: center;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                            cursor: pointer;
                            transition: all 0.3s ease;
                            margin-bottom: 15px;
                        }
                        .pw-nav-item:hover {
                            transform: translateY(-5px);
                            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                        }
                        .pw-nav-icon {
                            margin-bottom: 10px;
                        }
                        .pw-nav-icon .dashicons {
                            font-size: 30px;
                            width: 30px;
                            height: 30px;
                            color: #555;
                        }
                        .pw-nav-label {
                            font-weight: 500;
                        }
                        
                        @media (max-width: 782px) {
                            .pw-stat-card, .pw-nav-item {
                                width: 100%;
                            }
                        }
                    </style>';

                    echo '</div>';
                    break;
                case 'settings':
                    echo '<div class="tab-pane">';
                    echo '<h2>Settings</h2>';

                    // 处理表单提交
                    if (isset($_POST['pw_save_settings']) && check_admin_referer('pw_settings_nonce', 'pw_settings_nonce_field')) {
                        // 保存设置
                        $disable_ssl = isset($_POST['pw_disable_ssl']) ? 1 : 0;
                        $api_key = sanitize_text_field($_POST['pw_api_key']);
                        $api_secret = sanitize_text_field($_POST['pw_api_secret']);
                        $customize_text = sanitize_text_field($_POST['pw_customize_text']);
                        $customize_color = sanitize_hex_color($_POST['pw_customize_color']);

                        update_option('pw_disable_ssl', $disable_ssl);
                        update_option('pw_api_key', $api_key);
                        update_option('pw_api_secret', $api_secret);
                        update_option('pw_customize_text', $customize_text);
                        update_option('pw_customize_color', $customize_color);

                        echo '<div class="notice notice-success is-dismissible"><p>设置已保存。</p></div>';
                    }

                    // 获取当前设置值
                    $disable_ssl = get_option('pw_disable_ssl', 0);
                    $api_key = get_option('pw_api_key', '');
                    $api_secret = get_option('pw_api_secret', '');
                    $customize_text = get_option('pw_customize_text', 'Customize');
                    $customize_color = get_option('pw_customize_color', '#000000');

                    // 设置表单
            ?>
                    <form method="post" action="">
                        <?php wp_nonce_field('pw_settings_nonce', 'pw_settings_nonce_field'); ?>

                        <h3>集成设置</h3>
                        <table class="form-table">
                            <tr>
                                <th scope="row">重新连接您的商店</th>
                                <td>
                                    <input type="button" class="button" value="重新连接" id="pw-reconnect-button">
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">禁用SSL</th>
                                <td>
                                    <label>
                                        <input type="checkbox" name="pw_disable_ssl" value="1" <?php checked(1, $disable_ssl); ?>>
                                        使用HTTP而不是HTTPS连接到我们的API（如果插件在某些主机配置下不工作，可能需要此选项）
                                    </label>
                                </td>
                            </tr>
                        </table>

                        <h3>查询表单</h3>
                        <table class="form-table">
                            <tr>
                                <th scope="row">API集成信息</th>
                                <td>
                                    <input type="text" name="pw_api_key" value="<?php echo esc_attr($api_key); ?>" class="regular-text">
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">API集成信息</th>
                                <td>
                                    <input type="text" name="pw_api_secret" value="<?php echo esc_attr($api_secret); ?>" class="regular-text">
                                </td>
                            </tr>
                        </table>

                        <h3>产品个性化设置</h3>
                        <table class="form-table">
                            <tr>
                                <th scope="row">自定义按钮文本</th>
                                <td>
                                    <input type="text" name="pw_customize_text" value="<?php echo esc_attr($customize_text); ?>" class="regular-text">
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">自定义按钮颜色</th>
                                <td>
                                    <input type="color" name="pw_customize_color" value="<?php echo esc_attr($customize_color); ?>" class="pw-color-picker">
                                    <button type="button" class="button button-secondary wp-color-result" aria-expanded="false" style="background-color: <?php echo esc_attr($customize_color); ?>">
                                        <span class="wp-color-result-text">选择颜色</span>
                                    </button>
                                </td>
                            </tr>
                        </table>

                        <p class="submit">
                            <input type="submit" name="pw_save_settings" class="button button-primary" value="保存设置">
                        </p>
                    </form>

                    <script>
                        jQuery(document).ready(function($) {
                            // 颜色选择器
                            $('.pw-color-picker').wpColorPicker();

                            // 重新连接按钮
                            $('#pw-reconnect-button').click(function() {
                                // 这里添加重新连接的AJAX逻辑
                                alert('重新连接功能将在此处实现');
                            });
                        });
                    </script>
            <?php

                    echo '</div>';
                    break;
                case 'status':
                    echo '<div class="tab-pane">';
                    echo '<h2>状态检查</h2>';

                    // 创建状态检查表格
                    echo '<table class="pw-status-table">';
                    echo '<thead><tr><th>检查项</th><th>描述</th><th>状态</th></tr></thead>';
                    echo '<tbody>';

                    // 检查WooCommerce是否安装
                    $woo_installed = pw_check_woocommerce_active();
                    echo '<tr>';
                    echo '<td>WooCommerce 安装</td>';
                    echo '<td>检查 WooCommerce 是否已安装并激活</td>';
                    echo '<td class="status-' . ($woo_installed ? 'ok' : 'fail') . '">' . ($woo_installed ? 'OK' : '未安装') . '</td>';
                    echo '</tr>';

                    // 检查WooCommerce版本
                    if ($woo_installed) {
                        $woo_version = WC()->version;
                        $woo_min_version = '7.0.0'; // 设置最低要求版本
                        $woo_version_ok = version_compare($woo_version, $woo_min_version, '>=');

                        echo '<tr>';
                        echo '<td>WooCommerce 版本</td>';
                        echo '<td>当前版本: ' . $woo_version . ' (最低要求: ' . $woo_min_version . ')</td>';
                        echo '<td class="status-' . ($woo_version_ok ? 'ok' : 'fail') . '">' . ($woo_version_ok ? 'OK' : '需要更新') . '</td>';
                        echo '</tr>';
                    }

                    // 检查WordPress版本
                    global $wp_version;
                    $wp_min_version = '6.0'; // 设置最低要求版本
                    $wp_version_ok = version_compare($wp_version, $wp_min_version, '>=');

                    echo '<tr>';
                    echo '<td>WordPress 版本</td>';
                    echo '<td>当前版本: ' . $wp_version . ' (最低要求: ' . $wp_min_version . ')</td>';
                    echo '<td class="status-' . ($wp_version_ok ? 'ok' : 'fail') . '">' . ($wp_version_ok ? 'OK' : '需要更新') . '</td>';
                    echo '</tr>';

                    // 检查PHP版本
                    $php_version = phpversion();
                    $php_min_version = '7.4'; // 设置最低要求版本
                    $php_version_ok = version_compare($php_version, $php_min_version, '>=');

                    echo '<tr>';
                    echo '<td>PHP 版本</td>';
                    echo '<td>当前版本: ' . $php_version . ' (最低要求: ' . $php_min_version . ')</td>';
                    echo '<td class="status-' . ($php_version_ok ? 'ok' : 'fail') . '">' . ($php_version_ok ? 'OK' : '需要更新') . '</td>';
                    echo '</tr>';

                    // 检查 SMTP 是否配置
                    $smtp_configured = pw_check_smtp_configured();

                    echo '<tr>';
                    echo '<td>SMTP 配置</td>';
                    echo '<td>检查是否已配置SMTP</td>';
                    echo '<td class="status-' . ($smtp_configured ? 'ok' : 'fail') . '">' . ($smtp_configured ? 'OK' : '未配置') . '</td>';
                    echo '</tr>';


                    echo '</tbody>';
                    echo '</table>';

                    // 添加状态表格样式
                    echo '<style>
                        .pw-status-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 20px;
                        }
                        .pw-status-table th, .pw-status-table td {
                            padding: 12px 15px;
                            border: 1px solid #ddd;
                        }
                        .pw-status-table th {
                            background-color: #f5f5f5;
                            font-weight: bold;
                            text-align: left;
                        }
                        .pw-status-table tr:nth-child(even) {
                            background-color: #f9f9f9;
                        }
                        .status-ok {
                            color: #2ecc71;
                            font-weight: bold;
                        }
                        .status-fail {
                            color: #e74c3c;
                            font-weight: bold;
                        }
                        .status-warning {
                            color: #f39c12;
                            font-weight: bold;
                        }
                    </style>';

                    echo '</div>';
                    break;
                case 'product_request':
                    echo '<div class="tab-pane">';
                    echo '<h2>产品需求</h2>';

                    // 产品需求表单
                    echo '<div class="pw-product-request-form">';
                    echo '<p class="pw-form-intro">我们对新产品充满热情，并珍视您提供的每一条建议。如果您发现了有趣的产品，请告诉我们！</p>';

                    echo '<form method="post" action="" enctype="multipart/form-data">';
                    wp_nonce_field('pw_product_request', 'pw_product_request_nonce');

                    echo '<p class="pw-form-instruction">只需填写任意一个字段</p>';

                    // 描述字段
                    echo '<div class="pw-form-field">';
                    echo '<label for="pw_product_description">描述</label>';
                    echo '<textarea id="pw_product_description" name="pw_product_description" rows="4"></textarea>';
                    echo '</div>';

                    // 产品链接字段
                    echo '<div class="pw-form-field">';
                    echo '<label for="pw_product_link">产品链接</label>';
                    echo '<input type="url" id="pw_product_link" name="pw_product_link">';
                    echo '</div>';

                    // 图片上传字段
                    echo '<div class="pw-form-field">';
                    echo '<label for="pw_product_image">图片</label>';
                    echo '<div class="pw-image-upload-container">';
                    echo '<input type="file" id="pw_product_image" name="pw_product_image" accept="image/*" style="display:none;">';
                    echo '<div class="pw-image-upload-box" onclick="document.getElementById(\'pw_product_image\').click();">';
                    echo '<span class="dashicons dashicons-plus"></span>';
                    echo '</div>';
                    echo '<div id="pw_image_preview" class="pw-image-preview"></div>';
                    echo '</div>';
                    echo '</div>';
                    // 提交按钮
                    echo '<div class="pw-form-submit">';
                    // echo '<input type="submit" name="pw_submit_product_request" class="button pw-support-button" value="Submit">';
                    echo '<a href="#" class="button pw-support-button">Submit</a>';

                    echo '</div>';

                    echo '</form>';
                    echo '</div>';

                    // 添加必要的JavaScript
                    echo '<script>
                        jQuery(document).ready(function($) {
                            $("#pw_product_image").change(function() {
                                var file = this.files[0];
                                if (file) {
                                    var reader = new FileReader();
                                    reader.onload = function(e) {
                                        $("#pw_image_preview").html("<img src=\'" + e.target.result + "\' alt=\'预览图片\' />");
                                    }
                                    reader.readAsDataURL(file);
                                }
                            });
                        });
                    </script>';

                    // 添加样式
                    echo '<style>
                        .pw-product-request-form {
                            max-width: 800px;
                            margin: 20px auto;
                            background: #fff;
                            border-radius: 8px;
                            padding: 25px;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                        }
                        .pw-form-intro {
                            text-align: center;
                            margin-bottom: 30px;
                            color: #666;
                            font-size: 15px;
                        }
                        .pw-form-instruction {
                            text-align: center;
                            font-weight: bold;
                            margin-bottom: 25px;
                            color: #555;
                        }
                        .pw-form-field {
                            margin-bottom: 20px;
                            display: flex;
                            align-items: flex-start;
                        }
                        .pw-form-field label {
                            width: 120px;
                            padding-top: 8px;
                            font-weight: 500;
                            color: #444;
                        }
                        .pw-form-field textarea,
                        .pw-form-field input[type="url"] {
                            flex: 1;
                            padding: 10px;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                            width: 100%;
                            background-color: #f9f9f9;
                            transition: all 0.3s ease;
                        }
                        .pw-form-field textarea:focus,
                        .pw-form-field input[type="url"]:focus {
                            border-color: #aaa;
                            background-color: #fff;
                            box-shadow: 0 0 5px rgba(0,0,0,0.1);
                            outline: none;
                        }
                        .pw-image-upload-container {
                            flex: 1;
                        }
                        .pw-image-upload-box {
                            border: 2px dashed #ddd;
                            border-radius: 4px;
                            width: 100%;
                            height: 120px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                            background-color: #f9f9f9;
                            transition: all 0.3s ease;
                        }
                        .pw-image-upload-box:hover {
                            border-color: #aaa;
                            background-color: #f5f5f5;
                        }
                        .pw-image-upload-box .dashicons {
                            font-size: 35px;
                            color: #aaa;
                            transition: all 0.3s ease;
                        }
                        .pw-image-upload-box:hover .dashicons {
                            color: #777;
                        }
                        .pw-image-preview {
                            margin-top: 15px;
                            text-align: center;
                        }
                        .pw-image-preview img {
                            max-width: 100%;
                            max-height: 180px;
                            border-radius: 4px;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                        }
                        .pw-form-submit {
                            text-align: center;
                            margin-top: 30px;
                        }
                       
                        @media (max-width: 782px) {
                            .pw-form-field {
                                flex-direction: column;
                            }
                            .pw-form-field label {
                                width: 100%;
                                margin-bottom: 8px;
                            }
                        }
                    </style>';

                    echo '</div>';
                    break;
                case 'support':
                    echo '<div class="tab-pane">';
                    echo '<h2>Support</h2>';

                    // 添加三个支持卡片
                    echo '<div class="pw-support-cards">';

                    // 第一个卡片 - 需要帮助
                    echo '<div class="pw-support-card">';
                    echo '<h3>需要帮助？联系我们！</h3>';
                    echo '<p>有任何问题或需要支持，请随时联系我们。我们的团队随时准备为您提供帮助。</p>';
                    echo '<a href="#" class="button pw-support-button">联系支持</a>';
                    echo '</div>';

                    // 第二个卡片 - 阅读常见问题
                    echo '<div class="pw-support-card">';
                    echo '<h3>阅读我们的常见问题</h3>';
                    echo '<p>查看我们的常见问题解答，了解关于产品、功能和使用方法的常见问题及解答。</p>';
                    echo '<a href="#" class="button pw-support-button">查看常见问题</a>';
                    echo '</div>';

                    // 第三个卡片 - 集成帮助
                    echo '<div class="pw-support-card">';
                    echo '<h3>集成帮助</h3>';
                    echo '<p>需要帮助集成我们的产品？查看我们的集成指南，或联系我们的技术支持团队获取帮助。</p>';
                    echo '<a href="#" class="button pw-support-button">查看集成指南</a>';
                    echo '</div>';

                    echo '</div>';

                    // 添加支持卡片的样式
                    echo '<style>
                        .pw-support-cards {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 20px;
                            margin-top: 20px;
                        }
                        .pw-support-card {
                            background: #fff;
                            border: 1px solid #ddd;
                            border-radius: 5px;
                            padding: 20px;
                            width: calc(33.33% - 14px);
                            box-sizing: border-box;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                        }
                        .pw-support-card h3 {
                            margin-top: 0;
                        }
                        .pw-support-button {
                            background-color: #f7a738;
                            border-color: #f7a738;
                            color: #fff;
                            text-align: center;
                            margin-top: 10px;
                        }
                        .pw-support-button:hover {
                            background-color: #e59826;
                            border-color: #e59826;
                            color: #fff;
                        }
                        @media (max-width: 782px) {
                            .pw-support-card {
                                width: 100%;
                            }
                        }
                    </style>';

                    echo '</div>';
                    break;
            }
            ?>
        </div>
    </div>
<?php
}

// 子菜单一页面回调函数
function pw_submenu_design_library()
{
?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
        <p>这是子菜单一的内容。</p>
    </div>
<?php
}

// 子菜单二页面回调函数
function pw_submenu_designs()
{
?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
        <p>这是子菜单二的内容。</p>
    </div>
<?php
}

// 子菜单三页面回调函数
function pw_submenu_tags()
{
?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
        <p>这是子菜单三的内容。</p>
    </div>
<?php
}

/**
 * Render the design management page.
 * This function will display the custom design management interface.
 * Based on the provided image, it includes search, filter, and management buttons.
 *
 * @since 1.0.0
 */
function pw_manage_designs_page() {
    // Check user capabilities
    if ( ! current_user_can( 'edit_posts' ) ) { // Assuming 'edit_posts' is sufficient for now
        wp_die( __( 'You do not have sufficient permissions to access this page.' ) );
    }

    // Include the partial file for the display
    require_once plugin_dir_path( dirname( __FILE__ ) ) . 'admin/partials/pw-admin-design-management-display.php';
}


// 去掉后台产品列表中产品的 移至回收站 按钮
function remove_trash_button_from_product_list($actions, $post)
{
    if ($post->post_type == 'product') {
        // 检查是否为同步产品
        $pw_isSyncProduct = get_post_meta($post->ID, 'pw_isSyncProduct', true);
        if ($pw_isSyncProduct == '1') {
            unset($actions['trash']);
        }
    }
    return $actions;
}
add_filter('post_row_actions', 'remove_trash_button_from_product_list', 10, 2);

// 彻底移除WooCommerce产品复制功能和按钮（超级管理员除外）
function completely_remove_product_duplicate()
{
    // 检查当前用户是否为超级管理员11111111
    if (!current_user_can('manage_options')) {
        // 移除行内按钮
        add_filter('post_row_actions', 'remove_duplicate_product_button', 10, 2);

        // 移除批量操作中的复制选项
        add_filter('bulk_actions-edit-product', 'remove_duplicate_bulk_action');

        // 移除复制产品功能
        remove_action('admin_action_duplicate_product', array('WC_Admin_Duplicate_Product', 'duplicate_product_action'));
    }
}
add_action('admin_init', 'completely_remove_product_duplicate');

// 移除产品列表行操作中的复制按钮
function remove_duplicate_product_button($actions, $post)
{
    if ($post->post_type == 'product') {
        // 检查是否为同步产品
        $pw_isSyncProduct = get_post_meta($post->ID, 'pw_isSyncProduct', true);
        if ($pw_isSyncProduct == '1') {
            unset($actions['duplicate']);
        }
    }
    return $actions;
}

// 移除批量操作中的复制选项
function remove_duplicate_bulk_action($actions)
{
    // 由于批量操作无法判断单个产品,暂时保留复制功能
    return $actions;
}



add_action('manage_product_posts_custom_column', 'custom_product_column_content', 10, 2);
function custom_product_column_content($column, $product_id)
{
    if ($column == 'name') {
        $title = get_the_title($product_id);
        $pw_isSyncProduct = get_post_meta($product_id, 'pw_isSyncProduct', true);
        if ($pw_isSyncProduct == '1') {
            $custom_html = '<span style="background-color: #000; color: #fff; padding: 2px 4px; border-radius: 2px; font-size: 10px; font-weight: bold; display: inline-block;">SYNC</span>
 ';
            echo $custom_html; // 拼接原标题与自定义HTML
        }
    }
}


// 保存自定义数据到订单
function add_custom_data_to_order_items($item, $cart_item_key, $values, $order)
{
    if (isset($values['custom_data'])) {
        $item->add_meta_data('_custom_image', $values['custom_data']['custom_image']);
        $item->add_meta_data('_custom_color', $values['custom_data']['color']);

        // 添加可见的元数据
        $item->add_meta_data('定制设计', '<img src="' . esc_url($values['custom_data']['custom_image']) . '" style="max-width:100px; height:auto;">', true);
        $item->add_meta_data('颜色', $values['custom_data']['color'], true);
    }
}
add_action('woocommerce_checkout_create_order_line_item', 'add_custom_data_to_order_items', 10, 4);

// 给 后台订单中 每一项 添加一个按钮
function add_custom_button_to_order_items($item_id, $item, $order)
{
    // 检查是否有自定义图片
    $custom_image = wc_get_order_item_meta($item_id, '_custom_image', true);
    $custom_color = wc_get_order_item_meta($item_id, '_custom_color', true);
    $product_name = $item->get_name();
    $product_id = $item->get_product_id();

    if (!empty($custom_image)) {
        // 添加生成PDF按钮
        echo '<div class="generate-pdf-button" style="margin-top: 10px;">
            <button type="button" class="button generate-pdf" 
                data-item-id="' . esc_attr($item_id) . '" 
                data-order-id="' . esc_attr($order->get_id()) . '"
                data-product-name="' . esc_attr($product_name) . '"
                data-product-id="' . esc_attr($product_id) . '"
                data-custom-image="' . esc_attr($custom_image) . '"
                data-custom-color="' . esc_attr($custom_color) . '">
                生成印刷文件PDF</button>
            <span class="spinner" style="float:none;"></span>
        </div>';
    }
}
add_action('woocommerce_after_order_itemmeta', 'add_custom_button_to_order_items', 10, 3);

// 处理AJAX请求生成PDF
function handle_generate_production_pdf()
{
    // 验证nonce
    if (!isset($_POST['security']) || !wp_verify_nonce($_POST['security'], 'generate-pdf-nonce')) {
        wp_send_json_error('安全验证失败');
        return;
    }

    // 获取订单项ID和订单ID
    $item_id = isset($_POST['item_id']) ? intval($_POST['item_id']) : 0;
    $order_id = isset($_POST['order_id']) ? intval($_POST['order_id']) : 0;

    if (!$item_id || !$order_id) {
        wp_send_json_error('参数无效');
        return;
    }

    // 获取订单和订单项
    $order = wc_get_order($order_id);
    if (!$order) {
        wp_send_json_error('订单不存在');
        return;
    }

    // 获取自定义图片URL
    $custom_image = wc_get_order_item_meta($item_id, '_custom_image', true);
    $custom_color = wc_get_order_item_meta($item_id, '_custom_color', true);

    if (empty($custom_image)) {
        wp_send_json_error('没有找到自定义图片');
        return;
    }

    // 获取订单项信息
    $items = $order->get_items();
    $product_name = '';
    $product_id = 0;

    foreach ($items as $item_key => $item) {
        if ($item_key == $item_id) {
            $product_name = $item->get_name();
            $product_id = $item->get_product_id();
            break;
        }
    }

    // 生成PDF
    $pdf_file = generate_production_pdf($order, $item_id, $product_name, $product_id, $custom_image, $custom_color);

    if ($pdf_file) {
        wp_send_json_success(array(
            'pdf_url' => $pdf_file['url']
        ));
    } else {
        wp_send_json_error('生成PDF失败');
    }
}
add_action('wp_ajax_generate_production_pdf', 'handle_generate_production_pdf');

// 生成生产单PDF
function generate_production_pdf($order, $item_id, $product_name, $product_id, $custom_image, $custom_color)
{
    // 创建 PDF 对象
    $pdf = new jsPDF();

    // 设置文档信息
    $pdf->setProperties(array(
        'title' => '生产单 - 订单 #' . $order->get_order_number(),
        'subject' => '生产单',
        'author' => 'PW System',
        'creator' => 'PW Admin'
    ));

    // 设置字体
    $pdf->setFont('stsongstdlight', '', 10);

    // 添加标题
    $pdf->setFontSize(16);
    $pdf->text('生产单 - 订单 #' . $order->get_order_number(), 105, 20, array('align' => 'center'));
    $pdf->setFontSize(10);

    // 添加订单信息
    $pdf->text('订单日期: ' . $order->get_date_created()->date('Y-m-d H:i:s'), 20, 40);
    $pdf->text('客户名称: ' . $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(), 20, 50);
    $pdf->text('联系电话: ' . $order->get_billing_phone(), 20, 60);

    // 添加产品信息
    $pdf->setFontSize(12);
    $pdf->text('产品信息', 20, 80);
    $pdf->setFontSize(10);
    $pdf->text('产品名称: ' . $product_name, 20, 90);
    $pdf->text('产品ID: ' . $product_id, 20, 100);
    $pdf->text('颜色: ' . $custom_color, 20, 110);

    // 添加自定义图片
    if (filter_var($custom_image, FILTER_VALIDATE_URL)) {
        $pdf->setFontSize(12);
        $pdf->text('定制设计', 20, 130);

        // 获取图片并添加到 PDF
        $image_data = file_get_contents($custom_image);
        if ($image_data !== false) {
            // 创建临时文件
            $temp_file = tempnam(sys_get_temp_dir(), 'pdf_img');
            file_put_contents($temp_file, $image_data);

            // 添加图片到 PDF
            $pdf->addImage($temp_file, 'JPEG', 20, 140, 100, 0);

            // 删除临时文件
            unlink($temp_file);
        }
    }

    // 生成 PDF 文件
    $upload_dir = wp_upload_dir();
    $pdf_dir = $upload_dir['basedir'] . '/production-pdfs';

    // 确保目录存在
    if (!file_exists($pdf_dir)) {
        wp_mkdir_p($pdf_dir);
    }

    // 生成唯一文件名
    $filename = 'production-order-' . $order->get_order_number() . '-item-' . $item_id . '-' . time() . '.pdf';
    $file_path = $pdf_dir . '/' . $filename;

    // 保存 PDF
    $pdf->save($file_path);

    // 返回 PDF 文件信息
    return array(
        'path' => $file_path,
        'url' => $upload_dir['baseurl'] . '/production-pdfs/' . $filename
    );
}

add_action('wp_ajax_pw_proxy_api_request', function () {
    $endpoint = sanitize_text_field($_POST['endpoint']);
    $token = sanitize_text_field($_POST['token']);

    $response = wp_remote_get('https://dev.promowares.com/api/v1/' . $endpoint, [
        'headers' => [
            'Accept' => 'application/json',
            'Authorization' => $token
        ],
        'timeout' => 30
    ]);

    if (is_wp_error($response)) {
        wp_send_json_error($response->get_error_message());
    } else {
        wp_send_json(json_decode(wp_remote_retrieve_body($response), true));
    }
});

// AJAX handler for getting design tags
add_action('wp_ajax_pw_get_design_tags', 'pw_get_design_tags');
function pw_get_design_tags() {
    check_ajax_referer('pw_get_design_tags_nonce', 'nonce');

    if ( ! isset( $_POST['design_id'] ) || ! current_user_can( 'edit_post', (int) $_POST['design_id'] ) ) {
        wp_send_json_error( 'Invalid request or permissions.' );
    }

    $design_id = (int) $_POST['design_id'];

    // Get all available tags
    $all_tags_terms = get_terms( array(
        'taxonomy'   => 'pw_design_tag',
        'hide_empty' => false,
    ) );

    if ( is_wp_error( $all_tags_terms ) ) {
        wp_send_json_error( 'Could not retrieve tags.' );
    }

    // Get tags for the current design
    $selected_tags_terms = wp_get_post_terms( $design_id, 'pw_design_tag', array( 'fields' => 'ids' ) );

    if ( is_wp_error( $selected_tags_terms ) ) {
        wp_send_json_error( 'Could not retrieve selected tags for the design.' );
    }

    wp_send_json_success( array(
        'all_tags'      => $all_tags_terms,
        'selected_tags' => $selected_tags_terms,
    ) );
}

// AJAX handler for saving design tags
add_action('wp_ajax_pw_save_design_tags', 'pw_save_design_tags');
function pw_save_design_tags() {
    check_ajax_referer('pw_save_design_tags_nonce', 'nonce');

    if ( ! isset( $_POST['design_id'] ) || ! isset( $_POST['tags'] ) || ! current_user_can( 'edit_post', (int) $_POST['design_id'] ) ) {
        wp_send_json_error( 'Invalid request or permissions.' );
    }

    $design_id = (int) $_POST['design_id'];
    $tags = is_array( $_POST['tags'] ) ? array_map( 'intval', $_POST['tags'] ) : array();

    $result = wp_set_post_terms( $design_id, $tags, 'pw_design_tag', false );

    if ( is_wp_error( $result ) ) {
        wp_send_json_error( $result->get_error_message() );
    } else {
        wp_send_json_success( 'Tags updated successfully.' );
    }
}

// AJAX handler for deleting selected designs
add_action('wp_ajax_pw_delete_selected_designs', 'pw_delete_selected_designs');
function pw_delete_selected_designs() {
    check_ajax_referer('pw_delete_designs_nonce', 'nonce');

    if ( ! isset( $_POST['design_ids'] ) || ! is_array( $_POST['design_ids'] ) || ! current_user_can( 'delete_posts' ) ) {
        wp_send_json_error( 'Invalid request or permissions.' );
    }

    $design_ids = array_map( 'intval', $_POST['design_ids'] );
    $deleted_count = 0;
    $error_count = 0;

    foreach ( $design_ids as $design_id ) {
        if ( current_user_can( 'delete_post', $design_id ) ) {
            $result = wp_delete_post( $design_id, true ); // true to force delete, false to move to trash
            if ($result) {
                $deleted_count++;
            } else {
                $error_count++;
            }
        } else {
            $error_count++;
        }
    }

    if ( $deleted_count > 0 && $error_count === 0 ) {
        wp_send_json_success( "$deleted_count designs deleted successfully." );
    } elseif ( $deleted_count > 0 && $error_count > 0 ) {
        wp_send_json_error( "Deleted $deleted_count designs, but failed to delete $error_count designs due to permissions or errors." );
    } else {
        wp_send_json_error( "Failed to delete any designs. Check permissions." );
    }
}
