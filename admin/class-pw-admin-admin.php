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

        // 引入阿里图标库CSS
        wp_enqueue_style('pw-admin-iconfont', '//at.alicdn.com/t/c/font_4970780_pfyts3fzl6.css', array(), $this->version, 'all');
        
        // 引入 Element Plus CSS
        wp_enqueue_style('element-plus-css', 'https://unpkg.com/element-plus@2.4.4/dist/index.css', array(), '2.4.4', 'all');
        
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

        // 引入 Vue 3
        wp_enqueue_script('vue3', 'https://unpkg.com/vue@3/dist/vue.global.js', array(), '3.3.8', true);
        
        // 引入 Element Plus JS
        wp_enqueue_script('element-plus-js', 'https://unpkg.com/element-plus@2.4.4/dist/index.full.js', array('vue3'), '2.4.4', true);
        
        // 引入 Element Plus 中文语言包
        wp_enqueue_script('element-plus-locale-zh-cn', 'https://unpkg.com/element-plus@2.4.4/dist/locale/zh-cn.js', array('element-plus-js'), '2.4.4', true);
        
        // 加载 jsPDF 库 (This is for another feature, keeping it)
        wp_enqueue_script('jspdf', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', array(), '2.5.1', true);

        // 添加中文字体支持 (This is for another feature, keeping it)
        wp_enqueue_script('jspdf-customfonts', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-customfonts/0.0.72/jspdf.customfonts.min.js', array('jspdf'), '0.0.72', true);

        // 添加自动表格支持 (This is for another feature, keeping it)
        wp_enqueue_script('jspdf-autotable', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.29/jspdf.plugin.autotable.min.js', array('jspdf'), '3.5.29', true);

        // 最后加载自定义脚本
        $js_file = plugin_dir_url(__FILE__) . 'js/pw-admin-admin.js';
        wp_enqueue_script($this->plugin_name, $js_file, array('jquery', 'layui-js', 'jspdf', 'element-plus-js'), $this->version, true);

    }
    
    /**
     * Handle AJAX request to add new category
     *
     * @since    1.0.0
     */
    public function handle_add_category()
    {
        // 验证 nonce
        if (!wp_verify_nonce($_POST['nonce'], 'pw_add_category_nonce')) {
            wp_send_json_error('安全验证失败');
            return;
        }
        
        // 验证用户权限
        if (!current_user_can('manage_categories')) {
            wp_send_json_error('权限不足');
            return;
        }
        
        // 获取并验证输入数据
        $category_name = sanitize_text_field($_POST['category_name']);
        $category_type = sanitize_text_field($_POST['category_type']);
        
        if (empty($category_name)) {
            wp_send_json_error('分类名称不能为空');
            return;
        }
        
        // 创建分类
        $term_data = wp_insert_term(
            $category_name,
            'pw_design_category',
            array(
                'description' => '分类类型: ' . $category_type,
            )
        );
        
        if (is_wp_error($term_data)) {
            wp_send_json_error('创建分类失败: ' . $term_data->get_error_message());
            return;
        }
        
        // 保存分类类型作为 term meta
        if (!is_wp_error($term_data) && isset($term_data['term_id'])) {
            update_term_meta($term_data['term_id'], 'category_type', $category_type);
        }
        
        wp_send_json_success(array(
            'message' => '分类创建成功',
            'term_id' => $term_data['term_id'],
            'category_name' => $category_name,
            'category_type' => $category_type
        ));
    }
    
    /**
     * Handle AJAX request to update category settings
     *
     * @since    1.0.0
     */
    public function handle_update_category_settings()
    {
        // 验证 nonce
        if (!wp_verify_nonce($_POST['nonce'], 'pw_add_category_nonce')) {
            wp_send_json_error('安全验证失败');
            return;
        }
        
        // 验证用户权限
        if (!current_user_can('manage_categories')) {
            wp_send_json_error('权限不足');
            return;
        }
        
        // 获取并验证输入数据
        $category_id = intval($_POST['category_id']);
        $category_name = sanitize_text_field($_POST['category_name']);
        $category_type = sanitize_text_field($_POST['category_type']);
        $exclude_from_export = isset($_POST['exclude_from_export']) ? (bool)$_POST['exclude_from_export'] : false;
        $layer_depth = intval($_POST['layer_depth']);
        $scale_mode = sanitize_text_field($_POST['scale_mode']);
        
        if (empty($category_name)) {
            wp_send_json_error('分类名称不能为空');
            return;
        }
        
        if ($category_id <= 0) {
            wp_send_json_error('无效的分类ID');
            return;
        }
        
        // 更新分类名称
        $term_data = wp_update_term(
            $category_id,
            'pw_design_category',
            array(
                'name' => $category_name,
                'description' => '分类类型: ' . $category_type,
            )
        );
        
        if (is_wp_error($term_data)) {
            wp_send_json_error('更新分类失败: ' . $term_data->get_error_message());
            return;
        }
        
        // 更新分类元数据
        update_term_meta($category_id, 'category_type', $category_type);
        update_term_meta($category_id, 'exclude_from_export', $exclude_from_export);
        update_term_meta($category_id, 'layer_depth', $layer_depth);
        update_term_meta($category_id, 'scale_mode', $scale_mode);
        
        wp_send_json_success(array(
            'message' => '分类设置更新成功',
            'category_id' => $category_id,
            'category_name' => $category_name
        ));
    }
    
    /**
     * Handle AJAX request to delete category
     *
     * @since    1.0.0
     */
    public function handle_delete_category()
    {
        // 验证 nonce
        if (!wp_verify_nonce($_POST['nonce'], 'pw_add_category_nonce')) {
            wp_send_json_error('安全验证失败');
            return;
        }
        
        // 验证用户权限
        if (!current_user_can('manage_categories')) {
            wp_send_json_error('权限不足');
            return;
        }
        
        // 获取并验证输入数据
        $category_id = intval($_POST['category_id']);
        
        if ($category_id <= 0) {
            wp_send_json_error('无效的分类ID');
            return;
        }
        
        // 删除分类
        $result = wp_delete_term($category_id, 'pw_design_category');
        
        if (is_wp_error($result)) {
            wp_send_json_error('删除分类失败: ' . $result->get_error_message());
            return;
        }
        
        if ($result === false) {
            wp_send_json_error('删除分类失败: 分类不存在或无法删除');
            return;
        }
        
        wp_send_json_success(array(
            'message' => '分类删除成功',
            'category_id' => $category_id
        ));
    }
    
    /**
     * Handle product request form submission
     * @since    1.0.0
     */
    public function handle_product_request_submission()
    {
        // Verify nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'pw_product_request_nonce')) {
            wp_send_json_error(__('Security check failed!', 'pw-admin'));
            return;
        }
        
        // Check user permissions
        if (!current_user_can('manage_options')) {
            wp_send_json_error(__('Permission denied!', 'pw-admin'));
            return;
        }
        
        // Sanitize and get form data
        $description = isset($_POST['pw_product_description']) ? sanitize_textarea_field($_POST['pw_product_description']) : '';
        $product_link = isset($_POST['pw_product_link']) ? esc_url_raw($_POST['pw_product_link']) : '';
        $image_url = '';
        
        // Handle image upload if present
        if (isset($_FILES['pw_product_image']) && !empty($_FILES['pw_product_image']['name'])) {
            $uploaded_file = $_FILES['pw_product_image'];
            $upload_overrides = array('test_form' => false);
            $movefile = wp_handle_upload($uploaded_file, $upload_overrides);
            
            if ($movefile && !isset($movefile['error'])) {
                $image_url = $movefile['url'];
            }
        }
        
        // Validate that at least one field is filled
        if (empty($description) && empty($product_link) && empty($image_url)) {
            wp_send_json_error(__('Please fill in at least one field.', 'pw-admin'));
            return;
        }
        
        // Save to Flamingo if plugin is active
        if (class_exists('Flamingo_Inbound_Message')) {
            $this->save_product_request_to_flamingo($description, $product_link, $image_url);
            wp_send_json_success(__('Your product request has been submitted successfully!', 'pw-admin'));
        } else {
            wp_send_json_success(__('Your product request has been saved successfully!', 'pw-admin'));
        }
    }

    /**
     * Save product request to Flamingo plugin
     * @since    1.0.0
     */
    private function save_product_request_to_flamingo($description, $product_link, $image_url)
    {
        // Get current user info for the "from" field
        $current_user = wp_get_current_user();
        $from_name = $current_user->display_name ? $current_user->display_name : 'Admin User';
        $from_email = $current_user->user_email ? $current_user->user_email : get_option('admin_email');
        
        // Prepare Flamingo fields array
        $flamingo_fields = array(
            'product_description' => $description,
            'product_link'       => $product_link,
            'product_image'      => $image_url,
            'request_type'       => 'Product Request',
            'request_source'     => 'Admin Dashboard',
            'submitted_by'       => $from_name
        );
        
        // Define request subject
        $request_subject = __('Product Request from Admin Dashboard', 'pw-admin');
        
        // Create Flamingo inbound post
        $post_data = array(
            'post_type'    => 'flamingo_inbound',
            'post_status'  => 'publish',
            'post_title'   => $request_subject,
        );
        
        $post_id = wp_insert_post($post_data);
        
        if ($post_id && !is_wp_error($post_id)) {
            // Add Flamingo meta data
            update_post_meta($post_id, '_from', $from_name . ' <' . $from_email . '>');
            update_post_meta($post_id, '_from_name', $from_name);
            update_post_meta($post_id, '_from_email', $from_email);
            update_post_meta($post_id, '_subject', $request_subject);
            update_post_meta($post_id, '_fields', $flamingo_fields);
        }
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
            <input type="text" name="pw_token" id="pw_token" class="regular-text" placeholder="Enter API Token" value="<?php echo esc_attr(get_option('pw_api_token', '')); ?>">
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

        <!-- 缓存管理部分 -->
        <hr style="margin: 30px 0;">
        <h1>产品数据缓存管理</h1>
        <div id="cache-management-section">
            <div id="cache-status" style="background: #f9f9f9; padding: 15px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 15px;">
                <h3>缓存状态</h3>
                <div id="cache-info">
                    <p><strong>总缓存数量:</strong> <span id="total-cached">加载中...</span></p>
                    <p><strong>过期缓存数量:</strong> <span id="expired-count">加载中...</span></p>
                    <p><strong>最近更新时间:</strong> <span id="latest-cache-time">加载中...</span></p>
                    <p><strong>缓存有效期:</strong> <span id="cache-expiry">30分钟</span></p>
                </div>
                <button type="button" id="refresh-cache-status" class="button">刷新状态</button>
            </div>
            
            <div style="margin-bottom: 15px;">
                <h3>缓存操作</h3>
                <p>
                    <input type="number" id="specific-product-id" placeholder="输入产品ID (可选)" style="width: 200px;">
                    <button type="button" id="clear-specific-cache" class="button">清除指定产品缓存</button>
                </p>
                <p>
                    <button type="button" id="clear-all-cache" class="button button-secondary" onclick="return confirm('确定要清除所有产品缓存吗？')">清除所有缓存</button>
                </p>
                <p>
                    <input type="number" id="test-product-id" placeholder="输入产品ID进行测试" style="width: 200px;">
                    <button type="button" id="test-cache" class="button">测试缓存功能</button>
                </p>
            </div>
            
            <div id="cache-operation-result"></div>
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

            // 缓存管理功能
            function loadCacheStatus() {
                $.post(ajaxurl, {
                    action: 'pw_get_cache_status',
                    nonce: '<?php echo wp_create_nonce("pw_cache_status_nonce"); ?>'
                }, function(response) {
                    if (response.success) {
                        $('#total-cached').text(response.data.total_cached);
                        $('#expired-count').text(response.data.expired_count);
                        $('#latest-cache-time').text(response.data.latest_cache_time);
                        $('#cache-expiry').text(response.data.cache_expiry_minutes + '分钟');
                    } else {
                        $('#cache-info').html('<p style="color: red;">加载缓存状态失败: ' + (response.data || '未知错误') + '</p>');
                    }
                }).fail(function() {
                    $('#cache-info').html('<p style="color: red;">加载缓存状态失败: 网络错误</p>');
                });
            }

            // 页面加载时获取缓存状态
            loadCacheStatus();

            // 刷新缓存状态
            $('#refresh-cache-status').on('click', function() {
                loadCacheStatus();
            });

            // 清除指定产品缓存
            $('#clear-specific-cache').on('click', function() {
                var productId = $('#specific-product-id').val().trim();
                if (!productId) {
                    alert('请输入产品ID');
                    return;
                }

                $.post(ajaxurl, {
                    action: 'pw_clear_product_cache',
                    product_id: productId,
                    nonce: '<?php echo wp_create_nonce("pw_clear_cache_nonce"); ?>'
                }, function(response) {
                    if (response.success) {
                        $('#cache-operation-result').html('<div class="notice notice-success"><p>' + response.data.message + '</p></div>');
                        loadCacheStatus(); // 刷新状态
                        $('#specific-product-id').val(''); // 清空输入框
                    } else {
                        $('#cache-operation-result').html('<div class="notice notice-error"><p>操作失败: ' + (response.data || '未知错误') + '</p></div>');
                    }
                }).fail(function() {
                    $('#cache-operation-result').html('<div class="notice notice-error"><p>操作失败: 网络错误</p></div>');
                });
            });

            // 清除所有缓存
            $('#clear-all-cache').on('click', function() {
                $.post(ajaxurl, {
                    action: 'pw_clear_product_cache',
                    nonce: '<?php echo wp_create_nonce("pw_clear_cache_nonce"); ?>'
                }, function(response) {
                    if (response.success) {
                        $('#cache-operation-result').html('<div class="notice notice-success"><p>' + response.data.message + '</p></div>');
                        loadCacheStatus(); // 刷新状态
                    } else {
                        $('#cache-operation-result').html('<div class="notice notice-error"><p>操作失败: ' + (response.data || '未知错误') + '</p></div>');
                    }
                }).fail(function() {
                    $('#cache-operation-result').html('<div class="notice notice-error"><p>操作失败: 网络错误</p></div>');
                });
            });

            // 测试缓存功能
            $('#test-cache').on('click', function() {
                var productId = $('#test-product-id').val().trim();
                if (!productId) {
                    alert('请输入产品ID');
                    return;
                }

                $('#cache-operation-result').html('<div class="notice notice-info"><p>正在测试缓存功能...</p></div>');

                // 第一次调用 - 应该从API获取数据并缓存
                var startTime1 = Date.now();
                $.get('/wp-json/pw/v1/product-data/' + productId)
                    .done(function(data1) {
                        var time1 = Date.now() - startTime1;
                        
                        // 第二次调用 - 应该从缓存获取数据
                        var startTime2 = Date.now();
                        $.get('/wp-json/pw/v1/product-data/' + productId)
                            .done(function(data2) {
                                var time2 = Date.now() - startTime2;
                                
                                var resultHtml = '<div class="notice notice-success">';
                                resultHtml += '<h4>缓存测试结果:</h4>';
                                resultHtml += '<p><strong>第一次调用 (API):</strong> ' + time1 + 'ms</p>';
                                resultHtml += '<p><strong>第二次调用 (缓存):</strong> ' + time2 + 'ms</p>';
                                resultHtml += '<p><strong>性能提升:</strong> ' + ((time1 - time2) / time1 * 100).toFixed(1) + '%</p>';
                                resultHtml += '<p><strong>数据一致性:</strong> ' + (JSON.stringify(data1) === JSON.stringify(data2) ? '✓ 通过' : '✗ 失败') + '</p>';
                                resultHtml += '</div>';
                                
                                $('#cache-operation-result').html(resultHtml);
                                loadCacheStatus(); // 刷新状态
                            })
                            .fail(function() {
                                $('#cache-operation-result').html('<div class="notice notice-error"><p>第二次调用失败</p></div>');
                            });
                    })
                    .fail(function(xhr) {
                        var errorMsg = xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : '第一次调用失败';
                        $('#cache-operation-result').html('<div class="notice notice-error"><p>' + errorMsg + '</p></div>');
                    });
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
                            // 验证成功，保存token
                            $.ajax({
                                url: ajaxurl,
                                type: 'POST',
                                data: {
                                    action: 'pw_save_token',
                                    token: token,
                                    nonce: '<?php echo wp_create_nonce("pw_save_token_nonce"); ?>'
                                },
                                success: function(saveResponse) {
                                    if (saveResponse.success) {
                                        $('#pw_result').html('<div class="notice notice-success"><p>验证成功，Token已保存</p></div>');
                                    } else {
                                        $('#pw_result').html('<div class="notice notice-warning"><p>验证成功，但Token保存失败</p></div>');
                                    }
                                },
                                error: function() {
                                    $('#pw_result').html('<div class="notice notice-warning"><p>验证成功，但Token保存失败</p></div>');
                                }
                            });
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


// 获取API数据 - 使用新的API类
function get_products_from_api()
{
    $api = new Pw_Admin_Promowares_Api();
    return $api->get_products_from_api();
}

// 获取组合产品API数据
function get_composite_products_from_api()
{
    $api = new Pw_Admin_Promowares_Api();
    return $api->get_composite_products_from_api();
}

// 获取容器信息
function get_container_info($container_id)
{
    $api = new Pw_Admin_Promowares_Api();
    return $api->get_container_info($container_id);
}

// 调度产品导入任务
function schedule_product_import()
{
    // 导入单个产品
    $products = get_products_from_api();
    if (!empty($products)) {
        foreach ($products as $product) {
            // 为每个产品添加一个任务到 Action Scheduler
            as_schedule_single_action(time(), 'import_single_product', array($product));
        }
    }

    // 导入组合产品
    $composite_products = get_composite_products_from_api();
    if (!empty($composite_products)) {
        foreach ($composite_products as $composite_group) {
            // 为每个组合产品组添加一个任务到 Action Scheduler
            as_schedule_single_action(time(), 'import_composite_product_group', array($composite_group));
        }
    }
}

// 处理单个产品导入
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
        // 设置产品元数据 meta
        update_post_meta($post_id, 'pw_id', $product['id']);
        update_post_meta($post_id, 'pw_blank_item', $product['blank_item']);
        update_post_meta($post_id, 'pw_inquiry_button', $product['inquiry_button']);
        update_post_meta($post_id, '_price', $product['price']);
        update_post_meta($post_id, '_regular_price', $product['anchor_price']);
        update_post_meta($post_id, '_sku', $product['sku']);
        update_post_meta($post_id, 'pw_isSyncProduct', true);      


        // 获取并保存 产品视图 数据
        $api = new Pw_Admin_Promowares_Api();
        $token = get_option('pw_api_token', '');
        
        if (!empty($product['id'])) {
            $templates_response = $api->get_product_templates($product['id'], $token);
            
            if (!is_wp_error($templates_response) && isset($templates_response['data']['custom_view']['main_custom_view']['layer_config'])) {
                $pw_main_custom_view = $templates_response['data']['custom_view']['main_custom_view'];
                update_post_meta($post_id, 'pw_main_custom_view', $pw_main_custom_view);

                $pw_sub_custom_view = $templates_response['data']['custom_view']['sub_custom_view'];
                update_post_meta($post_id, 'pw_sub_custom_view', $pw_sub_custom_view);

                
                // 记录成功日志
                error_log('Layer config saved for product ID: ' . $product['id'] . ', WooCommerce ID: ' . $post_id);
            } else {
                // 记录错误日志
                if (is_wp_error($templates_response)) {
                    error_log('Failed to fetch layer config for product ID: ' . $product['id'] . ', Error: ' . $templates_response->get_error_message());
                } else {
                    error_log('Layer config not found in API response for product ID: ' . $product['id']);
                }
            }
        }
        
        // 设置封面图片
        if (!empty($product['product_image'])) {
             pw_set_product_featured_image($post_id, $product['product_image']);
        }
    }
}

// 处理组合产品组导入
function import_composite_product_group($composite_group)
{
    if (empty($composite_group['main_product_id']) || empty($composite_group['products'])) {
        return;
    }

    $main_product_id = $composite_group['main_product_id'];
    $products = $composite_group['products'];
    $created_product_ids = array();
    $main_post_id = null;

    // 导入组合产品组中的所有产品
    foreach ($products as $product) {
        $post_id = wp_insert_post(array(
            'post_title' => $product['name'],
            'post_content' => $product['description'],
            'post_excerpt' => $product['short_description'],
            'post_status' => 'publish',
            'post_type' => 'product',
        ));

        if ($post_id) {
            // 设置产品元数据
            update_post_meta($post_id, 'pw_id', $product['id']);
            update_post_meta($post_id, 'pw_blank_item', $product['blank_item']);
            update_post_meta($post_id, 'pw_inquiry_button', $product['inquiry_button']);
            update_post_meta($post_id, '_price', $product['price']);
            update_post_meta($post_id, '_regular_price', $product['anchor_price']);
            update_post_meta($post_id, '_sku', $product['sku']);
            update_post_meta($post_id, 'pw_isSyncProduct', true);
            update_post_meta($post_id, 'pw_product_type', $product['product_type']);

            // 设置封面图片
            if (!empty($product['product_image'])) {
                pw_set_product_featured_image($post_id, $product['product_image']);
            }

            // 记录创建的产品ID
            $created_product_ids[$product['id']] = $post_id;

            // 如果是主产品，记录其WordPress ID
            if ($product['id'] == $main_product_id) {
                $main_post_id = $post_id;
                // 标记为组合产品主产品
                update_post_meta($post_id, 'pw_is_composite_main', true);
                update_post_meta($post_id, 'pw_composite_main_id', $main_product_id);
                
                // 设置产品类型为Grouped Product
                wp_set_object_terms($post_id, 'grouped', 'product_type');
            }
        }
    }

    // 建立产品关联关系
    if ($main_post_id && !empty($created_product_ids)) {
        $related_product_ids = array();
        
        foreach ($created_product_ids as $pw_id => $wp_post_id) {
            if ($pw_id != $main_product_id) {
                $related_product_ids[] = $wp_post_id;
                // 为关联产品设置主产品ID
                update_post_meta($wp_post_id, 'pw_composite_main_id', $main_product_id);
                update_post_meta($wp_post_id, 'pw_composite_main_post_id', $main_post_id);
            }
        }
        
        // 为主产品设置关联产品列表
        update_post_meta($main_post_id, 'pw_composite_related_products', $related_product_ids);
        update_post_meta($main_post_id, 'pw_composite_all_product_ids', array_values($created_product_ids));
        
        // 设置Grouped products - 将其他同组产品添加到主产品的Linked Products中
        update_post_meta($main_post_id, '_children', $related_product_ids);
        
        // 获取主产品的container_id并处理容器规则
        $main_product_data = null;
        foreach ($products as $product) {
            if ($product['id'] == $main_product_id) {
                $main_product_data = $product;
                break;
            }
        }
        
        if ($main_product_data && isset($main_product_data['container_id']) && $main_product_data['container_id'] > 0) {
            // 为容器规则处理添加一个任务到 Action Scheduler
            error_log("Scheduling container rules processing for container_id: " . $main_product_data['container_id']);
            // 将所有参数序列化为JSON字符串
            $args_json = json_encode(array(
                'container_id' => $main_product_data['container_id'],
                'composite_group' => $composite_group,
                'created_product_ids' => $created_product_ids
            ));
            
            $scheduled = as_schedule_single_action(time() + 5, 'process_container_rules', array($args_json));
            
            if ($scheduled) {
                error_log("Container rules task scheduled successfully with ID: " . $scheduled);
            } else {
                error_log("Failed to schedule container rules task");
            }
        } else {
            error_log("Container rules processing not scheduled. Main product container_id: " . (isset($main_product_data['container_id']) ? $main_product_data['container_id'] : 'not set'));
        }
    }
}

// 处理容器规则
function process_container_rules($args_json)
{
    // 解析JSON字符串
    $args = json_decode($args_json, true);
    
    if (!$args || !is_array($args)) {
        error_log("Failed to decode JSON arguments for process_container_rules: " . var_export($args_json, true));
        return;
    }
    
    // 从解析后的数组中提取数据
    if (isset($args['container_id']) && isset($args['composite_group']) && isset($args['created_product_ids'])) {
        $container_id = $args['container_id'];
        $composite_group = $args['composite_group'];
        $created_product_ids = $args['created_product_ids'];
    } else {
        error_log("Missing required arguments in process_container_rules: " . var_export($args, true));
        return;
    }
    
    if (!isset($container_id) || empty($created_product_ids)) {
        error_log("Container rules processing skipped: container_id=" . var_export($container_id, true) . ", created_product_ids=" . var_export($created_product_ids, true));
        return;
    }
    
    // 如果container_id为0，跳过处理
    if ($container_id == 0) {
        error_log("Container rules processing skipped: container_id is 0");
        return;
    }
    
    // 获取容器信息
    error_log("Getting container info for container_id: " . $container_id);
    $container_info = get_container_info($container_id);
    
    if (!$container_info) {
        error_log("Failed to get container info for container_id: " . $container_id);
        return;
    }
    
    if (empty($container_info['label_values'])) {
        error_log("No label_values found in container info: " . json_encode($container_info));
        return;
    }
    
    error_log("Container info retrieved successfully: " . json_encode($container_info));
    
    // 为每个产品设置container_value
    foreach ($container_info['label_values'] as $label_value) {
        $pw_product_id = $label_value['product_id'];
        $label_value_text = $label_value['label_value'];
        $is_default = $label_value['is_default'];
        
        // 查找对应的WordPress产品ID
        if (isset($created_product_ids[$pw_product_id])) {
            $wp_post_id = $created_product_ids[$pw_product_id];
            
            // 设置容器相关的元数据
            update_post_meta($wp_post_id, 'pw_container_id', $container_id);
            update_post_meta($wp_post_id, 'pw_container_value', $label_value_text);
            update_post_meta($wp_post_id, 'pw_container_name', $container_info['container_name']);
            update_post_meta($wp_post_id, 'pw_container_label', $container_info['container_label']);
            update_post_meta($wp_post_id, 'pw_container_is_default', $is_default);
            
            // 记录日志
            error_log("Container rule applied: Product ID {$pw_product_id} (WP ID: {$wp_post_id}) -> Container Value: {$label_value_text}");
        }
    }
}

/**
 * Set product featured image from URL
 * 
 * @param int $product_id WooCommerce product ID
 * @param string $image_url Image URL to set as featured image
 * @return bool True on success, false on failure
 */
function pw_set_product_featured_image($product_id, $image_url) {
    if (empty($image_url) || empty($product_id)) {
        return false;
    }
    
    // Check if image already exists in media library
    // $existing_attachment = pw_get_attachment_by_url($image_url);
    // if ($existing_attachment) {
    //     set_post_thumbnail($product_id, $existing_attachment);
    //     return true;
    // }
    
    // Download and upload the image
    $image_data = wp_remote_get($image_url);
    if (is_wp_error($image_data) || wp_remote_retrieve_response_code($image_data) !== 200) {
        return false;
    }
    
    $image_body = wp_remote_retrieve_body($image_data);
    if (empty($image_body)) {
        return false;
    }
    
    // Get file info
    $file_info = pathinfo($image_url);
    $filename = sanitize_file_name($file_info['basename']);
    
    // If no extension, try to detect from content type
    if (empty($file_info['extension'])) {
        $content_type = wp_remote_retrieve_header($image_data, 'content-type');
        $extension = '';
        switch ($content_type) {
            case 'image/jpeg':
                $extension = '.jpg';
                break;
            case 'image/png':
                $extension = '.png';
                break;
            case 'image/gif':
                $extension = '.gif';
                break;
            case 'image/webp':
                $extension = '.webp';
                break;
        }
        $filename .= $extension;
    }
    
    // Upload to WordPress media library
    $upload = wp_upload_bits($filename, null, $image_body);
    if ($upload['error']) {
        return false;
    }
    
    // Create attachment
    $attachment = array(
        'post_mime_type' => wp_check_filetype($upload['file'])['type'],
        'post_title'     => sanitize_text_field($filename),
        'post_content'   => '',
        'post_status'    => 'inherit'
    );
    
    $attachment_id = wp_insert_attachment($attachment, $upload['file']);
    if (is_wp_error($attachment_id)) {
        return false;
    }
    
    // Generate attachment metadata
    require_once(ABSPATH . 'wp-admin/includes/image.php');
    $attachment_data = wp_generate_attachment_metadata($attachment_id, $upload['file']);
    wp_update_attachment_metadata($attachment_id, $attachment_data);
    
    // Set as featured image
    set_post_thumbnail($product_id, $attachment_id);
    
    return true;
}

/**
 * Get attachment ID by URL
 * 
 * @param string $url Image URL
 * @return int|false Attachment ID or false if not found
 */
function pw_get_attachment_by_url($url) {
    global $wpdb;
    
    $attachment = $wpdb->get_col($wpdb->prepare("SELECT ID FROM {$wpdb->posts} WHERE guid='%s';", $url));
    
    if (!empty($attachment)) {
        return $attachment[0];
    }
    
    return false;
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

                    // Display success/error messages
                    echo '<div id="pw-form-messages" style="display: none;"></div>';

                    // 产品需求表单
                    echo '<div class="pw-product-request-form">';
                    echo '<p class="pw-form-intro">我们对新产品充满热情，并珍视您提供的每一条建议。如果您发现了有趣的产品，请告诉我们！</p>';

                    echo '<form method="post" action="" enctype="multipart/form-data" id="pw_product_request_form">';
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
                    echo '<button type="submit" name="pw_submit_product_request" class="button pw-support-button">Submit</button>';
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
                            
                            // Handle form submission
                            $("#pw_product_request_form").on("submit", function(e) {
                                e.preventDefault();
                                
                                var formData = new FormData(this);
                                formData.append("action", "pw_submit_product_request");
                                formData.append("nonce", "' . wp_create_nonce('pw_product_request_nonce') . '");
                                
                                // Show loading state
                                $(".pw-support-button").prop("disabled", true).text("Submitting...");
                                
                                $.ajax({
                                    url: ajaxurl,
                                    type: "POST",
                                    data: formData,
                                    processData: false,
                                    contentType: false,
                                    success: function(response) {
                                        if (response.success) {
                                            $("#pw-form-messages").html(
                                                "<div class=\"notice notice-success is-dismissible\"><p>" + response.data + "</p></div>"
                                            ).show();
                                            // Reset form
                                            $("#pw_product_request_form")[0].reset();
                                            $("#pw_image_preview").html("");
                                        } else {
                                            $("#pw-form-messages").html(
                                                "<div class=\"notice notice-error is-dismissible\"><p>" + response.data + "</p></div>"
                                            ).show();
                                        }
                                    },
                                    error: function() {
                                        $("#pw-form-messages").html(
                                            "<div class=\"notice notice-error is-dismissible\"><p>An error occurred. Please try again.</p></div>"
                                        ).show();
                                    },
                                    complete: function() {
                                        // Reset button state
                                        $(".pw-support-button").prop("disabled", false).text("Submit");
                                        // Scroll to messages
                                        $("html, body").animate({
                                            scrollTop: $("#pw-form-messages").offset().top - 100
                                        }, 500);
                                    }
                                });
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
        // $item->add_meta_data('_custom_image', $values['custom_data']['custom_image']);
        // $item->add_meta_data('_custom_color', $values['custom_data']['color']);

        // 添加可见的元数据
        $item->add_meta_data('定制设计', '<img src="' . esc_url($values['custom_data']['custom_image']) . '" style="max-width:100px; height:auto;">', true);
        $item->add_meta_data('颜色', $values['custom_data']['color'], true);
        
        // 添加下载链接，只在邮件中显示，不在购物车中显示
        $download_link = '<a href="' . esc_url($values['custom_data']['custom_image']) . '" target="_blank" download>下载设计图</a>';
        // $item->add_meta_data('_download_link', $download_link); // 隐藏元数据，不在购物车显示
        $item->add_meta_data('设计下载', $download_link, false); // 只在邮件等后端显示
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

// AJAX handler moved to Pw_Admin_Promowares_Api class
add_action('wp_ajax_pw_proxy_api_request', function () {
    $api = new Pw_Admin_Promowares_Api();
    $api->handle_proxy_api_request();
});

// AJAX handler for saving token
add_action('wp_ajax_pw_save_token', 'pw_save_token');
function pw_save_token() {
    // 验证 nonce
    if (!wp_verify_nonce($_POST['nonce'], 'pw_save_token_nonce')) {
        wp_send_json_error('安全验证失败');
        return;
    }
    
    // 检查用户权限
    if (!current_user_can('manage_options')) {
        wp_send_json_error('权限不足');
        return;
    }
    
    $token = sanitize_text_field($_POST['token']);
    if (empty($token)) {
        wp_send_json_error('Token不能为空');
        return;
    }
    
    // 保存token到WordPress选项
    $result = update_option('pw_api_token', $token);
    
    if ($result) {
        wp_send_json_success('Token保存成功');
    } else {
        wp_send_json_error('Token保存失败');
    }
}

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

// AJAX handler for adding new design
add_action('wp_ajax_pw_add_design', 'pw_add_design');
function pw_add_design() {
    // 验证 nonce
    if (!isset($_POST['pw_add_design_nonce_field']) || !wp_verify_nonce($_POST['pw_add_design_nonce_field'], 'pw_add_design_nonce')) {
        wp_send_json_error('安全验证失败');
        return;
    }

    // 检查用户权限
    if (!current_user_can('edit_posts')) {
        wp_send_json_error('权限不足');
        return;
    }

    // 验证必需字段
    if (empty($_POST['design_name'])) {
        wp_send_json_error('设计名称不能为空');
        return;
    }

    if (empty($_FILES['design_image'])) {
        wp_send_json_error('请选择设计图片');
        return;
    }

    $design_name = sanitize_text_field($_POST['design_name']);
    $design_category = isset($_POST['design_category']) ? intval($_POST['design_category']) : 0;

    // 处理文件上传
    if (!function_exists('wp_handle_upload')) {
        require_once(ABSPATH . 'wp-admin/includes/file.php');
    }

    $uploadedfile = $_FILES['design_image'];
    
    // 设置上传配置
    $upload_overrides = array(
        'test_form' => false,
        'mimes' => array(
            'jpg|jpeg|jpe' => 'image/jpeg',
            'gif' => 'image/gif',
            'png' => 'image/png',
        )
    );

    // 上传文件
    $movefile = wp_handle_upload($uploadedfile, $upload_overrides);

    if ($movefile && !isset($movefile['error'])) {
        // 创建新的设计文章
        $post_data = array(
            'post_title'    => $design_name,
            'post_content'  => '',
            'post_status'   => 'publish',
            'post_type'     => 'pw_design'
        );

        $post_id = wp_insert_post($post_data);

        if ($post_id && !is_wp_error($post_id)) {
            // 将上传的图片设置为特色图片
            $attachment = array(
                'post_mime_type' => $movefile['type'],
                'post_title'     => $design_name,
                'post_content'   => '',
                'post_status'    => 'inherit'
            );

            $attach_id = wp_insert_attachment($attachment, $movefile['file'], $post_id);
            
            if ($attach_id && !is_wp_error($attach_id)) {
                // 生成缩略图
                if (!function_exists('wp_generate_attachment_metadata')) {
                    require_once(ABSPATH . 'wp-admin/includes/image.php');
                }
                $attach_data = wp_generate_attachment_metadata($attach_id, $movefile['file']);
                wp_update_attachment_metadata($attach_id, $attach_data);

                // 设置为特色图片
                set_post_thumbnail($post_id, $attach_id);
            }

            // 设置分类
            if ($design_category > 0) {
                wp_set_post_terms($post_id, array($design_category), 'pw_design_category');
            }

            wp_send_json_success(array(
                'post_id' => $post_id,
                'message' => '设计添加成功'
            ));
        } else {
            // 删除已上传的文件，因为文章创建失败
            unlink($movefile['file']);
            wp_send_json_error('创建设计文章失败');
        }
    } else {
        wp_send_json_error('文件上传失败：' . (isset($movefile['error']) ? $movefile['error'] : '未知错误'));
    }
}

// AJAX handler for clearing product data cache
add_action('wp_ajax_pw_clear_product_cache', 'pw_clear_product_cache');
function pw_clear_product_cache() {
    // 验证 nonce
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'pw_clear_cache_nonce')) {
        wp_send_json_error('安全验证失败');
        return;
    }
    
    // 验证用户权限
    if (!current_user_can('manage_options')) {
        wp_send_json_error('权限不足');
        return;
    }
    
    $api = new Pw_Admin_Promowares_Api();
    $product_id = isset($_POST['product_id']) ? intval($_POST['product_id']) : 0;
    
    if ($product_id > 0) {
        // 清除特定产品的缓存
        $result = $api->clear_cached_product_data($product_id);
        if ($result) {
            wp_send_json_success(array(
                'message' => "产品 ID {$product_id} 的缓存已清除"
            ));
        } else {
            wp_send_json_error("清除产品 ID {$product_id} 的缓存失败");
        }
    } else {
        // 清除所有产品的缓存
        $cleared_count = $api->clear_all_cached_product_data();
        wp_send_json_success(array(
            'message' => "已清除 {$cleared_count} 个产品的缓存数据"
        ));
    }
}

// AJAX handler for getting cache status
add_action('wp_ajax_pw_get_cache_status', 'pw_get_cache_status');
function pw_get_cache_status() {
    // 验证 nonce
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'pw_cache_status_nonce')) {
        wp_send_json_error('安全验证失败');
        return;
    }
    
    // 验证用户权限
    if (!current_user_can('manage_options')) {
        wp_send_json_error('权限不足');
        return;
    }
    
    global $wpdb;
    
    // 获取缓存统计信息
    $cache_count = $wpdb->get_var(
        "SELECT COUNT(*) FROM {$wpdb->postmeta} WHERE meta_key = '_pw_aggregated_data_cache'"
    );
    
    // 获取过期的缓存数量
    $expired_count = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM {$wpdb->postmeta} pm1 
         INNER JOIN {$wpdb->postmeta} pm2 ON pm1.post_id = pm2.post_id 
         WHERE pm1.meta_key = '_pw_aggregated_data_cache' 
         AND pm2.meta_key = '_pw_aggregated_data_cache_time' 
         AND pm2.meta_value < %d",
        time() - (30 * 60) // 30分钟前
    ));
    
    // 获取最近的缓存更新时间
    $latest_cache = $wpdb->get_var(
        "SELECT MAX(meta_value) FROM {$wpdb->postmeta} WHERE meta_key = '_pw_aggregated_data_cache_time'"
    );
    
    $latest_cache_time = $latest_cache ? date('Y-m-d H:i:s', intval($latest_cache)) : '无';
    
    wp_send_json_success(array(
        'total_cached' => intval($cache_count),
        'expired_count' => intval($expired_count),
        'latest_cache_time' => $latest_cache_time,
        'cache_expiry_minutes' => 30
    ));
}