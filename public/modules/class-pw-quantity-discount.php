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

        if (is_wp_error($api_response) || !isset($api_response['data']['quantity_discount']) || 
            !is_array($api_response['data']['quantity_discount']) || empty($api_response['data']['quantity_discount'])) {
            $use_demo_data = true;
        } else {
            $quantity_discounts = $api_response['data']['quantity_discount'];
            
            // 检查是否有range_to为0的情况
            foreach ($quantity_discounts as $discount) {
                if (isset($discount['range_to']) && $discount['range_to'] == 0) {
                    $use_demo_data = true;
                    break;
                }
            }
        }

        // 如果需要使用demo数据或API数据无效
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

        // 过滤掉无效的折扣数据
        $valid_discounts = array_filter($quantity_discounts, function($discount) {
            return !($discount['range_from'] == 0 && $discount['range_to'] == 0);
        });

        // 按数量范围排序
        usort($valid_discounts, function($a, $b) {
            return $a['range_from'] - $b['range_from'];
        });

        // 准备配置数据
        $config = [
            'initialQuantity' => 6,
            'step' => 5,
            'maxStock' => 9999,
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
                        <button class="stepper-btn minus" aria-label="减少数量">-</button>
                        <input
                            type="text"
                            id="quantity-input"
                            class="quantity-input"
                            value="6"
                            readonly
                        />
                        <button class="stepper-btn plus" aria-label="增加数量">+</button>
                    </div>
                </div>

                <div id="discount-scale-container" class="discount-scale-container">
                    <div id="quantity-tooltip" class="quantity-tooltip">6</div>
                    <div class="scale-line"></div>
                    <div id="scale-dots" class="scale-dots"></div>
                </div>

                <p id="discount-display-text" class="discount-display"></p>
            </div>
        </div>

        <style>
        /* --- 全局和容器样式 --- */
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        .container-wrapper {
            background-color: #ffffff;
            padding: 30px 40px;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
            width: 100%;
            max-width: 420px;
            margin: 20px 0;
        }

        .quantity-selector {
            color: #333;
        }

        /* --- 数量控制区域 --- */
        .quantity-control {
            display: flex;
            align-items: center;
            margin-bottom: 50px;
        }

        .quantity-control label {
            margin-right: 15px;
            font-size: 16px;
            font-weight: 500;
            color: #2d3748;
        }

        /* --- 步进器 (加减号和输入框) --- */
        .stepper {
            display: flex;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
            height: 38px;
        }

        .stepper-btn {
            background-color: #f8fafc;
            border: none;
            cursor: pointer;
            font-size: 24px;
            width: 38px;
            color: #718096;
            transition: background-color 0.2s, color 0.2s;
            display: flex;
            justify-content: center;
            align-items: center;
            line-height: 1;
        }

        .stepper-btn:hover {
            background-color: #edf2f7;
            color: #2d3748;
        }

        .quantity-input {
            width: 60px;
            text-align: center;
            border: none;
            border-left: 1px solid #e2e8f0;
            border-right: 1px solid #e2e8f0;
            font-size: 16px;
            font-weight: 500;
            color: #1a202c;
            -moz-appearance: textfield;
            outline: none;
        }

        /* --- 折扣刻度尺区域 --- */
        .discount-scale-container {
            position: relative;
            height: 40px;
            padding: 0 8px;
            margin-bottom: 20px;
        }

        .scale-line {
            position: absolute;
            top: 50%;
            left: 8px;
            right: 8px;
            height: 3px;
            background-color: #e2e8f0;
            border-radius: 2px;
            transform: translateY(-50%);
            z-index: 1;
        }

        .scale-dots {
            position: relative;
            display: flex;
            justify-content: space-between;
            height: 100%;
            z-index: 2;
        }

        .scale-dot {
            width: 14px;
            height: 14px;
            background-color: #cbd5e0;
            border: 2px solid #ffffff;
            border-radius: 50%;
            cursor: pointer;
            transition: background-color 0.3s, transform 0.2s ease-out;
            position: absolute;
            top: 50%;
            transform: translate(-50%, -50%);
        }

        .scale-dot.active {
            background-color: #38b2ac;
            transform: translate(-50%, -50%) scale(1.4);
            box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.3);
        }

        /* --- 数量提示框 (Tooltip) --- */
        .quantity-tooltip {
            position: absolute;
            background-color: #2d3748;
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            top: -30px;
            transform: translateX(-50%);
            white-space: nowrap;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s, visibility 0.3s, top 0.3s;
            z-index: 10;
        }

        .quantity-tooltip.visible {
            opacity: 1;
            visibility: visible;
            top: -35px;
        }

        .quantity-tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            margin-left: -6px;
            border-width: 6px;
            border-style: solid;
            border-color: #2d3748 transparent transparent transparent;
        }

        /* --- 新增：下方折扣显示文字 --- */
        .discount-display {
            margin-top: 25px;
            text-align: center;
            color: #4a5568;
            font-size: 16px;
            font-weight: 500;
            height: 24px;
            transition: color 0.3s;
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
            .container-wrapper {
                padding: 20px;
                margin: 10px 0;
            }
        }
        </style>

        <script>
        document.addEventListener('DOMContentLoaded', () => {
            // --- 1. 配置和初始化 ---
            const config = <?php echo wp_json_encode($config); ?>;
            
            // 确保discountTiers使用API数据
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

            // --- 2. 获取 DOM 元素 ---
            const quantityInput = document.getElementById('quantity-input');
            const minusBtn = document.querySelector('.stepper-btn.minus');
            const plusBtn = document.querySelector('.stepper-btn.plus');
            const scaleDotsContainer = document.getElementById('scale-dots');
            const quantityTooltip = document.getElementById('quantity-tooltip');
            const scaleContainer = document.getElementById('discount-scale-container');
            const discountDisplayText = document.getElementById('discount-display-text');

            let currentQuantity = config.initialQuantity;

            // --- 3. 核心功能函数 ---

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
                currentQuantity = Math.max(config.initialQuantity, Math.min(newQuantity, config.maxStock));

                // 1. 更新输入框的值
                quantityInput.value = currentQuantity;

                // 2. 找到最接近的刻度点并激活
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

                // 3. 更新上方的数量提示框
                if (activeDot) {
                    quantityTooltip.textContent = closestDotQty;
                    const dotPosition = activeDot.offsetLeft + (activeDot.offsetWidth / 2);
                    quantityTooltip.style.left = `${dotPosition}px`;
                    quantityTooltip.classList.add('visible');
                } else {
                    quantityTooltip.classList.remove('visible');
                }

                // 4. 更新下方的折扣文字
                const discountText = getDiscountForQuantity(currentQuantity);
                if (discountText && discountText !== "0% OFF") {
                    discountDisplayText.textContent = `Discount: ${discountText}`;
                } else {
                    discountDisplayText.textContent = '';
                }

                // 5. 更新数量输入框（如果存在）
                const productQuantityInput = document.querySelector('input[name="quantity"]');
                if (productQuantityInput) {
                    productQuantityInput.value = currentQuantity;
                    // 触发change事件
                    const event = new Event('change', { bubbles: true });
                    productQuantityInput.dispatchEvent(event);
                }
            }

            // --- 4. 绑定事件监听 ---
            minusBtn.addEventListener('click', () => {
                updateAll(parseInt(quantityInput.value) - config.step);
            });

            plusBtn.addEventListener('click', () => {
                updateAll(parseInt(quantityInput.value) + config.step);
            });

            // --- 5. 初始加载 ---
            createScaleDots();
            updateAll(config.initialQuantity);
        });
        </script>
        <?php
    }
}