<?php

/**
 * 购物车管理员操作模块
 * 
 * 为购物车中的每个商品添加复制和编辑按钮，仅对管理员可见
 *
 * @package    Pw_Admin
 * @subpackage Pw_Admin/public/modules
 * @since      1.0.0
 */

class Pw_Cart_Admin_Actions {

    /**
     * 构造函数
     */
    public function __construct() {
        $this->init_hooks();
    }

    /**
     * 初始化钩子
     */
    private function init_hooks() {
        // 在购物车商品名称后添加管理员操作按钮
        add_filter('woocommerce_cart_item_name', array($this, 'add_admin_action_buttons'), 10, 3);
        
        // 添加 AJAX 处理程序
        add_action('wp_ajax_pw_duplicate_cart_item', array($this, 'handle_duplicate_cart_item'));
        
        // 添加样式和脚本
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
    }

    /**
     * 在购物车商品名称后添加管理员操作按钮
     *
     * @param string $product_name 产品名称
     * @param array $cart_item 购物车项目
     * @param string $cart_item_key 购物车项目键
     * @return string 修改后的产品名称
     */
    public function add_admin_action_buttons($product_name, $cart_item, $cart_item_key) {
        // 仅对管理员显示
        if (!current_user_can('manage_options')) {
            return $product_name;
        }

        // 仅在购物车页面显示
        if (!is_cart()) {
            return $product_name;
        }

        $product_id = $cart_item['product_id'];
        $variation_id = $cart_item['variation_id'];
        
        // 构建按钮HTML
        $buttons_html = '<div class="pw-cart-admin-actions" style="margin-top: 8px;">';
        
        // 复制按钮
        $buttons_html .= sprintf(
            '<button type="button" class="pw-cart-duplicate-btn" data-cart-key="%s" data-product-id="%s" data-variation-id="%s" style="margin-right: 8px; padding: 4px 8px; font-size: 12px; background: #0073aa; color: white; border: none; border-radius: 3px; cursor: pointer;">
                <i class="dashicons dashicons-admin-page" style="font-size: 12px; line-height: 1;"></i> 复制
            </button>',
            esc_attr($cart_item_key),
            esc_attr($product_id),
            esc_attr($variation_id)
        );
        
        // 编辑按钮 - 跳转到后台编辑界面
        $edit_url = $this->get_product_admin_edit_url($product_id);
        $buttons_html .= sprintf(
            '<a href="%s" class="pw-cart-edit-btn" target="_blank" style="padding: 4px 8px; font-size: 12px; background: #00a32a; color: white; text-decoration: none; border-radius: 3px; display: inline-block;">
                <i class="dashicons dashicons-edit" style="font-size: 12px; line-height: 1;"></i> 编辑
            </a>',
            esc_url($edit_url)
        );
        
        $buttons_html .= '</div>';
        
        return $product_name . $buttons_html;
    }

    /**
     * 获取产品后台编辑URL
     *
     * @param int $product_id 产品ID
     * @return string 后台编辑URL
     */
    private function get_product_admin_edit_url($product_id) {
        return admin_url('post.php?post=' . $product_id . '&action=edit');
    }

    /**
     * 处理复制购物车项目的AJAX请求
     * 创建一个新的同名产品并跳转到后台编辑界面
     */
    public function handle_duplicate_cart_item() {
        // 验证权限
        if (!current_user_can('manage_options')) {
            wp_die('权限不足');
        }

        // 验证nonce
        check_ajax_referer('pw_cart_actions', 'nonce');

        $cart_item_key = sanitize_text_field($_POST['cart_key']);
        
        if (empty($cart_item_key)) {
            wp_send_json_error('无效的购物车项目');
        }

        // 获取购物车项目
        $cart = WC()->cart;
        $cart_item = $cart->get_cart_item($cart_item_key);
        
        if (!$cart_item) {
            wp_send_json_error('购物车项目不存在');
        }

        $original_product_id = $cart_item['product_id'];
        $original_product = wc_get_product($original_product_id);
        
        if (!$original_product) {
            wp_send_json_error('原产品不存在');
        }

        // 创建新产品
        $new_product_id = $this->duplicate_product($original_product, $cart_item);
        
        if ($new_product_id) {
            wp_send_json_success(array(
                'message' => '产品已成功复制',
                'new_product_id' => $new_product_id,
                'redirect_url' => $this->get_product_admin_edit_url($new_product_id)
            ));
        } else {
            wp_send_json_error('复制失败，请重试');
        }
    }

    /**
     * 复制产品
     *
     * @param WC_Product $original_product 原产品对象
     * @param array $cart_item 购物车项目数据
     * @return int|false 新产品ID或false
     */
    private function duplicate_product($original_product, $cart_item) {
        // 获取原产品数据
        $original_post = get_post($original_product->get_id());
        
        if (!$original_post) {
            return false;
        }

        // 创建新产品文章
        $new_post_data = array(
            'post_title'    => $original_post->post_title . ' (复制)',
            'post_content'  => $original_post->post_content,
            'post_excerpt'  => $original_post->post_excerpt,
            'post_status'   => 'draft', // 设为草稿状态
            'post_type'     => 'product',
            'post_author'   => get_current_user_id(),
            'post_parent'   => $original_post->post_parent,
            'menu_order'    => $original_post->menu_order
        );

        $new_product_id = wp_insert_post($new_post_data);
        
        if (is_wp_error($new_product_id) || !$new_product_id) {
            return false;
        }

        // 复制产品元数据
        $this->copy_product_meta($original_product->get_id(), $new_product_id);
        
        // 复制分类和标签
        $this->copy_product_taxonomies($original_product->get_id(), $new_product_id);
        
        // 复制特色图片
        $this->copy_product_thumbnail($original_product->get_id(), $new_product_id);
        
        // 保存购物车中的自定义数据到新产品
        $this->save_cart_custom_data($new_product_id, $cart_item);

        return $new_product_id;
    }

    /**
     * 复制产品元数据
     *
     * @param int $original_id 原产品ID
     * @param int $new_id 新产品ID
     */
    private function copy_product_meta($original_id, $new_id) {
        $meta_data = get_post_meta($original_id);
        
        foreach ($meta_data as $key => $values) {
            // 跳过一些不需要复制的元数据
            if (in_array($key, array('_edit_lock', '_edit_last'))) {
                continue;
            }
            
            foreach ($values as $value) {
                add_post_meta($new_id, $key, maybe_unserialize($value));
            }
        }
    }

    /**
     * 复制产品分类和标签
     *
     * @param int $original_id 原产品ID
     * @param int $new_id 新产品ID
     */
    private function copy_product_taxonomies($original_id, $new_id) {
        $taxonomies = get_object_taxonomies('product');
        
        foreach ($taxonomies as $taxonomy) {
            $terms = wp_get_object_terms($original_id, $taxonomy, array('fields' => 'ids'));
            if (!empty($terms) && !is_wp_error($terms)) {
                wp_set_object_terms($new_id, $terms, $taxonomy);
            }
        }
    }

    /**
     * 复制产品特色图片
     *
     * @param int $original_id 原产品ID
     * @param int $new_id 新产品ID
     */
    private function copy_product_thumbnail($original_id, $new_id) {
        $thumbnail_id = get_post_thumbnail_id($original_id);
        if ($thumbnail_id) {
            set_post_thumbnail($new_id, $thumbnail_id);
        }
    }

    /**
     * 保存购物车自定义数据到新产品
     *
     * @param int $new_product_id 新产品ID
     * @param array $cart_item 购物车项目数据
     */
    private function save_cart_custom_data($new_product_id, $cart_item) {
        // 保存画布数据
        if (isset($cart_item['pw_canvas_data'])) {
            update_post_meta($new_product_id, '_pw_canvas_data', $cart_item['pw_canvas_data']);
        }
        
        // 保存其他自定义数据
        if (isset($cart_item['pw_custom_data'])) {
            update_post_meta($new_product_id, '_pw_custom_data', $cart_item['pw_custom_data']);
        }
        
        // 保存数量信息
        if (isset($cart_item['quantity'])) {
            update_post_meta($new_product_id, '_pw_cart_quantity', $cart_item['quantity']);
        }
        
        // 添加复制标识
        update_post_meta($new_product_id, '_pw_is_duplicate', true);
        update_post_meta($new_product_id, '_pw_duplicate_time', current_time('timestamp'));
        update_post_meta($new_product_id, '_pw_original_product_id', $cart_item['product_id']);
    }



    /**
     * 加载脚本和样式
     */
    public function enqueue_scripts() {
        // 仅在购物车页面且用户是管理员时加载
        if (!is_cart() || !current_user_can('manage_options')) {
            return;
        }

        // 加载Dashicons（管理员图标）
        wp_enqueue_style('dashicons');
        
        // 加载自定义样式
        wp_enqueue_style(
            'pw-cart-admin-actions',
            plugin_dir_url(__FILE__) . '../css/pw-cart-admin-actions.css',
            array(),
            '1.0.0',
            'all'
        );

        // 添加内联JavaScript
        $script = "
        jQuery(document).ready(function($) {
            // 显示消息的辅助函数
            function showMessage(container, message, type) {
                var messageDiv = $('<div class=\"pw-cart-message ' + type + '\">' + message + '</div>');
                container.find('.pw-cart-message').remove();
                container.append(messageDiv);
                
                // 3秒后自动移除消息
                setTimeout(function() {
                    messageDiv.fadeOut(300, function() {
                        $(this).remove();
                    });
                }, 3000);
            }
            
            // 复制按钮点击事件
            $(document).on('click', '.pw-cart-duplicate-btn', function(e) {
                e.preventDefault();
                
                var button = $(this);
                var container = button.closest('.pw-cart-admin-actions');
                var cartKey = button.data('cart-key');
                var productId = button.data('product-id');
                var originalHtml = button.html();
                
                // 添加加载状态
                button.prop('disabled', true).addClass('loading').html('复制中...');
                
                $.ajax({
                    url: '" . admin_url('admin-ajax.php') . "',
                    type: 'POST',
                    data: {
                        action: 'pw_duplicate_cart_item',
                        cart_key: cartKey,
                        nonce: '" . wp_create_nonce('pw_cart_actions') . "'
                    },
                    success: function(response) {
                        button.removeClass('loading');
                        
                        if (response.success) {
                            showMessage(container, '产品已成功复制为新产品！正在跳转到后台编辑页面...', 'success');
                            
                            // 延迟跳转，让用户看到成功消息
                            setTimeout(function() {
                                window.open(response.data.redirect_url, '_blank');
                            }, 1500);
                        } else {
                            showMessage(container, '复制失败: ' + response.data, 'error');
                            button.prop('disabled', false).html(originalHtml);
                        }
                    },
                    error: function(xhr, status, error) {
                        button.removeClass('loading');
                        showMessage(container, '请求失败，请重试 (' + error + ')', 'error');
                        button.prop('disabled', false).html(originalHtml);
                    }
                });
            });
            
            // 编辑按钮点击事件（添加确认）
            $(document).on('click', '.pw-cart-edit-btn', function(e) {
                var confirmed = confirm('确定要在后台编辑这个产品吗？这将在新窗口中打开产品编辑页面。');
                if (!confirmed) {
                    e.preventDefault();
                }
            });
            
            // 添加工具提示
            $(document).on('mouseenter', '.pw-cart-duplicate-btn', function() {
                $(this).attr('title', '复制此产品为新产品并跳转到后台编辑页面');
            });
            
            $(document).on('mouseenter', '.pw-cart-edit-btn', function() {
                $(this).attr('title', '在后台编辑此产品');
            });
            
            // 键盘支持
            $(document).on('keydown', '.pw-cart-duplicate-btn, .pw-cart-edit-btn', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    $(this).click();
                }
            });
        });
        ";

        wp_add_inline_script('jquery', $script);
    }
}