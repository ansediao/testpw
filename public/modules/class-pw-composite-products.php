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
     */
    public function show_composite_components_list()
    {
        // 确保我们只在单个产品页面执行
        if (!is_product()) {
            return;
        }

        // 获取全局产品对象
        global $product;

        $grouped_product_id = $product->id;
        $child_product_ids = get_post_meta($grouped_product_id, '_children', true);

        // 检查是否成功获取到了ID数组
        if (! empty($child_product_ids) && is_array($child_product_ids)) {

            echo '<ul class="pw-composite-components">';

            //输出主产品meta
            $pw_container_value = get_post_meta($grouped_product_id, 'pw_container_value', true);
            if ($pw_container_value) {
                echo '<li class="active">' . $pw_container_value . '</li>';

            }

            // 遍历子产品ID数组
            foreach ($child_product_ids as $child_id) {
                // 通过ID获取子产品对象
                $child_product = wc_get_product($child_id);

                if ($child_product) {
                    // 输出子产品的meta pw_container_value
                    $pw_container_value = get_post_meta($child_id, 'pw_container_value', true);
                    if ($pw_container_value) {
                        echo '<li><a href="' . get_permalink($child_id) . '">' . $pw_container_value . '</a></li>';

                    }
                }
            }
            echo '</ul>';
        }
    }
}
