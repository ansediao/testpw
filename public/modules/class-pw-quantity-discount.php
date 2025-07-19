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
        add_action('pw_admin_single_product_custom_content', array($this, 'display_quantity_discount'), 45);
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

        if (is_wp_error($api_response) || !isset($api_response['data']['quantity_discount']) || 
            !is_array($api_response['data']['quantity_discount']) || empty($api_response['data']['quantity_discount'])) {
            return;
        }

        $quantity_discounts = $api_response['data']['quantity_discount'];
        
        // 过滤掉无效的折扣数据
        $valid_discounts = array_filter($quantity_discounts, function($discount) {
            return !($discount['range_from'] == 0 && $discount['range_to'] == 0);
        });

        // 如果没有有效的折扣数据，使用演示数据
        if (empty($valid_discounts)) {
            $valid_discounts = [
                [
                    'range_from' => 1,
                    'range_to' => 49,
                    'discount' => 0,
                    'extra_processing_time' => 0
                ],
                [
                    'range_from' => 50,
                    'range_to' => 99,
                    'discount' => 0.05,
                    'extra_processing_time' => 1
                ],
                [
                    'range_from' => 100,
                    'range_to' => 499,
                    'discount' => 0.1,
                    'extra_processing_time' => 2
                ],
                [
                    'range_from' => 500,
                    'range_to' => 999,
                    'discount' => 0.15,
                    'extra_processing_time' => 3
                ],
                [
                    'range_from' => 1000,
                    'range_to' => 0,
                    'discount' => 0.2,
                    'extra_processing_time' => 5
                ]
            ];
        }

        // 按数量范围排序
        usort($valid_discounts, function($a, $b) {
            return $a['range_from'] - $b['range_from'];
        });

        ?>
        
        <div id="pw-quantity-discount-container" class="pw-quantity-discount-data">
            <h3>数量折扣</h3>
            <div class="discount-table-wrapper">
                <table class="quantity-discount-table">
                    <thead>
                        <tr>
                            <th>数量范围</th>
                            <th>折扣</th>
                            <th>额外处理时间</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($valid_discounts as $discount): ?>
                            <tr>
                                <td>
                                    <?php 
                                    if ($discount['range_to'] == 0 || $discount['range_to'] == 999999) {
                                        echo esc_html($discount['range_from']) . '+';
                                    } else {
                                        echo esc_html($discount['range_from']) . ' - ' . esc_html($discount['range_to']);
                                    }
                                    ?>
                                </td>
                                <td class="discount-cell">
                                    <?php 
                                    $discount_percentage = $discount['discount'] * 100;
                                    if ($discount_percentage > 0) {
                                        echo '<span class="discount-badge">' . number_format($discount_percentage, 1) . '% OFF</span>';
                                    } else {
                                        echo '<span class="no-discount">无折扣</span>';
                                    }
                                    ?>
                                </td>
                                <td>
                                    <?php 
                                    if ($discount['extra_processing_time'] > 0) {
                                        echo '+' . esc_html($discount['extra_processing_time']) . ' 天';
                                    } else {
                                        echo '标准';
                                    }
                                    ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <div class="discount-note">
                <p><strong>注意：</strong> 折扣将根据您选择的数量自动应用。更大的订单量可能需要额外的处理时间。</p>
            </div>
        </div>

        <style>
        #pw-quantity-discount-container {
            background: #f9f9f9;
            border: 1px solid #ddd;
            margin: 15px 0;
            border-radius: 4px;
            padding: 15px;
        }

        #pw-quantity-discount-container h3 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 1.2em;
            font-weight: 600;
        }

        .discount-table-wrapper {
            overflow-x: auto;
            margin-bottom: 15px;
        }

        .quantity-discount-table {
            width: 100%;
            border-collapse: collapse;
            background: #fff;
            border-radius: 4px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .quantity-discount-table th {
            background: #007cba;
            color: #fff;
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
        }

        .quantity-discount-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
            font-size: 14px;
        }

        .quantity-discount-table tbody tr:last-child td {
            border-bottom: none;
        }

        .quantity-discount-table tbody tr:hover {
            background: #f8f9fa;
        }

        .quantity-discount-table tbody tr.highlight {
            background: #fff3cd !important;
            border-left: 4px solid #ffc107;
        }

        .discount-cell {
            text-align: center;
        }

        .discount-badge {
            background: #28a745;
            color: #fff;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            display: inline-block;
        }

        .no-discount {
            color: #6c757d;
            font-style: italic;
        }

        .discount-note {
            background: #e7f3ff;
            border: 1px solid #b3d9ff;
            border-radius: 4px;
            padding: 10px;
            font-size: 13px;
        }

        .discount-note p {
            margin: 0;
            color: #0066cc;
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
            .quantity-discount-table {
                font-size: 12px;
            }
            
            .quantity-discount-table th,
            .quantity-discount-table td {
                padding: 8px 10px;
            }
            
            #pw-quantity-discount-container h3 {
                font-size: 1.1em;
            }
        }
        </style>

        <script>
        document.addEventListener('DOMContentLoaded', function() {
            // 数量折扣数据
            const quantityDiscounts = <?php echo wp_json_encode($valid_discounts); ?>;
            
            // 监听数量滑块变化
            const quantitySlider = document.getElementById('quantity-slider');
            const discountDisplay = document.getElementById('discount-display');
            
            if (quantitySlider && discountDisplay) {
                function updateDiscountDisplay(quantity) {
                    let currentDiscount = 0;
                    let extraTime = 0;
                    
                    // 找到适用的折扣
                    for (let discount of quantityDiscounts) {
                        if (quantity >= discount.range_from && 
                            (discount.range_to == 0 || quantity <= discount.range_to)) {
                            currentDiscount = discount.discount;
                            extraTime = discount.extra_processing_time;
                            break;
                        }
                    }
                    
                    const discountPercentage = (currentDiscount * 100).toFixed(1);
                    let displayText = `折扣: ${discountPercentage}% OFF`;
                    
                    if (extraTime > 0) {
                        displayText += ` (额外处理时间: +${extraTime}天)`;
                    }
                    
                    discountDisplay.textContent = displayText;
                    
                    // 高亮对应的表格行
                    const tableRows = document.querySelectorAll('.quantity-discount-table tbody tr');
                    tableRows.forEach(row => row.classList.remove('highlight'));
                    
                    for (let i = 0; i < quantityDiscounts.length; i++) {
                        const discount = quantityDiscounts[i];
                        if (quantity >= discount.range_from && 
                            (discount.range_to == 0 || quantity <= discount.range_to)) {
                            if (tableRows[i]) {
                                tableRows[i].classList.add('highlight');
                            }
                            break;
                        }
                    }
                }
                
                quantitySlider.addEventListener('input', function() {
                    const quantity = parseInt(this.value);
                    updateDiscountDisplay(quantity);
                });
                
                // 初始化显示
                updateDiscountDisplay(parseInt(quantitySlider.value));
            }
        });
        </script>
        <?php
    }
}