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
    function createFabricObjectFromLayer(canvas, layer) {
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

                        const canvasWidth = canvas.getWidth();
                        const canvasHeight = canvas.getHeight();
                        // 注意：img.width 和 img.height 是图片的原始尺寸
                        const imgWidth = img.width;
                        const imgHeight = img.height;

                        const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);




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

                            angle: position.rotation,
                            originX: origins.originX,
                            originY: origins.originY,

                            opacity: data.content.opacity / 100,
                            selectable: controls.movable,
                            evented: controls.movable,
                            lockRotation: !controls.rotatable,
                            // lockScalingX: !controls.scalable,
                            // lockScalingY: !controls.scalable,
                            hasControls: controls.movable && controls.scalable,
                            hasBorders: controls.movable,
                            name: layer.name
                        });
                        img.scale(scale);

                        //如果 center
                        if (position.anchorPoint === 'center') {
                            canvas.centerObject(img);
                            canvas.renderAll();
                        }
                        resolve(img);
                    }, {
                        crossOrigin: 'anonymous'
                    });

                    break;

                case 'text':
                    if (!data.content.text) {
                        console.warn(`因缺少文本内容，正在跳过文本图层 "${layer.name}"。`);
                        resolve(null);
                        return;
                    }

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

                    const textObj = new fabric.Text(data.content.text, {
                        left: convertedCoords.x,
                        top: convertedCoords.y,
                        angle: position.rotation,
                        originX: origins.originX,
                        originY: origins.originY,
                        fontFamily: data.content.fontFamily || 'Arial',
                        fill: data.content.fontColor || '#000000',
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

                    // // 如果有背景色，设置背景
                    // if (data.content.backgroundColor && data.content.backgroundColor !== 'transparent') {
                    //     textObj.set('backgroundColor', data.content.backgroundColor);
                    // }

                    resolve(textObj);
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

            // 如果对象在画布上，强制重新渲染
            if (layerObject.canvas) {
                layerObject.canvas.renderAll();
            }
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
    // async function renderLayer(canvas, layer, store, view) {



    //     if (!canvas || !layer) {
    //         console.error("渲染单个图层需要有效的画布实例和图层数据。");
    //         return null;
    //     }
    //     try {
    //         const fabricObject = await createFabricObjectFromLayer(layer);

    //         // 根据 productViewFlow 控制显示的图层
    //         const productViewFlow = store.getProductViewFlow();

    //         // if (productViewFlow === '4-Grid Flow') {
    //         //     // 当 productViewFlow 为 "4-Grid Flow" 时，只允许显示 "4-Grid Flow" 层
    //         //     if (layer.name !== '4-Grid Flow') {
    //         //         console.log(`跳过图层 "${layer.name}"，因为当前 productViewFlow 为 "4-Grid Flow"`);
    //         //         return null;
    //         //     }
    //         // } else {
    //         //     // 当 productViewFlow 不是 "4-Grid Flow" 时，显示 Base Layer 和 Overlay Layer，跳过 4-Grid Flow
    //         //     if (layer.name === 'Base Layer' || layer.name === 'Overlay Layer' || layer.name === 'Custom Layer') {
    //         //         // 允许显示
    //         //     } else if (layer.name === '4-Grid Flow') {
    //         //         console.log(`跳过图层 "${layer.name}"，因为当前 productViewFlow 不是 "4-Grid Flow"`);
    //         //         return null;
    //         //     } else {
    //         //         return null;
    //         //     }
    //         // }




    //         // 如果满足条件（图层名称为 Base Layer），将对象存入 Pinia store
    //         if (fabricObject && layer.name === 'Base Layer' && view && store) {
    //             // 确保 views 数组和对应的 view 对象存在
    //             if (store.views && store.views.length > 0) {
    //                 const viewIndex = store.views.findIndex(v => v.id === view.id);
    //                 if (viewIndex !== -1) {
    //                     // 将 fabricObject 存入 views[view.id].base_layer
    //                     if (!store.views[viewIndex].base_layer) {
    //                         store.views[viewIndex].base_layer = {};
    //                     }
    //                     store.views[viewIndex].base_layer = fabricObject;
    //                     console.log(`Base Layer 对象已存入 Pinia store: views[${view.id}].base_layer`);

    //                     // 从pinia 中取出这个 图片对象 修改颜色
    //                     applyTintFilter(store.views[viewIndex].base_layer, '#ff0000', 1);
    //                     // 重新渲染画布以显示滤镜效果
    //                 }
    //             }
    //         }




    //         if (fabricObject) {
    //             canvas.add(fabricObject);
    //             console.log(`该图层 "${layer.name}" 已被添加到画布。`);
    //             return fabricObject;
    //         }
    //         return null;
    //     } catch (error) {
    //         console.error(`渲染图层 "${layer.name}" 时发生错误:`, error);
    //         return null;
    //     }
    // }

    /**
     * 主函数，通过调用 renderLayer 来将视图中的所有图层批量渲染到 Fabric.js 画布上。
     * @param {string} canvasId - HTML canvas 元素的 ID。
     * @param {object} viewData - 来自 API 的包含 layer_config 的视图数据对象。
     * @returns {Promise<fabric.Canvas|null>} 一个 Promise，解析为创建好的 Fabric.js 画布实例或 null。
     */
    // async function renderView(canvasId, view, store) {
    //     const viewData = view.data;
    //     const layerConfig = viewData?.layer_config;
    //     if (!layerConfig || !layerConfig.layers || layerConfig.layers.length === 0) {
    //         console.error("未在视图数据中找到有效的图层配置进行渲染。");
    //         return null;
    //     }

    //     const layers = layerConfig.layers;

    //     // 根据 productViewFlow 决定从哪个图层获取画布尺寸
    //     const productViewFlow = store.getProductViewFlow();
    //     let targetLayer = layers[0]; // 默认使用第一个图层

    //     if (productViewFlow === '4-Grid Flow') {
    //         // 查找 "4-Grid Flow" 图层
    //         const gridFlowLayer = layers.find(layer => layer.name === '4-Grid Flow');
    //         if (gridFlowLayer) {
    //             targetLayer = gridFlowLayer;
    //             console.log('使用 4-Grid Flow 图层的尺寸初始化画布');
    //         } else {
    //             console.warn('未找到 4-Grid Flow 图层，使用默认图层尺寸');
    //         }
    //     }

    //     const canvasWidth = targetLayer.layer_data.dimensions.contentArea.width || targetLayer.layer_data.dimensions.layerSize.width;
    //     const canvasHeight = targetLayer.layer_data.dimensions.contentArea.height || targetLayer.layer_data.dimensions.layerSize.height;

    //     const canvas = new fabric.Canvas(canvasId, {
    //         width: canvasWidth,
    //         height: canvasHeight,
    //         backgroundColor: '#f0f0f0',
    //     });

    //     // 为 canvas 添加事件监听器
    //     if (window.initializeCanvasEventListeners) {
    //         window.initializeCanvasEventListeners(canvas);
    //     }

    //     // 将 Canvas 实例与 DOM 元素关联
    //     const mainCanvasElement = document.getElementById(canvasId);
    //     if (mainCanvasElement) {
    //         mainCanvasElement.__fabricCanvas = canvas;
    //         mainCanvasElement.__viewId = view.id;
    //     }

    //     // 使用 CanvasManager 管理 canvas 实例
    //     if (window.CanvasManager) {
    //         // 将 canvas 实例注册到 CanvasManager
    //         window.CanvasManager._canvasMap[view.id] = canvas;
    //         if (store.activeViewId === view.id) {
    //             window.CanvasManager.setActiveCanvas(view.id);
    //         }
    //     }
    //     // 如果是第一个视图，设置为全局 canvas
    //     if (store.activeViewId === view.id) {
    //         window.canvas = canvas;
    //         window.fabricCanvas = canvas;
    //     }

    //     try {
    //         const sortedLayers = [...layers].sort((a, b) => a.sort_order - b.sort_order);

    //         for (const layer of sortedLayers) {
    //             // await renderLayer(canvas, layer, store, view);
    //         }

    //         // 创建红色遮罩对象
    //         const maskWidth = canvasWidth;
    //         const maskHeight = canvasHeight;
    //         const cutoutWidth = 200;
    //         const cutoutHeight = 240;

    //         // 创建遮罩路径，中心镂空
    //         const maskPath = `M 0 0 L ${maskWidth} 0 L ${maskWidth} ${maskHeight} L 0 ${maskHeight} Z M ${(maskWidth - cutoutWidth) / 2} ${(maskHeight - cutoutHeight) / 2} L ${(maskWidth + cutoutWidth) / 2} ${(maskHeight - cutoutHeight) / 2} L ${(maskWidth + cutoutWidth) / 2} ${(maskHeight + cutoutHeight) / 2} L ${(maskWidth - cutoutWidth) / 2} ${(maskHeight + cutoutHeight) / 2} Z`;

    //         const redMask = new fabric.Path(maskPath, {
    //             fill: 'rgba(255, 0, 0, 1)',
    //             fillRule: 'evenodd',
    //             selectable: false,
    //             evented: false,
    //             excludeFromExport: true,
    //             name: 'redMask'
    //         });

    //         // canvas.add(redMask);
    //         // canvas.bringToFront(redMask);

    //         canvas.renderAll();
    //         console.log(`画布 #${canvasId} 上的所有图层已成功渲染。 ✅`);

    //         // 图层渲染完成后，触发自动缩放调整
    //         setTimeout(() => {
    //             if (typeof window.triggerAutoZoomAdjustment === 'function') {
    //                 window.triggerAutoZoomAdjustment();
    //             }
    //         }, 200); // 延迟200ms确保DOM更新完成

    //         return canvas;
    //     } catch (error) {
    //         console.error(`在画布 #${canvasId} 上渲染图层时发生错误:`, error);
    //         return null;
    //     }
    // }

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
            // 获取目标图层尺寸
            let canvasWidth = 567; // 默认宽度
            let canvasHeight = 567; // 默认高度

            // 尝试从视图的图层数据中获取尺寸
            if (view.layers && view.layers.length > 0) {
                let targetLayer = view.layers[0];
                // 4-Grid Flow 特殊处理
                if (view.view_flow === '4-Grid Flow') {
                    // 查找 "4-Grid Flow" 图层
                    const gridFlowLayer = view.layers.find(layer => layer.name === '4-Grid Flow');
                    if (gridFlowLayer) {
                        targetLayer = gridFlowLayer;
                        console.log('使用 4-Grid Flow 图层的尺寸初始化画布');
                    } else {
                        console.warn('未找到 4-Grid Flow 图层，使用默认图层尺寸');
                    }
                }
                if (targetLayer && targetLayer.layer_data?.dimensions) {
                    canvasWidth = targetLayer.layer_data.dimensions.contentArea?.width || targetLayer.layer_data.dimensions.layerSize?.width || canvasWidth;
                    canvasHeight = targetLayer.layer_data.dimensions.contentArea?.height || targetLayer.layer_data.dimensions.layerSize?.height || canvasHeight;
                }
            }




            // 创建视图容器
            const viewContainer = document.createElement('div');
            viewContainer.id = `view-container-${view.id}`;
            viewContainer.className = 'view-container';
            viewContainer.style.cssText = `
                position: relative;
                width: ${canvasWidth}px;
                height: ${canvasHeight}px;
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
               
                <div class="canvas-wrapper" id="baseWrapper-${view.id}" style="z-index:10;">
                    <canvas id="baseCanvas-${view.id}"></canvas>
                </div>
                <div class="canvas-wrapper" id="mainWrapper-${view.id}" style="z-index:20;">
                    <canvas id="mainCanvas-${view.id}"></canvas>
                </div>
                <div class="canvas-wrapper" id="overlayWrapper-${view.id}" style="z-index:30;pointer-events: none;">
                    <canvas id="overlayCanvas-${view.id}"></canvas>
                </div>
                <div class="canvas-wrapper" id="maskWrapper-${view.id}" style="z-index:40; pointer-events: none; display: none;">
                    <canvas id="maskCanvas-${view.id}"></canvas>
                </div>
              
            `;

            viewContainer.innerHTML = canvasHtml;
            multiViewContainer.appendChild(viewContainer);

            // 初始化该视图的 Fabric.js canvas
            setTimeout(async () => {
                //  initializeViewCanvas(view, store);
                await initializeMultiLayerCanvases(view, store);

                // 初始化 maskCanvas
                await initializeMaskCanvas(`maskCanvas-${view.id}`, view, store);

            }, 100);
        });
    }

    /**
     * 初始化多图层画布系统
     * @param {Object} view - 视图对象
     * @param {Object} store - Pinia store
     */
    async function initializeMultiLayerCanvases(view, store) {
        const viewData = view.data;
        const layerConfig = viewData?.layer_config;
        if (!layerConfig || !layerConfig.layers || layerConfig.layers.length === 0) {
            console.error("未在视图数据中找到有效的图层配置进行渲染。");
            return;
        }

        const layers = layerConfig.layers;
        const productViewFlow = view.view_flow;

        // 根据 productViewFlow 决定从哪个图层获取画布尺寸
        let targetLayer = layers[0];
        if (productViewFlow === '4-Grid Flow') {
            const gridFlowLayer = layers.find(layer => layer.name === '4-Grid Flow');
            if (gridFlowLayer) {
                targetLayer = gridFlowLayer;
            }
        }

        const canvasWidth = targetLayer.layer_data.dimensions.contentArea.width || targetLayer.layer_data.dimensions.layerSize.width;
        const canvasHeight = targetLayer.layer_data.dimensions.contentArea.height || targetLayer.layer_data.dimensions.layerSize.height;

        // 定义所有需要初始化的canvas
        let allCanvasIds = [
            `baseCanvas-${view.id}`,
            `mainCanvas-${view.id}`,
            `overlayCanvas-${view.id}`
        ];
        if (productViewFlow === '4-Grid Flow') {
            allCanvasIds = [
                `baseCanvas-${view.id}`,
                `mainCanvas-${view.id}`

            ];
        }

        // 首先初始化所有canvas为空的fabric画布
        for (const canvasId of allCanvasIds) {
            await initializeEmptyCanvas(canvasId, canvasWidth, canvasHeight, view, store);
        }

        // 然后为每个图层类型渲染到对应的canvas
        let canvasConfigs = [{
                layerName: 'Base Layer',
                canvasId: `baseCanvas-${view.id}`
            },
            {
                layerName: 'Overlay Layer',
                canvasId: `overlayCanvas-${view.id}`
            },
            {
                layerName: '4-Grid Flow',
                canvasId: `mainCanvas-${view.id}`
            },
            {
                layerName: 'Custom Layer',
                canvasId: `mainCanvas-${view.id}`
            }
        ];
        if (productViewFlow === '4-Grid Flow') {
            canvasConfigs = [

                {
                    layerName: '4-Grid Flow',
                    canvasId: `baseCanvas-${view.id}`
                }
            ];
        }

        // 渲染对应图层到canvas
        for (const config of canvasConfigs) {
            const targetLayers = layers.filter(layer => layer.name === config.layerName);
            if (targetLayers.length > 0) {
                const canvas = document.getElementById(config.canvasId).__fabricCanvas;
                if (canvas) {
                    const sortedLayers = [...targetLayers].sort((a, b) => a.sort_order - b.sort_order);
                    for (const layer of sortedLayers) {
                        await renderLayerToSpecificCanvas(canvas, layer, store, view);
                    }
                    canvas.renderAll();
                    console.log(`画布 #${config.canvasId} 上的图层已成功渲染。 ✅`);
                }
            }
        }

        // 所有图层渲染完成后，触发自动缩放调整
        setTimeout(() => {
            if (typeof window.triggerAutoZoomAdjustment === 'function') {
                window.triggerAutoZoomAdjustment();
            }
        }, 200); // 延迟200ms确保DOM更新完成
    }

    /**
     * 初始化空的fabric画布
     * @param {string} canvasId - 画布ID
     * @param {number} canvasWidth - 画布宽度
     * @param {number} canvasHeight - 画布高度
     * @param {Object} view - 视图对象
     * @param {Object} store - Pinia store
     */
    async function initializeEmptyCanvas(canvasId, canvasWidth, canvasHeight, view, store) {
        const canvas = new fabric.Canvas(canvasId, {
            width: canvasWidth,
            height: canvasHeight,
            backgroundColor: 'transparent', // 使用透明背景以支持图层叠加
        });

        // 为 canvas 添加事件监听器
        if (window.initializeCanvasEventListeners) {
            window.initializeCanvasEventListeners(canvas);
        }

        // 将 Canvas 实例与 DOM 元素关联
        const canvasElement = document.getElementById(canvasId);
        if (canvasElement) {
            canvasElement.__fabricCanvas = canvas;
            canvasElement.__viewId = view.id;
        }

        // 使用 CanvasManager 管理 canvas 实例
        if (window.CanvasManager) {
            // 将 canvas 实例注册到 CanvasManager
            if (!window.CanvasManager._canvasMap) {
                window.CanvasManager._canvasMap = {};
            }

            // 如果是主画布，将其注册为该视图的主画布
            if (canvasId.includes('mainCanvas')) {
                window.CanvasManager._canvasMap[view.id] = canvas;

                // 如果是当前活动视图，设置为活动画布
                if (store.activeViewId === view.id) {
                    window.CanvasManager.setActiveCanvas(view.id);
                    window.canvas = canvas;
                    window.fabricCanvas = canvas;
                }
            }

            // 其他画布也注册，但使用不同的键名
            window.CanvasManager._canvasMap[canvasId] = canvas;
        }

        console.log(`空的fabric画布 #${canvasId} 已初始化。`);
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
            console.error("渲染单个图层需要有效的画布实例和图层数据。");
            return null;
        }

        try {
            const fabricObject = await createFabricObjectFromLayer(canvas, layer);

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
                console.log(`该图层 "${layer.name}" 已被添加到画布 ${canvas.getElement().id}。`);
                return fabricObject;
            }
            return null;
        } catch (error) {
            console.error(`渲染图层 "${layer.name}" 时发生错误:`, error);
            return null;
        }
    }

    /**
     * 初始化遮罩画布
     * @param {string} canvasId - 画布ID
     * @param {Object} view - 视图对象
     * @param {Object} store - Pinia store
     */
    async function initializeMaskCanvas(canvasId, view, store) {
        // 如果 view.view_flow = 4-Grid Flow
        if (view.view_flow === '4-Grid Flow') {
            return;
        }


        const canvasElement = document.getElementById(canvasId);
        if (!canvasElement) {
            console.error('Mask canvas element not found:', canvasId);
            return;
        }

        // 获取canvas尺寸（与mainCanvas保持一致）
        let canvasWidth = 456;
        let canvasHeight = 456;

        // 从视图的图层数据中获取尺寸
        if (view.layers && view.layers.length > 0) {
            const targetLayer = view.layers[0];
            if (targetLayer && targetLayer.layer_data?.dimensions) {
                canvasWidth = targetLayer.layer_data.dimensions.contentArea?.width || targetLayer.layer_data.dimensions.layerSize?.width || canvasWidth;
                canvasHeight = targetLayer.layer_data.dimensions.contentArea?.height || targetLayer.layer_data.dimensions.layerSize?.height || canvasHeight;
            }
        }

        // 创建 Fabric.js canvas 实例
        const maskCanvas = new fabric.Canvas(canvasId, {
            width: canvasWidth,
            height: canvasHeight,
            backgroundColor: 'transparent',
            selection: false,
            hoverCursor: 'default',
            moveCursor: 'default'
        });

        // 获取打印区域尺寸
        let printAreaWidth = 100; // 默认值
        let printAreaHeight = 120; // 默认值

        // 从 Pinia printMethod store 获取打印区域尺寸
        if (window.usePrintMethodStore) {
            const printMethodStore = window.usePrintMethodStore();
            const currentMethods = printMethodStore.currentViewPrintMethods;

            if (currentMethods && currentMethods.length > 0) {
                const firstMethod = currentMethods[0];
                if (firstMethod.print_method_area_width && firstMethod.print_method_area_height) {
                    // 将尺寸乘以50转换为像素
                    printAreaWidth = firstMethod.print_method_area_width * 50;
                    printAreaHeight = firstMethod.print_method_area_height * 50;
                    console.log(`获取到打印区域尺寸: ${printAreaWidth}x${printAreaHeight}px`);
                }
            }
        }

        // 创建遮罩蒙版路径（四周半透明，中心镂空）
        const maskPath = `M 0 0 L ${canvasWidth} 0 L ${canvasWidth} ${canvasHeight} L 0 ${canvasHeight} Z M ${(canvasWidth - printAreaWidth) / 2} ${(canvasHeight - printAreaHeight) / 2} L ${(canvasWidth + printAreaWidth) / 2} ${(canvasHeight - printAreaHeight) / 2} L ${(canvasWidth + printAreaWidth) / 2} ${(canvasHeight + printAreaHeight) / 2} L ${(canvasWidth - printAreaWidth) / 2} ${(canvasHeight + printAreaHeight) / 2} Z`;

        const printAreaMask = new fabric.Path(maskPath, {
            fill: 'rgba(0, 0, 0, 0.5)', // 半透明黑色遮罩
            fillRule: 'evenodd',
            stroke: '#ffffff', // 白色虚线描边
            strokeWidth: 2, // 描边宽度
            strokeDashArray: [5, 5], // 虚线样式：5像素实线，5像素空白
            selectable: false,
            evented: false,
            excludeFromExport: true,
            name: 'printAreaMask'
        });

        // 添加遮罩到画布
        maskCanvas.add(printAreaMask);
        maskCanvas.renderAll();

        // 将 maskCanvas 实例与 DOM 元素关联
        canvasElement.__fabricCanvas = maskCanvas;
        canvasElement.__viewId = view.id;

        console.log(`遮罩画布 #${canvasId} 初始化完成，打印区域: ${printAreaWidth}x${printAreaHeight}px`);

        return maskCanvas;
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
            // 获取图层的图像元素
            const imageElement = baseLayer.getElement();
            if (!imageElement) {
                console.warn('无法获取 base 图层的图像元素');
                return null;
            }

            // 创建临时 canvas 来分析像素
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            // 设置临时 canvas 尺寸
            tempCanvas.width = imageElement.width || imageElement.naturalWidth;
            tempCanvas.height = imageElement.height || imageElement.naturalHeight;
            
            // 绘制图像到临时 canvas
            tempCtx.drawImage(imageElement, 0, 0);
            
            // 获取图像数据
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imageData.data;
            
            let minX = tempCanvas.width;
            let minY = tempCanvas.height;
            let maxX = 0;
            let maxY = 0;
            let hasPixels = false;
            
            // 扫描所有像素，找到非透明像素的边界
            for (let y = 0; y < tempCanvas.height; y++) {
                for (let x = 0; x < tempCanvas.width; x++) {
                    const index = (y * tempCanvas.width + x) * 4;
                    const alpha = data[index + 3]; // Alpha 通道
                    
                    // 如果像素不是完全透明的
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
            
            // 计算在 fabric.js 坐标系中的位置和尺寸
            const scaleX = baseLayer.scaleX || 1;
            const scaleY = baseLayer.scaleY || 1;
            
            // 获取 base 图层在画布中的位置
            const layerLeft = baseLayer.left || 0;
            const layerTop = baseLayer.top || 0;
            
            // 计算像素边界在画布坐标系中的位置
            const pixelWidth = maxX - minX + 1;
            const pixelHeight = maxY - minY + 1;
            
            // 考虑图层的缩放和位置
            const boundsLeft = layerLeft + (minX * scaleX) - (baseLayer.width * scaleX / 2);
            const boundsTop = layerTop + (minY * scaleY) - (baseLayer.height * scaleY / 2);
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

    // 将函数暴露到全局作用域
    window.getBaseLayerPixelBounds = getBaseLayerPixelBounds;

    // 清除所有渐变色对象的函数
    function clearAllGradientRects() {
        try {
            if (window.useCanvasStore) {
                const store = window.useCanvasStore();
                const activeViewId = store.activeViewId;
                
                if (activeViewId && store.views) {
                    // 获取当前激活的画布
                    const activeCanvas = window.CanvasManager.getActiveCanvas();
                    if (!activeCanvas) {
                        console.warn('无法获取当前激活的画布');
                        return;
                    }
                    
                    // 查找并移除所有渐变矩形对象
                    const objectsToRemove = [];
                    activeCanvas.getObjects().forEach(obj => {
                        // 检查对象是否是渐变矩形（通过ID前缀识别）
                        if (obj.id && obj.id.startsWith('gradient-rect-')) {
                            objectsToRemove.push(obj);
                        }
                    });
                    
                    // 移除找到的渐变矩形对象
                    objectsToRemove.forEach(obj => {
                        activeCanvas.remove(obj);
                    });
                    
                    // 重新渲染画布
                    activeCanvas.renderAll();
                    
                    if (objectsToRemove.length > 0) {
                        console.log(`已清除 ${objectsToRemove.length} 个渐变色对象`);
                    }
                    
                    return objectsToRemove.length;
                } else {
                    console.warn('没有激活的视图或 store 不可用');
                    return 0;
                }
            } else {
                console.warn('useCanvasStore 不可用');
                return 0;
            }
        } catch (error) {
            console.error('清除渐变色对象时发生错误:', error);
            return 0;
        }
    }

    // 将函数暴露到全局作用域
    window.clearAllGradientRects = clearAllGradientRects;

    // ... existing code ...
</script>