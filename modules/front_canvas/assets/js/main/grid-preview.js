function pwcaGetUiStateAccess() {
    return window.pwcaUiStateAccess || null;
}

function pwcaGetGridCanvasByViewId(viewId) {
    const uiStateAccess = pwcaGetUiStateAccess();
    if (uiStateAccess && typeof uiStateAccess.getCanvasByViewId === 'function') {
        return uiStateAccess.getCanvasByViewId(viewId);
    }

    return null;
}

function pwcaGetGridActiveCanvas() {
    const uiStateAccess = pwcaGetUiStateAccess();
    if (uiStateAccess && typeof uiStateAccess.getActiveCanvas === 'function') {
        return uiStateAccess.getActiveCanvas();
    }

    return null;
}

function pwcaGetViewLayers(view) {
    if (Array.isArray(view?.layers) && view.layers.length > 0) {
        return view.layers;
    }

    const configuredLayers = view?.data?.layer_config?.layers;
    return Array.isArray(configuredLayers) ? configuredLayers : [];
}

function pwcaGetViewLayerByName(view, layerName) {
    return pwcaGetViewLayers(view).find((layer) => layer?.name === layerName) || null;
}

function pwcaGetLayerSize(layer, fallback = { width: 400, height: 400 }) {
    const layerSize = layer?.layer_data?.dimensions?.layerSize || {};
    const width = Number(layerSize.width || fallback.width || 0);
    const height = Number(layerSize.height || fallback.height || 0);

    return {
        width: Number.isFinite(width) && width > 0 ? width : Number(fallback.width || 0),
        height: Number.isFinite(height) && height > 0 ? height : Number(fallback.height || 0)
    };
}

function pwcaGetCanvasSizeFromConfig(view, config, fallback = { width: 400, height: 400 }) {
    const sizeReferenceName = config?.sizeReferenceLayer;
    const sizeReferenceLayer = sizeReferenceName ? pwcaGetViewLayerByName(view, sizeReferenceName) : null;
    return pwcaGetLayerSize(sizeReferenceLayer, fallback);
}

function pwcaGetLayerPlacement(layer, canvasHeight, renderSize) {
    const position = layer?.layer_data?.position || {};
    const coordinates = position.coordinates || {};
    const x = Number(coordinates.x || 0);
    const y = Number(coordinates.y || 0);
    const anchorPoint = String(position.anchorPoint || 'bottom-left').trim();

    if (anchorPoint === 'top-left') {
        return {
            x,
            y
        };
    }

    return {
        x,
        y: canvasHeight - y - renderSize.height
    };
}

function pwcaCreateImageErrorDataUrl(label) {
    return 'data:image/svg+xml;base64,' + btoa(
        `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">${label}</text></svg>`
    );
}

function pwcaLoadImage(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = imageUrl;
    });
}

async function pwcaBuildTintedImageCanvas(imageUrl, width, height, color) {
    const sourceImage = await pwcaLoadImage(imageUrl);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;

    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(sourceImage, 0, 0, width, height);
    tempCtx.globalCompositeOperation = 'source-in';
    tempCtx.fillStyle = color;
    tempCtx.fillRect(0, 0, width, height);
    tempCtx.globalCompositeOperation = 'source-over';

    return tempCanvas;
}

async function pwcaDrawLayerByConfig(ctx, view, layerConfig, canvasWidth, canvasHeight) {
    const layerName = typeof layerConfig === 'string' ? layerConfig : layerConfig?.name;
    const layer = pwcaGetViewLayerByName(view, layerName);
    const imageUrl = layer?.layer_data?.content?.imageURL;

    if (!layer || !imageUrl) {
        return;
    }

    const renderSize = pwcaGetLayerSize(layer, {
        width: canvasWidth,
        height: canvasHeight
    });
    const placement = pwcaGetLayerPlacement(layer, canvasHeight, renderSize);
    const applySelectedColor = !!layerConfig?.applySelectedColor;
    const selectedColor = typeof window.pwcaGetExplicitSelectedColor === 'function'
        ? window.pwcaGetExplicitSelectedColor()
        : null;

    if (applySelectedColor && selectedColor) {
        const tintedCanvas = await pwcaBuildTintedImageCanvas(
            imageUrl,
            renderSize.width,
            renderSize.height,
            selectedColor
        );
        ctx.drawImage(tintedCanvas, placement.x, placement.y, renderSize.width, renderSize.height);
        return;
    }

    const img = await pwcaLoadImage(imageUrl);
    ctx.drawImage(img, placement.x, placement.y, renderSize.width, renderSize.height);
}

async function pwcaDrawActiveCanvasFull(ctx, activeCanvas, canvasWidth, canvasHeight) {
    if (!activeCanvas) {
        return;
    }

    const canvasDataUrl = activeCanvas.toDataURL('image/png');
    const image = await pwcaLoadImage(canvasDataUrl);
    ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);
}

async function pwcaResizeImageDataUrl(imageDataUrl, canvasWidth, canvasHeight) {
    const image = await pwcaLoadImage(imageDataUrl);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasWidth;
    tempCanvas.height = canvasHeight;

    const ctx = tempCanvas.getContext('2d');
    ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);

    return tempCanvas.toDataURL('image/png');
}

async function pwcaGenerateLayerCompositePreview(view, config, activeCanvas) {
    const canvasSize = pwcaGetCanvasSizeFromConfig(view, config);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasSize.width;
    tempCanvas.height = canvasSize.height;

    const ctx = tempCanvas.getContext('2d');
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    const beforeCanvasLayers = Array.isArray(config?.beforeCanvasLayers) ? config.beforeCanvasLayers : [];
    const afterCanvasLayers = Array.isArray(config?.afterCanvasLayers) ? config.afterCanvasLayers : [];

    for (const layerConfig of beforeCanvasLayers) {
        await pwcaDrawLayerByConfig(ctx, view, layerConfig, canvasSize.width, canvasSize.height);
    }

    if (config?.canvasSource?.mode === 'full') {
        await pwcaDrawActiveCanvasFull(ctx, activeCanvas, canvasSize.width, canvasSize.height);
    }

    for (const layerConfig of afterCanvasLayers) {
        await pwcaDrawLayerByConfig(ctx, view, layerConfig, canvasSize.width, canvasSize.height);
    }

    return tempCanvas.toDataURL('image/png');
}

async function pwcaGenerateGridMockupPreview(view, config, activeCanvas) {
    const canvasSize = pwcaGetCanvasSizeFromConfig(view, config);
    const backgroundLayer = pwcaGetViewLayerByName(view, config?.backgroundLayerName || 'Background Layer');
    const baseLayer = pwcaGetViewLayerByName(view, config?.baseLayerName || 'Base Layer');
    const overlayLayer = pwcaGetViewLayerByName(view, config?.overlayLayerName || 'Overlay Layer');
    const mappingLayer = pwcaGetViewLayerByName(view, config?.mappingLayerName || 'Mapping Layer');

    return pwcaGenerateCompositeImageForGrid({
        canvasWidth: canvasSize.width,
        canvasHeight: canvasSize.height,
        backgroundLayer,
        baseLayer,
        overlayLayer,
        mappingLayer,
        activeCanvas,
        cropConfig: config?.cropConfig || { x: 0.25, y: 0, width: 0.5, height: 1 }
    });
}

async function pwcaGenerateConfiguredPreviewImage(view, config, activeCanvas) {
    if (config?.mode === 'capturedView') {
        const capturedImage = await pwcaCaptureViewImage(view);
        const canvasSize = pwcaGetCanvasSizeFromConfig(view, config);
        return pwcaResizeImageDataUrl(capturedImage, canvasSize.width, canvasSize.height);
    }

    if (config?.mode === 'layerComposite') {
        return pwcaGenerateLayerCompositePreview(view, config, activeCanvas);
    }

    if (config?.mode === 'gridMockup') {
        return pwcaGenerateGridMockupPreview(view, config, activeCanvas);
    }

    return pwcaCaptureViewImage(view);
}

function pwcaUpdateBoundaryFromLayerDrawable(drawable, placement, renderSize, imageUrl) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = renderSize.width;
    tempCanvas.height = renderSize.height;

    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.clearRect(0, 0, renderSize.width, renderSize.height);
    tempCtx.drawImage(drawable, 0, 0, renderSize.width, renderSize.height);

    const imageData = tempCtx.getImageData(0, 0, renderSize.width, renderSize.height);
    const data = imageData.data;

    let minX = renderSize.width;
    let maxX = -1;
    let minY = renderSize.height;
    let maxY = -1;

    for (let y = 0; y < renderSize.height; y++) {
        for (let x = 0; x < renderSize.width; x++) {
            const alpha = data[(y * renderSize.width + x) * 4 + 3];
            if (alpha > 10) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        }
    }

    const hasOpaquePixels = maxX >= minX && maxY >= minY;
    const boundary = {
        x: placement.x + (hasOpaquePixels ? minX : 0),
        y: placement.y + (hasOpaquePixels ? minY : 0),
        width: hasOpaquePixels ? (maxX - minX) : renderSize.width,
        height: hasOpaquePixels ? (maxY - minY) : renderSize.height,
        originalX: placement.x,
        originalY: placement.y,
        originalWidth: renderSize.width,
        originalHeight: renderSize.height,
        imageUrl
    };

    window.pwcaCupBoundary = boundary;
    if (window.pwcaBaseCupBoundaryImageUrl && window.pwcaBaseCupBoundaryImageUrl === imageUrl) {
        window.pwcaBaseCupBoundary = Object.assign({}, boundary);
    }
}

async function pwcaDrawLayerForGridComposite(ctx, layer, canvasWidth, canvasHeight, options = {}) {
    const imageUrl = layer?.layer_data?.content?.imageURL;
    if (!layer || !imageUrl) {
        return null;
    }

    const renderSize = pwcaGetLayerSize(layer, {
        width: canvasWidth,
        height: canvasHeight
    });
    const placement = pwcaGetLayerPlacement(layer, canvasHeight, renderSize);
    const drawable = options.tintColor
        ? await pwcaBuildTintedImageCanvas(imageUrl, renderSize.width, renderSize.height, options.tintColor)
        : await pwcaLoadImage(imageUrl);

    ctx.drawImage(drawable, placement.x, placement.y, renderSize.width, renderSize.height);

    if (options.captureBoundary) {
        pwcaUpdateBoundaryFromLayerDrawable(drawable, placement, renderSize, imageUrl);
    }

    return {
        imageUrl,
        renderSize,
        placement
    };
}

async function pwcaGenerateUniversalViewImages(views) {
    const images = [];

    for (const view of views) {
        try {
            const flowPreviewConfigs = typeof window.pwcaGetFlowPreviewImageConfigs === 'function'
                ? window.pwcaGetFlowPreviewImageConfigs(view)
                : [];

            if (Array.isArray(flowPreviewConfigs) && flowPreviewConfigs.length > 0) {
                images.push(await pwcaGenerate4GridImagesForView(view, { configs: flowPreviewConfigs }));
            } else {
                images.push(await pwcaCaptureViewImage(view));
            }
        } catch (error) {
            images.push(pwcaCreateImageErrorDataUrl('Screenshot failed'));
        }
    }

    return images;
}

async function pwcaGenerate4GridImagesForView(view, options = {}) {
    if (!view) {
        const fallbackImage = pwcaCreateImageErrorDataUrl('Failed to get view');
        return options.onlyFirst ? fallbackImage : [fallbackImage];
    }

    const configuredPreviews = Array.isArray(options.configs) && options.configs.length > 0
        ? options.configs
        : (typeof window.pwcaGetFlowPreviewImageConfigs === 'function'
            ? window.pwcaGetFlowPreviewImageConfigs(view)
            : []);

    const enabledPreviews = configuredPreviews.filter(function (c) { return c.enabled !== false; });

    if (!Array.isArray(enabledPreviews) || enabledPreviews.length === 0) {
        const capturedImage = await pwcaCaptureViewImage(view);
        return options.onlyFirst ? capturedImage : [capturedImage];
    }

    let activeCanvas = null;
    if (view.id) {
        activeCanvas = pwcaGetGridCanvasByViewId(view.id);
    }
    if (!activeCanvas) {
        activeCanvas = pwcaGetGridActiveCanvas();
    }

    const previewConfigs = options.onlyFirst ? [enabledPreviews[0]] : enabledPreviews;
    const images = [];

    for (const previewConfig of previewConfigs) {
        try {
            const imageData = await pwcaGenerateConfiguredPreviewImage(view, previewConfig, activeCanvas);
            images.push(imageData);
        } catch (error) {
            images.push(
                pwcaCreateImageErrorDataUrl(
                    `${previewConfig?.label || previewConfig?.key || 'Preview'} generation failed`
                )
            );
        }
    }

    return options.onlyFirst ? images[0] : images;
}

async function pwcaGenerateCompositeImageForGrid(options) {
    const { canvasWidth, canvasHeight, backgroundLayer, baseLayer, overlayLayer, mappingLayer, activeCanvas, cropConfig } = options;
    const tempCanvas = document.createElement('canvas'); tempCanvas.width = canvasWidth; tempCanvas.height = canvasHeight; const ctx = tempCanvas.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    try {
        window.pwcaCupBoundary = null;
        window.pwcaBaseCupBoundary = null;
        window.pwcaBaseCupBoundaryImageUrl = baseLayer?.layer_data?.content?.imageURL || null;

        if (backgroundLayer?.layer_data?.content?.imageURL) {
            await pwcaDrawLayerForGridComposite(ctx, backgroundLayer, canvasWidth, canvasHeight);
        }
        if (baseLayer && baseLayer.layer_data && baseLayer.layer_data.content && baseLayer.layer_data.content.imageURL) {
            const explicitColor = typeof window.pwcaGetExplicitSelectedColor === 'function' ? window.pwcaGetExplicitSelectedColor() : null;
            await pwcaDrawLayerForGridComposite(ctx, baseLayer, canvasWidth, canvasHeight, {
                tintColor: explicitColor,
                captureBoundary: true
            });
        }
        if (overlayLayer?.layer_data?.content?.imageURL) {
            await pwcaDrawLayerForGridComposite(ctx, overlayLayer, canvasWidth, canvasHeight);
        }
        let imageAnalysisData = null;
        if (baseLayer && baseLayer.layer_data && baseLayer.layer_data.content && baseLayer.layer_data.content.imageURL && typeof window.pwcaAnalyzeImageInfo === 'function') { imageAnalysisData = await window.pwcaAnalyzeImageInfo(baseLayer.layer_data.content.imageURL); }
        if (activeCanvas) {
            await pwcaDrawCroppedCanvasRegionWithWindowEffect(
                ctx,
                activeCanvas,
                cropConfig,
                canvasWidth,
                canvasHeight,
                imageAnalysisData,
                baseLayer
            );
        }
        return tempCanvas.toDataURL('image/png');
    } catch (error) { throw error; }
}

async function pwcaDrawLayerImageForGrid(ctx, imageUrl, width, height) {
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
            window.pwcaCupBoundary = { x: x + minX, y: y + minY, width: maxX - minX, height: maxY - minY, originalX: x, originalY: y, originalWidth: targetWidth, originalHeight: targetHeight, imageUrl: imageUrl };
            if (window.pwcaBaseCupBoundaryImageUrl && window.pwcaBaseCupBoundaryImageUrl === imageUrl) { window.pwcaBaseCupBoundary = Object.assign({}, window.pwcaCupBoundary); }
            ctx.drawImage(img, x, y, targetWidth, targetHeight);
            resolve();
        };
        img.onerror = reject; img.src = imageUrl;
    });
}

async function pwcaDrawLayerImageForGridWithColor(ctx, imageUrl, width, height, color) {
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
            window.pwcaCupBoundary = { x: x + minX, y: y + minY, width: maxX - minX, height: maxY - minY, originalX: x, originalY: y, originalWidth: targetWidth, originalHeight: targetHeight, imageUrl: imageUrl };
            if (window.pwcaBaseCupBoundaryImageUrl && window.pwcaBaseCupBoundaryImageUrl === imageUrl) { window.pwcaBaseCupBoundary = Object.assign({}, window.pwcaCupBoundary); }
            ctx.drawImage(tempCanvas, x, y);
            resolve();
        };
        img.onerror = reject; img.src = imageUrl;
    });
}

async function pwcaDrawCroppedCanvasRegionWithWindowEffect(ctx, sourceCanvas, cropConfig, targetWidth, targetHeight, imageAnalysisData, maskLayer = null) {
    return new Promise((resolve) => {
        const sourceDataURL = sourceCanvas.toDataURL('image/png');
        const img = new Image();
        img.onload = async () => {
            const sourceWidth = img.width; const sourceHeight = img.height;
            const cupBoundary = window.pwcaCupBoundary;
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
                if (maskLayer?.layer_data?.content?.imageURL) {
                    maskCanvas = document.createElement('canvas'); maskCanvas.width = targetWidth; maskCanvas.height = targetHeight; const maskCtx = maskCanvas.getContext('2d');
                    const explicitColor = typeof window.pwcaGetExplicitSelectedColor === 'function' ? window.pwcaGetExplicitSelectedColor() : null;
                    await pwcaDrawLayerForGridComposite(maskCtx, maskLayer, targetWidth, targetHeight, {
                        tintColor: explicitColor
                    });
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

function pwcaDrawCanvasWithinBoundaryForWindow(ctx, sourceCanvas, cupBoundary) {
    const scaleX = cupBoundary.width / sourceCanvas.width; const scaleY = cupBoundary.height / sourceCanvas.height; const scale = Math.max(scaleX, scaleY) * 0.95; const adjustedScale = Math.max(scale, 0.9);
    const scaledWidth = sourceCanvas.width * adjustedScale; const scaledHeight = sourceCanvas.height * adjustedScale;
    const x = cupBoundary.x + (cupBoundary.width - scaledWidth) / 2; const y = cupBoundary.y + (cupBoundary.height - scaledHeight) / 2;
    ctx.drawImage(sourceCanvas, x, y, scaledWidth, scaledHeight);
}

function pwcaDrawCanvasWithinBoundary(ctx, sourceCanvas, targetWidth, targetHeight) {
    const cupBoundary = window.pwcaCupBoundary;
    if (!cupBoundary) {
        const drawHeight = targetHeight * 0.8; const aspectRatio = sourceCanvas.width / sourceCanvas.height; const drawWidth = drawHeight * aspectRatio; const x = (targetWidth - drawWidth) / 2; const y = (targetHeight - drawHeight) / 2; ctx.drawImage(sourceCanvas, x, y, drawWidth, drawHeight); return;
    }
    const scaleX = cupBoundary.width / sourceCanvas.width; const scaleY = cupBoundary.height / sourceCanvas.height; const scale = Math.min(scaleX, scaleY) * 0.9;
    const scaledWidth = sourceCanvas.width * scale; const scaledHeight = sourceCanvas.height * scale;
    const x = cupBoundary.x + (cupBoundary.width - scaledWidth) / 2; const y = cupBoundary.y + (cupBoundary.height - scaledHeight) / 2;
    ctx.drawImage(sourceCanvas, x, y, scaledWidth, scaledHeight);
}

function pwcaCropImageWithConfig(imageDataUrl, cropConfig) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
            const sourceX = img.width * cropConfig.x; const sourceY = img.height * cropConfig.y; const sourceWidth = img.width * cropConfig.width; const sourceHeight = img.height * cropConfig.height;
            canvas.width = sourceWidth; canvas.height = sourceHeight;
            ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = function () { resolve('data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">Image load failed</text></svg>')); };
        img.src = imageDataUrl;
    });
}

async function pwcaCaptureViewImage(view) {
    try {
        const baseCanvasElement = document.getElementById(`baseCanvas-${view.id}`);
        const mainCanvasElement = document.getElementById(`mainCanvas-${view.id}`);
        const overlayCanvasElement = document.getElementById(`overlayCanvas-${view.id}`);
        const maskCanvasElement = document.getElementById(`maskCanvas-${view.id}`);
        if (mainCanvasElement) {
            const fabricCanvas = pwcaGetGridCanvasByViewId(view.id);
            if (fabricCanvas) {
                fabricCanvas.renderAll();
                const imageData = await window.pwcaCaptureMultiLayerCanvasWithMask({ baseCanvas: baseCanvasElement, mainCanvas: mainCanvasElement, overlayCanvas: overlayCanvasElement, maskCanvas: maskCanvasElement, fabricCanvas: fabricCanvas }, view);
                return imageData;
            } else {
                return 'data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">Failed to load view</text></svg>');
            }
        } else {
            return 'data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">View does not exist</text></svg>');
        }
    } catch (error) {
        return 'data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">Screenshot failed</text></svg>');
    }
}

window.pwcaGenerate4GridImagesForView = pwcaGenerate4GridImagesForView;
window.pwcaGenerateCompositeImageForGrid = pwcaGenerateCompositeImageForGrid;
window.pwcaDrawLayerImageForGrid = pwcaDrawLayerImageForGrid;
window.pwcaDrawLayerImageForGridWithColor = pwcaDrawLayerImageForGridWithColor;
window.pwcaDrawCroppedCanvasRegionWithWindowEffect = pwcaDrawCroppedCanvasRegionWithWindowEffect;
window.pwcaDrawCanvasWithinBoundaryForWindow = pwcaDrawCanvasWithinBoundaryForWindow;
window.pwcaDrawCanvasWithinBoundary = pwcaDrawCanvasWithinBoundary;
window.pwcaCropImageWithConfig = pwcaCropImageWithConfig;
window.pwcaCaptureViewImage = pwcaCaptureViewImage;
window.pwcaGenerateUniversalViewImages = pwcaGenerateUniversalViewImages;
