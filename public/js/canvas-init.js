// 初始化
function init() {
    // 检查是否为多视图模式
    const canvasStore = window.Pinia && window.useCanvasStore ? window.useCanvasStore() : null;
    
    if (canvasStore && canvasStore.views && canvasStore.views.length > 0) {
        // 多视图模式：跳过传统初始化，由多视图系统处理
        console.log('Multi-view mode activated, skipping traditional canvas initialization');
        return;
    }
    
    // 兼容模式：尝试获取传统 canvas 元素
    const colorCanvas = document.getElementById('colorLayer');
    const shadowCanvas = document.getElementById('shadowLayer');
    
    if (!colorCanvas || !shadowCanvas) {
        console.warn('Traditional canvas elements not found, may be in multi-view mode');
        return;
    }
    
    const colorCtx = colorCanvas.getContext('2d');
    const shadowCtx = shadowCanvas.getContext('2d');
    
    const productImageUrl = colorCanvas.getAttribute('data-product-image');
    const colorImageUrl = shadowCanvas.getAttribute('data-color-image');
    // 设置高分辨率画布（4倍像素密度）
    const ratio = 4;
    // colorCanvas
    colorCanvas.width = colorCanvas.clientWidth * ratio;
    colorCanvas.height = colorCanvas.clientHeight * ratio;
    colorCanvas.style.width = colorCanvas.clientWidth + 'px';
    colorCanvas.style.height = colorCanvas.clientHeight + 'px';
    colorCtx.setTransform(1, 0, 0, 1, 0, 0);
    colorCtx.imageSmoothingEnabled = true;

    // shadowCanvas
    shadowCanvas.width = shadowCanvas.clientWidth * ratio;
    shadowCanvas.height = shadowCanvas.clientHeight * ratio;
    shadowCanvas.style.width = shadowCanvas.clientWidth + 'px';
    shadowCanvas.style.height = shadowCanvas.clientHeight + 'px';
    shadowCtx.setTransform(1, 0, 0, 1, 0, 0);
    shadowCtx.imageSmoothingEnabled = true;

    // 如果存在产品图片URL，则加载并绘制到 colorCanvas
    if (productImageUrl) {
        const img = new Image();
        img.onload = function () {
            // 计算缩放比例，使图片宽度撑满画布宽度，高度等比缩放
            const scale = colorCanvas.width / img.width;
            let drawW = colorCanvas.width; // 绘制宽度为画布宽度
            let drawH = colorCanvas.height; // 绘制高度等比缩放           
            // 清空画布
            colorCtx.clearRect(0, 0, colorCanvas.width, colorCanvas.height);
            // 绘制图片到画布
            // 参数说明：
            // img: 要绘制的图片对象
            // 0, 0: 源图片的起始坐标（左上角）
            // img.width, img.height: 源图片的宽度和高度（全部绘制）
            // x, y: 目标画布上的起始坐标（左上角，已计算居中）
            // drawW, drawH: 绘制到画布上的宽度和高度（已按比例缩放）
            colorCtx.drawImage(img, 0, 0, img.width, img.height, 0, 0, drawW, drawH);
        };
        // 设置图片源地址，开始加载
        img.src = productImageUrl;
    }
    // 加载颜色图片到 shadowLayer
    if (colorImageUrl) {
        const colorImg = new Image();
        colorImg.onload = function () {
            // 让图片宽度撑满画布宽度，高度等比缩放，不超出画布
            const scale = shadowCanvas.width / colorImg.width;
            let drawW = shadowCanvas.width;
            let drawH = shadowCanvas.height;
           
            shadowCtx.clearRect(0, 0, shadowCanvas.width, shadowCanvas.height);
            shadowCtx.drawImage(colorImg, 0, 0, colorImg.width, colorImg.height, 0, 0, drawW, drawH);
        };
        colorImg.src = colorImageUrl;
    }
    // 移除原有的阴影绘制
    // drawTShirtShadows(shadowCtx);
}

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
// 更新画布缩放
function updateCanvasZoom() { 
    if (!canvasContainer) {
        console.error('Canvas container not found');
        return;
    }
    // 获取所有画布元素
    const canvasElements = canvasContainer.querySelectorAll('canvas');
    // 计算缩放比例
    const scale = currentZoom / 100;
    // 应用缩放到所有画布元素
    canvasElements.forEach(canvasElem => {
        canvasElem.style.transform = `scale(${scale})`;
        canvasElem.style.transformOrigin = 'center center';
    });
    // 调整容器高度以适应缩放后的画布
    // 注意：这里假设原始高度为600px，如在HTML中设置的
    canvasContainer.style.height = (600 * scale) + 'px';
    console.log('Canvas zoom ratio updated to:', scale);
}



// 获取所有 .viewer-switch-btn 按钮
const switchButtons = document.querySelectorAll('.viewer-switch-btn');

// 遍历每个按钮并为其添加点击事件监听器
switchButtons.forEach(function(button) {
    button.addEventListener('click', function() {
        // 获取被点击对象的 data-image-url
        const newImageUrl = this.getAttribute('data-image-url');
        // 检查是否有新的图片URL
        if (newImageUrl) {
            // 更新 shadowLayer 图层 的 data-color-image 属性
            shadowCanvas.setAttribute('data-color-image', newImageUrl);
            // 加载新的颜色图片
            loadColorImage(newImageUrl, currentColor);
        }
    });
});





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
