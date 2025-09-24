// CustomColorsButton.js - 自定义颜色按钮组件
// 提供Gradient和Custom Colors按钮，具有与.pw-color-swatch相同的点击逻辑

// 定义CustomColorsButton组件
window.CustomColorsButton = {
    template: `
        <div class="pw-custom-colors-container">
            <div class="pw-custom-colors-group">
                <button
                    class="pw-custom-color-btn pw-gradient-btn"
                    :class="{ 'selected': selectedButton === 'gradient' }"
                    @click="openGradientModal"
                    :disabled="!isButtonClickable"
                >
                    <span class="btn-text">Gradient</span>
                </button>
                
                <button
                    class="pw-custom-color-btn pw-custom-colors-btn"
                    :class="{ 'selected': selectedButton === 'custom' }"
                    @click="openColorModal"
                    :disabled="!isButtonClickable"
                >
                    <span class="btn-text">Custom Colors</span>
                </button>
            </div>
            

            
            <!-- 自定义颜色弹窗 (保留原有) -->
            <div id="pw-custom-color-modal" class="modal micromodal-slide" aria-hidden="true">
                <div class="modal__overlay" tabindex="-1" data-micromodal-close>
                    <div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="pw-custom-color-modal-title">
                        <header>
                            <h2 class="modal__title" id="pw-custom-color-modal-title">选择自定义颜色</h2>
                            <button class="modal__close" aria-label="Close modal" data-micromodal-close>&times;</button>
                        </header>
                        <main class="modal__content">
                            <input type="color" id="customColorPicker" v-model="selectedColor" @input="onColorInput" />
                            <button class="btn btn-inquiry" @click="confirmColorSelection">应用颜色</button>
                        </main>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    setup() {
        const selectedButton = Vue.ref(null);
        const selectedColor = Vue.ref('#3498DB');
        const canvasStore = (typeof Pinia !== 'undefined' && Pinia.useCanvasStore) ? Pinia.useCanvasStore() : null;
        const productStore = (typeof window.useProductStore !== 'undefined') ? window.useProductStore() : null;
        

        
        // 计算按钮是否可点击（参考ColorVariants组件逻辑）
        const isButtonClickable = Vue.computed(() => {
            return true; // 默认可点击，可根据需要添加更复杂的逻辑
        });
        
        // 打开自定义颜色弹窗
        const openColorModal = () => {
            MicroModal.show('pw-custom-color-modal');
        };
        
        // 关闭自定义颜色弹窗
        const closeColorModal = () => {
            MicroModal.close('pw-custom-color-modal');
        };
        
        // 打开渐变设置弹窗 - 使用公共组件
        const openGradientModal = () => {
            selectedButton.value = 'gradient';
            // 使用公共组件的全局方法
            if (typeof window.showGradientModal === 'function') {
                window.showGradientModal();
            } else {
                console.error('公共渐变色组件未加载');
            }
        };
        
        // 处理颜色输入变化
        const onColorInput = (event) => {
            selectedColor.value = event.target.value;
        };
        

        
        // 确认颜色选择
        const confirmColorSelection = () => {
            selectCustomColor('custom', selectedColor.value);
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
                
                console.log(`Custom color selected: ${buttonType} - ${colorValue}`);
                
            } catch (error) {
                console.error('Error selecting custom color:', error);
            }
        };
        
        // 处理颜色选择的核心逻辑（模拟.pw-color-swatch的行为）
        const handleColorSelection = (colorValue, type) => {
            // 触发产品图片Canvas替换功能（参考ColorVariants组件的实现）
            if (colorValue && window.ProductImageCanvas) {
                window.ProductImageCanvas.switchToCanvas(colorValue);
            }
            
            // 更新Pinia store状态（如果存在）
            if (productStore && productStore.setSelectedVariant) {
                // 创建一个类似variant的对象
                const customVariant = {
                    id: 'custom-' + Date.now(),
                    variant_color: colorValue,
                    type: type,
                    isCustom: true
                };
                productStore.setSelectedVariant(customVariant);
            }
            
            // 发送自定义事件，与ColorVariants保持一致
            const customEvent = new CustomEvent('pw-color-variant-selected', {
                detail: { 
                    variant: {
                        variant_color: colorValue,
                        type: type,
                        isCustom: true
                    }
                },
                bubbles: true
            });
            document.dispatchEvent(customEvent);
        };
        
        // 组件挂载时的初始化
        Vue.onMounted(() => {
            console.log('CustomColorsButton component mounted');
            
            // 监听其他颜色选择事件，保持状态同步
            document.addEventListener('pw-color-variant-selected', (event) => {
                // 如果其他颜色被选中，清除当前选中状态
                selectedButton.value = null;
                
                // 重置渐变颜色应用状态，重新显示复选框和按钮
                if (productStore && productStore.setGradientColorApplied) {
                    productStore.setGradientColorApplied(false);
                    console.log('Other color selected - showing checkboxes and add to cart button');
                }
            });
        });
        
        return {
            selectedButton,
            selectedColor,
            isButtonClickable,
            selectCustomColor,
            openColorModal,
            closeColorModal,
            openGradientModal,
            onColorInput,
            confirmColorSelection
        };
    }
};

// 自动注册组件到全局Vue应用（如果存在）
if (typeof window.vueApp !== 'undefined' && window.vueApp.component) {
    window.vueApp.component('CustomColorsButton', window.CustomColorsButton);
}

console.log('CustomColorsButton component loaded successfully');