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
            
            // 检查是否有上次选择的渐变色，如果有则恢复
            if (typeof window.lastGradientColors !== 'undefined' && window.lastGradientColors) {
                // 恢复颜色1
                if (window.lastGradientColors.color1) {
                    const color1Option = document.querySelector(`.gradient-colors-container > div:first-child .color-option[data-color="${window.lastGradientColors.color1}"]`);
                    if (color1Option) {
                        // 清除其他选中状态
                        const color1Options = document.querySelectorAll('.gradient-colors-container > div:first-child .color-option');
                        color1Options.forEach(opt => opt.classList.remove('selected'));
                        color1Option.classList.add('selected');
                        gradientColor1.value = window.lastGradientColors.color1;
                    }
                }
                
                // 恢复颜色2
                if (window.lastGradientColors.color2) {
                    const color2Option = document.querySelector(`.gradient-colors-container > div:last-child .color-option[data-color="${window.lastGradientColors.color2}"]`);
                    if (color2Option) {
                        // 清除其他选中状态
                        const color2Options = document.querySelectorAll('.gradient-colors-container > div:last-child .color-option');
                        color2Options.forEach(opt => opt.classList.remove('selected'));
                        color2Option.classList.add('selected');
                        gradientColor2.value = window.lastGradientColors.color2;
                    }
                }
                
                // 恢复方向
                if (window.lastGradientColors.direction) {
                    gradientDirection.value = window.lastGradientColors.direction;
                }
            } else {
                // 如果没有上次选择的颜色，使用默认选中状态
                initializeColorSelection();
            }
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
            
            // 保存当前选择的渐变色到全局变量，供下次打开时使用
            if (typeof window.lastGradientColors === 'undefined') {
                window.lastGradientColors = {};
            }
            window.lastGradientColors = {
                color1: color1,
                color2: color2,
                direction: direction
            };
            
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
            
            // 如果在产品页面，先切换到Canvas模式显示画布
            if (typeof window.ProductImageCanvas !== 'undefined' && window.ProductImageCanvas.switchToCanvas) {
                // 使用第一个颜色作为背景色来初始化画布
                window.ProductImageCanvas.switchToCanvas(color1);
                console.log('已切换到Canvas模式，背景色:', color1);
            }
            
            // 应用渐变色到Base图层（使用剪切方案）
            function applyGradientToBaseLayer() {
                // 检查是否在设计页面环境（有useCanvasStore）
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
                            
                            // 获取当前激活视图的baseCanvas（渐变色应该应用在baseCanvas上）
            const baseCanvasId = `baseCanvas-${activeViewId}`;
            
            // 优先从 CanvasManager 获取 baseCanvas 实例
            const baseCanvas = window.CanvasManager.getCanvas(baseCanvasId) ||
                              (document.getElementById(baseCanvasId) && document.getElementById(baseCanvasId).__fabricCanvas);
                            
                            if (!baseCanvas) {
                                console.warn('无法获取baseCanvas，渐变色应该应用在baseCanvas上');
                                return;
                            }
                            
                            const baseLayerObject = currentView.base_layer;
                            
                            // 获取Base图层的图像元素
                            const imageElement = baseLayerObject.getElement();
                            if (!imageElement) {
                                console.warn('无法获取Base图层的图像元素');
                                return;
                            }
                            
                            // 创建渐变对象，使用像素单位
                            const imageWidth = imageElement.width || imageElement.naturalWidth;
                            const imageHeight = imageElement.height || imageElement.naturalHeight;
                            
                            let gradientCoords;
                            
                            // 根据方向设置渐变坐标
                            switch (direction) {
                                case 'to right':
                                    gradientCoords = { x1: 0, y1: 0, x2: imageWidth, y2: 0 };
                                    break;
                                case 'to bottom':
                                    gradientCoords = { x1: 0, y1: 0, x2: 0, y2: imageHeight };
                                    break;
                                case 'to bottom right':
                                    gradientCoords = { x1: 0, y1: 0, x2: imageWidth, y2: imageHeight };
                                    break;
                                case 'to bottom left':
                                    gradientCoords = { x1: imageWidth, y1: 0, x2: 0, y2: imageHeight };
                                    break;
                                default:
                                    // 默认从左到右
                                    gradientCoords = { x1: 0, y1: 0, x2: imageWidth, y2: 0 };
                            }
                            
                            const gradient = new fabric.Gradient({
                                type: 'linear',
                                gradientUnits: 'pixels',
                                coords: gradientCoords,
                                colorStops: [
                                    { offset: 0, color: color1 },
                                    { offset: 1, color: color2 }
                                ]
                            });
                            
                            // 创建一个矩形作为渐变覆盖层，使用裁剪功能
                            const overlayRect = new fabric.Rect({
                                left: baseLayerObject.left,
                                top: baseLayerObject.top,
                                width: imageWidth,
                                height: imageHeight,
                                originX: baseLayerObject.originX,
                                originY: baseLayerObject.originY,
                                scaleX: baseLayerObject.scaleX,
                                scaleY: baseLayerObject.scaleY,
                                angle: baseLayerObject.angle,
                                fill: gradient,
                                selectable: false,
                                evented: false,
                                opacity: baseLayerObject.opacity,
                                globalCompositeOperation: 'source-in', // 关键：只在Base图层非透明区域显示
                                name: 'Base Gradient Overlay',
                                id: 'gradient-rect-' + Date.now()
                            });
                            
                            // 添加新的渐变覆盖层
                            baseCanvas.add(overlayRect);
                            
                            // 确保Base图层在渐变覆盖层之前（作为裁剪模板）
                            baseCanvas.sendToBack(baseLayerObject);
                            baseCanvas.bringForward(overlayRect);
                            
                            // 如果有 Overlay Layer，确保它在最上层
                            const overlayLayerObject = baseCanvas.getObjects().find(obj => obj.name === 'Overlay Layer');
                            if (overlayLayerObject) {
                                baseCanvas.bringToFront(overlayLayerObject);
                            }
                            
                            baseCanvas.renderAll();
                            
                            console.log(`已应用渐变色: ${color1} 到 ${color2}, 方向: ${direction}`);
                            
                        } else {
                            console.warn('当前视图没有 base_layer 或视图不存在');
                        }
                    } else {
                        console.warn('没有激活的视图或 store 不可用');
                    }
                } else if (typeof window.ProductImageCanvas !== 'undefined' && window.CanvasManager) {
                    // 产品页面环境：使用ProductImageCanvas的画布
                    console.log('在产品页面环境中应用渐变色');
                    
                    const productCanvas = window.CanvasManager.getCanvas('product-view');
                    if (productCanvas) {
                        // 查找Base图层对象
                        const baseLayerObject = productCanvas.getObjects().find(obj =>
                            obj.name === 'Base Layer' || obj.type === 'image'
                        );
                        
                        if (baseLayerObject) {
                            // 先清除旧的渐变覆盖层
                            const existingOverlay = productCanvas.getObjects().find(obj => obj.name === 'Base Gradient Overlay');
                            if (existingOverlay) {
                                productCanvas.remove(existingOverlay);
                            }
                            
                            // 获取Base图层的图像元素
                            const imageElement = baseLayerObject.getElement();
                            if (imageElement) {
                                const imageWidth = imageElement.width || imageElement.naturalWidth;
                                const imageHeight = imageElement.height || imageElement.naturalHeight;
                                
                                let gradientCoords;
                                
                                // 根据方向设置渐变坐标
                                switch (direction) {
                                    case 'to right':
                                        gradientCoords = { x1: 0, y1: 0, x2: imageWidth, y2: 0 };
                                        break;
                                    case 'to bottom':
                                        gradientCoords = { x1: 0, y1: 0, x2: 0, y2: imageHeight };
                                        break;
                                    case 'to bottom right':
                                        gradientCoords = { x1: 0, y1: 0, x2: imageWidth, y2: imageHeight };
                                        break;
                                    case 'to bottom left':
                                        gradientCoords = { x1: imageWidth, y1: 0, x2: 0, y2: imageHeight };
                                        break;
                                    default:
                                        gradientCoords = { x1: 0, y1: 0, x2: imageWidth, y2: 0 };
                                }
                                
                                const gradient = new fabric.Gradient({
                                    type: 'linear',
                                    gradientUnits: 'pixels',
                                    coords: gradientCoords,
                                    colorStops: [
                                        { offset: 0, color: color1 },
                                        { offset: 1, color: color2 }
                                    ]
                                });
                                
                                // 创建渐变覆盖层
                                const overlayRect = new fabric.Rect({
                                    left: baseLayerObject.left,
                                    top: baseLayerObject.top,
                                    width: imageWidth,
                                    height: imageHeight,
                                    originX: baseLayerObject.originX,
                                    originY: baseLayerObject.originY,
                                    scaleX: baseLayerObject.scaleX,
                                    scaleY: baseLayerObject.scaleY,
                                    angle: baseLayerObject.angle,
                                    fill: gradient,
                                    selectable: false,
                                    evented: false,
                                    opacity: baseLayerObject.opacity,
                                    globalCompositeOperation: 'source-in',
                                    name: 'Base Gradient Overlay',
                                    id: 'gradient-rect-' + Date.now()
                                });
                                
                                // 添加渐变覆盖层
                                productCanvas.add(overlayRect);
                                
                                // 确保图层顺序正确
                                productCanvas.sendToBack(baseLayerObject);
                                productCanvas.bringForward(overlayRect);
                                
                                // 如果有Overlay Layer，确保它在最上层
                                const overlayLayerObject = productCanvas.getObjects().find(obj => obj.name === 'Overlay Layer');
                                if (overlayLayerObject) {
                                    productCanvas.bringToFront(overlayLayerObject);
                                }
                                
                                productCanvas.renderAll();
                                
                                console.log(`产品页面已应用渐变色: ${color1} 到 ${color2}, 方向: ${direction}`);
                            } else {
                                console.warn('无法获取Base图层的图像元素');
                            }
                        } else {
                            console.warn('在产品画布中未找到Base图层');
                        }
                    } else {
                        console.warn('无法获取产品画布实例');
                    }
                } else {
                    console.warn('useCanvasStore 和 ProductImageCanvas 都不可用');
                }
            }
            
            applyGradientToBaseLayer();
            
            // 更新颜色状态显示
            const colorStatusDisplay = document.getElementById('colorStatusDisplay');
            if (colorStatusDisplay) {
                colorStatusDisplay.textContent = `渐变色: ${color1}`;
            }
            
            // 更新颜色样本中的选中状态
            const colorSwatches = document.querySelectorAll('.color-swatch');
            colorSwatches.forEach(s => s.classList.remove('selected'));
            window.hideGradientModal();
        });
    }
});
</script>