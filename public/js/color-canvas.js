/**
 * Color Canvas JavaScript
 * Handles the color overlay canvas functionality for product images
 */

/**
 * Initialize color canvas functionality
 */
function initColorCanvas() {
    jQuery(document).ready(function($) {
        var colorImageUrl = window.colorImageUrl || '';
        
        if (!colorImageUrl) {
            console.warn('Color image URL not found');
            return;
        }
        
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
        
        // Set global references
        window.colorCanvas = canvasElement;
        
        // Handle window resize
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
}