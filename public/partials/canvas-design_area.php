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
            
            // 创建 canvas 元素
            const canvasHtml = `
                <canvas id="shadowLayer-${view.id}"
                    data-color-image="https://promowares-cloud-storage.s3.amazonaws.com/uploads/1754962751517847000-ds.png"
                    data-img-width="667"
                    data-img-height="500"
                    style="position: absolute; top: 0; left: 0; z-index: 1;"></canvas>
                
                <canvas id="colorLayer-${view.id}"
                    data-img-width="667"
                    data-img-height="500"
                    data-product-image="https://promowares-cloud-storage.s3.amazonaws.com/uploads/1754962801560791000-gytc.png"
                    style="position: absolute; top: 0; left: 0; z-index: 2;"></canvas>
                
                <canvas id="mainCanvas-${view.id}"
                    data-img-width="<?php echo esc_attr($first_image_width); ?>"
                    data-img-height="<?php echo esc_attr($first_image_height); ?>"
                    style="position: absolute; top: 0; left: 0; z-index: 3;"></canvas>
                
                <canvas id="boundaryLayer-${view.id}"
                    data-img-width="<?php echo esc_attr($first_image_width); ?>"
                    data-img-height="<?php echo esc_attr($first_image_height); ?>"
                    style="position: absolute; top: 0; left: 0; z-index: 10; pointer-events: none;"></canvas>
            `;
            
            viewContainer.innerHTML = canvasHtml;
            multiViewContainer.appendChild(viewContainer);
            
            // 初始化该视图的 Fabric.js canvas
            setTimeout(() => {
                initializeViewCanvas(view, store);
            }, 100);
        });
    }
    
    function initializeViewCanvas(view, store) {
        console.log('Initializing canvas for view:', view.name);
        
        const mainCanvasId = `mainCanvas-${view.id}`;
        const mainCanvasElement = document.getElementById(mainCanvasId);
        
        if (!mainCanvasElement) {
            console.error('Canvas element not found:', mainCanvasId);
            return;
        }
        
        // 设置 canvas 尺寸为 400x300
        const canvasWidth = 667;
        const canvasHeight = 500;
        
        // 创建 Fabric.js canvas 实例
        const fabricCanvas = new fabric.Canvas(mainCanvasId, {
            width: canvasWidth,
            height: canvasHeight,
            backgroundColor: '#ffffff'
        });
        
        // 在右上角添加视图名称文本
        const viewNameText = new fabric.Text(view.name, {
            left: canvasWidth - 10,
            top: 10,
            fontSize: 16,
            fill: '#333333',
            fontFamily: 'Arial',
            selectable: false,
            evented: false,
            originX: 'right',
            originY: 'top'
        });
        
        fabricCanvas.add(viewNameText);
        fabricCanvas.renderAll();
        
        // 为 canvas 添加事件监听器
        if (window.initializeCanvasEventListeners) {
            window.initializeCanvasEventListeners(fabricCanvas);
        }
        
        // 使用 CanvasManager 管理 canvas 实例
        if (window.CanvasManager) {
            // 将 canvas 实例注册到 CanvasManager
            window.CanvasManager._canvasMap[view.id] = fabricCanvas;
            if (store.activeViewId === view.id) {
                window.CanvasManager.setActiveCanvas(view.id);
            }
        }
        
        // 设置其他 canvas 层的尺寸
        const shadowLayer = document.getElementById(`shadowLayer-${view.id}`);
        const colorLayer = document.getElementById(`colorLayer-${view.id}`);
        const boundaryLayer = document.getElementById(`boundaryLayer-${view.id}`);
        
        [shadowLayer, colorLayer, boundaryLayer].forEach(canvas => {
            if (canvas) {
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
                canvas.style.width = canvasWidth + 'px';
                canvas.style.height = canvasHeight + 'px';
            }
        });
        
        // 如果是第一个视图，设置为全局 canvas
        if (store.activeViewId === view.id) {
            window.canvas = fabricCanvas;
            window.fabricCanvas = fabricCanvas;
        }
        
        console.log('Canvas initialized for view:', view.name);
        
        // 为所有视图绘制边界
        setTimeout(() => {
            if (window.drawBoundaryForAllViews) {
                window.drawBoundaryForAllViews();
            }
        }, 100);
    }
</script>