/**
 * 产品图片Canvas替换功能
 * 当点击颜色样本时，将主图替换为canvas画板，背景色为选中的颜色
 * 兼容新旧WooCommerce版本
 */

(function () {
    'use strict';

    // Canvas相关变量
    let canvasContainer = null;
    let originalImageContainer = null;
    let isCanvasMode = false;
    const CANVAS_ID = 'pw-product-canvas';
    const VIEW_ID = 'product-view';

    /**
     * 获取产品主图的实际显示尺寸（像素）
     * 优先读取主图 <img> 的显示尺寸，其次读取容器尺寸。
     * 返回 { width, height }，若无法获取则回退到 {400, 400}
     */
    function getDisplayedMainImageSize() {
        try {
            if (!originalImageContainer) {
                return { width: 400, height: 400 };
            }

            // 优先查找容器内的图片元素
            const imgEl = originalImageContainer.querySelector('img');
            if (imgEl) {
                const rect = imgEl.getBoundingClientRect();
                // 如果高度为0，基于宽度和原始宽高比计算
                let w = Math.round(rect.width);
                let h = Math.round(rect.height);

                if (!h || h === 0) {
                    const nw = imgEl.naturalWidth || w || 400;
                    const nh = imgEl.naturalHeight || 400;
                    if (nw > 0 && nh > 0) {
                        h = Math.round((w || 400) * (nh / nw));
                    }
                }

                // 最终容错
                return {
                    width: w > 0 ? w : 400,
                    height: h > 0 ? h : 400
                };
            }

            // 回退：使用容器尺寸
            const containerRect = originalImageContainer.getBoundingClientRect();
            const width = Math.round(containerRect.width) || 400;
            const height = Math.round(containerRect.height) || 400;
            return { width, height };
        } catch (e) {
            console.warn('获取主图显示尺寸失败，使用默认 400x400', e);
            return { width: 400, height: 400 };
        }
    }

    /**
     * 初始化产品图片Canvas功能
     */
    function initProductImageCanvas() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupImageCanvasFeature);
        } else {
            setupImageCanvasFeature();
        }
    }

    /**
     * 等待依赖加载完成
     */
    function waitForDependencies(callback, maxAttempts = 50) {
        let attempts = 0;

        function checkDependencies() {
            attempts++;

            console.log(`Checking dependencies (attempt ${attempts}):`, {
                CanvasManager: typeof window.CanvasManager !== 'undefined',
                fabric: typeof fabric !== 'undefined'
            });

            if (typeof window.CanvasManager !== 'undefined' && typeof fabric !== 'undefined') {
                console.log('All canvas dependencies loaded successfully');
                callback();
                return;
            }

            if (attempts < maxAttempts) {
                setTimeout(checkDependencies, 100);
            } else {
                console.warn('Canvas dependencies not loaded after maximum attempts');
            }
        }

        checkDependencies();
    }

    /**
     * 设置图片Canvas功能
     */
    function setupImageCanvasFeature() {
        // 等待依赖加载完成
        waitForDependencies(function () {
            // 查找产品主图容器（兼容多种WooCommerce版本）
            findProductImageContainer();

            // 监听颜色样本点击事件
            setupColorSwatchListeners();
        });
    }

    /**
     * 查找产品主图容器
     * 兼容不同WooCommerce版本的选择器
     */
    function findProductImageContainer() {
        const selectors = [
            '.woocommerce-product-gallery__wrapper',
            '.woocommerce-product-gallery',
            '.product-images',
            '.single-product-main-image',
            '.product-gallery',
            '.wp-post-image',
            '.attachment-woocommerce_single',
            '.product-image-main'
        ];

        for (const selector of selectors) {
            const container = document.querySelector(selector);
            if (container) {
                originalImageContainer = container;
                // 找到产品图片容器
                return;
            }
        }

        // 如果没找到标准容器，尝试查找包含产品图片的父容器
        const productImage = document.querySelector('img[class*="wp-post-image"], img[class*="attachment-woocommerce"]');
        if (productImage) {
            originalImageContainer = productImage.closest('div, figure, section');
            // 通过图片元素找到容器
        }

        if (!originalImageContainer) {
            console.warn('未找到产品图片容器，Canvas功能可能无法正常工作');
        }
    }

    /**
     * 设置颜色样本点击监听器
     */
    function setupColorSwatchListeners() {
        // 使用事件委托监听颜色样本点击
        document.addEventListener('click', function (event) {
            const colorSwatch = event.target.closest('.pw-color-swatch');
            if (colorSwatch) {
                handleColorSwatchClick(colorSwatch, event);
            }
        });

        // 也监听Vue组件的颜色选择事件
        document.addEventListener('pw-color-variant-selected', function (event) {
            if (event.detail && event.detail.variant) {
                const color = event.detail.variant.variant_color;
                if (color) {
                    switchToCanvasMode(color);
                }
            }
        });
    }

    /**
     * 处理颜色样本点击事件
     * @param {Element} colorSwatch - 被点击的颜色样本元素
     * @param {Event} event - 点击事件
     */
    function handleColorSwatchClick(colorSwatch, event) {
        // 获取颜色值
        const color = getColorFromSwatch(colorSwatch);
        if (!color) {
            console.warn('无法获取颜色值');
            return;
        }

        // 颜色样本被点击

        // 切换到Canvas模式
        switchToCanvasMode(color);
    }

    /**
     * 从颜色样本元素获取颜色值
     * @param {Element} colorSwatch - 颜色样本元素
     * @returns {string|null} 颜色值
     */
    function getColorFromSwatch(colorSwatch) {
        // 尝试从style属性获取
        const bgColor = colorSwatch.style.backgroundColor;
        if (bgColor) {
            return bgColor;
        }

        // 尝试从CSS计算样式获取
        const computedStyle = window.getComputedStyle(colorSwatch);
        const computedBgColor = computedStyle.backgroundColor;
        if (computedBgColor && computedBgColor !== 'rgba(0, 0, 0, 0)' && computedBgColor !== 'transparent') {
            return computedBgColor;
        }

        // 尝试从data属性获取
        const dataColor = colorSwatch.dataset.color || colorSwatch.dataset.backgroundColor;
        if (dataColor) {
            return dataColor;
        }

        // 尝试从父元素获取颜色信息
        const variantItem = colorSwatch.closest('.pw-color-variant-item');
        if (variantItem) {
            const variantColor = variantItem.dataset.color || variantItem.dataset.variantColor;
            if (variantColor) {
                return variantColor;
            }
        }

        return null;
    }

    /**
     * 从 Pinia store 中获取图层图片URL
     * @returns {Object} 包含 baseImageUrl 和 overlayImageUrl 的对象
     */
    function getLayerImages() {
        try {
            // 检查是否有可用的 store
            if (typeof window.useProductStore === 'undefined') {
                console.warn('ProductStore 未加载，使用默认图片');
                return {
                    baseImageUrl: 'https://pwfiles.939666.xyz/t-shirt/color.png',
                    overlayImageUrl: 'https://pwfiles.939666.xyz/t-shirt/details.png'
                };
            }

            const store = window.useProductStore();
            
            // 检查产品数据是否存在
            if (!store.productData || !store.productData.apiData || !store.productData.apiData.templates) {
                console.warn('产品数据未加载，使用默认图片');
                return {
                    baseImageUrl: 'https://pwfiles.939666.xyz/t-shirt/color.png',
                    overlayImageUrl: 'https://pwfiles.939666.xyz/t-shirt/details.png'
                };
            }

            const views = store.productData.apiData.templates.views;
            if (!views || views.length === 0) {
                console.warn('视图数据不存在，使用默认图片');
                return {
                    baseImageUrl: 'https://pwfiles.939666.xyz/t-shirt/color.png',
                    overlayImageUrl: 'https://pwfiles.939666.xyz/t-shirt/details.png'
                };
            }

            const firstView = views[0];
            if (!firstView.layers) {
                console.warn('图层数据不存在，使用默认图片');
                return {
                    baseImageUrl: 'https://pwfiles.939666.xyz/t-shirt/color.png',
                    overlayImageUrl: 'https://pwfiles.939666.xyz/t-shirt/details.png'
                };
            }

            let baseImageUrl = 'https://pwfiles.939666.xyz/t-shirt/color.png';
            let overlayImageUrl = 'https://pwfiles.939666.xyz/t-shirt/details.png';

            // 查找 Base Layer 和 Overlay Layer
            firstView.layers.forEach(layer => {
                if (layer.name === 'Base Layer' && layer.layer_data && layer.layer_data.content && layer.layer_data.content.imageURL) {
                    baseImageUrl = layer.layer_data.content.imageURL;
                }
                if (layer.name === 'Overlay Layer' && layer.layer_data && layer.layer_data.content && layer.layer_data.content.imageURL) {
                    overlayImageUrl = layer.layer_data.content.imageURL;
                }
            });

            console.log('获取到的图层图片:', { baseImageUrl, overlayImageUrl });
            
            return { baseImageUrl, overlayImageUrl };
        } catch (error) {
            console.error('获取图层图片时出错:', error);
            return {
                baseImageUrl: 'https://pwfiles.939666.xyz/t-shirt/color.png',
                overlayImageUrl: 'https://pwfiles.939666.xyz/t-shirt/details.png'
            };
        }
    }

    /**
     * 切换到Canvas模式
     * @param {string} backgroundColor - 背景颜色
     */
    function switchToCanvasMode(backgroundColor) {
        console.log('switchToCanvasMode called with color:', backgroundColor);

        if (!originalImageContainer) {
            console.error('未找到原始图片容器，无法切换到Canvas模式');
            return;
        }

        // 获取图层图片URL
        const layerImages = getLayerImages();

        // 如果已经是Canvas模式，只更新背景色
        if (isCanvasMode && window.CanvasManager && window.CanvasManager.hasCanvas(VIEW_ID)) {
            console.log('Canvas already in mode, updating background color');
            updateCanvasBackgroundColor(backgroundColor, layerImages.overlayImageUrl);
            return;
        }

        console.log('Creating new canvas with background color:', backgroundColor);

        // 创建Canvas容器
        createCanvasContainer();

        // 隐藏原始图片
        hideOriginalImage();

        // 初始化Fabric.js Canvas
        initializeFabricCanvas(backgroundColor, layerImages.baseImageUrl, layerImages.overlayImageUrl);

        // 标记为Canvas模式
        isCanvasMode = true;

        console.log('Canvas mode activated');
    }

    /**
     * 创建Canvas容器
     */
    function createCanvasContainer() {
        if (canvasContainer) {
            return; // 已存在
        }

        // 读取主图的显示尺寸，确保画布与主图视觉一致
        const { width: displayWidth, height: displayHeight } = getDisplayedMainImageSize();

        // 创建Canvas容器
        canvasContainer = document.createElement('div');
        canvasContainer.className = 'pw-product-canvas-container';
        canvasContainer.style.cssText = `
            width: ${displayWidth}px;
            height: ${displayHeight}px;
            position: relative;
            background: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
        `;

        // 创建Canvas元素
        const canvasElement = document.createElement('canvas');
        canvasElement.id = CANVAS_ID;
        canvasElement.width = displayWidth;
        canvasElement.height = displayHeight;

        canvasContainer.appendChild(canvasElement);

        // 插入到原始图片容器之后
        originalImageContainer.parentNode.insertBefore(canvasContainer, originalImageContainer.nextSibling);
    }

    /**
     * 隐藏原始图片
     */
    function hideOriginalImage() {
        if (originalImageContainer) {
            originalImageContainer.style.display = 'none';
        }
    }

    /**
     * 显示原始图片
     */
    function showOriginalImage() {
        if (originalImageContainer) {
            originalImageContainer.style.display = '';
        }
    }

    /**
     * 初始化Fabric.js Canvas
     * @param {string} backgroundColor - 背景颜色
     * @param {string} baseImageUrl - 底层图片URL
     * @param {string} overlayImageUrl - 顶层图片URL
     */
    function initializeFabricCanvas(backgroundColor, baseImageUrl, overlayImageUrl) {
        // 检查Canvas管理器和Fabric.js是否已加载
        if (typeof window.CanvasManager === 'undefined') {
            console.error('CanvasManager未加载，无法初始化Canvas');
            return;
        }
        if (typeof fabric === 'undefined') {
            console.error('Fabric.js未加载，无法初始化Canvas');
            return;
        }

        const canvasElement = document.getElementById(CANVAS_ID);
        if (!canvasElement) {
            console.error('Canvas元素未找到');
            return;
        }

        try {
            // 与主图显示尺寸保持一致
            const canvasEl = document.getElementById(CANVAS_ID);
            const initWidth = (canvasEl && canvasEl.width) ? canvasEl.width : 400;
            const initHeight = (canvasEl && canvasEl.height) ? canvasEl.height : 400;

            // 使用Canvas管理器创建Fabric Canvas实例（动态尺寸）
            const canvas = window.CanvasManager.createCanvas(CANVAS_ID, VIEW_ID, {
                width: initWidth,
                height: initHeight,
                backgroundColor: 'transparent'
            });
            
            // 使用提供的底层图片URL或默认的color.png
            const baseUrl = baseImageUrl || 'https://pwfiles.939666.xyz/t-shirt/color.png';
            
            // 加载底层图片（Base Layer）
            fabric.Image.fromURL(baseUrl, function (img) {
                img.set({
                    left: canvas.width / 2,
                    top: canvas.height / 2,
                    originX: 'center',
                    originY: 'center',
                    selectable: false,
                    evented: false,
                    name: 'Base Layer'
                });

                // 缩放图片以适应Canvas（不额外缩小）
                const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                img.scale(scale);

                canvas.add(img);
                canvas.sendToBack(img);
                
                // 创建或更新渐变覆盖层（Gradient Overlay），使用 source-in 进行裁剪
                createOrUpdateGradientOverlay(backgroundColor);

                // 加载顶层图片（Overlay Layer），始终保持可见，不进行颜色滤镜
                loadTopLayerImage(undefined, overlayImageUrl);
            }, { crossOrigin: 'anonymous' });
        } catch (error) {
            console.error('初始化Canvas失败:', error);
        }
    }

    /**
     * 加载顶层图片并应用颜色
     * @param {string} color - 要应用的颜色
     * @param {string} imageUrl - 可选的图片URL，如果提供则替换默认的details.png
     */
    function loadTopLayerImage(color, imageUrl) {
        const canvas = window.CanvasManager.getCanvas(VIEW_ID);
        if (!canvas) {
            console.error('Canvas实例未找到');
            return;
        }

        // 使用提供的图片URL或默认的details.png
        const detailsUrl = imageUrl || 'https://pwfiles.939666.xyz/t-shirt/details.png';
        
        fabric.Image.fromURL(detailsUrl, function (img) {
            img.set({
                left: canvas.width / 2,
                top: canvas.height / 2,
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false,
                name: 'Overlay Layer'
            });

            // 缩放图片以适应Canvas（不额外缩小）
            const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
            img.scale(scale);

            canvas.add(img);
            canvas.bringToFront(img);
            canvas.renderAll();
        }, { crossOrigin: 'anonymous' });
    }

    /**
     * 更新Canvas颜色（重新加载顶层图片并应用新颜色）
     * @param {string} color - 新的颜色
     * @param {string} imageUrl - 可选的图片URL，如果提供则替换默认的details.png
     */
    function updateCanvasBackgroundColor(color, imageUrl) {
        const canvas = window.CanvasManager.getCanvas(VIEW_ID);
        if (!canvas) return;

        // 仅更新渐变覆盖层的颜色；保持 Base 和 Overlay Layer 不变
        createOrUpdateGradientOverlay(color);
    }

    /**
     * 创建或更新渐变覆盖层，确保图层顺序为：Base（底）-> Gradient Overlay（中）-> Overlay Layer（顶）
     * 使用 source-in 使覆盖层仅在 Base 非透明像素区域内显示
     * @param {string} color - 单色或渐变的起始颜色（本函数用于自定义颜色单色场景）
     */
    function createOrUpdateGradientOverlay(color) {
        const canvas = window.CanvasManager.getCanvas(VIEW_ID);
        if (!canvas) return;

        // 查找 Base Layer
        const baseLayerObject = canvas.getObjects().find(obj => obj.name === 'Base Layer' || obj.type === 'image');
        if (!baseLayerObject) {
            console.warn('未找到 Base Layer，无法创建/更新渐变覆盖层');
            return;
        }

        // 计算覆盖层的尺寸与位置，匹配 Base Layer 的变换
        const imageElement = baseLayerObject.getElement ? baseLayerObject.getElement() : null;
        const imageWidth = imageElement ? (imageElement.width || imageElement.naturalWidth || baseLayerObject.width) : baseLayerObject.width;
        const imageHeight = imageElement ? (imageElement.height || imageElement.naturalHeight || baseLayerObject.height) : baseLayerObject.height;

        // 若已存在旧的渐变覆盖层，更新其填充颜色
        let overlayRect = canvas.getObjects().find(obj => obj.name === 'Base Gradient Overlay');
        const fillColor = color || '#ffffff';

        if (!overlayRect) {
            overlayRect = new fabric.Rect({
                left: baseLayerObject.left,
                top: baseLayerObject.top,
                originX: baseLayerObject.originX || 'center',
                originY: baseLayerObject.originY || 'center',
                width: imageWidth,
                height: imageHeight,
                angle: baseLayerObject.angle || 0,
                scaleX: baseLayerObject.scaleX || 1,
                scaleY: baseLayerObject.scaleY || 1,
                selectable: false,
                evented: false,
                name: 'Base Gradient Overlay',
                globalCompositeOperation: 'source-in',
                fill: fillColor
            });
            canvas.add(overlayRect);
        } else {
            overlayRect.set({ fill: fillColor });
        }

        // 确保图层顺序：Base 在底层，Gradient Overlay 在中层，Overlay Layer 在顶层
        canvas.sendToBack(baseLayerObject);
        canvas.bringForward(overlayRect);
        const overlayLayerObject = canvas.getObjects().find(obj => obj.name === 'Overlay Layer');
        if (overlayLayerObject) {
            canvas.bringToFront(overlayLayerObject);
        }

        canvas.renderAll();
    }

    /**
     * 销毁Canvas实例
     */
    function destroyCanvas() {
        // 使用Canvas管理器销毁Canvas实例
        if (window.CanvasManager) {
            window.CanvasManager.destroyCanvas(VIEW_ID);
        }

        if (canvasContainer) {
            canvasContainer.remove();
            canvasContainer = null;
        }

        // 恢复原始图片显示
        showOriginalImage();

        isCanvasMode = false;
        
        console.log('Canvas已销毁，原始图片已恢复显示');
    }

    // 公开API
    window.ProductImageCanvas = {
        init: initProductImageCanvas,
        switchToCanvas: switchToCanvasMode,
        updateBackgroundColor: updateCanvasBackgroundColor,
        destroy: destroyCanvas,
        getCurrentCanvas: function() {
            return window.CanvasManager && window.CanvasManager.getCanvas(VIEW_ID);
        }
    };

    // 自动初始化
    initProductImageCanvas();

    // 调试信息
    console.log('ProductImageCanvas module loaded');

})();