<?php
/**
 * Product Action Buttons Module
 * 
 * @package    Pw_Admin
 * @subpackage Pw_Admin/public/modules
 * @author     PW <pw@pwcom>
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Pw_Product_Action_Buttons {

    /**
     * Initialize hooks
     */
    public function __construct() {
        add_action('pw_admin_single_product_custom_content', array($this, 'display_action_buttons'), 100);
    }

    /**
     * Display action buttons (Online Customization & Add to Cart)
     */
    public function display_action_buttons() {
        if (!is_super_admin()) {
            return;
        }

        global $product;
        if (!is_a($product, 'WC_Product')) {
            return;
        }

        $product_id = $product->get_id();
        $pw_isSyncProduct = get_post_meta($product_id, 'pw_isSyncProduct', true);
        
        if ($pw_isSyncProduct !== '1') {
            return;
        }

        // 获取产品信息
        $product_name = $product->get_name();
        $product_price = $product->get_price();
        $product_permalink = get_permalink($product_id);
        
        // 获取定制页面URL
        $customize_url = home_url('/pwcanvas/?product_id=' . $product_id);

        ?>
        
        <div class="pw-product-action-buttons">
            <div class="action-buttons-container">
                
                
                <button type="button" class="btn-add-to-cart" data-product-id="<?php echo esc_attr($product_id); ?>" data-product-name="<?php echo esc_attr($product_name); ?>" data-product-price="<?php echo esc_attr($product_price); ?>">
                    
                Add to Car

</button>
<button type="button" class="btn-customize" onclick="window.open('<?php echo esc_url($customize_url); ?>', '_blank')">
                Customizing Now                </button>
            </div>
        </div>
        <script>
        jQuery(document).ready(function($) {
            $('.btn-add-to-cart').on('click', function() {
                const $button = $(this);
                const productId = $button.data('product-id');
                const productName = $button.data('product-name');
                const productPrice = $button.data('product-price');

                // 防止重复点击
                if ($button.hasClass('loading')) {
                    return;
                }

                // 显示加载状态
                $button.addClass('loading').text('In progress');

                // 获取当前数量
                let quantity = 1;
                const quantityInput = $('#quantity-input');
                if (quantityInput.length > 0) {
                    quantity = parseInt(quantityInput.val()) || 1;
                } else {
                    const wooQuantityInput = $('input[name="quantity"]');
                    if (wooQuantityInput.length > 0) {
                        quantity = parseInt(wooQuantityInput.val()) || 1;
                    }
                }

                // 添加到购物车
                $.ajax({
                    url: wc_add_to_cart_params.ajax_url,
                    type: 'POST',
                    data: {
                        action: 'woocommerce_add_to_cart',
                        product_id: productId,
                        quantity: quantity
                    },
                    success: function(response) {
                        if (response.error && response.error === true) {
                            // 显示错误信息
                            alert('Add to Car：' + (response.message || 'Error'));
                            $button.removeClass('loading').html('Add to Car');
                        } else {
                            // 成功添加到购物车
                            $button.removeClass('loading').addClass('success').html('Done');
                            
                            // 触发购物车更新事件
                            // $(document.body).trigger('added_to_cart', [response.fragments, response.cart_hash, $button]);
                            
                            // 更新购物车小计
                            if (response.fragments) {
                                $.each(response.fragments, function(key, value) {
                                    $(key).replaceWith(value);
                                });
                            }

                            // 2秒后恢复原状态
                            setTimeout(function() {
                                $button.removeClass('success').html('Add to Car');
                            }, 2000);
                        }
                    },
                    error: function() {
                        alert('error');
                        $button.removeClass('loading').html('Add to Car');
                    }
                });
            });
        });
        </script>
        <?php
    }
}