/**
 * URL 参数处理器
 * 根据 URL 参数控制在线设计页面的界面显示
 * 
 * 支持的参数：
 * - edit=true: 隐藏 header, .dongtai-area, .product-card, .zoom-control, .tabs-nav, .customization-area
 *              并且 .content-area 只显示 #content-tuan
 * - view=main: .design_area 中显示对应的界面
 */

(function() {
    'use strict';

    /**
     * 获取 URL 参数
     * @param {string} name - 参数名
     * @returns {string|null} - 参数值
     */
    function getUrlParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    /**
     * 处理 edit=true 参数
     * 隐藏指定元素，只显示 #content-tuan
     */
    function handleEditMode() {
        const isEditMode = getUrlParam('edit') === 'true';
        
        if (!isEditMode) return;

        // 需要隐藏的元素选择器
        const elementsToHide = [
            'header.header',
            '.dongtai-area',
            '.product-card',
            '.zoom-control',
            '.tabs-nav',
            '.content-area-footer',
            '.panel-collapse-btn',
            '.customization-area'
        ];

        // 隐藏指定元素
        elementsToHide.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.style.display = 'none';
            });
        });

        // 处理 .content-area，只显示 #content-tuan
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
            // 隐藏所有 content-pane
            const contentPanes = contentArea.querySelectorAll('.content-pane');
            contentPanes.forEach(pane => {
                pane.classList.remove('active');
                pane.style.display = 'none';
            });

            // 只显示 #content-tuan
            const contentTuan = document.getElementById('content-tuan');
            if (contentTuan) {
                contentTuan.classList.add('active');
                contentTuan.style.display = 'block';
            }
        }

        // 处理 footer，强制 justify-content: right
        const footer = document.querySelector('footer.footer');
        if (footer) {
            footer.style.justifyContent = 'right';
        }

        // 添加编辑模式的 body class，方便 CSS 进一步控制
        document.body.classList.add('pwca-edit-mode');
    }

    /**
     * 处理 view 参数
     * 根据视图 ID 切换到对应的视图
     */
    function handleViewMode() {
        const viewParam = getUrlParam('view');
        
        if (!viewParam) return;

        // 添加视图模式的 body class
        document.body.classList.add('pwca-view-mode');
        document.body.setAttribute('data-view-mode', viewParam);

        // 如果是 main 视图，添加特定 class
        if (viewParam === 'main') {
            const designArea = document.querySelector('.design_area');
            if (designArea) {
                designArea.classList.add('pwca-view-main');
            }
        }

        // 切换到指定视图（包括 'main' 以外的具体视图 ID）
        waitForStoreAndSwitchView(viewParam);
    }

    /**
     * 等待 store 加载完成后切换到指定视图
     * @param {string} viewId - 视图 ID
     */
    function waitForStoreAndSwitchView(viewId) {
        // 如果是 'main' 这种通用值，不需要特殊切换，使用默认第一个视图
        if (viewId === 'main') return;

        function trySwitch() {
            if (typeof window.useCanvasStore === 'function') {
                const store = window.useCanvasStore();
                if (store && store.views && store.views.length > 0) {
                    // 查找匹配的视图
                    const targetView = store.views.find(v => 
                        v.id === viewId || 
                        v.view_id === viewId || 
                        String(v.id) === String(viewId)
                    );
                    
                    if (targetView) {
                        // 设置激活视图
                        store.setActiveViewId(targetView.id);
                        
                        // 隐藏所有视图容器，显示目标视图
                        document.querySelectorAll('.view-container').forEach(container => {
                            container.style.display = 'none';
                        });
                        
                        const viewContainer = document.getElementById(`view-container-${targetView.id}`);
                        if (viewContainer) {
                            viewContainer.style.display = 'block';
                        }
                        
                        // 更新 CanvasManager
                        if (window.CanvasManager) {
                            window.CanvasManager.setActiveCanvas(targetView.id);
                            const canvas = window.CanvasManager.getCanvas(targetView.id);
                            if (canvas) {
                                if (window.setGlobalCanvas) {
                                    window.setGlobalCanvas(canvas);
                                } else {
                                    window.canvas = canvas;
                                    window.fabricCanvas = canvas;
                                }
                                canvas.renderAll();
                            }
                        }
                        
                        // 触发视图切换事件
                        document.dispatchEvent(new CustomEvent('layerPanelViewSwitch', { 
                            detail: { viewId: targetView.id } 
                        }));
                        
                        console.log('[URL Params] 已切换到视图:', targetView.id);
                    } else {
                        console.warn('[URL Params] 未找到视图:', viewId);
                    }
                    return;
                }
            }
            // 如果 store 还没准备好，继续等待
            setTimeout(trySwitch, 200);
        }

        // 延迟执行，等待页面初始化
        setTimeout(trySwitch, 500);
    }

    /**
     * 确保编辑模式下视图正确初始化
     * 在 edit=true 模式下，由于 .customization-area 被隐藏，
     * 需要确保视图仍然能正确显示
     */
    function ensureViewInitialized() {
        const isEditMode = getUrlParam('edit') === 'true';
        if (!isEditMode) return;

        function tryInit() {
            if (typeof window.useCanvasStore === 'function') {
                const store = window.useCanvasStore();
                if (store && store.views && store.views.length > 0) {
                    // 确保第一个视图容器是可见的
                    const firstView = store.views[0];
                    const viewContainer = document.getElementById(`view-container-${firstView.id}`);
                    if (viewContainer) {
                        viewContainer.style.display = 'block';
                    }
                    
                    // 确保 activeViewId 已设置
                    if (!store.activeViewId) {
                        store.setActiveViewId(firstView.id);
                    }
                    return;
                }
            }
            // 继续等待
            setTimeout(tryInit, 200);
        }

        // 延迟执行
        setTimeout(tryInit, 800);
    }

    /**
     * 初始化 URL 参数处理
     */
    function init() {
        // DOM 加载完成后执行
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                handleEditMode();
                handleViewMode();
                ensureViewInitialized();
            });
        } else {
            handleEditMode();
            handleViewMode();
            ensureViewInitialized();
        }
    }

    // 暴露到全局，方便其他模块调用
    window.pwcaUrlParamsHandler = {
        getUrlParam: getUrlParam,
        handleEditMode: handleEditMode,
        handleViewMode: handleViewMode,
        ensureViewInitialized: ensureViewInitialized,
        init: init
    };

    // 自动初始化
    init();

})();
