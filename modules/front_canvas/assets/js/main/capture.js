function pwcaGetUiStateAccess() {
    return window.pwcaUiStateAccess || null;
}

function pwcaGetCanvasByViewId(viewId) {
    const uiStateAccess = pwcaGetUiStateAccess();
    if (uiStateAccess && typeof uiStateAccess.getCanvasByViewId === 'function') {
        return uiStateAccess.getCanvasByViewId(viewId);
    }

    return null;
}

function pwcaGetPrintMethodStore() {
    const uiStateAccess = pwcaGetUiStateAccess();
    if (uiStateAccess && typeof uiStateAccess.getPrintMethodStore === 'function') {
        return uiStateAccess.getPrintMethodStore();
    }

    return null;
}

async function captureAllViewsImages(views) {
    const images = [];
    for (const view of views) {
        try {
            const baseCanvasElement = document.getElementById(`baseCanvas-${view.id}`);
            const mainCanvasElement = document.getElementById(`mainCanvas-${view.id}`);
            const overlayCanvasElement = document.getElementById(`overlayCanvas-${view.id}`);
            const maskCanvasElement = document.getElementById(`maskCanvas-${view.id}`);
            if (mainCanvasElement) {
                const fabricCanvas = pwcaGetCanvasByViewId(view.id);
                if (fabricCanvas) {
                    fabricCanvas.renderAll();
                    const imageData = await captureMultiLayerCanvasWithMask({ baseCanvas: baseCanvasElement, mainCanvas: mainCanvasElement, overlayCanvas: overlayCanvasElement, maskCanvas: maskCanvasElement, fabricCanvas: fabricCanvas }, view);
                    images.push(imageData);
                } else {
                    images.push('data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">Failed to load view</text></svg>'));
                }
            } else {
                images.push('data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">View does not exist</text></svg>'));
            }
        } catch (error) {
            images.push('data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">Screenshot failed</text></svg>'));
        }
    }
    return images;
}

async function captureViewForPDF(viewId) {
    try {
        const baseCanvas = document.getElementById(`baseCanvas-${viewId}`);
        const mainCanvas = document.getElementById(`mainCanvas-${viewId}`);
        const overlayCanvas = document.getElementById(`overlayCanvas-${viewId}`);
        const maskCanvas = document.getElementById(`maskCanvas-${viewId}`);
        const fabricCanvas = pwcaGetCanvasByViewId(viewId);
        const canvasLayers = { baseCanvas, mainCanvas, overlayCanvas, maskCanvas, fabricCanvas };
        const view = { id: viewId, name: `View ${viewId}` };
        return await captureMultiLayerCanvasWithMask(canvasLayers, view);
    } catch (error) {
        return null;
    }
}

function captureMultiLayerCanvasWithMask(canvasLayers, view) {
    return new Promise((resolve) => {
        try {
            const { baseCanvas, mainCanvas, overlayCanvas, maskCanvas, fabricCanvas } = canvasLayers;
            let printAreaWidth = 100; let printAreaHeight = 120;
            const printMethodStore = pwcaGetPrintMethodStore();
            if (printMethodStore) {
                const currentMethods = printMethodStore.currentViewPrintMethods;
                if (currentMethods && currentMethods.length > 0) {
                    const firstMethod = currentMethods[0];
                    if (firstMethod.print_method_area_width && firstMethod.print_method_area_height) { printAreaWidth = firstMethod.print_method_area_width * 50; printAreaHeight = firstMethod.print_method_area_height * 50; }
                }
            }
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = fabricCanvas.width; finalCanvas.height = fabricCanvas.height;
            const finalCtx = finalCanvas.getContext('2d');
            finalCtx.fillStyle = '#FFFFFF'; finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
            const imagePromises = [];
            const processLayer = (canvasElement, layerName) => {
                return new Promise((layerResolve) => {
                    if (!canvasElement) { layerResolve(null); return; }
                    if (layerName === 'mainCanvas') {
                        try {
                            const dataURL = fabricCanvas.toDataURL({ format: 'png', quality: 1, multiplier: 1 });
                            const img = new Image(); img.onload = () => layerResolve({ img, layerName }); img.onerror = () => layerResolve(null); img.src = dataURL;
                        } catch (e) { layerResolve(null); }
                    } else if (layerName === 'baseCanvas') {
                        try {
                            const dataURL = canvasElement.toDataURL('image/png');
                            const img = new Image();
                            img.onload = () => {
                                const explicitColor = typeof window.getExplicitSelectedColor === 'function' ? window.getExplicitSelectedColor() : null;
                                const fc = canvasElement.__fabricCanvas || canvasElement.fabric || canvasElement.__canvas || null;
                                let hasGradientOverlay = false; let hasTintFilter = false;
                                if (fc && typeof fc.getObjects === 'function') {
                                    const objects = fc.getObjects();
                                    hasGradientOverlay = objects.some(obj => obj && ((obj.name && obj.name === 'Base Gradient Overlay') || (obj.id && typeof obj.id === 'string' && obj.id.startsWith('gradient-rect-'))));
                                    const baseLayerObject = objects.find(obj => obj && obj.name === 'Base Layer');
                                    if (baseLayerObject && Array.isArray(baseLayerObject.filters)) { hasTintFilter = baseLayerObject.filters.some(filter => !!filter); }
                                }
                                const shouldApplyFlatColor = explicitColor && !hasGradientOverlay && !hasTintFilter;
                                if (shouldApplyFlatColor) {
                                    const tempCanvas = document.createElement('canvas'); tempCanvas.width = canvasElement.width; tempCanvas.height = canvasElement.height; const tempCtx = tempCanvas.getContext('2d');
                                    tempCtx.drawImage(img, 0, 0); tempCtx.globalCompositeOperation = 'source-in'; tempCtx.fillStyle = explicitColor; tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height); tempCtx.globalCompositeOperation = 'source-over';
                                    const coloredImg = new Image(); coloredImg.onload = () => layerResolve({ img: coloredImg, layerName }); coloredImg.onerror = () => layerResolve({ img, layerName }); coloredImg.src = tempCanvas.toDataURL('image/png');
                                } else { layerResolve({ img, layerName }); }
                            };
                            img.onerror = () => layerResolve(null);
                            img.src = dataURL;
                        } catch (error) { layerResolve(null); }
                    } else {
                        try { const dataURL = canvasElement.toDataURL('image/png'); const img = new Image(); img.onload = () => layerResolve({ img, layerName }); img.onerror = () => layerResolve(null); img.src = dataURL; } catch (error) { layerResolve(null); }
                    }
                });
            };
            imagePromises.push(processLayer(baseCanvas, 'baseCanvas'));
            imagePromises.push(processLayer(mainCanvas, 'mainCanvas'));
            imagePromises.push(processLayer(overlayCanvas, 'overlayCanvas'));
            imagePromises.push(processLayer(maskCanvas, 'maskCanvas'));
            Promise.all(imagePromises).then((results) => {
                const layers = {}; results.forEach(result => { if (result) { layers[result.layerName] = result.img; } });
                if (layers.baseCanvas) finalCtx.drawImage(layers.baseCanvas, 0, 0);
                if (layers.mainCanvas && layers.maskCanvas) {
                    const tempCanvas = document.createElement('canvas'); tempCanvas.width = finalCanvas.width; tempCanvas.height = finalCanvas.height; const tempCtx = tempCanvas.getContext('2d');
                    try {
                        if (fabricCanvas && typeof fabricCanvas.getObjects === 'function' && fabricCanvas.lowerCanvasEl) {
                            const objs = fabricCanvas.getObjects() || []; const originalVisibility = objs.map(o => o.visible);
                            const assigned = []; const unassigned = [];
                            if (window.PrintAreaValidator && typeof window.PrintAreaValidator.hasPrintMethodAssigned === 'function') {
                                for (const obj of objs) { if (obj && obj.id && window.PrintAreaValidator.hasPrintMethodAssigned(obj)) assigned.push(obj); else unassigned.push(obj); }
                            }
                            for (const obj of assigned) { obj.visible = false; } fabricCanvas.renderAll(); finalCtx.drawImage(fabricCanvas.lowerCanvasEl, 0, 0);
                            objs.forEach((obj, i) => { obj.visible = originalVisibility[i]; }); fabricCanvas.renderAll();
                            for (const obj of unassigned) { obj.visible = false; } fabricCanvas.renderAll(); tempCtx.drawImage(fabricCanvas.lowerCanvasEl, 0, 0);
                            objs.forEach((obj, i) => { obj.visible = originalVisibility[i]; }); fabricCanvas.renderAll();
                        } else { tempCtx.drawImage(layers.mainCanvas, 0, 0); }
                    } catch (e) { tempCtx.drawImage(layers.mainCanvas, 0, 0); }
                    const maskTempCanvas = document.createElement('canvas'); maskTempCanvas.width = tempCanvas.width; maskTempCanvas.height = tempCanvas.height; const maskTempCtx = maskTempCanvas.getContext('2d');
                    maskTempCtx.drawImage(layers.maskCanvas, 0, 0);
                    const maskData = maskTempCtx.getImageData(0, 0, maskTempCanvas.width, maskTempCanvas.height);
                    let hasContent = false; for (let i = 3; i < maskData.data.length; i += 4) { if (maskData.data[i] > 0) { hasContent = true; break; } }
                    if (hasContent) {
                        const binaryMaskCanvas = document.createElement('canvas'); binaryMaskCanvas.width = layers.maskCanvas.width; binaryMaskCanvas.height = layers.maskCanvas.height; const binaryMaskCtx = binaryMaskCanvas.getContext('2d');
                        binaryMaskCtx.drawImage(layers.maskCanvas, 0, 0);
                        const binaryImageData = binaryMaskCtx.getImageData(0, 0, binaryMaskCanvas.width, binaryMaskCanvas.height);
                        for (let i = 3; i < binaryImageData.data.length; i += 4) { if (binaryImageData.data[i] > 0) { binaryImageData.data[i] = 255; } }
                        try {
                            const viewId = view && (view.id || view.view_id) ? (view.id || view.view_id) : null; let bounds = null;
                            if (viewId && window.PrintAreaValidator && typeof window.PrintAreaValidator.getPrintAreaBounds === 'function') { bounds = window.PrintAreaValidator.getPrintAreaBounds(viewId); }
                            if (!bounds) { const w = finalCanvas.width; const h = finalCanvas.height; const left = Math.floor((w - printAreaWidth) / 2); const top = Math.floor((h - printAreaHeight) / 2); bounds = { left, top, right: left + Math.floor(printAreaWidth), bottom: top + Math.floor(printAreaHeight) }; }
                            if (bounds) {
                                const w = binaryMaskCanvas.width; const h = binaryMaskCanvas.height; const left = Math.max(0, Math.floor(bounds.left)); const top = Math.max(0, Math.floor(bounds.top)); const right = Math.min(w, Math.ceil(bounds.right)); const bottom = Math.min(h, Math.ceil(bounds.bottom));
                                for (let y = top; y < bottom; y++) { const rowOffset = y * w * 4; for (let x = left; x < right; x++) { const alphaIdx = rowOffset + x * 4 + 3; binaryImageData.data[alphaIdx] = 0; } }
                            }
                        } catch (e) {}
                        binaryMaskCtx.putImageData(binaryImageData, 0, 0);
                        tempCtx.globalCompositeOperation = 'destination-out'; tempCtx.drawImage(binaryMaskCanvas, 0, 0);
                    }
                    finalCtx.drawImage(tempCanvas, 0, 0);
                } else if (layers.mainCanvas) {
                    finalCtx.drawImage(layers.mainCanvas, 0, 0);
                }
                if (layers.overlayCanvas) finalCtx.drawImage(layers.overlayCanvas, 0, 0);
                resolve(finalCanvas.toDataURL('image/png'));
            }).catch((error) => {
                resolve('data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">Layer composition failed</text></svg>'));
            });
        } catch (error) {
            resolve('data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">Screenshot error</text></svg>'));
        }
    });
}

function captureCanvasById(fabricCanvas) {
    return new Promise((resolve) => {
        try {
            fabricCanvas.renderAll();
            const tempCanvas = document.createElement('canvas'); tempCanvas.width = fabricCanvas.width; tempCanvas.height = fabricCanvas.height; const tempCtx = tempCanvas.getContext('2d');
            tempCtx.fillStyle = '#FFFFFF'; tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            const fabricImage = new Image(); fabricImage.src = fabricCanvas.toDataURL({ format: 'png', quality: 1, multiplier: 1 });
            fabricImage.onload = function () { tempCtx.drawImage(fabricImage, 0, 0); resolve(tempCanvas.toDataURL('image/png')); };
            fabricImage.onerror = function () { resolve('data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">Image load failed</text></svg>')); };
        } catch (error) {
            resolve('data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">Screenshot error</text></svg>'));
        }
    });
}

function closeMultiViewPreview() {
    const modal = document.getElementById('multi-view-preview-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('is-open');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 100);
    }
}

window.captureAllViewsImages = captureAllViewsImages;
window.captureViewForPDF = captureViewForPDF;
window.captureMultiLayerCanvasWithMask = captureMultiLayerCanvasWithMask;
window.captureCanvasById = captureCanvasById;
window.closeMultiViewPreview = closeMultiViewPreview;
