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
                    if (
                        window.CanvasManager &&
                        typeof window.CanvasManager.getViewIds === 'function'
                    ) {
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

                    if (typeof window.pwcaInitImageTab === 'function') {
                        window.pwcaInitImageTab();
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
                    if (
                        window.CanvasManager &&
                        typeof window.CanvasManager.getViewIds === 'function'
                    ) {
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
                    window.CanvasManager &&
                    typeof window.CanvasManager.getActiveCanvas === 'function'
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
