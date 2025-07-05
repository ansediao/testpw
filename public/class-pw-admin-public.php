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
        add_action('woocommerce_after_add_to_cart_button', array($this, 'add_custom_button_after_cart'));
        add_action('woocommerce_after_add_to_cart_button', array($this, 'add_color_selection_after_cart'));

        // Validate cart contents before adding new items
        add_filter('woocommerce_add_to_cart_validation', array($this, 'validate_cart_products_before_add'), 10, 2);

        // Handle AJAX request for adding custom products
        add_action('wp_ajax_add_customized_product_to_cart', array($this, 'add_customized_product_to_cart'));
        add_action('wp_ajax_nopriv_add_customized_product_to_cart', array($this, 'add_customized_product_to_cart'));

        // Display custom data in cart and checkout
        add_filter('woocommerce_get_item_data', array($this, 'display_custom_product_image'), 10, 2);
        add_filter('woocommerce_order_item_name', array($this, 'display_custom_image_in_order'), 10, 2);

        add_action('woocommerce_after_cart_item_name', 'add_custom_text_after_cart_item_name', 10, 2);

        // Add custom color image overlay on product page
        add_action('woocommerce_before_single_product', array($this, 'add_custom_color_image'));

        // Ensure HTML in cart item meta is displayed correctly
        add_filter('woocommerce_display_item_meta', array($this, 'display_cart_images_properly'), 10, 3);

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
            <button class="btn btn-gradient">Gradient</button>
            <button class="btn btn-custom">Custom Colors</button>
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
                        applyGradientColorBtn.addEventListener('click', function() {
                            const color1 = gradientColor1.value;
                            const color2 = gradientColor2.value;
                            const direction = gradientDirection.value;
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
                                // 更新currentColor，以便loadColorImage可以正确使用它
                                currentColor = `linear-gradient(${direction}, ${color1}, ${color2})`;
                            }
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
                        applyCustomColorBtn.addEventListener('click', function() {
                            const color = customColorPicker.value;
                            if (shadowCanvas && typeof loadColorImage === 'function') {
                                const colorImageUrl = shadowCanvas.getAttribute('data-color-image');
                                if (colorImageUrl) {
                                    loadColorImage(colorImageUrl, color);
                                    currentColor = color; // 更新当前选中颜色
                                }
                            }
                            customColorModal.style.display = 'none';
                        });
                    }
                });
            </script>
            <script>
                // Consider moving this script to an enqueued JS file for better performance and organization.
                jQuery(document).ready(function($) {
                    // 为所有颜色框添加点击事件
                    $('.color-box').click(function() {
                        var selectedColor = $(this).data('color');
                        currentColor = selectedColor; // 更新当前选中颜色
                        const colorImageUrl = shadowCanvas.getAttribute('data-color-image');
                        if (colorImageUrl) {
                            loadColorImage(colorImageUrl, currentColor);
                        }
                        // 移除所有颜色样本的选中状态，因为现在是通过 Canvas 更新，不再需要 CSS filter
                        $('.color-box').removeClass('selected');
                        $(this).addClass('selected');
                        // 可选：保存选中的颜色到隐藏字段，用于后续处理
                        if (!$('#selected_color').length) {
                            $('form.cart').append('<input type="hidden" id="selected_color" name="selected_color" value="' + selectedColor + '">');
                        } else {
                            $('#selected_color').val(selectedColor);
                        }
                    });
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
     * 在产品页面添加自定义颜色图片作为叠加层
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

                    .custom-color-image-overlay {
                        /* Renamed class for clarity */
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        /* Or contain, depending on desired effect */
                        z-index: 1;
                        /* Overlay sits beneath base image details but above background */
                        mix-blend-mode: multiply;
                        /* Example blend mode, adjust as needed */
                        pointer-events: none;
                        /* Make overlay non-interactive */
                        /* Initial filter will be set by JS */
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
                        // Find the first gallery image wrapper and append the overlay
                        $('.woocommerce-product-gallery__image:first').append('<img src="' + colorImageUrl + '" class="custom-color-image custom-color-image-overlay" alt="Color Overlay" />');

                        // Optional: Disable click/zoom on the main image link if interfering
                        // $('.woocommerce-product-gallery__image:first > a').on('click', function(e) {
                        //     e.preventDefault();
                        //     return false;
                        // });

                        // Apply initial color filter if needed (e.g., based on a default selected color)
                        // var initialFilter = $('.color-box[data-color="white"]').data('filter'); // Example: default to white
                        // $('.custom-color-image-overlay').css('filter', initialFilter);
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
