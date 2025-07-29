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
            
            // Add inline styles for the new design
            $custom_css = "
                .pw-price-calculator {
                    margin: 20px 0;
                    padding: 15px;
                    border-radius: 8px;
                    background-color: #f9f9f9;
                }
                .estimation-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    font-size: 16px;
                }
                .strikethrough {
                    text-decoration: line-through;
                    color: #999;
                    margin-right: 10px;
                }
                #total-price {
                    font-weight: bold;
                    color: #0066cc;
                }
                #delivery-date, #arrival-date {
                    font-weight: 500;
                }
            ";
            wp_add_inline_style('pw-price-calculator-styles', $custom_css);
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
        
        // Get API data for accessories, discounts, and arrival date
        $api = new Pw_Admin_Promowares_Api();
        $api_response = $api->get_product_by_woo_id($product_id);
        
        $accessories = [];
        $quantity_discounts = [];
        $arrival_date_enabled = false;
        $avg_shipping_time = 0;
        $minimum_order_quantity = 6; // 默认最小订购量
        $batch_quantity = 5; // 默认步进值
        $sell_in_batch = false;
        
        if (!is_wp_error($api_response)) {
            if (isset($api_response['data']['accessories']) && is_array($api_response['data']['accessories'])) {
                $accessories = $api_response['data']['accessories'];
            }
            
            if (isset($api_response['data']['quantity_discount']) && is_array($api_response['data']['quantity_discount'])) {
                $quantity_discounts = $api_response['data']['quantity_discount'];
            }
            
            // 获取最小订购量设置
            if (isset($api_response['data']['moq_setting']['minimum_order_quantity'])) {
                $minimum_order_quantity = intval($api_response['data']['moq_setting']['minimum_order_quantity']);
            }
            
            // 获取批量销售设置
            if (isset($api_response['data']['sell_in_batch'])) {
                $sell_in_batch = $api_response['data']['sell_in_batch'] === true || $api_response['data']['sell_in_batch'] === 'true';
            }
            
            if ($sell_in_batch && isset($api_response['data']['sell_in_batch_info']['batch_quantity'])) {
                $batch_quantity = intval($api_response['data']['sell_in_batch_info']['batch_quantity']);
            }
            
            // Check arrival_date setting
            if (isset($api_response['data']['arrival_date'])) {
                $arrival_date_setting = $api_response['data']['arrival_date'];
                $arrival_date_enabled = ($arrival_date_setting === true || $arrival_date_setting === 'true' || $arrival_date_setting === 1 || $arrival_date_setting === '1');
            }
            
            // Get average shipping time
            if (isset($api_response['data']['avg_shipping_time'])) {
                $avg_shipping_time = intval($api_response['data']['avg_shipping_time']);
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
            <div class="price-estimation">
                <div class="estimation-row">
                    <span>Estimated delivery date:</span>
                    <span id="delivery-date"><?php echo date('F j, Y'); ?></span>
                </div>
                
                <div class="estimation-row">
                    <span>Estimated price:</span>
                    <span>
                        <span id="original-price" class="strikethrough">$<?php echo number_format($product_price * max($minimum_order_quantity, 6), 2); ?></span>
                        <span id="total-price">$<?php echo number_format($product_price * max($minimum_order_quantity, 6), 2); ?></span>
                    </span>
                </div>
                
                <?php if ($arrival_date_enabled && $avg_shipping_time > 0): ?>
                <div class="estimation-row">
                    <span>Estimated arrival date:</span>
                    <span id="arrival-date"><?php echo date('F j, Y', strtotime('+' . $avg_shipping_time . ' days')); ?></span>
                </div>
                <?php endif; ?>
            </div>
        </div>

        <script type="text/javascript">
        jQuery(document).ready(function($) {
            const productPrice = <?php echo $product_price; ?>;
            const accessories = <?php echo wp_json_encode($accessories); ?>;
            const quantityDiscounts = <?php echo wp_json_encode($quantity_discounts); ?>;
            const minimumOrderQuantity = <?php echo $minimum_order_quantity; ?>;
            const batchQuantity = <?php echo $batch_quantity; ?>;
            const sellInBatch = <?php echo $sell_in_batch ? 'true' : 'false'; ?>;
            
            let currentQuantity = Math.max(minimumOrderQuantity, 6);
            let selectedAccessories = [];
            
            // Function to correct quantity based on API settings
            function correctQuantity(inputQuantity) {
                const minQty = minimumOrderQuantity;
                const batchQty = batchQuantity;
                
                // 确保不低于最小订购量
                if (inputQuantity < minQty) {
                    return minQty;
                }
                
                // 如果启用批量销售，需要调整到最接近的批量倍数
                if (sellInBatch) {
                    if(batchQty > 0){

                    
                    // 计算从最小订购量开始的批量倍数
                    const excessQuantity = inputQuantity - minQty;
                    const batchCount = Math.round(excessQuantity / batchQty);
                    return minQty + (batchCount * batchQty);
                }
                }
                
                return inputQuantity;
            }
            
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
                // Calculate original price (without discount)
                const originalTotal = subtotal + accessoriesTotal;
                
                // Update the prices
                $('#original-price').text('$' + originalTotal.toFixed(2));
                $('#total-price').text('$' + finalTotal.toFixed(2));
                
                // Update delivery date (today's date is already set in PHP)
                
                // If there's a significant discount, show the original price, otherwise hide it
                if (discountAmount > 0) {
                    $('#original-price').show();
                } else {
                    $('#original-price').hide();
                }
            }
            
            // Monitor quantity changes
            function monitorQuantityChanges() {
                const quantityInput = $('#quantity-input');
                if (quantityInput.length) {
                    const inputQuantity = parseInt(quantityInput.val()) || minimumOrderQuantity;
                    const correctedQuantity = correctQuantity(inputQuantity);
                    if (correctedQuantity !== currentQuantity) {
                        currentQuantity = correctedQuantity;
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