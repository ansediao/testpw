<?php
/**
 * Price Calculator Module
 * 
 * Calculates and displays estimated total price based on quantity and accessories
 *
 * @package    Pw_Admin
 * @subpackage Pw_Admin/public/modules
 * @author     PW <pw@pwcom>
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Pw_Price_Calculator {

    /**
     * Initialize hooks
     */
    public function __construct() {
        add_action('pw_admin_single_product_custom_content', array($this, 'display_price_calculator'), 48);
        add_action('wp_enqueue_scripts', array($this, 'enqueue_styles'));
    }
    
    /**
     * Enqueue price calculator styles
     */
    public function enqueue_styles() {
        if (is_product()) {
            wp_enqueue_style('pw-price-calculator-styles', plugin_dir_url(__FILE__) . '../css/pw-price-calculator.css', array(), PW_ADMIN_VERSION, 'all');
        }
    }

    /**
     * Display price calculator module
     */
    public function display_price_calculator() {
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

        // Get product price
        $product_price = $product->get_price();
        
        // Get API data for accessories and discounts
        $api = new Pw_Admin_Promowares_Api();
        $api_response = $api->get_product_by_woo_id($product_id);
        
        $accessories = [];
        $quantity_discounts = [];
        
        if (!is_wp_error($api_response)) {
            if (isset($api_response['data']['accessories']) && is_array($api_response['data']['accessories'])) {
                $accessories = $api_response['data']['accessories'];
            }
            
            if (isset($api_response['data']['quantity_discount']) && is_array($api_response['data']['quantity_discount'])) {
                $quantity_discounts = $api_response['data']['quantity_discount'];
            }
        }

        // Use demo discount data if API data is invalid
        if (empty($quantity_discounts)) {
            $quantity_discounts = [
                ['range_from' => 6, 'range_to' => 10, 'discount' => 0],
                ['range_from' => 11, 'range_to' => 15, 'discount' => 0.1],
                ['range_from' => 16, 'range_to' => 20, 'discount' => 0.15],
                ['range_from' => 21, 'range_to' => 25, 'discount' => 0.2],
                ['range_from' => 26, 'range_to' => 30, 'discount' => 0.25],
                ['range_from' => 31, 'range_to' => 0, 'discount' => 0.3]
            ];
        }
        ?>
        
        <div id="pw-price-calculator-container" class="pw-price-calculator">
            <h4>预计总价</h4>
            
            <div class="price-breakdown">
                <div class="price-row">
                    <span>产品单价:</span>
                    <span id="unit-price">$<?php echo number_format($product_price, 2); ?></span>
                </div>
                
                <div class="price-row">
                    <span>数量:</span>
                    <span id="selected-quantity">6</span>
                </div>
                
                <div class="price-row">
                    <span>小计:</span>
                    <span id="subtotal-price">$<?php echo number_format($product_price * 6, 2); ?></span>
                </div>
                
                <div class="price-row" id="discount-row">
                    <span>折扣:</span>
                    <span id="discount-amount">-$0.00</span>
                </div>
                
                <div class="price-row" id="accessories-row">
                    <span>配件费用:</span>
                    <span id="accessories-total">$0.00</span>
                </div>
                
                <hr>
                
                <div class="price-row">
                    <span>总计:</span>
                    <span id="total-price">$<?php echo number_format($product_price * 6, 2); ?></span>
                </div>
            </div>
            
            <div class="price-note">
                * 此为预估价格，最终价格以结算时为准
            </div>
        </div>

        <script type="text/javascript">
        jQuery(document).ready(function($) {
            const productPrice = <?php echo $product_price; ?>;
            const accessories = <?php echo wp_json_encode($accessories); ?>;
            const quantityDiscounts = <?php echo wp_json_encode($quantity_discounts); ?>;
            
            let currentQuantity = 6;
            let selectedAccessories = [];
            
            // Function to get discount for quantity
            function getDiscountForQuantity(qty) {
                for (let i = quantityDiscounts.length - 1; i >= 0; i--) {
                    const discount = quantityDiscounts[i];
                    if (qty >= discount.range_from) {
                        if (discount.range_to === 0 || qty <= discount.range_to) {
                            return discount.discount;
                        }
                    }
                }
                return 0;
            }
            
            // Function to calculate and update prices
            function updatePriceCalculation() {
                const subtotal = productPrice * currentQuantity;
                const discountRate = getDiscountForQuantity(currentQuantity);
                const discountAmount = subtotal * discountRate;
                const discountedSubtotal = subtotal - discountAmount;
                
                // Calculate accessories total
                let accessoriesTotal = 0;
                selectedAccessories.forEach(function(accessory) {
                    accessoriesTotal += parseFloat(accessory.price) || 0;
                });
                
                const finalTotal = discountedSubtotal + accessoriesTotal;
                
                // Update display
                $('#selected-quantity').text(currentQuantity);
                $('#subtotal-price').text('$' + subtotal.toFixed(2));
                
                // Show/hide discount row
                if (discountAmount > 0) {
                    $('#discount-row').show();
                    $('#discount-amount').text('-$' + discountAmount.toFixed(2));
                } else {
                    $('#discount-row').hide();
                }
                
                // Show/hide accessories row
                if (accessoriesTotal > 0) {
                    $('#accessories-row').show();
                    $('#accessories-total').text('$' + accessoriesTotal.toFixed(2));
                } else {
                    $('#accessories-row').hide();
                }
                
                $('#total-price').text('$' + finalTotal.toFixed(2));
            }
            
            // Monitor quantity changes
            function monitorQuantityChanges() {
                const quantityInput = $('#quantity-input');
                if (quantityInput.length) {
                    const newQuantity = parseInt(quantityInput.val()) || 6;
                    if (newQuantity !== currentQuantity) {
                        currentQuantity = newQuantity;
                        updatePriceCalculation();
                    }
                }
            }
            
            // Monitor accessories changes
            function monitorAccessoriesChanges() {
                const accessoryContainer = $('#selected-accessories-container');
                if (accessoryContainer.length) {
                    const currentAccessoryItems = accessoryContainer.find('.selected-accessory-item');
                    const newSelectedAccessories = [];
                    
                    currentAccessoryItems.each(function() {
                        const accessoryId = parseInt($(this).data('id'));
                        if (accessories[accessoryId]) {
                            newSelectedAccessories.push(accessories[accessoryId]);
                        }
                    });
                    
                    // Check if accessories changed
                    if (JSON.stringify(newSelectedAccessories) !== JSON.stringify(selectedAccessories)) {
                        selectedAccessories = newSelectedAccessories;
                        updatePriceCalculation();
                    }
                }
            }
            
            // Initial calculation
            updatePriceCalculation();
            
            // Set up monitoring with MutationObserver for better performance
            if (window.MutationObserver) {
                // Monitor quantity input changes
                const quantityInput = document.getElementById('quantity-input');
                if (quantityInput) {
                    const quantityObserver = new MutationObserver(function(mutations) {
                        mutations.forEach(function(mutation) {
                            if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                                monitorQuantityChanges();
                            }
                        });
                    });
                    quantityObserver.observe(quantityInput, { attributes: true, attributeFilter: ['value'] });
                }
                
                // Monitor accessories container changes
                const accessoryContainer = document.getElementById('selected-accessories-container');
                if (accessoryContainer) {
                    const accessoryObserver = new MutationObserver(function(mutations) {
                        let shouldUpdate = false;
                        mutations.forEach(function(mutation) {
                            if (mutation.type === 'childList') {
                                shouldUpdate = true;
                            }
                        });
                        if (shouldUpdate) {
                            setTimeout(monitorAccessoriesChanges, 100);
                        }
                    });
                    accessoryObserver.observe(accessoryContainer, { childList: true, subtree: true });
                }
            } else {
                // Fallback to intervals for older browsers
                setInterval(monitorQuantityChanges, 500);
                setInterval(monitorAccessoriesChanges, 500);
            }
            
            // Also listen for input events
            $(document).on('input change', '#quantity-input', function() {
                setTimeout(monitorQuantityChanges, 50);
            });
            
            // Listen for click events on stepper buttons
            $(document).on('click', '.stepper-btn', function() {
                setTimeout(monitorQuantityChanges, 100);
            });
            
            // Listen for scale dot clicks
            $(document).on('click', '.scale-dot', function() {
                setTimeout(monitorQuantityChanges, 100);
            });
        });
        </script>
        
        <?php
    }
}