/**
 * Canvas API Renderer
 * 用于从API数据渲染Fabric.js画布的工具函数
 */

/**
 * @description Renders a Fabric.js canvas from API data with the new structure.
 * @param {string} canvasId - The ID of the <canvas> element.
 * @param {object} apiData - The API response data containing the layer configuration.
 */
async function renderCanvasFromAPI(canvasId, apiData) {
    // Find the background layer to determine canvas size, or use defaults.
    const backgroundLayer = apiData.layer_config.layers.find(l => l.name === "Background Layer");
    const canvasWidth = backgroundLayer ? backgroundLayer.layerData.dimensions.layerSize.width : 900;
    const canvasHeight = backgroundLayer ? backgroundLayer.layerData.dimensions.layerSize.height : 900;

    // Initialize Fabric.js on our <canvas> element.
    const canvas = new fabric.Canvas(canvasId, {
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: '#f9fafb', // Corresponds to bg-gray-50
    });

    // Extract layers and sort by zIndex to ensure correct stacking order.
    const layers = apiData.layer_config.layers.sort((a, b) => {
        return a.layerData.position.zIndex.value - b.layerData.position.zIndex.value;
    });

    // Helper function to get originX and originY from the anchorPoint string.
    const getOriginFromAnchor = (anchor) => {
        const parts = anchor.split('-'); // e.g., 'top-center' -> ['top', 'center']
        let originY = 'center';
        let originX = 'center';

        if (parts.includes('top')) originY = 'top';
        if (parts.includes('bottom')) originY = 'bottom';
        if (parts.includes('left')) originX = 'left';
        if (parts.includes('right')) originX = 'right';

        return { originX, originY };
    };

    // Process each layer and add it to the canvas.
    for (const layer of layers) {
        const data = layer.layerData;
        const { originX, originY } = getOriginFromAnchor(data.position.anchorPoint);

        // 生成唯一的图层ID
        const layerId = generateLayerId(layer.name);
        
        // Common properties for all objects to avoid repetition.
        const commonProps = {
            id: layerId, // 添加唯一ID
            left: data.position.coordinates.x,
            top: data.position.coordinates.y,
            angle: data.position.rotation,
            originX: originX,
            originY: originY,
            opacity: (data.content.opacity || 100) / 100, // Convert 0-100 scale to 0-1
            lockMovementX: !data.controls.movable,
            lockMovementY: !data.controls.movable,
            lockRotation: !data.controls.rotatable,
            lockScalingX: !data.controls.scalable,
            lockScalingY: !data.controls.scalable,
            hasControls: data.controls.movable || data.controls.rotatable || data.controls.scalable,
            selectable: data.controls.movable || data.controls.rotatable || data.controls.scalable,
            cornerSize: 10,
            transparentCorners: false,
            borderColor: '#3b82f6', // blue-500
            cornerColor: '#3b82f6',
            // Custom data to identify layer
            data: { 
                name: layer.name,
                apiLayer: layer // 保存原始API图层数据
            }
        };

        let fabricObject = null;

        // Handle TEXT layers
        if (layer.type === 'text' || data.content.contentType === 'text') {
            const font = data.content.font || {};
            fabricObject = new fabric.Text(data.content.text || 'Default Text', {
                ...commonProps,
                fontFamily: font.family || 'Helvetica',
                fontSize: font.size || 36,
                fill: font.color || '#000000',
                width: data.dimensions.layerSize.width,
                height: data.dimensions.layerSize.height,
            });
            canvas.add(fabricObject);
        }
        // Handle IMAGE layers and other visual elements
        else if (layer.type === 'image') {
            // If a background color is specified, create a rectangle.
            if (data.content.backgroundColor) {
                fabricObject = new fabric.Rect({
                    ...commonProps,
                    width: data.dimensions.layerSize.width,
                    height: data.dimensions.layerSize.height,
                    fill: data.content.backgroundColor,
                    selectable: false, // Background should not be selectable
                    evented: false,
                });
                canvas.add(fabricObject);
            }
            // If an image URL is provided, load the image.
            else if (data.content.imageUrl) {
                await new Promise(resolve => {
                    fabric.Image.fromURL(data.content.imageUrl, (img) => {
                        img.set({ ...commonProps });
                        img.scaleToWidth(data.dimensions.layerSize.width);
                        if (!data.controls.constraints?.keepAspectRatio) {
                            img.scaleToHeight(data.dimensions.layerSize.height);
                        }
                        canvas.add(img);
                        resolve();
                    }, { crossOrigin: 'anonymous' });
                });
            }
            // Otherwise, create a placeholder rectangle to show the area.
            else {
                fabricObject = new fabric.Rect({
                    ...commonProps,
                    width: data.dimensions.layerSize.width,
                    height: data.dimensions.layerSize.height,
                    fill: 'rgba(156, 163, 175, 0.2)', // gray-400 with 20% opacity
                    stroke: '#6b7280', // gray-500
                    strokeDashArray: [5, 5],
                    strokeWidth: 1,
                });
                canvas.add(fabricObject);
            }
        }

        // Note: Modifying the prototype globally can have unintended side effects.
        // A better approach is to set control visibility per object.
        // However, to maintain original logic, this is kept similar.
        if (fabricObject && !data.controls.deletable) {
            // This custom logic from the original code removes middle scaling handles.
            fabricObject.setControlsVisibility({
                ml: false,
                mr: false
            });
        }
    }

    // Render all objects on the canvas.
    canvas.renderAll();
    
    // Store canvas reference globally for other functions to access
    window.canvas = canvas;
    window.fabricCanvas = canvas;
    
    // 如果存在全局的setGlobalCanvas函数，调用它
    if (typeof window.setGlobalCanvas === 'function') {
        window.setGlobalCanvas(canvas);
    }
    
    // 为画布添加事件监听器以支持图层管理
    setupCanvasEventListeners(canvas);
    
    // 如果存在全局的初始化事件监听器函数，也调用它
    if (typeof window.initializeCanvasEventListeners === 'function') {
        window.initializeCanvasEventListeners(canvas);
    }
    
    // 同步图层到Pinia store（如果可用）
    syncLayersToStore(canvas, layers);
    
    console.log('Canvas rendered from API data with', layers.length, 'layers');
    
    return canvas;
}

/**
 * 初始化画布并从API数据加载默认内容
 * @param {string} canvasId - 画布元素ID
 * @param {string} pwId - 产品ID，用于获取API数据
 */
async function initCanvasFromAPI(canvasId, pwId) {
    if (!pwId) {
        console.warn('No product ID provided, skipping API canvas initialization');
        return null;
    }
    
    try {
        // 从API获取产品数据
        const response = await fetch(`/wp-json/pw/v1/product-data/${pwId}`);
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const productData = await response.json();
        
        // 检查是否有模板数据
        if (!productData.templates || !productData.templates.data) {
            console.warn('No template data found in API response');
            return null;
        }
        
        // 检查是否有layer_config
        const templateData = productData.templates.data;
        let layerConfig = null;
        
        // 尝试从不同的数据结构中获取layer_config
        if (templateData.layer_config) {
            layerConfig = templateData;
        } else if (templateData.custom_view && templateData.custom_view.main_custom_view && templateData.custom_view.main_custom_view.layer_config) {
            layerConfig = templateData.custom_view.main_custom_view;
        } else if (templateData.main_custom_view && templateData.main_custom_view.layer_config) {
            layerConfig = templateData.main_custom_view;
        }
        
        if (!layerConfig || !layerConfig.layer_config || !layerConfig.layer_config.layers) {
            console.warn('No layer configuration found in template data, available data:', templateData);
            
            // 如果没有找到layer_config，创建一个简单的示例画布
            console.log('Creating fallback canvas with sample content');
            const canvas = new fabric.Canvas(canvasId, {
                width: 400,
                height: 300,
                backgroundColor: '#f9fafb'
            });
            
            // 添加一个示例文本
            const sampleText = new fabric.Text('API数据加载中...', {
                left: 200,
                top: 150,
                fontSize: 20,
                fill: '#666666',
                fontFamily: 'Arial',
                originX: 'center',
                originY: 'center',
                selectable: false
            });
            
            canvas.add(sampleText);
            canvas.renderAll();
            
            // 存储画布引用
            window.canvas = canvas;
            window.fabricCanvas = canvas;
            
            return canvas;
        }
        
        console.log('Initializing canvas from API data:', layerConfig);
        
        // 渲染画布
        const canvas = await renderCanvasFromAPI(canvasId, layerConfig);
        
        // 触发自定义事件，通知其他组件画布已初始化
        document.dispatchEvent(new CustomEvent('canvasInitializedFromAPI', {
            detail: { canvas, productData, layerConfig }
        }));
        
        return canvas;
        
    } catch (error) {
        console.error('Failed to initialize canvas from API:', error);
        return null;
    }
}

/**
 * 生成唯一的图层ID
 * @param {string} layerName - 图层名称
 * @returns {string} 唯一的图层ID
 */
function generateLayerId(layerName) {
    // 使用全局layerCounter（如果存在）或创建本地计数器
    if (typeof window.layerCounter !== 'undefined') {
        return 'layer_' + (++window.layerCounter);
    } else {
        // 创建基于时间戳和随机数的唯一ID
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 5);
        return `layer_${timestamp}_${random}`;
    }
}

/**
 * 为画布设置事件监听器以支持图层管理
 * @param {fabric.Canvas} canvas - Fabric.js画布实例
 */
function setupCanvasEventListeners(canvas) {
    // 监听对象添加事件
    canvas.on('object:added', function(e) {
        const obj = e.target;
        if (obj && !obj.id) {
            // 为新添加的对象生成ID
            obj.id = 'layer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        
        // 同步到Pinia store的图层管理系统
        if (window.useCanvasStore && obj && obj.id) {
            try {
                const store = window.useCanvasStore();
                const currentViewId = store.activeViewId;
                
                if (currentViewId) {
                    // 检查图层是否已存在，避免重复添加
                    const currentViewLayers = store.getViewLayers(currentViewId);
                    const existingLayer = currentViewLayers.find(layer => layer.id === obj.id);
                    
                    if (!existingLayer) {
                        const layerName = getLayerNameFromObject(obj);
                        const layerType = getLayerTypeFromObject(obj);
                        
                        const newLayer = {
                            id: obj.id,
                            name: layerName,
                            type: layerType,
                            visible: obj.visible !== false,
                            locked: !obj.selectable,
                            groupId: obj.groupId || null,
                            groupOrder: obj.groupOrder || 0
                        };
                        
                        store.addLayerToView(currentViewId, newLayer);
                        console.log('Layer added to store:', newLayer);
                    }
                }
            } catch (error) {
                console.error('Failed to sync added object to store:', error);
            }
        }
        
        // 兼容旧的图层管理系统
        if (typeof window.addLayerItem === 'function') {
            window.addLayerItem(obj);
        }
    });
    
    // 监听对象选择事件
    canvas.on('selection:created', function(e) {
        const activeObject = e.selected[0];
        if (activeObject && activeObject.id) {
            // 同步选择状态到store
            if (window.useCanvasStore) {
                const store = window.useCanvasStore();
                store.setActiveObjectId(activeObject.id);
            }
        }
    });
    
    // 监听对象选择更新事件
    canvas.on('selection:updated', function(e) {
        const activeObject = e.selected[0];
        if (activeObject && activeObject.id) {
            // 同步选择状态到store
            if (window.useCanvasStore) {
                const store = window.useCanvasStore();
                store.setActiveObjectId(activeObject.id);
            }
        }
    });
    
    // 监听对象取消选择事件
    canvas.on('selection:cleared', function() {
        if (window.useCanvasStore) {
            const store = window.useCanvasStore();
            store.setActiveObjectId(null);
        }
    });
    
    // 监听对象删除事件
    canvas.on('object:removed', function(e) {
        const obj = e.target;
        if (obj && obj.id) {
            // 从store中移除图层
            if (window.useCanvasStore) {
                const store = window.useCanvasStore();
                const currentViewId = store.activeViewId;
                if (currentViewId) {
                    store.removeLayerFromView(currentViewId, obj.id);
                    
                    // 如果删除的是当前选中的图层，清除选中状态
                    if (store.activeObjectId === obj.id) {
                        store.setActiveObjectId(null);
                    }
                }
            }
        }
    });
    
    // 监听对象修改事件（用于更新缩略图）
    canvas.on('object:modified', function(e) {
        const obj = e.target;
        if (obj && obj.id) {
            // 触发缩略图刷新
            setTimeout(() => {
                const refreshEvent = new CustomEvent('layerThumbnailRefresh', {
                    detail: { layerId: obj.id }
                });
                document.dispatchEvent(refreshEvent);
            }, 100);
        }
    });
}

/**
 * 从Fabric对象获取图层名称
 * @param {fabric.Object} obj - Fabric对象
 * @returns {string} 图层名称
 */
function getLayerNameFromObject(obj) {
    // 优先使用对象上设置的 layerName 属性
    if (obj.layerName) {
        return obj.layerName;
    }
    
    // 根据对象类型生成名称
    if (obj.type === 'text' || obj.type === 'i-text') {
        const text = obj.text || '';
        return text.length > 15 ? text.substring(0, 15) + '...' : text || 'Text Layer';
    } else if (obj.type === 'image') {
        return 'Image Layer';
    } else if (obj.type === 'rect') {
        return 'Rectangle';
    } else if (obj.type === 'circle') {
        return 'Circle';
    } else {
        return 'Layer';
    }
}

/**
 * 从Fabric对象获取图层类型
 * @param {fabric.Object} obj - Fabric对象
 * @returns {string} 图层类型
 */
function getLayerTypeFromObject(obj) {
    // 优先使用对象上设置的 layerType 属性
    if (obj.layerType) {
        return obj.layerType;
    }
    
    // 根据Fabric对象类型映射
    if (obj.type === 'text' || obj.type === 'i-text') {
        return 'text';
    } else if (obj.type === 'image') {
        return 'image';
    } else {
        return 'other';
    }
}

/**
 * 将画布对象同步到Pinia store的图层管理系统
 * @param {fabric.Canvas} canvas - Fabric.js画布实例
 * @param {Array} apiLayers - 从API获取的图层数据
 */
function syncLayersToStore(canvas, apiLayers) {
    if (!window.useCanvasStore) {
        return;
    }
    
    const store = window.useCanvasStore();
    const currentViewId = store.activeViewId;
    
    if (!currentViewId) {
        return;
    }
    
    // 将API图层数据转换为store格式
    const storeLayers = apiLayers.map((apiLayer, index) => {
        const canvasObject = canvas.getObjects()[index];
        
        return {
            id: canvasObject ? canvasObject.id : `api_layer_${index}`,
            name: apiLayer.name || `Layer ${index + 1}`,
            type: apiLayer.type || 'unknown',
            visible: true,
            locked: false,
            groupId: null,
            groupOrder: 0,
            zIndex: apiLayer.layerData?.position?.zIndex?.value || index,
            // 保存原始API数据以备后用
            apiData: apiLayer
        };
    });
    
    // 按zIndex排序
    storeLayers.sort((a, b) => a.zIndex - b.zIndex);
    
    // 更新store中的图层数据
    store.setViewLayers(currentViewId, storeLayers);
    
    console.log('Synced', storeLayers.length, 'layers to store for view:', currentViewId);
}

/**
 * 根据视图数据获取对应的图层配置
 * @param {Object} viewData - 视图数据
 * @returns {Object|null} 图层配置数据
 */
function getLayerConfigFromViewData(viewData) {
    if (!viewData) return null;
    
    // 检查不同的数据结构
    if (viewData.layer_config) {
        return viewData;
    }
    
    if (viewData.data && viewData.data.layer_config) {
        return viewData.data;
    }
    
    return null;
}

/**
 * 为特定视图初始化画布
 * @param {string} canvasId - 画布元素ID
 * @param {Object} viewData - 视图数据
 * @returns {Promise<fabric.Canvas|null>} 初始化的画布实例
 */
async function initCanvasForView(canvasId, viewData) {
    const layerConfig = getLayerConfigFromViewData(viewData);
    
    if (!layerConfig || !layerConfig.layer_config || !layerConfig.layer_config.layers) {
        console.warn('No valid layer configuration found for view:', viewData.name);
        return null;
    }
    
    console.log('Initializing canvas for view:', viewData.name, 'with config:', layerConfig);
    
    try {
        const canvas = await renderCanvasFromAPI(canvasId, layerConfig);
        
        // 触发视图特定的初始化完成事件
        document.dispatchEvent(new CustomEvent('viewCanvasInitialized', {
            detail: { 
                canvas, 
                viewData, 
                layerConfig,
                canvasId 
            }
        }));
        
        return canvas;
    } catch (error) {
        console.error('Failed to initialize canvas for view:', viewData.name, error);
        return null;
    }
}

// 将函数暴露到全局作用域
window.renderCanvasFromAPI = renderCanvasFromAPI;
window.initCanvasFromAPI = initCanvasFromAPI;
window.initCanvasForView = initCanvasForView;
window.setupCanvasEventListeners = setupCanvasEventListeners;
window.syncLayersToStore = syncLayersToStore;
window.generateLayerId = generateLayerId;