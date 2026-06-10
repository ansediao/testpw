(function () {
    'use strict';

    function pwcaGetUiStateAccess() {
        return window.pwcaUiStateAccess || null;
    }

    function pwcaGetCanvasStore() {
        const uiStateAccess = pwcaGetUiStateAccess();
        if (uiStateAccess && typeof uiStateAccess.pwcaGetCanvasStore === 'function') {
            return uiStateAccess.pwcaGetCanvasStore();
        }

        return null;
    }

    function pwcaGetTextDefaults() {
        const fallbackDefaults = {
            fontFamily: 'Arial',
            fontSize: 30
        };

        const store = pwcaGetCanvasStore();
        if (!store) {
            return fallbackDefaults;
        }

        return {
            fontFamily: store.currentDefaultTextFontFamily || fallbackDefaults.fontFamily,
            fontSize: store.currentDefaultTextFontSize || fallbackDefaults.fontSize
        };
    }

    function pwcaIsTextModuleEnabled() {
        if (typeof window.pwcaIsOperationPanelTabAvailable !== 'function') {
            return true;
        }

        return window.pwcaIsOperationPanelTabAvailable('tab-wenzi');
    }

    function pwcaGetActiveCanvasForText() {
        const uiStateAccess = pwcaGetUiStateAccess();
        if (uiStateAccess && typeof uiStateAccess.pwcaGetActiveCanvas === 'function') {
            return uiStateAccess.pwcaGetActiveCanvas();
        }

        return null;
    }

    function pwcaCreateFabricText(canvas, text, layerId) {
        const textDefaults = pwcaGetTextDefaults();
        return new fabric.Text(text, {
            left: canvas.width / 2,
            top: canvas.height / 2,
            fontSize: textDefaults.fontSize,
            fill: '#000000',
            fontFamily: textDefaults.fontFamily,
            originX: 'center',
            originY: 'center',
            id: layerId,
            cornerSize: 10,
            transparentCorners: false,
            lockUniScaling: false,
            lockMovementX: false,
            lockMovementY: false,
            angle: 0,
            hasControls: true,
            selectable: true,
            userInitiated: true,
            fromButton: true,
            fromToolbar: true
        });
    }

    function pwcaNotifyLayerStore(layerId, text) {
        if (typeof window.pwcaAddLayerToStore === 'function') {
            window.pwcaAddLayerToStore(layerId, text, 'text');
        } else {
            // eslint-disable-next-line no-console
            console.warn('Layer management system not initialized');
        }
    }

    function pwcaHandleAddTextClick() {
        const textarea = document.getElementById('customText');
        if (!textarea) {
            return;
        }

        const text = textarea.value.trim();
        if (!text) {
            return;
        }

        const activeCanvas = pwcaGetActiveCanvasForText();
        if (!activeCanvas) {
            // eslint-disable-next-line no-console
            console.warn('Active canvas not found');
            return;
        }

        textarea.value = '';
        const layerId = 'layer_' + Date.now();
        const fabricText = pwcaCreateFabricText(activeCanvas, text, layerId);

        activeCanvas.add(fabricText);
        activeCanvas.setActiveObject(fabricText);
        activeCanvas.renderAll();

        pwcaNotifyLayerStore(layerId, text);
        if (typeof window.pwcaUpdatePreviewCanvas === 'function') {
            window.pwcaUpdatePreviewCanvas();
        }
    }

    function pwcaInitTextTab() {
        if (!pwcaIsTextModuleEnabled()) {
            return;
        }

        const addTextBtn = document.getElementById('addTextBtn');
        const textarea = document.getElementById('customText');
        if (!addTextBtn || !textarea) {
            return;
        }

        if (addTextBtn.dataset.pwcaTextTabInited === '1') {
            return;
        }

        addTextBtn.dataset.pwcaTextTabInited = '1';
        addTextBtn.addEventListener('click', pwcaHandleAddTextClick);
    }

    document.addEventListener('DOMContentLoaded', pwcaInitTextTab);
    document.addEventListener('pwcaOperationPanelModulesUpdated', pwcaInitTextTab);
})();
