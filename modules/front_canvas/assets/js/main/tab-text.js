(function () {
    'use strict';

    function pwcaGetActiveCanvasForText() {
        if (typeof window.getActiveCanvas === 'function') {
            return window.getActiveCanvas();
        }
        return window.canvas || window.fabricCanvas || null;
    }

    function pwcaCreateFabricText(canvas, text, layerId) {
        return new fabric.Text(text, {
            left: canvas.width / 2,
            top: canvas.height / 2,
            fontSize: 30,
            fill: '#000000',
            fontFamily: 'Arial',
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
        if (typeof window.addLayerToStore === 'function') {
            window.addLayerToStore(layerId, text, 'text');
        } else {
            // eslint-disable-next-line no-console
            console.warn('图层管理系统未初始化');
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
            console.warn('未找到激活的画布');
            return;
        }

        textarea.value = '';
        const layerId = 'layer_' + Date.now();
        const fabricText = pwcaCreateFabricText(activeCanvas, text, layerId);

        activeCanvas.add(fabricText);
        activeCanvas.setActiveObject(fabricText);
        activeCanvas.renderAll();

        pwcaNotifyLayerStore(layerId, text);
        if (typeof window.updatePreviewCanvas === 'function') {
            window.updatePreviewCanvas();
        }
    }

    function pwcaInitTextTab() {
        const addTextBtn = document.getElementById('addTextBtn');
        const textarea = document.getElementById('customText');
        if (!addTextBtn || !textarea) {
            return;
        }

        addTextBtn.addEventListener('click', pwcaHandleAddTextClick);
    }

    document.addEventListener('DOMContentLoaded', pwcaInitTextTab);
})();