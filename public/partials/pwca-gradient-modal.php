<?php
/**
 * 渐变色选择弹窗组件
 * 
 * 这是一个可重用的渐变色选择弹窗组件，提供颜色选择和方向设置功能
 * 
 * @package PW_Admin
 * @subpackage Public/Partials
 * @since 1.0.0
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}
?>

<div id="gradient-color-modal" class="pwca-gradient-modal" style="display:none; position:fixed; left:0; top:0; width:100vw; height:100vh; background:rgba(0,0,0,0.3); z-index:9999; align-items:center; justify-content:center;">
    <div class="pwca-gradient-modal-content" style="background:#fff; border-radius:8px; max-width:400px; width:90vw; padding:1rem; position:relative;">
        <button id="close-gradient-color-modal" class="pwca-gradient-modal-close" style="position:absolute; right:0.5rem; top:0.5rem; background:none; border:none; font-size:1.5rem; cursor:pointer;">&times;</button>
        <h3 style="margin-top:0;">选择渐变色</h3>
        
        <div class="gradient-colors-container" style="display:flex; gap:1rem; margin-bottom:1rem;">
            <div style="flex:1;">
                <label style="display:block; margin-bottom:0.5rem;">颜色 1:</label>
                <div class="color-options" style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                    <div class="color-option" data-color="#ff0000" style="width:40px; height:40px; background:#ff0000; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#00ff00" style="width:40px; height:40px; background:#00ff00; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#0000ff" style="width:40px; height:40px; background:#0000ff; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#ffff00" style="width:40px; height:40px; background:#ffff00; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#ff00ff" style="width:40px; height:40px; background:#ff00ff; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#00ffff" style="width:40px; height:40px; background:#00ffff; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#ffffff" style="width:40px; height:40px; background:#ffffff; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#000000" style="width:40px; height:40px; background:#000000; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                </div>
                <input type="hidden" id="gradientColor1" value="#ff0000" />
            </div>
            
            <div style="flex:1;">
                <label style="display:block; margin-bottom:0.5rem;">颜色 2:</label>
                <div class="color-options" style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                    <div class="color-option" data-color="#ff0000" style="width:40px; height:40px; background:#ff0000; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#00ff00" style="width:40px; height:40px; background:#00ff00; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#0000ff" style="width:40px; height:40px; background:#0000ff; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#ffff00" style="width:40px; height:40px; background:#ffff00; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#ff00ff" style="width:40px; height:40px; background:#ff00ff; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#00ffff" style="width:40px; height:40px; background:#00ffff; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#ffffff" style="width:40px; height:40px; background:#ffffff; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#000000" style="width:40px; height:40px; background:#000000; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                </div>
                <input type="hidden" id="gradientColor2" value="#ffff00" />
            </div>
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

<style>
    .pwca-gradient-modal .color-option {
        position: relative;
    }
    .pwca-gradient-modal .color-option:hover {
        border-color: #007cba !important;
        transform: scale(1.05);
    }
    .pwca-gradient-modal .color-option.selected {
        border-color: #007cba !important;
        border-width: 3px !important;
    }
    .pwca-gradient-modal .color-option.selected::after {
        content: '✓';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-weight: bold;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
        font-size: 14px;
    }
    @media (max-width: 480px) {
        .pwca-gradient-modal .gradient-colors-container {
            flex-direction: column !important;
            gap: 0.5rem !important;
        }
        .pwca-gradient-modal .color-option {
            width: 35px !important;
            height: 35px !important;
        }
    }
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // 渐变色弹窗组件初始化
    const gradientColorModal = document.getElementById('gradient-color-modal');
    const closeGradientColorModal = document.getElementById('close-gradient-color-modal');
    const applyGradientColorBtn = document.getElementById('applyGradientColor');
    const gradientColor1 = document.getElementById('gradientColor1');
    const gradientColor2 = document.getElementById('gradientColor2');
    const gradientDirection = document.getElementById('gradientDirection');

    if (gradientColorModal && closeGradientColorModal && applyGradientColorBtn && gradientColor1 && gradientColor2 && gradientDirection) {
        // 标记是否已经初始化过颜色选择事件
        let colorSelectionInitialized = false;
        
        // 清除所有颜色选中状态
        function clearAllColorSelections() {
            // 清除所有颜色选项的选中状态
            const allColorOptions = document.querySelectorAll('.gradient-colors-container .color-option');
            allColorOptions.forEach(option => {
                option.classList.remove('selected');
            });
            
            // 重置隐藏输入框的值
            gradientColor1.value = '';
            gradientColor2.value = '';
        }
        
        // 初始化默认选中的颜色
        function initializeColorSelection() {
            // 先清除所有选中状态
            clearAllColorSelections();
            // 为颜色1设置默认选中
            const firstColor1Option = document.querySelector('.gradient-colors-container > div:first-child .color-option[data-color="#ff0000"]');
            if (firstColor1Option) {
                firstColor1Option.classList.add('selected');
            }
            
            // 为颜色2设置默认选中
            const firstColor2Option = document.querySelector('.gradient-colors-container > div:last-child .color-option[data-color="#ffff00"]');
            if (firstColor2Option) {
                firstColor2Option.classList.add('selected');
            }
            
            // 设置隐藏输入框的默认值
            gradientColor1.value = '#ff0000';
            gradientColor2.value = '#ffff00';
        }
        
        // 处理颜色选择事件（只初始化一次）
        function handleColorSelection() {
            if (colorSelectionInitialized) {
                return; // 如果已经初始化过，直接返回
            }
            
            const colorOptions = document.querySelectorAll('.color-option');
            colorOptions.forEach(option => {
                option.addEventListener('click', function() {
                    const color = this.getAttribute('data-color');
                    const container = this.closest('.gradient-colors-container > div');
                    
                    // 移除同一组中其他选项的选中状态
                    const siblingOptions = container.querySelectorAll('.color-option');
                    siblingOptions.forEach(sibling => {
                        sibling.classList.remove('selected');
                    });
                    
                    // 添加当前选项的选中状态
                    this.classList.add('selected');
                    
                    // 更新对应的隐藏输入框值
                    const hiddenInput = container.querySelector('input[type="hidden"]');
                    if (hiddenInput) {
                        hiddenInput.value = color;
                    }
                });
            });
            
            colorSelectionInitialized = true; // 标记为已初始化
        }
        
        // 显示弹窗的公共方法
        window.showGradientModal = function() {
            gradientColorModal.style.display = 'flex';
            // 初始化颜色选择事件（只执行一次）
            handleColorSelection();
            // 初始化默认选中状态
            initializeColorSelection();
        };
        
        // 隐藏弹窗的公共方法
        window.hideGradientModal = function() {
            // 关闭弹窗前清除所有颜色选中状态
            clearAllColorSelections();
            // 重置初始化标记，确保下次打开时重新初始化
            colorSelectionInitialized = false;
            gradientColorModal.style.display = 'none';
        };
        
        // 绑定Gradient按钮点击事件
        const gradientColorBtn = document.querySelector('.action-buttons .btn:first-child');
        if (gradientColorBtn) {
            gradientColorBtn.addEventListener('click', function(e) {
                e.preventDefault();
                window.showGradientModal();
            });
        }
        
        // 关闭按钮事件
        closeGradientColorModal.addEventListener('click', function() {
            window.hideGradientModal();
        });
        
        // 点击背景关闭
        gradientColorModal.addEventListener('click', function(e) {
            if (e.target === gradientColorModal) {
                window.hideGradientModal();
            }
        });
        
        // 应用渐变色按钮事件
        applyGradientColorBtn.addEventListener('click', function() {
            const color1 = gradientColor1.value;
            const color2 = gradientColor2.value;
            const direction = gradientDirection.value;
            
            // 更新产品页面的Pinia状态
            if (typeof window.useProductStore !== 'undefined') {
                try {
                    const productStore = window.useProductStore();
                    if (productStore && typeof productStore.setGradientColorApplied === 'function') {
                        productStore.setGradientColorApplied(true);
                        console.log('已更新产品页面渐变色应用状态为 true');
                    }
                } catch (error) {
                    console.warn('无法更新产品页面渐变色状态:', error);
                }
            }
            
            // 创建渐变矩形框住 base 图层有像素的部分
            function createGradientRectangle() {
                if (window.useCanvasStore) {
                    const store = window.useCanvasStore();
                    const activeViewId = store.activeViewId;
                    
                    if (activeViewId && store.views) {
                        const currentView = store.views.find(v => v.id === activeViewId);
                        if (currentView && currentView.base_layer) {
                            // 先清除所有旧的渐变色对象
                            if (window.clearAllGradientRects) {
                                window.clearAllGradientRects();
                            }
                            
                            // 获取 base 图层有像素部分的边界
                            const bounds = window.getBaseLayerPixelBounds(currentView.base_layer);
                            
                            if (!bounds) {
                                console.warn('无法获取 base 图层的像素边界');
                                return;
                            }
                            
                            // 获取当前激活的画布
                            const activeCanvas = window.CanvasManager.getActiveCanvas();
                            if (!activeCanvas) {
                                console.warn('无法获取当前激活的画布');
                                return;
                            }
                            
                            // 创建渐变对象
                            let gradient;
                            
                            // 根据方向设置渐变坐标
                            switch (direction) {
                                case 'to right':
                                    gradient = new fabric.Gradient({
                                        type: 'linear',
                                        coords: {
                                            x1: 0,
                                            y1: 0,
                                            x2: bounds.width,
                                            y2: 0
                                        },
                                        colorStops: [
                                            { offset: 0, color: color1 },
                                            { offset: 1, color: color2 }
                                        ]
                                    });
                                    break;
                                case 'to left':
                                    gradient = new fabric.Gradient({
                                        type: 'linear',
                                        coords: {
                                            x1: bounds.width,
                                            y1: 0,
                                            x2: 0,
                                            y2: 0
                                        },
                                        colorStops: [
                                            { offset: 0, color: color1 },
                                            { offset: 1, color: color2 }
                                        ]
                                    });
                                    break;
                                case 'to bottom':
                                    gradient = new fabric.Gradient({
                                        type: 'linear',
                                        coords: {
                                            x1: 0,
                                            y1: 0,
                                            x2: 0,
                                            y2: bounds.height
                                        },
                                        colorStops: [
                                            { offset: 0, color: color1 },
                                            { offset: 1, color: color2 }
                                        ]
                                    });
                                    break;
                                case 'to top':
                                    gradient = new fabric.Gradient({
                                        type: 'linear',
                                        coords: {
                                            x1: 0,
                                            y1: bounds.height,
                                            x2: 0,
                                            y2: 0
                                        },
                                        colorStops: [
                                            { offset: 0, color: color1 },
                                            { offset: 1, color: color2 }
                                        ]
                                    });
                                    break;
                                case 'to bottom right':
                                    gradient = new fabric.Gradient({
                                        type: 'linear',
                                        coords: {
                                            x1: 0,
                                            y1: 0,
                                            x2: bounds.width,
                                            y2: bounds.height
                                        },
                                        colorStops: [
                                            { offset: 0, color: color1 },
                                            { offset: 1, color: color2 }
                                        ]
                                    });
                                    break;
                                case 'to bottom left':
                                    gradient = new fabric.Gradient({
                                        type: 'linear',
                                        coords: {
                                            x1: bounds.width,
                                            y1: 0,
                                            x2: 0,
                                            y2: bounds.height
                                        },
                                        colorStops: [
                                            { offset: 0, color: color1 },
                                            { offset: 1, color: color2 }
                                        ]
                                    });
                                    break;
                                default:
                                    // 默认从左到右
                                    gradient = new fabric.Gradient({
                                        type: 'linear',
                                        coords: {
                                            x1: 0,
                                            y1: 0,
                                            x2: bounds.width,
                                            y2: 0
                                        },
                                        colorStops: [
                                            { offset: 0, color: color1 },
                                            { offset: 1, color: color2 }
                                        ]
                                    });
                            }
                            
                            // 创建矩形对象
                            const gradientRect = new fabric.Rect({
                                left: bounds.left,
                                top: bounds.top,
                                width: bounds.width,
                                height: bounds.height,
                                fill: gradient,
                                selectable: false,
                                evented: false,
                                hasControls: false,
                                hasBorders: false,
                                lockMovementX: true,
                                lockMovementY: true,
                                lockRotation: true,
                                lockScalingX: true,
                                lockScalingY: true,
                                hoverCursor: 'default',
                                moveCursor: 'default',
                                id: 'gradient-rect-' + Date.now()
                            });
                            
                            // 添加到画布
                            activeCanvas.add(gradientRect);
                            // 不设置为选中状态，因为不允许选中
                            activeCanvas.renderAll();
                            
                            console.log(`已创建渐变矩形: ${color1} 到 ${color2}, 方向: ${direction}`);
                            console.log('矩形位置和尺寸:', bounds);
                            
                        } else {
                            console.warn('当前视图没有 base_layer 或视图不存在');
                        }
                    } else {
                        console.warn('没有激活的视图或 store 不可用');
                    }
                } else {
                    console.warn('useCanvasStore 不可用');
                }
            }
            
            createGradientRectangle();
            
            // 更新颜色样本中的选中状态
            const colorSwatches = document.querySelectorAll('.color-swatch');
            colorSwatches.forEach(s => s.classList.remove('selected'));
            window.hideGradientModal();
        });
    }
});
</script>