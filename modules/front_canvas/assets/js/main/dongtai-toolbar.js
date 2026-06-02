(function () {
    'use strict';

    function pwcaGetUiStateAccess() {
        return window.pwcaUiStateAccess || null;
    }

    function pwcaGetToolbarActiveCanvas() {
        const uiStateAccess = pwcaGetUiStateAccess();
        if (uiStateAccess && typeof uiStateAccess.pwcaGetActiveCanvas === 'function') {
            return uiStateAccess.pwcaGetActiveCanvas();
        }

        return window.canvas || window.fabricCanvas || null;
    }

    function pwcaGetToolbarActiveObject() {
        const uiStateAccess = pwcaGetUiStateAccess();
        if (uiStateAccess && typeof uiStateAccess.pwcaGetActiveObject === 'function') {
            return uiStateAccess.pwcaGetActiveObject();
        }

        const activeCanvas = pwcaGetToolbarActiveCanvas();
        if (!activeCanvas || typeof activeCanvas.getActiveObject !== 'function') {
            return null;
        }

        return activeCanvas.getActiveObject() || null;
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
            button.addEventListener('click', function (e) {
                const activeObject = pwcaGetToolbarActiveObject();

                if (typeof window.pwcaSwitchOperationPanelTab === 'function') {
                    window.pwcaSwitchOperationPanelTab('tab-wenzi', { preserveSelection: true });
                }

                toolbar.querySelectorAll('.toolbar_button').forEach(function (btn) {
                    btn.classList.remove('active');
                });
                button.classList.add('active');

                const addTextBox = document.getElementById('addTextBtn_box');
                if (addTextBox) {
                    addTextBox.style.display = button.id === 'text_input' ? 'block' : 'none';
                }

                if (typeof window.pwcaUpdateDynamicToolbar === 'function' && activeObject) {
                    window.pwcaUpdateDynamicToolbar(activeObject);
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
            button.addEventListener('click', function (e) {
                const activeCanvas = pwcaGetToolbarActiveCanvas();
                const activeObject = pwcaGetToolbarActiveObject();

                if (typeof window.pwcaSwitchOperationPanelTab === 'function') {
                    window.pwcaSwitchOperationPanelTab('tab-pianquan');
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

                if (typeof window.pwcaUpdateDynamicToolbar === 'function' && activeObject) {
                    window.pwcaUpdateDynamicToolbar(activeObject);
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        pwcaInitTextToolbar();
        pwcaInitImageToolbar();
    });
})();
