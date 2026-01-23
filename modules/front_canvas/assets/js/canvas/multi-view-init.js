// 多视图画布初始化与多图层渲染逻辑
// 从原 canvas-design_area.php 内联脚本迁移而来

/**
 * 将 API 中的 anchorPoint 字符串转换为 Fabric.js 的 originX 和 originY。
 * @param {string} anchorPoint - 例如 "top-left", "center"。
 * @returns {{originX: string, originY: string}} Fabric.js 的原点对象。
 */
function getOriginFromAnchorPoint(anchorPoint) {
    // 处理单个值的情况（如'center'）
    if (anchorPoint === 'center') {
        return {
            originX: 'center',
            originY: 'center'
        };
    }

    const parts = String(anchorPoint || '').split('-');
    const y = parts[0] || 'center';
    const x = parts[1] || 'center';

    const originMap = {
        top: 'top',
        center: 'center',
        bottom: 'bottom',
        left: 'left',
        right: 'right'
    };

    return {
        originX: originMap[x] || 'center',
        originY: originMap[y] || 'center'
    };
}

/**
 * 根据原点类型转换坐标位置
 * 当originX和originY为center时，需要将基于左上角的坐标转换为基于中心点的坐标
 * @param {number} x - 原始x坐标（基于左上角）
 * @param {number} y - 原始y坐标（基于左上角）
 * @param {number} width - 对象宽度
 * @param {number} height - 对象高度
 * @param {string} originX - Fabric.js的originX值
 * @param {string} originY - Fabric.js的originY值
 * @returns {{x: number, y: number}} 转换后的坐标
 */
function convertCoordinatesForOrigin(x, y, width, height, originX, originY) {
    let convertedX = x;
    let convertedY = y;

    if (originX === 'center') {
        convertedX = x + width / 2;
    } else if (originX === 'right') {
        convertedX = x + width;
    }

    if (originY === 'center') {
        convertedY = y + height / 2;
    } else if (originY === 'bottom') {
        convertedY = y + height;
    }

    return {
        x: convertedX,
        y: convertedY
    };
}

/**
 * 辅助函数，用于从图层数据对象创建一个 Fabric.js 对象。
 * @param {fabric.Canvas} canvas - 目标画布
 * @param {object} layer - 来自 API 的单个图层对象。
 * @returns {Promise<fabric.Object|null>} 一个 Promise，如果图层无法创建，则解析为 fabric 对象或 null。
 */
function createFabricObjectFromLayer(canvas, layer) {
    return new Promise((resolve) => {
        if (!canvas || !layer || !layer.layer_data) {
            resolve(null);
            return;
        }

        const data = layer.layer_data;
        const controls = data.controls || {};
        const position = data.position || {};

        switch (layer.type) {
            case 'image': {
                if (!data.content || !data.content.imageURL) {
                    console.warn(`因缺少 imageURL，正在跳过图片图层 "${layer.name}".`);
                    resolve(null);
                    return;
                }

                fabric.Image.fromURL(
                    data.content.imageURL,
                    (img) => {
                        if (!img) {
                            resolve(null);
                            return;
                        }

                        const canvasWidth = canvas.getWidth();
                        const canvasHeight = canvas.getHeight();
                        const imgWidth = img.width || 1;
                        const imgHeight = img.height || 1;

                        const scale = Math.min(
                            canvasWidth / imgWidth,
                            canvasHeight / imgHeight
                        );

                        const origins = getOriginFromAnchorPoint(position.anchorPoint || 'top-left');

                        const convertedCoords = convertCoordinatesForOrigin(
                            position.coordinates?.x || 0,
                            position.coordinates?.y || 0,
                            data.dimensions?.layerSize?.width || imgWidth,
                            data.dimensions?.layerSize?.height || imgHeight,
                            origins.originX,
                            origins.originY
                        );

                        img.set({
                            left: convertedCoords.x,
                            top: convertedCoords.y,
                            angle: position.rotation || 0,
                            originX: origins.originX,
                            originY: origins.originY,
                            opacity: (data.content.opacity ?? 100) / 100,
                            selectable: !!controls.movable,
                            evented: !!controls.movable,
                            lockRotation: !controls.rotatable,
                            hasControls: !!(controls.movable && controls.scalable),
                            hasBorders: !!controls.movable,
                            name: layer.name
                        });

                        img.scale(scale);

                        if (position.anchorPoint === 'center') {
                            canvas.centerObject(img);
                            canvas.renderAll();
                        }

                        resolve(img);
                    },
                    { crossOrigin: 'anonymous' }
                );
                break;
            }

            case 'text': {
                if (!data.content || !data.content.text) {
                    console.warn(`因缺少文本内容，正在跳过文本图层 "${layer.name}".`);
                    resolve(null);
                    return;
                }

                const origins = getOriginFromAnchorPoint(position.anchorPoint || 'top-left');

                const convertedCoords = convertCoordinatesForOrigin(
                    position.coordinates?.x || 0,
                    position.coordinates?.y || 0,
                    data.dimensions?.layerSize?.width || 0,
                    data.dimensions?.layerSize?.height || 0,
                    origins.originX,
                    origins.originY
                );

                const textObj = new fabric.Text(data.content.text, {
                    left: convertedCoords.x,
                    top: convertedCoords.y,
                    angle: position.rotation || 0,
                    originX: origins.originX,
                    originY: origins.originY,
                    fontFamily: data.content.fontFamily || 'Arial',
                    fill: data.content.fontColor || '#000000',
                    opacity: (data.content.opacity ?? 100) / 100,
                    selectable: !!controls.movable,
                    evented: !!controls.movable,
                    lockRotation: !controls.rotatable,
                    lockScalingX: !controls.scalable,
                    lockScalingY: !controls.scalable,
                    hasControls: !!(controls.movable && controls.scalable),
                    hasBorders: !!controls.movable,
                    name: layer.name
                });

                resolve(textObj);
                break;
            }

            default:
                console.warn(`未知的图层类型: "${layer.type}" (图层名: "${layer.name}").`);
                resolve(null);
                break;
        }
    });
}

/**
 * 应用色调滤镜到图层对象
 * @param {fabric.Object} layerObject - 要应用滤镜的图层对象
 * @param {string} color - 滤镜颜色，默认为红色
 * @param {number} alpha - 透明度，0-1之间，默认为1
 */
function applyTintFilter(layerObject, color = '#ff0000', alpha = 1) {
    if (!layerObject || typeof layerObject.applyFilters !== 'function' || typeof fabric === 'undefined') {
        return;
    }

    try {
        const colorFilter = new fabric.Image.filters.BlendColor({
            color: color,
            mode: 'tint',
            alpha: alpha
        });

        layerObject.filters = [colorFilter];
        layerObject.applyFilters();

        if (layerObject.canvas) {
            layerObject.canvas.renderAll();
        }
    } catch (e) {
        console.warn('应用色调滤镜失败:', e);
    }
}

// 暴露到全局，供其他模块使用
window.applyTintFilter = applyTintFilter;

/**
 * 应用渐变色滤镜到图层对象（简化版）
 * @param {fabric.Object} layerObject - 要应用滤镜的图层对象
 * @param {string} color1 - 渐变起始颜色
 * @param {string} color2 - 渐变结束颜色
 * @param {string} direction - 渐变方向
 */
function applyGradientFilter(layerObject, color1 = '#ff0000', color2 = '#0000ff', direction = 'to right') {
    if (!layerObject || typeof layerObject.applyFilters !== 'function' || typeof fabric === 'undefined') {
        return;
    }

    try {
        const blendFilter1 = new fabric.Image.filters.BlendColor({
            color: color1,
            mode: 'multiply',
            alpha: 0.5
        });

        const blendFilter2 = new fabric.Image.filters.BlendColor({
            color: color2,
            mode: 'screen',
            alpha: 0.3
        });

        layerObject.filters = [blendFilter1, blendFilter2];
        layerObject.applyFilters();

        if (layerObject.canvas) {
            layerObject.canvas.renderAll();
        }
    } catch (error) {
        console.warn('渐变滤镜不支持，使用色调滤镜作为降级方案:', error);
        applyTintFilter(layerObject, color1, 0.7);
    }
}

// 暴露到全局
window.applyGradientFilter = applyGradientFilter;

/**
 * 初始化空的fabric画布
 * @param {string} canvasId - 画布ID
 * @param {number} canvasWidth - 画布宽度
 * @param {number} canvasHeight - 画布高度
 * @param {Object} view - 视图对象
 * @param {Object} store - Pinia store
 */
async function initializeEmptyCanvas(canvasId, canvasWidth, canvasHeight, view, store) {
    const canvasElement = document.getElementById(canvasId);
    if (!canvasElement || typeof fabric === 'undefined') {
        return null;
    }

    const canvas = new fabric.Canvas(canvasId, {
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: 'transparent'
    });

    if (window.initializeCanvasEventListeners) {
        window.initializeCanvasEventListeners(canvas);
    }

    if (window.PrintAreaValidator) {
        window.PrintAreaValidator.addPrintAreaValidationListeners(canvas, view.id);
    }

    canvasElement.__fabricCanvas = canvas;
    canvasElement.__viewId = view.id;

    if (window.CanvasManager) {
        if (!window.CanvasManager._canvasMap) {
            window.CanvasManager._canvasMap = {};
        }

        if (canvasId.includes('mainCanvas')) {
            window.CanvasManager._canvasMap[view.id] = canvas;

            if (store.activeViewId === view.id) {
                window.CanvasManager.setActiveCanvas(view.id);
                window.canvas = canvas;
                window.fabricCanvas = canvas;
            }
        }

        window.CanvasManager._canvasMap[canvasId] = canvas;
    }

    return canvas;
}

/**
 * 将单个图层渲染到指定canvas（专用于多图层系统）
 * @param {fabric.Canvas} canvas - Fabric.js 的画布实例
 * @param {object} layer - 要渲染的单个图层对象
 * @param {object} store - Pinia store 实例
 * @param {object} view - 当前视图对象
 * @returns {Promise<fabric.Object|null>} 返回创建的 fabric 对象
 */
async function renderLayerToSpecificCanvas(canvas, layer, store, view) {
    if (!canvas || !layer) {
        return null;
    }

    try {
        const fabricObject = await createFabricObjectFromLayer(canvas, layer);

        if (fabricObject && layer.name === 'Base Layer' && view && store && Array.isArray(store.views)) {
            const viewIndex = store.views.findIndex((v) => v.id === view.id);
            if (viewIndex !== -1) {
                if (!store.views[viewIndex].base_layer) {
                    store.views[viewIndex].base_layer = {};
                }
                store.views[viewIndex].base_layer = fabricObject;
            }
        }

        if (fabricObject) {
            canvas.add(fabricObject);
            return fabricObject;
        }
        return null;
    } catch (error) {
        console.warn('渲染图层失败:', error);
        return null;
    }
}

/**
 * 清除指定视图主画布上的内容区域裁剪限制。
 * @param {number|string} viewId - 视图 ID。
 */
function clearContentAreaClip(viewId) {
    const mainCanvasElement = document.getElementById(`mainCanvas-${viewId}`);
    if (!mainCanvasElement || !mainCanvasElement.__fabricCanvas) {
        return;
    }

    const mainCanvas = mainCanvasElement.__fabricCanvas;
    if (mainCanvas.clipPath) {
        mainCanvas.clipPath = null;
    }
    if (mainCanvas.__contentAreaClipRect) {
        mainCanvas.__contentAreaClipRect = null;
    }

    if (typeof mainCanvas.requestRenderAll === 'function') {
        mainCanvas.requestRenderAll();
    } else if (typeof mainCanvas.renderAll === 'function') {
        mainCanvas.renderAll();
    }
}

/**
 * 根据参考对象为目标画布应用内容区域裁剪。
 * @param {fabric.Canvas} canvas - 需要应用裁剪的画布。
 * @param {fabric.Object} referenceObject - 参考的内容区域图层对象。
 */
function applyContentAreaClip(canvas, referenceObject) {
    if (!canvas || !referenceObject || typeof fabric === 'undefined') {
        return;
    }

    const bounds = referenceObject.getBoundingRect(true, true);
    const clipRect = new fabric.Rect({
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
        originX: 'left',
        originY: 'top',
        absolutePositioned: true,
        selectable: false,
        evented: false
    });

    canvas.clipPath = clipRect;
    canvas.__contentAreaClipRect = clipRect;

    if (typeof canvas.requestRenderAll === 'function') {
        canvas.requestRenderAll();
    } else if (typeof canvas.renderAll === 'function') {
        canvas.renderAll();
    }
}

/**
 * 为 4-Grid Flow 视图处理内容区域图层（渲染与裁剪逻辑）。
 * @param {Object} view - 当前视图对象。
 */
async function handleFourGridContentArea(view) {
    const viewLayers = view?.data?.layer_config?.layers;
    if (!Array.isArray(viewLayers) || viewLayers.length === 0) {
        return;
    }

    const baseCanvasElement = document.getElementById(`baseCanvas-${view.id}`);
    const mainCanvasElement = document.getElementById(`mainCanvas-${view.id}`);
    if (
        !baseCanvasElement ||
        !baseCanvasElement.__fabricCanvas ||
        !mainCanvasElement ||
        !mainCanvasElement.__fabricCanvas
    ) {
        console.warn('未能获取到 4-Grid Flow 视图的 baseCanvas 或 mainCanvas。');
        return;
    }

    const baseCanvas = baseCanvasElement.__fabricCanvas;
    const mainCanvas = mainCanvasElement.__fabricCanvas;

    const existingContentArea = baseCanvas
        .getObjects()
        .filter((obj) => obj && obj.name === 'Content Area Layer');
    if (existingContentArea.length > 0) {
        existingContentArea.forEach((obj) => baseCanvas.remove(obj));
        baseCanvas.renderAll();
    }

    const contentAreaLayer = viewLayers.find((layer) => layer.name === 'Content Area Layer');
    if (!contentAreaLayer) {
        clearContentAreaClip(view.id);
        return;
    }

    const imageURL = contentAreaLayer?.layer_data?.content?.imageURL;
    if (!isValidImageURL(imageURL)) {
        console.warn('Content Area Layer 不包含可用的图片资源，将跳过渲染与裁剪。');
        clearContentAreaClip(view.id);
        return;
    }

    try {
        const contentAreaObject = await createFabricObjectFromLayer(baseCanvas, contentAreaLayer);
        if (!contentAreaObject) {
            clearContentAreaClip(view.id);
            return;
        }

        contentAreaObject.set({
            selectable: false,
            evented: false,
            name: 'Content Area Layer'
        });

        baseCanvas.add(contentAreaObject);
        baseCanvas.bringToFront(contentAreaObject);
        baseCanvas.renderAll();

        applyContentAreaClip(mainCanvas, contentAreaObject);
    } catch (error) {
        console.error('渲染 Content Area Layer 时发生错误:', error);
        clearContentAreaClip(view.id);
    }
}

/**
 * 判断给定的 URL 是否指向图片资源（含 dataURL）。
 * @param {string} url - 待检测的 URL 字符串。
 * @returns {boolean} 如果可能是图片则返回 true。
 */
function isValidImageURL(url) {
    if (typeof url !== 'string') {
        return false;
    }
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
        return false;
    }

    if (trimmedUrl.startsWith('data:image/')) {
        return true;
    }

    const lowerUrl = trimmedUrl.split('?')[0].toLowerCase();
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'];
    return imageExtensions.some((ext) => lowerUrl.endsWith(ext));
}

/**
 * 为视图初始化多图层画布
 * @param {Object} view - 视图对象
 * @param {Object} store - Pinia store
 */
async function initializeMultiLayerCanvases(view, store) {
    const viewData = view.data;
    const layerConfig = viewData?.layer_config;
    if (!layerConfig || !Array.isArray(layerConfig.layers) || layerConfig.layers.length === 0) {
        console.error('未在视图数据中找到有效的图层配置进行渲染。');
        return;
    }

    const layers = layerConfig.layers;
    const productViewFlow = view.view_flow;

    let targetLayer = layers[0];
    if (productViewFlow === '4-Grid Flow') {
        const gridFlowLayer = layers.find((layer) => layer.name === '4-Grid Flow');
        if (gridFlowLayer) {
            targetLayer = gridFlowLayer;
        }
    }

    const canvasWidth =
        targetLayer.layer_data.dimensions.contentArea.width ||
        targetLayer.layer_data.dimensions.layerSize.width;
    const canvasHeight =
        targetLayer.layer_data.dimensions.contentArea.height ||
        targetLayer.layer_data.dimensions.layerSize.height;

    let allCanvasIds = [
        `baseCanvas-${view.id}`,
        `mainCanvas-${view.id}`,
        `overlayCanvas-${view.id}`
    ];
    if (productViewFlow === '4-Grid Flow') {
        allCanvasIds = [`baseCanvas-${view.id}`, `mainCanvas-${view.id}`];
    }

    for (const canvasId of allCanvasIds) {
        await initializeEmptyCanvas(canvasId, canvasWidth, canvasHeight, view, store);
    }

    let canvasConfigs = [
        { layerName: 'Base Layer', canvasId: `baseCanvas-${view.id}` },
        { layerName: 'Overlay Layer', canvasId: `overlayCanvas-${view.id}` },
        { layerName: '4-Grid Flow', canvasId: `mainCanvas-${view.id}` },
        { layerName: 'Custom Layer', canvasId: `mainCanvas-${view.id}` }
    ];
    if (productViewFlow === '4-Grid Flow') {
        canvasConfigs = [{ layerName: '4-Grid Flow', canvasId: `baseCanvas-${view.id}` }];
    }

    for (const config of canvasConfigs) {
        const targetLayers = layers.filter((layer) => layer.name === config.layerName);
        if (targetLayers.length > 0) {
            const canvasEl = document.getElementById(config.canvasId);
            const canvas = canvasEl && canvasEl.__fabricCanvas;
            if (canvas) {
                const sortedLayers = [...targetLayers].sort(
                    (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
                );
                for (const layer of sortedLayers) {
                    await renderLayerToSpecificCanvas(canvas, layer, store, view);
                }
                canvas.renderAll();
            }
        }
    }

    if (productViewFlow === '4-Grid Flow') {
        await handleFourGridContentArea(view);
    } else {
        clearContentAreaClip(view.id);
    }

    setTimeout(() => {
        if (typeof window.triggerAutoZoomAdjustment === 'function') {
            window.triggerAutoZoomAdjustment();
        }
    }, 200);
}

/**
 * 初始化遮罩画布（打印区域高亮）
 * @param {string} canvasId - 画布ID
 * @param {Object} view - 视图对象
 * @param {Object} store - Pinia store
 */
async function initializeMaskCanvas(canvasId, view, store) {
    if (view.view_flow === '4-Grid Flow' || typeof fabric === 'undefined') {
        return null;
    }

    const canvasElement = document.getElementById(canvasId);
    if (!canvasElement) {
        return null;
    }

    let canvasWidth = 456;
    let canvasHeight = 456;

    if (view.layers && view.layers.length > 0) {
        const targetLayer = view.layers[0];
        if (targetLayer && targetLayer.layer_data?.dimensions) {
            canvasWidth =
                targetLayer.layer_data.dimensions.contentArea?.width ||
                targetLayer.layer_data.dimensions.layerSize?.width ||
                canvasWidth;
            canvasHeight =
                targetLayer.layer_data.dimensions.contentArea?.height ||
                targetLayer.layer_data.dimensions.layerSize?.height ||
                canvasHeight;
        }
    }

    const maskCanvas = new fabric.Canvas(canvasId, {
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: 'transparent',
        selection: false,
        hoverCursor: 'default',
        moveCursor: 'default'
    });

    let printAreaWidth = 100;
    let printAreaHeight = 120;

    if (window.usePrintMethodStore) {
        const printMethodStore = window.usePrintMethodStore();
        const currentMethods = printMethodStore.currentViewPrintMethods;

        if (currentMethods && currentMethods.length > 0) {
            const firstMethod = currentMethods[0];
            if (firstMethod.print_method_area_width && firstMethod.print_method_area_height) {
                printAreaWidth = firstMethod.print_method_area_width * 50;
                printAreaHeight = firstMethod.print_method_area_height * 50;
            }
        }
    }

    const maskPath = `M 0 0 L ${canvasWidth} 0 L ${canvasWidth} ${canvasHeight} L 0 ${canvasHeight} Z M ${
        (canvasWidth - printAreaWidth) / 2
    } ${(canvasHeight - printAreaHeight) / 2} L ${
        (canvasWidth + printAreaWidth) / 2
    } ${(canvasHeight - printAreaHeight) / 2} L ${
        (canvasWidth + printAreaWidth) / 2
    } ${(canvasHeight + printAreaHeight) / 2} L ${
        (canvasWidth - printAreaWidth) / 2
    } ${(canvasHeight + printAreaHeight) / 2} Z`;

    const printAreaMask = new fabric.Path(maskPath, {
        fill: 'rgba(0, 0, 0, 0.5)',
        fillRule: 'evenodd',
        stroke: '#ffffff',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
        excludeFromExport: true,
        name: 'printAreaMask'
    });

    const printAreaRect = new fabric.Rect({
        left: (canvasWidth - printAreaWidth) / 2,
        top: (canvasHeight - printAreaHeight) / 2,
        width: printAreaWidth,
        height: printAreaHeight,
        fill: 'rgba(255, 0, 0, 0.05)',
        stroke: false,
        strokeWidth: 2,
        selectable: false,
        evented: false,
        visible: true,
        excludeFromExport: true,
        name: 'printAreaRect',
        hasControls: false,
        hasBorders: false
    });

    maskCanvas.add(printAreaRect);
    maskCanvas.add(printAreaMask);
    maskCanvas.renderAll();

    canvasElement.__fabricCanvas = maskCanvas;
    canvasElement.__viewId = view.id;

    return maskCanvas;
}

/**
 * 获取 base 图层有像素部分的边界框
 * @param {fabric.Object} baseLayer - base 图层对象
 * @returns {Object|null} 返回边界框信息 {left, top, width, height} 或 null
 */
function getBaseLayerPixelBounds(baseLayer) {
    if (!baseLayer || !baseLayer.getElement) {
        console.warn('无效的 base 图层对象');
        return null;
    }

    try {
        const imageElement = baseLayer.getElement();
        if (!imageElement) {
            console.warn('无法获取 base 图层的图像元素');
            return null;
        }

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        tempCanvas.width = imageElement.width || imageElement.naturalWidth;
        tempCanvas.height = imageElement.height || imageElement.naturalHeight;

        tempCtx.drawImage(imageElement, 0, 0);

        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;

        let minX = tempCanvas.width;
        let minY = tempCanvas.height;
        let maxX = 0;
        let maxY = 0;
        let hasPixels = false;

        for (let y = 0; y < tempCanvas.height; y++) {
            for (let x = 0; x < tempCanvas.width; x++) {
                const index = (y * tempCanvas.width + x) * 4;
                const alpha = data[index + 3];

                if (alpha > 0) {
                    hasPixels = true;
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
        }

        if (!hasPixels) {
            console.warn('base 图层中没有找到有像素的部分');
            return null;
        }

        const scaleX = baseLayer.scaleX || 1;
        const scaleY = baseLayer.scaleY || 1;

        const layerLeft = baseLayer.left || 0;
        const layerTop = baseLayer.top || 0;

        const pixelWidth = maxX - minX + 1;
        const pixelHeight = maxY - minY + 1;

        const boundsLeft = layerLeft + minX * scaleX - (baseLayer.width * scaleX) / 2;
        const boundsTop = layerTop + minY * scaleY - (baseLayer.height * scaleY) / 2;
        const boundsWidth = pixelWidth * scaleX;
        const boundsHeight = pixelHeight * scaleY;

        return {
            left: boundsLeft,
            top: boundsTop,
            width: boundsWidth,
            height: boundsHeight
        };
    } catch (error) {
        console.error('获取 base 图层像素边界时出错:', error);
        return null;
    }
}

// 暴露到全局作用域
window.getBaseLayerPixelBounds = getBaseLayerPixelBounds;

/**
 * 清除所有渐变覆盖矩形
 * @returns {number} 被移除的对象数量
 */
function clearAllGradientRects() {
    let totalRemoved = 0;
    const processedCanvases = new Set();

    const removeGradientObjects = (canvas) => {
        if (!canvas || typeof canvas.getObjects !== 'function') {
            return 0;
        }

        if (processedCanvases.has(canvas)) {
            return 0;
        }

        const gradientObjects = canvas.getObjects().filter((obj) => {
            return (
                (obj.id && obj.id.startsWith('gradient-rect-')) ||
                (obj.name && obj.name === 'Base Gradient Overlay')
            );
        });

        if (gradientObjects.length === 0) {
            processedCanvases.add(canvas);
            return 0;
        }

        gradientObjects.forEach((obj) => canvas.remove(obj));

        if (typeof canvas.requestRenderAll === 'function') {
            canvas.requestRenderAll();
        } else if (typeof canvas.renderAll === 'function') {
            canvas.renderAll();
        }

        processedCanvases.add(canvas);
        return gradientObjects.length;
    };

    const resolveCanvasInstance = (canvasId, fallbackId, view) => {
        let canvas = null;

        if (window.CanvasManager && typeof window.CanvasManager.getCanvas === 'function') {
            canvas = window.CanvasManager.getCanvas(canvasId);
            if (!canvas && fallbackId) {
                canvas = window.CanvasManager.getCanvas(fallbackId);
            }
        }

        if (!canvas && canvasId) {
            const element = document.getElementById(canvasId);
            if (element) {
                canvas = element.__fabricCanvas || element.fabric || element.__canvas || null;
            }
        }

        if (!canvas && view && view.base_layer && view.base_layer.canvas) {
            canvas = view.base_layer.canvas;
        }

        return canvas;
    };

    try {
        if (window.useCanvasStore) {
            const store = window.useCanvasStore();
            if (store && Array.isArray(store.views)) {
                store.views.forEach((view) => {
                    const baseCanvasId = `baseCanvas-${view.id}`;
                    const fallbackCanvasId = view.id;
                    const canvas = resolveCanvasInstance(baseCanvasId, fallbackCanvasId, view);
                    const removed = removeGradientObjects(canvas);
                    totalRemoved += removed;
                });
            }
        } else {
            console.warn('useCanvasStore 不可用，跳过设计视图画布清理');
        }

        const productCanvas = resolveCanvasInstance('product-view');
        const productRemoved = removeGradientObjects(productCanvas);
        totalRemoved += productRemoved;
    } catch (error) {
        console.error('清除渐变色对象时发生错误:', error);
    }

    return totalRemoved;
}

// 暴露到全局作用域
window.clearAllGradientRects = clearAllGradientRects;

/**
 * 初始化多视图容器与画布
 * 依赖：window.useCanvasStore、fabric、CanvasManager、PrintAreaValidator 等
 */
function initializeMultiViewCanvases(store) {
    let isInitialized = false;

    store.$subscribe((mutation, state) => {
        if (
            mutation.storeId === 'canvas' &&
            state.views &&
            state.views.length > 0 &&
            !isInitialized
        ) {
            createViewContainers(state.views, store);
            isInitialized = true;
        }
    });

    if (store.views && store.views.length > 0 && !isInitialized) {
        createViewContainers(store.views, store);
        isInitialized = true;
    }
}

/**
 * 创建视图容器并初始化对应的多图层画布
 * @param {Array} views - 视图数组
 * @param {Object} store - Pinia store
 */
function createViewContainers(views, store) {
    const multiViewContainer = document.getElementById('multi-view-container');
    if (!multiViewContainer) {
        console.error('Multi-view container not found');
        return;
    }

    multiViewContainer.innerHTML = '';

    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');

    let targetViewIndex = 0;
    if (viewParam && viewParam !== 'main') {
        const foundIndex = views.findIndex(
            (v) =>
                v.id === viewParam ||
                v.view_id === viewParam ||
                String(v.id) === String(viewParam)
        );
        if (foundIndex !== -1) {
            targetViewIndex = foundIndex;
        }
    }

    const initPromises = views.map((view, index) => {
        let canvasWidth = 567;
        let canvasHeight = 567;

        if (view.layers && view.layers.length > 0) {
            let targetLayer = view.layers[0];
            if (view.view_flow === '4-Grid Flow') {
                const gridFlowLayer = view.layers.find((layer) => layer.name === '4-Grid Flow');
                if (gridFlowLayer) {
                    targetLayer = gridFlowLayer;
                }
            }
            if (targetLayer && targetLayer.layer_data?.dimensions) {
                canvasWidth =
                    targetLayer.layer_data.dimensions.contentArea?.width ||
                    targetLayer.layer_data.dimensions.layerSize?.width ||
                    canvasWidth;
                canvasHeight =
                    targetLayer.layer_data.dimensions.contentArea?.height ||
                    targetLayer.layer_data.dimensions.layerSize?.height ||
                    canvasHeight;
            }
        }

        const viewContainer = document.createElement('div');
        viewContainer.id = `view-container-${view.id}`;
        viewContainer.className = 'view-container';
        viewContainer.style.cssText = `
            position: relative;
            width: ${canvasWidth}px;
            height: ${canvasHeight}px;
            display: ${index === targetViewIndex ? 'block' : 'none'};
        `;

        const canvasHtml = `
            <div class="canvas-wrapper canvas-wrapper--base" id="baseWrapper-${view.id}">
                <canvas id="baseCanvas-${view.id}"></canvas>
            </div>
            <div class="canvas-wrapper canvas-wrapper--main" id="mainWrapper-${view.id}">
                <canvas id="mainCanvas-${view.id}"></canvas>
            </div>
            <div class="canvas-wrapper canvas-wrapper--overlay" id="overlayWrapper-${view.id}">
                <canvas id="overlayCanvas-${view.id}"></canvas>
            </div>
            <div class="canvas-wrapper canvas-wrapper--mask" id="maskWrapper-${view.id}">
                <canvas id="maskCanvas-${view.id}"></canvas>
            </div>
        `;

        viewContainer.innerHTML = canvasHtml;
        multiViewContainer.appendChild(viewContainer);

        return new Promise((resolve) => {
            setTimeout(async () => {
                await initializeMultiLayerCanvases(view, store);
                // await initializeMaskCanvas(`maskCanvas-${view.id}`, view, store);
                resolve();
            }, 100);
        });
    });

    Promise.all(initPromises)
        .then(() => {
            const targetView = views[targetViewIndex];
            if (targetView) {
                store.setActiveViewId(targetView.id);

                if (window.CanvasManager) {
                    window.CanvasManager.setActiveCanvas(targetView.id);
                    const canvas = window.CanvasManager.getCanvas(targetView.id);
                    if (canvas) {
                        if (window.setGlobalCanvas) {
                            window.setGlobalCanvas(canvas);
                        } else {
                            window.canvas = canvas;
                            window.fabricCanvas = canvas;
                        }
                    }
                }
            }

            const initCompleteEvent = new CustomEvent('multiViewInitComplete');
            document.dispatchEvent(initCompleteEvent);
        })
        .catch((error) => {
            console.error('Error initializing views:', error);
        });
}

// 等待 DOM 和 Pinia store，就绪后初始化多视图系统
document.addEventListener('DOMContentLoaded', () => {
    function waitForStore() {
        if (typeof window.useCanvasStore === 'function') {
            document.dispatchEvent(new CustomEvent('canvasStoreReady'));
            const store = window.useCanvasStore();
            if (store) {
                initializeMultiViewCanvases(store);
                return;
            }
        }
        setTimeout(waitForStore, 100);
    }

    waitForStore();
});