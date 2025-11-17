<?php
/**
 * Cart Handler Module
 * 
 * @package    Pw_Admin
 * @subpackage Pw_Admin/public/modules
 * @author     PW <pw@pwcom>
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Pw_Cart_Handler {

    /**
     * Initialize hooks
     */
    public function __construct() {
        add_filter('woocommerce_add_to_cart_validation', array($this, 'validate_cart_products_before_add'), 10, 2);
        add_action('wp_ajax_add_customized_product_to_cart', array($this, 'add_customized_product_to_cart'));
        add_action('wp_ajax_nopriv_add_customized_product_to_cart', array($this, 'add_customized_product_to_cart'));
        add_action('wp_ajax_pw_has_blank_in_cart', array($this, 'has_blank_in_cart'));
        add_action('wp_ajax_nopriv_pw_has_blank_in_cart', array($this, 'has_blank_in_cart'));
        add_filter('woocommerce_get_item_data', array($this, 'display_custom_product_image'), 10, 2);
        add_filter('woocommerce_order_item_name', array($this, 'display_custom_image_in_order'), 10, 2);
        add_filter('woocommerce_display_item_meta', array($this, 'display_cart_images_properly'), 10, 3);
        add_action('woocommerce_after_cart_item_name', array($this, 'add_custom_cart_column_data_revised'), 10, 2);
        add_action('wp_footer', array($this, 'move_custom_cart_column_with_js_revised'));
        // 捕获前端提交的自定义数据并附加到购物车项
        add_filter('woocommerce_add_cart_item_data', array($this, 'append_post_data_to_cart_item_data'), 10, 3);

        // 在购物车的 Price 与 Subtotal 列中显示折扣信息
        add_filter('woocommerce_cart_item_price', array($this, 'render_cart_item_price_with_discount'), 10, 3);
        add_filter('woocommerce_cart_item_subtotal', array($this, 'render_cart_item_subtotal_with_discount'), 10, 3);
    }

    /**
     * Validate cart contents before adding new items
     */
    public function validate_cart_products_before_add($passed, $product_id) {
        if (!function_exists('WC') || WC()->cart === null) {
            return $passed;
        }

        $new_product_is_sync = get_post_meta($product_id, 'pw_isSyncProduct', true) === '1';

        if (WC()->cart->is_empty()) {
            return $passed;
        }

        foreach (WC()->cart->get_cart() as $cart_item) {
            $cart_product_id = $cart_item['product_id'];
            $cart_product_is_sync = get_post_meta($cart_product_id, 'pw_isSyncProduct', true) === '1';

            if ($cart_product_is_sync !== $new_product_is_sync) {
                if (function_exists('wc_add_notice')) {
                    wc_add_notice('定制产品不能与普通产品一起结算，请先清空购物车。', 'error');
                }
                return false;
            }
        }

        return $passed;
    }

    /**
     * 使用 woocommerce_add_cart_item_data 钩子捕获 $_POST 数据并附加到购物车项
     *
     * @param array $cart_item_data 现有购物车项目数据
     * @param int   $product_id     产品ID
     * @param int   $variation_id   变体ID（可选）
     * @return array 修改后的购物车项目数据
     */
    public function append_post_data_to_cart_item_data($cart_item_data, $product_id, $variation_id = 0) {
        // 确保 custom_data 子数组存在
        if (!isset($cart_item_data['custom_data']) || !is_array($cart_item_data['custom_data'])) {
            $cart_item_data['custom_data'] = array();
        }

        // 读取并清洗前端提交的字段
        $min_order_quantity = isset($_POST['pw_min_order_quantity']) ? intval(wp_unslash($_POST['pw_min_order_quantity'])) : null;
        $batch_quantity     = isset($_POST['pw_batch_quantity']) ? intval(wp_unslash($_POST['pw_batch_quantity'])) : null;
        $sell_in_batch      = isset($_POST['pw_sell_in_batch']) ? wp_unslash($_POST['pw_sell_in_batch']) : null;
        $is_sample_raw      = isset($_POST['pw_is_sample']) ? wp_unslash($_POST['pw_is_sample']) : null;
        $is_blank_raw       = isset($_POST['pw_is_blank']) ? wp_unslash($_POST['pw_is_blank']) : null;

        $discount_enabled_raw = isset($_POST['pw_discount_enabled']) ? wp_unslash($_POST['pw_discount_enabled']) : null;
        $current_discount_raw = isset($_POST['pw_current_discount']) ? wp_unslash($_POST['pw_current_discount']) : null;
        $discount_text        = isset($_POST['pw_discount_text']) ? sanitize_text_field(wp_unslash($_POST['pw_discount_text'])) : '';
        $quantity_discounts   = array();

        if (isset($_POST['pw_quantity_discounts'])) {
            $raw = wp_unslash($_POST['pw_quantity_discounts']);
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $quantity_discounts = $decoded;
            }
        }

        // 规范化布尔/数值
        $sell_in_batch_bool = null;
        if ($sell_in_batch !== null) {
            $sell_in_batch_bool = ($sell_in_batch === '1' || $sell_in_batch === 1 || $sell_in_batch === true || $sell_in_batch === 'true');
        }

        $is_sample = null;
        if ($is_sample_raw !== null) {
            $is_sample = ($is_sample_raw === '1' || $is_sample_raw === 1 || $is_sample_raw === true || $is_sample_raw === 'true') ? 1 : 0;
        }

        $is_blank = null;
        if ($is_blank_raw !== null) {
            $is_blank = ($is_blank_raw === '1' || $is_blank_raw === 1 || $is_blank_raw === true || $is_blank_raw === 'true') ? 1 : 0;
        }

        $discount_enabled = null;
        if ($discount_enabled_raw !== null) {
            $discount_enabled = ($discount_enabled_raw === '1' || $discount_enabled_raw === 1 || $discount_enabled_raw === true || $discount_enabled_raw === 'true') ? 1 : 0;
        }

        $current_discount = null;
        if ($current_discount_raw !== null && $current_discount_raw !== '') {
            $current_discount = floatval($current_discount_raw);
        }

        // 合并数据到 custom_data，不覆盖现有键
        $extra = array();
        if ($min_order_quantity !== null) { $extra['min_order_quantity'] = $min_order_quantity; }
        if ($batch_quantity !== null)     { $extra['batch_quantity'] = $batch_quantity; }
        if ($sell_in_batch_bool !== null) { $extra['sell_in_batch'] = $sell_in_batch_bool ? 1 : 0; }
        if ($is_sample !== null)          { $extra['is_sample'] = $is_sample; }
        if ($is_blank !== null)           { $extra['is_blank'] = $is_blank; }
        if ($discount_enabled !== null)   { $extra['discount_enabled'] = $discount_enabled; }
        if ($current_discount !== null)   { $extra['current_discount'] = $current_discount; }
        if ($discount_text !== '')        { $extra['discount_text'] = $discount_text; }
        if (!empty($quantity_discounts))  { $extra['quantity_discounts'] = $quantity_discounts; }

        // 合并到现有 custom_data
        $cart_item_data['custom_data'] = array_merge($cart_item_data['custom_data'], $extra);

        // 标记来源：产品页加购
        $cart_item_data['custom_data']['added_from'] = 'product';

        return $cart_item_data;
    }

    /**
     * Handle AJAX request for adding custom products to cart
     */
    public function add_customized_product_to_cart() {
        if (!isset($_POST['security']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['security'])), 'custom-product-nonce')) {
            wp_send_json_error('安全验证失败');
        }

        $product_id = isset($_POST['product_id']) ? intval($_POST['product_id']) : 0;
        if (!$product_id || !get_post_status($product_id)) {
            wp_send_json_error('无效的产品ID');
        }

        // 验证产品是否为 WooCommerce 产品
        $product = wc_get_product($product_id);
        if (!$product) {
            wp_send_json_error('产品不存在');
        }

        // 当产品类型为 grouped 时，改为将其一个子产品加入购物车
        if ($product->is_type('grouped')) {
            // 获取 grouped 子产品列表（存于 _children 元字段）
            $children = get_post_meta($product_id, '_children', true);
            if (empty($children) || !is_array($children)) {
                wp_send_json_error('组合产品没有可购买的子产品');
            }

            // 优先选择标记为空白件的子产品（pw_blank_item = 1）
            $target_child_id = null;
            foreach ($children as $child_id) {
                $blank_item = get_post_meta($child_id, 'pw_blank_item', true);
                if ($blank_item === '1' || $blank_item === 1 || $blank_item === true) {
                    $target_child_id = (int)$child_id;
                    break;
                }
            }

            // 若未找到空白件，则回退到第一个子产品
            if (!$target_child_id) {
                $target_child_id = (int)reset($children);
            }

            // 使用子产品进行后续可购买与库存校验
            $child_product = wc_get_product($target_child_id);
            if (!$child_product || !$child_product->is_purchasable()) {
                wp_send_json_error('组合子产品不可购买');
            }
            if (!$child_product->is_in_stock()) {
                wp_send_json_error('组合子产品缺货');
            }

            // 将后续加入购物车的目标产品替换为子产品
            $product_id = $target_child_id;
            $product = $child_product;
        }

        // 非 grouped 产品：常规可购买校验
        if (!$product->is_purchasable()) {
            wp_send_json_error('产品不可购买');
        }

        // 检查库存
        if (!$product->is_in_stock()) {
            wp_send_json_error('产品缺货');
        }

        $quantity = isset($_POST['quantity']) ? intval($_POST['quantity']) : 1;
        if ($quantity < 1) {
            $quantity = 1;
        }

        if ($this->cart_has_blank()) {
            wp_send_json_error('购物车中存在空白件商品，当前操作不可加入');
        }

        $custom_image = isset($_POST['custom_image']) ? wp_kses_post(wp_unslash($_POST['custom_image'])) : '';
        // 多视图图片（JSON 字符串）：[{ id, name, images: [dataURL, ...] }, ...]
        $view_images_json = isset($_POST['pw_view_images']) ? wp_unslash($_POST['pw_view_images']) : '';
        $view_images_data = array();
        if (!empty($view_images_json)) {
            $decoded = json_decode($view_images_json, true);
            if (is_array($decoded)) {
                $view_images_data = $decoded;
            }
        }
        $color = isset($_POST['color']) ? sanitize_text_field(wp_unslash($_POST['color'])) : '';
        $color_name = isset($_POST['color_name']) ? sanitize_text_field(wp_unslash($_POST['color_name'])) : '默认颜色';
        $color_value = isset($_POST['color_value']) ? sanitize_text_field(wp_unslash($_POST['color_value'])) : '';
        $variant_id = isset($_POST['variant_id']) ? sanitize_text_field(wp_unslash($_POST['variant_id'])) : '';

        // 必须提供至少一种图片数据：单图或多视图
        if (empty($custom_image) && empty($view_images_data)) {
            wp_send_json_error('缺少自定义图片数据');
        }
        // 如提供单图，校验格式
        if (!empty($custom_image) && (strpos($custom_image, 'data:image/') !== 0 || strpos($custom_image, ';base64,') === false)) {
            wp_send_json_error('无效的图片数据格式');
        }

        $upload_dir = wp_upload_dir();
        $custom_dir = $upload_dir['basedir'] . '/custom-products';

        if (!file_exists($custom_dir)) {
            if (!wp_mkdir_p($custom_dir)) {
                wp_send_json_error('无法创建自定义图片目录');
            }
        }

        // 保存图片（多视图优先，失败时回退单图）
        $saved_view_images_meta = array();
        $first_saved_image_url = '';
        $saved_file_paths = array();

        if (!empty($view_images_data)) {
            foreach ($view_images_data as $view_idx => $view_item) {
                $view_id   = isset($view_item['id']) ? sanitize_text_field($view_item['id']) : '';
                $view_name = isset($view_item['name']) ? sanitize_text_field($view_item['name']) : ($view_id ?: ('视图 ' . ($view_idx + 1)));
                $images    = (isset($view_item['images']) && is_array($view_item['images'])) ? $view_item['images'] : array();

                $urls = array();
                foreach ($images as $img_idx => $img_dataurl) {
                    if (!is_string($img_dataurl) || strpos($img_dataurl, 'data:image/') !== 0 || strpos($img_dataurl, ';base64,') === false) {
                        continue;
                    }
                    $filename  = 'custom-' . $product_id . '-' . sanitize_title($view_name) . '-' . ($img_idx + 1) . '-' . uniqid() . '.png';
                    $file_path = $custom_dir . '/' . $filename;
                    $image_data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $img_dataurl));
                    if ($image_data === false) { continue; }
                    if (file_put_contents($file_path, $image_data) === false) { continue; }
                    $saved_file_paths[] = $file_path;
                    $url = $upload_dir['baseurl'] . '/custom-products/' . $filename;
                    $urls[] = $url;
                    if ($first_saved_image_url === '') { $first_saved_image_url = $url; }
                }
                if (!empty($urls)) {
                    $saved_view_images_meta[] = array(
                        'view_id'   => $view_id,
                        'view_name' => $view_name,
                        'images'    => $urls,
                    );
                }
            }
        }

        if (empty($saved_view_images_meta)) {
            // 回退保存单图
            $filename  = 'custom-' . $product_id . '-' . uniqid() . '.png';
            $file_path = $custom_dir . '/' . $filename;
            $image_data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $custom_image));
            if ($image_data === false) {
                wp_send_json_error('解码图片数据失败');
            }
            if (file_put_contents($file_path, $image_data) === false) {
                wp_send_json_error('保存自定义图片失败');
            }
            $saved_file_paths[] = $file_path;
            $first_saved_image_url = $upload_dir['baseurl'] . '/custom-products/' . $filename;
        }

        // 构建购物车数据
        $cart_item_data = array(
            'custom_data' => array(
                'custom_image' => $first_saved_image_url,
                'color'        => $color,
                'color_name'   => $color_name,
                'color_value'  => $color_value,
                'variant_id'   => $variant_id,
                'added_from'   => 'design',
            )
        );
        if (!empty($saved_view_images_meta)) {
            $cart_item_data['custom_data']['view_images'] = $saved_view_images_meta;
        }

        if (!function_exists('WC') || WC()->cart === null) {
            foreach ($saved_file_paths as $p) { @unlink($p); }
            wp_send_json_error('购物车功能不可用');
        }

        $cart_item_key = WC()->cart->add_to_cart($product_id, $quantity, 0, array(), $cart_item_data);

        if ($cart_item_key) {
            wp_send_json_success(array(
                'message' => '产品已成功添加到购物车',
                'cart_item_key' => $cart_item_key,
                'product_id' => $product_id,
                'quantity' => $quantity
            ));
        } else {
            // 获取 WooCommerce 错误信息
            $notices = wc_get_notices('error');
            $error_message = '添加到购物车失败';
            if (!empty($notices)) {
                $error_message .= ': ' . implode(', ', array_column($notices, 'notice'));
                wc_clear_notices();
            }
            foreach ($saved_file_paths as $p) { @unlink($p); }
            wp_send_json_error($error_message);
        }
    }

    public function has_blank_in_cart() {
        $has_blank = $this->cart_has_blank();
        wp_send_json_success(array('has_blank' => $has_blank));
    }

    private function cart_has_blank() {
        if (!function_exists('WC') || WC()->cart === null) {
            return false;
        }
        foreach (WC()->cart->get_cart() as $cart_item) {
            if (isset($cart_item['custom_data']) && isset($cart_item['custom_data']['is_blank'])) {
                if (intval($cart_item['custom_data']['is_blank']) === 1) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Display custom product image and color in cart
     */
    public function display_custom_product_image($item_data, $cart_item) {
        // if (isset($cart_item['custom_data']) && !empty($cart_item['custom_data']['view_images']) && is_array($cart_item['custom_data']['view_images'])) {
        //     // 优先显示多视图
        //     $views_meta = $cart_item['custom_data']['view_images'];
        //     $value_html = '';
        //     foreach ($views_meta as $vm) {
        //         $vname = isset($vm['view_name']) ? esc_html($vm['view_name']) : (isset($vm['view_id']) ? esc_html($vm['view_id']) : 'View');
        //         $value_html .= '<div style="margin:6px 0; text-align:center;">';
        //         $value_html .= '<div style="font-size:12px; color:#555; margin-bottom:4px;">' . $vname . '</div>';
        //         if (!empty($vm['images']) && is_array($vm['images'])) {
        //             foreach ($vm['images'] as $url) {
        //                 $value_html .= '<img src="' . esc_url($url) . '" alt="' . esc_attr($vname) . '" style="max-width:100px; height:auto; border:1px solid #ddd; margin:2px; border-radius:4px; background:#fff; padding:3px;">';
        //             }
        //         }
        //         $value_html .= '</div>';
        //     }
        //     $item_data[] = array(
        //         'key'     => '定制设计',
        //         'value'   => wp_kses_post($value_html),
        //         'display' => ''
        //     );
        // } elseif (isset($cart_item['custom_data']) && !empty($cart_item['custom_data']['custom_image'])) {
        //     // 回退显示单图
        //     $image_url = esc_url($cart_item['custom_data']['custom_image']);
        //     $item_data[] = array(
        //         'key'     => '定制设计',
        //         'value'   => sprintf(
        //             '<img src="%s" alt="定制设计" style="max-width: 100px; height: auto; display: block; border: 1px solid #ddd; padding: 5px; background: #fff;">',
        //             $image_url
        //         ),
        //         'display' => ''
        //     );
        // }
        
        // 显示选择的颜色信息
        if (isset($cart_item['custom_data']) && !empty($cart_item['custom_data']['color_name'])) {
            $color_name = esc_html($cart_item['custom_data']['color_name']);
            $color_value = isset($cart_item['custom_data']['color_value']) ? esc_attr($cart_item['custom_data']['color_value']) : '';
            
            $color_display = $color_name;
            // if (!empty($color_value)) {
            //     $color_display = sprintf(
            //         '%s <span style="display: inline-block; width: 16px; height: 16px; background-color: %s; border: 1px solid #ddd; border-radius: 3px; vertical-align: middle; margin-left: 5px;"></span>',
            //         $color_name,
            //         $color_value
            //     );
            // }
            
            $item_data[] = array(
                'key'     => 'Color',
                'value'   => $color_display,
                'display' => ''
            );
        }

        // 显示起订量、批量、样品/空白、折扣阶梯等信息
        if (isset($cart_item['custom_data']) && is_array($cart_item['custom_data'])) {
            $custom = $cart_item['custom_data'];

            // if (isset($custom['min_order_quantity'])) {
            //     $item_data[] = array(
            //         'key'     => '起订量',
            //         'value'   => esc_html(intval($custom['min_order_quantity'])),
            //         'display' => ''
            //     );
            // }
            // if (isset($custom['batch_quantity'])) {
            //     $item_data[] = array(
            //         'key'     => '批数量',
            //         'value'   => esc_html(intval($custom['batch_quantity'])),
            //         'display' => ''
            //     );
            // }
            // 合并为 Order Type 字段
            $order_type = 'Bulk'; // 默认为 Bulk
            if (isset($custom['is_sample']) && intval($custom['is_sample']) === 1) {
                $order_type = 'Sample';
            }
            
            $item_data[] = array(
                'key'     => 'Order Type',
                'value'   => $order_type,
                'display' => ''
            );

            // 根据 added_from 显示  Customization
            $added_from = '';
            if (isset($cart_item['custom_data']) && is_array($cart_item['custom_data'])) {
                $added_from = isset($cart_item['custom_data']['added_from']) ? $cart_item['custom_data']['added_from'] : '';
            }
            $is_design = ($added_from === 'design');
            $label = $is_design ? 'Yes' : 'No';
            $item_data[] = array(
                'key'     => 'Customization',
                'value'   => $label,
                'display' => ''
            );

            // if (isset($custom['is_blank'])) {
            //     $item_data[] = array(
            //         'key'     => '空白件',
            //         'value'   => esc_html((intval($custom['is_blank']) === 1) ? '是' : '否'),
            //         'display' => ''
            //     );
            // }

            // if (isset($custom['discount_enabled'])) {
            //     $item_data[] = array(
            //         'key'     => '折扣启用',
            //         'value'   => esc_html((intval($custom['discount_enabled']) === 1) ? '是' : '否'),
            //         'display' => ''
            //     );
            // }
            // if (!empty($custom['discount_text'])) {
            //     $item_data[] = array(
            //         'key'     => '当前折扣',
            //         'value'   => esc_html($custom['discount_text']),
            //         'display' => ''
            //     );
            // } elseif (isset($custom['current_discount'])) {
            //     $rate = floatval($custom['current_discount']);
            //     if ($rate > 0 && $rate < 1) {
            //         $percent_off = round((1 - $rate) * 100);
            //         $item_data[] = array(
            //             'key'     => '当前折扣',
            //             'value'   => esc_html($percent_off . '% OFF'),
            //             'display' => ''
            //         );
            //     }
            // }

            // if (!empty($custom['quantity_discounts']) && is_array($custom['quantity_discounts'])) {
            //     $items_html = '';
            //     foreach ($custom['quantity_discounts'] as $step) {
            //         $from = isset($step['range_from']) ? intval($step['range_from']) : null;
            //         $disc = isset($step['discount']) ? floatval($step['discount']) : null;
            //         if ($from !== null && $disc !== null && $disc > 0 && $disc < 1) {
            //             $off = round((1 - $disc) * 100);
            //             $items_html .= '<li>≥' . esc_html($from) . ': ' . esc_html($off) . '% OFF</li>';
            //         }
            //     }
            //     if ($items_html !== '') {
            //         $value_html = '<ul style="margin:0; padding-left:16px;">' . $items_html . '</ul>';
            //         $item_data[] = array(
            //             'key'     => '折扣阶梯',
            //             'value'   => wp_kses_post($value_html),
            //             'display' => ''
            //         );
            //     }
            // }
        }
        
        if (!isset($cart_item['custom_data']) || (empty($cart_item['custom_data']['custom_image']) && empty($cart_item['custom_data']['view_images']))) {
            $pw_isSyncProduct = get_post_meta($cart_item['product_id'], 'pw_isSyncProduct', true);
            if ($pw_isSyncProduct == '1') {
                $item_data[] = array(
                    'key'     => '定制设计',
                    'value'   => '无',
                    'display' => '',
                );
                $item_data[] = array(
                    'key'     => '颜色',
                    'value'   => '未选',
                    'display' => '',
                );
            }
        }
        return $item_data;
    }

    /**
     * Display custom image in order
     */
    public function display_custom_image_in_order($item_name, $item) {
        $custom_data = $item->get_meta('custom_data');
        
        if (!empty($custom_data) && !empty($custom_data['view_images']) && is_array($custom_data['view_images'])) {
            $views_meta = $custom_data['view_images'];
            $html = '<div style="margin-top:10px; text-align:center;">';
            foreach ($views_meta as $vm) {
                $vname = isset($vm['view_name']) ? esc_html($vm['view_name']) : (isset($vm['view_id']) ? esc_html($vm['view_id']) : 'View');
                $html .= '<div style="margin:6px 0;">';
                $html .= '<div style="font-size:12px; color:#555; margin-bottom:4px;">' . $vname . '</div>';
                if (!empty($vm['images']) && is_array($vm['images'])) {
                    foreach ($vm['images'] as $url) {
                        $html .= '<img src="' . esc_url($url) . '" alt="' . esc_attr($vname) . '" style="max-width:100px; height:auto; border:1px solid #ddd; border-radius:4px; padding:3px; background:#fff; margin:2px;">';
                    }
                }
                $html .= '</div>';
            }
            $html .= '</div>';
            $item_name .= $html;
        } elseif (!empty($custom_data) && !empty($custom_data['custom_image'])) {
            $image_url = esc_url($custom_data['custom_image']);
            $item_name .= sprintf(
                '<div style="margin-top: 10px;"><img src="%s" alt="定制设计" style="max-width: 100px; height: auto; display: block; border: 1px solid #ddd; padding: 5px; background: #fff;"></div>',
                $image_url
            );
        }
        
        return $item_name;
    }

    /**
     * Ensure HTML in cart item meta is displayed correctly
     */
    public function display_cart_images_properly($html, $item, $args) {
        $strings = array();
        $html    = '';

        foreach ($item->get_formatted_meta_data($args['hideprefix'], true) as $meta_id => $meta) {
            $key = $meta->display_key;
            $value = $meta->display_value;

            if ($meta->key === 'custom_data' && $key === '定制设计') {
                $value = $meta->value;
            } else if ($meta->key === 'custom_data' && $key === '颜色') {
                $value = $meta->value;
            } else {
                $value = $args['autop'] ? wp_kses_post($value) : wp_kses_post(make_clickable(trim($value)));
                $key = $args['autop'] ? wp_kses_post($key) : wp_kses_post(trim($key));
            }

            $strings[] = '<strong class="' . esc_attr($args['label_class']) . '">' . $key . $args['label_before'] . ':</strong> ' . $value . $args['label_after'];
        }

        if ($strings) {
            $html = $args['before'] . implode($args['separator'], $strings) . $args['after'];
        }

        return $html;
    }

    /**
     * Add custom cart column data after cart item name
     */
    public function add_custom_cart_column_data_revised($cart_item, $cart_item_key) {
        $_product = $cart_item['data'];
        $product_id = $cart_item['product_id'];

        $custom_html = '';

        if (isset($cart_item['custom_data']['view_images']) && is_array($cart_item['custom_data']['view_images']) && !empty($cart_item['custom_data']['view_images'])) {
            $views_meta = $cart_item['custom_data']['view_images'];
            $parts = array();
            foreach ($views_meta as $vm) {
                $vname = isset($vm['view_name']) ? esc_html($vm['view_name']) : (isset($vm['view_id']) ? esc_html($vm['view_id']) : 'View');
                $html = '<div class="pw-design-view" style="margin:8px 0;">';
                $html .= '<div class="pw-design-view-name" style="font-size:12px; color:#444; margin-bottom:4px;">' . $vname . '</div>';
                $html .= '<div class="pw-design-view-images" style="display:flex; flex-wrap:wrap; gap:4px; justify-content:center;">';
                if (!empty($vm['images']) && is_array($vm['images'])) {
                    foreach ($vm['images'] as $url) {
                        $html .= '<img src="' . esc_url($url) . '" alt="' . esc_attr($vname) . '" style="max-width:80px; height:auto; border-radius:4px; border:1px solid #ddd; padding:3px; background:#fff;">';
                    }
                }
                $html .= '</div></div>';
                $parts[] = $html;
            }
            $custom_html = '<div class="pw-design-preview">' . implode('', $parts) . '</div>';
        } else {
            // 无设计数据或来源为产品页，显示 Not Available
            $added_from = isset($cart_item['custom_data']['added_from']) ? $cart_item['custom_data']['added_from'] : '';
            if ($added_from === 'product' || empty($added_from)) {
                $custom_html = '<span class="pw-design-na">Not Available</span>';
            }
        }

        echo '<div class="hidden-custom-data" style="display:none;">' . $custom_html . '</div>';
    } 

    /**
     * Move custom cart column with JavaScript
     */
    public function move_custom_cart_column_with_js_revised() {
        if (!is_cart()) {
            return;
        }
        ?>
        <script type="text/javascript">
        jQuery(function($) {
            var $headerRow = $('.woocommerce-cart-form .shop_table thead tr');
            if ($headerRow.length && !$('.th-custom-column').length) {
                $headerRow.find('.product-price').before('<th class="th-custom-column">Design</th>');
            }

            $('.woocommerce-cart-form .cart_item').each(function() {
                var $row = $(this);
                var $hiddenData = $row.find('.hidden-custom-data');
                if ($hiddenData.length && !$row.find('.td-custom-column').length) {
                    var $newCell = $('<td class="td-custom-column" data-title="Design"></td>');
                    $row.find('.product-price').before($newCell);
                    $newCell.html($hiddenData.html());
                    $hiddenData.remove();
                }
            });
        });
        </script>
        <style>
        .th-custom-column,
        .td-custom-column {
            text-align: center;
        }
        </style>
        <?php
    }

    /**
     * 在购物车 Price 列显示折扣后的价格（并保留原价）
     *
     * @param string $price_html 原始价格HTML
     * @param array  $cart_item  购物车项
     * @param string $cart_item_key 购物车项键
     * @return string 处理后的价格HTML
     */
    public function render_cart_item_price_with_discount($price_html, $cart_item, $cart_item_key) {
        // 仅对包含折扣信息的购物车项处理
        if (!isset($cart_item['custom_data']) || !is_array($cart_item['custom_data'])) {
            return $price_html;
        }

        $custom = $cart_item['custom_data'];
        $rate = $this->get_discount_rate_from_custom($custom);
        if ($rate === null) {
            return $price_html;
        }

        // 解析产品与税务显示价
        $product = isset($cart_item['data']) ? $cart_item['data'] : null;
        if (!$product || !is_object($product)) {
            return $price_html;
        }

        $original_price = wc_get_price_to_display($product);
        $discounted_price = $original_price * $rate;

        // 使用 WooCommerce 的格式化函数生成促销价结构
        $formatted = wc_format_sale_price(wc_price($original_price), wc_price($discounted_price));

        // 追加折扣标签
        $label = $this->get_discount_label_from_custom($custom);
        if (!empty($label)) {
            $formatted .= ' <small class="pwca-discount-hint">' . esc_html($label) . '</small>';
        }

        return $formatted;
    }

    /**
     * 在购物车 Subtotal 列显示折扣后的小计（并保留原小计）
     *
     * @param string $subtotal_html 原始小计HTML
     * @param array  $cart_item  购物车项
     * @param string $cart_item_key 购物车项键
     * @return string 处理后的小计HTML
     */
    public function render_cart_item_subtotal_with_discount($subtotal_html, $cart_item, $cart_item_key) {
        if (!isset($cart_item['custom_data']) || !is_array($cart_item['custom_data'])) {
            return $subtotal_html;
        }

        $custom = $cart_item['custom_data'];
        $rate = $this->get_discount_rate_from_custom($custom);
        if ($rate === null) {
            return $subtotal_html;
        }

        $product = isset($cart_item['data']) ? $cart_item['data'] : null;
        if (!$product || !is_object($product)) {
            return $subtotal_html;
        }

        $qty = isset($cart_item['quantity']) ? intval($cart_item['quantity']) : 1;
        if ($qty <= 0) { $qty = 1; }

        $unit_display_price = wc_get_price_to_display($product);
        $original_line_total = $unit_display_price * $qty;
        $discounted_line_total = $original_line_total * $rate;

        $formatted = wc_format_sale_price(wc_price($original_line_total), wc_price($discounted_line_total));

        $label = $this->get_discount_label_from_custom($custom);
        if (!empty($label)) {
            $formatted .= ' <small class="pwca-discount-hint">' . esc_html($label) . '</small>';
        }

        return $formatted;
    }

    /**
     * 从购物车项的 custom_data 中解析折扣率（0~1）
     * 优先使用 current_discount；若不存在且 discount_text 含有百分比，则解析百分比。
     *
     * @param array $custom 购物车项中的 custom_data
     * @return float|null 折扣率，未解析到返回 null
     */
    private function get_discount_rate_from_custom($custom) {
        if (isset($custom['current_discount'])) {
            $rate = floatval($custom['current_discount']);
            if ($rate > 0 && $rate < 1) {
                return $rate;
            }
        }
        if (!empty($custom['discount_text']) && is_string($custom['discount_text'])) {
            // 解析形如 "15% OFF" 的折扣文案
            if (preg_match('/(\d+)\s*%/i', $custom['discount_text'], $m)) {
                $off = floatval($m[1]);
                if ($off > 0 && $off < 100) {
                    return 1 - ($off / 100);
                }
            }
        }
        return null;
    }

    /**
     * 根据 custom_data 生成折扣标签文案
     *
     * @param array $custom
     * @return string|null 折扣标签
     */
    private function get_discount_label_from_custom($custom) {
        if (!empty($custom['discount_text'])) {
            return (string) $custom['discount_text'];
        }
        if (isset($custom['current_discount'])) {
            $rate = floatval($custom['current_discount']);
            if ($rate > 0 && $rate < 1) {
                $percent_off = round((1 - $rate) * 100);
                return $percent_off . '% OFF';
            }
        }
        return null;
    }
}