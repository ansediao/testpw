<?php
/**
 * Product Customization Module
 * 
 * @package    Pw_Admin
 * @subpackage Pw_Admin/public/modules
 * @author     PW <pw@pwcom>
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Pw_Product_Customization {

    /**
     * Initialize hooks
     */
    public function __construct() {
        add_action('pw_admin_single_product_custom_content', array($this, 'add_color_selection_after_cart'), 10);
        add_action('pw_admin_single_product_custom_content', array($this, 'add_color_variant_data_display'), 1000);
        add_action('pw_admin_single_product_custom_content', array($this, 'add_customization_options'), 35);
        add_action('woocommerce_before_single_product', array($this, 'add_custom_color_image'));
        
        // AJAX handlers for color variants
        add_action('wp_ajax_pw_get_color_variants', array($this, 'ajax_get_color_variants'));
        add_action('wp_ajax_nopriv_pw_get_color_variants', array($this, 'ajax_get_color_variants'));
    }

    /**
     * AJAX handler for getting color variants
     */
    public function ajax_get_color_variants() {
        // Verify nonce for security
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'pw_color_variants_nonce')) {
            wp_send_json_error('Invalid nonce');
            return;
        }

        // Get pw_id from request
        $pw_id = isset($_POST['pw_id']) ? sanitize_text_field($_POST['pw_id']) : '';
        if (empty($pw_id)) {
            wp_send_json_error('pw_id is required');
            return;
        }

        // Get API token from WordPress options
        $api_token = get_option('pw_api_token');
        if (empty($api_token)) {
            wp_send_json_error('API token not configured');
            return;
        }

        // Debug logging
        error_log("PW Color Variants: pw_id = {$pw_id}, token exists = " . (!empty($api_token) ? 'yes' : 'no'));

        // Prepare API request
        $api_url = "https://dev.promowares.com/api/v1/plugin/variant_product/{$pw_id}";
        
        $args = array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_token,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json'
            ),
            'timeout' => 30,
            'sslverify' => !get_option('pw_disable_ssl', false)
        );

        // Debug logging
        error_log("PW Color Variants: Making request to {$api_url}");

        // Make API request
        $response = wp_remote_get($api_url, $args);

        // Check for WP errors
        if (is_wp_error($response)) {
            $error_message = 'API request failed: ' . $response->get_error_message();
            error_log("PW Color Variants: {$error_message}");
            wp_send_json_error($error_message);
            return;
        }

        // Get response code and body
        $response_code = wp_remote_retrieve_response_code($response);
        $response_body = wp_remote_retrieve_body($response);

        // Debug logging
        error_log("PW Color Variants: Response code = {$response_code}");
        error_log("PW Color Variants: Response body = " . substr($response_body, 0, 500));

        // Check HTTP status
        if ($response_code !== 200) {
            wp_send_json_error("API returned status code: {$response_code}. Response: " . substr($response_body, 0, 200));
            return;
        }

        // Decode JSON response
        $data = json_decode($response_body, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            wp_send_json_error('Invalid JSON response from API');
            return;
        }

        // Check API response structure
        if (!isset($data['code']) || $data['code'] !== 200) {
            $error_message = isset($data['message']) ? $data['message'] : 'API returned error';
            wp_send_json_error($error_message);
            return;
        }

        // Return successful response
        wp_send_json_success($data);
    }

    /**
     * Add color variant data display after custom templates
     */
    public function add_color_variant_data_display() {
        global $product;

        if (!is_a($product, 'WC_Product')) {
            return;
        }

        $product_id = $product->get_id();
        $pw_isSyncProduct = get_post_meta($product_id, 'pw_isSyncProduct', true);

        if ($pw_isSyncProduct != '1') {
            return;
        }

        $pw_id = get_post_meta($product_id, 'pw_id', true);
        ?>
        <div id="pw-color-variants-container" class="pw-color-variants-data" style="background: #f9f9f9; border: 1px solid #ddd; margin: 15px 0; border-radius: 4px;">
            <!-- Collapsible header -->
            <div id="pw-variants-header" style="padding: 15px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd;">
                <h4 style="margin: 0; color: #333;">颜色变体</h4>
                <span id="pw-variants-toggle" style="font-size: 18px; color: #666; transition: transform 0.3s ease;">▼</span>
            </div>
            
            <!-- Collapsible content area -->
            <div id="pw-variants-body" style="display: none; padding: 15px;">
                <div id="pw-variants-loading" style="text-align: center; padding: 20px;">
                    <img src="<?php echo esc_url(plugin_dir_url(dirname(__FILE__)) . '../assets/images/icons/spinner.gif'); ?>" alt="加载中..." style="width: 32px; height: 32px;">
                    <p style="margin-top: 10px; color: #666;">正在获取颜色变体...</p>
                </div>
                <div id="pw-variants-content" style="display: none;" data-product-id="<?php echo esc_attr($product_id); ?>" data-pw-id="<?php echo esc_attr($pw_id); ?>">
                    <!-- Vue 应用将在这里渲染内容 -->
                </div>
            </div>
        </div>

        <script>
        document.addEventListener('pwCdnLoaded', function(event) {
            const { vue: Vue, pinia, axios, defineStore } = event.detail;
            const { createApp, ref, onMounted } = Vue;

            // 创建颜色变体 Store
            const useColorVariantStore = defineStore('colorVariantDisplay', {
                state: () => ({
                    variants: [],
                    loading: false,
                    error: null,
                    rawApiData: null
                }),
                actions: {
                    async fetchVariants(pwId) {
                        if (!pwId) {
                            this.error = 'pw_id 未找到';
                            return;
                        }
                        
                        this.loading = true;
                        this.error = null;
                        
                        try {
                            const formData = new URLSearchParams();
                            formData.append('action', 'pw_get_color_variants');
                            formData.append('pw_id', pwId);
                            formData.append('nonce', '<?php echo wp_create_nonce('pw_color_variants_nonce'); ?>');
                            
                            const response = await axios.post(
                                '<?php echo admin_url('admin-ajax.php'); ?>',
                                formData,
                                {
                                    headers: {
                                        'Content-Type': 'application/x-www-form-urlencoded'
                                    }
                                }
                            );
                            
                            this.rawApiData = response.data;
                            
                            if (response.data && response.data.success && response.data.data && response.data.data.code === 200) {
                                this.variants = response.data.data.data;
                                console.log('颜色变体数据加载成功:', this.variants);
                            } else if (response.data && response.data.code === 200 && response.data.data) {
                                this.variants = response.data.data;
                                console.log('颜色变体数据加载成功:', this.variants);
                            } else {
                                this.error = response.data.data || 'API 返回数据格式错误';
                            }
                        } catch (error) {
                            console.error('获取颜色变体数据失败:', error);
                            this.error = error.response?.data?.data || error.message;
                        } finally {
                            this.loading = false;
                        }
                    }
                }
            });

            // 创建 Vue 应用
            const app = createApp({
                setup() {
                    const store = useColorVariantStore();
                    
                    onMounted(() => {
                        const pwId = document.getElementById('pw-variants-content').dataset.pwId;
                        console.log('开始获取颜色变体数据，pw_id:', pwId);
                        
                        // 显示加载状态
                        document.getElementById('pw-variants-loading').style.display = 'block';
                        document.getElementById('pw-variants-content').style.display = 'none';
                        
                        store.fetchVariants(pwId).then(() => {
                            // 隐藏加载状态，显示内容
                            document.getElementById('pw-variants-loading').style.display = 'none';
                            document.getElementById('pw-variants-content').style.display = 'block';
                        });
                    });
                    
                    return {
                        store
                    };
                },
                template: `
                    <div v-if="store.error" class="pw-api-error" style="background: #ffebee; border: 1px solid #f44336; padding: 10px; border-radius: 4px;">
                        <strong>API 错误:</strong> {{ store.error }}
                    </div>
                    <div v-else-if="store.rawApiData">
                        <pre style="background: #fff; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px; line-height: 1.4; border: 1px solid #e0e0e0; white-space: pre-wrap; word-wrap: break-word;">{{ JSON.stringify(store.rawApiData, null, 2) }}</pre>
                    </div>
                `
            });
            
            app.use(pinia);
            app.mount('#pw-variants-content');
        });

        // 添加折叠/展开功能
        document.addEventListener('DOMContentLoaded', function() {
            const header = document.getElementById('pw-variants-header');
            const body = document.getElementById('pw-variants-body');
            const toggle = document.getElementById('pw-variants-toggle');
            
            if (header && body && toggle) {
                header.addEventListener('click', function() {
                    if (body.style.display === 'none' || body.style.display === '') {
                        body.style.display = 'block';
                        toggle.style.transform = 'rotate(180deg)';
                        toggle.textContent = '▲';
                    } else {
                        body.style.display = 'none';
                        toggle.style.transform = 'rotate(0deg)';
                        toggle.textContent = '▼';
                    }
                });
            }
        });
        </script>
        <?php
    }

    /**
     * Add color selection interface after cart button
     */
    public function add_color_selection_after_cart() {
        global $product;

        if (!is_a($product, 'WC_Product')) {
            return;
        }

        $product_id = $product->get_id();
        $pw_isSyncProduct = get_post_meta($product_id, 'pw_isSyncProduct', true);

        if ($pw_isSyncProduct != '1') {
            return;
        }
        $pw_id = get_post_meta($product_id, 'pw_id', true);
        ?>
        <div id="pw-color-selection-app">
            <div class="color-selection">
                <p>Select Color:</p>
                <div class="color-options" id="color-options-container">
                    <!-- Vue 组件将在这里渲染颜色选项 -->
                </div>
                <p>or</p>
                <div class="action-buttons">
                    <button class="btn btn-gradient">Gradient</button>
                    <button class="btn btn-custom">Custom Colors</button>
                    <hr>
                </div>
            </div>
        </div>

        <style>
        #color-options-container {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .color-box {
            width: 40px;
            height: 40px;
            border: 2px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
        }
        
        .color-box:hover {
            border-color: #333;
            transform: scale(1.1);
        }
        
        .color-box.selected {
            border-color: #007cba;
            border-width: 3px;
        }
        
        .color-box.selected::after {
            content: '✓';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-weight: bold;
            text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
        }
        
        .loading-message, .error-message {
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
        }
        
        .loading-message {
            background-color: #f0f8ff;
            color: #0066cc;
            border: 1px solid #cce7ff;
        }
        
        .error-message {
            background-color: #fff5f5;
            color: #cc0000;
            border: 1px solid #ffcccc;
        }
        </style>

        <script>
        document.addEventListener('pwCdnLoaded', function(event) {
            const { vue: Vue, pinia, axios, defineStore } = event.detail;
            const { createApp, ref, onMounted, computed } = Vue;

            // 创建颜色变体 Store
            const useColorVariantStore = defineStore('colorVariant', {
                state: () => ({
                    variants: [],
                    loading: false,
                    error: null,
                    selectedVariant: null,
                    // 默认颜色选项
                    defaultColors: [
                        {
                            id: 'default-black',
                            variant_name: 'black',
                            variant_color: '#000000',
                            filter: 'brightness(0) saturate(100%)'
                        },
                        {
                            id: 'default-red',
                            variant_name: 'red',
                            variant_color: '#FF0000',
                            filter: 'brightness(0) saturate(100%) invert(15%) sepia(95%) saturate(6932%) hue-rotate(359deg) brightness(100%) contrast(112%)'
                        },
                        {
                            id: 'default-blue',
                            variant_name: 'blue',
                            variant_color: '#0000FF',
                            filter: 'brightness(0) saturate(100%) invert(8%) sepia(98%) saturate(7154%) hue-rotate(248deg) brightness(97%) contrast(143%)'
                        },
                        {
                            id: 'default-white',
                            variant_name: 'white',
                            variant_color: '#FFFFFF',
                            filter: 'brightness(0) saturate(100%) invert(100%)'
                        }
                    ]
                }),
                getters: {
                    // 如果有 API 数据就使用 API 数据，否则使用默认数据
                    displayColors: (state) => {
                        return state.variants.length > 0 ? state.variants : state.defaultColors;
                    }
                },
                actions: {
                    async fetchVariants(pwId) {
                        if (!pwId) return;
                        
                        this.loading = true;
                        this.error = null;
                        
                        try {
                            const formData = new URLSearchParams();
                            formData.append('action', 'pw_get_color_variants');
                            formData.append('pw_id', pwId);
                            formData.append('nonce', '<?php echo wp_create_nonce('pw_color_variants_nonce'); ?>');
                            
                            const response = await axios.post(
                                '<?php echo admin_url('admin-ajax.php'); ?>',
                                formData,
                                {
                                    headers: {
                                        'Content-Type': 'application/x-www-form-urlencoded'
                                    }
                                }
                            );
                            
                            if (response.data && response.data.success && response.data.data && response.data.data.code === 200) {
                                this.variants = response.data.data.data.map(variant => ({
                                    ...variant,
                                    filter: this.generateColorFilter(variant.variant_color)
                                }));
                                console.log('API 变体数据加载成功:', this.variants);
                            } else if (response.data && response.data.code === 200 && response.data.data) {
                                this.variants = response.data.data.map(variant => ({
                                    ...variant,
                                    filter: this.generateColorFilter(variant.variant_color)
                                }));
                                console.log('API 变体数据加载成功:', this.variants);
                            }
                        } catch (error) {
                            console.error('获取变体数据失败:', error);
                            this.error = error.response?.data?.data || error.message;
                            // 发生错误时使用默认颜色
                        } finally {
                            this.loading = false;
                        }
                    },
                    
                    selectVariant(variant) {
                        this.selectedVariant = variant;
                        // 更新产品颜色
                        if (window.updateProductColor) {
                            window.updateProductColor(variant.variant_color || variant.variant_name);
                        }
                    },
                    
                    // 根据颜色生成 CSS 滤镜
                    generateColorFilter(hexColor) {
                        if (!hexColor) return 'brightness(0) saturate(100%)';
                        
                        // 简单的颜色到滤镜映射
                        const colorFilters = {
                            '#000000': 'brightness(0) saturate(100%)',
                            '#FF0000': 'brightness(0) saturate(100%) invert(15%) sepia(95%) saturate(6932%) hue-rotate(359deg) brightness(100%) contrast(112%)',
                            '#0000FF': 'brightness(0) saturate(100%) invert(8%) sepia(98%) saturate(7154%) hue-rotate(248deg) brightness(97%) contrast(143%)',
                            '#FFFFFF': 'brightness(0) saturate(100%) invert(100%)'
                        };
                        
                        return colorFilters[hexColor.toUpperCase()] || 'brightness(0) saturate(100%)';
                    }
                }
            });

            // 创建 Vue 应用
            const app = createApp({
                setup() {
                    const store = useColorVariantStore();
                    
                    onMounted(() => {
                        const pwId = '<?php echo esc_js($pw_id); ?>';
                        if (pwId) {
                            store.fetchVariants(pwId);
                        }
                    });
                    
                    const handleColorClick = (variant) => {
                        store.selectVariant(variant);
                        
                        // 更新 UI 选中状态
                        document.querySelectorAll('.color-box').forEach(box => {
                            box.classList.remove('selected');
                        });
                        event.target.classList.add('selected');
                    };
                    
                    return {
                        store,
                        handleColorClick
                    };
                },
                template: `
                    <div v-if="store.loading" class="loading-message">
                        加载颜色选项中...
                    </div>
                    <div v-else-if="store.error" class="error-message">
                        {{ store.error }}
                    </div>
                    <div v-else>
                        <div 
                            v-for="variant in store.displayColors" 
                            :key="variant.id || variant.variant_name"
                            class="color-box" 
                            :data-color="variant.variant_name"
                            :data-filter="variant.filter"
                            :style="{ backgroundColor: variant.variant_color }"
                            :title="variant.variant_name"
                            @click="handleColorClick(variant)"
                        ></div>
                    </div>
                `
            });
            
            app.use(pinia);
            app.mount('#color-options-container');
        });
        </script>
        <?php
    }

    /**
     * Add customization options (quantity slider, checkboxes, etc.)
     */
    public function add_customization_options() {
        global $product;

        if (!is_a($product, 'WC_Product')) {
            return;
        }

        $product_id = $product->get_id();
        $pw_isSyncProduct = get_post_meta($product_id, 'pw_isSyncProduct', true);

        if ($pw_isSyncProduct != '1') {
            return;
        }
        ?>
       

       

        <canvas id="shadowLayer" width="600" height="600" style="display:none;"></canvas>
        
        <!-- 渐变颜色模态框 -->
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

        <!-- 自定义颜色模态框 -->
        <div id="custom-color-modal" style="display:none; position:fixed; left:0; top:0; width:100vw; height:100vh; background:rgba(0,0,0,0.3); z-index:9999; align-items:center; justify-content:center;">
            <div style="background:#fff; border-radius:8px; max-width:300px; width:90vw; padding:1rem; position:relative;">
                <button id="close-custom-color-modal" style="position:absolute; right:0.5rem; top:0.5rem; background:none; border:none; font-size:1.5rem; cursor:pointer;">&times;</button>
                <h3 style="margin-top:0;">选择自定义颜色</h3>
                <input type="color" id="customColorPicker" value="#000000" style="width:100%; height:100px; margin-bottom:1rem;" />
                <button id="applyCustomColor" class="btn btn-inquiry" style="width:100%;">应用颜色</button>
            </div>
        </div>
        <?php
        $this->enqueue_customization_scripts();
    }

    /**
     * Add custom color image overlay on product page
     */
    public function add_custom_color_image() {
        if (!is_product()) {
            return;
        }

        global $product;
        if (!is_a($product, 'WC_Product')) {
            return;
        }

        $product_id = $product->get_id();
        $pw_isSyncProduct = get_post_meta($product_id, 'pw_isSyncProduct', true);

        if ($pw_isSyncProduct != '1') {
            return;
        }

        $color_image_url = get_post_meta($product_id, 'pw_mainIMG_color', true);

        if (empty($color_image_url)) {
            return;
        }
        ?>
        <style>
            .woocommerce div.product div.images .woocommerce-product-gallery__image:first-child {
                position: relative;
                overflow: hidden;
            }

            .woocommerce div.product div.images .wp-post-image {
                position: relative;
                z-index: 2;
            }

            .custom-color-canvas-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1;
                mix-blend-mode: multiply;
                pointer-events: none;
            }
        </style>
        <script>
            jQuery(document).ready(function($) {
                var colorImageUrl = '<?php echo esc_url($color_image_url); ?>';
                
                // 创建canvas元素
                var canvas = $('<canvas class="custom-color-canvas custom-color-canvas-overlay"></canvas>');
                $('.woocommerce-product-gallery__image:first').append(canvas);
                
                var canvasElement = canvas[0];
                var ctx = canvasElement.getContext('2d');
                
                var container = $('.woocommerce-product-gallery__image:first');
                var containerWidth = container.width();
                var containerHeight = container.height();
                
                canvasElement.width = containerWidth;
                canvasElement.height = containerHeight;
                
                var colorImage = new Image();
                colorImage.crossOrigin = 'anonymous';
                colorImage.onload = function() {
                    ctx.drawImage(colorImage, 0, 0, containerWidth, containerHeight);
                };
                colorImage.src = colorImageUrl;
                
                window.colorCanvas = canvasElement;
                window.colorImageUrl = colorImageUrl;
                
                $(window).on('resize', function() {
                    var newWidth = container.width();
                    var newHeight = container.height();
                    canvasElement.width = newWidth;
                    canvasElement.height = newHeight;
                    if (colorImage.complete) {
                        ctx.drawImage(colorImage, 0, 0, newWidth, newHeight);
                    }
                });
            });
        </script>
        <?php
    }

    /**
     * Enqueue customization scripts
     */
    private function enqueue_customization_scripts() {
        ?>
        <script>
            const shadowCanvas = document.getElementById('shadowLayer');
            const shadowCtx = shadowCanvas ? shadowCanvas.getContext('2d') : null;
            let currentColor = '#000000';

            const initialColorImageUrl = '<?php global $product; echo esc_url(get_post_meta($product->get_id(), 'pw_mainIMG_color', true)); ?>';
            const currentColorImageUrl = initialColorImageUrl;
            if (shadowCanvas && initialColorImageUrl) {
                shadowCanvas.setAttribute('data-color-image', initialColorImageUrl);
            }

            function loadColorImage(imageUrl, color) {
                if (!shadowCanvas || !shadowCtx) return;

                const colorImg = new Image();
                colorImg.onload = function() {
                    const scale = Math.min(shadowCanvas.width / colorImg.width, shadowCanvas.height / colorImg.height);
                    const width = colorImg.width * scale;
                    const height = colorImg.height * scale;
                    const x = (shadowCanvas.width - width) / 2;
                    const y = (shadowCanvas.height - height) / 2;
                    shadowCtx.clearRect(0, 0, shadowCanvas.width, shadowCanvas.height);
                    shadowCtx.drawImage(colorImg, x, y, width, height);
                    shadowCtx.globalCompositeOperation = 'source-in';
                    shadowCtx.fillStyle = color;
                    shadowCtx.fillRect(0, 0, shadowCanvas.width, shadowCanvas.height);
                    shadowCtx.globalCompositeOperation = 'source-over';
                };
                colorImg.src = imageUrl;
            }

            function applyGradientToCanvas(canvas, color1, color2, direction) {
                if (!canvas || !window.colorImageUrl) return;
                
                const ctx = canvas.getContext('2d');
                const colorImage = new Image();
                colorImage.crossOrigin = 'anonymous';
                colorImage.onload = function() {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(colorImage, 0, 0, canvas.width, canvas.height);
                    
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
                        gradient = ctx.createLinearGradient(0, 0, width, 0);
                    }
                    
                    gradient.addColorStop(0, color1);
                    gradient.addColorStop(1, color2);
                    
                    ctx.globalCompositeOperation = 'source-atop';
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, width, height);
                    ctx.globalCompositeOperation = 'source-over';
                };
                colorImage.src = window.colorImageUrl;
            }

            document.addEventListener('DOMContentLoaded', function() {
                // 渐变按钮事件处理
                const gradientColorBtn = document.querySelector('.btn-gradient');
                const gradientColorModal = document.getElementById('gradient-color-modal');
                const closeGradientColorModal = document.getElementById('close-gradient-color-modal');
                const applyGradientColorBtn = document.getElementById('applyGradientColor');
                const gradientColor1 = document.getElementById('gradientColor1');
                const gradientColor2 = document.getElementById('gradientColor2');
                const gradientDirection = document.getElementById('gradientDirection');

                if (gradientColorBtn && gradientColorModal) {
                    gradientColorBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        gradientColorModal.style.display = 'flex';
                    });
                    closeGradientColorModal.addEventListener('click', function() {
                        gradientColorModal.style.display = 'none';
                    });
                    applyGradientColorBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        const color1 = gradientColor1.value;
                        const color2 = gradientColor2.value;
                        const direction = gradientDirection.value;
                        
                        if (window.colorCanvas && window.colorImageUrl) {
                            applyGradientToCanvas(window.colorCanvas, color1, color2, direction);
                        }
                        
                        const colorImageUrl = shadowCanvas ? shadowCanvas.getAttribute('data-color-image') : null;
                        if (colorImageUrl && typeof loadColorImage === 'function') {
                            loadColorImage(colorImageUrl, color1);
                        }
                        
                        if (!jQuery('#selected_color').length) {
                            jQuery('form.cart').append('<input type="hidden" id="selected_color" name="selected_color" value="gradient(' + color1 + ',' + color2 + ',' + direction + ')">');
                        } else {
                            jQuery('#selected_color').val('gradient(' + color1 + ',' + color2 + ',' + direction + ')');
                        }
                        
                        jQuery('.color-box').removeClass('selected');
                        jQuery('.btn-gradient, .btn-custom').removeClass('selected');
                        jQuery('.btn-gradient').addClass('selected');
                        
                        gradientColorModal.style.display = 'none';
                    });
                }

                // 自定义颜色事件处理
                const customColorBtn = document.querySelector('.btn-custom');
                const customColorModal = document.getElementById('custom-color-modal');
                const closeCustomColorModal = document.getElementById('close-custom-color-modal');
                const applyCustomColorBtn = document.getElementById('applyCustomColor');
                const customColorPicker = document.getElementById('customColorPicker');

                if (customColorBtn && customColorModal) {
                    customColorBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        customColorModal.style.display = 'flex';
                    });
                    closeCustomColorModal.addEventListener('click', function() {
                        customColorModal.style.display = 'none';
                    });
                    applyCustomColorBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        const color = customColorPicker.value;
                        currentColor = color;
                        updateProductColor(color);
                        customColorModal.style.display = 'none';
                    });
                }

                // 颜色更新函数
                window.updateProductColor = function(color) {
                    if (window.colorCanvas && window.colorImageUrl) {
                        const canvas = window.colorCanvas;
                        const ctx = canvas.getContext('2d');
                        
                        const colorImage = new Image();
                        colorImage.crossOrigin = 'anonymous';
                        colorImage.onload = function() {
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(colorImage, 0, 0, canvas.width, canvas.height);
                            
                            if (color && color !== 'original') {
                                ctx.globalCompositeOperation = 'source-atop';
                                
                                if (color === 'black') {
                                    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                                } else if (color === 'red') {
                                    ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
                                } else if (color === 'blue') {
                                    ctx.fillStyle = 'rgba(0, 0, 255, 0.6)';
                                } else if (color === 'white') {
                                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                                } else if (color.startsWith('#')) {
                                    const rgb = hexToRgb(color);
                                    if (rgb) {
                                        ctx.fillStyle = 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', 0.6)';
                                    }
                                }
                                
                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                                ctx.globalCompositeOperation = 'source-over';
                            }
                        };
                        colorImage.src = window.colorImageUrl;
                    }
                    
                    if (!jQuery('#selected_color').length) {
                        jQuery('form.cart').append('<input type="hidden" id="selected_color" name="selected_color" value="' + color + '">');
                    } else {
                        jQuery('#selected_color').val(color);
                    }
                };

                // 辅助函数
                window.hexToRgb = function(hex) {
                    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                    return result ? {
                        r: parseInt(result[1], 16),
                        g: parseInt(result[2], 16),
                        b: parseInt(result[3], 16)
                    } : null;
                };

                window.rgbToHue = function(r, g, b) {
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
                };

                // 颜色框点击事件
                jQuery(document).on('click', '.color-box', function() {
                    var selectedColor = jQuery(this).data('color');
                    currentColor = selectedColor;
                    window.updateProductColor(selectedColor);
                    
                    jQuery('.color-box').removeClass('selected');
                    jQuery(this).addClass('selected');
                });
            });
        </script>
        <?php
    }


}