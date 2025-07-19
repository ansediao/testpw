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

// Load modular components
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-product-customization.php';
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-cart-handler.php';
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-product-inquiry.php';
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-accessory-selector.php';
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-quantity-discount.php';
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-api-data-display.php';
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-auxiliary-functions.php';
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-template-handler.php';

/**
 * The public-facing functionality of the plugin.
 *
 * Defines the plugin name, version, and integrates all modular components.
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

        // Initialize all modular components
        $this->initialize_modules();

        // Add custom hook for modular components
        add_action('woocommerce_single_product_summary', array($this, 'trigger_pw_custom_product_hook'), 25);
    }

    /**
     * Initialize all modular components
     */
    private function initialize_modules()
    {
        new Pw_Product_Customization();
        new Pw_Cart_Handler();
        new Pw_Product_Inquiry();
        new Pw_Accessory_Selector();
        new Pw_Quantity_Discount();
        new Pw_Api_Data_Display();
        new Pw_Auxiliary_Functions();
        new Pw_Template_Handler();
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
        
        // 显示quantity discount模块（如果存在）
        $this->display_quantity_discount_module($api_response, $product_id);
        
        // 显示accessories模块（如果存在）
        if (!is_wp_error($api_response) && isset($api_response['data']['accessories']) && is_array($api_response['data']['accessories']) && !empty($api_response['data']['accessories'])) {
            // 获取产品主图作为备用图片
            $main_product_image = get_post_meta($product_id, 'pw_mainIMG_color', true);
            if (empty($main_product_image)) {
                $main_product_image = wp_get_attachment_image_url(get_post_thumbnail_id($product_id), 'thumbnail');
            }
            ?>
            <div id="pw-accessories-container" class="pw-accessories-data">
                <div class="dropdown-wrapper">
                    <label for="accessory-dropdown">额外组件:</label>
                    <div class="dropdown-container">
                        <button id="accessory-dropdown-button">
                            <span>选择一个配件</span>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                        <div id="accessory-list" class="hidden">
                            <?php foreach ($api_response['data']['accessories'] as $index => $accessory): 
                                $accessory_image = !empty($accessory['product_image']) ? $accessory['product_image'] : $main_product_image;
                            ?>
                                <div class="product-item" data-id="<?php echo esc_attr($index); ?>">
                                    <img src="<?php echo esc_url($accessory_image); ?>" alt="<?php echo esc_attr($accessory['name']); ?>" class="product-image">
                                    <div class="info">
                                        <p class="name"><?php echo esc_html($accessory['name']); ?></p>
                                        <p class="price">
                                            <?php if ($accessory['anchor_price'] > 0 && $accessory['anchor_price'] > $accessory['price']): ?>
                                                <span style="text-decoration: line-through; color: #999; font-size: 12px;">$<?php echo number_format($accessory['anchor_price'], 2); ?></span>
                                            <?php endif; ?>
                                            $<?php echo number_format($accessory['price'], 2); ?>
                                        </p>
                                        <?php if (!empty($accessory['sku'])): ?>
                                            <p class="sku">SKU: <?php echo esc_html($accessory['sku']); ?></p>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
                <div id="selected-accessories-container">
                    <!-- 已选择的配件将通过JS动态插入这里 -->
                </div>
            </div>
            
            <div id="accessory-image-preview-container"></div>

            <style>
            /* 配件选择器样式 */
            #pw-accessories-container {
                background: #f9f9f9;
                border: 1px solid #ddd;
                margin: 15px 0;
                border-radius: 4px;
                padding: 15px;
            }

            .dropdown-wrapper {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-bottom: 1.5rem;
            }

            .dropdown-wrapper label {
                font-size: 1.125rem;
                font-weight: 600;
                color: #1f2937;
                white-space: nowrap;
            }

            .dropdown-container {
                position: relative;
                width: 100%;
            }

            #accessory-dropdown-button {
                width: 100%;
                background-color: #f9fafb;
                border: 1px solid #d1d5db;
                color: #1f2937;
                font-size: 1rem;
                border-radius: 0.5rem;
                padding: 0.75rem;
                text-align: left;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
            }

            #accessory-dropdown-button:focus {
                outline: none;
                box-shadow: 0 0 0 2px #3b82f6;
                border-color: #3b82f6;
            }

            #accessory-dropdown-button svg {
                width: 1rem;
                height: 1rem;
                transition: transform 0.3s ease-in-out;
            }

            #accessory-dropdown-button.open svg {
                transform: rotate(180deg);
            }

            #accessory-list {
                position: absolute;
                z-index: 10;
                margin-top: 0.5rem;
                width: 100%;
                background-color: #ffffff;
                border-radius: 0.5rem;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                border: 1px solid #e5e7eb;
                max-height: 20rem;
                overflow-y: auto;
            }

            .product-item {
                padding: 0.75rem;
                display: flex;
                align-items: center;
                gap: 1rem;
                cursor: pointer;
                border-bottom: 1px solid #e5e7eb;
            }

            .product-item:last-child {
                border-bottom: none;
            }

            .product-item:hover {
                background-color: #f3f4f6;
            }

            .product-item img {
                width: 3rem;
                height: 3rem;
                border-radius: 0.375rem;
                object-fit: cover;
            }

            .product-item .info {
                flex-grow: 1;
            }

            .product-item .info .name {
                font-weight: 600;
                color: #1f2937;
                margin: 0 0 4px 0;
            }

            .product-item .info .price {
                font-size: 0.875rem;
                color: #6b7280;
                margin: 0 0 4px 0;
            }

            .product-item .info .sku {
                font-size: 0.75rem;
                color: #9ca3af;
                margin: 0;
            }

            #selected-accessories-container {
                display: flex;
                flex-wrap: wrap;
                gap: 1rem;
                padding: 1rem;
                min-height: 120px;
                background-color: #f9fafb;
                border-radius: 0.5rem;
                border: 1px dashed #d1d5db;
            }

            .selected-accessory-item {
                position: relative;
                padding: 0.5rem;
                background-color: #ffffff;
                border-radius: 0.5rem;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                display: flex;
                align-items: center;
                gap: 0.75rem;
                transition: transform 0.2s ease-in-out;
            }

            .selected-accessory-item:hover {
                transform: scale(1.05);
            }

            .selected-accessory-item img {
                width: 4rem;
                height: 4rem;
                border-radius: 0.375rem;
                object-fit: cover;
            }

            .selected-accessory-item .info .name {
                font-weight: 500;
                color: #1f2937;
                margin: 0 0 4px 0;
            }

            .selected-accessory-item .info .price {
                font-size: 0.875rem;
                color: #6b7280;
                margin: 0;
            }

            .remove-btn {
                position: absolute;
                top: -0.5rem;
                right: -0.5rem;
                width: 1.5rem;
                height: 1.5rem;
                background-color: #ef4444;
                color: white;
                border-radius: 9999px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1rem;
                font-weight: bold;
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                transition: background-color 0.2s;
            }

            .remove-btn:hover {
                background-color: #dc2626;
            }

            #accessory-image-preview-container {
                position: absolute;
                display: none;
                z-index: 1000;
                pointer-events: none;
                transition: opacity 0.2s ease-in-out;
            }

            #accessory-image-preview-container img {
                width: 250px;
                height: 250px;
                border: 4px solid white;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                border-radius: 0.5rem;
            }

            .hidden {
                display: none;
            }

            .custom-alert {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background-color: #f8d7da;
                color: #721c24;
                padding: 10px 20px;
                border-radius: 5px;
                z-index: 2000;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            </style>

            <script>
            document.addEventListener('DOMContentLoaded', function () {
                // 配件数据
                const accessories = <?php echo wp_json_encode(array_values($api_response['data']['accessories'])); ?>;
                
                const dropdownButton = document.getElementById('accessory-dropdown-button');
                const accessoryList = document.getElementById('accessory-list');
                const selectedAccessoriesContainer = document.getElementById('selected-accessories-container');
                const imagePreviewContainer = document.getElementById('accessory-image-preview-container');
                let selectedAccessoryIds = new Set();

                // 下拉菜单切换
                dropdownButton.addEventListener('click', function (e) {
                    e.stopPropagation();
                    accessoryList.classList.toggle('hidden');
                    dropdownButton.classList.toggle('open');
                });

                // 点击外部关闭下拉菜单
                document.addEventListener('click', function () {
                    if (!accessoryList.classList.contains('hidden')) {
                        accessoryList.classList.add('hidden');
                        dropdownButton.classList.remove('open');
                    }
                });

                // 图片预览功能
                accessoryList.addEventListener('mouseover', function(e) {
                    const targetImage = e.target.closest('.product-image');
                    if (targetImage) {
                        const largeImage = document.createElement('img');
                        largeImage.src = targetImage.src;
                        imagePreviewContainer.innerHTML = '';
                        imagePreviewContainer.appendChild(largeImage);
                        imagePreviewContainer.style.display = 'block';
                    }
                });

                accessoryList.addEventListener('mousemove', function(e) {
                    if (imagePreviewContainer.style.display === 'block') {
                        imagePreviewContainer.style.left = (e.pageX + 20) + 'px';
                        imagePreviewContainer.style.top = (e.pageY + 20) + 'px';
                    }
                });

                accessoryList.addEventListener('mouseout', function(e) {
                    const relatedTarget = e.relatedTarget;
                    if (!relatedTarget || !relatedTarget.closest('#accessory-image-preview-container')) {
                        imagePreviewContainer.style.display = 'none';
                    }
                });

                // 选择配件
                accessoryList.addEventListener('click', function (e) {
                    const selectedItem = e.target.closest('.product-item');
                    if (selectedItem) {
                        const accessoryId = parseInt(selectedItem.dataset.id, 10);
                        if (selectedAccessoryIds.has(accessoryId)) {
                            showCustomAlert('该配件已添加！');
                            return;
                        }

                        const accessory = accessories[accessoryId];
                        if (accessory) {
                            addAccessoryToQueue(accessory, accessoryId);
                            selectedAccessoryIds.add(accessoryId);
                        }
                        accessoryList.classList.add('hidden');
                        dropdownButton.classList.remove('open');
                    }
                });

                // 添加配件到选择区域
                function addAccessoryToQueue(accessory, accessoryId) {
                    const mainProductImage = '<?php echo esc_js($main_product_image); ?>';
                    const accessoryImage = accessory.product_image || mainProductImage;
                    
                    const itemWrapper = document.createElement('div');
                    itemWrapper.className = 'selected-accessory-item';
                    itemWrapper.dataset.id = accessoryId;
                    
                    let priceHtml = '';
                    if (accessory.anchor_price > 0 && accessory.anchor_price > accessory.price) {
                        priceHtml = '<span style="text-decoration: line-through; color: #999; font-size: 12px;">$' + accessory.anchor_price.toFixed(2) + '</span> ';
                    }
                    priceHtml += '$' + accessory.price.toFixed(2);
                    
                    itemWrapper.innerHTML = `
                        <img src="${accessoryImage}" alt="${accessory.name}">
                        <div class="info">
                            <p class="name">${accessory.name}</p>
                            <p class="price">${priceHtml}</p>
                        </div>
                        <button class="remove-btn">&times;</button>
                    `;
                    selectedAccessoriesContainer.appendChild(itemWrapper);
                }

                // 移除配件
                selectedAccessoriesContainer.addEventListener('click', function (e) {
                    if (e.target.classList.contains('remove-btn')) {
                        const itemToRemove = e.target.closest('[data-id]');
                        if (itemToRemove) {
                            const accessoryId = parseInt(itemToRemove.dataset.id, 10);
                            selectedAccessoryIds.delete(accessoryId);
                            itemToRemove.remove();
                        }
                    }
                });

                // 自定义提示框
                function showCustomAlert(message) {
                    let alertBox = document.querySelector('.custom-alert');
                    if (alertBox) {
                        alertBox.remove();
                    }
                    alertBox = document.createElement('div');
                    alertBox.textContent = message;
                    alertBox.className = 'custom-alert';
                    document.body.appendChild(alertBox);
                    setTimeout(() => {
                        alertBox.remove();
                    }, 3000);
                }
            });
            </script>
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





    /**
     * Display quantity discount module
     * 
     * @param array $api_response API response data
     * @param int $product_id Product ID
     * @since 1.0.0
     */
    private function display_quantity_discount_module($api_response, $product_id) {
        // 检查API响应是否有效且包含quantity_discount数据
        if (is_wp_error($api_response) || !isset($api_response['data']['quantity_discount']) || !is_array($api_response['data']['quantity_discount']) || empty($api_response['data']['quantity_discount'])) {
            return;
        }

        $quantity_discounts = $api_response['data']['quantity_discount'];
        
        // 过滤掉无效的折扣数据（range_from和range_to都为0的情况）
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
                    'range_to' => 0, // 0表示无上限
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

        <style>
        .quantity-discount-table tbody tr.highlight {
            background: #fff3cd !important;
            border-left: 4px solid #ffc107;
        }
        </style>
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
