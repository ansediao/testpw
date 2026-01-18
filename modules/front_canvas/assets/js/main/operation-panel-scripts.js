document.addEventListener('DOMContentLoaded', () => {
    let designCategoriesList = null;

    function initializeListJS() {
        if (typeof List !== 'undefined') {
            const options = {
                valueNames: ['name'],
                searchClass: 'search',
            };

            designCategoriesList = new List('design-categories-list', options);
            setupSearchFunctionality();
        } else {
            setTimeout(initializeListJS, 100);
        }
    }

    initializeListJS();

    function setupSearchFunctionality() {
        const filterToggleBtn = document.getElementById('filter-toggle-btn');
        const advancedSearchRow = document.getElementById('advanced-search-row');
        const quickSearchInput = document.getElementById('quick-search-input');
        const advancedSearchInput = document.getElementById('advanced-search-input');
        const filterOperator = document.getElementById('filter-operator');

        if (!filterToggleBtn || !advancedSearchRow || !quickSearchInput || !advancedSearchInput || !filterOperator) {
            return;
        }

        filterToggleBtn.addEventListener('click', () => {
            const isVisible = advancedSearchRow.style.display !== 'none';
            advancedSearchRow.style.display = isVisible ? 'none' : 'block';

            if (isVisible) {
                advancedSearchInput.value = '';
                applyAdvancedFilter();
            }
        });

        quickSearchInput.addEventListener('input', (e) => {
            if (!designCategoriesList) {
                return;
            }

            const searchTerm = e.target.value.toLowerCase().trim();

            if (searchTerm === '') {
                designCategoriesList.filter();
                return;
            }

            designCategoriesList.filter((item) => {
                const nameElement = item.elm.querySelector('.name');
                const categoryName = nameElement ? nameElement.textContent.toLowerCase().trim() : '';
                return categoryName.includes(searchTerm);
            });
        });

        function applyAdvancedFilter() {
            if (!designCategoriesList) {
                return;
            }

            const searchTerm = advancedSearchInput.value.toLowerCase();
            const operator = filterOperator.value;

            if (searchTerm === '') {
                designCategoriesList.filter();
                return;
            }

            designCategoriesList.filter((item) => {
                const nameElement = item.elm.querySelector('.name');
                const categoryName = nameElement ? nameElement.textContent.toLowerCase().trim() : '';

                switch (operator) {
                    case 'is':
                        return categoryName === searchTerm;
                    case 'isnot':
                        return categoryName !== searchTerm;
                    case 'contains':
                        return categoryName.includes(searchTerm);
                    case 'notcontains':
                        return !categoryName.includes(searchTerm);
                    default:
                        return true;
                }
            });
        }

        advancedSearchInput.addEventListener('input', applyAdvancedFilter);
        filterOperator.addEventListener('change', applyAdvancedFilter);
    }

    const categoryItems = document.querySelectorAll('.category-item');
    const contentSheji = document.querySelector('.content-sheji');

    if (categoryItems.length && contentSheji) {
        categoryItems.forEach((item) => {
            item.addEventListener('click', () => {
                categoryItems.forEach((i) => i.classList.remove('active'));
                item.classList.add('active');
                contentSheji.classList.add('active');
            });
        });
    }

    const backButtons = document.querySelectorAll('.back-button');
    backButtons.forEach((button) => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const categoryItem = button.closest('.category-item');
            if (categoryItem && contentSheji) {
                categoryItem.classList.remove('active');
                contentSheji.classList.remove('active');
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    window.canvasInitTextUI = function () {
        try {
            const textInputBtn = document.getElementById('text_input');
            if (textInputBtn) {
                textInputBtn.click();
            } else {
                console.warn('#text_input 按钮未找到');
            }
        } catch (err) {
            console.warn('初始化文字界面失败:', err);
        }
    };

    const tabs = document.querySelectorAll('.tab');
    const contentPanes = document.querySelectorAll('.content-pane');

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.classList.remove('panel-collapsed');
            }

            const operationPanel = document.querySelector('.operation-panel');
            if (operationPanel) {
                operationPanel.classList.remove('collapsed');
            }

            tabs.forEach((t) => t.classList.remove('active'));
            tab.classList.add('active');

            contentPanes.forEach((pane) => pane.classList.remove('active'));

            const contentId = 'content-' + tab.id.split('-')[1];
            const activePane = document.getElementById(contentId);
            if (activePane) {
                activePane.classList.add('active');
            }

            if (tab.id === 'tab-pianquan') {
                try {
                    if (window.CanvasManager && typeof window.CanvasManager.getViewIds === 'function') {
                        const viewIds = window.CanvasManager.getViewIds();
                        viewIds.forEach((viewId) => {
                            const canvas = window.CanvasManager.getCanvas(viewId);
                            if (canvas && typeof canvas.discardActiveObject === 'function') {
                                canvas.discardActiveObject();
                                if (typeof canvas.requestRenderAll === 'function') {
                                    canvas.requestRenderAll();
                                } else if (typeof canvas.renderAll === 'function') {
                                    canvas.renderAll();
                                }
                            }
                        });
                    }

                    if (typeof window.updateDynamicToolbar === 'function') {
                        window.updateDynamicToolbar(null);
                    }
                } catch (err) {
                    console.warn('点击图片选项卡时重置失败:', err);
                }
            }

            if (tab.id === 'tab-wenzi') {
                try {
                    const addTextBox = document.getElementById('addTextBtn_box');
                    if (addTextBox) {
                        addTextBox.style.display = 'block';
                    }
                } catch (e) {
                    console.warn('点击文字选项卡时显示 addTextBtn_box 失败:', e);
                }

                try {
                    if (window.CanvasManager && typeof window.CanvasManager.getViewIds === 'function') {
                        const viewIds = window.CanvasManager.getViewIds();
                        viewIds.forEach((viewId) => {
                            const canvas = window.CanvasManager.getCanvas(viewId);
                            if (canvas && typeof canvas.discardActiveObject === 'function') {
                                canvas.discardActiveObject();
                                if (typeof canvas.requestRenderAll === 'function') {
                                    canvas.requestRenderAll();
                                } else if (typeof canvas.renderAll === 'function') {
                                    canvas.renderAll();
                                }
                            }
                        });
                    }
                } catch (err) {
                    console.warn('点击文字选项卡时清空选区失败:', err);
                }

                const activeCanvas =
                    window.CanvasManager && typeof window.CanvasManager.getActiveCanvas === 'function'
                        ? window.CanvasManager.getActiveCanvas()
                        : window.canvas || window.fabricCanvas;

                const activeObject =
                    activeCanvas && typeof activeCanvas.getActiveObject === 'function'
                        ? activeCanvas.getActiveObject()
                        : null;

                if (
                    activeObject &&
                    (activeObject.type === 'text' ||
                        activeObject.type === 'i-text' ||
                        activeObject.type === 'textbox')
                ) {
                    if (typeof window.canvasInitTextUI === 'function') {
                        window.canvasInitTextUI();
                    }
                }
            }
        });
    });

    const collapseBtn = document.getElementById('panelCollapseBtn');
    const operationPanel = document.querySelector('.operation-panel');
    const mainContent = document.querySelector('.main-content');

    if (collapseBtn && operationPanel && mainContent) {
        collapseBtn.addEventListener('click', () => {
            operationPanel.classList.toggle('collapsed');
            mainContent.classList.toggle('panel-collapsed');

            const tabsNav = document.querySelector('.tabs-nav');
            if (tabsNav) {
                tabsNav.querySelectorAll('.tab').forEach((tab) => {
                    tab.classList.remove('active');
                });
            }

            const arrow = collapseBtn.querySelector('svg path');
            if (arrow) {
                if (operationPanel.classList.contains('collapsed')) {
                    arrow.setAttribute('d', 'M9 18L15 12L9 6');
                } else {
                    arrow.setAttribute('d', 'M15 18L9 12L15 6');
                }
            }
        });
    }
});

/**
 * 评价弹窗与 Tab 切换逻辑
 */
document.addEventListener('DOMContentLoaded', () => {
    const showReviewsLink = document.getElementById('show-reviews-link');
    const showCuzInfoLink = document.getElementById('show-cuzInfo-link');
    const reviewsModal = document.getElementById('reviews-modal');
    const closeReviewsModal = document.getElementById('close-reviews-modal');
    const reviewTabs = document.querySelectorAll('#review-tabs .review-tab');
    const reviewTabPanes = document.querySelectorAll('#review-tab-content .review-tab-pane');

    function switchReviewTabByIndex(tabIndex) {
        if (!reviewTabs.length || !reviewTabPanes.length) return;

        reviewTabs.forEach((t) => {
            t.classList.remove('active');
            t.style.background = '';
        });
        reviewTabPanes.forEach((pane) => {
            pane.style.display = 'none';
            pane.classList.remove('active');
        });

        if (reviewTabs[tabIndex] && reviewTabPanes[tabIndex]) {
            reviewTabs[tabIndex].classList.add('active');
            reviewTabs[tabIndex].style.background = '#fff';
            reviewTabPanes[tabIndex].style.display = '';
            reviewTabPanes[tabIndex].classList.add('active');
        }

        if (reviewsModal) {
            reviewsModal.style.display = 'flex';
        }
    }

    function switchReviewTabByKey(tabKey) {
        if (!reviewTabs.length || !reviewTabPanes.length) return;

        reviewTabs.forEach((tab) => {
            tab.classList.remove('active');
            tab.style.background = '';
        });

        reviewTabPanes.forEach((pane) => {
            pane.style.display = 'none';
            pane.classList.remove('active');
        });

        reviewTabs.forEach((tab) => {
            const key = tab.getAttribute('data-tab');
            if (key === tabKey) {
                tab.classList.add('active');
                tab.style.background = '#fff';
            }
        });

        reviewTabPanes.forEach((pane) => {
            const key = pane.getAttribute('data-content');
            if (key === tabKey) {
                pane.style.display = '';
                pane.classList.add('active');
            }
        });

        if (reviewsModal) {
            reviewsModal.style.display = 'flex';
        }
    }

    if (showReviewsLink) {
        showReviewsLink.addEventListener('click', (e) => {
            e.preventDefault();
            switchReviewTabByIndex(1);
        });
    }

    if (showCuzInfoLink) {
        showCuzInfoLink.addEventListener('click', (e) => {
            e.preventDefault();
            switchReviewTabByIndex(2);
        });
    }

    reviewTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const tabKey = tab.getAttribute('data-tab');
            switchReviewTabByKey(tabKey);
        });
    });

    if (closeReviewsModal && reviewsModal) {
        closeReviewsModal.addEventListener('click', () => {
            reviewsModal.style.display = 'none';
        });

        reviewsModal.addEventListener('click', (e) => {
            if (e.target === reviewsModal) {
                reviewsModal.style.display = 'none';
            }
        });
    }
});

/**
 * 颜色样本、纯色/渐变、自定义颜色及样品订单逻辑
 * 从 canvas-operation-panel-content.php 内联脚本迁移
 */
document.addEventListener('DOMContentLoaded', () => {
    const colorSwatchesContainer = document.getElementById('color-swatches-container');

    // 工具：判断是否为浅色
    function isLightColor(color) {
        const hex = String(color || '').replace('#', '');
        if (hex.length !== 6) return false;
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 200;
    }

    // 生成默认颜色（当没有产品变体数据时备用）
    function generateDefaultColors(container, selectedColor = null) {
        const defaultColors = [];
        container.innerHTML = '';
        defaultColors.forEach((colorData, index) => {
            const colorSwatch = document.createElement('div');
            const isSelected = selectedColor
                ? colorData.color === selectedColor
                : index === 0;
            colorSwatch.className = 'color-swatch' + (isSelected ? ' selected' : '');
            colorSwatch.style.backgroundColor = colorData.color;
            colorSwatch.setAttribute('data-color', colorData.color);
            colorSwatch.title = colorData.name;

            if (isLightColor(colorData.color)) {
                colorSwatch.style.border = '1px solid #9ca3af';
            }

            container.appendChild(colorSwatch);
        });

        bindColorSwatchEvents();
    }

    // 处理颜色选中后的业务逻辑
    function handleColorSwatchClick(color) {
        // 更新全局颜色
        window.currentColor = color;

        // 同步预览区域颜色图片（沿用旧逻辑）
        try {
            const shadowCanvas = document.getElementById('shadowLayer');
            if (shadowCanvas && typeof window.loadColorImage === 'function') {
                const colorImageUrl = shadowCanvas.getAttribute('data-color-image');
                if (colorImageUrl) {
                    window.loadColorImage(colorImageUrl, color);
                }
            }
        } catch (e) {
            console.warn('更新预览颜色失败:', e);
        }

        // 清除所有渐变覆盖
        if (window.clearAllGradientRects) {
            window.clearAllGradientRects();
        }

        // 保存颜色到 Pinia store，并同步 Product Store
        function saveColorToStore(selectedColor) {
            if (!window.useCanvasStore) {
                console.warn('CanvasStore 不可用');
                return;
            }

            const store = window.useCanvasStore();
            const activeViewId = store.activeViewId;

            if (!activeViewId) {
                console.warn('没有激活的视图ID');
                return;
            }

            const selectedSwatch = document.querySelector('.color-swatch.selected');
            if (!selectedSwatch) {
                console.warn('未找到选中的颜色样本元素');
                return;
            }

            const variantId = selectedSwatch.getAttribute('data-variant-id');
            let completeVariantData = null;

            if (variantId && store.productData && store.productData.variants && store.productData.variants.data) {
                const variants = store.productData.variants.data;
                completeVariantData = variants.find((variant) => String(variant.id) === String(variantId));
            }

            let colorData;
            if (completeVariantData) {
                colorData = {
                    ...completeVariantData,
                    selectedColor: selectedColor,
                };
            } else {
                const variantName = selectedSwatch.getAttribute('data-variant-name');
                const value = selectedSwatch.getAttribute('data-color');
                colorData = {
                    variantId: variantId || null,
                    variantName: variantName || null,
                    color: value || selectedColor,
                    selectedColor: selectedColor,
                };
            }

            if (typeof store.setSelectedColorByView === 'function') {
                store.setSelectedColorByView(activeViewId, colorData);
            }

            if (window.useProductStore && completeVariantData) {
                try {
                    const productStore = window.useProductStore();
                    if (productStore && typeof productStore.setSelectedVariant === 'function') {
                        productStore.setSelectedVariant(completeVariantData);
                    }

                    const event = new CustomEvent('pw-color-variant-selected', {
                        detail: { variant: completeVariantData },
                    });
                    document.dispatchEvent(event);
                } catch (error) {
                    console.warn('更新 Product Store selectedVariant 失败:', error);
                }
            } else if (window.useProductStore && !completeVariantData) {
                try {
                    const productStore = window.useProductStore();
                    const basicVariant = {
                        id: variantId || 'design-' + Date.now(),
                        variant_color: selectedColor,
                        variant_name: selectedSwatch.getAttribute('data-variant-name') || '自定义颜色',
                        type: 'design-selected',
                        isDesignSelected: true,
                    };
                    productStore.setSelectedVariant(basicVariant);

                    const event = new CustomEvent('pw-color-variant-selected', {
                        detail: { variant: basicVariant },
                    });
                    document.dispatchEvent(event);
                } catch (error) {
                    console.warn('创建基本 selectedVariant 失败:', error);
                }
            }
        }

        saveColorToStore(color);

        // 计算各视图 rts_for_bulk_order 最大值相加
        (function calculateBulkOrderRts() {
            if (window.useCanvasStore) {
                const store = window.useCanvasStore();
                const totalRts = store.getTotalMaxRtsForBulkOrder;
                document.dispatchEvent(
                    new CustomEvent('pw-bulk-order-rts-calculated', {
                        detail: { totalRts },
                    })
                );
            }
        })();

        function applyColorTint() {
            if (!window.useCanvasStore) {
                return;
            }
            const tintFn =
                typeof window.applyTintFilter === 'function' ? window.applyTintFilter : null;
            if (!tintFn) {
                return;
            }

            const store = window.useCanvasStore();
            const activeViewId = store.activeViewId;

            if (!activeViewId || !store.views) {
                console.warn('没有激活的视图或 store 不可用');
                return;
            }

            const currentView = store.views.find((v) => v.id === activeViewId);
            if (!currentView || !currentView.base_layer) {
                console.warn('当前视图没有 base_layer 或视图不存在');
                return;
            }

            tintFn(currentView.base_layer, color, 1);
            if (currentView.base_layer.applyFilters) {
                currentView.base_layer.applyFilters();
            }

            if (window.CanvasManager) {
                const activeCanvas = window.CanvasManager.getActiveCanvas();
                if (activeCanvas) {
                    if (currentView.base_layer.canvas) {
                        currentView.base_layer.canvas.renderAll();
                    }
                    activeCanvas.renderAll();
                    requestAnimationFrame(() => {
                        activeCanvas.renderAll();
                    });
                }
            }
        }

        function isFirstView() {
            if (!window.useCanvasStore) return false;
            const store = window.useCanvasStore();
            if (!store.views || store.views.length === 0) return false;
            return store.activeViewId === store.views[0].id;
        }

        if (isFirstView()) {
            if (typeof window.applyColorToAllViews === 'function') {
                window.applyColorToAllViews(color);
            } else {
                applyColorTint();
            }
        } else {
            const tintAvailable =
                typeof window.applyTintFilter === 'function' || typeof applyTintFilter === 'function';

            if (tintAvailable) {
                applyColorTint();
            } else {
                const checkInterval = setInterval(() => {
                    if (
                        typeof window.applyTintFilter === 'function' ||
                        typeof applyTintFilter === 'function'
                    ) {
                        clearInterval(checkInterval);
                        applyColorTint();
                    }
                }, 100);

                setTimeout(() => {
                    clearInterval(checkInterval);
                    console.warn('applyTintFilter function not available after timeout');
                }, 5000);
            }
        }
    }

    // 将颜色应用到单个视图（全局复用）
    window.isFourGridView =
        window.isFourGridView ||
        function (view) {
            return view && view.view_flow === '4-Grid Flow';
        };
    const isFourGridView = window.isFourGridView;

    window.applyColorToView = function (view, color, tintFunction) {
        if (!view) {
            console.warn('无法应用颜色：视图数据无效');
            return;
        }

        if (isFourGridView(view)) {
            return;
        }

        if (!view.base_layer) {
            return;
        }

        const effectiveTint =
            tintFunction ||
            (typeof window.applyTintFilter === 'function' ? window.applyTintFilter : null);
        if (typeof effectiveTint !== 'function') {
            return;
        }

        effectiveTint(view.base_layer, color, 1);

        if (view.base_layer.applyFilters) {
            view.base_layer.applyFilters();
        }

        const canvas =
            view.base_layer.canvas ||
            (window.CanvasManager ? window.CanvasManager.getCanvas(view.id) : null);
        if (canvas) {
            if (view.base_layer.canvas && view.base_layer.canvas !== canvas) {
                view.base_layer.canvas.renderAll();
            }
            canvas.renderAll();
            requestAnimationFrame(() => {
                canvas.renderAll();
            });
        }
    };

    // 应用颜色到所有视图（全局）
    window.applyColorToAllViews = function (color) {
        if (!window.useCanvasStore) {
            return;
        }

        const store = window.useCanvasStore();
        if (!store.views || store.views.length === 0) {
            console.warn('没有视图数据');
            return;
        }

        const tintFunction =
            typeof window.applyTintFilter === 'function' ? window.applyTintFilter : null;
        if (typeof tintFunction !== 'function') {
            console.warn('applyTintFilter 函数不可用');
            return;
        }

        let hasFourGrid = false;

        store.views.forEach((view) => {
            if (isFourGridView(view)) {
                hasFourGrid = true;
                return;
            }
            window.applyColorToView(view, color, tintFunction);
        });

        if (hasFourGrid) {
            window.currentColor = color;
        }

        if (typeof window.__pwcaUpdatePriceDisplay === 'function') {
            window.__pwcaUpdatePriceDisplay();
        }
    };

    // 视图切换时，同步纯色到新视图
    document.addEventListener('layerPanelViewSwitch', (ev) => {
        try {
            const viewId = ev && ev.detail ? ev.detail.viewId : null;
            const color = window.currentColor;
            if (!viewId || !color || color === '#000000') {
                return;
            }
            if (!window.useCanvasStore) return;
            const store = window.useCanvasStore();
            let attempts = 0;

            const tryApply = () => {
                const view = store.views ? store.views.find((v) => v.id === viewId) : null;
                if (!view) return;

                if (typeof isFourGridView === 'function' && isFourGridView(view)) {
                    return;
                }

                if (!view.base_layer) {
                    attempts++;
                    if (attempts < 30) {
                        setTimeout(tryApply, 100);
                    }
                    return;
                }

                const tintFunction =
                    typeof window.applyTintFilter === 'function' ? window.applyTintFilter : null;
                if (typeof tintFunction !== 'function') {
                    console.warn('applyTintFilter 函数不可用，无法在视图切换时应用颜色');
                    return;
                }

                window.applyColorToView(view, color, tintFunction);
            };

            requestAnimationFrame(tryApply);
        } catch (err) {
            console.warn('视图切换颜色同步时出现错误:', err);
        }
    });

    // 渐变相关函数
    const getGradientCoords = (direction, width, height) => {
        switch (direction) {
            case 'to right':
                return { x1: 0, y1: 0, x2: width, y2: 0 };
            case 'to bottom':
                return { x1: 0, y1: 0, x2: 0, y2: height };
            case 'to bottom right':
                return { x1: 0, y1: 0, x2: width, y2: height };
            case 'to bottom left':
                return { x1: width, y1: 0, x2: 0, y2: height };
            default:
                return { x1: 0, y1: 0, x2: width, y2: 0 };
        }
    };

    window.applyGradientToView = function (view, startColor, endColor, direction) {
        if (!view || typeof fabric === 'undefined') {
            return;
        }

        if (isFourGridView(view)) {
            return;
        }

        const baseLayerObject = view.base_layer;
        if (!baseLayerObject) {
            return;
        }

        const baseCanvasId = `baseCanvas-${view.id}`;
        let baseCanvas = null;

        if (window.CanvasManager && typeof window.CanvasManager.getCanvas === 'function') {
            baseCanvas =
                window.CanvasManager.getCanvas(baseCanvasId) ||
                window.CanvasManager.getCanvas(view.id);
        }

        if (!baseCanvas) {
            const baseCanvasElement = document.getElementById(baseCanvasId);
            if (baseCanvasElement && baseCanvasElement.__fabricCanvas) {
                baseCanvas = baseCanvasElement.__fabricCanvas;
            }
        }

        if (!baseCanvas && baseLayerObject.canvas) {
            baseCanvas = baseLayerObject.canvas;
        }

        if (!baseCanvas) {
            console.warn(`无法获取视图 ${view.name || view.id} 的 baseCanvas`);
            return;
        }

        const element =
            typeof baseLayerObject.getElement === 'function'
                ? baseLayerObject.getElement()
                : baseLayerObject._originalElement || baseLayerObject._element || null;

        if (!element) {
            console.warn('无法获取Base图层的图像元素');
            return;
        }

        const fallbackWidth =
            typeof baseLayerObject.getScaledWidth === 'function'
                ? baseLayerObject.getScaledWidth()
                : baseLayerObject.width;
        const fallbackHeight =
            typeof baseLayerObject.getScaledHeight === 'function'
                ? baseLayerObject.getScaledHeight()
                : baseLayerObject.height;

        const imageWidth = element.width || element.naturalWidth || fallbackWidth;
        const imageHeight = element.height || element.naturalHeight || fallbackHeight;

        if (!imageWidth || !imageHeight) {
            console.warn('无法确定渐变覆盖层的尺寸');
            return;
        }

        const overlaysToRemove = [];
        if (typeof baseCanvas.getObjects === 'function') {
            baseCanvas.getObjects().forEach((obj) => {
                if (
                    (obj.id && obj.id.startsWith('gradient-rect-')) ||
                    (obj.name && obj.name === 'Base Gradient Overlay')
                ) {
                    overlaysToRemove.push(obj);
                }
            });
        }

        overlaysToRemove.forEach((obj) => baseCanvas.remove(obj));

        const gradientCoords = getGradientCoords(direction, imageWidth, imageHeight);

        const gradient = new fabric.Gradient({
            type: 'linear',
            gradientUnits: 'pixels',
            coords: gradientCoords,
            colorStops: [
                { offset: 0, color: startColor },
                { offset: 1, color: endColor },
            ],
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
            id: `gradient-rect-${view.id}-${Date.now()}`,
        });

        baseCanvas.add(overlayRect);
        if (typeof baseCanvas.sendToBack === 'function') {
            baseCanvas.sendToBack(baseLayerObject);
        }
        if (typeof baseCanvas.bringForward === 'function') {
            baseCanvas.bringForward(overlayRect);
        }

        const overlayLayerObject =
            typeof baseCanvas.getObjects === 'function'
                ? baseCanvas.getObjects().find((obj) => obj.name === 'Overlay Layer')
                : null;
        if (overlayLayerObject && typeof baseCanvas.bringToFront === 'function') {
            baseCanvas.bringToFront(overlayLayerObject);
        }

        if (typeof baseCanvas.renderAll === 'function') {
            baseCanvas.renderAll();
        }
    };

    // 动态生成颜色样本
    function generateColorSwatches() {
        const container = colorSwatchesContainer;
        if (!container) return;

        const currentSelected = container.querySelector('.color-swatch.selected');
        const selectedColor = currentSelected ? currentSelected.getAttribute('data-color') : null;

        if (typeof window.useCanvasStore === 'undefined') {
            console.warn('CanvasStore 未加载，使用默认颜色');
            generateDefaultColors(container, selectedColor);
            return;
        }

        const store = window.useCanvasStore();

        if (!store.productData || !store.productData.variants || !store.productData.variants.data) {
            console.warn('产品变体数据未加载，使用默认颜色');
            generateDefaultColors(container, selectedColor);
            return;
        }

        const variants = store.productData.variants.data;
        if (!variants || variants.length === 0) {
            console.warn('没有找到产品变体，使用默认颜色');
            generateDefaultColors(container, selectedColor);
            return;
        }

        const normalVariants = variants.filter(
            (variant) =>
                variant.type === 'normal' &&
                variant.variant_color &&
                variant.variant_color.trim() !== ''
        );

        if (normalVariants.length === 0) {
            console.warn('没有找到有效的颜色变体，使用默认颜色');
            generateDefaultColors(container, selectedColor);
            return;
        }

        container.innerHTML = '';

        normalVariants.forEach((variant) => {
            const colorSwatch = document.createElement('div');
            const isSelected = selectedColor
                ? variant.variant_color === selectedColor
                : false;
            colorSwatch.className = 'color-swatch' + (isSelected ? ' selected' : '');
            colorSwatch.style.backgroundColor = variant.variant_color;
            colorSwatch.setAttribute('data-color', variant.variant_color);
            colorSwatch.setAttribute('data-variant-id', variant.id);
            colorSwatch.setAttribute('data-variant-name', variant.variant_name);
            colorSwatch.title = variant.variant_name || variant.variant_color;

            if (isLightColor(variant.variant_color)) {
                colorSwatch.style.border = '1px solid #9ca3af';
            }

            container.appendChild(colorSwatch);
        });

        bindColorSwatchEvents();
    }

    // 绑定颜色样本事件
    function bindColorSwatchEvents() {
        const colorSwatches = document.querySelectorAll('.color-swatch');
        colorSwatches.forEach((swatch) => {
            if (swatch._colorSwatchHandler) {
                swatch.removeEventListener('click', swatch._colorSwatchHandler);
            }

            swatch._colorSwatchHandler = function () {
                colorSwatches.forEach((s) => s.classList.remove('selected'));
                swatch.classList.add('selected');
                const color = swatch.getAttribute('data-color');
                handleColorSwatchClick(color);
            };

            swatch.addEventListener('click', swatch._colorSwatchHandler);
        });
    }

    function waitForCanvasData() {
        if (typeof window.useCanvasStore !== 'undefined') {
            const store = window.useCanvasStore();

            if (store.productData && store.productData.variants && store.productData.variants.data) {
                generateColorSwatches();
                return;
            }

            if (store.$subscribe) {
                store.$subscribe((mutation, state) => {
                    if (
                        state.productData &&
                        state.productData.variants &&
                        state.productData.variants.data
                    ) {
                        generateColorSwatches();
                    }
                });
            }
        }

        setTimeout(() => {
            if (typeof window.useCanvasStore === 'undefined') {
                const container = colorSwatchesContainer;
                if (container && container.children.length === 0) {
                    // 这里保留为空，默认不渲染任何颜色
                }
            }
        }, 2000);
    }

    waitForCanvasData();

    // 颜色状态显示 & 自定义颜色/渐变逻辑
    const colorStatusDisplay = document.getElementById('colorStatusDisplay');

    function clearAllColorEffects() {
        if (window.clearAllGradientRects) {
            window.clearAllGradientRects();
        }

        window.currentColor = '#000000';

        const colorSwatches = document.querySelectorAll('.color-swatch');
        colorSwatches.forEach((s) => s.classList.remove('selected'));

        if (window.useCanvasStore) {
            const store = window.useCanvasStore();
            if (store.views && store.views.length > 0) {
                store.views.forEach((view) => {
                    if (view.base_layer) {
                        view.base_layer.filters = [];

                        if (view.base_layer._element && view.base_layer._originalElement) {
                            view.base_layer.setElement(view.base_layer._originalElement);
                        } else if (view.base_layer._element) {
                            const originalSrc = view.base_layer._element.src;
                            if (originalSrc) {
                                const img = new Image();
                                img.crossOrigin = 'anonymous';
                                img.onload = () => {
                                    view.base_layer.setElement(img);
                                    view.base_layer._originalElement = img;
                                    view.base_layer.applyFilters();

                                    if (window.CanvasManager) {
                                        const canvas = window.CanvasManager.getCanvas(view.id);
                                        if (canvas) {
                                            canvas.renderAll();

                                            const baseCanvasId = `baseCanvas-${view.id}`;
                                            const baseCanvas =
                                                window.CanvasManager.getCanvas(baseCanvasId) ||
                                                (document.getElementById(baseCanvasId) &&
                                                    document.getElementById(baseCanvasId)
                                                        .__fabricCanvas);
                                            if (baseCanvas) {
                                                baseCanvas.renderAll();
                                            }
                                        }
                                    }
                                };
                                img.src = originalSrc;
                            }
                        }

                        view.base_layer.applyFilters();

                        if (window.CanvasManager) {
                            const canvas = window.CanvasManager.getCanvas(view.id);
                            if (canvas) {
                                canvas.renderAll();

                                const baseCanvasId = `baseCanvas-${view.id}`;
                                const baseCanvas =
                                    window.CanvasManager.getCanvas(baseCanvasId) ||
                                    (document.getElementById(baseCanvasId) &&
                                        document.getElementById(baseCanvasId).__fabricCanvas);
                                if (baseCanvas) {
                                    baseCanvas.renderAll();
                                }
                            }
                        }
                    }
                });
            }
        }

        if (colorStatusDisplay) {
            colorStatusDisplay.style.display = 'none';
        }
    }

    window.clearAllColorEffects = clearAllColorEffects;

    window.updateColorStatusUI = function (color) {
        window.currentColor = color;

        if (!colorStatusDisplay) return;

        colorStatusDisplay.innerHTML = `Selected: ${color}  <a href="#" id="clearColorLink" style="margin-left: 10px; color: #dc3545; text-decoration: none; font-size: 16px; font-weight: bold;">✕</a>  <a href="#" id="changeColorLink" style="margin-left: 10px; color: #007cba; text-decoration: none;">切换颜色</a>`;
        colorStatusDisplay.style.display = 'block';

        const clearColorLink = document.getElementById('clearColorLink');
        if (clearColorLink) {
            clearColorLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.clearAllColorEffects) window.clearAllColorEffects();
            });
        }

        const changeColorLink = document.getElementById('changeColorLink');
        if (changeColorLink) {
            changeColorLink.addEventListener('click', (e) => {
                e.preventDefault();
                const customColorModal = document.getElementById('custom-color-modal');
                if (customColorModal) {
                    customColorModal.style.display = 'flex';
                }
            });
        }
    };

    window.clearExplicitColorSelection = function () {
        try {
            const swatches = document.querySelectorAll('.color-swatch');
            swatches.forEach((s) => s.classList.remove('selected'));
            const customSwatch = document.querySelector('.color-swatch[data-custom-color="true"]');
            if (customSwatch) {
                customSwatch.remove();
            }
            const picker = document.getElementById('customColorPicker');
            if (picker) {
                picker.value = '#000000';
            }
            window.currentColor = '#000000';
        } catch (e) {
            console.warn('清除显式颜色选择状态时发生错误:', e);
        }
    };

    const customColorBtn = document.querySelector('.action-buttons .btn:nth-child(2)');
    const customColorModal = document.getElementById('custom-color-modal');
    const closeCustomColorModal = document.getElementById('close-custom-color-modal');
    const applyCustomColorBtn = document.getElementById('applyCustomColor');
    const customColorPicker = document.getElementById('customColorPicker');

    let lastGradientColors = {
        color1: '#ff0000',
        color2: '#ffff00',
        direction: 'to right',
    };

    if (
        customColorBtn &&
        customColorModal &&
        closeCustomColorModal &&
        applyCustomColorBtn &&
        customColorPicker
    ) {
        customColorBtn.addEventListener('click', (e) => {
            e.preventDefault();
            customColorModal.style.display = 'flex';
        });
        closeCustomColorModal.addEventListener('click', () => {
            customColorModal.style.display = 'none';
        });
        customColorModal.addEventListener('click', (e) => {
            if (e.target === customColorModal) {
                customColorModal.style.display = 'none';
            }
        });

        applyCustomColorBtn.addEventListener('click', () => {
            const color = customColorPicker.value;

            if (typeof window.clearExplicitColorSelection === 'function') {
                window.clearExplicitColorSelection();
            }

            window.currentColor = color;

            if (window.clearAllGradientRects) {
                window.clearAllGradientRects();
            }

            function applyCustomColorToBaseLayer() {
                if (!window.useCanvasStore) return;

                const tintFn =
                    typeof window.applyTintFilter === 'function' ? window.applyTintFilter : null;
                if (!tintFn) return;

                const store = window.useCanvasStore();
                const activeViewId = store.activeViewId;

                if (!activeViewId || !store.views) return;

                const currentView = store.views.find((v) => v.id === activeViewId);
                if (!currentView || !currentView.base_layer) return;

                if (typeof isFourGridView === 'function' && isFourGridView(currentView)) {
                    if (typeof window.applyColorToAllViews === 'function') {
                        window.applyColorToAllViews(color);
                    }
                    return;
                }

                if (!currentView.base_layer._originalElement && currentView.base_layer._element) {
                    const originalImg = new Image();
                    originalImg.crossOrigin = 'anonymous';
                    originalImg.src = currentView.base_layer._element.src;
                    originalImg.onload = () => {
                        currentView.base_layer._originalElement = originalImg;
                    };
                }

                tintFn(currentView.base_layer, color, 1);

                if (currentView.base_layer.applyFilters) {
                    currentView.base_layer.applyFilters();
                }

                if (window.CanvasManager) {
                    const activeCanvas = window.CanvasManager.getActiveCanvas();
                    if (activeCanvas) {
                        if (currentView.base_layer.canvas) {
                            currentView.base_layer.canvas.renderAll();
                        }
                        activeCanvas.renderAll();
                        requestAnimationFrame(() => {
                            activeCanvas.renderAll();
                        });
                    }
                }

                if (typeof window.applyColorToAllViews === 'function') {
                    window.applyColorToAllViews(color);
                }
            }

            const tintAvailable =
                typeof window.applyTintFilter === 'function' || typeof applyTintFilter === 'function';

            if (tintAvailable) {
                applyCustomColorToBaseLayer();
            } else {
                const checkInterval = setInterval(() => {
                    if (
                        typeof window.applyTintFilter === 'function' ||
                        typeof applyTintFilter === 'function'
                    ) {
                        clearInterval(checkInterval);
                        applyCustomColorToBaseLayer();
                    }
                }, 100);

                setTimeout(() => {
                    clearInterval(checkInterval);
                }, 5000);
            }

            if (colorStatusDisplay) {
                colorStatusDisplay.innerHTML = `Selected: ${color}  <a href="#" id="clearColorLink" style="margin-left: 10px; color: #dc3545; text-decoration: none; font-size: 16px; font-weight: bold;">✕</a>  <a href="#" id="changeColorLink" style="margin-left: 10px; color: #007cba; text-decoration: none;">切换颜色</a>`;
                colorStatusDisplay.style.display = 'block';

                const clearColorLink = document.getElementById('clearColorLink');
                if (clearColorLink) {
                    clearColorLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        clearAllColorEffects();
                    });
                }

                const changeColorLink = document.getElementById('changeColorLink');
                if (changeColorLink) {
                    changeColorLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        const modal = document.getElementById('custom-color-modal');
                        if (modal) {
                            modal.style.display = 'flex';
                        }
                    });
                }
            }

            customColorModal.style.display = 'none';

            // 同步预览区域
            try {
                const shadowCanvas = document.getElementById('shadowLayer');
                if (shadowCanvas && typeof window.loadColorImage === 'function') {
                    const colorImageUrl = shadowCanvas.getAttribute('data-color-image');
                    if (colorImageUrl) {
                        window.loadColorImage(colorImageUrl, color);
                    }
                }
            } catch (e) {
                console.warn('更新预览颜色失败:', e);
            }
        });
    }

    // 恢复渐变弹窗上次选择
    if (typeof window.showGradientModal === 'function') {
        const originalShowGradientModal = window.showGradientModal;
        window.showGradientModal = function () {
            originalShowGradientModal();

            setTimeout(() => {
                const color1Option = document.querySelector(
                    `.gradient-colors-container > div:first-child .color-option[data-color="${lastGradientColors.color1}"]`
                );
                if (color1Option) {
                    const color1Options = document.querySelectorAll(
                        '.gradient-colors-container > div:first-child .color-option'
                    );
                    color1Options.forEach((opt) => opt.classList.remove('selected'));
                    color1Option.classList.add('selected');
                    const input1 = document.getElementById('gradientColor1');
                    if (input1) input1.value = lastGradientColors.color1;
                }

                const color2Option = document.querySelector(
                    `.gradient-colors-container > div:last-child .color-option[data-color="${lastGradientColors.color2}"]`
                );
                if (color2Option) {
                    const color2Options = document.querySelectorAll(
                        '.gradient-colors-container > div:last-child .color-option'
                    );
                    color2Options.forEach((opt) => opt.classList.remove('selected'));
                    color2Option.classList.add('selected');
                    const input2 = document.getElementById('gradientColor2');
                    if (input2) input2.value = lastGradientColors.color2;
                }

                const gradientDirection = document.getElementById('gradientDirection');
                if (gradientDirection) {
                    gradientDirection.value = lastGradientColors.direction;
                }
            }, 100);
        };
    }

    // 渐变应用按钮
    const applyGradientColorBtn = document.getElementById('applyGradientColor');
    if (applyGradientColorBtn) {
        const newApplyGradientBtn = applyGradientColorBtn.cloneNode(true);
        applyGradientColorBtn.parentNode.replaceChild(newApplyGradientBtn, applyGradientColorBtn);

        newApplyGradientBtn.addEventListener('click', () => {
            const color1 = document.getElementById('gradientColor1').value;
            const color2 = document.getElementById('gradientColor2').value;
            const direction = document.getElementById('gradientDirection').value;

            lastGradientColors = {
                color1,
                color2,
                direction,
            };

            if (typeof window.useProductStore !== 'undefined') {
                try {
                    const productStore = window.useProductStore();
                    if (
                        productStore &&
                        typeof productStore.setGradientColorApplied === 'function'
                    ) {
                        productStore.setGradientColorApplied(true);
                    }
                } catch (error) {
                    console.warn('无法更新产品页面渐变色状态:', error);
                }
            }

            if (
                typeof window.ProductImageCanvas !== 'undefined' &&
                window.ProductImageCanvas.switchToCanvas
            ) {
                window.ProductImageCanvas.switchToCanvas(color1);
            }

            function applyGradientToBaseLayer() {
                if (window.useCanvasStore) {
                    const store = window.useCanvasStore();
                    const activeViewId = store.activeViewId;

                    if (!activeViewId || !store.views) {
                        console.warn('没有激活的视图或 store 不可用');
                        return;
                    }

                    const currentView = store.views.find((v) => v.id === activeViewId);
                    if (!currentView || !currentView.base_layer) {
                        console.warn('当前视图没有 base_layer 或视图不存在');
                        return;
                    }

                    if (window.clearAllGradientRects) {
                        window.clearAllGradientRects();
                    }

                    if (typeof window.applyGradientToView === 'function') {
                        if (!isFourGridView(currentView)) {
                            window.applyGradientToView(currentView, color1, color2, direction);
                        }

                        const isMainView =
                            store.views.length > 0 && store.views[0].id === activeViewId;
                        if (isMainView) {
                            store.views.forEach((view) => {
                                if (view.id !== currentView.id) {
                                    if (isFourGridView(view)) {
                                        return;
                                    }
                                    window.applyGradientToView(view, color1, color2, direction);
                                }
                            });
                        }
                    } else {
                        console.warn('applyGradientToView 函数不可用');
                    }
                } else if (
                    typeof window.ProductImageCanvas !== 'undefined' &&
                    window.CanvasManager
                ) {
                    const productCanvas = window.CanvasManager.getCanvas('product-view');
                    if (productCanvas) {
                        const baseLayerObject = productCanvas
                            .getObjects()
                            .find(
                                (obj) =>
                                    obj.name === 'Base Layer' || obj.type === 'image'
                            );

                        if (baseLayerObject) {
                            const existingOverlay = productCanvas
                                .getObjects()
                                .find((obj) => obj.name === 'Base Gradient Overlay');
                            if (existingOverlay) {
                                productCanvas.remove(existingOverlay);
                            }

                            const imageElement = baseLayerObject.getElement();
                            if (imageElement) {
                                const imageWidth =
                                    imageElement.width || imageElement.naturalWidth;
                                const imageHeight =
                                    imageElement.height || imageElement.naturalHeight;

                                let gradientCoords;
                                switch (direction) {
                                    case 'to right':
                                        gradientCoords = {
                                            x1: 0,
                                            y1: 0,
                                            x2: imageWidth,
                                            y2: 0,
                                        };
                                        break;
                                    case 'to bottom':
                                        gradientCoords = {
                                            x1: 0,
                                            y1: 0,
                                            x2: 0,
                                            y2: imageHeight,
                                        };
                                        break;
                                    case 'to bottom right':
                                        gradientCoords = {
                                            x1: 0,
                                            y1: 0,
                                            x2: imageWidth,
                                            y2: imageHeight,
                                        };
                                        break;
                                    case 'to bottom left':
                                        gradientCoords = {
                                            x1: imageWidth,
                                            y1: 0,
                                            x2: 0,
                                            y2: imageHeight,
                                        };
                                        break;
                                    default:
                                        gradientCoords = {
                                            x1: 0,
                                            y1: 0,
                                            x2: imageWidth,
                                            y2: 0,
                                        };
                                }

                                const gradient = new fabric.Gradient({
                                    type: 'linear',
                                    gradientUnits: 'pixels',
                                    coords: gradientCoords,
                                    colorStops: [
                                        { offset: 0, color: color1 },
                                        { offset: 1, color: color2 },
                                    ],
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
                                    id: 'gradient-rect-' + Date.now(),
                                });

                                productCanvas.add(overlayRect);
                                productCanvas.sendToBack(baseLayerObject);
                                productCanvas.bringForward(overlayRect);

                                const overlayLayerObject = productCanvas
                                    .getObjects()
                                    .find((obj) => obj.name === 'Overlay Layer');
                                if (overlayLayerObject) {
                                    productCanvas.bringToFront(overlayLayerObject);
                                }

                                productCanvas.renderAll();
                            } else {
                                console.warn('无法获取Base图层的图像元素');
                            }
                        } else {
                            console.warn('在产品画布中未找到Base图层');
                        }
                    } else {
                        console.warn('无法获取产品画布实例');
                    }
                } else {
                    console.warn('useCanvasStore 和 ProductImageCanvas 都不可用');
                }
            }

            applyGradientToBaseLayer();

            if (colorStatusDisplay) {
                colorStatusDisplay.innerHTML = `渐变色: ${color1} <a href="#" id="clearColorLink" style="margin-left: 10px; color: #dc3545; text-decoration: none; font-size: 16px; font-weight: bold;">✕</a> <a href="#" id="switchColorLink" style="margin-left: 10px; color: #007cba; text-decoration: none;">切换颜色</a>`;
                colorStatusDisplay.style.display = 'block';

                const clearColorLink = document.getElementById('clearColorLink');
                if (clearColorLink) {
                    clearColorLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        clearAllColorEffects();
                    });
                }

                const switchColorLink = document.getElementById('switchColorLink');
                if (switchColorLink) {
                    switchColorLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        if (typeof window.showGradientModal === 'function') {
                            window.showGradientModal();
                        }
                    });
                }
            }

            const swatches = document.querySelectorAll('.color-swatch');
            swatches.forEach((s) => s.classList.remove('selected'));

            if (typeof window.hideGradientModal === 'function') {
                window.hideGradientModal();
            }

            // 同步预览区域
            try {
                const shadowCanvas = document.getElementById('shadowLayer');
                if (shadowCanvas && typeof window.loadColorImage === 'function') {
                    const colorImageUrl = shadowCanvas.getAttribute('data-color-image');
                    if (colorImageUrl) {
                        window.loadColorImage(colorImageUrl, color1);
                    }
                }
            } catch (e) {
                console.warn('更新预览颜色失败:', e);
            }
        });
    }

    // 样品订单复选框事件监听
    (function initSampleOrderRtsListener() {
        const sampleCheckbox = document.querySelector('.sample-check input#sample');
        if (!sampleCheckbox) return;

        sampleCheckbox.addEventListener('change', function () {
            if (this.checked) {
                calculateSampleOrderRts();
            } else {
                // 取消勾选时目前不做额外处理
            }
        });

        function calculateSampleOrderRts() {
            if (window.useCanvasStore) {
                const store = window.useCanvasStore();
                const totalRts = store.getTotalMaxRtsForSampleOrder;

                document.dispatchEvent(
                    new CustomEvent('pw-sample-order-rts-calculated', {
                        detail: { totalRts },
                    })
                );

                return totalRts;
            }
            return 0;
        }
    })();
});