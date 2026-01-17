<script>
    // List.js 和过滤功能
    document.addEventListener('DOMContentLoaded', () => {
        // 初始化 List.js
        let designCategoriesList = null;

        // 等待 List.js 库加载完成
        function initializeListJS() {
            if (typeof List !== 'undefined') {
                const options = {
                    valueNames: ['name'],
                    searchClass: 'search'
                };

                designCategoriesList = new List('design-categories-list', options);

                // 设置初始搜索功能
                setupSearchFunctionality();
            } else {
                // 如果 List.js 还没加载完成，等待一下再试
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

            // 切换高级搜索显示/隐藏
            filterToggleBtn.addEventListener('click', () => {
                const isVisible = advancedSearchRow.style.display !== 'none';
                advancedSearchRow.style.display = isVisible ? 'none' : 'block';

                // 如果隐藏高级搜索，清空高级搜索输入
                if (isVisible) {
                    advancedSearchInput.value = '';
                    applyAdvancedFilter();
                }
            });

            // 快速搜索功能 (自定义搜索以处理纯文本)
            quickSearchInput.addEventListener('input', (e) => {
                if (designCategoriesList) {
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
                }
            });

            // 高级搜索功能
            function applyAdvancedFilter() {
                const searchTerm = advancedSearchInput.value.toLowerCase();
                const operator = filterOperator.value;

                if (!designCategoriesList) return;

                if (searchTerm === '') {
                    // 如果搜索词为空，显示所有项目
                    designCategoriesList.filter();
                    return;
                }

                designCategoriesList.filter((item) => {
                    // 获取纯文本内容，去除HTML标签
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

            // 高级搜索输入事件
            advancedSearchInput.addEventListener('input', applyAdvancedFilter);
            filterOperator.addEventListener('change', applyAdvancedFilter);
        }

        // 分类项点击功能
        const categoryItems = document.querySelectorAll('.category-item');
        const contentSheji = document.querySelector('.content-sheji');

        if (categoryItems && contentSheji) {
            categoryItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    // 移除所有分类项的active类
                    categoryItems.forEach(i => i.classList.remove('active'));
                    // 给当前点击的分类项添加active类
                    item.classList.add('active');
                    // 给.content-sheji添加active类
                    contentSheji.classList.add('active');
                });
            });
        }

        // 返回按钮功能
        const backButtons = document.querySelectorAll('.back-button');
        backButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡，避免触发父元素的
                const categoryItem = button.closest('.category-item');
                if (categoryItem) {
                    // 移除当前分类项的active类
                    categoryItem.classList.remove('active');
                    // 隐藏.content-sheji的active类
                    contentSheji.classList.remove('active');
                }
            });
        });
    });


    // 主选项卡 tabs-nav 切换逻辑
    document.addEventListener('DOMContentLoaded', () => {
        // 全局：文字界面初始化函数（遵循前缀约定）
        window.canvasInitTextUI = function() {
            try {
                const textInputBtn = document.getElementById('text_input');
                if (textInputBtn) {
                    // 触发文本工具栏的“Text”按钮点击，负责显示输入区域和更新控制
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

        // 选项卡切换功能
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // 移除 .main-content 上 .panel-collapsed
                const mainContent = document.querySelector('.main-content');
                if (mainContent) {
                    mainContent.classList.remove('panel-collapsed');
                }

                // 移除 .operation-panel 上 .panel-collapsed
                const operationPanel = document.querySelector('.operation-panel');
                if (operationPanel) {
                    operationPanel.classList.remove('collapsed');
                }

                // 1. 移除所有选项卡的 'active' 类
                tabs.forEach(t => t.classList.remove('active'));
                // 2. 为被点击的选项卡添加 'active' 类
                tab.classList.add('active');

                // 3. 隐藏所有内容面板
                contentPanes.forEach(pane => pane.classList.remove('active'));

                // 4. 显示对应的内容面板
                const contentId = 'content-' + tab.id.split('-')[1];
                const activePane = document.getElementById(contentId);
                if (activePane) {
                    activePane.classList.add('active');
                }

                // 点击图片选项卡时，清空选区并让工具栏根据当前状态决定显示内容
                if (tab.id === 'tab-pianquan') {
                    try {
                        // 清空所有视图画布的选中状态
                        if (window.CanvasManager && typeof window.CanvasManager.getViewIds === 'function') {
                            const viewIds = window.CanvasManager.getViewIds();
                            viewIds.forEach(viewId => {
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

                        // 交由 updateDynamicToolbar(null) 显示默认图片控件区域
                        if (typeof updateDynamicToolbar === 'function') {
                            updateDynamicToolbar(null);
                        }
                    } catch (err) {
                        console.warn('点击图片选项卡时重置失败:', err);
                    }
                }

                // 特殊处理：点击文字选项卡时，如当前视图选中了文字对象，则初始化文字界面
                if (tab.id === 'tab-wenzi') {
                    // 显示添加文字输入区域
                    try {
                        const addTextBox = document.getElementById('addTextBtn_box');
                        if (addTextBox) {
                            addTextBox.style.display = 'block';
                        }
                    } catch (e) {
                        console.warn('点击文字选项卡时显示 addTextBtn_box 失败:', e);
                    }

                    // 先清空所有视图的选中状态
                    try {
                        if (window.CanvasManager && typeof window.CanvasManager.getViewIds === 'function') {
                            const viewIds = window.CanvasManager.getViewIds();
                            viewIds.forEach(viewId => {
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

                    const activeCanvas = window.CanvasManager ? window.CanvasManager.getActiveCanvas() : (window.canvas || window.fabricCanvas);
                    const activeObject = activeCanvas && typeof activeCanvas.getActiveObject === 'function' ? activeCanvas.getActiveObject() : null;
                    if (activeObject && (activeObject.type === 'text' || activeObject.type === 'i-text' || activeObject.type === 'textbox')) {
                        if (typeof window.canvasInitTextUI === 'function') {
                            window.canvasInitTextUI();
                        }
                    }
                }
            });
        });

        // 颜色选择功能
        colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                colorSwatches.forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');
            });
        });

        // 操作面板收缩功能
        const collapseBtn = document.getElementById('panelCollapseBtn');
        const operationPanel = document.querySelector('.operation-panel');
        const mainContent = document.querySelector('.main-content');
        
        if (collapseBtn && operationPanel && mainContent) {
            collapseBtn.addEventListener('click', () => {
                operationPanel.classList.toggle('collapsed');
                mainContent.classList.toggle('panel-collapsed');

                // 清除 tabs-nav 中tab   active  class
                const tabsNav = document.querySelector('.tabs-nav');
                if (tabsNav) {
                    tabsNav.querySelectorAll('.tab').forEach(tab => {
                        tab.classList.remove('active');
                    });
                }
                
                // 切换箭头方向
                const arrow = collapseBtn.querySelector('svg path');
                if (operationPanel.classList.contains('collapsed')) {
                    arrow.setAttribute('d', 'M9 18L15 12L9 6'); // 向右箭头
                } else {
                    arrow.setAttribute('d', 'M15 18L9 12L15 6'); // 向左箭头
                }
            });
        }
    });
</script>