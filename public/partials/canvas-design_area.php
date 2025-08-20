<?php
// 获取产品图片URL
$image_url = '';
$color_image_url = '';
$model_3d_url = ''; // 新增：获取3D模型URL变量
if ($product_id > 0 && $product) {
    $image_id = $product->get_image_id();
    if ($image_id) {
        $image_url = wp_get_attachment_image_url($image_id, 'full');
    }
    // 获取base 图层
    $color_image_url = get_post_meta($product_id, 'pw_mainIMG_color', true) ?: 'https://pwfiles.939666.xyz/t-shirt/color.png';
    // 获取3D模型文件
    $model_3d_url = get_post_meta($product_id, 'pw_3d_file', true);

    // 获取容器图层
    $pw_container  = get_post_meta($product_id, 'pw_container', true);
    // 获取 4格图层
    $pw_4_grid = get_post_meta($product_id, 'pw_4-grid', true);

    $pw_bg = get_post_meta($product_id, 'pw_bg', true);

    // 如果 pw_3d_file 存在 ，则 $image_url 和 $color_image_url 值就为空
    if ($model_3d_url) {
        $image_url = '';
        $color_image_url = '';
    }

    // 如果 $pw_4_grid 存在且不为空 那么 
    if ($pw_4_grid) {
        $image_url = $pw_4_grid;
        // 获取图片尺寸
        $image_size = getimagesize($pw_4_grid);
        $image_width = $image_size[0];
        $image_height = $image_size[1];
        // 计算等比例高度（基于500px宽度）
        $canvas_width = 500;
        $canvas_height = round(($canvas_width / $image_width) * $image_height);
    }
}

// 准备图片数据
$first_image_url = $color_image_url;
if (strpos($color_image_url, ',') !== false) {
    $image_urls = explode(',', $color_image_url);
    $first_image_url = trim($image_urls[0]);
}
// 获取图片尺寸
$first_image_width = 0;
$first_image_height = 0;
if ($first_image_url) {
    // 如果 $first_image_url 是以 / 开头的相对路径，补全为绝对路径
    if (strpos($first_image_url, '/') === 0) {
        $first_image_url_full = $_SERVER['DOCUMENT_ROOT'] . $first_image_url;
    } else {
        $first_image_url_full = $first_image_url;
    }
    $img_size = getimagesize($first_image_url_full);
    if ($img_size) {
        $first_image_width = $img_size[0];
        $first_image_height = $img_size[1];
    }
}
?>

<!-- 多视图容器 -->
<div id="multi-view-container">
    <!-- 视图容器将通过 JavaScript 动态生成 -->
</div>



<script>
    /**
     * 将 API 中的 anchorPoint 字符串转换为 Fabric.js 的 originX 和 originY。
     * @param {string} anchorPoint - 例如 "top-left", "center"。
     * @returns {{originX: string, originY: string}} Fabric.js 的原点对象。
     */
    function getOriginFromAnchorPoint(anchorPoint) {
        // anchorPoint 输出到控制台
        console.log(anchorPoint)

        // 处理单个值的情况（如'center'）
        if (anchorPoint === 'center') {
            return {
                originX: 'center',
                originY: 'center'
            };
        }

        const [y, x] = anchorPoint.split('-');
        const originMap = {
            top: 'top',
            center: 'center',
            bottom: 'bottom',
            left: 'left',
            right: 'right',
        };
        return {
            originX: originMap[x || 'center'],
            originY: originMap[y || 'center']
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

        // 根据originX调整x坐标
        if (originX === 'center') {
            convertedX = x + width / 2;
        } else if (originX === 'right') {
            convertedX = x + width;
        }
        // originX === 'left' 时不需要调整，保持原值

        // 根据originY调整y坐标
        if (originY === 'center') {
            convertedY = y + height / 2;
        } else if (originY === 'bottom') {
            convertedY = y + height;
        }
        // originY === 'top' 时不需要调整，保持原值

        return {
            x: convertedX,
            y: convertedY
        };
    }

    /**
     * 辅助函数，用于从图层数据对象创建一个 Fabric.js 对象。
     * @param {object} layer - 来自 API 的单个图层对象。
     * @returns {Promise<fabric.Object|null>} 一个 Promise，如果图层无法创建，则解析为 fabric 对象或 null。
     */
    function createFabricObjectFromLayer(layer) {
        return new Promise((resolve, reject) => {
            const data = layer.layer_data;
            const controls = data.controls;
            const position = data.position;

            switch (layer.type) {
                case 'image':
                    if (!data.content.imageURL) {
                        console.warn(`因缺少 imageURL，正在跳过图片图层 "${layer.name}"。`);
                        resolve(null);
                        return;
                    }

                    fabric.Image.fromURL(data.content.imageURL, (img) => {
                        const origins = getOriginFromAnchorPoint(position.anchorPoint || 'top-left');

                        // 使用坐标转换函数处理不同原点的坐标
                        const convertedCoords = convertCoordinatesForOrigin(
                            position.coordinates.x,
                            position.coordinates.y,
                            data.dimensions.layerSize.width,
                            data.dimensions.layerSize.height,
                            origins.originX,
                            origins.originY
                        );

                        img.set({
                            left: convertedCoords.x,
                            top: convertedCoords.y,
                            angle: position.rotation,
                            originX: origins.originX,
                            originY: origins.originY,
                            width: data.dimensions.layerSize.width,
                            height: data.dimensions.layerSize.height,
                            opacity: data.content.opacity / 100,
                            selectable: controls.movable,
                            evented: controls.movable,
                            lockRotation: !controls.rotatable,
                            lockScalingX: !controls.scalable,
                            lockScalingY: !controls.scalable,
                            hasControls: controls.movable && controls.scalable,
                            hasBorders: controls.movable,
                            name: layer.name
                        });
                        resolve(img);
                    }, {
                        crossOrigin: 'anonymous'
                    });
                    break;

                default:
                    console.warn(`未知的图层类型: "${layer.type}" (图层名: "${layer.name}")。`);
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
        if (layerObject && typeof layerObject.applyFilters === 'function') {
            const colorFilter = new fabric.Image.filters.BlendColor({
                color: color, // 混合颜色
                mode: 'tint', // 使用 tint 模式实现色调效果
                alpha: alpha // 透明度: 0-1，值越大色调效果越明显
            });
            // 应用滤镜
            layerObject.filters = [colorFilter];
            layerObject.applyFilters();
        }
    }

    // 将函数暴露到全局作用域，供其他模块使用
    window.applyTintFilter = applyTintFilter;

    /**
     * 应用渐变色滤镜到图层对象
     * @param {fabric.Object} layerObject - 要应用滤镜的图层对象
     * @param {string} color1 - 渐变起始颜色
     * @param {string} color2 - 渐变结束颜色
     * @param {string} direction - 渐变方向
     */
    function applyGradientFilter(layerObject, color1 = '#ff0000', color2 = '#0000ff', direction = 'to right') {
        if (layerObject && typeof layerObject.applyFilters === 'function') {
            // 由于fabric.js的自定义滤镜实现复杂，我们使用一个更简单的方法
            // 创建一个渐变色的混合滤镜，模拟渐变效果
            try {
                // 使用BlendColor滤镜创建渐变效果的近似实现
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

                // 应用多个滤镜来模拟渐变效果
                layerObject.filters = [blendFilter1, blendFilter2];
                layerObject.applyFilters();

                console.log(`已应用渐变色滤镜: ${color1} 到 ${color2}`);
            } catch (error) {
                console.warn('渐变滤镜不支持，使用色调滤镜作为降级方案:', error);
                // 使用第一个颜色作为降级方案
                applyTintFilter(layerObject, color1, 0.7);
            }
        }
    }

    // 将渐变滤镜函数暴露到全局作用域
    window.applyGradientFilter = applyGradientFilter;

    /**
     * 将单个图层对象添加到指定的 Fabric.js 画布实例上。
     * @param {fabric.Canvas} canvas - Fabric.js 的画布实例。
     * @param {object} layer - 要渲染的单个图层对象。
     * @param {object} store - Pinia store 实例。
     * @param {object} view - 当前视图对象。
     * @returns {Promise<fabric.Object|null>} 返回创建的 fabric 对象。
     */
    async function renderLayer(canvas, layer, store, view) {



        if (!canvas || !layer) {
            console.error("渲染单个图层需要有效的画布实例和图层数据。");
            return null;
        }
        try {
            const fabricObject = await createFabricObjectFromLayer(layer);

            // 根据 productViewFlow 控制显示的图层
            const productViewFlow = store.getProductViewFlow();
            
            if (productViewFlow === '4-Grid Flow') {
                // 当 productViewFlow 为 "4-Grid Flow" 时，只允许显示 "4-Grid Flow" 层
                if (layer.name !== '4-Grid Flow') {
                    console.log(`跳过图层 "${layer.name}"，因为当前 productViewFlow 为 "4-Grid Flow"`);
                    return null;
                }
            } else {
                // 当 productViewFlow 不是 "4-Grid Flow" 时，显示 Base Layer 和 Overlay Layer，跳过 4-Grid Flow
                if (layer.name === 'Base Layer' || layer.name === 'Overlay Layer') {
                    // 允许显示
                } else if (layer.name === '4-Grid Flow') {
                    console.log(`跳过图层 "${layer.name}"，因为当前 productViewFlow 不是 "4-Grid Flow"`);
                    return null;
                } else {
                    return null;
                }
            }




            // 如果满足条件（图层名称为 Base Layer），将对象存入 Pinia store
            if (fabricObject && layer.name === 'Base Layer' && view && store) {
                // 确保 views 数组和对应的 view 对象存在
                if (store.views && store.views.length > 0) {
                    const viewIndex = store.views.findIndex(v => v.id === view.id);
                    if (viewIndex !== -1) {
                        // 将 fabricObject 存入 views[view.id].base_layer
                        if (!store.views[viewIndex].base_layer) {
                            store.views[viewIndex].base_layer = {};
                        }
                        store.views[viewIndex].base_layer = fabricObject;
                        console.log(`Base Layer 对象已存入 Pinia store: views[${view.id}].base_layer`);

                        // 从pinia 中取出这个 图片对象 修改颜色
                        applyTintFilter(store.views[viewIndex].base_layer, '#ff0000', 1);
                        // 重新渲染画布以显示滤镜效果
                    }
                }
            }




            if (fabricObject) {
                canvas.add(fabricObject);
                console.log(`该图层 "${layer.name}" 已被添加到画布。`);
                return fabricObject;
            }
            return null;
        } catch (error) {
            console.error(`渲染图层 "${layer.name}" 时发生错误:`, error);
            return null;
        }
    }

    /**
     * 主函数，通过调用 renderLayer 来将视图中的所有图层批量渲染到 Fabric.js 画布上。
     * @param {string} canvasId - HTML canvas 元素的 ID。
     * @param {object} viewData - 来自 API 的包含 layer_config 的视图数据对象。
     * @returns {Promise<fabric.Canvas|null>} 一个 Promise，解析为创建好的 Fabric.js 画布实例或 null。
     */
    async function renderView(canvasId, view, store) {
        const viewData = view.data;
        const layerConfig = viewData?.layer_config;
        if (!layerConfig || !layerConfig.layers || layerConfig.layers.length === 0) {
            console.error("未在视图数据中找到有效的图层配置进行渲染。");
            return null;
        }

        const layers = layerConfig.layers;
        
        // 根据 productViewFlow 决定从哪个图层获取画布尺寸
        const productViewFlow = store.getProductViewFlow();
        let targetLayer = layers[0]; // 默认使用第一个图层
        
        if (productViewFlow === '4-Grid Flow') {
            // 查找 "4-Grid Flow" 图层
            const gridFlowLayer = layers.find(layer => layer.name === '4-Grid Flow');
            if (gridFlowLayer) {
                targetLayer = gridFlowLayer;
                console.log('使用 4-Grid Flow 图层的尺寸初始化画布');
            } else {
                console.warn('未找到 4-Grid Flow 图层，使用默认图层尺寸');
            }
        }
        
        const canvasWidth = targetLayer.layer_data.dimensions.contentArea.width || targetLayer.layer_data.dimensions.layerSize.width;
        const canvasHeight = targetLayer.layer_data.dimensions.contentArea.height || targetLayer.layer_data.dimensions.layerSize.height;

        const canvas = new fabric.Canvas(canvasId, {
            width: canvasWidth,
            height: canvasHeight,
            backgroundColor: '#f0f0f0',
        });

        // 为 canvas 添加事件监听器
        if (window.initializeCanvasEventListeners) {
            window.initializeCanvasEventListeners(canvas);
        }

        // 将 Canvas 实例与 DOM 元素关联
        const mainCanvasElement = document.getElementById(canvasId);
        if (mainCanvasElement) {
            mainCanvasElement.__fabricCanvas = canvas;
            mainCanvasElement.__viewId = view.id;
        }

        // 使用 CanvasManager 管理 canvas 实例
        if (window.CanvasManager) {
            // 将 canvas 实例注册到 CanvasManager
            window.CanvasManager._canvasMap[view.id] = canvas;
            if (store.activeViewId === view.id) {
                window.CanvasManager.setActiveCanvas(view.id);
            }
        }
        // 如果是第一个视图，设置为全局 canvas
        if (store.activeViewId === view.id) {
            window.canvas = canvas;
            window.fabricCanvas = canvas;
        }

        try {
            const sortedLayers = [...layers].sort((a, b) => a.sort_order - b.sort_order);

            for (const layer of sortedLayers) {
                await renderLayer(canvas, layer, store, view);
            }

            // 创建红色遮罩对象
            const maskWidth = canvasWidth;
            const maskHeight = canvasHeight;
            const cutoutWidth = 200;
            const cutoutHeight = 240;

            // 创建遮罩路径，中心镂空
            const maskPath = `M 0 0 L ${maskWidth} 0 L ${maskWidth} ${maskHeight} L 0 ${maskHeight} Z M ${(maskWidth - cutoutWidth) / 2} ${(maskHeight - cutoutHeight) / 2} L ${(maskWidth + cutoutWidth) / 2} ${(maskHeight - cutoutHeight) / 2} L ${(maskWidth + cutoutWidth) / 2} ${(maskHeight + cutoutHeight) / 2} L ${(maskWidth - cutoutWidth) / 2} ${(maskHeight + cutoutHeight) / 2} Z`;

            const redMask = new fabric.Path(maskPath, {
                fill: 'rgba(255, 0, 0, 1)',
                fillRule: 'evenodd',
                selectable: false,
                evented: false,
                excludeFromExport: true,
                name: 'redMask'
            });

            // canvas.add(redMask);
            // canvas.bringToFront(redMask);

            canvas.renderAll();
            console.log(`画布 #${canvasId} 上的所有图层已成功渲染。 ✅`);
            return canvas;
        } catch (error) {
            console.error(`在画布 #${canvasId} 上渲染图层时发生错误:`, error);
            return null;
        }
    }

    // 多视图 canvas 初始化
    document.addEventListener('DOMContentLoaded', function() {
        // 等待 Pinia store 可用
        function waitForStore() {
            if (typeof window.useCanvasStore === 'function') {
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

    function initializeMultiViewCanvases(store) {
        console.log('Initializing multi-view canvases');

        let isInitialized = false;

        // 监听视图数据变化
        store.$subscribe((mutation, state) => {
            if (mutation.storeId === 'canvas' && state.views && state.views.length > 0 && !isInitialized) {
                createViewContainers(state.views, store);
                isInitialized = true;
            }
        });

        // 如果视图数据已经存在，直接创建
        if (store.views && store.views.length > 0 && !isInitialized) {
            createViewContainers(store.views, store);
            isInitialized = true;
        }
    }

    function createViewContainers(views, store) {
        console.log('Creating view containers for views:', views);

        const multiViewContainer = document.getElementById('multi-view-container');
        if (!multiViewContainer) {
            console.error('Multi-view container not found');
            return;
        }

        // 清空现有容器
        multiViewContainer.innerHTML = '';

        views.forEach((view, index) => {
            // 创建视图容器
            const viewContainer = document.createElement('div');
            viewContainer.id = `view-container-${view.id}`;
            viewContainer.className = 'view-container';
            viewContainer.style.cssText = `
                position: relative;
                width: 100%;
                height: 100%;
                display: ${index === 0 ? 'block' : 'none'};
            `;

            //  <div class="canvas-wrapper" id="shadowWrapper-${view.id}">
            //                     <canvas id="shadowLayer-${view.id}"
            //                         data-color-image="https://promowares-cloud-storage.s3.amazonaws.com/uploads/1754962751517847000-ds.png"
            //                         data-img-width="667"
            //                         data-img-height="500"
            //                         style="position: absolute; top: 0; left: 0; z-index: 1;"></canvas>
            //                 </div>

            //                 <div class="canvas-wrapper" id="colorWrapper-${view.id}">
            //                     <canvas id="colorLayer-${view.id}"
            //                         data-img-width="667"
            //                         data-img-height="500"
            //                         data-product-image="https://promowares-cloud-storage.s3.amazonaws.com/uploads/1754962801560791000-gytc.png"
            //                         style="position: absolute; top: 0; left: 0; z-index: 2;"></canvas>
            //                 </div>

            //   <div class="canvas-wrapper" id="boundaryWrapper-${view.id}">
            //                     <canvas id="boundaryLayer-${view.id}"
            //                        
            //                         style="position: absolute; top: 0; left: 0; z-index: 10; pointer-events: none;"></canvas>
            //                 </div>

            // 创建 canvas 元素
            const canvasHtml = `
               
                
                <div class="canvas-wrapper" id="mainWrapper-${view.id}">
                    <canvas id="mainCanvas-${view.id}"></canvas>
                </div>
                
              
            `;

            viewContainer.innerHTML = canvasHtml;
            multiViewContainer.appendChild(viewContainer);

            // 初始化该视图的 Fabric.js canvas
            setTimeout(async () => {
                //  initializeViewCanvas(view, store);
                await renderView(`mainCanvas-${view.id}`, view, store);

            }, 100);
        });
    }

    // function initializeViewCanvas(view, store) {

    //     const mainCanvasId = `mainCanvas-${view.id}`;
    //     const mainCanvasElement = document.getElementById(mainCanvasId);

    //     if (!mainCanvasElement) {
    //         console.error('Canvas element not found:', mainCanvasId);
    //         return;
    //     }

    //     // 设置 canvas 尺寸为 400x300
    //     const canvasWidth = 667;
    //     const canvasHeight = 500;

    //     // 创建 Fabric.js canvas 实例
    //     const fabricCanvas = new fabric.Canvas(mainCanvasId, {
    //         width: canvasWidth,
    //         height: canvasHeight,
    //         // backgroundColor: '#ffffff'
    //     });

    //     // 在右上角添加视图名称文本
    //     const viewNameText = new fabric.Text(view.name, {
    //         left: canvasWidth - 10,
    //         top: 10,
    //         fontSize: 16,
    //         fill: '#333333',
    //         fontFamily: 'Arial',
    //         selectable: false,
    //         evented: false,
    //         originX: 'right',
    //         originY: 'top'
    //     });

    //     fabricCanvas.add(viewNameText);
    //     fabricCanvas.renderAll();

    //     // 为 canvas 添加事件监听器
    //     if (window.initializeCanvasEventListeners) {
    //         window.initializeCanvasEventListeners(fabricCanvas);
    //     }

    //     // 将 Canvas 实例与 DOM 元素关联
    //     mainCanvasElement.__fabricCanvas = fabricCanvas;
    //     mainCanvasElement.__viewId = view.id;

    //     // 使用 CanvasManager 管理 canvas 实例
    //     if (window.CanvasManager) {
    //         // 将 canvas 实例注册到 CanvasManager
    //         window.CanvasManager._canvasMap[view.id] = fabricCanvas;
    //         if (store.activeViewId === view.id) {
    //             window.CanvasManager.setActiveCanvas(view.id);
    //         }
    //     }

    //     // 设置其他 canvas 层的尺寸
    //     const shadowLayer = document.getElementById(`shadowLayer-${view.id}`);
    //     const colorLayer = document.getElementById(`colorLayer-${view.id}`);
    //     const boundaryLayer = document.getElementById(`boundaryLayer-${view.id}`);

    //     [shadowLayer, colorLayer, boundaryLayer].forEach(canvas => {
    //         if (canvas) {
    //             canvas.width = canvasWidth;
    //             canvas.height = canvasHeight;
    //             canvas.style.width = canvasWidth + 'px';
    //             canvas.style.height = canvasHeight + 'px';
    //         }
    //     });

    //     // 如果是第一个视图，设置为全局 canvas
    //     if (store.activeViewId === view.id) {
    //         window.canvas = fabricCanvas;
    //         window.fabricCanvas = fabricCanvas;
    //     }

    //     console.log('Canvas initialized for view:', view.name);

    //     // 为所有视图绘制边界
    //     setTimeout(() => {
    //         if (window.drawBoundaryForAllViews) {
    //             window.drawBoundaryForAllViews();
    //         }
    //     }, 100);
    // }
</script>