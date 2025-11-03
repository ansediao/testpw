<?php
/**
 * Review order template for checkout
 * 
 * @package PW_Admin
 */

defined( 'ABSPATH' ) || exit;
?>

<div class="pwca-checkout-review-container">
    <div class="pwca-checkout-review-wrapper">
        <!-- 左侧订单信息区域 -->
        <div class="pwca-order-summary">
            <h3 class="pwca-order-title">YOUR ORDER</h3>
            
            <!-- 产品信息 -->
            <div class="pwca-order-items">
                <?php
                do_action( 'woocommerce_review_order_before_cart_contents' );
                
                foreach ( WC()->cart->get_cart() as $cart_item_key => $cart_item ) {
                    $_product = apply_filters( 'woocommerce_cart_item_product', $cart_item['data'], $cart_item, $cart_item_key );
                    
                    if ( $_product && $_product->exists() && $cart_item['quantity'] > 0 && apply_filters( 'woocommerce_checkout_cart_item_visible', true, $cart_item, $cart_item_key ) ) {
                        ?>
                        <div class="pwca-order-item">
                            <div class="pwca-item-details">
                                <span class="pwca-item-name">
                                    <?php echo wp_kses_post( apply_filters( 'woocommerce_cart_item_name', $_product->get_name(), $cart_item, $cart_item_key ) ); ?>
                                    <?php echo apply_filters( 'woocommerce_checkout_cart_item_quantity', ' <strong class="product-quantity">' . sprintf( '&times;&nbsp;%s', $cart_item['quantity'] ) . '</strong>', $cart_item, $cart_item_key ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
                                </span>
                             
                            </div>
                            <div class="pwca-item-price">
                                <?php echo apply_filters( 'woocommerce_cart_item_subtotal', WC()->cart->get_product_subtotal( $_product, $cart_item['quantity'] ), $cart_item, $cart_item_key ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
                            </div>
                        </div>
                        <?php
                    }
                }
                
                do_action( 'woocommerce_review_order_after_cart_contents' );
                ?>
            </div>
            
            <!-- 小计 -->
            <div class="pwca-order-subtotal">
                <div class="pwca-subtotal-row">
                    <div class="pwca-subtotal-label">Subtotal</div>
                    <div class="pwca-subtotal-amount"><?php wc_cart_totals_subtotal_html(); ?></div>
                </div>
            </div>
            
            <!-- 运费（未选择前不显示；忽略历史会话，严格前端控制显示） -->
            <div class="pwca-order-shipping" style="display:none;">
                <div class="pwca-shipping-row"></div>
            </div>
           
            
          
            
            <!-- 总计 -->
            <div class="pwca-order-total">
                <div class="pwca-total-row">
                    <div class="pwca-total-label">Total</div>
                    <div class="pwca-total-amount"><?php wc_cart_totals_order_total_html(); ?></div>
                </div>
            </div>
        </div>
        
        <!-- 右侧配送方式选择区域 -->
        <div class="pwca-shipping-section">
            
        </div>
    </div>
</div>

<script type="text/javascript">
jQuery(document).ready(function($) {
    // 注意：总计区域由 WooCommerce 的 wc fragments 更新，包含运费
    // 我们只负责左侧自定义运费行的显示与内容

    // 更新左侧订单区域的运费显示
    function updatePwcaShippingRow(service, cost) {
        var html = '' +
            '<label class="pwca-selected-shipping">' +
                '<input type="radio" checked disabled /> ' +
                '<span class="pwca-shipping-name">' + (service || '') + '</span>' +
            '</label>' +
            '<div class="pwca-shipping-freight"><strong>Freight:</strong> ' + (parseFloat(cost || 0).toFixed(2)) + '$</div>';
        $('.pwca-order-shipping .pwca-shipping-row').html(html);
        $('.pwca-order-shipping').show();
    }

    // 响应自定义运费选项变更（来源于 pw-admin.php 中生成的 pwca_shipping_option 单选）
    $(document).on('change', 'input[name="pwca_shipping_option"]', function() {
        var $opt = $(this);
        var service = $opt.data('service');
        var cost = parseFloat($opt.data('cost')) || 0;
        updatePwcaShippingRow(service, cost);
    });

    // 点击“计算运费”按钮后，默认选中并显示第一个选项（通讯成功后 pw-admin.php 会渲染表格）
    $(document).on('click', '#pwca-calculate-shipping', function() {
        setTimeout(function() {
            var $first = $('input[name="pwca_shipping_option"]:checked').first();
            if ($first.length) {
                var service = $first.data('service');
                var cost = parseFloat($first.data('cost')) || 0;
                updatePwcaShippingRow(service, cost);
            }
        }, 300);
    });

    // Woo 更新完成后，确保如果 session 已有运费则显示该块
    $(document.body).on('updated_checkout', function() {
        // 只有在本次会话中选择过运费（通讯成功）才显示运费块
        if (window.pwcaHasSelectedShipping) {
            var hasRow = $('.pwca-order-shipping .pwca-shipping-row').text().trim().length > 0;
            if (hasRow) {
                $('.pwca-order-shipping').show();
            }
        } else {
            $('.pwca-order-shipping').hide();
        }
    });
});
</script>