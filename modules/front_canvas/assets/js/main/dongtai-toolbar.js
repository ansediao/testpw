(function () {
    'use strict';

    function pwcaGetUiStateAccess() {
        return window.pwcaUiStateAccess || null;
    }

    function pwcaGetToolbarActiveCanvas() {
        const uiStateAccess = pwcaGetUiStateAccess();
        if (uiStateAccess && typeof uiStateAccess.getActiveCanvas === 'function') {
            return uiStateAccess.getActiveCanvas();
        }

        return window.canvas || window.fabricCanvas || null;
    }

    function pwcaGetToolbarActiveObject() {
        const uiStateAccess = pwcaGetUiStateAccess();
        if (uiStateAccess && typeof uiStateAccess.getActiveObject === 'function') {
            return uiStateAccess.getActiveObject();
        }

        const activeCanvas = pwcaGetToolbarActiveCanvas();
        if (!activeCanvas || typeof activeCanvas.getActiveObject !== 'function') {
            return null;
        }

        return activeCanvas.getActiveObject() || null;
    }

    function pwcaCheckObjectHasPrintMethod(obj) {
        if (!obj || !obj.id) return false;
        
        const stateAccess = pwcaGetUiStateAccess();
        if (!stateAccess) return false;
        
        const printMethodStore = typeof stateAccess.getPrintMethodStore === 'function' 
            ? stateAccess.getPrintMethodStore() 
            : null;
        
        if (!printMethodStore) return false;
        
        const layerMethodId = printMethodStore.layerPrintMethodMap ? printMethodStore.layerPrintMethodMap[obj.id] : null;
        if (layerMethodId) return true;
        
        if (obj.groupId) {
            const groupMethodId = printMethodStore.groupPrintMethodMap ? printMethodStore.groupPrintMethodMap[obj.groupId] : null;
            if (groupMethodId) return true;
            
            const match = String(obj.groupId).match(/^print-method-(.+)$/);
            if (match && match[1]) return true;
        }
        
        return false;
    }

    function pwcaOpenPrintMethodModal(layerId) {
        if (typeof window.pwcaOpenPrintMethodBindingModal === 'function') {
            return window.pwcaOpenPrintMethodBindingModal(layerId);
        }
        return false;
    }

    function showPrintMethodBindingAlert(targetObject) {
        if (!targetObject || !targetObject.id) {
            return;
        }
        
        pwcaOpenPrintMethodModal(targetObject.id);
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
                
                if (activeObject && activeObject.id && !pwcaCheckObjectHasPrintMethod(activeObject)) {
                    e.preventDefault();
                    e.stopPropagation();
                    pwcaOpenPrintMethodModal(activeObject.id);
                    return;
                }

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
            button.addEventListener('click', function (e) {
                const activeCanvas = pwcaGetToolbarActiveCanvas();
                const activeObject = pwcaGetToolbarActiveObject();
                
                if (activeObject && activeObject.id && !pwcaCheckObjectHasPrintMethod(activeObject)) {
                    e.preventDefault();
                    e.stopPropagation();
                    pwcaOpenPrintMethodModal(activeObject.id);
                    return;
                }

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
    window.pwcaOpenPrintMethodModal = pwcaOpenPrintMethodModal;
    window.pwcaCheckObjectHasPrintMethod = pwcaCheckObjectHasPrintMethod;
})();
