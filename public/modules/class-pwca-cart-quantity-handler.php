<?php
/**
 * 购物车数量调整处理器
 * 处理 AJAX 请求和购物车数量更新逻辑
 * 
 * @package PW_Admin
 * @subpackage Cart_Quantity_Controls
 * @version 1.0.0
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 购物车数量调整处理器类
 */
class Pwca_Cart_Quantity_Handler {
    
    /**
     * 数量配置
     */
    private $quantity_config = [
        'products' => [
            ['step' => 2, 'min' => 9],   // 第一项商品
            ['step' => 5, 'min' => 29],  // 第二项商品
            ['step' => 3, 'min' => 19],  // 第三项商品
        ],
        'default' => ['step' => 2, 'min' => 5]
    ];
    
    /**
     * 构造函数
     */
    public function __construct() {
        $this->init();
    }
    
    /**
     * 初始化处理器
     */
    public function init() {
        // 注册 AJAX 处理器
        add_action('wp_ajax_pwca_update_cart_quantity', [$this, 'handle_cart_quantity_update']);
        add_action('wp_ajax_nopriv_pwca_update_cart_quantity', [$this, 'handle_cart_quantity_update']);
        
        // 注册脚本和样式
        add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts']);
        
        // 添加购物车页面检测
        add_action('wp', [$this, 'init_cart_page_features']);
        
        // 添加购物车更新钩子
        add_action('woocommerce_cart_updated', [$this, 'handle_cart_updated']);
        
        // 添加购物车验证钩子
        add_filter('woocommerce_update_cart_validation', [$this, 'validate_cart_quantity'], 10, 4);

        // 全局注册数量显示过滤器（逻辑内部再判断页面环境）
        add_filter('woocommerce_cart_item_quantity', [$this, 'modify_cart_item_quantity'], 10, 3);
    }
    
    /**
     * 初始化购物车页面功能
     */
    public function init_cart_page_features() {
        if ($this->is_custom_cart_page()) {
            // 在购物车页面添加额外的钩子
            add_action('woocommerce_before_cart_table', [$this, 'add_cart_notices']);
        }
    }
    
    /**
     * 检查是否为自定义购物车页面
     */
    private function is_custom_cart_page() {
        global $wp;
        // 前台判断
        $current_url = isset($wp->request) ? home_url($wp->request) : '';
        if (!empty($current_url) && strpos($current_url, 'custom-cart') !== false) {
            return true;
        }
        if (function_exists('is_cart') && is_cart()) {
            return true;
        }
        // AJAX 片段刷新判断（通过 Referer 识别）
        if (defined('DOING_AJAX') && DOING_AJAX) {
            $ref = wp_get_referer();
            if (!empty($ref) && strpos($ref, 'custom-cart') !== false) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 注册脚本和样式
     */
    public function enqueue_scripts() {
        if (!$this->is_custom_cart_page()) {
            return;
        }
        
        // 注册并加载 CSS
        wp_enqueue_style(
            'pwca-cart-quantity-controls',
            plugin_dir_url(__FILE__) . '../css/pwca-cart-quantity-controls.css',
            [],
            '1.0.0'
        );
        
        // 加载弹窗样式
        wp_enqueue_style(
            'pwca-cart-modal',
            plugin_dir_url(__FILE__) . '../css/pwca-cart-modal.css',
            [],
            '1.0.0'
        );
        
        // 注册并加载 JavaScript
        wp_enqueue_script(
            'pwca-cart-quantity-controls',
            plugin_dir_url(__FILE__) . '../js/pwca-cart-quantity-controls.js',
            ['jquery'],
            '1.0.0',
            true
        );
        
        // 加载弹窗脚本
        wp_enqueue_script(
            'pwca-cart-modal',
            plugin_dir_url(__FILE__) . '../js/pwca-cart-modal.js',
            ['jquery'],
            '1.0.0',
            true
        );
        
        // 本地化脚本数据
        wp_localize_script('pwca-cart-quantity-controls', 'pwca_cart_ajax', [
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('pwca_cart_quantity_nonce'),
            'messages' => [
                'updating' => __('正在更新...', 'pw-admin'),
                'error' => __('更新失败，请重试', 'pw-admin'),
                'success' => __('更新成功', 'pw-admin'),
                'invalid_quantity' => __('数量无效', 'pw-admin'),
                'min_quantity' => __('数量不能少于最小值', 'pw-admin'),
            ],
            'config' => $this->quantity_config
        ]);
    }
    
    /**
     * 处理购物车数量更新 AJAX 请求
     */
    public function handle_cart_quantity_update() {
        // 验证 nonce
        if (!wp_verify_nonce($_POST['nonce'], 'pwca_cart_quantity_nonce')) {
            wp_send_json_error([
                'message' => __('安全验证失败', 'pw-admin')
            ]);
        }
        
        // 获取请求参数
        $cart_key = sanitize_text_field($_POST['cart_key']);
        $quantity = intval($_POST['quantity']);
        
        // 验证参数
        if (empty($cart_key) || $quantity < 0) {
            wp_send_json_error([
                'message' => __('参数无效', 'pw-admin')
            ]);
        }
        
        try {
            // 获取购物车
            $cart = WC()->cart;
            if (!$cart) {
                throw new Exception(__('购物车不可用', 'pw-admin'));
            }
            
            // 验证购物车项目是否存在
            $cart_item = $cart->get_cart_item($cart_key);
            if (!$cart_item) {
                throw new Exception(__('购物车项目不存在', 'pw-admin'));
            }
            
            // 获取商品配置
            $product_index = $this->get_product_index_in_cart($cart_key);
            $config = $this->get_quantity_config($product_index);
            // 若购物车项携带自定义配置，则使用该配置覆盖
            if (isset($cart_item['custom_data']) && is_array($cart_item['custom_data'])) {
                $custom = $cart_item['custom_data'];
                if (isset($custom['min_order_quantity'])) {
                    $config['min'] = max(1, intval($custom['min_order_quantity']));
                }
                if (isset($custom['batch_quantity'])) {
                    $config['step'] = max(1, intval($custom['batch_quantity']));
                }
            }
            
            // 验证数量
            if ($quantity < $config['min']) {
                throw new Exception(sprintf(
                    __('数量不能少于 %d', 'pw-admin'),
                    $config['min']
                ));
            }
            
            // 验证步长
            if (($quantity - $config['min']) % $config['step'] !== 0) {
                // 自动调整到最近的有效值
                $quantity = $this->adjust_to_valid_quantity($quantity, $config);
            }
            
            // 更新购物车数量
            $result = $cart->set_quantity($cart_key, $quantity, true);
            
            if (!$result) {
                throw new Exception(__('更新购物车失败', 'pw-admin'));
            }
            
            // 计算购物车总计
            $cart->calculate_totals();
            
            // 获取更新后的片段
            $fragments = $this->get_cart_fragments();
            
            // 返回成功响应
            wp_send_json_success([
                'message' => __('购物车已更新', 'pw-admin'),
                'quantity' => $quantity,
                'cart_key' => $cart_key,
                'fragments' => $fragments,
                'cart_total' => WC()->cart->get_cart_total(),
                'cart_count' => WC()->cart->get_cart_contents_count()
            ]);
            
        } catch (Exception $e) {
            wp_send_json_error([
                'message' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * 获取商品在购物车中的索引
     */
    private function get_product_index_in_cart($cart_key) {
        $cart_items = WC()->cart->get_cart();
        $index = 0;
        
        foreach ($cart_items as $key => $item) {
            if ($key === $cart_key) {
                return $index;
            }
            $index++;
        }
        
        return -1; // 未找到
    }
    
    /**
     * 获取数量配置
     */
    private function get_quantity_config($index) {
        if ($index >= 0 && $index < count($this->quantity_config['products'])) {
            return $this->quantity_config['products'][$index];
        }
        
        return $this->quantity_config['default'];
    }
    
    /**
     * 调整到有效数量
     */
    private function adjust_to_valid_quantity($quantity, $config) {
        $min = $config['min'];
        $step = $config['step'];
        
        if ($quantity < $min) {
            return $min;
        }
        
        // 计算最近的有效值
        $diff = $quantity - $min;
        $remainder = $diff % $step;
        
        if ($remainder === 0) {
            return $quantity;
        }
        
        // 向上或向下调整到最近的有效值
        if ($remainder <= $step / 2) {
            return $quantity - $remainder;
        } else {
            return $quantity + ($step - $remainder);
        }
    }
    
    /**
     * 获取购物车片段
     */
    private function get_cart_fragments() {
        // 使用 WooCommerce 标准的片段获取机制
        if (function_exists('wc_get_refreshed_fragments')) {
            $fragments = wc_get_refreshed_fragments();
        } else {
            // 备用方案：手动构建片段
            $fragments = [];
            
            // 获取购物车总计片段
            if (function_exists('wc_get_template')) {
                ob_start();
                wc_get_template('cart/cart-totals.php');
                $cart_totals = ob_get_clean();
                if (!empty($cart_totals)) {
                    $fragments['.cart-totals'] = $cart_totals;
                }
                
                // 获取迷你购物车片段
                ob_start();
                wc_get_template('cart/mini-cart.php');
                $mini_cart = ob_get_clean();
                if (!empty($mini_cart)) {
                    $fragments['.widget_shopping_cart_content'] = $mini_cart;
                }
            }
        }
        
        // 添加购物车相关的关键片段
        $fragments['.cart-total'] = WC()->cart->get_cart_total();
        $fragments['.cart-subtotal'] = WC()->cart->get_cart_subtotal();
        $fragments['.cart-count'] = WC()->cart->get_cart_contents_count();
        
        // 获取每个购物车项目的小计
        $cart_items = WC()->cart->get_cart();
        foreach ($cart_items as $cart_item_key => $cart_item) {
            $product = $cart_item['data'];
            $quantity = $cart_item['quantity'];
            
            // 计算单项小计
            $line_total = WC()->cart->get_product_subtotal($product, $quantity);
            $fragments['.cart_item[data-key="' . $cart_item_key . '"] .product-subtotal'] = '<td class="product-subtotal">' . $line_total . '</td>';
            
            // 更新数量显示
            $fragments['.cart_item[data-key="' . $cart_item_key . '"] .product-quantity .qty'] = $quantity;
        }
        
        // 添加购物车表格的完整更新
        if (function_exists('wc_get_template')) {
            ob_start();
            wc_get_template('cart/cart.php');
            $cart_table = ob_get_clean();
            if (!empty($cart_table)) {
                $fragments['.woocommerce-cart-form'] = $cart_table;
            }
        }
        
        return apply_filters('pwca_cart_quantity_fragments', $fragments);
    }
    
    /**
     * 验证购物车数量
     */
    public function validate_cart_quantity($passed, $cart_item_key, $values, $quantity) {
        if (!$passed) {
            return $passed;
        }
        
        // 获取商品配置
        $product_index = $this->get_product_index_in_cart($cart_item_key);
        $config = $this->get_quantity_config($product_index);
        
        // 验证最小数量
        if ($quantity < $config['min']) {
            wc_add_notice(sprintf(
                __('商品 "%s" 的数量不能少于 %d', 'pw-admin'),
                $values['data']->get_name(),
                $config['min']
            ), 'error');
            return false;
        }
        
        // 验证步长
        if (($quantity - $config['min']) % $config['step'] !== 0) {
            wc_add_notice(sprintf(
                __('商品 "%s" 的数量必须是 %d 的倍数（最小值：%d）', 'pw-admin'),
                $values['data']->get_name(),
                $config['step'],
                $config['min']
            ), 'error');
            return false;
        }
        
        return $passed;
    }
    
    /**
     * 处理购物车更新后的操作
     */
    public function handle_cart_updated() {
        // 可以在这里添加购物车更新后的自定义逻辑
        do_action('pwca_cart_quantity_updated');
    }
    
    /**
     * 修改购物车项目数量显示
     */
    public function modify_cart_item_quantity($product_quantity, $cart_item_key, $cart_item) {
        // 仅在自定义购物车页面应用
        if (!$this->is_custom_cart_page()) {
            return $product_quantity;
        }

        // 从购物车项的 custom_data 读取起订量与批数量
        $min = null;
        $step = null;
        if (isset($cart_item['custom_data']) && is_array($cart_item['custom_data'])) {
            $custom = $cart_item['custom_data'];
            if (isset($custom['min_order_quantity'])) {
                $min = intval($custom['min_order_quantity']);
            }
            if (isset($custom['batch_quantity'])) {
                $step = intval($custom['batch_quantity']);
            }
        }

        // 回退到处理器默认配置
        if ($min === null || $min <= 0 || $step === null || $step <= 0) {
            $index = $this->get_product_index_in_cart($cart_item_key);
            $config = $this->get_quantity_config($index);
            if ($min === null || $min <= 0) { $min = intval($config['min']); }
            if ($step === null || $step <= 0) { $step = intval($config['step']); }
        }

        // 当前数量值
        $current_qty = isset($cart_item['quantity']) ? intval($cart_item['quantity']) : 1;
        if ($current_qty < $min) {
            $current_qty = $min;
        }

        // 构建带有 min/step 的数量输入，保持 WooCommerce 命名规范
        $input_name = sprintf('cart[%s][qty]', $cart_item_key);
        $input_id   = sprintf('pwca-qty-%s', $cart_item_key);
        $classes    = 'input-text qty text';

        $custom_input = sprintf(
            '<input type="number" id="%s" class="%s" name="%s" value="%d" min="%d" step="%d" data-min="%d" data-step="%d" aria-label="数量">',
            esc_attr($input_id),
            esc_attr($classes),
            esc_attr($input_name),
            esc_attr($current_qty),
            esc_attr($min),
            esc_attr($step),
            esc_attr($min),
            esc_attr($step)
        );

        return $custom_input;
    }
    
    /**
     * 添加购物车通知
     */
    public function add_cart_notices() {
        // 添加数量控制相关的通知
        if (isset($_GET['pwca_quantity_updated'])) {
            wc_add_notice(__('购物车数量已更新', 'pw-admin'), 'success');
        }
    }
    
    /**
     * 获取错误消息
     */
    public function get_error_message($error_code) {
        $messages = [
            'invalid_quantity' => __('数量无效', 'pw-admin'),
            'min_quantity' => __('数量不能少于最小值', 'pw-admin'),
            'step_validation' => __('数量必须符合步长要求', 'pw-admin'),
            'cart_error' => __('购物车操作失败', 'pw-admin'),
            'security_error' => __('安全验证失败', 'pw-admin'),
        ];
        
        return isset($messages[$error_code]) ? $messages[$error_code] : __('未知错误', 'pw-admin');
    }
    
    /**
     * 记录调试信息
     */
    private function log_debug($message, $data = []) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log(sprintf(
                '[PWCA Cart Quantity] %s: %s',
                $message,
                print_r($data, true)
            ));
        }
    }
}

// 初始化处理器
new Pwca_Cart_Quantity_Handler();