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
        $grouped_product_id = null;
        $child_product_ids = array();
        
        // 检查当前产品是否为组合产品（父产品）
        $current_children = get_post_meta($current_product_id, '_children', true);
        
        if (!empty($current_children) && is_array($current_children)) {
            // 当前是父产品
            $grouped_product_id = $current_product_id;
            $child_product_ids = $current_children;
        } else {
            // 检查当前产品是否为子产品，使用现有的 pw_composite_main_post_id 字段
            $parent_id = get_post_meta($current_product_id, 'pw_composite_main_post_id', true);
            if ($parent_id) {
                // 当前是子产品，获取父产品信息
                $grouped_product_id = $parent_id;
                $child_product_ids = get_post_meta($parent_id, '_children', true);
                if (empty($child_product_ids) || !is_array($child_product_ids)) {
                    $child_product_ids = array();
                }
            }
        }

        // 如果找到了组合产品信息，显示列表
        if ($grouped_product_id && (!empty($child_product_ids) || $grouped_product_id == $current_product_id)) {
            echo '<ul class="pw-composite-components">';

            // 输出主产品meta
            $pw_container_value = get_post_meta($grouped_product_id, 'pw_container_value', true);
            if ($pw_container_value) {
                $active_class = ($current_product_id == $grouped_product_id) ? ' class="active"' : '';
                if ($current_product_id == $grouped_product_id) {
                    echo '<li class="active">' . esc_html($pw_container_value) . '</li>';
                } else {
                    echo '<li><a href="' . get_permalink($grouped_product_id) . '">' . esc_html($pw_container_value) . '</a></li>';
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
