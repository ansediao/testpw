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
        
        // 加载设计管理样式
        wp_enqueue_style('pw-admin-design-management', plugin_dir_url(__FILE__) . 'css/pw-admin-design-management.css', array(), $this->version, 'all');

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

        


        // 加载 micromodal
        wp_enqueue_script('micromodal', 'https://unpkg.com/micromodal/dist/micromodal.min.js', array(), '2.5.1', true);
        // 加载 jsPDF 库 (This is for another feature, keeping it)
        wp_enqueue_script('jspdf', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', array(), '2.5.1', true);

        // 添加中文字体支持 (This is for another feature, keeping it)
        wp_enqueue_script('jspdf-customfonts', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-customfonts/0.0.72/jspdf.customfonts.min.js', array('jspdf'), '0.0.72', true);

        // 添加自动表格支持 (This is for another feature, keeping it)
        wp_enqueue_script('jspdf-autotable', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.29/jspdf.plugin.autotable.min.js', array('jspdf'), '3.5.29', true);

        // 最后加载自定义脚本
        $js_file = plugin_dir_url(__FILE__) . 'js/pw-admin-admin.js';
        wp_enqueue_script($this->plugin_name, $js_file, array('jquery', 'jspdf'), $this->version, true);

        // 传递AJAX变量给管理脚本
        wp_localize_script($this->plugin_name, 'pw_admin_vars', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('pw_add_category_nonce')
        ));

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
     * Handle AJAX request to get category settings
     *
     * @since    1.0.0
     */
    public function handle_get_category_settings()
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
        
        // 获取分类信息
        $category = get_term($category_id, 'pw_design_category');
        
        if (is_wp_error($category) || !$category) {
            wp_send_json_error('分类不存在');
            return;
        }
        
        // 获取分类元数据
        $category_type = get_term_meta($category_id, 'category_type', true);
        
        // Initial State Tab
        $exclude_from_export = get_term_meta($category_id, 'exclude_from_export', true);
        $layer_depth = get_term_meta($category_id, 'layer_depth', true);
        $scale_mode = get_term_meta($category_id, 'scale_mode', true);
        
        // Operation Config Tab
        $allow_resize = get_term_meta($category_id, 'allow_resize', true);
        $allow_rotate = get_term_meta($category_id, 'allow_rotate', true);
        $allow_delete = get_term_meta($category_id, 'allow_delete', true);
        
        // Price Tab
        $base_price = get_term_meta($category_id, 'base_price', true);
        $price_per_unit = get_term_meta($category_id, 'price_per_unit', true);
        $price_enabled = get_term_meta($category_id, 'price_enabled', true);
        
        wp_send_json_success(array(
            'name' => $category->name,
            'description' => $category->description,
            'type' => $category_type ? $category_type : 'general',
            
            // Initial State Tab
            'exclude_from_export' => (bool)$exclude_from_export,
            'layer_depth' => intval($layer_depth),
            'scale_mode' => $scale_mode ? $scale_mode : 'fit',
            
            // Operation Config Tab
            'allow_resize' => (bool)$allow_resize,
            'allow_rotate' => (bool)$allow_rotate,
            'allow_delete' => (bool)$allow_delete,
            
            // Price Tab
            'base_price' => floatval($base_price),
            'price_per_unit' => floatval($price_per_unit),
            'price_enabled' => (bool)$price_enabled
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
        $category_description = sanitize_textarea_field($_POST['category_description']);
        $category_type = sanitize_text_field($_POST['category_type']);
        
        // Initial State Tab
        $exclude_from_export = isset($_POST['exclude_from_export']) ? (bool)$_POST['exclude_from_export'] : false;
        $layer_depth = intval($_POST['layer_depth']);
        $scale_mode = sanitize_text_field($_POST['scale_mode']);
        
        // Operation Config Tab
        $allow_resize = isset($_POST['allow_resize']) ? (bool)$_POST['allow_resize'] : false;
        $allow_rotate = isset($_POST['allow_rotate']) ? (bool)$_POST['allow_rotate'] : false;
        $allow_delete = isset($_POST['allow_delete']) ? (bool)$_POST['allow_delete'] : false;
        
        // Price Tab
        $base_price = floatval($_POST['base_price']);
        $price_per_unit = floatval($_POST['price_per_unit']);
        $price_enabled = isset($_POST['price_enabled']) ? (bool)$_POST['price_enabled'] : false;
        
        if (empty($category_name)) {
            wp_send_json_error('分类名称不能为空');
            return;
        }
        
        if ($category_id <= 0) {
            wp_send_json_error('无效的分类ID');
            return;
        }
        
        // 更新分类名称和描述
        $term_data = wp_update_term(
            $category_id,
            'pw_design_category',
            array(
                'name' => $category_name,
                'description' => $category_description,
            )
        );
        
        if (is_wp_error($term_data)) {
            wp_send_json_error('更新分类失败: ' . $term_data->get_error_message());
            return;
        }
        
        // 更新分类元数据
        update_term_meta($category_id, 'category_type', $category_type);
        
        // Initial State Tab meta
        update_term_meta($category_id, 'exclude_from_export', $exclude_from_export);
        update_term_meta($category_id, 'layer_depth', $layer_depth);
        update_term_meta($category_id, 'scale_mode', $scale_mode);
        
        // Operation Config Tab meta
        update_term_meta($category_id, 'allow_resize', $allow_resize);
        update_term_meta($category_id, 'allow_rotate', $allow_rotate);
        update_term_meta($category_id, 'allow_delete', $allow_delete);
        
        // Price Tab meta
        update_term_meta($category_id, 'base_price', $base_price);
        update_term_meta($category_id, 'price_per_unit', $price_per_unit);
        update_term_meta($category_id, 'price_enabled', $price_enabled);
        
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

    /**
     * Handle AJAX request to add new design
     *
     * @since    1.0.0
     */
    public function handle_add_design()
    {
        // 验证请求方法
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            wp_send_json_error('无效的请求方法');
            return;
        }

               
        // 验证nonce
        if (!isset($_POST['pw_add_design_nonce_field']) || !wp_verify_nonce($_POST['pw_add_design_nonce_field'], 'pw_add_design_nonce')) {
            wp_send_json_error('Security check failed.');
            return;
        }

        // 验证用户权限
        if (!current_user_can('edit_posts')) {
            wp_send_json_error('权限不足');
            return;
        }

        // 获取并验证数据
        $design_name = isset($_POST['design_name']) ? sanitize_text_field($_POST['design_name']) : '';
        $design_category = isset($_POST['design_category']) ? intval($_POST['design_category']) : 0;

        if (empty($design_name)) {
            wp_send_json_error('设计名称不能为空');
            return;
        }



        // 处理图片上传
        $image_url = '';
        if (!empty($_FILES['design_image']['name'])) {
            // 检查文件上传错误
            if ($_FILES['design_image']['error'] !== UPLOAD_ERR_OK) {
                wp_send_json_error('文件上传失败：错误代码 ' . $_FILES['design_image']['error']);
                return;
            }
            
            // 验证文件类型
            $allowed_types = array('image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml');
            $file_type = $_FILES['design_image']['type'];
            

            
            if (!in_array($file_type, $allowed_types)) {
                wp_send_json_error('不支持的文件类型，请上传 JPG、PNG、GIF 或 SVG 格式的图片。当前文件类型：' . $file_type);
                return;
            }
            
            // 验证文件大小 (5MB限制)
            $max_size = 5 * 1024 * 1024; // 5MB
            if ($_FILES['design_image']['size'] > $max_size) {
                wp_send_json_error('文件太大，请上传小于5MB的图片');
                return;
            }
            
            // 包含必要的WordPress文件
            if (!function_exists('wp_handle_upload')) {
                require_once(ABSPATH . 'wp-admin/includes/file.php');
            }
            

            
            // 直接处理文件上传，绕过WordPress安全检查
            $uploaded_file = $_FILES['design_image'];
            $upload_dir = wp_upload_dir();
            
            // 生成唯一文件名
            $file_extension = pathinfo($uploaded_file['name'], PATHINFO_EXTENSION);
            $unique_filename = 'design_' . time() . '_' . uniqid() . '.' . $file_extension;
            $target_path = $upload_dir['path'] . '/' . $unique_filename;
            $target_url = $upload_dir['url'] . '/' . $unique_filename;
            
            // 直接移动文件
             if (move_uploaded_file($uploaded_file['tmp_name'], $target_path)) {
                 $image_url = $target_url;
                 $image_file_path = $target_path;
             } else {
                 wp_send_json_error('文件上传失败：无法移动文件');
                 return;
             }
        }

        // 创建设计文章
        $post_data = array(
            'post_title' => $design_name,
            'post_type' => 'pw_design',
            'post_status' => 'publish',
        );

        $post_id = wp_insert_post($post_data);

        if (is_wp_error($post_id)) {
            wp_send_json_error('创建设计失败: ' . $post_id->get_error_message());
            return;
        }

        // 设置分类
        if ($design_category > 0) {
            wp_set_object_terms($post_id, $design_category, 'pw_design_category');
        }

        // 设置特色图片
        if (!empty($image_url) && !empty($image_file_path)) {
            // 直接从上传的文件创建附件，而不是重新下载
            $attachment_id = $this->create_attachment_from_file($image_file_path, $post_id, $_FILES['design_image']['name']);
            if ($attachment_id) {
                set_post_thumbnail($post_id, $attachment_id);
            }
        }

        wp_send_json_success(array(
            'message' => '设计添加成功',
            'post_id' => $post_id,
            'redirect_url' => get_edit_post_link($post_id)
        ));
    }

    /**
     * Handle AJAX request to get design tags
     *
     * @since    1.0.0
     */
    public function handle_get_design_tags()
    {
        // 验证 nonce
        if (!wp_verify_nonce($_POST['nonce'], 'pw_add_design_nonce')) {
            wp_send_json_error('安全验证失败');
            return;
        }

        $design_id = intval($_POST['design_id']);
        if ($design_id <= 0) {
            wp_send_json_error('无效的设计ID');
            return;
        }

        // 获取所有标签
        $all_tags = get_terms(array(
            'taxonomy' => 'pw_design_tag',
            'hide_empty' => false,
        ));

        // 获取当前设计的标签
        $current_tags = wp_get_object_terms($design_id, 'pw_design_tag', array('fields' => 'ids'));

        // 生成HTML
        $html = '';
        if (!empty($all_tags) && !is_wp_error($all_tags)) {
            foreach ($all_tags as $tag) {
                $checked = in_array($tag->term_id, $current_tags) ? 'checked' : '';
                $html .= '<label style="display:block;margin:5px 0;">';
                $html .= '<input type="checkbox" name="design_tags[]" value="' . esc_attr($tag->term_id) . '" ' . $checked . '> ';
                $html .= esc_html($tag->name) . '</label>';
            }
        } else {
            $html = '<p>暂无标签</p>';
        }

        wp_send_json_success($html);
    }

    /**
     * Handle AJAX request to save design tags
     *
     * @since    1.0.0
     */
    public function handle_save_design_tags()
    {
        // 验证 nonce
        if (!wp_verify_nonce($_POST['nonce'], 'pw_add_design_nonce')) {
            wp_send_json_error('安全验证失败');
            return;
        }

        // 验证用户权限
        if (!current_user_can('edit_posts')) {
            wp_send_json_error('权限不足');
            return;
        }

        $design_id = intval($_POST['design_id']);
        $tags = isset($_POST['tags']) ? array_map('intval', $_POST['tags']) : array();

        if ($design_id <= 0) {
            wp_send_json_error('无效的设计ID');
            return;
        }

        // 更新标签
        wp_set_object_terms($design_id, $tags, 'pw_design_tag');

        wp_send_json_success('标签保存成功');
    }

    /**
     * 从URL创建附件
     *
     * @since    1.0.0
     */
    private function create_attachment_from_url($image_url, $post_id)
    {
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');

        $tmp = download_url($image_url);
        if (is_wp_error($tmp)) {
            return false;
        }

        $file_array = array(
            'name' => basename($image_url),
            'tmp_name' => $tmp
        );

        $id = media_handle_sideload($file_array, $post_id);

        if (is_wp_error($id)) {
            @unlink($file_array['tmp_name']);
            return false;
        }

        return $id;
    }

    /**
     * Create attachment from uploaded file
     *
     * @since    1.0.0
     * @param    string    $file_path    Path to the uploaded file
     * @param    int       $post_id      Post ID to attach to
     * @param    string    $filename     Original filename
     * @return   int|false              Attachment ID on success, false on failure
     */
    private function create_attachment_from_file($file_path, $post_id, $filename)
    {
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');

        // 获取文件的MIME类型
        $filetype = wp_check_filetype($filename, null);
        
        // 准备附件数据
        $attachment = array(
            'post_mime_type' => $filetype['type'],
            'post_title'     => sanitize_file_name(pathinfo($filename, PATHINFO_FILENAME)),
            'post_content'   => '',
            'post_status'    => 'inherit'
        );

        // 插入附件到数据库
        $attach_id = wp_insert_attachment($attachment, $file_path, $post_id);
        
        if (is_wp_error($attach_id)) {
            return false;
        }

        // 生成附件的元数据（缩略图等）
        $attach_data = wp_generate_attachment_metadata($attach_id, $file_path);
        wp_update_attachment_metadata($attach_id, $attach_data);

        return $attach_id;
    }
    
    /**
     * Handle AJAX request to bulk delete designs
     *
     * @since    1.0.0
     */
    public function handle_bulk_delete_designs()
    {
        // 验证 nonce
        if (!wp_verify_nonce($_POST['nonce'], 'pw_add_category_nonce')) {
            wp_send_json_error('安全验证失败');
            return;
        }
        
        // 验证用户权限
        if (!current_user_can('delete_posts')) {
            wp_send_json_error('权限不足');
            return;
        }
        
        // 获取并验证设计ID数组
        $design_ids = isset($_POST['design_ids']) ? array_map('intval', $_POST['design_ids']) : array();
        
        if (empty($design_ids)) {
            wp_send_json_error('请选择要删除的设计');
            return;
        }
        
        $deleted_count = 0;
        $errors = array();
        
        foreach ($design_ids as $design_id) {
            if ($design_id <= 0) {
                continue;
            }
            
            // 验证当前用户是否有权限删除此设计
            if (!current_user_can('delete_post', $design_id)) {
                $errors[] = 'ID: ' . $design_id . ' - 权限不足';
                continue;
            }
            
            // 检查是否为有效的设计文章
            $post = get_post($design_id);
            if (!$post || $post->post_type !== 'pw_design') {
                $errors[] = 'ID: ' . $design_id . ' - 无效的设计';
                continue;
            }
            
            // 删除文章（包括移动到回收站或永久删除）
            $result = wp_delete_post($design_id, true); // true 表示永久删除
            
            if ($result === false) {
                $errors[] = 'ID: ' . $design_id . ' - 删除失败';
            } else {
                $deleted_count++;
            }
        }
        
        if ($deleted_count > 0) {
            wp_send_json_success(array(
                'deleted' => $deleted_count,
                'errors' => $errors,
                'message' => '成功删除 ' . $deleted_count . ' 个设计'
            ));
        } else {
            wp_send_json_error('没有设计被删除: ' . implode(', ', $errors));
        }
    }

    /**
     * Handle AJAX request to bulk update designs
     *
     * @since    1.0.0
     */
    public function handle_bulk_update_designs()
    {
        // 验证 nonce
        if (!wp_verify_nonce($_POST['nonce'], 'pw_bulk_update_designs_nonce')) {
            wp_send_json_error('安全验证失败');
            return;
        }
        
        // 验证用户权限
        if (!current_user_can('edit_posts')) {
            wp_send_json_error('权限不足');
            return;
        }
        
        // 获取并验证设计ID数组
        $design_ids_string = isset($_POST['selected_design_ids']) ? sanitize_text_field($_POST['selected_design_ids']) : '';
        $design_ids = array_filter(array_map('intval', explode(',', $design_ids_string)));
        
        if (empty($design_ids)) {
            wp_send_json_error('请选择要更新的设计');
            return;
        }

        // 解析更新数据
        $updates = array();

        // 优先尝试 JSON 格式 (Vue 前端提交)
        if (isset($_POST['updates_json'])) {
            $json = json_decode(stripslashes($_POST['updates_json']), true);
            if (is_array($json)) {
                foreach ($json as $field) {
                    $updates[$field['key']] = $field['value'];
                }
            }
        } 
        // 兼容旧的表单提交方式
        else {
            if (isset($_POST['bulk_description'])) $updates['description'] = wp_kses_post($_POST['bulk_description']);
            if (isset($_POST['bulk_category'])) $updates['category'] = intval($_POST['bulk_category']);
            if (isset($_POST['bulk_tags'])) $updates['tags'] = $_POST['bulk_tags'];
        }

        if (empty($updates)) {
            wp_send_json_error('没有提交任何更新内容');
            return;
        }
        
        $updated_count = 0;
        $errors = array();
        
        foreach ($design_ids as $design_id) {
            if ($design_id <= 0) continue;
            
            // 验证当前用户是否有权限编辑此设计
            if (!current_user_can('edit_post', $design_id)) {
                $errors[] = 'ID: ' . $design_id . ' - 权限不足';
                continue;
            }
            
            $post_data = array('ID' => $design_id);
            $has_post_update = false;

            // 1. 更新标准文章字段 (Name/Title, Status, Description)
            if (isset($updates['name']) && !empty($updates['name'])) {
                $post_data['post_title'] = sanitize_text_field($updates['name']);
                $has_post_update = true;
            }

            if (isset($updates['description'])) {
                $post_data['post_content'] = wp_kses_post($updates['description']);
                $has_post_update = true;
            }

            if (isset($updates['status']) && !empty($updates['status'])) {
                $valid_statuses = array('publish', 'draft', 'pending', 'private');
                if (in_array($updates['status'], $valid_statuses)) {
                    $post_data['post_status'] = sanitize_text_field($updates['status']);
                    $has_post_update = true;
                }
            }

            if ($has_post_update) {
                $result = wp_update_post($post_data);
                if (is_wp_error($result)) {
                    $errors[] = 'ID: ' . $design_id . ' - 更新失败: ' . $result->get_error_message();
                    continue;
                }
            }

            // 2. 更新元数据 (Price)
            if (isset($updates['price']) && $updates['price'] !== '') {
                update_post_meta($design_id, '_pw_design_price', floatval($updates['price']));
            }

            // 3. 更新分类 (Taxonomy)
            if (isset($updates['category']) && !empty($updates['category'])) {
                $cat_id = intval($updates['category']);
                if ($cat_id > 0) {
                    wp_set_post_terms($design_id, array($cat_id), 'pw_design_category');
                }
            }
            
            // 4. 更新标签 (Taxonomy)
            if (isset($updates['tags'])) {
                $tags = is_array($updates['tags']) ? $updates['tags'] : explode(',', $updates['tags']);
                // sanitize tags
                $tags = array_map('sanitize_text_field', $tags);
                wp_set_post_terms($design_id, $tags, 'pw_design_tag');
            }
            
            $updated_count++;
        }
        
        if ($updated_count > 0) {
            wp_send_json_success(array(
                'updated' => $updated_count,
                'errors' => $errors,
                'message' => '成功更新 ' . $updated_count . ' 个设计'
            ));
        } else {
            wp_send_json_error('没有设计被更新: ' . implode(', ', $errors));
        }
    }

    public function register_pw_design_price_metabox() {
        add_meta_box('pw_design_price_metabox', '价格', [$this, 'render_pw_design_price_metabox'], 'pw_design', 'side', 'default');
    }

    public function render_pw_design_price_metabox($post) {
        wp_nonce_field('pw_design_price_nonce', 'pw_design_price_nonce_field');
        $value = get_post_meta($post->ID, '_pw_design_price', true);
        echo '<label for="pw_design_price">价格</label>';
        echo '<input type="number" id="pw_design_price" name="pw_design_price" value="' . esc_attr($value) . '" min="0" step="0.01" style="width:100%" />';
    }

    public function save_pw_design_price_meta($post_id) {
        if (!isset($_POST['pw_design_price_nonce_field']) || !wp_verify_nonce($_POST['pw_design_price_nonce_field'], 'pw_design_price_nonce')) {
            return;
        }
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }
        if (!current_user_can('edit_post', $post_id)) {
            return;
        }
        $price = isset($_POST['pw_design_price']) ? $_POST['pw_design_price'] : null;
        if ($price !== null && $price !== '') {
            $price_val = floatval($price);
            update_post_meta($post_id, '_pw_design_price', $price_val);
        } else {
            delete_post_meta($post_id, '_pw_design_price');
        }
    }

}
                    

    








// Note: AJAX handlers for pw_get_design_tags and pw_save_design_tags are registered in includes/class-pw-admin.php
// to use the class methods handle_get_design_tags() and handle_save_design_tags() with proper nonce validation









