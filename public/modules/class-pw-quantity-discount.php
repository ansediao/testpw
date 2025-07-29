<?php
/**
 * Quantity Discount Module
 * 
 * @package    Pw_Admin
 * @subpackage Pw_Admin/public/modules
 * @author     PW <pw@pwcom>
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Pw_Quantity_Discount {

    /**
     * Initialize hooks
     */
    public function __construct() {
        add_action('pw_admin_single_product_custom_content', array($this, 'display_quantity_discount'), 30);
    }

    /**
     * Display quantity discount module
     */
    public function display_quantity_discount() {
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

        $api = new Pw_Admin_Promowares_Api();
        $api_response = $api->get_product_by_woo_id($product_id);

        $use_demo_data = false;
        $quantity_discounts = [];
        
        // Get quantity limits and batch settings
        $minimum_order_quantity = 6; // Default minimum order quantity
        $batch_quantity = 5; // Default step value
        $sell_in_batch = false;

        if (is_wp_error($api_response) || !isset($api_response['data']['quantity_discount']) || 
            !is_array($api_response['data']['quantity_discount']) || empty($api_response['data']['quantity_discount'])) {
            $use_demo_data = true;
        } else {
            $quantity_discounts = $api_response['data']['quantity_discount'];
            
            // Get minimum order quantity setting
            if (isset($api_response['data']['moq_setting']['minimum_order_quantity'])) {
                $minimum_order_quantity = intval($api_response['data']['moq_setting']['minimum_order_quantity']);
            }
            
            // Get batch selling settings
            if (isset($api_response['data']['sell_in_batch'])) {
                $sell_in_batch = $api_response['data']['sell_in_batch'] === true || $api_response['data']['sell_in_batch'] === 'true';
            }
            
            if ($sell_in_batch && isset($api_response['data']['sell_in_batch_info']['batch_quantity'])) {
                $batch_quantity = intval($api_response['data']['sell_in_batch_info']['batch_quantity']);
            }
            
            // Check if there are cases where range_to is 0
            foreach ($quantity_discounts as $discount) {
                if (isset($discount['range_to']) && $discount['range_to'] == 0) {
                    $use_demo_data = true;
                    break;
                }
            }
        }

        // If demo data is needed or API data is invalid
        if ($use_demo_data || empty($quantity_discounts)) {
            $quantity_discounts = [
                [
                    'range_from' => 6,
                    'range_to' => 10,
                    'discount' => 0,
                    'extra_processing_time' => 0
                ],
                [
                    'range_from' => 11,
                    'range_to' => 15,
                    'discount' => 0.1,
                    'extra_processing_time' => 1
                ],
                [
                    'range_from' => 16,
                    'range_to' => 20,
                    'discount' => 0.15,
                    'extra_processing_time' => 2
                ],
                [
                    'range_from' => 21,
                    'range_to' => 25,
                    'discount' => 0.2,
                    'extra_processing_time' => 3
                ],
                [
                    'range_from' => 26,
                    'range_to' => 30,
                    'discount' => 0.25,
                    'extra_processing_time' => 4
                ],
                [
                    'range_from' => 31,
                    'range_to' => 0,
                    'discount' => 0.3,
                    'extra_processing_time' => 5
                ]
            ];
        }

        // Filter out invalid discount data
        $valid_discounts = array_filter($quantity_discounts, function($discount) {
            return !($discount['range_from'] == 0 && $discount['range_to'] == 0);
        });

        // Sort by quantity range
        usort($valid_discounts, function($a, $b) {
            return $a['range_from'] - $b['range_from'];
        });

        // Prepare configuration data
        $config = [
            'initialQuantity' => max($minimum_order_quantity, 6),
            'step' => $batch_quantity,
            'maxStock' => 9999,
            'minimumOrderQuantity' => $minimum_order_quantity,
            'batchQuantity' => $batch_quantity,
            'sellInBatch' => $sell_in_batch,
            'discountTiers' => []
        ];

        foreach ($valid_discounts as $discount) {
            $discount_text = ($discount['discount'] * 100) . '% OFF';
            $config['discountTiers'][] = [
                'quantity' => $discount['range_from'],
                'discountText' => $discount_text
            ];
        }

        ?>
        
        <div class="container-wrapper">
            <div class="quantity-selector">
                <div class="quantity-control">
                    <label for="quantity-input">Quantity:</label>
                    <div class="stepper">
                        <button class="stepper-btn minus" aria-label="Decrease quantity">-</button>
                        <input
                            type="text"
                            id="quantity-input"
                            class="quantity-input"
                            value="<?php echo max($minimum_order_quantity, 6); ?>"                            
                        />
                        <button class="stepper-btn plus" aria-label="Increase quantity">+</button>
                    </div>
                </div>

                <div id="discount-scale-container" class="discount-scale-container">
                    <div id="quantity-tooltip" class="quantity-tooltip"><?php echo max($minimum_order_quantity, 6); ?></div>
                    <div class="scale-line"></div>
                    <div id="scale-dots" class="scale-dots"></div>
                </div>

                <p id="discount-display-text" class="discount-display"></p>
            </div>
        </div>     

        <script type="text/javascript">
        document.addEventListener('DOMContentLoaded', () => {
            // --- 1. Configuration and Initialization ---
            const config = <?php echo wp_json_encode($config); ?>;
            
            // Ensure discountTiers uses API data
            if (config.discountTiers.length === 0) {
                config.discountTiers = [
                    { quantity: 6,  discountText: "0% OFF" },
                    { quantity: 11, discountText: "10% OFF" },
                    { quantity: 16, discountText: "15% OFF" },
                    { quantity: 21, discountText: "20% OFF" },
                    { quantity: 26, discountText: "25% OFF" },
                    { quantity: 31, discountText: "30% OFF" }
                ];
            }

            // --- 2. Get DOM Elements ---
            const quantityInput = document.getElementById('quantity-input');
            const minusBtn = document.querySelector('.stepper-btn.minus');
            const plusBtn = document.querySelector('.stepper-btn.plus');
            const scaleDotsContainer = document.getElementById('scale-dots');
            const quantityTooltip = document.getElementById('quantity-tooltip');
            const scaleContainer = document.getElementById('discount-scale-container');
            const discountDisplayText = document.getElementById('discount-display-text');

            let currentQuantity = config.initialQuantity;

            // --- 3. Core Functions ---

            // Quantity auto-correction function
            function correctQuantity(inputQuantity) {
                const minQty = config.minimumOrderQuantity;
                const batchQty = config.batchQuantity;
                const sellInBatch = config.sellInBatch;
                
                // Ensure not below minimum order quantity
                if (inputQuantity < minQty) {
                    return minQty;
                }
                
                // If batch selling is enabled, adjust to nearest batch multiple
                if (sellInBatch === true) {
                    if (batchQty > 0) {
                        // Calculate batch multiples from minimum order quantity
                        const excessQuantity = inputQuantity - minQty;
                        const batchCount = Math.round(excessQuantity / batchQty);
                        return minQty + (batchCount * batchQty);
                    }
                }
                
                return inputQuantity;
            }

            function createScaleDots() {
                if (!config.step || config.step <= 0) {
                    scaleContainer.style.display = 'none';
                    return;
                }

                scaleDotsContainer.innerHTML = '';
                const quantities = config.discountTiers.map(tier => tier.quantity);
                const totalDots = quantities.length;

                quantities.forEach((qty, index) => {
                    if (qty > config.maxStock) return;

                    const dot = document.createElement('div');
                    dot.className = 'scale-dot';
                    dot.dataset.quantity = qty;

                    const positionPercent = (index / (totalDots - 1)) * 100;
                    dot.style.left = `${positionPercent}%`;

                    dot.addEventListener('click', () => {
                        updateAll(qty);
                    });

                    scaleDotsContainer.appendChild(dot);
                });
            }

            function getDiscountForQuantity(qty) {
                let currentDiscount = null;
                for (let i = config.discountTiers.length - 1; i >= 0; i--) {
                    const tier = config.discountTiers[i];
                    if (qty >= tier.quantity) {
                        currentDiscount = tier.discountText;
                        break;
                    }
                }
                return currentDiscount;
            }

            function findClosestDotQuantity(qty) {
                return config.discountTiers
                    .map(tier => tier.quantity)
                    .reduce((prev, curr) => {
                        return (Math.abs(curr - qty) < Math.abs(prev - qty) ? curr : prev);
                    });
            }

            function updateAll(newQuantity) {
                // Apply quantity auto-correction
                const correctedQuantity = correctQuantity(newQuantity);
                currentQuantity = Math.max(config.minimumOrderQuantity, Math.min(correctedQuantity, config.maxStock));

                // 1. Update input field value
                quantityInput.value = currentQuantity;

                // 2. Find and activate the closest scale point
                const closestDotQty = findClosestDotQuantity(currentQuantity);
                const dots = document.querySelectorAll('.scale-dot');
                let activeDot = null;

                dots.forEach(dot => {
                    if (parseInt(dot.dataset.quantity) === closestDotQty) {
                        dot.classList.add('active');
                        activeDot = dot;
                    } else {
                        dot.classList.remove('active');
                    }
                });

                // 3. Update the quantity tooltip above
                if (activeDot) {
                    quantityTooltip.textContent = closestDotQty;
                    const dotPosition = activeDot.offsetLeft + (activeDot.offsetWidth / 2);
                    quantityTooltip.style.left = `${dotPosition}px`;
                    quantityTooltip.classList.add('visible');
                } else {
                    quantityTooltip.classList.remove('visible');
                }

                // 4. Update the discount text below
                const discountText = getDiscountForQuantity(currentQuantity);
                if (discountText !== null) {
                    if (discountText !== "0% OFF") {
                        discountDisplayText.textContent = `Discount: ${discountText}`;
                    } else {
                        discountDisplayText.textContent = '';
                    }
                } else {
                    discountDisplayText.textContent = '';
                }

                // 5. Update quantity input field (if exists)
                const productQuantityInput = document.querySelector('input[name="quantity"]');
                if (productQuantityInput) {
                    productQuantityInput.value = currentQuantity;
                    // Trigger change event
                    const event = new Event('change', { bubbles: true });
                    productQuantityInput.dispatchEvent(event);
                }
            }

            // --- 4. Bind Event Listeners ---
            minusBtn.addEventListener('click', () => {
                updateAll(parseInt(quantityInput.value) - config.step);
            });

            plusBtn.addEventListener('click', () => {
                updateAll(parseInt(quantityInput.value) + config.step);
            });

            // Auto-correct quantity when input loses focus
            quantityInput.addEventListener('blur', () => {
                const inputValue = parseInt(quantityInput.value) || config.minimumOrderQuantity;
                updateAll(inputValue);
            });

            // Auto-correct quantity when Enter is pressed in input
            quantityInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const inputValue = parseInt(quantityInput.value) || config.minimumOrderQuantity;
                    updateAll(inputValue);
                    quantityInput.blur(); // Remove focus
                }
            });

            // --- 5. Initial Load ---
            createScaleDots();
            updateAll(config.initialQuantity);
        });
        </script>
        <?php
    }
}