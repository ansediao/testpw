<?php

/**
 * The public-facing functionality of the plugin.
 *
 * @link       https://www.pw.com
 * @since      1.0.0
 *
 * @package    Pw_Admin
 * @subpackage Pw_Admin/public
 */

/**
 * The public-facing functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the public-facing stylesheet and JavaScript.
 * Also includes custom WooCommerce functionality.
 *
 * @package    Pw_Admin
 * @subpackage Pw_Admin/public
 * @author     PW <pw@pwcom>
 */
class Pw_Admin_Public
{

    /**
     * The ID of this plugin.
     *
     * @since    1.0.0
     * @access   private
     * @var      string    $plugin_name    The ID of this plugin.
     */
    private $plugin_name;

    /**
     * The version of this plugin.
     *
     * @since    1.0.0
     * @access   private
     * @var      string    $version    The current version of this plugin.
     */
    private $version;

    /**
     * Initialize the class and set its properties.
     *
     * @since    1.0.0
     * @param      string    $plugin_name       The name of the plugin.
     * @param      string    $version    The version of this plugin.
     */
    public function __construct($plugin_name, $version)
    {

        $this->plugin_name = $plugin_name;
        $this->version = $version;

        // --- BEGIN ADDED WOOCOMMERCE HOOKS ---

        // Add custom button and color selection after add to cart button
        add_action('pw_admin_single_product_custom_content', array($this, 'add_custom_button_after_cart'));
        add_action('pw_admin_single_product_custom_content', array($this, 'add_color_selection_after_cart'));
        
        // Add content between quantity selector and add to cart button
        add_action('pw_admin_single_product_custom_content', array($this, 'add_content_between_quantity_and_cart'), 25);

        // Validate cart contents before adding new items
        add_filter('woocommerce_add_to_cart_validation', array($this, 'validate_cart_products_before_add'), 10, 2);

        // Handle AJAX request for adding custom products
        add_action('wp_ajax_add_customized_product_to_cart', array($this, 'add_customized_product_to_cart'));
        add_action('wp_ajax_nopriv_add_customized_product_to_cart', array($this, 'add_customized_product_to_cart'));

        // Display custom data in cart and checkout
        add_filter('woocommerce_get_item_data', array($this, 'display_custom_product_image'), 10, 2);
        add_filter('woocommerce_order_item_name', array($this, 'display_custom_image_in_order'), 10, 2);

        // add_action('woocommerce_after_cart_item_name', 'add_custom_text_after_cart_item_name', 10, 2);

        // Add custom color image overlay on product page
        add_action('woocommerce_before_single_product', array($this, 'add_custom_color_image'));

        // Ensure HTML in cart item meta is displayed correctly
        add_filter('woocommerce_display_item_meta', array($this, 'display_cart_images_properly'), 10, 3);

        // Add product inquiry form tab
        add_filter('woocommerce_product_tabs', array($this, 'add_product_inquiry_tab'));
        
        // Handle product inquiry form submission
        add_action('admin_post_nopriv_handle_product_inquiry', array($this, 'process_product_inquiry_form'));
        add_action('admin_post_handle_product_inquiry', array($this, 'process_product_inquiry_form'));
        
        // Add admin notices for Flamingo unread messages
        add_action('admin_notices', array($this, 'show_flamingo_unread_messages_notice'));
        
        // Mark Flamingo messages as read when viewed
        add_action('admin_init', array($this, 'mark_flamingo_message_as_read_on_view'));
        
        // Add custom cart column functionality
        add_action('woocommerce_after_cart_item_name', array($this, 'add_custom_cart_column_data_revised'), 10, 2);
        add_action('wp_footer', array($this, 'move_custom_cart_column_with_js_revised'));

        // Hide price for sync products
        add_filter('woocommerce_get_price_html', array($this, 'hide_sync_product_price'), 10, 2);
        add_filter('woocommerce_variable_price_html', array($this, 'hide_sync_product_price'), 10, 2);
        add_filter('woocommerce_variable_sale_price_html', array($this, 'hide_sync_product_price'), 10, 2);

        // Remove add to cart actions for sync products
        add_action('wp', array($this, 'conditionally_remove_simple_add_to_cart_button'));

        // Add custom hook within single product summary (after default content)
        add_action('woocommerce_single_product_summary', array($this, 'trigger_pw_custom_product_hook'), 25);

        // Add sync product API data display
        add_action('pw_admin_single_product_custom_content', array($this, 'display_sync_product_api_data'));

        // --- END ADDED WOOCOMMERCE HOOKS ---

    }

    /**
     * Register the stylesheets for the public-facing side of the site.
     *
     * @since    1.0.0
     */
    public function enqueue_styles()
    {

        /**
         * This function is provided for demonstration purposes only.
         *
         * An instance of this class should be passed to the run() function
         * defined in Pw_Admin_Loader as all of the hooks are defined
         * in that particular class.
         *
         * The Pw_Admin_Loader will then create the relationship
         * between the defined hooks and the functions defined in this
         * class.
         */

        // 引入阿里图标库CSS
        // wp_enqueue_style('pw-public-iconfont', '//at.alicdn.com/t/c/font_4970780_pfyts3fzl6.css', array(), $this->version, 'all');
        
        wp_enqueue_style($this->plugin_name, plugin_dir_url(__FILE__) . 'css/pw-admin-public.css', array(), $this->version, 'all');
    }

    /**
     * Register the JavaScript for the public-facing side of the site.
     *
     * @since    1.0.0
     */
    public function enqueue_scripts()
    {

        /**
         * This function is provided for demonstration purposes only.
         *
         * An instance of this class should be passed to the run() function
         * defined in Pw_Admin_Loader as all of the hooks are defined
         * in that particular class.
         *
         * The Pw_Admin_Loader will then create the relationship
         * between the defined hooks and the functions defined in this
         * class.
         */

        wp_enqueue_script($this->plugin_name, plugin_dir_url(__FILE__) . 'js/pw-admin-public.js', array('jquery'), $this->version, false);

        // 添加内联脚本处理购物车图片
        $script = '
            (function($) {
                // 处理购物车中的自定义图片
                function processCartImages() {
                    $(".custom-product-image").each(function() {
                        var container = $(this);
                        var imageUrl = container.data("image-url");
                        if (imageUrl) {
                            container.html(\'<img src="\' + imageUrl + \'" alt="定制设计" style="max-width: 100px; height: auto; display: block; border: 1px solid #ddd; padding: 5px; background: #fff;">\');
                        }
                    });
                }

                // 初始处理
                processCartImages();

                // 监听购物车更新事件
                $(document.body).on("updated_cart_totals", function() {
                    processCartImages();
                });

                // 监听结账页面更新
                $(document.body).on("updated_checkout", function() {
                    processCartImages();
                });
            })(jQuery);
        ';

        wp_add_inline_script($this->plugin_name, $script);
    }

    // --- BEGIN ADDED WOOCOMMERCE METHODS ---

    /**
     * 在加入购物车按钮后添加在线定制按钮
     * Hooks into: woocommerce_after_add_to_cart_button
     * @since    X.X.X // Replace with your version
     */
    public function add_custom_button_after_cart()
    {
        global $product;

        // Ensure $product is a valid product object
        if (!is_a($product, 'WC_Product')) {
            return;
        }

        // 获取产品ID
        $product_id = $product->get_id();

        // 检查是否为同步产品
        $pw_isSyncProduct = get_post_meta($product_id, 'pw_isSyncProduct', true);

        if ($pw_isSyncProduct == '1') {
            echo '<a href="' . esc_url(site_url('/pwcanvas/')) . '?product_id=' . esc_attr($product_id) . '" class="button alt" style="margin-top: 30px;">在线定制</a>';
        }
    }

    /**
     * 在加入购物车按钮下添加颜色选择
     * Hooks into: woocommerce_after_add_to_cart_button
     * @since    X.X.X // Replace with your version
     */
    public function add_color_selection_after_cart()
    {
        global $product;

        // Ensure $product is a valid product object
        if (!is_a($product, 'WC_Product')) {
            return;
        }

        // 获取产品ID
        $product_id = $product->get_id();

        // 检查是否为同步产品
        $pw_isSyncProduct = get_post_meta($product_id, 'pw_isSyncProduct', true);

        if ($pw_isSyncProduct == '1') {
?>
            <div class="color-selection" style="margin-top: 20px;">
                <p>Select Color:</p>
                <div class="color-options" style="display: flex; gap: 10px;">
                    <div class="color-box" data-color="black" data-filter="brightness(0) saturate(100%)" style="width: 30px; height: 30px; background: black; cursor: pointer; border: 1px solid #ddd;"></div>
                    <div class="color-box" data-color="red" data-filter="brightness(0) saturate(100%) invert(15%) sepia(95%) saturate(6932%) hue-rotate(359deg) brightness(100%) contrast(112%)" style="width: 30px; height: 30px; background: red; cursor: pointer; border: 1px solid #ddd;"></div>
                    <div class="color-box" data-color="blue" data-filter="brightness(0) saturate(100%) invert(8%) sepia(98%) saturate(7154%) hue-rotate(248deg) brightness(97%) contrast(143%)" style="width: 30px; height: 30px; background: blue; cursor: pointer; border: 1px solid #ddd;"></div>
                    <div class="color-box" data-color="white" data-filter="brightness(0) saturate(100%) invert(100%)" style="width: 30px; height: 30px; background: white; cursor: pointer; border: 1px solid #ddd;"></div>
                </div>
                <p>or</p>
        <div class="action-buttons">
            <button class="btn btn-gradient" style="margin-right:10px;">Gradient</button>
            
            <button class="btn btn-custom">Custom Colors</button>
            <hr>
        </div>
        <style>
            .action-buttons .btn{
                color:#fff;
                background-color: rgba(17, 187, 245, 1);
                border: none;
    border-radius: 5px;
    -moz-box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.349019607843137);
    -webkit-box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.349019607843137);
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.349019607843137);
    padding:10px;
    font-size: 16px;
            }
        </style>
        
        <!-- 添加勾选框 -->
        <div class="product-options" style="margin-top: 20px;">
            <div style="display: flex; gap: 20px; align-items: center;">
                <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                    <input type="checkbox" id="buy_sample" name="buy_sample" value="1" style="margin: 0;">
                    <span>Buy Sample</span>
                </label>
                <br>
                <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                    <input type="checkbox" id="blank_product" name="blank_product" value="1" style="margin: 0;">
                    <span>Blank Product</span>
                </label>
            </div>
            <hr>
        </div>
        
        <!-- 添加数量滑块 -->
        <div class="quantity-slider-section" style="margin-top: 20px;">
            <div style="padding: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-weight: bold;"></span>
                    <span id="quantity-display" style="font-weight: bold; color: #007cba;">1</span>
                </div>
                <div style="position: relative; margin-bottom: 15px;">
                    <input type="range" id="quantity-slider" min="1" max="100" value="1" class="custom-slider">
                    <div class="slider-marks" style="display: flex; justify-content: space-between; margin-top: 5px; font-size: 12px; color: #666;">
                        <span>1</span>
                        <span>25</span>
                        <span>50</span>
                        <span>75</span>
                        <span>100</span>
                    </div>
                </div>
                <style>
                    .custom-slider {
                        width: 100%;
                        height: 6px;
                        border-radius: 3px;
                        background: #ddd;
                        outline: none;
                        -webkit-appearance: none;
                        appearance: none;
                    }
                    
                    .custom-slider::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        background: #007cba;
                        cursor: pointer;
                        border: 2px solid #fff;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    }
                    
                    .custom-slider::-moz-range-thumb {
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        background: #007cba;
                        cursor: pointer;
                        border: 2px solid #fff;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    }
                    
                    .slider-mark {
                        position: absolute;
                        top: 50%;
                        transform: translate(-50%, -50%);
                        width: 12px;
                        height: 12px;
                        background-color: #ccc;
                        border-radius: 50%;
                        cursor: pointer;
                        transition: background-color 0.3s;
                    }
                    
                    .slider-mark:hover {
                        background-color: #999;
                    }
                    
                    .slider-mark[data-value="1"] { left: 0%; }
                    .slider-mark[data-value="25"] { left: 24.24%; }
                    .slider-mark[data-value="50"] { left: 49.49%; }
                    .slider-mark[data-value="75"] { left: 74.74%; }
                    .slider-mark[data-value="100"] { left: 100%; }
                    
                    .custom-slider::-webkit-slider-track {
                        width: 100%;
                        height: 6px;
                        cursor: pointer;
                        background: #ddd;
                        border-radius: 3px;
                    }
                    
                    .custom-slider::-moz-range-track {
                        width: 100%;
                        height: 6px;
                        cursor: pointer;
                        background: #ddd;
                        border-radius: 3px;
                        border: none;
                    }
                </style>
                <div id="discount-display" style="">Discount: 0% off</div>
            </div>
        </div>
            </div>
            <canvas id="shadowLayer" width="600" height="600" style="display:none;"></canvas>
            <div id="gradient-color-modal" style="display:none; position:fixed; left:0; top:0; width:100vw; height:100vh; background:rgba(0,0,0,0.3); z-index:9999; align-items:center; justify-content:center;">
                <div style="background:#fff; border-radius:8px; max-width:400px; width:90vw; padding:1rem; position:relative;">
                    <button id="close-gradient-color-modal" style="position:absolute; right:0.5rem; top:0.5rem; background:none; border:none; font-size:1.5rem; cursor:pointer;">&times;</button>
                    <h3 style="margin-top:0;">选择渐变色</h3>
                    <div style="margin-bottom:1rem;">
                        <label for="gradientColor1" style="display:block; margin-bottom:0.5rem;">颜色 1:</label>
                        <input type="color" id="gradientColor1" value="#ff0000" style="width:100%; height:50px;" />
                    </div>
                    <div style="margin-bottom:1rem;">
                        <label for="gradientColor2" style="display:block; margin-bottom:0.5rem;">颜色 2:</label>
                        <input type="color" id="gradientColor2" value="#0000ff" style="width:100%; height:50px;" />
                    </div>
                    <div style="margin-bottom:1rem;">
                        <label for="gradientDirection" style="display:block; margin-bottom:0.5rem;">方向:</label>
                        <select id="gradientDirection" style="width:100%; padding:0.5rem;">
                            <option value="to right">从左到右</option>
                            <option value="to bottom">从上到下</option>
                            <option value="to bottom right">从左上到右下</option>
                            <option value="to bottom left">从右上到左下</option>
                        </select>
                    </div>
                    <button id="applyGradientColor" class="btn btn-inquiry" style="width:100%;">应用渐变色</button>
                </div>
            </div>
            <script>
                const shadowCanvas = document.getElementById('shadowLayer');
                const shadowCtx = shadowCanvas ? shadowCanvas.getContext('2d') : null;
                let currentColor = '#000000'; // 初始颜色，或从某个地方获取

                // 确保 shadowCanvas 的 data-color-image 属性被设置
                // 假设产品图片 URL 可以从 PHP 获取并设置到这里
                const initialColorImageUrl = '<?php global $product; echo esc_url(get_post_meta($product->get_id(), 'pw_mainIMG_color', true)); ?>';
                const currentColorImageUrl = initialColorImageUrl; // 为了兼容性，添加这个变量
                if (shadowCanvas && initialColorImageUrl) {
                    shadowCanvas.setAttribute('data-color-image', initialColorImageUrl);
                }

                function loadColorImage(imageUrl, color) {
                    if (!shadowCanvas || !shadowCtx) return;

                    const colorImg = new Image();
                    colorImg.onload = function () {
                        const scale = Math.min(shadowCanvas.width / colorImg.width, shadowCanvas.height / colorImg.height);
                        const width = colorImg.width * scale;
                        const height = colorImg.height * scale;
                        const x = (shadowCanvas.width - width) / 2;
                        const y = (shadowCanvas.height - height) / 2;
                        shadowCtx.clearRect(0, 0, shadowCanvas.width, shadowCanvas.height);
                        // 绘制原始图片
                        shadowCtx.drawImage(colorImg, x, y, width, height);
                        // 应用颜色
                        shadowCtx.globalCompositeOperation = 'source-in';
                        shadowCtx.fillStyle = color;
                        shadowCtx.fillRect(0, 0, shadowCanvas.width, shadowCanvas.height);
                        // 重置混合模式
                        shadowCtx.globalCompositeOperation = 'source-over';
                        // setTimeout(() => updateModelFromCanvas(), 100); // 暂时注释掉
                    };
                    colorImg.src = imageUrl;
                }

                // 渐变应用函数
                function applyGradientToCanvas(canvas, color1, color2, direction) {
                    if (!canvas || !window.colorImageUrl) return;
                    
                    const ctx = canvas.getContext('2d');
                    
                    // 重新加载原始图片
                    const colorImage = new Image();
                    colorImage.crossOrigin = 'anonymous';
                    colorImage.onload = function() {
                        // 清除canvas
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        
                        // 绘制原始图片
                        ctx.drawImage(colorImage, 0, 0, canvas.width, canvas.height);
                        
                        // 创建渐变
                        let gradient;
                        const width = canvas.width;
                        const height = canvas.height;
                        
                        if (direction === 'to right') {
                            gradient = ctx.createLinearGradient(0, 0, width, 0);
                        } else if (direction === 'to bottom') {
                            gradient = ctx.createLinearGradient(0, 0, 0, height);
                        } else if (direction === 'to bottom right') {
                            gradient = ctx.createLinearGradient(0, 0, width, height);
                        } else if (direction === 'to bottom left') {
                            gradient = ctx.createLinearGradient(width, 0, 0, height);
                        } else {
                            // 默认从左到右
                            gradient = ctx.createLinearGradient(0, 0, width, 0);
                        }
                        
                        gradient.addColorStop(0, color1);
                        gradient.addColorStop(1, color2);
                        
                        // 应用渐变叠加
                        ctx.globalCompositeOperation = 'source-atop';
                        ctx.fillStyle = gradient;
                        ctx.fillRect(0, 0, width, height);
                        
                        // 恢复正常的合成操作
                        ctx.globalCompositeOperation = 'source-over';
                        
                        console.log('Gradient applied to canvas successfully');
                    };
                    colorImage.src = window.colorImageUrl;
                }
                
                // 渐变按钮事件处理
                document.addEventListener('DOMContentLoaded', function() {
                    const gradientColorBtn = document.querySelector('.btn-gradient');
                    const gradientColorModal = document.getElementById('gradient-color-modal');
                    const closeGradientColorModal = document.getElementById('close-gradient-color-modal');
                    const applyGradientColorBtn = document.getElementById('applyGradientColor');
                    const gradientColor1 = document.getElementById('gradientColor1');
                    const gradientColor2 = document.getElementById('gradientColor2');
                    const gradientDirection = document.getElementById('gradientDirection');

                    if (gradientColorBtn && gradientColorModal && closeGradientColorModal && applyGradientColorBtn && gradientColor1 && gradientColor2 && gradientDirection) {
                        gradientColorBtn.addEventListener('click', function(e) {
                            e.preventDefault();
                            gradientColorModal.style.display = 'flex';
                        });
                        closeGradientColorModal.addEventListener('click', function() {
                            gradientColorModal.style.display = 'none';
                        });
                        gradientColorModal.addEventListener('click', function(e) {
                            if (e.target === gradientColorModal) {
                                gradientColorModal.style.display = 'none';
                            }
                        });
                        applyGradientColorBtn.addEventListener('click', function(e) {
                            e.preventDefault();
                            const color1 = gradientColor1.value;
                            const color2 = gradientColor2.value;
                            const direction = gradientDirection.value;
                            
                            console.log('Applying gradient:', color1, 'to', color2, 'direction:', direction);
                            
                            // 应用渐变到主要的颜色canvas
                            if (window.colorCanvas && window.colorImageUrl) {
                                applyGradientToCanvas(window.colorCanvas, color1, color2, direction);
                            }
                            
                            // 更新Canvas中的颜色图片（如果存在shadowCanvas）
                            if (shadowCanvas && shadowCtx) {
                                const width = shadowCanvas.width;
                                const height = shadowCanvas.height;
                                let gradient;
                                if (direction === 'to right') {
                                    gradient = shadowCtx.createLinearGradient(0, 0, width, 0);
                                } else if (direction === 'to bottom') {
                                    gradient = shadowCtx.createLinearGradient(0, 0, 0, height);
                                } else if (direction === 'to bottom right') {
                                    gradient = shadowCtx.createLinearGradient(0, 0, width, height);
                                } else if (direction === 'to bottom left') {
                                    gradient = shadowCtx.createLinearGradient(width, 0, 0, height);
                                }
                                gradient.addColorStop(0, color1);
                                gradient.addColorStop(1, color2);
                                shadowCtx.globalCompositeOperation = 'source-in';
                                shadowCtx.fillStyle = gradient;
                                shadowCtx.fillRect(0, 0, width, height);
                                shadowCtx.globalCompositeOperation = 'source-over';
                            }
                            
                            // 保存渐变色信息（使用第一个颜色）
                            currentColor = color1;
                            if (!jQuery('#selected_color').length) {
                                jQuery('form.cart').append('<input type="hidden" id="selected_color" name="selected_color" value="gradient(' + color1 + ',' + color2 + ',' + direction + ')">');
                            } else {
                                jQuery('#selected_color').val('gradient(' + color1 + ',' + color2 + ',' + direction + ')');
                            }
                            
                            // 更新按钮选中状态
                            jQuery('.color-box').removeClass('selected');
                            jQuery('.btn-gradient, .btn-custom').removeClass('selected');
                            jQuery('.btn-gradient').addClass('selected');
                            
                            gradientColorModal.style.display = 'none';
                        });
                    }
                });
            </script>
            <div id="custom-color-modal" style="display:none; position:fixed; left:0; top:0; width:100vw; height:100vh; background:rgba(0,0,0,0.3); z-index:9999; align-items:center; justify-content:center;">
                <div style="background:#fff; border-radius:8px; max-width:300px; width:90vw; padding:1rem; position:relative;">
                    <button id="close-custom-color-modal" style="position:absolute; right:0.5rem; top:0.5rem; background:none; border:none; font-size:1.5rem; cursor:pointer;">&times;</button>
                    <h3 style="margin-top:0;">选择自定义颜色</h3>
                    <input type="color" id="customColorPicker" value="#000000" style="width:100%; height:100px; margin-bottom:1rem;" />
                    <button id="applyCustomColor" class="btn btn-inquiry" style="width:100%;">应用颜色</button>
                </div>
            </div>
            <script>
                document.addEventListener('DOMContentLoaded', function() {
                    const customColorBtn = document.querySelector('.btn-custom');
                    const customColorModal = document.getElementById('custom-color-modal');
                    const closeCustomColorModal = document.getElementById('close-custom-color-modal');
                    const applyCustomColorBtn = document.getElementById('applyCustomColor');
                    const customColorPicker = document.getElementById('customColorPicker');

                    if (customColorBtn && customColorModal && closeCustomColorModal && applyCustomColorBtn && customColorPicker) {
                        customColorBtn.addEventListener('click', function(e) {
                            e.preventDefault();
                            customColorModal.style.display = 'flex';
                        });
                        closeCustomColorModal.addEventListener('click', function() {
                            customColorModal.style.display = 'none';
                        });
                        customColorModal.addEventListener('click', function(e) {
                            if (e.target === customColorModal) {
                                customColorModal.style.display = 'none';
                            }
                        });
                        applyCustomColorBtn.addEventListener('click', function(e) {
                            e.preventDefault();
                            const color = customColorPicker.value;
                            currentColor = color;
                            updateProductColor(color);
                            customColorModal.style.display = 'none';
                        });
                    }
                });
            </script>
            <script>
                // 统一的颜色更新函数
                function updateProductColor(color) {
                    // 更新Canvas颜色叠加（新的canvas方式）
                    if (window.colorCanvas && window.colorImageUrl) {
                        const canvas = window.colorCanvas;
                        const ctx = canvas.getContext('2d');
                        
                        // 重新加载原始图片
                        const colorImage = new Image();
                        colorImage.crossOrigin = 'anonymous';
                        colorImage.onload = function() {
                            // 清除canvas
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            
                            // 绘制原始图片
                            ctx.drawImage(colorImage, 0, 0, canvas.width, canvas.height);
                            
                            // 应用颜色叠加
                            if (color && color !== 'original') {
                                ctx.globalCompositeOperation = 'source-atop';
                                
                                // 根据颜色类型应用不同的叠加效果
                                if (color === 'black') {
                                    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                                } else if (color === 'red') {
                                    ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
                                } else if (color === 'blue') {
                                    ctx.fillStyle = 'rgba(0, 0, 255, 0.6)';
                                } else if (color === 'white') {
                                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                                } else if (color.startsWith('#')) {
                                    // 对于自定义颜色，转换为rgba
                                    const rgb = hexToRgb(color);
                                    if (rgb) {
                                        ctx.fillStyle = 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', 0.6)';
                                    }
                                }
                                
                                // 填充颜色叠加
                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                                
                                // 恢复正常的合成操作
                                ctx.globalCompositeOperation = 'source-over';
                            }
                        };
                        colorImage.src = window.colorImageUrl;
                    }
                    
                    // 兼容旧的img方式（如果仍然存在）
                    if (jQuery('img.custom-color-image-overlay').length > 0) {
                        let filter = '';
                        if (color === 'black') {
                            filter = 'brightness(0) saturate(100%)';
                        } else if (color === 'red') {
                            filter = 'brightness(0) saturate(100%) invert(15%) sepia(95%) saturate(6932%) hue-rotate(359deg) brightness(100%) contrast(112%)';
                        } else if (color === 'blue') {
                            filter = 'brightness(0) saturate(100%) invert(8%) sepia(98%) saturate(7154%) hue-rotate(248deg) brightness(97%) contrast(143%)';
                        } else if (color === 'white') {
                            filter = 'brightness(0) saturate(100%) invert(100%)';
                        } else if (color.startsWith('#')) {
                            const rgb = hexToRgb(color);
                            if (rgb) {
                                const hue = rgbToHue(rgb.r, rgb.g, rgb.b);
                                filter = 'brightness(0) saturate(100%) hue-rotate(' + hue + 'deg) brightness(1.2)';
                            }
                        }
                        jQuery('img.custom-color-image-overlay').css('filter', filter);
                    }
                    
                    // 更新Canvas（如果存在shadowCanvas）
                    const colorImageUrl = shadowCanvas ? shadowCanvas.getAttribute('data-color-image') : null;
                    if (colorImageUrl && typeof loadColorImage === 'function') {
                        loadColorImage(colorImageUrl, color);
                    }
                    
                    // 保存选中的颜色
                    if (!jQuery('#selected_color').length) {
                        jQuery('form.cart').append('<input type="hidden" id="selected_color" name="selected_color" value="' + color + '">');
                    } else {
                        jQuery('#selected_color').val(color);
                    }
                }
                
                // 颜色转换辅助函数
                function hexToRgb(hex) {
                    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                    return result ? {
                        r: parseInt(result[1], 16),
                        g: parseInt(result[2], 16),
                        b: parseInt(result[3], 16)
                    } : null;
                }
                
                function rgbToHue(r, g, b) {
                    r /= 255;
                    g /= 255;
                    b /= 255;
                    const max = Math.max(r, g, b);
                    const min = Math.min(r, g, b);
                    let h = 0;
                    if (max !== min) {
                        const d = max - min;
                        switch (max) {
                            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                            case g: h = (b - r) / d + 2; break;
                            case b: h = (r - g) / d + 4; break;
                        }
                        h /= 6;
                    }
                    return h * 360;
                }
                
                jQuery(document).ready(function($) {
                    // 为所有颜色框添加点击事件
                    $(document).on('click', '.color-box', function() {
                        var selectedColor = $(this).data('color');
                        currentColor = selectedColor;
                        updateProductColor(selectedColor);
                        
                        // 更新选中状态
                        $('.color-box').removeClass('selected');
                        $(this).addClass('selected');
                    });
                    
                    // 数量滑块功能
                    const quantitySlider = document.getElementById('quantity-slider');
                    const quantityDisplay = document.getElementById('quantity-display');
                    const discountDisplay = document.getElementById('discount-display');
                    
                    if (quantitySlider) {
                        // 折扣规则
                        function calculateDiscount(quantity) {
                            if (quantity >= 75) return 15;
                            if (quantity >= 50) return 10;
                            if (quantity >= 25) return 5;
                            if (quantity >= 10) return 2;
                            return 0;
                        }
                        
                        // 更新显示
                        function updateQuantityDisplay() {
                            const quantity = parseInt(quantitySlider.value);
                            const discount = calculateDiscount(quantity);
                            
                            quantityDisplay.textContent = quantity;
                            discountDisplay.textContent = 'Discount: ' + discount + '% off';
                            
                            // 更新产品数量输入框
                            const quantityInput = $('input[name="quantity"]').first();
                            if (quantityInput.length) {
                                quantityInput.val(quantity);
                            }
                            
                            // 更新隐藏字段
                            if (!$('#selected_quantity').length) {
                                $('form.cart').append('<input type="hidden" id="selected_quantity" name="selected_quantity" value="' + quantity + '">');
                            } else {
                                $('#selected_quantity').val(quantity);
                            }
                            
                            if (!$('#selected_discount').length) {
                                $('form.cart').append('<input type="hidden" id="selected_discount" name="selected_discount" value="' + discount + '">');
                            } else {
                                $('#selected_discount').val(discount);
                            }
                        }
                        
                        // 滑块事件
                        quantitySlider.addEventListener('input', updateQuantityDisplay);
                        quantitySlider.addEventListener('change', updateQuantityDisplay);
                        
                        // 滑块标记点击事件
                        $('.slider-mark').click(function() {
                            const value = $(this).data('value');
                            quantitySlider.value = value;
                            updateQuantityDisplay();
                        });
                        
                        // 初始化显示
                        updateQuantityDisplay();
                    }
                });
            </script>
            <?php
        }
    }

    /**
     * 检查购物车中的产品类型并验证是否可以添加新产品
     * Hooks into: woocommerce_add_to_cart_validation
     * @since    X.X.X // Replace with your version
     * @param bool $passed Current validation status.
     * @param int $product_id ID of the product being added.
     * @return bool Validation status.
     */
    public function validate_cart_products_before_add($passed, $product_id)
    {
        // Ensure WooCommerce cart is available
        if (!function_exists('WC') || WC()->cart === null) {
            return $passed;
        }

        // 获取要添加的产品是否为定制产品
        $new_product_is_sync = get_post_meta($product_id, 'pw_isSyncProduct', true) === '1';

        // 如果购物车为空，直接允许添加
        if (WC()->cart->is_empty()) {
            return $passed;
        }

        // 检查购物车中的每个产品
        foreach (WC()->cart->get_cart() as $cart_item) {
            $cart_product_id = $cart_item['product_id'];
            $cart_product_is_sync = get_post_meta($cart_product_id, 'pw_isSyncProduct', true) === '1';

            // 如果购物车中的产品类型与要添加的产品类型不同
            if ($cart_product_is_sync !== $new_product_is_sync) {
                // Ensure wc_add_notice function exists
                if (function_exists('wc_add_notice')) {
                    wc_add_notice('定制产品不能与普通产品一起结算，请先清空购物车。', 'error');
                }
                return false; // Prevent adding to cart
            }
        }

        return $passed; // Allow adding to cart
    }

    /**
     * 添加自定义产品到购物车的AJAX处理函数
     * Hooks into: wp_ajax_add_customized_product_to_cart, wp_ajax_nopriv_add_customized_product_to_cart
     * @since    X.X.X // Replace with your version
     */
    public function add_customized_product_to_cart()
    {
        // 验证nonce
        if (!isset($_POST['security']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['security'])), 'custom-product-nonce')) {
            wp_send_json_error('安全验证失败');
            // no need for return after wp_send_json_* which calls wp_die()
        }

        // 获取产品ID
        $product_id = isset($_POST['product_id']) ? intval($_POST['product_id']) : 0;
        if (!$product_id || !get_post_status($product_id)) { // Also check if product exists
            wp_send_json_error('无效的产品ID');
        }

        // 获取自定义图片数据 (validate further if possible)
        $custom_image = isset($_POST['custom_image']) ? wp_kses_post(wp_unslash($_POST['custom_image'])) : ''; // Use wp_kses_post or more specific validation if needed
        $color = isset($_POST['color']) ? sanitize_text_field(wp_unslash($_POST['color'])) : '';

        if (empty($custom_image)) {
            wp_send_json_error('缺少自定义图片数据');
        }

        // Basic validation for base64 string
        if (strpos($custom_image, 'data:image/') !== 0 || strpos($custom_image, ';base64,') === false) {
            wp_send_json_error('无效的图片数据格式');
        }

        // 保存自定义图片到临时文件
        $upload_dir = wp_upload_dir();
        $custom_dir = $upload_dir['basedir'] . '/custom-products';

        // 确保目录存在
        if (!file_exists($custom_dir)) {
            if (!wp_mkdir_p($custom_dir)) {
                wp_send_json_error('无法创建自定义图片目录');
            }
        }

        // 生成唯一文件名
        $filename = 'custom-' . $product_id . '-' . uniqid() . '.png';
        $file_path = $custom_dir . '/' . $filename;

        // 将Base64图片数据保存为文件
        $image_data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $custom_image));

        if ($image_data === false) {
            wp_send_json_error('解码图片数据失败');
        }

        if (file_put_contents($file_path, $image_data) === false) {
            wp_send_json_error('保存自定义图片失败');
        }

        // 获取图片URL
        $image_url = $upload_dir['baseurl'] . '/custom-products/' . $filename;

        // 准备自定义数据
        $cart_item_data = array(
            'custom_data' => array(
                'custom_image' => $image_url, // Store URL
                'color' => $color
                // Consider storing the relative path too: 'custom_image_path' => str_replace( $upload_dir['basedir'], '', $file_path )
            )
        );

        // Ensure WooCommerce cart is available
        if (!function_exists('WC') || WC()->cart === null) {
            // Optionally delete the saved image file if cart cannot be processed
            unlink($file_path);
            wp_send_json_error('购物车功能不可用');
        }

        // 添加到购物车
        $cart_item_key = WC()->cart->add_to_cart($product_id, 1, 0, array(), $cart_item_data);

        if ($cart_item_key) {
            wp_send_json_success(array(
                'message' => '产品已成功添加到购物车',
                'cart_item_key' => $cart_item_key
            ));
        } else {
            // Optionally delete the saved image file if add_to_cart fails
            unlink($file_path);
            wp_send_json_error('添加到购物车失败');
        }
    }

    

    /**
     * 在购物车和结账页面显示自定义产品图片和颜色
     * Hooks into: woocommerce_get_item_data
     * @since    X.X.X // Replace with your version
     * @param array $item_data Array of item data.
     * @param array $cart_item Cart item data.
     * @return array Modified item data array.
     */
    public function display_custom_product_image($item_data, $cart_item)
    {      
        // Check if custom data exists and has an image
        if (isset($cart_item['custom_data']) && !empty($cart_item['custom_data']['custom_image'])) {
            $image_url = esc_url($cart_item['custom_data']['custom_image']);
            $item_data[] = array(
                'key'     => '定制设计',
                'value'   => sprintf(
                    '<img src="%s" alt="定制设计" style="max-width: 100px; height: auto; display: block; border: 1px solid #ddd; padding: 5px; background: #fff;">',
                    $image_url
                ),
                'display' => ''
            );

            // Check if color data exists
            if (!empty($cart_item['custom_data']['color'])) {
                $color_value = esc_attr($cart_item['custom_data']['color']);
                $item_data[] = array(
                    'key'     => '颜色',
                    'value'   => sprintf(
                        '<span style="display:inline-block; width:20px; height:20px; background-color:%s; vertical-align:middle; margin-right:5px; border: 1px solid #ccc;"></span>%s',
                        $color_value,
                        esc_html(ucfirst($color_value))
                    ),
                    'display' => ''
                );
            }
        } else {
            $pw_isSyncProduct = get_post_meta($cart_item['product_id'], 'pw_isSyncProduct', true);
            if ($pw_isSyncProduct == '1') {
                $item_data[] = array(
                    'key'     => '定制设计',
                    'value'   => '无',
                    'display' => '',
                );
                $item_data[] = array(
                    'key'     => '颜色',
                    'value'   => '未选',
                    'display' => '',
                );
            }
        }
        return $item_data;
    }

    /**
     * Display the custom image directly in the cart item row, after the name.
     *
     * @param array $cart_item Cart item data.
     * @param string $cart_item_key Cart item key.
     */
    public function add_custom_text_after_cart_item_name($cart_item, $cart_item_key)
    {

        // create an instance of the "PluginOptions" class
        $PluginOptions = new PluginOptions();
        if (! $PluginOptions->value('shop_season') && ! $PluginOptions->value('shop_car_type')) {
            return;
        }

        $product = $cart_item['data'];

        $season = get_post_meta($product->get_id(), 'season', true);
        $car_type = get_post_meta($product->get_id(), 'car_type', true);

        // create an instance of the "FeatureTyreTips" class
        $FeatureTyreTips = new FeatureTyreTips();
        $tips_seasons   = $FeatureTyreTips->ui_tips_season();
        $tips_car_types = $FeatureTyreTips->ui_tips_car_types();

        if (! $PluginOptions->value('shop_season') || ! $season) {
            $season = '';
        }

        if (! $PluginOptions->value('shop_car_type') || ! $car_type) {
            $car_type = '';
        }

        $html = '<div class="tyre-details tyre-tips">' . trim($season . ' ' . $car_type) . '</div>';
        echo $html . "1111";
    }

    /**
     * 在产品页面添加颜色图片作为底色
     * Hooks into: woocommerce_before_single_product
     * @since    X.X.X // Replace with your version
     */
    public function add_custom_color_image()
    {
        // Ensure this runs only on single product pages
        if (!is_product()) {
            return;
        }

        global $product;

        // Ensure $product is a valid product object
        if (!is_a($product, 'WC_Product')) {
            return;
        }

        // 获取产品ID
        $product_id = $product->get_id();

        // 检查是否为同步产品
        $pw_isSyncProduct = get_post_meta($product_id, 'pw_isSyncProduct', true);

        if ($pw_isSyncProduct == '1') {
            // 获取颜色图片路径
            $color_image_url = get_post_meta($product_id, 'pw_mainIMG_color', true);

            if (!empty($color_image_url)) {
                // It's better to enqueue styles and scripts properly via wp_enqueue_style/wp_enqueue_script
                // hooked to 'wp_enqueue_scripts', but for direct inclusion:
            ?>
                <style>
                    /* Scope the styles more specifically if possible */
                    .woocommerce div.product div.images .woocommerce-product-gallery__image:first-child {
                        position: relative;
                        overflow: hidden;
                        /* Contain the overlay */
                    }

                    .woocommerce div.product div.images .wp-post-image {
                        position: relative;
                        z-index: 2;
                        /* Base image */
                    }

                    .custom-color-canvas-overlay {
                        /* Canvas overlay for color effects */
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        z-index: 1;
                        /* Overlay sits beneath base image details but above background */
                        mix-blend-mode: multiply;
                        /* Example blend mode, adjust as needed */
                        pointer-events: none;
                        /* Make overlay non-interactive */
                    }

                    /* Disable zoom trigger if needed */
                    .woocommerce div.product div.images .woocommerce-product-gallery__trigger {
                        /* display: none !important; */
                        /* Uncomment if you MUST disable zoom */
                    }

                    /* Prevent clicks on the main image link if necessary (might interfere with lightbox) */
                    .woocommerce div.product div.images .woocommerce-product-gallery__image:first-child>a {
                        /* pointer-events: none; */
                        /* Uncomment cautiously */
                        /* cursor: default; */
                    }
                </style>
                <script>
                    // Consider moving this script to an enqueued JS file.
                    jQuery(document).ready(function($) {
                        var colorImageUrl = '<?php echo esc_url($color_image_url); ?>';
                        
                        // 创建canvas元素替代img
                        var canvas = $('<canvas class="custom-color-canvas custom-color-canvas-overlay"></canvas>');
                        $('.woocommerce-product-gallery__image:first').append(canvas);
                        
                        // 获取canvas上下文
                        var canvasElement = canvas[0];
                        var ctx = canvasElement.getContext('2d');
                        
                        // 获取父容器尺寸来设置canvas尺寸
                        var container = $('.woocommerce-product-gallery__image:first');
                        var containerWidth = container.width();
                        var containerHeight = container.height();
                        
                        // 设置canvas尺寸
                        canvasElement.width = containerWidth;
                        canvasElement.height = containerHeight;
                        
                        // 加载颜色图片并绘制到canvas
                        var colorImage = new Image();
                        colorImage.crossOrigin = 'anonymous';
                        colorImage.onload = function() {
                            // 绘制颜色图片到canvas
                            ctx.drawImage(colorImage, 0, 0, containerWidth, containerHeight);
                        };
                        colorImage.src = colorImageUrl;
                        
                        // 存储canvas引用和颜色图片URL，供颜色修改功能使用
                        window.colorCanvas = canvasElement;
                        window.colorImageUrl = colorImageUrl;
                        
                        // 监听窗口大小变化，重新调整canvas尺寸
                        $(window).on('resize', function() {
                            var newWidth = container.width();
                            var newHeight = container.height();
                            canvasElement.width = newWidth;
                            canvasElement.height = newHeight;
                            // 重新绘制图片
                            if (colorImage.complete) {
                                ctx.drawImage(colorImage, 0, 0, newWidth, newHeight);
                            }
                        });
                    });
                </script>
<?php
            }
        }
    }

    /**
     * Ensures HTML (like img tags) in cart item meta is displayed correctly.
     * Hooks into: woocommerce_display_item_meta
     * @since    X.X.X // Replace with your version
     * @param string $html Existing HTML string.
     * @param WC_Order_Item $item Order item object.
     * @param array $args Display arguments.
     * @return string Modified HTML string.
     */
    public function display_cart_images_properly($html, $item, $args)
    {
        $strings = array();
        $html    = '';

        foreach ($item->get_formatted_meta_data($args['hideprefix'], true) as $meta_id => $meta) {
            $key = $meta->display_key;
            $value = $meta->display_value;

            // 特别处理定制设计图片
            if ($meta->key === 'custom_data' && $key === '定制设计') {
                // 直接使用原始HTML值，不进行任何过滤
                $value = $meta->value;
            }
            // 特别处理颜色显示
            else if ($meta->key === 'custom_data' && $key === '颜色') {
                $value = $meta->value;
            }
            // 其他情况使用默认处理
            else {
                $value = $args['autop'] ? wp_kses_post($value) : wp_kses_post(make_clickable(trim($value)));
                $key = $args['autop'] ? wp_kses_post($key) : wp_kses_post(trim($key));
            }

            $strings[] = '<strong class="' . esc_attr($args['label_class']) . '">' . $key . $args['label_before'] . ':</strong> ' . $value . $args['label_after'];
        }

        if ($strings) {
            $html = $args['before'] . implode($args['separator'], $strings) . $args['after'];
        }

        return $html;
    }

    /**
     * 在订单中显示自定义图片
     * Hooks into: woocommerce_order_item_name
     * @since    X.X.X
     * @param string $item_name 订单项名称
     * @param WC_Order_Item $item 订单项对象
     * @return string 修改后的订单项名称
     */
    public function display_custom_image_in_order($item_name, $item)
    {
        // 获取自定义数据
        $custom_data = $item->get_meta('custom_data');
        
        if (!empty($custom_data) && !empty($custom_data['custom_image'])) {
            $image_url = esc_url($custom_data['custom_image']);
            $item_name .= sprintf(
                '<div style="margin-top: 10px;"><img src="%s" alt="定制设计" style="max-width: 100px; height: auto; display: block; border: 1px solid #ddd; padding: 5px; background: #fff;"></div>',
                $image_url
            );
        }
        
        return $item_name;
    }

    /**
     * Add product inquiry form tab to WooCommerce product tabs
     * Hooks into: woocommerce_product_tabs
     * @since    1.0.0
     * @param array $tabs Existing product tabs
     * @return array Modified tabs array
     */
    public function add_product_inquiry_tab($tabs)
    {
        // Add new tab for product inquiry form
        $tabs['custom_inquiry_tab'] = array(
            'title'     => __('Product Inquiry Form', 'pw-admin'),
            'priority'  => 50,
            'callback'  => array($this, 'product_inquiry_tab_content')
        );
        
        return $tabs;
    }

    /**
     * Display content for product inquiry tab
     * @since    1.0.0
     */
    public function product_inquiry_tab_content()
    {
        global $product;
        
        if (!$product) {
            return;
        }
        
        $product_id = $product->get_id();
        $product_title = $product->get_name();
        
        echo '<h2>' . sprintf(__('Inquire about %s', 'pw-admin'), esc_html($product_title)) . '</h2>';
        
        // Display success/error messages
        if (isset($_GET['inquiry_status'])) {
            $status = sanitize_text_field($_GET['inquiry_status']);
            if ($status === 'success') {
                echo '<div class="woocommerce-message" role="alert">' . __('Your inquiry has been sent successfully!', 'pw-admin') . '</div>';
            } elseif ($status === 'error') {
                echo '<div class="woocommerce-error" role="alert">' . __('There was an error sending your inquiry. Please try again.', 'pw-admin') . '</div>';
            } elseif ($status === 'mail_failed') {
                echo '<div class="woocommerce-info" role="alert">' . __('Your inquiry has been saved but email notification failed.', 'pw-admin') . '</div>';
            }
        }
        
        // Add custom CSS for the form
        echo '<style>
            #product_inquiry_form {
                max-width: 800px;
                margin: 20px auto;
                padding: 0 20px;
            }
            
            .pw-form-row {
                display: flex;
                align-items: center;
                margin-bottom: 25px;
                gap: 20px;
            }
            
            .pw-form-row label {
                flex: 0 0 150px;
                font-weight: 500;
                color: #999;
                font-size: 16px;
                text-align: left;
                margin: 0;
            }
            
            .pw-form-row input[type="text"],
            .pw-form-row input[type="email"],
            .pw-form-row input[type="tel"] {
                flex: 1;
                padding: 12px 16px;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 16px;
                font-family: inherit;
                background-color: #fff;
                transition: border-color 0.3s ease;
                box-sizing: border-box;
            }
            
            .pw-form-row textarea {
                flex: 1;
                padding: 12px 16px;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 16px;
                font-family: inherit;
                background-color: #fff;
                transition: border-color 0.3s ease;
                box-sizing: border-box;
                resize: vertical;
                min-height: 120px;
            }
            
            .pw-form-row input[type="text"]:focus,
            .pw-form-row input[type="email"]:focus,
            .pw-form-row input[type="tel"]:focus,
            .pw-form-row textarea:focus {
                outline: none;
                border-color: #007cba;
            }
            
            .pw-form-row.textarea-row {
                align-items: flex-start;
            }
            
            .pw-form-row.textarea-row label {
                padding-top: 12px;
            }
            
            .pw-submit-row {
                display: flex;
                justify-content: flex-end;
                margin-top: 30px;
            }
            
            .pw-submit-btn {
                background-color: #00bcd4 !important;
                color: white !important;
                border: none !important;
                padding: 12px 30px !important;
                border-radius: 6px !important;
                font-size: 16px !important;
                font-weight: 500 !important;
                cursor: pointer !important;
                transition: background-color 0.3s ease !important;
                text-transform: none !important;
            }
            
            .pw-submit-btn:hover {
                background-color: #00acc1 !important;
            }
            
            .pw-form-required {
                color: #e74c3c;
            }
            
            @media (max-width: 768px) {
                .pw-form-row {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 8px;
                }
                
                .pw-form-row label {
                    flex: none;
                    width: 100%;
                }
                
                .pw-form-row input[type="text"],
                .pw-form-row input[type="email"],
                .pw-form-row input[type="tel"],
                .pw-form-row textarea {
                    width: 100%;
                }
                
                .pw-form-row.textarea-row label {
                    padding-top: 0;
                }
            }
        </style>';
        
        // Inquiry form
        echo '<form action="' . esc_url(admin_url('admin-post.php')) . '" method="post" id="product_inquiry_form">';
        
        // WordPress nonce for security
        wp_nonce_field('product_inquiry_action', 'product_inquiry_nonce');
        
        // Hidden fields
        echo '<input type="hidden" name="action" value="handle_product_inquiry">';
        echo '<input type="hidden" name="product_id" value="' . esc_attr($product_id) . '">';
        echo '<input type="hidden" name="product_title" value="' . esc_attr($product_title) . '">';
        
        // First Name field
        echo '<div class="pw-form-row">';
        echo '<label for="inquiry_first_name">First Name <span class="pw-form-required">*</span></label>';
        echo '<input type="text" name="inquiry_first_name" id="inquiry_first_name" required>';
        echo '</div>';
        
        // Last Name field
        echo '<div class="pw-form-row">';
        echo '<label for="inquiry_last_name">Last Name <span class="pw-form-required">*</span></label>';
        echo '<input type="text" name="inquiry_last_name" id="inquiry_last_name" required>';
        echo '</div>';
        
        // Email field
        echo '<div class="pw-form-row">';
        echo '<label for="inquiry_email">Email <span class="pw-form-required">*</span></label>';
        echo '<input type="email" name="inquiry_email" id="inquiry_email" required>';
        echo '</div>';
        
        // Tel field
        echo '<div class="pw-form-row">';
        echo '<label for="inquiry_phone">Tel</label>';
        echo '<input type="tel" name="inquiry_phone" id="inquiry_phone">';
        echo '</div>';
        
        // Message field
        echo '<div class="pw-form-row textarea-row">';
        echo '<label for="inquiry_message">Message <span class="pw-form-required">*</span></label>';
        echo '<textarea name="inquiry_message" id="inquiry_message" required></textarea>';
        echo '</div>';
        
        // Submit button
        echo '<div class="pw-submit-row">';
        echo '<input type="submit" name="submit_inquiry" value="Submit" class="pw-submit-btn">';
        echo '</div>';
        
        echo '</form>';
    }

    /**
     * Process product inquiry form submission
     * Hooks into: admin_post_handle_product_inquiry and admin_post_nopriv_handle_product_inquiry
     * @since    1.0.0
     */
    public function process_product_inquiry_form()
    {
        // Verify nonce
        if (!isset($_POST['product_inquiry_nonce']) || !wp_verify_nonce($_POST['product_inquiry_nonce'], 'product_inquiry_action')) {
            wp_die(__('Security check failed!', 'pw-admin'));
        }
        
        // Sanitize and get form data
        $product_id = isset($_POST['product_id']) ? absint($_POST['product_id']) : 0;
        $product_title = isset($_POST['product_title']) ? sanitize_text_field($_POST['product_title']) : __('Unknown Product', 'pw-admin');
        $first_name = isset($_POST['inquiry_first_name']) ? sanitize_text_field($_POST['inquiry_first_name']) : '';
        $last_name = isset($_POST['inquiry_last_name']) ? sanitize_text_field($_POST['inquiry_last_name']) : '';
        $name = trim($first_name . ' ' . $last_name); // Combine first and last name
        $email = isset($_POST['inquiry_email']) ? sanitize_email($_POST['inquiry_email']) : '';
        $phone = isset($_POST['inquiry_phone']) ? sanitize_text_field($_POST['inquiry_phone']) : '';
        $message = isset($_POST['inquiry_message']) ? sanitize_textarea_field($_POST['inquiry_message']) : '';
        
        // Get redirect URL
        $redirect_url = $product_id ? get_permalink($product_id) : home_url();
        
        // Validate required fields
        if (empty($first_name) || empty($last_name) || empty($email) || empty($message) || !$product_id) {
            wp_redirect(add_query_arg('inquiry_status', 'error', $redirect_url));
            exit;
        }
        
        // Save to Flamingo if plugin is active
        if (class_exists('Flamingo_Inbound_Message')) {
            $this->save_inquiry_to_flamingo($product_id, $product_title, $name, $email, $phone, $message, $redirect_url);
        }
        
        // Send email notification
        $mail_sent = $this->send_inquiry_email($product_id, $product_title, $name, $email, $phone, $message, $redirect_url);
        
        // Redirect with appropriate status
        if ($mail_sent) {
            wp_redirect(add_query_arg('inquiry_status', 'success', $redirect_url));
        } else {
            wp_redirect(add_query_arg('inquiry_status', 'mail_failed', $redirect_url));
        }
        exit;
    }

    /**
     * Save inquiry to Flamingo plugin
     * @since    1.0.0
     */
    private function save_inquiry_to_flamingo($product_id, $product_title, $name, $email, $phone, $message, $redirect_url)
    {
        // Prepare Flamingo fields array
        $flamingo_fields = array(
            'inquiry_name'    => $name,
            'inquiry_email'   => $email,
            'inquiry_phone'   => $phone,
            'inquiry_message' => $message,
            'product_name'    => $product_title,
            'product_id'      => $product_id,
            'inquiry_page'    => $redirect_url
        );
        
        // Define inquiry subject
        $inquiry_subject = sprintf(__('Product inquiry for "%s"', 'pw-admin'), $product_title);
        
        // Create Flamingo inbound post
        $post_data = array(
            'post_type'    => 'flamingo_inbound',
            'post_status'  => 'publish',
            'post_title'   => $inquiry_subject,
        );
        
        $post_id = wp_insert_post($post_data);
        
        if ($post_id && !is_wp_error($post_id)) {
            // Add Flamingo meta data
            update_post_meta($post_id, '_from', $name . ' <' . $email . '>');
            update_post_meta($post_id, '_from_name', $name);
            update_post_meta($post_id, '_from_email', $email);
            update_post_meta($post_id, '_subject', $inquiry_subject);
            update_post_meta($post_id, '_fields', $flamingo_fields);
        }
    }

    /**
     * Send inquiry email notification
     * @since    1.0.0
     */
    private function send_inquiry_email($product_id, $product_title, $name, $email, $phone, $message, $redirect_url)
    {
        $to = get_option('admin_email');
        $subject = sprintf(__('Product Inquiry for %s', 'pw-admin'), $product_title);
        $headers = array(
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . $name . ' <' . $email . '>'
        );
        
        $body = "<h2>" . __('Product Inquiry Details:', 'pw-admin') . "</h2>";
        $body .= "<p><strong>" . __('Product:', 'pw-admin') . "</strong> <a href='" . esc_url($redirect_url) . "'>" . esc_html($product_title) . "</a> (ID: " . esc_html($product_id) . ")</p>";
        $body .= "<p><strong>" . __('Name:', 'pw-admin') . "</strong> " . esc_html($name) . "</p>";
        $body .= "<p><strong>" . __('Email:', 'pw-admin') . "</strong> " . esc_html($email) . "</p>";
        
        if (!empty($phone)) {
            $body .= "<p><strong>" . __('Phone:', 'pw-admin') . "</strong> " . esc_html($phone) . "</p>";
        }
        
        $body .= "<p><strong>" . __('Message:', 'pw-admin') . "</strong><br>" . nl2br(esc_html($message)) . "</p>";
        
        return wp_mail($to, $subject, $body, $headers);
    }

    /**
     * Show admin notice for unread Flamingo messages
     * Hooks into: admin_notices
     * @since    1.0.0
     */
    public function show_flamingo_unread_messages_notice()
    {
        // Check user permissions
        if (!current_user_can('manage_options')) {
            return;
        }
        
        // Check if Flamingo is active
        if (!class_exists('Flamingo_Inbound_Message')) {
            return;
        }
        
        // Query for unread messages
        $args = array(
            'post_type'      => 'flamingo_inbound',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'meta_query'     => array(
                array(
                    'key'     => '_flamingo_is_read',
                    'compare' => 'NOT EXISTS',
                ),
            ),
            'fields' => 'ids',
            'cache_results'          => false,
            'update_post_meta_cache' => false,
            'update_post_term_cache' => false,
        );
        
        $unread_query = new WP_Query($args);
        $unread_count = $unread_query->found_posts;
        
        if ($unread_count > 0) {
            $inbox_url = admin_url('admin.php?page=flamingo_inbound');
            echo '<div class="notice notice-info is-dismissible">';
            echo '<p>';
            printf(
                esc_html__('You have %d new product inquiry messages.', 'pw-admin'),
                $unread_count
            );
            echo ' <a href="' . esc_url($inbox_url) . '">' . esc_html__('View Now', 'pw-admin') . '</a>';
            echo '</p>';
            echo '</div>';
        }
    }

    /**
     * Mark Flamingo message as read when viewed
     * Hooks into: admin_init
     * @since    1.0.0
     */
    public function mark_flamingo_message_as_read_on_view()
    {
        global $pagenow;
        
        // Check if we're on the Flamingo message view page
        if ('admin.php' === $pagenow &&
            isset($_GET['page']) &&
            $_GET['page'] === 'flamingo_inbound' &&
            isset($_GET['post'])) {
            
            $post_id = absint($_GET['post']);
            
            if (!$post_id) {
                return;
            }
            
            // Check user permissions
            if (!current_user_can('edit_post', $post_id)) {
                return;
            }
            
            // Mark as read if not already marked
            if (!get_post_meta($post_id, '_flamingo_is_read', true)) {
                update_post_meta($post_id, '_flamingo_is_read', '1');
            }
        }
    }

    /**
     * Add custom cart column data after cart item name
     * Hooks into: woocommerce_after_cart_item_name
     * @since    1.0.0
     * @param array $cart_item Cart item data
     * @param string $cart_item_key Cart item key
     */
    public function add_custom_cart_column_data_revised($cart_item, $cart_item_key)
    {
        $_product = $cart_item['data'];
        $product_id = $cart_item['product_id'];

        // 准备要显示的 HTML 内容
        $custom_html = '';

        // 检查是否存在自定义图片数据
        if (isset($cart_item['custom_data']['custom_image']) && !empty($cart_item['custom_data']['custom_image'])) {
            // 如果存在，创建 img 标签
            $custom_html = '<img src="' . esc_url($cart_item['custom_data']['custom_image']) . '" style="max-width:100px; height:auto; border-radius: 4px;">';
        } else {
            // （可选）如果不存在，可以设置默认提示
            $custom_html = '';
        }

        // 将准备好的 HTML 内容包裹在一个隐藏的 div 中
        echo '<div class="hidden-custom-data" style="display:none;">' . $custom_html . '</div>';
    }

    /**
     * Move custom cart column with JavaScript
     * Hooks into: wp_footer
     * @since    1.0.0
     */
    public function move_custom_cart_column_with_js_revised()
    {
        // 仅在购物车页面执行
        if (!is_cart()) {
            return;
        }
        ?>
        <script type="text/javascript">
        jQuery(function($) {
            // --- 1. 添加表头 (这部分通常没问题) ---
            var $headerRow = $('.woocommerce-cart-form .shop_table thead tr');
            if ($headerRow.length && !$('.th-custom-column').length) {
                $headerRow.find('.product-price').before('<th class="th-custom-column">Design</th>');
            }

            // --- 2. 修正后的逻辑：添加单元格并移动数据 ---
            $('.woocommerce-cart-form .cart_item').each(function() {
                var $row = $(this);
                // 在当前行内部查找隐藏数据，这是更可靠的方法
                var $hiddenData = $row.find('.hidden-custom-data');
                // 检查是否已找到数据并且新单元格尚未创建
                if ($hiddenData.length && !$row.find('.td-custom-column').length) {
                    // 在"数量"单元格前添加新单元格
                    var $newCell = $('<td class="td-custom-column" data-title="Design"></td>');
                    $row.find('.product-price').before($newCell);
                    // 将隐藏数据的内容移动到新单元格中
                    $newCell.html($hiddenData.html());
                    // （可选，但建议）将已经被使用的隐藏数据移除，保持DOM干净
                    $hiddenData.remove();
                }
            });
        });
        </script>
        <style>
        /* 样式可以保持不变 */
        .th-custom-column,
        .td-custom-column {
            text-align: center;
        }
        </style>
        <?php
    }

    /**
     * 在数量选择器和加入购物车按钮之间添加内容
     * Hooks into: woocommerce_before_add_to_cart_button (priority 25)
     * @since    X.X.X
     */
    public function add_content_between_quantity_and_cart()
    {
        global $product;

        // 确保 $product 是有效的产品对象
        if (!is_a($product, 'WC_Product')) {
            return;
        }

        // 获取产品ID
        $product_id = $product->get_id();

        // 检查是否为同步产品（可选：只对特定产品显示）
        $pw_isSyncProduct = get_post_meta($product_id, 'pw_isSyncProduct', true);

        // 你可以根据需要调整这个条件，或者移除它来对所有产品显示
        if ($pw_isSyncProduct == '1') {
            ?>
            <div class="custom-content-between-quantity-cart" style="margin: 15px 0;">
                <div class="product-customization-options">
                    <h4 style="margin-bottom: 10px; color: #333;">产品定制选项</h4>
                    
                    <!-- 示例内容：定制选项 -->
                    <div class="customization-row" style="display: flex; gap: 15px; align-items: center; margin-bottom: 10px;">
                        <label style="font-weight: bold; min-width: 80px;">尺寸:</label>
                        <select name="custom_size" style="padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="">选择尺寸</option>
                            <option value="small">小号</option>
                            <option value="medium">中号</option>
                            <option value="large">大号</option>
                        </select>
                    </div>
                    
                    <div class="customization-row" style="display: flex; gap: 15px; align-items: center; margin-bottom: 10px;">
                        <label style="font-weight: bold; min-width: 80px;">材质:</label>
                        <select name="custom_material" style="padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="">选择材质</option>
                            <option value="cotton">棉质</option>
                            <option value="polyester">聚酯纤维</option>
                            <option value="blend">混纺</option>
                        </select>
                    </div>
                    
                    <!-- 示例内容：个性化文字 -->
                    <div class="customization-row" style="display: flex; gap: 15px; align-items: center; margin-bottom: 10px;">
                        <label style="font-weight: bold; min-width: 80px;">个性文字:</label>
                        <input type="text" name="custom_text" placeholder="输入个性化文字" style="padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; flex: 1;">
                    </div>
                    
                    <!-- 示例内容：特殊说明 -->
                    <div class="customization-note" style="background: #f8f9fa; padding: 10px; border-radius: 4px; border-left: 4px solid #007cba;">
                        <small style="color: #666;">
                            <strong>提示:</strong> 定制产品需要额外 3-5 个工作日制作时间
                        </small>
                    </div>
                </div>
            </div>
            
            <style>
                .custom-content-between-quantity-cart {
                    border: 1px solid #e0e0e0;
                    border-radius: 6px;
                    padding: 15px;
                    background: #fafafa;
                }
                
                .custom-content-between-quantity-cart h4 {
                    margin-top: 0;
                    color: #333;
                    font-size: 16px;
                }
                
                .customization-row select,
                .customization-row input {
                    transition: border-color 0.3s ease;
                }
                
                .customization-row select:focus,
                .customization-row input:focus {
                    outline: none;
                    border-color: #007cba;
                    box-shadow: 0 0 0 2px rgba(0, 124, 186, 0.1);
                }
            </style>
            <?php
        }
    }

    /**
     * 隐藏同步产品的价格显示
     * Hooks into: woocommerce_get_price_html, woocommerce_variable_price_html, woocommerce_variable_sale_price_html
     * @since    X.X.X
     */
    public function hide_sync_product_price($price, $product)
    {
        // 确保 $product 是有效的产品对象
        if (!is_a($product, 'WC_Product')) {
            return $price;
        }

        // 获取产品ID
        $product_id = $product->get_id();

        // 检查是否为同步产品
        $pw_isSyncProduct = get_post_meta($product_id, 'pw_isSyncProduct', true);

        // 如果是同步产品，隐藏价格
        if ($pw_isSyncProduct == '1') {
            return '';
        }

        return $price;
    }

    /**
     * Remove add to cart actions for sync products
     * Hooks into: wp
     * @since    1.0.0
     */
    function conditionally_remove_simple_add_to_cart_button() {

        // 1. 首先检查当前是否为单个产品页面
        if ( ! is_product() ) {
            return;
        }
    
        // 2. 获取全局 $product 对象
        // 使用 wc_get_product() 是更安全的方式
        $product = wc_get_product( get_the_ID() );
    
        // 确保我们成功获取了产品对象，并且它是一个简单产品
        if ( ! $product || ! $product->is_type( 'simple' ) ) {
            return;
        }
    
        // 3. 获取您指定的 meta 值
        $is_sync_product = $product->get_meta( 'pw_isSyncProduct' );
    
        // 4. 判断 meta 值是否为 '1'
        // 只有当条件满足时，才执行 remove_action
        if ( '1' == $is_sync_product ) {
            remove_action( 'woocommerce_simple_add_to_cart', 'woocommerce_simple_add_to_cart', 30 );

            // 添加自定义钩子，允许其他插件或主题在同步产品处理后执行操作
            do_action( 'pw_admin_after_sync_product_processed', $product_id, $is_sync_product );
        }


    }

    /**
     * 触发自定义产品钩子
     * 在 woocommerce_after_single_product_summary 后触发，允许其他代码挂载自定义内容
     * 
     * @since    1.0.0
     */
    public function trigger_pw_custom_product_hook()
    {
        global $product;
        
        // 确保在产品页面且产品对象存在
        if (is_product() && is_a($product, 'WC_Product')) {
            /**
             * 自定义产品钩子
             * 
             * 允许其他插件或主题在产品详情页面添加自定义内容
             * 
             * @param WC_Product $product 当前产品对象
             * @param int $product_id 产品ID
             */
            do_action('pw_admin_single_product_custom_content', $product, $product->get_id());
        }
    }

    /**
     * 显示同步产品的API数据（仅超级管理员可见）
     * 当产品的 pw_isSyncProduct 为真时，直接调用API并显示返回内容
     * 此功能仅对超级管理员显示，作为调试信息
     * 
     * @since 1.0.0
     */
    public function display_sync_product_api_data() {
        // 只有超级管理员才能看到此调试信息
        if (!is_super_admin()) {
            return;
        }

        global $product;

        // 确保 $product 是有效的产品对象
        if (!is_a($product, 'WC_Product')) {
            return;
        }

        $product_id = $product->get_id();
        
        // 检查是否为同步产品
        $pw_isSyncProduct = get_post_meta($product_id, 'pw_isSyncProduct', true);
        
        if ($pw_isSyncProduct !== '1') {
            return;
        }

        // 获取API数据（只调用一次）
        $api = new Pw_Admin_Promowares_Api();
        $api_response = $api->get_product_by_woo_id($product_id);
        
        // 显示accessories模块（如果存在）
        if (!is_wp_error($api_response) && isset($api_response['data']['accessories']) && is_array($api_response['data']['accessories']) && !empty($api_response['data']['accessories'])) {
            ?>
            <div id="pw-accessories-container" class="pw-accessories-data" style="background: #f9f9f9; border: 1px solid #ddd; margin: 15px 0; border-radius: 4px;">
                <div style="padding: 15px; border-bottom: 1px solid #ddd;">
                    <h4 style="margin: 0; color: #333;">产品配件</h4>
                </div>
                <div style="padding: 15px;">
                    <div class="accessories-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                        <?php foreach ($api_response['data']['accessories'] as $accessory): ?>
                            <div class="accessory-item" style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 10px; background: #fff;">
                                <?php if (!empty($accessory['product_image'])): ?>
                                    <div class="accessory-image" style="text-align: center; margin-bottom: 10px;">
                                        <img src="<?php echo esc_url($accessory['product_image']); ?>" alt="<?php echo esc_attr($accessory['name']); ?>" style="max-width: 100%; height: 80px; object-fit: cover; border-radius: 4px;">
                                    </div>
                                <?php endif; ?>
                                <div class="accessory-info">
                                    <h5 style="margin: 0 0 5px 0; font-size: 14px; color: #333;"><?php echo esc_html($accessory['name']); ?></h5>
                                    <?php if (!empty($accessory['sku'])): ?>
                                        <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">SKU: <?php echo esc_html($accessory['sku']); ?></p>
                                    <?php endif; ?>
                                    <div class="accessory-price" style="font-weight: bold; color: #007cba;">
                                        <?php if ($accessory['anchor_price'] > 0 && $accessory['anchor_price'] > $accessory['price']): ?>
                                            <span style="text-decoration: line-through; color: #999; font-size: 12px;">$<?php echo number_format($accessory['anchor_price'], 2); ?></span>
                                        <?php endif; ?>
                                        <span>$<?php echo number_format($accessory['price'], 2); ?></span>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
            <?php
        }

        // 输出折叠容器和加载界面
        ?>
        <div id="pw-sync-product-container" class="pw-sync-product-data" style="background: #f9f9f9; border: 1px solid #ddd; margin: 15px 0; border-radius: 4px;">
            <!-- 折叠标题栏 -->
            <div id="pw-sync-header" style="padding: 15px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd;">
                <h4 style="margin: 0; color: #333;">产品详细信息</h4>
                <span id="pw-sync-toggle" style="font-size: 18px; color: #666; transition: transform 0.3s ease;">▼</span>
            </div>
            
            <!-- 折叠内容区域 -->
            <div id="pw-sync-body" style="display: none; padding: 15px;">
                <div id="pw-sync-loading" style="text-align: center; padding: 20px; display: none;">
                    <img src="<?php echo esc_url(plugin_dir_url(__FILE__) . '../assets/images/icons/spinner.gif'); ?>" alt="加载中..." style="width: 32px; height: 32px;">
                    <p style="margin-top: 10px; color: #666;">正在获取产品信息...</p>
                </div>
                <div id="pw-sync-content" style="display: none;"></div>
            </div>
        </div>

        <style>
        #pw-sync-header:hover {
            background-color: #f0f0f0;
        }
        
        #pw-sync-toggle.expanded {
            transform: rotate(180deg);
        }
        
        .pw-sync-slide-down {
            animation: slideDown 0.3s ease-out;
        }
        
        .pw-sync-slide-up {
            animation: slideUp 0.3s ease-out;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                max-height: 0;
            }
            to {
                opacity: 1;
                max-height: 500px;
            }
        }
        
        @keyframes slideUp {
            from {
                opacity: 1;
                max-height: 500px;
            }
            to {
                opacity: 0;
                max-height: 0;
            }
        }
        </style>

        <script type="text/javascript">
        jQuery(document).ready(function($) {
            var isExpanded = false;
            var isLoaded = false;
            
            // 折叠/展开功能
            $('#pw-sync-header').click(function() {
                if (!isExpanded) {
                    // 展开
                    $('#pw-sync-body').removeClass('pw-sync-slide-up').addClass('pw-sync-slide-down').show();
                    $('#pw-sync-toggle').addClass('expanded');
                    isExpanded = true;
                    
                    // 如果还没有加载数据，则开始加载
                    if (!isLoaded) {
                        $('#pw-sync-loading').show();
                        
                        // 模拟异步加载效果，然后使用已获取的API数据
                        setTimeout(function() {
                            <?php
                            if (is_wp_error($api_response)) {
                                $error_message = $api_response->get_error_message();
                                ?>
                                // 隐藏加载图片并显示错误
                                $('#pw-sync-loading').hide();
                                $('#pw-sync-content').html('<div class="pw-api-error" style="background: #ffebee; border: 1px solid #f44336; padding: 10px; border-radius: 4px;"><strong>API 错误:</strong> <?php echo esc_js($error_message); ?></div>').show();
                                <?php
                            } else {
                                // 直接格式化显示JSON数据（重用已获取的API响应）
                                $json_html = '<pre style="background: #fff; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px; line-height: 1.4; border: 1px solid #e0e0e0; white-space: pre-wrap; word-wrap: break-word;">' . esc_html(json_encode($api_response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . '</pre>';
                                ?>
                                // 隐藏加载图片并显示JSON内容
                                $('#pw-sync-loading').hide();
                                $('#pw-sync-content').html(<?php echo wp_json_encode($json_html); ?>).show();
                                <?php
                            }
                            ?>
                            isLoaded = true;
                        }, 500); // 延迟500ms以显示加载效果
                    }
                } else {
                    // 收起
                    $('#pw-sync-body').removeClass('pw-sync-slide-down').addClass('pw-sync-slide-up');
                    setTimeout(function() {
                        $('#pw-sync-body').hide();
                    }, 300);
                    $('#pw-sync-toggle').removeClass('expanded');
                    isExpanded = false;
                }
            });
        });
        </script>
        <?php
    }





    // --- END ADDED WOOCOMMERCE METHODS ---

} // End class Pw_Admin_Public

function pw_canvas_handle_request()
{
    global $wp;
    $current_url = home_url($wp->request);
    $target_path = '/pwcanvas/';

    if (untrailingslashit($current_url) === untrailingslashit(home_url($target_path))) {
        include(plugin_dir_path(__FILE__) . 'partials/template-canvas-display.php');
        exit; // 阻止 WordPress 加载默认模板
    }
}
add_action('template_redirect', 'pw_canvas_handle_request');
