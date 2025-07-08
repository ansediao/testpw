// 修改捕获画布内容的函数
function captureCanvas(includeBoundary = false) {
    // 创建一个临时画布来合成所有图层
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = colorCanvas.width;
    tempCanvas.height = colorCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    // 首先绘制白色背景
    tempCtx.fillStyle = '#FFFFFF';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    // 1. 首先绘制阴影层（颜色图片）
    if (shadowCanvas) {
        tempCtx.drawImage(shadowCanvas, 0, 0);
    }
    // 2. 然后绘制颜色层（产品图片）
    if (colorCanvas) {
        tempCtx.drawImage(colorCanvas, 0, 0);
    }
    // 3. 最后绘制主画布内容（用户添加的文字和图片）
    // 强制fabric.js画布渲染，确保获取到最新的内容
    canvas.renderAll();
    // 获取fabric.js画布的数据URL，这样可以保持对象的精确位置和大小
    const fabricImage = new Image();
    fabricImage.src = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1,
        left: 0,
        top: 0,
        width: canvas.width,
        height: canvas.height
    });
    // 等待图片加载完成后再绘制
    return new Promise((resolve) => {
        fabricImage.onload = function () {
            tempCtx.drawImage(fabricImage, 0, 0);
            // 在最上层绘制纯白色的边界区域
            tempCtx.fillStyle = '#FFFFFF';
            // 上边框
            tempCtx.fillRect(0, 0, tempCanvas.width, BOUNDARY_MARGIN);
            // 下边框
            tempCtx.fillRect(0, tempCanvas.height - BOUNDARY_MARGIN, tempCanvas.width, BOUNDARY_MARGIN);
            // 左边框
            tempCtx.fillRect(0, BOUNDARY_MARGIN, BOUNDARY_MARGIN, tempCanvas.height - 2 * BOUNDARY_MARGIN);
            // 右边框
            tempCtx.fillRect(tempCanvas.width - BOUNDARY_MARGIN, BOUNDARY_MARGIN, BOUNDARY_MARGIN, tempCanvas.height - 2 * BOUNDARY_MARGIN);
            // 如果是PDF导出且需要包含边界标记
            if (includeBoundary) {
                // 设置虚线样式
                tempCtx.setLineDash([5, 5]);
                tempCtx.lineWidth = 2;
                tempCtx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
                // 绘制外边框虚线（整个画布边界）
                tempCtx.strokeRect(0, 0, tempCanvas.width, tempCanvas.height);
                // 绘制内边框虚线（安全区域 - BOUNDARY_MARGIN内的区域）
                tempCtx.strokeRect(
                    BOUNDARY_MARGIN,
                    BOUNDARY_MARGIN,
                    tempCanvas.width - (BOUNDARY_MARGIN * 2),
                    tempCanvas.height - (BOUNDARY_MARGIN * 2)
                );
                // 添加边界说明
                // tempCtx.font = '12px Arial';
                // tempCtx.fillStyle = 'rgba(255, 0, 0, 0.7)';
                // tempCtx.fillText('--- 边界线 (不会出现在最终产品上)', 10, tempCanvas.height - 10);
            }
            // 返回处理后的画布
            resolve(tempCanvas.toDataURL('image/png'));
        };
    });
}


// 将 id =preview-canvas-container 包含的画布内容导出
// 导出预览画布内容
function capturePreviewCanvas(includeBoundary = false) {
    const previewContainer = document.querySelector('.preview-canvas-container');
    if (!previewContainer) return Promise.resolve(null);

    const bgLayer = previewContainer.querySelector('#bgLayer');
    const shadowLayer = previewContainer.querySelector('#shadowLayer');
    const previewCanvas = previewContainer.querySelector('#previewCanvas');
    const designPreviewCanvas = previewContainer.querySelector('#designPreviewCanvas');

    // 创建临时画布进行合成
    const tempCanvas = document.createElement('canvas');
    let bgImage = null;

    // 如果存在背景图层，获取背景图片
    if (bgLayer && bgLayer.dataset.bgImage) {
        bgImage = new Image();
        bgImage.src = bgLayer.dataset.bgImage;
        
        return new Promise((resolve) => {
            bgImage.onload = () => {
                // 使用背景图片的尺寸
                tempCanvas.width = bgImage.width;
                tempCanvas.height = bgImage.height;
                const tempCtx = tempCanvas.getContext('2d');

                // 绘制白色背景
                tempCtx.fillStyle = '#FFFFFF';
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

                // 绘制背景图
                tempCtx.drawImage(bgImage, 0, 0);

                // 计算缩放比例（基于高度80%）
                const scale = (bgImage.height * 0.8) / previewCanvas.height;
                const scaledWidth = previewCanvas.width * scale;
                const scaledHeight = previewCanvas.height * scale;

                // 计算居中位置
                const offsetX = (bgImage.width - scaledWidth) / 2;
                const offsetY = (bgImage.height - scaledHeight) / 2;

                // 按顺序绘制各个图层，使用缩放后的尺寸居中放置
                if (shadowLayer) {
                    tempCtx.drawImage(shadowLayer, offsetX, offsetY, scaledWidth, scaledHeight);
                }
                if (previewCanvas) {
                    tempCtx.drawImage(previewCanvas, offsetX, offsetY, scaledWidth, scaledHeight);
                }
                if (designPreviewCanvas) {
                    tempCtx.drawImage(designPreviewCanvas, offsetX, offsetY, scaledWidth, scaledHeight);
                }

                resolve(tempCanvas.toDataURL('image/png'));
            };
            bgImage.onerror = () => {
                // 如果背景图加载失败，使用原始逻辑
                handleNoBgImage();
            };
        });
    }

    // 如果没有背景图，使用原始逻辑
    function handleNoBgImage() {
        tempCanvas.width = previewCanvas.width;
        tempCanvas.height = previewCanvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        tempCtx.fillStyle = '#FFFFFF';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        if (shadowLayer) tempCtx.drawImage(shadowLayer, 0, 0);
        if (previewCanvas) tempCtx.drawImage(previewCanvas, 0, 0);
        if (designPreviewCanvas) tempCtx.drawImage(designPreviewCanvas, 0, 0);

        return tempCanvas.toDataURL('image/png');
    }

    return Promise.resolve(handleNoBgImage());
}

