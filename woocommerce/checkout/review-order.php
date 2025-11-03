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
            
            <!-- 运费 -->
            <div class="pwca-order-shipping">
                <div class="pwca-shipping-row">
                   
                </div>
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
    // 响应配送方式选择操作
    $('.pwca-shipping-table').on('change', 'input[name^="shipping_method"]', function() {
        var $this = $(this);
        var packageIndex = $this.data('index');
        var methodId = $this.val();
        
        // 添加加载状态
        $('.pwca-checkout-review-container').addClass('pwca-updating');
        
        // 触发WooCommerce的配送方式更新
        $('body').trigger('update_checkout');
        
        // 自定义事件，可以被其他脚本监听
        $(document).trigger('pwca_shipping_method_changed', {
            packageIndex: packageIndex,
            methodId: methodId,
            element: $this
        });
        
        // 移除加载状态
        setTimeout(function() {
            $('.pwca-checkout-review-container').removeClass('pwca-updating');
        }, 1000);
    });
    
    // 监听WooCommerce的checkout更新事件
    $(document.body).on('updated_checkout', function() {
        $('.pwca-checkout-review-container').removeClass('pwca-updating');
        
        // 重新绑定事件（如果需要）
        $('.pwca-shipping-table input[name^="shipping_method"]:checked').each(function() {
            $(this).closest('.pwca-shipping-option').addClass('selected');
        });
    });
    
    // 初始化选中状态
    $('.pwca-shipping-table input[name^="shipping_method"]:checked').each(function() {
        $(this).closest('.pwca-shipping-option').addClass('selected');
    });
});
</script>