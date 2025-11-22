<?php

/**
 * 组合产品组件显示模块
 * 
 * 在组合产品页面显示所有组件及其包含的产品名称
 *
 * @since      1.0.0
 * @package    Pw_Admin
 * @subpackage Pw_Admin/public/modules
 */

class Pw_Composite_Products
{

    /**
     * 初始化模块
     */
    public function __construct()
    {
        // 在产品摘要区域显示组件列表
        add_action('woocommerce_single_product_summary', array($this, 'show_composite_components_list'), 40);
    }

    /**
     * 在组合产品页面上显示其所有组件及组件内的产品名称
     * 支持在父产品和子产品页面显示组合产品列表
     */
    public function show_composite_components_list()
    {
        // 确保我们只在单个产品页面执行
        if (!is_product()) {
            return;
        }

        // 获取全局产品对象
        global $product;

        $current_product_id = $product->get_id();
        $main_product_id = null;
        $child_product_ids = array();

        $all_ids = get_post_meta($current_product_id, 'pw_composite_all_product_ids', true);
        if (is_array($all_ids) && !empty($all_ids)) {
            $main_product_id = $current_product_id;
            $child_product_ids = array_values(array_diff(array_map('intval', $all_ids), array($main_product_id)));
        } else {
            $parent_id = get_post_meta($current_product_id, 'pw_composite_main_post_id', true);
            if ($parent_id) {
                $main_product_id = intval($parent_id);
                $all_ids = get_post_meta($main_product_id, 'pw_composite_all_product_ids', true);
                if (is_array($all_ids) && !empty($all_ids)) {
                    $child_product_ids = array_values(array_diff(array_map('intval', $all_ids), array($main_product_id)));
                }
            }
        }

        // 如果找到了组合产品信息，显示列表
        if ($main_product_id && (!empty($child_product_ids) || $main_product_id == $current_product_id)) {
            echo '<ul class="pw-composite-components">';

            // 输出主产品meta
            $pw_container_value = get_post_meta($main_product_id, 'pw_container_value', true);
            if ($pw_container_value) {
                $active_class = ($current_product_id == $main_product_id) ? ' class="active"' : '';
                if ($current_product_id == $main_product_id) {
                    echo '<li class="active">' . esc_html($pw_container_value) . '</li>';
                } else {
                    echo '<li><a href="' . get_permalink($main_product_id) . '">' . esc_html($pw_container_value) . '</a></li>';
                }
            }

            // 遍历子产品ID数组
            foreach ($child_product_ids as $child_id) {
                // 通过ID获取子产品对象
                $child_product = wc_get_product($child_id);

                if ($child_product) {
                    // 输出子产品的meta pw_container_value
                    $pw_container_value = get_post_meta($child_id, 'pw_container_value', true);
                    if ($pw_container_value) {
                        if ($current_product_id == $child_id) {
                            // 当前子产品显示为选中状态
                            echo '<li class="active">' . esc_html($pw_container_value) . '</li>';
                        } else {
                            echo '<li><a href="' . get_permalink($child_id) . '">' . esc_html($pw_container_value) . '</a></li>';
                        }
                    }
                }
            }
            echo '</ul>';
        }
    }


}
