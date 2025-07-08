// 初始化
function init() {
    const productImageUrl = colorCanvas.getAttribute('data-product-image');
    const colorImageUrl = shadowCanvas.getAttribute('data-color-image');
    if (productImageUrl) {
        const img = new Image();
        img.onload = function () { // 计算图片缩放比例以适应画布
            const scale = Math.min(colorCanvas.width / img.width, colorCanvas.height / img.height);
            const width = img.width * scale;
            const height = img.height * scale;
            // 居中显示图片
            const x = (colorCanvas.width - width) / 2;
            const y = (colorCanvas.height - height) / 2;
            // 清除画布并绘制图片
            colorCtx.clearRect(0, 0, colorCanvas.width, colorCanvas.height);
            colorCtx.drawImage(img, 0, 0, img.width, height);
        };
        img.src = productImageUrl;
    }
    // 加载颜色图片到 shadowLayer
    if (colorImageUrl) {
        const colorImg = new Image();
        colorImg.onload = function () { // 计算图片缩放比例以适应画布
            const scale = Math.min(shadowCanvas.width / colorImg.width, shadowCanvas.height / colorImg.height);
            const width = colorImg.width * scale;
            const height = colorImg.height * scale;
            // 居中显示图片
            const x = (shadowCanvas.width - width) / 2;
            const y = (shadowCanvas.height - height) / 2;
            // 清除画布并绘制图片
            shadowCtx.clearRect(0, 0, shadowCanvas.width, shadowCanvas.height);
            shadowCtx.drawImage(colorImg, 0, y, colorImg.width, height);
        };
        colorImg.src = colorImageUrl;
    }
    // 移除原有的阴影绘制
    // drawTShirtShadows(shadowCtx);
}

// 新增：加载并着色图片的函数
function loadColorImage(imageUrl, color) {
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
const canvasContainer = document.querySelector('.canvas-container');
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
    console.error('缩放滑块或数值显示元素未找到');
}
// 更新画布缩放
function updateCanvasZoom() { 
    if (!canvasContainer) {
        console.error('画布容器未找到');
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
    console.log('画布缩放比例更新为：', scale);
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
