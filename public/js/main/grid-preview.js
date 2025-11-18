async function generateUniversalViewImages(views) {
    const images = [];
    for (const view of views) {
        try {
            if (view.view_flow === '4-Grid Flow') {
                const currentImage = await captureViewImage(view);
                const firstGridImage = await generate4GridImagesForView(view, { onlyFirst: true });
                images.push([currentImage, firstGridImage]);
            } else {
                const imageData = await captureViewImage(view);
                images.push(imageData);
            }
        } catch (error) {
            images.push('data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">截图失败</text></svg>'));
        }
    }
    return images;
}

async function generate4GridImagesForView(view, options = {}) {
    if (!view || !view.layers) {
        if (options.onlyFirst) {
            return 'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">前视图</text></svg>');
        }
        return [
            'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">前视图</text></svg>'),
            'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">左视图</text></svg>'),
            'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">右视图</text></svg>'),
            'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">后视图</text></svg>')
        ];
    }
    const backgroundLayer = view.layers.find(layer => layer.name === 'Background Layer');
    const baseLayer = view.layers.find(layer => layer.name === 'Base Layer');
    const overlayLayer = view.layers.find(layer => layer.name === 'Overlay Layer');
    const mappingLayer = view.layers.find(layer => layer.name === 'Mapping Layer');
    let canvasWidth = 400; let canvasHeight = 400;
    if (backgroundLayer && backgroundLayer.layer_data && backgroundLayer.layer_data.dimensions) {
        const dimensions = backgroundLayer.layer_data.dimensions.layerSize;
        if (dimensions && dimensions.width && dimensions.height) { canvasWidth = dimensions.width; canvasHeight = dimensions.height; }
    }
    let activeCanvas = null;
    if (window.CanvasManager && view.id) activeCanvas = window.CanvasManager.getCanvas(view.id);
    if (!activeCanvas) activeCanvas = typeof window.getActiveCanvas === 'function' ? window.getActiveCanvas() : null;
    if (!activeCanvas) {
        if (options.onlyFirst) return 'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">无法获取画布</text></svg>');
        return [
            'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">无法获取画布</text></svg>'),
            'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">无法获取画布</text></svg>'),
            'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">无法获取画布</text></svg>'),
            'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">无法获取画布</text></svg>')
        ];
    }
    const viewConfigs = [
        { name: 'front', label: '前视图', cropConfig: { x: 0.25, y: 0, width: 0.5, height: 1 } },
        { name: 'left', label: '左视图', cropConfig: { x: 0, y: 0, width: 0.5, height: 1 } },
        { name: 'right', label: '右视图', cropConfig: { x: 0.5, y: 0, width: 0.5, height: 1 } },
        { name: 'back', label: '后视图', cropConfig: { x: 0.75, y: 0, width: 0.25, height: 1, extraCrop: { x: 0, y: 0, width: 0.25, height: 1 } } },
    ];
    const gridImages = [];
    const configs = options.onlyFirst ? [viewConfigs[0]] : viewConfigs;
    for (const config of configs) {
        try {
            const imageData = await generateCompositeImageForGrid({ canvasWidth, canvasHeight, backgroundLayer, baseLayer, overlayLayer, mappingLayer, activeCanvas, cropConfig: config.cropConfig });
            gridImages.push(imageData);
        } catch (error) {
            gridImages.push('data:image/svg+xml;base64,' + btoa(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">${config.label}生成失败</text></svg>`));
        }
    }
    return options.onlyFirst ? gridImages[0] : gridImages;
}

async function generateCompositeImageForGrid(options) {
    const { canvasWidth, canvasHeight, backgroundLayer, baseLayer, overlayLayer, mappingLayer, activeCanvas, cropConfig } = options;
    const tempCanvas = document.createElement('canvas'); tempCanvas.width = canvasWidth; tempCanvas.height = canvasHeight; const ctx = tempCanvas.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    try {
        if (baseLayer && baseLayer.layer_data && baseLayer.layer_data.content && baseLayer.layer_data.content.imageURL) { window.baseCupBoundaryImageUrl = baseLayer.layer_data.content.imageURL; }
        if (backgroundLayer && backgroundLayer.layer_data && backgroundLayer.layer_data.content && backgroundLayer.layer_data.content.imageURL) { await drawLayerImageForGrid(ctx, backgroundLayer.layer_data.content.imageURL, canvasWidth, canvasHeight); }
        if (baseLayer && baseLayer.layer_data && baseLayer.layer_data.content && baseLayer.layer_data.content.imageURL) {
            const explicitColor = typeof window.getExplicitSelectedColor === 'function' ? window.getExplicitSelectedColor() : null;
            if (explicitColor) { await drawLayerImageForGridWithColor(ctx, baseLayer.layer_data.content.imageURL, canvasWidth, canvasHeight, explicitColor); }
            else { await drawLayerImageForGrid(ctx, baseLayer.layer_data.content.imageURL, canvasWidth, canvasHeight); }
        }
        if (overlayLayer && overlayLayer.layer_data && overlayLayer.layer_data.content && overlayLayer.layer_data.content.imageURL) { await drawLayerImageForGrid(ctx, overlayLayer.layer_data.content.imageURL, canvasWidth, canvasHeight); }
        let imageAnalysisData = null;
        if (baseLayer && baseLayer.layer_data && baseLayer.layer_data.content && baseLayer.layer_data.content.imageURL && typeof window.analyzeImageInfo === 'function') { imageAnalysisData = await window.analyzeImageInfo(baseLayer.layer_data.content.imageURL); }
        if (activeCanvas) { await drawCroppedCanvasRegionWithWindowEffect(ctx, activeCanvas, cropConfig, canvasWidth, canvasHeight, imageAnalysisData); }
        return tempCanvas.toDataURL('image/png');
    } catch (error) { throw error; }
}

async function drawLayerImageForGrid(ctx, imageUrl, width, height) {
    return new Promise((resolve, reject) => {
        const img = new Image(); img.crossOrigin = 'anonymous';
        img.onload = () => {
            const targetHeight = height; const aspectRatio = img.width / img.height; const targetWidth = targetHeight * aspectRatio;
            const x = (width - targetWidth) / 2; const y = (height - targetHeight) / 2;
            const tempCanvas = document.createElement('canvas'); tempCanvas.width = targetWidth; tempCanvas.height = targetHeight; const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(img, 0, 0, targetWidth, targetHeight);
            const imageData = tempCtx.getImageData(0, 0, targetWidth, targetHeight); const data = imageData.data;
            let minX = targetWidth, maxX = 0, minY = targetHeight, maxY = 0;
            for (let y2 = 0; y2 < targetHeight; y2++) { for (let x2 = 0; x2 < targetWidth; x2++) { const alpha = data[(y2 * targetWidth + x2) * 4 + 3]; if (alpha > 10) { minX = Math.min(minX, x2); maxX = Math.max(maxX, x2); minY = Math.min(minY, y2); maxY = Math.max(maxY, y2); } } }
            window.cupBoundary = { x: x + minX, y: y + minY, width: maxX - minX, height: maxY - minY, originalX: x, originalY: y, originalWidth: targetWidth, originalHeight: targetHeight, imageUrl: imageUrl };
            if (window.baseCupBoundaryImageUrl && window.baseCupBoundaryImageUrl === imageUrl) { window.baseCupBoundary = Object.assign({}, window.cupBoundary); }
            ctx.drawImage(img, x, y, targetWidth, targetHeight);
            resolve();
        };
        img.onerror = reject; img.src = imageUrl;
    });
}

async function drawLayerImageForGridWithColor(ctx, imageUrl, width, height, color) {
    return new Promise((resolve, reject) => {
        const img = new Image(); img.crossOrigin = 'anonymous';
        img.onload = () => {
            const targetHeight = height * 0.8; const aspectRatio = img.width / img.height; const targetWidth = targetHeight * aspectRatio;
            const x = (width - targetWidth) / 2; const y = (height - targetHeight) / 2;
            const tempCanvas = document.createElement('canvas'); tempCanvas.width = targetWidth; tempCanvas.height = targetHeight; const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(img, 0, 0, targetWidth, targetHeight); tempCtx.globalCompositeOperation = 'source-in'; tempCtx.fillStyle = color; tempCtx.fillRect(0, 0, targetWidth, targetHeight); tempCtx.globalCompositeOperation = 'source-over';
            const imageData = tempCtx.getImageData(0, 0, targetWidth, targetHeight); const data = imageData.data;
            let minX = targetWidth, maxX = 0, minY = targetHeight, maxY = 0;
            for (let y2 = 0; y2 < targetHeight; y2++) { for (let x2 = 0; x2 < targetWidth; x2++) { const alpha = data[(y2 * targetWidth + x2) * 4 + 3]; if (alpha > 10) { minX = Math.min(minX, x2); maxX = Math.max(maxX, x2); minY = Math.min(minY, y2); maxY = Math.max(maxY, y2); } } }
            window.cupBoundary = { x: x + minX, y: y + minY, width: maxX - minX, height: maxY - minY, originalX: x, originalY: y, originalWidth: targetWidth, originalHeight: targetHeight, imageUrl: imageUrl };
            if (window.baseCupBoundaryImageUrl && window.baseCupBoundaryImageUrl === imageUrl) { window.baseCupBoundary = Object.assign({}, window.cupBoundary); }
            ctx.drawImage(tempCanvas, x, y);
            resolve();
        };
        img.onerror = reject; img.src = imageUrl;
    });
}

async function drawCroppedCanvasRegionWithWindowEffect(ctx, sourceCanvas, cropConfig, targetWidth, targetHeight, imageAnalysisData) {
    return new Promise((resolve) => {
        const sourceDataURL = sourceCanvas.toDataURL('image/png');
        const img = new Image();
        img.onload = async () => {
            const sourceWidth = img.width; const sourceHeight = img.height;
            const cupBoundary = window.cupBoundary;
            ctx.save();
            let tempCanvas;
            if (cropConfig.extraCrop) {
                const rightCropWidth = sourceWidth * cropConfig.width; const leftCropWidth = sourceWidth * cropConfig.extraCrop.width; const totalCropWidth = rightCropWidth + leftCropWidth;
                tempCanvas = document.createElement('canvas'); tempCanvas.width = totalCropWidth; tempCanvas.height = sourceHeight; const tempCtx = tempCanvas.getContext('2d');
                const rightCropX = sourceWidth * cropConfig.x; tempCtx.drawImage(img, rightCropX, 0, rightCropWidth, sourceHeight, 0, 0, rightCropWidth, sourceHeight);
                const leftCropX = sourceWidth * cropConfig.extraCrop.x; tempCtx.drawImage(img, leftCropX, 0, leftCropWidth, sourceHeight, rightCropWidth, 0, leftCropWidth, sourceHeight);
            } else {
                const cropX = sourceWidth * cropConfig.x; const cropY = sourceHeight * cropConfig.y; const cropWidth = sourceWidth * cropConfig.width; const cropHeight = sourceHeight * cropConfig.height;
                tempCanvas = document.createElement('canvas'); tempCanvas.width = cropWidth; tempCanvas.height = cropHeight; const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
            }
            let drawX, drawY, drawWidth, drawHeight;
            if (imageAnalysisData) {
                const xishu = targetHeight / imageAnalysisData.imageHeight;
                drawHeight = imageAnalysisData.nonTransparentHeight * xishu;
                drawWidth = tempCanvas.width * (imageAnalysisData.nonTransparentHeight * xishu / tempCanvas.height);
                drawX = (targetWidth - drawWidth) / 2;
                drawY = imageAnalysisData.topMargin * xishu;
            }
            let maskCanvas = null;
            try {
                const baseImageUrl = window.baseCupBoundaryImageUrl;
                if (baseImageUrl) {
                    maskCanvas = document.createElement('canvas'); maskCanvas.width = targetWidth; maskCanvas.height = targetHeight; const maskCtx = maskCanvas.getContext('2d');
                    const explicitColor = typeof window.getExplicitSelectedColor === 'function' ? window.getExplicitSelectedColor() : null;
                    if (explicitColor) { await drawLayerImageForGridWithColor(maskCtx, baseImageUrl, targetWidth, targetHeight, explicitColor); }
                    else { await drawLayerImageForGrid(maskCtx, baseImageUrl, targetWidth, targetHeight); }
                }
            } catch (e) {}
            if (maskCanvas) {
                const maskCtx = maskCanvas.getContext('2d'); const prevOp2 = maskCtx.globalCompositeOperation; maskCtx.globalCompositeOperation = 'source-in'; maskCtx.drawImage(tempCanvas, drawX, drawY, drawWidth, drawHeight); maskCtx.globalCompositeOperation = prevOp2; ctx.drawImage(maskCanvas, 0, 0);
            } else { ctx.drawImage(tempCanvas, drawX, drawY, drawWidth, drawHeight); }
            ctx.restore();
            resolve();
        };
        img.src = sourceDataURL;
    });
}

function drawCanvasWithinBoundaryForWindow(ctx, sourceCanvas, cupBoundary) {
    const scaleX = cupBoundary.width / sourceCanvas.width; const scaleY = cupBoundary.height / sourceCanvas.height; const scale = Math.max(scaleX, scaleY) * 0.95; const adjustedScale = Math.max(scale, 0.9);
    const scaledWidth = sourceCanvas.width * adjustedScale; const scaledHeight = sourceCanvas.height * adjustedScale;
    const x = cupBoundary.x + (cupBoundary.width - scaledWidth) / 2; const y = cupBoundary.y + (cupBoundary.height - scaledHeight) / 2;
    ctx.drawImage(sourceCanvas, x, y, scaledWidth, scaledHeight);
}

function drawCanvasWithinBoundary(ctx, sourceCanvas, targetWidth, targetHeight) {
    const cupBoundary = window.cupBoundary;
    if (!cupBoundary) {
        const drawHeight = targetHeight * 0.8; const aspectRatio = sourceCanvas.width / sourceCanvas.height; const drawWidth = drawHeight * aspectRatio; const x = (targetWidth - drawWidth) / 2; const y = (targetHeight - drawHeight) / 2; ctx.drawImage(sourceCanvas, x, y, drawWidth, drawHeight); return;
    }
    const scaleX = cupBoundary.width / sourceCanvas.width; const scaleY = cupBoundary.height / sourceCanvas.height; const scale = Math.min(scaleX, scaleY) * 0.9;
    const scaledWidth = sourceCanvas.width * scale; const scaledHeight = sourceCanvas.height * scale;
    const x = cupBoundary.x + (cupBoundary.width - scaledWidth) / 2; const y = cupBoundary.y + (cupBoundary.height - scaledHeight) / 2;
    ctx.drawImage(sourceCanvas, x, y, scaledWidth, scaledHeight);
}

function cropImageWithConfig(imageDataUrl, cropConfig) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
            const sourceX = img.width * cropConfig.x; const sourceY = img.height * cropConfig.y; const sourceWidth = img.width * cropConfig.width; const sourceHeight = img.height * cropConfig.height;
            canvas.width = sourceWidth; canvas.height = sourceHeight;
            ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = function () { resolve('data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">图像加载失败</text></svg>')); };
        img.src = imageDataUrl;
    });
}

async function captureViewImage(view) {
    try {
        const baseCanvasElement = document.getElementById(`baseCanvas-${view.id}`);
        const mainCanvasElement = document.getElementById(`mainCanvas-${view.id}`);
        const overlayCanvasElement = document.getElementById(`overlayCanvas-${view.id}`);
        const maskCanvasElement = document.getElementById(`maskCanvas-${view.id}`);
        if (mainCanvasElement && window.CanvasManager) {
            const fabricCanvas = window.CanvasManager.getCanvas(view.id);
            if (fabricCanvas) {
                fabricCanvas.renderAll();
                const imageData = await window.captureMultiLayerCanvasWithMask({ baseCanvas: baseCanvasElement, mainCanvas: mainCanvasElement, overlayCanvas: overlayCanvasElement, maskCanvas: maskCanvasElement, fabricCanvas: fabricCanvas }, view);
                return imageData;
            } else {
                return 'data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">无法加载视图</text></svg>');
            }
        } else {
            return 'data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">视图不存在</text></svg>');
        }
    } catch (error) {
        return 'data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">截图失败</text></svg>');
    }
}

window.generate4GridImagesForView = generate4GridImagesForView;
window.generateCompositeImageForGrid = generateCompositeImageForGrid;
window.drawLayerImageForGrid = drawLayerImageForGrid;
window.drawLayerImageForGridWithColor = drawLayerImageForGridWithColor;
window.drawCroppedCanvasRegionWithWindowEffect = drawCroppedCanvasRegionWithWindowEffect;
window.drawCanvasWithinBoundaryForWindow = drawCanvasWithinBoundaryForWindow;
window.drawCanvasWithinBoundary = drawCanvasWithinBoundary;
window.cropImageWithConfig = cropImageWithConfig;
window.captureViewImage = captureViewImage;
window.generateUniversalViewImages = generateUniversalViewImages;