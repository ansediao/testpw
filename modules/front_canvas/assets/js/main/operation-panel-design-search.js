document.addEventListener('DOMContentLoaded', () => {
    let designCategoriesList = null;
    let designSearchInitialized = false;

    function pwcaGetCanvasStore() {
        const uiStateAccess = window.pwcaUiStateAccess || null;
        if (!uiStateAccess || typeof uiStateAccess.getCanvasStore !== 'function') {
            return null;
        }

        try {
            return uiStateAccess.getCanvasStore();
        } catch (error) {
            return null;
        }
    }

    function pwcaIsDesignModuleEnabled() {
        if (typeof window.pwcaIsOperationPanelTabAvailable !== 'function') {
            return true;
        }

        return window.pwcaIsOperationPanelTabAvailable('tab-sheji');
    }

    function initializeListJS() {
        if (!pwcaIsDesignModuleEnabled() || designSearchInitialized) {
            return;
        }

        if (typeof List !== 'undefined') {
            const options = {
                valueNames: ['name'],
                searchClass: 'search',
            };

            designCategoriesList = new List('design-categories-list', options);
            designSearchInitialized = true;
            setupSearchFunctionality();
        } else {
            setTimeout(initializeListJS, 100);
        }
    }

    initializeListJS();
    document.addEventListener('pwcaOperationPanelModulesUpdated', initializeListJS);

    function setupSearchFunctionality() {
        const filterToggleBtn = document.getElementById('filter-toggle-btn');
        const advancedSearchRow = document.getElementById('advanced-search-row');
        const quickSearchInput = document.getElementById('quick-search-input');
        const advancedSearchInput = document.getElementById('advanced-search-input');
        const filterOperator = document.getElementById('filter-operator');

        if (
            !filterToggleBtn ||
            !advancedSearchRow ||
            !quickSearchInput ||
            !advancedSearchInput ||
            !filterOperator
        ) {
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

    /**
     * 根据当前视图 ID 与分类的 Category Type 控制前台可见性：
     * - universal/general：所有视图可见
     * - main_view：仅在 main_view 视图下可见
     * - product：暂时与 universal 一致（后续可在此扩展按产品/视图精细控制）
     */
    const setupCategoryViewFilter = () => {
        const categoryNodes = document.querySelectorAll('.category-item');
        if (!categoryNodes.length) {
            return;
        }

        const applyVisibility = (activeViewId) => {
            const viewId = activeViewId || '';
            categoryNodes.forEach((item) => {
                const rawType = item.getAttribute('data-category-type') || 'universal';
                let type = rawType;
                if (type === 'general' || type === '') {
                    type = 'universal';
                }

                // 默认全部显示
                let shouldShow = true;

                if (type === 'main_view') {
                    // 仅 main_view 视图显示
                    shouldShow = viewId === 'main_view' || viewId === '' || viewId === null;
                }

                // 目前 product 类型按 universal 处理，保留扩展点
                // if (type === 'product') { ... }

                item.style.display = shouldShow ? '' : 'none';
            });
        };

        const waitForStore = () => {
            try {
                const store = pwcaGetCanvasStore();
                if (store) {
                    // 初次应用
                    applyVisibility(store.activeViewId);

                    // 监听视图切换
                    if (typeof store.$subscribe === 'function') {
                        store.$subscribe((mutation, state) => {
                            if (mutation.storeId === 'canvas') {
                                applyVisibility(state.activeViewId);
                            }
                        });
                    }

                    return;
                }
            } catch (e) {
                // 安静失败，使用下面的退化逻辑
            }

            // 如果 Pinia 还未准备好，继续等待
            window.setTimeout(waitForStore, 150);
        };

        // 启动等待 Pinia store 的逻辑
        waitForStore();

        // 退化：若一段时间后仍无 store，则按单视图(main_view)处理
        window.setTimeout(() => {
            if (!pwcaGetCanvasStore()) {
                applyVisibility('main_view');
            }
        }, 1500);
    };

    setupCategoryViewFilter();
});
