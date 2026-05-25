(function () {
    'use strict';

    function pwcaGetToolbarActiveCanvas() {
        if (window.CanvasManager && typeof window.CanvasManager.getActiveCanvas === 'function') {
            const managedCanvas = window.CanvasManager.getActiveCanvas();
            if (managedCanvas) {
                return managedCanvas;
            }
        }

        if (typeof window.getActiveCanvas === 'function') {
            return window.getActiveCanvas();
        }

        return window.canvas || window.fabricCanvas || null;
    }

    function showPrintMethodBindingAlert(targetObject) {
        const assignBtn = document.querySelector('#content-tuan .layer-item.ungrouped.active .assign-btn');
        if (assignBtn) {
            assignBtn.click();
            return;
        }

        const message = '请先为此元素绑定印刷方式后再使用此工具。\n\n您可以在图层面板中点击\"Switch Printing Method\"按钮来绑定印刷方式。';
        // eslint-disable-next-line no-alert
        window.alert(message);
    }

    function pwcaInitTextToolbar() {
        const toolbar = document.querySelector('.text_toolbar');
        if (!toolbar) {
            return;
        }

        const buttons = toolbar.querySelectorAll('.toolbar_button');
        if (!buttons.length) {
            return;
        }

        buttons.forEach(function (button) {
            button.addEventListener('click', function () {
                const activeCanvas = pwcaGetToolbarActiveCanvas();
                const activeObject = activeCanvas && typeof activeCanvas.getActiveObject === 'function'
                    ? activeCanvas.getActiveObject()
                    : null;

                if (typeof window.switchOperationPanelTab === 'function') {
                    window.switchOperationPanelTab('tab-wenzi', { preserveSelection: true });
                }

                toolbar.querySelectorAll('.toolbar_button').forEach(function (btn) {
                    btn.classList.remove('active');
                });
                button.classList.add('active');

                const addTextBox = document.getElementById('addTextBtn_box');
                if (addTextBox) {
                    addTextBox.style.display = button.id === 'text_input' ? 'block' : 'none';
                }

                if (typeof window.updateDynamicToolbar === 'function' && activeObject) {
                    window.updateDynamicToolbar(activeObject);
                }
            });
        });
    }

    function pwcaInitImageToolbar() {
        const toolbar = document.querySelector('.img_toolbar');
        if (!toolbar) {
            return;
        }

        const buttons = toolbar.querySelectorAll('.toolbar_button');
        if (!buttons.length) {
            return;
        }

        buttons.forEach(function (button) {
            button.addEventListener('click', function () {
                const activeCanvas = pwcaGetToolbarActiveCanvas();
                const activeObject = activeCanvas && typeof activeCanvas.getActiveObject === 'function'
                    ? activeCanvas.getActiveObject()
                    : null;

                if (typeof window.switchOperationPanelTab === 'function') {
                    window.switchOperationPanelTab('tab-pianquan');
                }

                const imgOriginControls = document.getElementById('img_origin_controls');
                if (imgOriginControls) {
                    imgOriginControls.style.display = 'none';
                }

                if (activeCanvas && activeObject && typeof activeCanvas.setActiveObject === 'function') {
                    activeCanvas.setActiveObject(activeObject);
                    if (typeof activeCanvas.requestRenderAll === 'function') {
                        activeCanvas.requestRenderAll();
                    } else if (typeof activeCanvas.renderAll === 'function') {
                        activeCanvas.renderAll();
                    }
                }

                toolbar.querySelectorAll('.toolbar_button').forEach(function (btn) {
                    btn.classList.remove('active');
                });
                button.classList.add('active');

                if (typeof window.updateDynamicToolbar === 'function' && activeObject) {
                    window.updateDynamicToolbar(activeObject);
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        pwcaInitTextToolbar();
        pwcaInitImageToolbar();
    });

    window.showPrintMethodBindingAlert = showPrintMethodBindingAlert;
})();
