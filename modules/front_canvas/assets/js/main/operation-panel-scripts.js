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
    const colorSwatches = document.querySelectorAll('.color-swatch');

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

    colorSwatches.forEach((swatch) => {
        swatch.addEventListener('click', () => {
            colorSwatches.forEach((s) => s.classList.remove('selected'));
            swatch.classList.add('selected');
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