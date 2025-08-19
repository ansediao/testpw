// Canvas 初始化脚本 - 使用新的 CanvasManager
(function() {
    'use strict';

    // 初始化函数
    function init() {
        // 检查 CanvasManager 是否已加载
        if (typeof window.CanvasManager === 'undefined') {
            console.log('CanvasManager not loaded, waiting...');
            return;
        }

        // 检查是否为多视图模式
        const canvasStore = window.Pinia && window.useCanvasStore ? window.useCanvasStore() : null;
        const hasMultiViewContainer = document.querySelector('.multi-view-container') !== null;
        
        if ((canvasStore && canvasStore.views && canvasStore.views.length > 0) || hasMultiViewContainer) {
            // 多视图模式：使用 CanvasManager 管理多个视图
            console.log('Multi-view mode activated, using CanvasManager');
            initializeMultiViewCanvases(canvasStore);
            return;
        }
        
        // 兼容模式：使用 CanvasManager 管理传统 canvas
        initializeTraditionalCanvases();
    }

    /**
     * 初始化多视图 Canvas
     * @param {Object} canvasStore - Pinia store 实例
     */
    function initializeMultiViewCanvases(canvasStore) {
        if (!canvasStore || !canvasStore.views) return;

        canvasStore.views.forEach(view => {
            const canvasId = `mainCanvas-${view.id}`;
            const canvasElement = document.getElementById(canvasId);
            
            if (canvasElement) {
                // 使用 CanvasManager 创建 Canvas 实例
                const canvas = window.CanvasManager.createCanvas(canvasId, view.id, {
                    width: canvasElement.clientWidth || 800,
                    height: canvasElement.clientHeight || 600,
                    backgroundColor: 'transparent'
                });

                // 设置当前激活的 Canvas
                if (view.id === canvasStore.activeViewId) {
                    window.CanvasManager.setActiveCanvas(view.id);
                }
            }
        });
    }

    /**
     * 初始化传统 Canvas（兼容模式）
     */
    function initializeTraditionalCanvases() {
        const colorCanvas = document.getElementById('colorLayer');
        const shadowCanvas = document.getElementById('shadowLayer');
        
        if (!colorCanvas || !shadowCanvas) {
            console.log('Traditional canvas elements not found');
            return;
        }

        // 使用 CanvasManager 创建传统 Canvas 实例
        const colorCanvasInstance = window.CanvasManager.createCanvas('colorLayer', 'traditional-color', {
            width: colorCanvas.clientWidth * 4,
            height: colorCanvas.clientHeight * 4,
            backgroundColor: 'transparent'
        });

        const shadowCanvasInstance = window.CanvasManager.createCanvas('shadowLayer', 'traditional-shadow', {
            width: shadowCanvas.clientWidth * 4,
            height: shadowCanvas.clientHeight * 4,
            backgroundColor: 'transparent'
        });

        if (!colorCanvasInstance || !shadowCanvasInstance) {
            console.error('Failed to create traditional canvas instances');
            return;
        }

        // 设置 Canvas 样式
        setupCanvasStyles(colorCanvas, colorCanvasInstance);
        setupCanvasStyles(shadowCanvas, shadowCanvasInstance);

        // 加载图片
        loadTraditionalImages(colorCanvasInstance, shadowCanvasInstance);
    }

    /**
     * 设置 Canvas 样式
     * @param {HTMLCanvasElement} element - DOM Canvas 元素
     * @param {fabric.Canvas} canvas - Fabric Canvas 实例
     */
    function setupCanvasStyles(element, canvas) {
        const ratio = 4;
        element.style.width = element.clientWidth + 'px';
        element.style.height = element.clientHeight + 'px';
    }

    /**
     * 加载传统模式图片
     * @param {fabric.Canvas} colorCanvasInstance - 颜色 Canvas 实例
     * @param {fabric.Canvas} shadowCanvasInstance - 阴影 Canvas 实例
     */
    function loadTraditionalImages(colorCanvasInstance, shadowCanvasInstance) {
        const colorCanvas = document.getElementById('colorLayer');
        const shadowCanvas = document.getElementById('shadowLayer');
        
        const productImageUrl = colorCanvas.getAttribute('data-product-image');
        const colorImageUrl = shadowCanvas.getAttribute('data-color-image');

        // 加载产品图片
        if (productImageUrl) {
            fabric.Image.fromURL(productImageUrl, function(img) {
                img.set({
                    left: colorCanvasInstance.width / 2,
                    top: colorCanvasInstance.height / 2,
                    originX: 'center',
                    originY: 'center',
                    selectable: false,
                    evented: false
                });
                
                const scale = Math.min(
                    colorCanvasInstance.width / img.width,
                    colorCanvasInstance.height / img.height
                );
                img.scale(scale);
                
                colorCanvasInstance.add(img);
                colorCanvasInstance.renderAll();
            });
        }

        // 加载颜色图片
        if (colorImageUrl) {
            fabric.Image.fromURL(colorImageUrl, function(img) {
                img.set({
                    left: shadowCanvasInstance.width / 2,
                    top: shadowCanvasInstance.height / 2,
                    originX: 'center',
                    originY: 'center',
                    selectable: false,
                    evented: false
                });
                
                const scale = Math.min(
                    shadowCanvasInstance.width / img.width,
                    shadowCanvasInstance.height / img.height
                );
                img.scale(scale);
                
                shadowCanvasInstance.add(img);
                shadowCanvasInstance.renderAll();
            });
        }
    }

    // 初始化缩放功能
    function initializeZoom() {
        const zoomSlider = document.getElementById('zoomSlider');
        const zoomValue = document.getElementById('zoomValue');

        if (zoomSlider && zoomValue) {
            let currentZoom = 100;
            
            zoomSlider.addEventListener('input', function() {
                currentZoom = parseInt(this.value);
                zoomValue.textContent = currentZoom + '%';
                updateCanvasZoom(currentZoom / 100);
            });
        }
    }

    /**
     * 更新 Canvas 缩放 - 控制 multi-view-container
     * @param {number} scale - 缩放比例
     */
    function updateCanvasZoom(scale) {
        // 获取 multi-view-container 作为缩放控制对象
        const multiViewContainer = document.getElementById('multi-view-container');
        
        if (multiViewContainer) {
            // 应用缩放到 multi-view-container
            multiViewContainer.style.transform = `scale(${scale})`;
            multiViewContainer.style.transformOrigin = 'top left';
        } else {
            console.warn('multi-view-container not found for zoom control');
        }
    }

    // 监听视图切换事件
    function handleViewSwitch(event) {
        const { viewId } = event.detail;
        
        if (window.CanvasManager) {
            window.CanvasManager.setActiveCanvas(viewId);
        }
    }

    // 事件监听
    document.addEventListener('viewSwitched', handleViewSwitch);
    
    // 监听 DOM 加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 监听 CanvasManager 加载完成
    document.addEventListener('canvasManagerReady', init);
    
    // 暴露 init 函数到全局作用域
    window.initCanvasSystem = init;

})();

// 新增：加载并着色图片的函数
function loadColorImage1(imageUrl, color) {
    // 获取当前激活视图的 shadow canvas
    const canvasStore = window.Pinia && window.useCanvasStore ? window.useCanvasStore() : null;
    let shadowCanvas = null;
    let shadowCtx = null;
    
    if (canvasStore && canvasStore.activeViewId) {
        // 多视图模式：获取当前激活视图的 shadow canvas
        shadowCanvas = document.querySelector(`#view-container-${canvasStore.activeViewId} .shadow-layer`);
    } else {
        // 兼容模式：尝试获取原有的 shadowLayer
        shadowCanvas = document.getElementById('shadowLayer');
    }
    
    if (!shadowCanvas) {
        console.warn('Shadow canvas element not found');
        return;
    }
    
    shadowCtx = shadowCanvas.getContext('2d');
    if (!shadowCtx) {
        console.warn('Cannot get shadow canvas context');
        return;
    }
    
    const colorImg = new Image();
    colorImg.onload = function () {
        const scale = Math.min(shadowCanvas.width / colorImg.width, shadowCanvas.height / colorImg.height);
        const width = colorImg.width * scale;
        const height = colorImg.height * scale;
        const x = (shadowCanvas.width - width) / 2;
        const y = (shadowCanvas.height - height) / 2;
        shadowCtx.clearRect(0, 0, shadowCanvas.width, shadowCanvas.height);
        // 绘制原始图片
        shadowCtx.drawImage(colorImg, x, y, width, height);
        // 应用颜色
        shadowCtx.globalCompositeOperation = 'source-in';
        shadowCtx.fillStyle = color;
        shadowCtx.fillRect(0, 0, shadowCanvas.width, shadowCanvas.height);
        // 重置混合模式
        shadowCtx.globalCompositeOperation = 'source-over';
    };
    colorImg.src = imageUrl;
}

// 画板缩放功能
const zoomSlider = document.getElementById('zoomSlider');
const zoomValue = document.getElementById('zoomValue');
// 获取画布容器，兼容多视图和单视图模式
let canvasContainer = document.querySelector('.multi-view-container') || document.querySelector('.canvas-container');
// 初始化缩放值
let currentZoom = 100;
// 监听滑块变化
if (zoomSlider && zoomValue) {
    zoomSlider.addEventListener('input', function () {
        currentZoom = parseInt(this.value);
        zoomValue.textContent = currentZoom + '%';
        // 更新画布容器的缩放比例
        updateCanvasZoom();
    });
} else {
    console.error('Zoom slider or value display element not found');
}
// 更新画布缩放 - 控制 multi-view-container
function updateCanvasZoom() { 
    // 计算缩放比例
    const scale = currentZoom / 100;
    
    // 获取 multi-view-container 作为缩放控制对象
    const multiViewContainer = document.getElementById('multi-view-container');
    
    if (multiViewContainer) {
        // 应用缩放到 multi-view-container
        multiViewContainer.style.transform = `scale(${scale})`;
        multiViewContainer.style.transformOrigin = 'top left';
        
        console.log('multi-view-container 缩放比例更新为：', scale);
    } else {
        console.warn('multi-view-container not found for zoom control');
    }
}



// 获取所有 .viewer-switch-btn 按钮
// const switchButtons = document.querySelectorAll('.viewer-switch-btn');

// // 遍历每个按钮并为其添加点击事件监听器
// switchButtons.forEach(function(button) {
//     button.addEventListener('click', function() {
//         // 获取被点击对象的 data-image-url
//         const newImageUrl = this.getAttribute('data-image-url');
//         // 检查是否有新的图片URL
//         if (newImageUrl) {
//             // 更新 shadowLayer 图层 的 data-color-image 属性
//             shadowCanvas.setAttribute('data-color-image', newImageUrl);
//             // 加载新的颜色图片
//             loadColorImage(newImageUrl, currentColor);
//         }
//     });
// });





// 修改loadColorImage函数，在加载完成后更新3D模型
function loadColorImage(imageUrl, color) {
    // 获取当前激活视图的 shadow canvas
    const canvasStore = window.Pinia && window.useCanvasStore ? window.useCanvasStore() : null;
    let shadowCanvas = null;
    let shadowCtx = null;
    
    if (canvasStore && canvasStore.activeViewId) {
        // 多视图模式：获取当前激活视图的 shadow canvas
        shadowCanvas = document.querySelector(`#view-container-${canvasStore.activeViewId} .shadow-layer`);
    } else {
        // 兼容模式：尝试获取原有的 shadowLayer
        shadowCanvas = document.getElementById('shadowLayer');
    }
    
    if (!shadowCanvas) {
        console.warn('Shadow canvas element not found');
        return;
    }
    
    shadowCtx = shadowCanvas.getContext('2d');
    if (!shadowCtx) {
        console.warn('Cannot get shadow canvas context');
        return;
    }
    
    const colorImg = new Image();
    colorImg.onload = function () {
        const scale = Math.min(shadowCanvas.width / colorImg.width, shadowCanvas.height / colorImg.height);
        const width = shadowCanvas.width;
        const height = shadowCanvas.height;
        // const x = (shadowCanvas.width - width) / 2;
        // const y = (shadowCanvas.height - height) / 2;
        shadowCtx.clearRect(0, 0, shadowCanvas.width, shadowCanvas.height);
        // 绘制原始图片
        shadowCtx.drawImage(colorImg, 0, 0, width, height);
        // 应用颜色
        shadowCtx.globalCompositeOperation = 'source-in';
        shadowCtx.fillStyle = color;
        shadowCtx.fillRect(0, 0, shadowCanvas.width, shadowCanvas.height);
        // 重置混合模式
        shadowCtx.globalCompositeOperation = 'source-over';
        // 颜色图片更新后，更新3D模型纹理
        setTimeout(() => updateModelFromCanvas(), 100);
    };
    colorImg.src = imageUrl;
}


// 添加颜色选择器事件监听
// colorPicker.addEventListener('input', (e) => {
//     currentColor = e.target.value;
//     const colorImageUrl = shadowCanvas.getAttribute('data-color-image');
//     if (colorImageUrl) {
//         loadColorImage(colorImageUrl, currentColor);
//     }
// });
