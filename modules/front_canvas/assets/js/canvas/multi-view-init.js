// 多视图画布初始化与多图层渲染逻辑
// 从原 canvas-design_area.php 内联脚本迁移而来

const PWCA_IMAGE_LAYER_LOAD_TIMEOUT_MS = 15000;

/**
 * 将 API 中的 anchorPoint 字符串转换为 Fabric.js 的 originX 和 originY。
 * @param {string} anchorPoint - 例如 "top-left", "center"。
 * @returns {{originX: string, originY: string}} Fabric.js 的原点对象。
 */
function pwcaGetOriginFromAnchorPoint(anchorPoint) {
    // 处理单个值的情况（如 'center'）。
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
 * 当 originX 和 originY 为 center 时，需要将基于左上角的坐标转换为基于中心点的坐标。
 * @param {number} x - 原始 x 坐标（基于左上角）。
 * @param {number} y - 原始 y 坐标（基于左上角）。
 * @param {number} width - 对象宽度
 * @param {number} height - 对象高度
 * @param {string} originX - Fabric.js 的 originX。
 * @param {string} originY - Fabric.js 的 originY。
 * @returns {{x: number, y: number}} 转换后的坐标
 */
function pwcaConvertCoordinatesForOrigin(x, y, width, height, originX, originY) {
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

function pwcaGetLayerRenderSize(layer, fallback = {}) {
    const dimensions = layer?.layer_data?.dimensions || {};
    const layerSize = dimensions.layerSize || {};
    const contentArea = dimensions.contentArea || {};

    const width = Number(layerSize.width || contentArea.width || fallback.width || 0);
    const height = Number(layerSize.height || contentArea.height || fallback.height || 0);

    return {
        width: Number.isFinite(width) && width > 0 ? width : Number(fallback.width || 0),
        height: Number.isFinite(height) && height > 0 ? height : Number(fallback.height || 0)
    };
}

function pwcaGetCanvasHeightValue(canvas) {
    if (!canvas) {
        return 0;
    }

    const height = typeof canvas.getHeight === 'function' ? canvas.getHeight() : canvas.height;
    return Number(height || 0);
}

function pwcaGetFabricPlacementForLayer(canvas, position = {}, renderSize = {}) {
    const x = Number(position.coordinates?.x || 0);
    const y = Number(position.coordinates?.y || 0);
    const width = Number(renderSize.width || 0);
    const height = Number(renderSize.height || 0);
    const anchorPoint = String(position.anchorPoint || 'bottom-left').trim();

    if (anchorPoint === 'bottom-left') {
        const canvasHeight = pwcaGetCanvasHeightValue(canvas);
        return {
            left: x,
            top: canvasHeight - y - height,
            originX: 'left',
            originY: 'top'
        };
    }

    if (anchorPoint === 'top-left' || anchorPoint === '') {
        return {
            left: x,
            top: y,
            originX: 'left',
            originY: 'top'
        };
    }

    const origins = pwcaGetOriginFromAnchorPoint(anchorPoint);
    const convertedCoords = pwcaConvertCoordinatesForOrigin(
        x,
        y,
        width,
        height,
        origins.originX,
        origins.originY
    );

    return {
        left: convertedCoords.x,
        top: convertedCoords.y,
        originX: origins.originX,
        originY: origins.originY
    };
}

function pwcaIsTextLikeObject(obj) {
    return !!obj && (
        obj.type === 'text' ||
        obj.type === 'i-text' ||
        obj.type === 'textbox'
    );
}

function pwcaNormalizeArcValue(value) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
}

function pwcaApplyArcPathToTextObject(textObject, arcValue) {
    if (!pwcaIsTextLikeObject(textObject) || typeof fabric === 'undefined') {
        return textObject;
    }

    const normalizedArc = pwcaNormalizeArcValue(arcValue);
    const textWidth = Math.max(Number(textObject.width || 0), 1);
    const textHeight = Math.max(
        Number(textObject.height || 0),
        Number(textObject.fontSize || 0),
        1
    );

    if (Math.abs(normalizedArc) < 0.01) {
        textObject.set('path', null);
        textObject._arcValue = 0;
        textObject.setCoords();
        return textObject;
    }

    const baseY = normalizedArc >= 0 ? textHeight / 2 : -textHeight / 2;
    const controlY = baseY - normalizedArc;
    const path = new fabric.Path(
        `M 0 ${baseY} Q ${textWidth / 2} ${controlY} ${textWidth} ${baseY}`
    );

    path.set({
        fill: ''
    });

    textObject.set('path', path);
    textObject.set('backgroundColor', '');
    textObject._arcValue = normalizedArc;
    textObject.setCoords();

    return textObject;
}

if (typeof window !== 'undefined') {
    window.pwcaIsTextLikeObject = window.pwcaIsTextLikeObject || pwcaIsTextLikeObject;
    window.pwcaApplyArcPathToTextObject =
        window.pwcaApplyArcPathToTextObject || pwcaApplyArcPathToTextObject;
}

function pwcaGetTargetCanvasIdForLayer(layer, view, store) {
    const layerName = String(layer?.name || '').trim();
    const flowConfig = window.pwcaGetFlowConfig ? window.pwcaGetFlowConfig(view, store) : null;

    if (flowConfig && typeof flowConfig.layerRouting === 'function') {
        const targetType = flowConfig.layerRouting(layerName);
        if (!targetType) {
            return null;
        }
        return `${targetType}-${view.id}`;
    }

    // 回退逻辑
    if (layerName === 'Background Layer' || layerName === 'Base Layer' || layerName === '4-Grid Layer') {
        return `baseCanvas-${view.id}`;
    }

    if (layerName === 'Overlay Layer') {
        return `overlayCanvas-${view.id}`;
    }

    return `mainCanvas-${view.id}`;
}

function pwcaGetViewRenderableLayers(view) {
    const viewData = view && view.data ? view.data : null;
    const layerConfig = viewData && viewData.layer_config ? viewData.layer_config : null;
    return layerConfig && Array.isArray(layerConfig.layers) ? layerConfig.layers : [];
}

function pwcaGetFlowSizingReferenceLayer(layers, view, store) {
    if (!Array.isArray(layers) || layers.length === 0) {
        return null;
    }

    const flowConfig = window.pwcaGetFlowConfig ? window.pwcaGetFlowConfig(view, store) : null;
    if (flowConfig && typeof flowConfig.sizingReference === 'function') {
        return flowConfig.sizingReference(layers);
    }

    return layers[0];
}

function pwcaGetCanvasDimensionsForView(view, store, fallback = { width: 567, height: 567 }) {
    const layers = Array.isArray(view && view.layers) && view.layers.length > 0
        ? view.layers
        : pwcaGetViewRenderableLayers(view);
    const targetLayer = pwcaGetFlowSizingReferenceLayer(layers, view, store);

    if (!targetLayer) {
        return {
            width: Number(fallback.width || 0),
            height: Number(fallback.height || 0)
        };
    }

    return pwcaGetLayerRenderSize(targetLayer, fallback);
}

function pwcaBuildCanvasConfigsForView(view, layers, store) {
    const canvasConfigs = [
        { canvasId: `baseCanvas-${view.id}`, layers: [] },
        { canvasId: `mainCanvas-${view.id}`, layers: [] },
        { canvasId: `overlayCanvas-${view.id}`, layers: [] }
    ];
    const canvasConfigMap = new Map(canvasConfigs.map((config) => [config.canvasId, config]));

    for (const layer of layers) {
        const canvasId = pwcaGetTargetCanvasIdForLayer(layer, view, store);
        if (!canvasId) {
            continue;
        }

        const targetConfig = canvasConfigMap.get(canvasId);
        if (targetConfig) {
            targetConfig.layers.push(layer);
        }
    }

    return canvasConfigs;
}

async function pwcaRenderCanvasConfigsForView(view, store, canvasConfigs) {
    for (const config of canvasConfigs) {
        const targetLayers = config.layers;
        if (targetLayers.length === 0) {
            continue;
        }

        const canvasEl = document.getElementById(config.canvasId);
        const canvas = canvasEl && canvasEl.__fabricCanvas;
        if (!canvas) {
            continue;
        }

        console.info('[PW Canvas][MultiView] Start rendering canvas layers', {
            viewId: view && view.id ? view.id : null,
            canvasId: config.canvasId,
            layerCount: targetLayers.length
        });

        const sortedLayers = [...targetLayers].sort(
            (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
        );
        for (const layer of sortedLayers) {
            await pwcaRenderLayerToSpecificCanvas(canvas, layer, store, view);
        }
        canvas.renderAll();
    }
}

async function pwcaApplyFlowPostInitialization(view, store) {
    const flowConfig = window.pwcaGetFlowConfig ? window.pwcaGetFlowConfig(view, store) : null;

    const flowHandlers = {
        'pwcaHandleFourGridContentArea': pwcaHandleFourGridContentArea
    };

    if (flowConfig && flowConfig.postInit) {
        const handler = flowHandlers[flowConfig.postInit];
        if (typeof handler === 'function') {
            await handler(view, store);
            return;
        }
    }

    pwcaClearContentAreaClip(view.id);
}

/**
 * 辅助函数，用于从图层数据对象创建一个 Fabric.js 对象。
 * @param {fabric.Canvas} canvas - 目标画布
 * @param {object} layer - 来自 API 的单个图层对象。
 * @returns {Promise<fabric.Object|null>} 一个 Promise，如果图层无法创建，则解析为 fabric 对象或 null。
 */
function pwcaCreateFabricObjectFromLayer(canvas, layer) {
    return new Promise((resolve) => {
        if (!canvas || !layer || !layer.layer_data) {
            resolve(null);
            return;
        }

        const data = layer.layer_data;
        const rawControls = data.controls || {};
        const position = data.position || {};

        let storeSettings = null;
        try {
            if (typeof window.pwcaUseCanvasStore === 'function') {
                const store = window.pwcaUseCanvasStore();
                if (store && typeof store.getStoreCustomizationSettings === 'function') {
                    storeSettings = store.getStoreCustomizationSettings();
                }
            }
        } catch (e) {
            console.warn('[PW Canvas] 无法获取店铺设置，将使用图层默认值。');
        }

        const mergedControls = typeof window.pwcaBuildMergedLayerControls === 'function'
            ? window.pwcaBuildMergedLayerControls(rawControls, storeSettings)
            : {
                movable: rawControls.movable !== undefined ? rawControls.movable : true,
                scalable: rawControls.scalable !== undefined ? rawControls.scalable : true,
                rotatable: rawControls.rotatable !== undefined ? rawControls.rotatable : true,
                deletable: rawControls.deletable !== undefined ? rawControls.deletable : true,
                exportable: rawControls.exportable !== undefined ? rawControls.exportable : true,
                visibility: rawControls.visibility !== undefined ? rawControls.visibility : true,
                allowUnproportionalScaling: false,
                minScaleLimit: 0.2,
                scaleBy: 'factor'
            };

        switch (layer.type) {
            case 'image': {
                if (!data.content || !data.content.imageURL) {
                    console.warn(`因缺少 imageURL，正在跳过图片图层 "${layer.name}"。`);
                    resolve(null);
                    return;
                }

                let settled = false;
                const imageUrl = data.content.imageURL;
                const finish = (result) => {
                    if (settled) {
                        return;
                    }

                    settled = true;
                    clearTimeout(timeoutId);
                    resolve(result);
                };

                const timeoutId = setTimeout(() => {
                    console.warn('[PW Canvas][MultiView] 图片图层加载超时，已跳过该图层', {
                        layerName: layer.name || '',
                        imageUrl
                    });
                    finish(null);
                }, PWCA_IMAGE_LAYER_LOAD_TIMEOUT_MS);

                fabric.Image.fromURL(
                    imageUrl,
                    (img) => {
                        if (!img) {
                            console.warn('[PW Canvas][MultiView] 图片图层返回空对象，已跳过该图层', {
                                layerName: layer.name || '',
                                imageUrl
                            });
                            finish(null);
                            return;
                        }

                        const imgWidth = img.width || 1;
                        const imgHeight = img.height || 1;
                        const renderSize = pwcaGetLayerRenderSize(layer, {
                            width: imgWidth,
                            height: imgHeight
                        });

                        if (renderSize.width <= 0 || renderSize.height <= 0) {
                            console.warn(`因尺寸无效，正在跳过图片图层 "${layer.name}"。`);
                            finish(null);
                            return;
                        }

                        const scaleX = renderSize.width / imgWidth;
                        const scaleY = renderSize.height / imgHeight;
                        const placement = pwcaGetFabricPlacementForLayer(canvas, position, renderSize);

                        img.set({
                            left: placement.left,
                            top: placement.top,
                            angle: position.rotation || 0,
                            originX: placement.originX,
                            originY: placement.originY,
                            opacity: (data.content.opacity ?? 100) / 100,
                            selectable: !!mergedControls.movable,
                            evented: !!mergedControls.movable,
                            lockRotation: !mergedControls.rotatable,
                            lockScalingX: !mergedControls.scalable,
                            lockScalingY: !mergedControls.scalable,
                            lockUniScaling: !mergedControls.allowUnproportionalScaling,
                            hasControls: !!(mergedControls.movable && mergedControls.scalable),
                            hasBorders: !!mergedControls.movable,
                            name: layer.name,
                            layerControls: mergedControls
                        });

                        img.set({
                            scaleX: scaleX > 0 ? scaleX : 1,
                            scaleY: scaleY > 0 ? scaleY : 1
                        });
                        img.setCoords();

                        finish(img);
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

                const textRenderSize = pwcaGetLayerRenderSize(layer, {
                    width: 0,
                    height: 0
                });
                if (textRenderSize.width <= 0 || textRenderSize.height <= 0) {
                    console.warn(`因尺寸无效，正在跳过文本图层 "${layer.name}"。`);
                    resolve(null);
                    return;
                }
                const placement = pwcaGetFabricPlacementForLayer(canvas, position, textRenderSize);
                const arcValue = pwcaNormalizeArcValue(data.content.arc);

                const textObj = new fabric.Textbox(data.content.text, {
                    left: placement.left,
                    top: placement.top,
                    angle: position.rotation || 0,
                    originX: placement.originX,
                    originY: placement.originY,
                    width: textRenderSize.width,
                    fontSize: data.content.fontSize || 40,
                    fontFamily: data.content.fontFamily || 'Arial',
                    fill: data.content.fontColor || '#000000',
                    backgroundColor: data.content.backgroundColor || '',
                    opacity: (data.content.opacity ?? 100) / 100,
                    selectable: !!mergedControls.movable,
                    evented: !!mergedControls.movable,
                    lockRotation: !mergedControls.rotatable,
                    lockScalingX: !mergedControls.scalable,
                    lockScalingY: !mergedControls.scalable,
                    lockUniScaling: !mergedControls.allowUnproportionalScaling,
                    hasControls: !!(mergedControls.movable && mergedControls.scalable),
                    hasBorders: !!mergedControls.movable,
                    id: layer.id || undefined,
                    name: layer.name,
                    layerName: layer.name,
                    layerType: 'text',
                    layerControls: mergedControls
                });

                pwcaApplyArcPathToTextObject(textObj, arcValue);
                textObj.setCoords();

                resolve(textObj);
                break;
            }

            default:
                console.warn(`未知的图层类型 "${layer.type}" (图层名 "${layer.name}").`);
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
function pwcaApplyTintFilter(layerObject, color = '#ff0000', alpha = 1) {
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
window.pwcaApplyTintFilter = pwcaApplyTintFilter;

/**
 * 应用渐变色滤镜到图层对象（简化版）
 * @param {fabric.Object} layerObject - 要应用滤镜的图层对象
 * @param {string} color1 - 渐变起始颜色
 * @param {string} color2 - 渐变结束颜色
 * @param {string} direction - 渐变方向
 */
function pwcaApplyGradientFilter(layerObject, color1 = '#ff0000', color2 = '#0000ff', direction = 'to right') {
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
        pwcaApplyTintFilter(layerObject, color1, 0.7);
    }
}

// 暴露到全局
window.pwcaApplyGradientFilter = pwcaApplyGradientFilter;

/**
 * 初始化空的fabric画布
 * @param {string} canvasId - 画布ID
 * @param {number} canvasWidth - 画布宽度
 * @param {number} canvasHeight - 画布高度
 * @param {Object} view - 视图对象
 * @param {Object} store - Pinia store
 */
async function pwcaInitializeEmptyCanvas(canvasId, canvasWidth, canvasHeight, view, store) {
    const canvasElement = document.getElementById(canvasId);
    if (!canvasElement || typeof fabric === 'undefined') {
        return null;
    }

    const canvas = new fabric.Canvas(canvasId, {
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: 'transparent'
    });

    if (window.pwcaInitializeCanvasEventListeners) {
        window.pwcaInitializeCanvasEventListeners(canvas);
    }

    if (window.PrintAreaValidator) {
        window.PrintAreaValidator.pwcaAddPrintAreaValidationListeners(canvas, view.id);
    }

    canvasElement.__fabricCanvas = canvas;
    canvasElement.__viewId = view.id;

    if (window.pwcaCanvasManager) {
        if (!window.pwcaCanvasManager._canvasMap) {
            window.pwcaCanvasManager._canvasMap = {};
        }

        if (canvasId.includes('mainCanvas')) {
            window.pwcaCanvasManager._canvasMap[view.id] = canvas;

            if (store.activeViewId === view.id) {
                window.pwcaCanvasManager.setActiveCanvas(view.id);
                window.pwcaCanvas = canvas;
                window.pwcaFabricCanvas = canvas;
            }
        }

        window.pwcaCanvasManager._canvasMap[canvasId] = canvas;
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
async function pwcaRenderLayerToSpecificCanvas(canvas, layer, store, view) {
    if (!canvas || !layer) {
        return null;
    }

    try {
        const fabricObject = await pwcaCreateFabricObjectFromLayer(canvas, layer);

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
function pwcaClearContentAreaClip(viewId) {
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
function pwcaApplyContentAreaClip(canvas, referenceObject) {
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
 * 为 4-Grid Flow 视图 handle 内容区域图层（渲染与裁剪逻辑）。
 * @param {Object} view - 当前视图对象。
 * @param {Object} store - Pinia store。
 */
async function pwcaHandleFourGridContentArea(view, store) {
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
        console.warn('未能获取 4-Grid Flow 视图的 baseCanvas 或 mainCanvas。');
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

    const flowConfig = window.pwcaGetFlowConfig ? window.pwcaGetFlowConfig(view, store) : null;
    const fallbacks = flowConfig?.contentAreaFallbacks || ['Content Area Layer', 'Mapping Layer', 'FlexiCurve Layer', 'Base Layer'];

    let contentAreaLayer = null;
    for (const layerName of fallbacks) {
        contentAreaLayer = viewLayers.find((layer) => layer.name === layerName);
        if (contentAreaLayer) break;
    }

    if (!contentAreaLayer) {
        pwcaClearContentAreaClip(view.id);
        return;
    }
    // 不考虑内容视图的图片资源，直接渲染
    // const imageURL = contentAreaLayer?.layer_data?.content?.imageURL;
    // if (!pwcaIsValidImageURL(imageURL)) {
    //     console.warn('Content Area Layer 不包含可用的图片资源，将跳过渲染与裁剪。');
    //     pwcaClearContentAreaClip(view.id);
    //     return;
    // }

    try {
        const contentAreaObject = await pwcaCreateFabricObjectFromLayer(baseCanvas, contentAreaLayer);
        if (!contentAreaObject) {
            pwcaClearContentAreaClip(view.id);
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

        pwcaApplyContentAreaClip(mainCanvas, contentAreaObject);
    } catch (error) {
        console.error('渲染 Content Area Layer 时发生错误', error);
        pwcaClearContentAreaClip(view.id);
    }
}

/**
 * 判断给定 URL 是否指向图片资源（含 dataURL）。
 * @param {string} url - 待检测的 URL 字符串。
 * @returns {boolean} 如果可能是图片则返回 true。
 */
function pwcaIsValidImageURL(url) {
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
 * 为视图初始化多图层画布。
 * @param {Object} view - 视图对象
 * @param {Object} store - Pinia store
 */
async function pwcaInitializeMultiLayerCanvases(view, store) {
    console.info('[PW Canvas][MultiView] 开始初始化视图', {
        viewId: view && view.id ? view.id : null,
        viewName: view && view.name ? view.name : null
    });

    const layers = pwcaGetViewRenderableLayers(view);
    if (layers.length === 0) {
        console.error('未在视图数据中找到有效的图层配置进行渲染。');
        return;
    }

    const canvasSize = pwcaGetCanvasDimensionsForView(view, store, { width: 0, height: 0 });
    const canvasWidth = canvasSize.width;
    const canvasHeight = canvasSize.height;

    const canvasConfigs = pwcaBuildCanvasConfigsForView(view, layers, store);
    const allCanvasIds = canvasConfigs.map((config) => config.canvasId);

    for (const canvasId of allCanvasIds) {
        await pwcaInitializeEmptyCanvas(canvasId, canvasWidth, canvasHeight, view, store);
    }

    await pwcaRenderCanvasConfigsForView(view, store, canvasConfigs);
    await pwcaApplyFlowPostInitialization(view, store);

    setTimeout(() => {
        if (typeof window.pwcaTriggerAutoZoomAdjustment === 'function') {
            window.pwcaTriggerAutoZoomAdjustment();
        }
    }, 200);

    console.info('[PW Canvas][MultiView] 视图初始化完成', {
        viewId: view && view.id ? view.id : null,
        viewName: view && view.name ? view.name : null
    });
}

/**
 * 初始化遮罩画布（打印区域高亮）。
 * @param {string} canvasId - 画布ID
 * @param {Object} view - 视图对象
 * @param {Object} store - Pinia store
 */
async function pwcaInitializeMaskCanvas(canvasId, view, store) {
    const flowConfig = window.pwcaGetFlowConfig ? window.pwcaGetFlowConfig(view, store) : null;
    const hasMask = flowConfig ? flowConfig.hasMask : true;

    if (!hasMask || typeof fabric === 'undefined') {
        return null;
    }

    const canvasElement = document.getElementById(canvasId);
    if (!canvasElement) {
        return null;
    }

    const canvasSize = pwcaGetCanvasDimensionsForView(view, store, { width: 456, height: 456 });
    const canvasWidth = canvasSize.width;
    const canvasHeight = canvasSize.height;

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

    if (window.pwcaUsePrintMethodStore) {
        const printMethodStore = window.pwcaUsePrintMethodStore();
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
 * 获取 base 图层有像素部分的边界。
 * @param {fabric.Object} baseLayer - base 图层对象
 * @returns {Object|null} 返回边界框信息 {left, top, width, height} 或 null
 */
function pwcaGetBaseLayerPixelBounds(baseLayer) {
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
        console.error('获取 base 图层像素边界时出错', error);
        return null;
    }
}

// 暴露到全局作用域
window.pwcaGetBaseLayerPixelBounds = pwcaGetBaseLayerPixelBounds;

/**
 * 清除所有渐变覆盖矩形。
 * @returns {number} 被移除的对象数量
 */
function pwcaClearAllGradientRects() {
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

        if (window.pwcaCanvasManager && typeof window.pwcaCanvasManager.getCanvas === 'function') {
            canvas = window.pwcaCanvasManager.getCanvas(canvasId);
            if (!canvas && fallbackId) {
                canvas = window.pwcaCanvasManager.getCanvas(fallbackId);
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
        if (window.pwcaUseCanvasStore) {
            const store = window.pwcaUseCanvasStore();
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

// Expose the canonical PWCA name.
window.pwcaClearAllGradientRects = pwcaClearAllGradientRects;

const PWCA_MULTI_VIEW_INIT_TIMEOUT_MS = 20000;
let pwcaMultiViewSubscriptionBound = false;
let pwcaMultiViewInitialized = false;
let pwcaMultiViewCompleted = false;
let pwcaMultiViewInitPromise = null;
let pwcaRejectMultiViewInitPromise = null;

function pwcaIsRenderableView(view) {
    const rawStatus = view?.status;
    if (rawStatus === undefined || rawStatus === null || String(rawStatus).trim() === '') {
        return true;
    }

    return String(rawStatus).trim().toLowerCase() === 'published';
}

function pwcaGetRenderableViews(views) {
    return Array.isArray(views) ? views.filter((view) => pwcaIsRenderableView(view)) : [];
}

function pwcaEstimateMultiViewInitTimeoutMs(views) {
    const renderableViews = pwcaGetRenderableViews(views);
    const imageLayerCount = renderableViews.reduce((count, view) => {
        const layers = pwcaGetViewRenderableLayers(view);
        return count + layers.filter((layer) => layer && layer.type === 'image').length;
    }, 0);

    const estimatedTimeout = (imageLayerCount * PWCA_IMAGE_LAYER_LOAD_TIMEOUT_MS) + 5000;
    return Math.max(PWCA_MULTI_VIEW_INIT_TIMEOUT_MS, estimatedTimeout);
}

function pwcaLogMultiView(message, payload) {
    if (payload === undefined) {
        console.info(`[PW Canvas][MultiView] ${message}`);
        return;
    }

    console.info(`[PW Canvas][MultiView] ${message}`, payload);
}

function pwcaMarkMultiViewInitializationFailed(error) {
    if (typeof pwcaRejectMultiViewInitPromise === 'function') {
        pwcaRejectMultiViewInitPromise(error);
    }

    pwcaMultiViewInitialized = false;
    pwcaMultiViewCompleted = false;
    pwcaMultiViewInitPromise = null;
    pwcaRejectMultiViewInitPromise = null;
    console.error('[PW Canvas][MultiView] 初始化失败', error);
}

/**
 * 初始化多视图容器与画布。
 * 依赖：window.pwcaUseCanvasStore、fabric、pwcaCanvasManager、PrintAreaValidator。
 */
function pwcaInitializeMultiViewCanvases(store) {
    if (!store) {
        return Promise.reject(new Error('Canvas store is required for multi-view initialization.'));
    }

    const renderableViews = pwcaGetRenderableViews(store.views);

    if (!pwcaMultiViewSubscriptionBound && typeof store.$subscribe === 'function') {
        store.$subscribe((mutation, state) => {
            const renderableStateViews = pwcaGetRenderableViews(state.views);
            if (
                mutation.storeId === 'canvas' &&
                renderableStateViews.length > 0 &&
                !pwcaMultiViewInitialized
            ) {
                pwcaMultiViewInitialized = true;
                pwcaLogMultiView('检测到已发布视图数据，开始创建多视图容器', { viewCount: renderableStateViews.length });
                pwcaCreateViewContainers(renderableStateViews, store).catch((error) => {
                    pwcaMarkMultiViewInitializationFailed(error);
                });
            }
        });

        pwcaMultiViewSubscriptionBound = true;
    }

    if (renderableViews.length === 0) {
        pwcaMultiViewCompleted = true;
        pwcaLogMultiView('没有可渲染的 published 视图，跳过多视图初始化。');
        return Promise.resolve({
            initialized: true,
            activeViewId: null,
            viewCount: 0
        });
    }

    if (renderableViews.length > 0 && !pwcaMultiViewInitialized) {
        pwcaMultiViewInitialized = true;
        pwcaLogMultiView('使用现有已发布视图数据初始化多视图容器', { viewCount: renderableViews.length });
        return pwcaCreateViewContainers(renderableViews, store).catch((error) => {
            pwcaMarkMultiViewInitializationFailed(error);
            throw error;
        });
    }

    if (pwcaMultiViewCompleted) {
        return Promise.resolve({
            initialized: true,
            views: Array.isArray(store.views) ? store.views : []
        });
    }

    pwcaLogMultiView('视图数据尚未就绪，等待 store 更新后继续。');
    return Promise.resolve({
        initialized: false,
        waitingForViews: true
    });
}

/**
 * 创建视图容器并初始化对应的多图层画布
 * @param {Array} views - 视图数组
 * @param {Object} store - Pinia store
 */
function pwcaCreateViewContainers(views, store) {
    const renderableViews = pwcaGetRenderableViews(views);
    const multiViewContainer = document.getElementById('multi-view-container');
    if (!multiViewContainer) {
        const error = new Error('Multi-view container not found');
        console.error(error.message);
        return Promise.reject(error);
    }

    multiViewContainer.innerHTML = '';

    if (renderableViews.length === 0) {
        const initCompleteEvent = new CustomEvent('multiViewInitComplete');
        document.dispatchEvent(initCompleteEvent);
        pwcaMultiViewCompleted = true;
        pwcaLogMultiView('没有可渲染的 published 视图，已清空多视图容器。');
        return Promise.resolve({
            activeViewId: null,
            viewCount: 0
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');

    let targetViewIndex = 0;
    if (viewParam && viewParam !== 'main') {
        const foundIndex = renderableViews.findIndex(
            (v) =>
                v.id === viewParam ||
                v.view_id === viewParam ||
                String(v.id) === String(viewParam)
        );
        if (foundIndex !== -1) {
            targetViewIndex = foundIndex;
        }
    }

    const initPromises = renderableViews.map((view, index) => {
        const canvasSize = pwcaGetCanvasDimensionsForView(view, store, { width: 567, height: 567 });
        const canvasWidth = canvasSize.width;
        const canvasHeight = canvasSize.height;

        const viewContainer = document.createElement('div');
        viewContainer.id = `view-container-${view.id}`;
        viewContainer.className = 'pwca-view-container';
        viewContainer.style.cssText = `
            position: relative;
            width: ${canvasWidth}px;
            height: ${canvasHeight}px;
            display: ${index === targetViewIndex ? 'block' : 'none'};
        `;

        const canvasHtml = `
            <div class="pwca-canvas-wrapper pwca-canvas-wrapper--base" id="baseWrapper-${view.id}">
                <canvas id="baseCanvas-${view.id}"></canvas>
            </div>
            <div class="pwca-canvas-wrapper pwca-canvas-wrapper--main" id="mainWrapper-${view.id}">
                <canvas id="mainCanvas-${view.id}"></canvas>
            </div>
            <div class="pwca-canvas-wrapper pwca-canvas-wrapper--overlay" id="overlayWrapper-${view.id}">
                <canvas id="overlayCanvas-${view.id}"></canvas>
            </div>
            <div class="pwca-canvas-wrapper pwca-canvas-wrapper--mask" id="maskWrapper-${view.id}">
                <canvas id="maskCanvas-${view.id}"></canvas>
            </div>
        `;

        viewContainer.innerHTML = canvasHtml;
        multiViewContainer.appendChild(viewContainer);

        // 初始化时主动隐藏印刷区域遮罩，避免直接进入设计页时 mask 一直亮着。
        // 后续 controlMaskCanvasFromMain / controlMaskCanvasVisibility 在用户操作了
        // 带 groupId 的图层时会再切回 'block'，不影响现有逻辑。
        const initialMaskWrapper = viewContainer.querySelector(`#maskWrapper-${view.id}`);
        if (initialMaskWrapper) {
            initialMaskWrapper.style.display = 'none';
        }

        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                try {
                    await pwcaInitializeMultiLayerCanvases(view, store);
                    await pwcaInitializeMaskCanvas(`maskCanvas-${view.id}`, view, store);
                    resolve();
                } catch (error) {
                    console.error('[PW Canvas][MultiView] 单个视图初始化失败', {
                        viewId: view && view.id ? view.id : null,
                        viewName: view && view.name ? view.name : null,
                        error
                    });
                    reject(error);
                }
            }, 100);
        });
    });

    return Promise.all(initPromises)
        .then(() => {
            const targetView = renderableViews[targetViewIndex];
            if (targetView) {
                store.setActiveViewId(targetView.id);

                if (window.pwcaCanvasManager) {
                    window.pwcaCanvasManager.setActiveCanvas(targetView.id);
                    const canvas = window.pwcaCanvasManager.getCanvas(targetView.id);
                    if (canvas) {
                        if (window.pwcaSetGlobalCanvas) {
                            window.pwcaSetGlobalCanvas(canvas);
                        } else {
                            window.pwcaCanvas = canvas;
                            window.pwcaFabricCanvas = canvas;
                        }
                    }
                }
            }

            const initCompleteEvent = new CustomEvent('multiViewInitComplete');
            document.dispatchEvent(initCompleteEvent);
            pwcaMultiViewCompleted = true;
            pwcaLogMultiView('多视图初始化完成', {
                activeViewId: targetView ? targetView.id : null,
                viewCount: renderableViews.length
            });

            return {
                activeViewId: targetView ? targetView.id : null,
                viewCount: renderableViews.length
            };
        })
        .catch((error) => {
            console.error('Error initializing views:', error);
            throw error;
        });
}

function pwcaEnsureMultiViewInitialization(store) {
    if (pwcaMultiViewInitPromise) {
        return pwcaMultiViewInitPromise;
    }

    pwcaMultiViewInitPromise = new Promise((resolve, reject) => {
        let settled = false;
        pwcaRejectMultiViewInitPromise = (error) => {
            if (settled) {
                return;
            }

            settled = true;
            cleanup();
            pwcaMultiViewInitPromise = null;
            reject(error);
        };

        const cleanup = () => {
            document.removeEventListener('multiViewInitComplete', handleComplete);
            clearTimeout(timeoutId);
        };

        const handleComplete = () => {
            if (settled) {
                return;
            }

            settled = true;
            cleanup();
            pwcaRejectMultiViewInitPromise = null;
            resolve({
                initialized: true,
                store: store || (typeof window.pwcaUseCanvasStore === 'function' ? window.pwcaUseCanvasStore() : null)
            });
        };

        const timeoutMs = pwcaEstimateMultiViewInitTimeoutMs(store && Array.isArray(store.views) ? store.views : []);
        const timeoutId = setTimeout(() => {
            if (settled) {
                return;
            }

            settled = true;
            cleanup();
            pwcaMarkMultiViewInitializationFailed(new Error('Timed out waiting for multi-view initialization.'));
            reject(new Error('Timed out waiting for multi-view initialization.'));
        }, timeoutMs);

        document.addEventListener('multiViewInitComplete', handleComplete, { once: true });

        Promise.resolve(pwcaInitializeMultiViewCanvases(store))
            .then((result) => {
                if (result && settled === false && (result.initialized === true || Object.prototype.hasOwnProperty.call(result, 'viewCount'))) {
                    handleComplete();
                }
            })
            .catch((error) => {
                if (settled) {
                    return;
                }

                settled = true;
                cleanup();
                pwcaRejectMultiViewInitPromise = null;
                pwcaMarkMultiViewInitializationFailed(error);
                reject(error);
            });
    });

    return pwcaMultiViewInitPromise;
}

window.pwcaEnsureMultiViewInitialization = pwcaEnsureMultiViewInitialization;
