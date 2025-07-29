/**
 * Product Customization JavaScript
 * Handles color selection, gradient, and custom color functionality
 */

// Global variables
let currentColor = '#000000';
let shadowCanvas, shadowCtx;

/**
 * Initialize product customization functionality
 */
function initProductCustomization() {
    shadowCanvas = document.getElementById('shadowLayer');
    shadowCtx = shadowCanvas ? shadowCanvas.getContext('2d') : null;
    
    const initialColorImageUrl = shadowCanvas ? shadowCanvas.getAttribute('data-color-image') : null;
    
    // Initialize event listeners
    initGradientModal();
    initCustomColorModal();
    initColorBoxEvents();
    
    // Set up global functions
    setupGlobalFunctions();
}

/**
 * Initialize gradient color modal functionality
 */
function initGradientModal() {
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
            
            updateSelectedColorInput('gradient(' + color1 + ',' + color2 + ',' + direction + ')');
            updateButtonSelection('.btn-gradient');
            
            gradientColorModal.style.display = 'none';
        });
    }
}

/**
 * Initialize custom color modal functionality
 */
function initCustomColorModal() {
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
}

/**
 * Initialize color box click events
 */
function initColorBoxEvents() {
    jQuery(document).on('click', '.color-box', function() {
        var selectedColor = jQuery(this).data('color');
        currentColor = selectedColor;
        updateProductColor(selectedColor);
        
        jQuery('.color-box').removeClass('selected');
        jQuery(this).addClass('selected');
    });
}

/**
 * Set up global functions
 */
function setupGlobalFunctions() {
    // Color update function
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
        
        updateSelectedColorInput(color);
    };

    // Utility functions
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
}

/**
 * Load color image with specified color
 */
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

/**
 * Apply gradient to canvas
 */
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

/**
 * Update selected color input field
 */
function updateSelectedColorInput(color) {
    if (!jQuery('#selected_color').length) {
        jQuery('form.cart').append('<input type="hidden" id="selected_color" name="selected_color" value="' + color + '">');
    } else {
        jQuery('#selected_color').val(color);
    }
}

/**
 * Update button selection state
 */
function updateButtonSelection(selector) {
    jQuery('.color-box').removeClass('selected');
    jQuery('.btn-gradient, .btn-custom').removeClass('selected');
    jQuery(selector).addClass('selected');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initProductCustomization();
});