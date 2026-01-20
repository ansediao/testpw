document.addEventListener('DOMContentLoaded', function() {
    const gradientColorModal = document.getElementById('gradient-color-modal');
    const closeGradientColorModal = document.getElementById('close-gradient-color-modal');
    const applyGradientColorBtn = document.getElementById('applyGradientColor');
    const gradientColor1 = document.getElementById('gradientColor1');
    const gradientColor2 = document.getElementById('gradientColor2');
    const gradientDirection = document.getElementById('gradientDirection');
    const gradientColorModalOverlay = gradientColorModal ? gradientColorModal.querySelector('.modal__overlay') : null;

    if (!gradientColorModal || !gradientColorModalOverlay || !closeGradientColorModal || !applyGradientColorBtn || !gradientColor1 || !gradientColor2 || !gradientDirection) {
        return;
    }

    let colorSelectionInitialized = false;

    function initializeSwatchBackgrounds() {
        const options = document.querySelectorAll('.gradient-colors-container .color-option');
        options.forEach(function (option) {
            const color = option.getAttribute('data-color');
            if (color) {
                option.style.backgroundColor = color;
            }
        });
    }

    function clearAllColorSelections() {
        const allColorOptions = document.querySelectorAll('.gradient-colors-container .color-option');
        allColorOptions.forEach(option => {
            option.classList.remove('selected');
        });

        gradientColor1.value = '';
        gradientColor2.value = '';
    }

    function initializeColorSelection() {
        clearAllColorSelections();

        const firstColor1Option = document.querySelector('.gradient-colors-container > div:first-child .color-option[data-color="#ff0000"]');
        if (firstColor1Option) {
            firstColor1Option.classList.add('selected');
        }

        const firstColor2Option = document.querySelector('.gradient-colors-container > div:last-child .color-option[data-color="#ffff00"]');
        if (firstColor2Option) {
            firstColor2Option.classList.add('selected');
        }

        gradientColor1.value = '#ff0000';
        gradientColor2.value = '#ffff00';
    }

    function handleColorSelection() {
        if (colorSelectionInitialized) {
            return;
        }

        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', function() {
                const color = this.getAttribute('data-color');
                const container = this.closest('.gradient-colors-container > div');

                const siblingOptions = container.querySelectorAll('.color-option');
                siblingOptions.forEach(sibling => {
                    sibling.classList.remove('selected');
                });

                this.classList.add('selected');

                const hiddenInput = container.querySelector('input[type="hidden"]');
                if (hiddenInput) {
                    hiddenInput.value = color;
                }
            });
        });

        colorSelectionInitialized = true;
    }

    window.showGradientModal = function() {
        gradientColorModal.classList.add('is-open');
        gradientColorModal.setAttribute('aria-hidden', 'false');
        initializeSwatchBackgrounds();
        handleColorSelection();

        if (typeof window.lastGradientColors !== 'undefined' && window.lastGradientColors) {
            if (window.lastGradientColors.color1) {
                const color1Option = document.querySelector(`.gradient-colors-container > div:first-child .color-option[data-color="${window.lastGradientColors.color1}"]`);
                if (color1Option) {
                    const color1Options = document.querySelectorAll('.gradient-colors-container > div:first-child .color-option');
                    color1Options.forEach(opt => opt.classList.remove('selected'));
                    color1Option.classList.add('selected');
                    gradientColor1.value = window.lastGradientColors.color1;
                }
            }

            if (window.lastGradientColors.color2) {
                const color2Option = document.querySelector(`.gradient-colors-container > div:last-child .color-option[data-color="${window.lastGradientColors.color2}"]`);
                if (color2Option) {
                    const color2Options = document.querySelectorAll('.gradient-colors-container > div:last-child .color-option');
                    color2Options.forEach(opt => opt.classList.remove('selected'));
                    color2Option.classList.add('selected');
                    gradientColor2.value = window.lastGradientColors.color2;
                }
            }

            if (window.lastGradientColors.direction) {
                gradientDirection.value = window.lastGradientColors.direction;
            }
        } else {
            initializeColorSelection();
        }
    };

    window.hideGradientModal = function() {
        clearAllColorSelections();
        colorSelectionInitialized = false;
        gradientColorModal.classList.remove('is-open');
        gradientColorModal.setAttribute('aria-hidden', 'true');
    };

    const gradientColorBtn = document.querySelector('.action-buttons .btn:first-child');
    if (gradientColorBtn) {
        gradientColorBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.showGradientModal();
        });
    }

    closeGradientColorModal.addEventListener('click', function() {
        window.hideGradientModal();
    });

    gradientColorModalOverlay.addEventListener('click', function(e) {
        if (e.target === gradientColorModalOverlay) {
            window.hideGradientModal();
        }
    });

    applyGradientColorBtn.addEventListener('click', function() {
        const color1 = gradientColor1.value;
        const color2 = gradientColor2.value;
        const direction = gradientDirection.value;

        if (typeof window.lastGradientColors === 'undefined') {
            window.lastGradientColors = {};
        }
        window.lastGradientColors = {
            color1: color1,
            color2: color2,
            direction: direction
        };

        if (typeof window.useProductStore !== 'undefined') {
            try {
                const productStore = window.useProductStore();
                if (productStore && typeof productStore.setGradientColorApplied === 'function') {
                    productStore.setGradientColorApplied(true);
                }
            } catch (error) {
                console.warn('无法更新产品页面渐变色状态:', error);
            }
        }

        if (typeof window.ProductImageCanvas !== 'undefined' && window.ProductImageCanvas.switchToCanvas) {
            window.ProductImageCanvas.switchToCanvas(color1);
        }

        function applyGradientToBaseLayer() {
            if (window.useCanvasStore) {
                const store = window.useCanvasStore();
                const activeViewId = store.activeViewId;

                if (activeViewId && store.views) {
                    const currentView = store.views.find(v => v.id === activeViewId);
                    if (currentView && currentView.base_layer) {
                        if (window.clearAllGradientRects) {
                            window.clearAllGradientRects();
                        }

                        const baseCanvasId = `baseCanvas-${activeViewId}`;
                        const baseCanvas = window.CanvasManager.getCanvas(baseCanvasId) ||
                            (document.getElementById(baseCanvasId) && document.getElementById(baseCanvasId).__fabricCanvas);

                        if (!baseCanvas) {
                            console.warn('无法获取baseCanvas，渐变色应该应用在baseCanvas上');
                            return;
                        }

                        const baseLayerObject = currentView.base_layer;
                        const imageElement = baseLayerObject.getElement();
                        if (!imageElement) {
                            console.warn('无法获取Base图层的图像元素');
                            return;
                        }

                        const imageWidth = imageElement.width || imageElement.naturalWidth;
                        const imageHeight = imageElement.height || imageElement.naturalHeight;

                        let gradientCoords;
                        switch (direction) {
                            case 'to right':
                                gradientCoords = { x1: 0, y1: 0, x2: imageWidth, y2: 0 };
                                break;
                            case 'to bottom':
                                gradientCoords = { x1: 0, y1: 0, x2: 0, y2: imageHeight };
                                break;
                            case 'to bottom right':
                                gradientCoords = { x1: 0, y1: 0, x2: imageWidth, y2: imageHeight };
                                break;
                            case 'to bottom left':
                                gradientCoords = { x1: imageWidth, y1: 0, x2: 0, y2: imageHeight };
                                break;
                            default:
                                gradientCoords = { x1: 0, y1: 0, x2: imageWidth, y2: 0 };
                        }

                        const gradient = new fabric.Gradient({
                            type: 'linear',
                            gradientUnits: 'pixels',
                            coords: gradientCoords,
                            colorStops: [
                                { offset: 0, color: color1 },
                                { offset: 1, color: color2 }
                            ]
                        });

                        const overlayRect = new fabric.Rect({
                            left: baseLayerObject.left,
                            top: baseLayerObject.top,
                            width: imageWidth,
                            height: imageHeight,
                            originX: baseLayerObject.originX,
                            originY: baseLayerObject.originY,
                            scaleX: baseLayerObject.scaleX,
                            scaleY: baseLayerObject.scaleY,
                            angle: baseLayerObject.angle,
                            fill: gradient,
                            selectable: false,
                            evented: false,
                            opacity: baseLayerObject.opacity,
                            globalCompositeOperation: 'source-in',
                            name: 'Base Gradient Overlay',
                            id: 'gradient-rect-' + Date.now()
                        });

                        baseCanvas.add(overlayRect);
                        baseCanvas.sendToBack(baseLayerObject);
                        baseCanvas.bringForward(overlayRect);

                        const overlayLayerObject = baseCanvas.getObjects().find(obj => obj.name === 'Overlay Layer');
                        if (overlayLayerObject) {
                            baseCanvas.bringToFront(overlayLayerObject);
                        }

                        baseCanvas.renderAll();
                    } else {
                        console.warn('当前视图没有 base_layer 或视图不存在');
                    }
                } else {
                    console.warn('没有激活的视图或 store 不可用');
                }
            } else if (typeof window.ProductImageCanvas !== 'undefined' && window.CanvasManager) {
                const productCanvas = window.CanvasManager.getCanvas('product-view');
                if (!productCanvas) {
                    console.warn('无法获取产品画布实例');
                    return;
                }

                const baseLayerObject = productCanvas.getObjects().find(obj =>
                    obj.name === 'Base Layer' || obj.type === 'image'
                );

                if (!baseLayerObject) {
                    console.warn('在产品画布中未找到Base图层');
                    return;
                }

                const existingOverlay = productCanvas.getObjects().find(obj => obj.name === 'Base Gradient Overlay');
                if (existingOverlay) {
                    productCanvas.remove(existingOverlay);
                }

                const imageElement = baseLayerObject.getElement();
                if (!imageElement) {
                    console.warn('无法获取Base图层的图像元素');
                    return;
                }

                const imageWidth = imageElement.width || imageElement.naturalWidth;
                const imageHeight = imageElement.height || imageElement.naturalHeight;

                let gradientCoords;
                switch (direction) {
                    case 'to right':
                        gradientCoords = { x1: 0, y1: 0, x2: imageWidth, y2: 0 };
                        break;
                    case 'to bottom':
                        gradientCoords = { x1: 0, y1: 0, x2: 0, y2: imageHeight };
                        break;
                    case 'to bottom right':
                        gradientCoords = { x1: 0, y1: 0, x2: imageWidth, y2: imageHeight };
                        break;
                    case 'to bottom left':
                        gradientCoords = { x1: imageWidth, y1: 0, x2: 0, y2: imageHeight };
                        break;
                    default:
                        gradientCoords = { x1: 0, y1: 0, x2: imageWidth, y2: 0 };
                }

                const gradient = new fabric.Gradient({
                    type: 'linear',
                    gradientUnits: 'pixels',
                    coords: gradientCoords,
                    colorStops: [
                        { offset: 0, color: color1 },
                        { offset: 1, color: color2 }
                    ]
                });

                const overlayRect = new fabric.Rect({
                    left: baseLayerObject.left,
                    top: baseLayerObject.top,
                    width: imageWidth,
                    height: imageHeight,
                    originX: baseLayerObject.originX,
                    originY: baseLayerObject.originY,
                    scaleX: baseLayerObject.scaleX,
                    scaleY: baseLayerObject.scaleY,
                    angle: baseLayerObject.angle,
                    fill: gradient,
                    selectable: false,
                    evented: false,
                    opacity: baseLayerObject.opacity,
                    globalCompositeOperation: 'source-in',
                    name: 'Base Gradient Overlay',
                    id: 'gradient-rect-' + Date.now()
                });

                productCanvas.add(overlayRect);
                productCanvas.sendToBack(baseLayerObject);
                productCanvas.bringForward(overlayRect);

                const overlayLayerObject = productCanvas.getObjects().find(obj => obj.name === 'Overlay Layer');
                if (overlayLayerObject) {
                    productCanvas.bringToFront(overlayLayerObject);
                }

                productCanvas.renderAll();
            } else {
                console.warn('useCanvasStore 和 ProductImageCanvas 都不可用');
            }
        }

        applyGradientToBaseLayer();

        const colorStatusDisplay = document.getElementById('colorStatusDisplay');
        if (colorStatusDisplay) {
            colorStatusDisplay.textContent = `渐变色: ${color1}`;
        }

        const colorSwatches = document.querySelectorAll('.color-swatch');
        colorSwatches.forEach(s => s.classList.remove('selected'));

        window.hideGradientModal();
    });
});
