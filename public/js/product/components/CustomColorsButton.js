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
                    @click="selectCustomColor('gradient', '#FF6B6B,#4ECDC4')"
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
            
            <!-- 颜色选择弹窗 - 参考设计页面样式 -->
            <div id="pw-custom-color-modal" style="display:none; position:fixed; left:0; top:0; width:100vw; height:100vh; background:rgba(0,0,0,0.3); z-index:9999; align-items:center; justify-content:center;" @click="handleModalBackgroundClick">
                <div style="background:#fff; border-radius:8px; max-width:300px; width:90vw; padding:1rem; position:relative;" @click.stop>
                    <button id="close-custom-color-modal" style="position:absolute; right:0.5rem; top:0.5rem; background:none; border:none; font-size:1.5rem; cursor:pointer;" @click="closeColorModal">&times;</button>
                    <h3 style="margin-top:0;">选择自定义颜色</h3>
                    <input 
                        type="color" 
                        id="customColorPicker" 
                        v-model="selectedColor"
                        @input="onColorInput"
                        style="width:100%; height:100px; margin-bottom:1rem;" 
                    />
                    <button id="applyCustomColor" class="btn btn-inquiry" style="width:100%;" @click="confirmColorSelection">应用颜色</button>
                </div>
            </div>
        </div>
    `,
    
    setup() {
        const selectedButton = Vue.ref(null);
        const selectedColor = Vue.ref('#3498DB');
        const canvasStore = (typeof Pinia !== 'undefined' && Pinia.useCanvasStore) ? Pinia.useCanvasStore() : null;
        

        
        // 计算按钮是否可点击（参考ColorVariants组件逻辑）
        const isButtonClickable = Vue.computed(() => {
            return true; // 默认可点击，可根据需要添加更复杂的逻辑
        });
        
        // 打开颜色选择弹窗
        const openColorModal = () => {
            const modal = document.getElementById('pw-custom-color-modal');
            if (modal) {
                modal.style.display = 'flex';
            }
        };
        
        // 关闭颜色选择弹窗
        const closeColorModal = () => {
            const modal = document.getElementById('pw-custom-color-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        };
        
        // 处理点击弹窗背景关闭弹窗
        const handleModalBackgroundClick = (event) => {
            if (event.target.id === 'pw-custom-color-modal') {
                closeColorModal();
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
            // 检查是否存在Canvas系统
            if (typeof window.CanvasManager !== 'undefined') {
                // 切换到Canvas模式（参考product-image-canvas.js的switchToCanvasMode函数）
                switchToCanvasMode(colorValue);
            }
            
            // 更新Pinia store状态（如果存在）
            if (canvasStore && canvasStore.setSelectedVariant) {
                canvasStore.setSelectedVariant({
                    color: colorValue,
                    type: type,
                    isCustom: true
                });
            }
            
            // 触发Canvas替换事件
            triggerCanvasReplacement(colorValue, type);
        };
        
        // 切换到Canvas模式的函数（参考现有实现）
        const switchToCanvasMode = (backgroundColor) => {
            try {
                // 获取当前活动的Canvas实例
                const canvasManager = window.CanvasManager;
                if (!canvasManager) {
                    console.warn('CanvasManager not found');
                    return;
                }
                
                // 获取当前视图的Canvas
                const currentViewId = document.querySelector('.view-item.active')?.dataset.viewId;
                if (currentViewId) {
                    const canvas = canvasManager.getCanvas(currentViewId);
                    if (canvas) {
                        // 设置背景色
                        canvas.setBackgroundColor(backgroundColor, canvas.renderAll.bind(canvas));
                        console.log(`Canvas background updated to: ${backgroundColor}`);
                    }
                }
                
            } catch (error) {
                console.error('Error switching to canvas mode:', error);
            }
        };
        
        // 触发Canvas替换事件
        const triggerCanvasReplacement = (colorValue, type) => {
            const event = new CustomEvent('canvas-replacement-triggered', {
                detail: {
                    color: colorValue,
                    type: type,
                    source: 'custom-colors-button'
                },
                bubbles: true
            });
            document.dispatchEvent(event);
        };
        
        // 组件挂载时的初始化
        Vue.onMounted(() => {
            console.log('CustomColorsButton component mounted');
            
            // 监听其他颜色选择事件，保持状态同步
            document.addEventListener('pw-color-variant-selected', (event) => {
                // 如果其他颜色被选中，清除当前选中状态
                selectedButton.value = null;
            });
        });
        
        return {
            selectedButton,
            selectedColor,
            isButtonClickable,
            selectCustomColor,
            openColorModal,
            closeColorModal,
            handleModalBackgroundClick,
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