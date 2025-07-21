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
        add_action('pw_admin_single_product_custom_content', array($this, 'add_customization_options'), 35);
        add_action('woocommerce_before_single_product', array($this, 'add_custom_color_image'));
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
        </div>
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