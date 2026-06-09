// CustomColorsButton.js - 自定义颜色按钮组件
// 提供Gradient和Custom Colors按钮，具有与.pw-color-swatch相同的点击逻辑

// 定义CustomColorsButton组件
window.CustomColorsButton = {
    template: `
        <div class="pw-custom-colors-container">
            <div class="pw-custom-colors-group">
                <button
                    v-if="showGradientButton"
                    class="pw-custom-color-btn pw-gradient-btn"
                    :class="{ 'selected': selectedButton === 'gradient' }"
                    @click="handleGradientClick"
                    :disabled="!isButtonClickable"
                >
                    <span class="btn-text">Gradient</span>
                </button>
                
                <button
                    v-if="showCustomColorButton"
                    class="pw-custom-color-btn pw-custom-colors-btn"
                    :class="{ 'selected': selectedButton === 'custom' }"
                    @click="openColorModal"
                    :disabled="isCustomColorsDisabled || !isButtonClickable"
                >
                    <span class="btn-text">Custom Colors</span>
                </button>
            </div>
            
            <!-- Status Display Area -->
            <div class="pw-custom-colors-status" v-if="showCustomColorStatus || showGradientStatus">
                <!-- Custom Colors Status -->
                <div v-if="showCustomColorStatus" class="custom-color-status">
                    Selected: {{ appliedCustomColor }} <br>
                    <a href="#" @click.prevent="resetCustomColor" class="reset-link">Reselect</a>
                </div>
                
                <!-- Gradient Status -->
                <div v-if="showGradientStatus" class="gradient-status">
                    <span class="gradient-text">Gradient</span>
                    <button @click="resetGradient" class="gradient-close-btn" title="Remove gradient">×</button>
                </div>
            </div>
            
            <!-- Custom Color Modal -->
            <div
                id="pw-custom-color-modal"
                :class="['modal', 'micromodal-slide', { 'is-open': isColorModalOpen }]"
                :aria-hidden="!isColorModalOpen"
            >
                <div
                    class="modal__overlay"
                    tabindex="-1"
                    data-micromodal-close
                    @click.self="closeColorModal"
                >
                    <div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="pw-custom-color-modal-title">
                        <header>
                            <h2 class="modal__title" id="pw-custom-color-modal-title">Select Custom Color</h2>
                            <button
                                class="modal__close"
                                aria-label="Close modal"
                                data-micromodal-close
                                @click="closeColorModal"
                            >&times;</button>
                        </header>
                        <main class="modal__content">
                            <input type="color" id="customColorPicker" v-model="selectedColor" @input="onColorInput" />
                            <button class="btn btn-inquiry" @click="confirmColorSelection">Apply Color</button>
                        </main>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    setup() {
        const selectedButton = Vue.ref(null);
        const selectedColor = Vue.ref('#3498DB');
        const canvasStore = (typeof window.useCanvasStore === 'function') ? window.useCanvasStore() : null;
        const productStore = (typeof window.useProductStore !== 'undefined') ? window.useProductStore() : null;
        const isColorModalOpen = Vue.ref(false);
        
        // 新增状态管理
        const showCustomColorStatus = Vue.ref(false);
        const showGradientStatus = Vue.ref(false);
        const appliedCustomColor = Vue.ref('');
        const gradientTextObject = Vue.ref(null); // 存储画布上的渐变文字对象
        const gradientTextOverlay = Vue.ref(null); // 存储原始图片上的文字覆盖层
        // 当渐变状态显示时，禁用 Custom Colors 按钮
        const isCustomColorsDisabled = Vue.computed(() => {
            return !!showGradientStatus.value;
        });
        
        // 从 store 获取按钮可见性 getter（用 computed 包裹以保持响应式）
        const showGradientButton = Vue.computed(() => {
            return productStore ? productStore.showGradientButton : true;
        });
        const showCustomColorButton = Vue.computed(() => {
            return productStore ? productStore.showCustomColorButton : true;
        });
        
        // 计算按钮是否可点击（参考ColorVariants组件逻辑）
        const isButtonClickable = Vue.computed(() => {
            return true; // 默认可点击，可根据需要添加更复杂的逻辑
        });
        
        // 打开自定义颜色弹窗
        const openColorModal = () => {
            isColorModalOpen.value = true;
        };
        
        // 关闭自定义颜色弹窗
        const closeColorModal = () => {
            isColorModalOpen.value = false;
        };
        
        // 处理Gradient按钮点击 - 销毁Canvas，恢复原始图片，在原始图片上添加文字
        const handleGradientClick = () => {
            
            selectedButton.value = 'gradient';
            
            // 首先销毁Canvas并恢复原始图片（类似resetCustomColor的逻辑）
            if (window.ProductImageCanvas) {
                try {
                    // 调用destroy方法销毁Canvas（已包含showOriginalImage调用）
                    if (typeof window.ProductImageCanvas.destroy === 'function') {
                        window.ProductImageCanvas.destroy();
                    }
                } catch (error) {
                }
            }
            
            // 确保原始图片容器重新显示
            ensureOriginalImageVisible();
            
            // 在原始图片上添加文字覆盖层
            addTextOverlayToOriginalImage();
            
            // 更新状态
            showGradientStatus.value = true;
            showCustomColorStatus.value = false; // 隐藏Custom Colors状态
            
            
        };
        
        // 处理颜色输入变化
        const onColorInput = (event) => {
            selectedColor.value = event.target.value;
        };
        
        // 添加文字到画布
        const addTextToCanvas = () => {
            try {
                // 获取产品画布实例
                let canvas = null;
                
                // 尝试获取产品页面的画布实例
                if (window.ProductImageCanvas && window.ProductImageCanvas.getCurrentCanvas) {
                    canvas = window.ProductImageCanvas.getCurrentCanvas();
                } else if (window.CanvasManager) {
                    // 备用方案：通过CanvasManager获取
                    canvas = window.CanvasManager.getCanvas('product-view') || 
                            window.CanvasManager.getCanvas('baseCanvas-view1');
                }
                
                if (canvas) {
                    // 创建文字对象
                    const text = new fabric.Text('123456', {
                        left: 100,
                        top: 100,
                        fontFamily: 'Arial',
                        fontSize: 24,
                        fill: '#000000',
                        id: 'gradient-text-' + Date.now(),
                        selectable: false,
                        evented: false
                    });
                    
                    // 添加到画布
                    canvas.add(text);
                    canvas.renderAll();
                    
                    // 保存文字对象引用
                    gradientTextObject.value = text;
                    
                    
                } else {
                }
            } catch (error) {
            }
        };
        
        // 从画布移除文字
        const removeTextFromCanvas = () => {
            try {
                if (gradientTextObject.value) {
                    // 获取画布实例
                    let canvas = null;
                    
                    if (window.ProductImageCanvas && window.ProductImageCanvas.getCurrentCanvas) {
                        canvas = window.ProductImageCanvas.getCurrentCanvas();
                    } else if (window.CanvasManager) {
                        canvas = window.CanvasManager.getCanvas('product-view') || 
                                window.CanvasManager.getCanvas('baseCanvas-view1');
                    }
                    
                    if (canvas) {
                        canvas.remove(gradientTextObject.value);
                        canvas.renderAll();
                        gradientTextObject.value = null;
                        
                    }
                }
            } catch (error) {
            }
        };
        
        // 重置Custom Colors状态
        const resetCustomColor = () => {
            
            
            // 销毁Canvas实例并还原到原始图片
            if (window.ProductImageCanvas) {
                try {
                    // 调用destroy方法销毁Canvas（已包含showOriginalImage调用）
                    if (typeof window.ProductImageCanvas.destroy === 'function') {
                        window.ProductImageCanvas.destroy();
                    }
                    
                } catch (error) {
                }
            }
            
            // 额外确保原始图片容器重新显示（使用与ProductImageCanvas相同的选择器）
            const selectors = [
                '.woocommerce-product-gallery__wrapper',
                '.woocommerce-product-gallery',
                '.product-images',
                '.single-product-main-image',
                '.product-gallery',
                '.wp-post-image',
                '.attachment-woocommerce_single',
                '.product-image-main',
                '.pw-product-image-container',
                '.product-image-container',
                '[class*="product-image"]',
                '[class*="main-image"]'
            ];
            
            let originalImageContainer = null;
            for (const selector of selectors) {
                const container = document.querySelector(selector);
                if (container) {
                    originalImageContainer = container;
                    break;
                }
            }
            
            // 如果没找到标准容器，尝试查找包含产品图片的父容器
            if (!originalImageContainer) {
                const productImage = document.querySelector('img[class*="wp-post-image"], img[class*="attachment-woocommerce"]');
                if (productImage) {
                    originalImageContainer = productImage.closest('div, figure, section');
                }
            }
            
            if (originalImageContainer) {
                originalImageContainer.style.display = '';
            } else {
            }
            
            // 确保移除Canvas容器（如果存在）
            const canvasContainer = document.querySelector('.pwca-product-canvas-container');
            if (canvasContainer) {
                canvasContainer.remove();
            }
            
            // 清除产品状态管理中的自定义颜色状态
            if (productStore) {
                window.ProductColorSelectionBridge.resetSelection(productStore);
            }
            
            // 重置组件内部状态
            showCustomColorStatus.value = false;
            showGradientStatus.value = false;
            appliedCustomColor.value = '';
            selectedButton.value = null;
            
            // 发送重置事件
            document.dispatchEvent(new CustomEvent('pw-custom-color-reset', {
                detail: { 
                    type: 'custom-color',
                    reset: true,
                    action: 'restore-original'
                }
            }));
            
            // 触发原始图片恢复事件
            document.dispatchEvent(new CustomEvent('pw-original-image-restored', {
                detail: { 
                    source: 'custom-color-reset',
                    timestamp: Date.now()
                }
            }));
            
            
        };
        
        // 确保原始图片容器可见
        const ensureOriginalImageVisible = () => {
            const selectors = [
                '.woocommerce-product-gallery__wrapper',
                '.woocommerce-product-gallery',
                '.product-images',
                '.single-product-main-image',
                '.product-gallery',
                '.product-image-main',
                '.product-image-wrapper',
                '.product-main-image',
                '.woocommerce-product-gallery__image'
            ];
            
            let originalImageContainer = null;
            
            for (const selector of selectors) {
                originalImageContainer = document.querySelector(selector);
                if (originalImageContainer) {
                    
                    break;
                }
            }
            
            // 如果没找到，尝试通过图片元素找到父容器
            if (!originalImageContainer) {
                const productImage = document.querySelector('img[class*="wp-post-image"], img[class*="attachment-woocommerce"]');
                if (productImage) {
                    originalImageContainer = productImage.closest('div, figure, section');
                }
            }
            
            if (originalImageContainer) {
                originalImageContainer.style.display = '';
            } else {
            }
        };
        
        // 在原始图片上添加文字覆盖层
        const addTextOverlayToOriginalImage = () => {
            try {
                // 首先移除已存在的文字覆盖层
                removeTextOverlayFromOriginalImage();
                
                // 找到原始图片容器
                const selectors = [
                    '.woocommerce-product-gallery__wrapper',
                    '.woocommerce-product-gallery',
                    '.product-images',
                    '.single-product-main-image',
                    '.product-gallery',
                    '.product-image-main',
                    '.product-image-wrapper',
                    '.product-main-image',
                    '.woocommerce-product-gallery__image'
                ];
                
                let imageContainer = null;
                
                for (const selector of selectors) {
                    imageContainer = document.querySelector(selector);
                    if (imageContainer) {
                        
                        break;
                    }
                }
                
                if (!imageContainer) {
                    const productImage = document.querySelector('img[class*="wp-post-image"], img[class*="attachment-woocommerce"]');
                    if (productImage) {
                        imageContainer = productImage.closest('div, figure, section');
                    }
                }
                
                if (imageContainer) {
                    // 确保容器有相对定位
                    const computedStyle = window.getComputedStyle(imageContainer);
                    if (computedStyle.position === 'static') {
                        imageContainer.style.position = 'relative';
                    }
                    
                    // 创建遮罩覆盖层
                    const textOverlay = document.createElement('div');
                    textOverlay.className = 'pw-gradient-text-overlay';
                    textOverlay.textContent = 'Complete the design on the customization page';
                    textOverlay.style.cssText = `
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(128, 128, 128, 0.7);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                        font-weight: bold;
                        color: white;
                        border: 2px solid white;
                        box-sizing: border-box;
                        text-align: center;
                        z-index: 1000;
                        pointer-events: none;
                        user-select: none;
                    `;
                    
                    // 添加到容器
                    imageContainer.appendChild(textOverlay);
                    
                    // 保存引用
                    gradientTextOverlay.value = textOverlay;
                    
                    
                } else {
                }
            } catch (error) {
            }
        };
        
        // 从原始图片移除文字覆盖层
        const removeTextOverlayFromOriginalImage = () => {
            try {
                if (gradientTextOverlay.value) {
                    gradientTextOverlay.value.remove();
                    gradientTextOverlay.value = null;
                }
                
                // 额外清理：移除所有可能存在的文字覆盖层
                const existingOverlays = document.querySelectorAll('.pw-gradient-text-overlay');
                    existingOverlays.forEach(overlay => {
                    overlay.remove();
                });
            } catch (error) {
            }
        };
        
        // 重置Gradient状态
        const resetGradient = () => {
            showGradientStatus.value = false;
            selectedButton.value = null;
            removeTextFromCanvas();
            removeTextOverlayFromOriginalImage(); // 添加移除文字覆盖层
            
        };
        

        
        // 确认颜色选择
        const confirmColorSelection = () => {
            selectCustomColor('custom', selectedColor.value);
            // 显示Custom Colors状态
            appliedCustomColor.value = selectedColor.value;
            showCustomColorStatus.value = true;
            showGradientStatus.value = false; // 隐藏渐变状态
            closeColorModal();
        };
        
        // 选择自定义颜色的处理函数
        const selectCustomColor = (buttonType, colorValue) => {
            try {
                // 设置选中状态
                selectedButton.value = buttonType;
                
                // 触发与.pw-color-swatch相同的颜色切换逻辑
                handleColorSelection(colorValue, buttonType);
                
                // 发送自定义事件（参考ColorVariants组件）
                const customEvent = new CustomEvent('pw-custom-color-selected', {
                    detail: {
                        color: colorValue,
                        type: buttonType,
                        timestamp: Date.now()
                    },
                    bubbles: true
                });
                document.dispatchEvent(customEvent);
                
                
                
            } catch (error) {
            }
        };
        
        // 处理颜色选择的核心逻辑（模拟.pw-color-swatch的行为）
        const handleColorSelection = (colorValue, type) => {
            window.ProductColorSelectionBridge.applyCustomColorSelection(colorValue, type, productStore);
        };
        
        // 组件挂载时的初始化
        Vue.onMounted(() => {
            
            
            // 监听其他颜色选择事件，保持状态同步
            document.addEventListener('pw-color-variant-selected', (event) => {
                // 如果其他颜色被选中，清除当前选中状态
                selectedButton.value = null;
                showCustomColorStatus.value = false;
                showGradientStatus.value = false;
                
                // 移除画布上的文字
                removeTextFromCanvas();
                
                // 重置渐变颜色应用状态，重新显示复选框和按钮
                if (productStore && productStore.setGradientColorApplied) {
                    productStore.setGradientColorApplied(false);
                    
                }
            });
        });
        
        return {
            selectedButton,
            selectedColor,
            isButtonClickable,
            isCustomColorsDisabled,
            showGradientButton,
            showCustomColorButton,
            isColorModalOpen,
            selectCustomColor,
            openColorModal,
            closeColorModal,
            handleGradientClick,
            onColorInput,
            confirmColorSelection,
            showCustomColorStatus,
            showGradientStatus,
            appliedCustomColor,
            resetCustomColor,
            resetGradient,
            addTextToCanvas,
            removeTextFromCanvas
        };
    }
};

// 自动注册组件到全局Vue应用（如果存在）
if (typeof window.vueApp !== 'undefined' && window.vueApp.component) {
    window.vueApp.component('CustomColorsButton', window.CustomColorsButton);
}
