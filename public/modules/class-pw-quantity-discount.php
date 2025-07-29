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
        
        <div id="quantity-discount-app"></div>

        <script type="text/javascript">
        document.addEventListener('pwCdnLoaded', function(event) {
            const { vue: Vue, pinia, defineStore } = event.detail;
            const { createApp, ref, computed, onMounted, nextTick } = Vue;
            
            // --- 1. Pinia Store Definition ---
            const useQuantityDiscountStore = defineStore('quantityDiscount', {
                state: () => ({
                    config: <?php echo wp_json_encode($config); ?>,
                    currentQuantity: <?php echo max($minimum_order_quantity, 6); ?>,
                    activeDotQuantity: null
                }),
                
                getters: {
                    correctedQuantity: (state) => {
                        return (inputQuantity) => {
                            const minQty = state.config.minimumOrderQuantity;
                            const batchQty = state.config.batchQuantity;
                            const sellInBatch = state.config.sellInBatch;
                            
                            if (inputQuantity < minQty) {
                                return minQty;
                            }
                            
                            if (sellInBatch === true) {
                                if (batchQty > 0) {
                                    const excessQuantity = inputQuantity - minQty;
                                    const batchCount = Math.round(excessQuantity / batchQty);
                                    return minQty + (batchCount * batchQty);
                                }
                            }
                            
                            return inputQuantity;
                        };
                    },
                    
                    discountForQuantity: (state) => {
                        return (qty) => {
                            for (let i = state.config.discountTiers.length - 1; i >= 0; i--) {
                                const tier = state.config.discountTiers[i];
                                if (qty >= tier.quantity) {
                                    return tier.discountText;
                                }
                            }
                            return null;
                        };
                    },
                    
                    closestDotQuantity: (state) => {
                        return (qty) => {
                            return state.config.discountTiers
                                .map(tier => tier.quantity)
                                .reduce((prev, curr) => {
                                    return (Math.abs(curr - qty) < Math.abs(prev - qty) ? curr : prev);
                                });
                        };
                    },
                    
                    discountDisplayText: (state) => {
                        const discountText = state.discountForQuantity(state.currentQuantity);
                        if (discountText !== null) {
                            if (discountText !== "0% OFF") {
                                return `Discount: ${discountText}`;
                            }
                        }
                        return '';
                    }
                },
                
                actions: {
                    initializeConfig() {
                        if (this.config.discountTiers.length === 0) {
                            this.config.discountTiers = [
                                { quantity: 6,  discountText: "0% OFF" },
                                { quantity: 11, discountText: "10% OFF" },
                                { quantity: 16, discountText: "15% OFF" },
                                { quantity: 21, discountText: "20% OFF" },
                                { quantity: 26, discountText: "25% OFF" },
                                { quantity: 31, discountText: "30% OFF" }
                            ];
                        }
                    },
                    
                    updateQuantity(newQuantity) {
                        const correctedQuantity = this.correctedQuantity(newQuantity);
                        this.currentQuantity = Math.max(
                            this.config.minimumOrderQuantity, 
                            Math.min(correctedQuantity, this.config.maxStock)
                        );
                        
                        this.activeDotQuantity = this.closestDotQuantity(this.currentQuantity);
                        
                        // Update external quantity input
                        const productQuantityInput = document.querySelector('input[name="quantity"]');
                        if (productQuantityInput) {
                            productQuantityInput.value = this.currentQuantity;
                            const event = new Event('change', { bubbles: true });
                            productQuantityInput.dispatchEvent(event);
                        }
                    },
                    
                    incrementQuantity() {
                        this.updateQuantity(this.currentQuantity + this.config.step);
                    },
                    
                    decrementQuantity() {
                        this.updateQuantity(this.currentQuantity - this.config.step);
                    }
                }
            });

            // --- 2. Vue Component Definition ---
            const QuantityDiscountApp = {
                setup() {
                    const store = useQuantityDiscountStore();
                    const quantityInputRef = ref(null);
                    const scaleDotsRef = ref(null);
                    const tooltipRef = ref(null);
                    
                    // Initialize store
                    store.initializeConfig();
                    
                    const scaleDots = computed(() => {
                        if (!store.config.step || store.config.step <= 0) {
                            return [];
                        }
                        
                        const quantities = store.config.discountTiers.map(tier => tier.quantity);
                        const totalDots = quantities.length;
                        
                        return quantities.map((qty, index) => {
                            if (qty > store.config.maxStock) return null;
                            
                            const positionPercent = (index / (totalDots - 1)) * 100;
                            return {
                                quantity: qty,
                                position: positionPercent,
                                isActive: qty === store.activeDotQuantity
                            };
                        }).filter(Boolean);
                    });
                    
                    const handleQuantityInput = (event) => {
                        const inputValue = parseInt(event.target.value) || store.config.minimumOrderQuantity;
                        store.updateQuantity(inputValue);
                    };
                    
                    const handleKeyPress = (event) => {
                        if (event.key === 'Enter') {
                            const inputValue = parseInt(event.target.value) || store.config.minimumOrderQuantity;
                            store.updateQuantity(inputValue);
                            event.target.blur();
                        }
                    };
                    
                    const handleDotClick = (quantity) => {
                        store.updateQuantity(quantity);
                    };
                    
                    const updateTooltipPosition = () => {
                        nextTick(() => {
                            if (tooltipRef.value && scaleDotsRef.value) {
                                const activeDot = scaleDotsRef.value.querySelector('.scale-dot.active');
                                if (activeDot) {
                                    const dotPosition = activeDot.offsetLeft + (activeDot.offsetWidth / 2);
                                    tooltipRef.value.style.left = `${dotPosition}px`;
                                }
                            }
                        });
                    };
                    
                    onMounted(() => {
                        store.updateQuantity(store.config.initialQuantity);
                        updateTooltipPosition();
                    });
                    
                    // Watch for active dot changes to update tooltip position
                    Vue.watch(() => store.activeDotQuantity, () => {
                        updateTooltipPosition();
                    });
                    
                    return {
                        store,
                        quantityInputRef,
                        scaleDotsRef,
                        tooltipRef,
                        scaleDots,
                        handleQuantityInput,
                        handleKeyPress,
                        handleDotClick
                    };
                },
                
                template: `
                    <div class="container-wrapper">
                        <div class="quantity-selector">
                            <div class="quantity-control">
                                <label for="quantity-input">Quantity:</label>
                                <div class="stepper">
                                    <button 
                                        class="stepper-btn minus" 
                                        aria-label="Decrease quantity"
                                        @click="store.decrementQuantity"
                                    >-</button>
                                    <input
                                        ref="quantityInputRef"
                                        type="text"
                                        id="quantity-input"
                                        class="quantity-input"
                                        :value="store.currentQuantity"
                                        @blur="handleQuantityInput"
                                        @keypress="handleKeyPress"
                                    />
                                    <button 
                                        class="stepper-btn plus" 
                                        aria-label="Increase quantity"
                                        @click="store.incrementQuantity"
                                    >+</button>
                                </div>
                            </div>

                            <div 
                                v-if="scaleDots.length > 0"
                                id="discount-scale-container" 
                                class="discount-scale-container"
                            >
                                <div 
                                    ref="tooltipRef"
                                    id="quantity-tooltip" 
                                    class="quantity-tooltip"
                                    :class="{ visible: store.activeDotQuantity }"
                                >{{ store.activeDotQuantity }}</div>
                                <div class="scale-line"></div>
                                <div ref="scaleDotsRef" id="scale-dots" class="scale-dots">
                                    <div
                                        v-for="dot in scaleDots"
                                        :key="dot.quantity"
                                        class="scale-dot"
                                        :class="{ active: dot.isActive }"
                                        :style="{ left: dot.position + '%' }"
                                        :data-quantity="dot.quantity"
                                        @click="handleDotClick(dot.quantity)"
                                    ></div>
                                </div>
                            </div>

                            <p 
                                v-if="store.discountDisplayText"
                                id="discount-display-text" 
                                class="discount-display"
                            >{{ store.discountDisplayText }}</p>
                        </div>
                    </div>
                `
            };

            // --- 3. Create and Mount Vue App ---
            const app = createApp(QuantityDiscountApp);
            app.use(pinia);
            app.mount('#quantity-discount-app');
        });
        </script>
        <?php
    }
}