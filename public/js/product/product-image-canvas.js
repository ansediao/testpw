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

        // 创建Canvas容器
        canvasContainer = document.createElement('div');
        canvasContainer.className = 'pw-product-canvas-container';
        canvasContainer.style.cssText = `
            width: 100%;
            height: 400px;
            position: relative;
            background: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
        `;

        // 创建Canvas元素
        const canvasElement = document.createElement('canvas');
        canvasElement.id = CANVAS_ID;
        canvasElement.width = 400;
        canvasElement.height = 400;

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
            // 使用Canvas管理器创建Fabric Canvas实例
            const canvas = window.CanvasManager.createCanvas(CANVAS_ID, VIEW_ID, {
                width: 400,
                height: 400,
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
                    evented: false
                });

                // 缩放图片以适应Canvas
                const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.8;
                img.scale(scale);

                canvas.add(img);
                canvas.sendToBack(img);

                // 加载顶层图片（Overlay Layer）并应用颜色
                loadTopLayerImage(backgroundColor, overlayImageUrl);
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
                evented: false
            });

            // 缩放图片以适应Canvas
            const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.8;
            img.scale(scale);

            // 应用颜色滤镜
            img.filters.push(new fabric.Image.filters.BlendColor({
                color: color,
                mode: 'multiply',
                alpha: 0.8
            }));
            img.applyFilters();

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
        if (canvas) {
            // 移除现有的顶层图片
            const objects = canvas.getObjects();
            for (let i = objects.length - 1; i >= 0; i--) {
                if (objects[i].type === 'image' && objects[i] !== objects[0]) {
                    canvas.remove(objects[i]);
                }
            }

            // 重新加载顶层图片并应用新颜色
            loadTopLayerImage(color, imageUrl);
            // Canvas颜色已更新
        }
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

        isCanvasMode = false;
    }

    // 公开API
    window.ProductImageCanvas = {
        init: initProductImageCanvas,
        switchToCanvas: switchToCanvasMode,
        updateBackgroundColor: updateCanvasBackgroundColor,
        destroy: destroyCanvas
    };

    // 自动初始化
    initProductImageCanvas();

    // 调试信息
    console.log('ProductImageCanvas module loaded');

})();