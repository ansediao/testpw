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
        add_filter('woocommerce_get_item_data', array($this, 'display_custom_product_image'), 10, 2);
        add_filter('woocommerce_order_item_name', array($this, 'display_custom_image_in_order'), 10, 2);
        add_filter('woocommerce_display_item_meta', array($this, 'display_cart_images_properly'), 10, 3);
        add_action('woocommerce_after_cart_item_name', array($this, 'add_custom_cart_column_data_revised'), 10, 2);
        add_action('wp_footer', array($this, 'move_custom_cart_column_with_js_revised'));
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

        $custom_image = isset($_POST['custom_image']) ? wp_kses_post(wp_unslash($_POST['custom_image'])) : '';
        $color = isset($_POST['color']) ? sanitize_text_field(wp_unslash($_POST['color'])) : '';

        if (empty($custom_image)) {
            wp_send_json_error('缺少自定义图片数据');
        }

        if (strpos($custom_image, 'data:image/') !== 0 || strpos($custom_image, ';base64,') === false) {
            wp_send_json_error('无效的图片数据格式');
        }

        $upload_dir = wp_upload_dir();
        $custom_dir = $upload_dir['basedir'] . '/custom-products';

        if (!file_exists($custom_dir)) {
            if (!wp_mkdir_p($custom_dir)) {
                wp_send_json_error('无法创建自定义图片目录');
            }
        }

        $filename = 'custom-' . $product_id . '-' . uniqid() . '.png';
        $file_path = $custom_dir . '/' . $filename;

        $image_data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $custom_image));

        if ($image_data === false) {
            wp_send_json_error('解码图片数据失败');
        }

        if (file_put_contents($file_path, $image_data) === false) {
            wp_send_json_error('保存自定义图片失败');
        }

        $image_url = $upload_dir['baseurl'] . '/custom-products/' . $filename;

        $cart_item_data = array(
            'custom_data' => array(
                'custom_image' => $image_url,
                'color' => $color
            )
        );

        if (!function_exists('WC') || WC()->cart === null) {
            unlink($file_path);
            wp_send_json_error('购物车功能不可用');
        }

        $cart_item_key = WC()->cart->add_to_cart($product_id, 1, 0, array(), $cart_item_data);

        if ($cart_item_key) {
            wp_send_json_success(array(
                'message' => '产品已成功添加到购物车',
                'cart_item_key' => $cart_item_key
            ));
        } else {
            unlink($file_path);
            wp_send_json_error('添加到购物车失败');
        }
    }

    /**
     * Display custom product image and color in cart
     */
    public function display_custom_product_image($item_data, $cart_item) {
        if (isset($cart_item['custom_data']) && !empty($cart_item['custom_data']['custom_image'])) {
            $image_url = esc_url($cart_item['custom_data']['custom_image']);
            $item_data[] = array(
                'key'     => '定制设计',
                'value'   => sprintf(
                    '<img src="%s" alt="定制设计" style="max-width: 100px; height: auto; display: block; border: 1px solid #ddd; padding: 5px; background: #fff;">',
                    $image_url
                ),
                'display' => ''
            );

            if (!empty($cart_item['custom_data']['color'])) {
                $color_value = esc_attr($cart_item['custom_data']['color']);
                $item_data[] = array(
                    'key'     => '颜色',
                    'value'   => sprintf(
                        '<span style="display:inline-block; width:20px; height:20px; background-color:%s; vertical-align:middle; margin-right:5px; border: 1px solid #ccc;"></span>%s',
                        $color_value,
                        esc_html(ucfirst($color_value))
                    ),
                    'display' => ''
                );
            }
        } else {
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
        
        if (!empty($custom_data) && !empty($custom_data['custom_image'])) {
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

        if (isset($cart_item['custom_data']['custom_image']) && !empty($cart_item['custom_data']['custom_image'])) {
            $custom_html = '<img src="' . esc_url($cart_item['custom_data']['custom_image']) . '" style="max-width:100px; height:auto; border-radius: 4px;">';
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
}