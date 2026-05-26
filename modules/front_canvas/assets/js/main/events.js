function initializeCanvasEventListeners(fabricCanvas, options = {}) {
    if (!fabricCanvas) return;
    addCanvasEventListeners(fabricCanvas);
    addCanvasSelectionListeners(fabricCanvas);
    addCanvas3DModelListeners(fabricCanvas);
    if (options.delayLayerListeners !== false) {
        if (window.CanvasInitializationState && window.CanvasInitializationState.isInitializing) {
            const completeHandler = () => {
                addCanvasLayerListeners(fabricCanvas);
                document.removeEventListener('canvasInitializationComplete', completeHandler);
            };
            document.addEventListener('canvasInitializationComplete', completeHandler);
        } else {
            addCanvasLayerListeners(fabricCanvas);
        }
    } else {
        addCanvasLayerListeners(fabricCanvas);
    }
}

window.initializeCanvasEventListeners = initializeCanvasEventListeners;

function addCanvasEventListeners(fabricCanvas) {
    if (!fabricCanvas) return;
    let needsAlertOnRelease = false;
    let alertTargetObject = null;
   
    fabricCanvas.on('object:modified', (e) => {
        if (typeof window.updatePreviewCanvas === 'function') {
            window.updatePreviewCanvas();
        }

        if (needsAlertOnRelease && alertTargetObject) {
            if (typeof window.showPrintMethodBindingAlert === 'function') {
                window.showPrintMethodBindingAlert(e.target);
            }
            needsAlertOnRelease = false;
            alertTargetObject = null;
        }
    });
    fabricCanvas.on('object:added', () => {
        if (typeof window.updatePreviewCanvas === 'function') window.updatePreviewCanvas();        
    });
    fabricCanvas.on('object:removed', (e) => {
        if (typeof window.updatePreviewCanvas === 'function') window.updatePreviewCanvas();       
        try {
            const tgt = e && e.target ? e.target : null;
            if (tgt && tgt.type === 'image' && tgt.isDesignElement) {
                const meta = tgt.designMeta || {};
                if (typeof recordDesignRemoval === 'function') {
                    recordDesignRemoval(meta) || (typeof queueDesignRemoval === 'function' && queueDesignRemoval(meta));
                } else if (typeof window.useDesignUsageStore === 'function') {
                    const store = window.pinia ? window.useDesignUsageStore(window.pinia) : window.useDesignUsageStore();
                    store.removeDesign({ id: meta.id || '', image: meta.image || '' });
                }
            }
        } catch (err) {}
    });

function recordDesignRemoval(meta) {
    try {
        if (typeof window.useDesignUsageStore === 'function') {
            const store = window.pinia ? window.useDesignUsageStore(window.pinia) : window.useDesignUsageStore();
            store.removeDesign({ id: String(meta.id || ''), image: String(meta.image || '') });
            return true;
        }
    } catch (e) {}
    return false;
}

function queueDesignRemoval(meta) {
    if (recordDesignRemoval(meta)) return;
    const handler = () => {
        recordDesignRemoval(meta);
        document.removeEventListener('canvasPiniaReady', handler);
    };
    document.addEventListener('canvasPiniaReady', handler);
}
    fabricCanvas.on('object:moving', (e) => {
        const obj = e.target;
        if (obj && !isElementInLayerGroup(obj)) { needsAlertOnRelease = true; alertTargetObject = obj; }
        else { needsAlertOnRelease = false; alertTargetObject = null; }
    });
    fabricCanvas.on('object:scaling', (e) => {
        const obj = e.target;
        if (obj && !isElementInLayerGroup(obj)) { needsAlertOnRelease = true; alertTargetObject = obj; }
        else { needsAlertOnRelease = false; alertTargetObject = null; }
    });
    fabricCanvas.on('object:rotating', (e) => {
        const obj = e.target;
        if (obj && !isElementInLayerGroup(obj)) { needsAlertOnRelease = true; alertTargetObject = obj; }
        else { needsAlertOnRelease = false; alertTargetObject = null; }
    });
}

function isElementInLayerGroup(obj) {
    return obj && obj.group !== null && obj.group !== undefined;
}

function showPrintMethodBindingAlert(targetObject) {
    if (!targetObject || !targetObject.id) {
        return;
    }
    
    if (typeof window.pwcaOpenPrintMethodBindingModal === 'function') {
        window.pwcaOpenPrintMethodBindingModal(targetObject.id);
        return;
    }
    
    if (typeof window.pwcaOpenPrintMethodModal === 'function') {
        window.pwcaOpenPrintMethodModal(targetObject.id);
        return;
    }
}

function pwcaGetUiStateAccess() {
    return window.pwcaUiStateAccess || null;
}

function pwcaGetSelectedObjectFromSelectionEvent(options) {
    const selectedObj = options && options.selected ? options.selected[0] : null;
    if (selectedObj) {
        return selectedObj;
    }

    const uiStateAccess = pwcaGetUiStateAccess();
    if (uiStateAccess && typeof uiStateAccess.getActiveObject === 'function') {
        return uiStateAccess.getActiveObject();
    }

    return null;
}

function pwcaGetSelectionActiveTabId() {
    const uiStateAccess = pwcaGetUiStateAccess();
    if (uiStateAccess && typeof uiStateAccess.getCurrentActiveTab === 'function') {
        return uiStateAccess.getCurrentActiveTab();
    }

    if (typeof window.getCurrentActiveTab === 'function') {
        return window.getCurrentActiveTab();
    }

    return null;
}

function pwcaSyncToolbarBySelectedObject(selectedObj) {
    if (typeof window.updateDynamicToolbar === 'function') {
        window.updateDynamicToolbar(selectedObj);
    }
}

function pwcaSyncOperationPanelBySelectedObject(selectedObj) {
    if (!selectedObj) {
        return;
    }

    const activeTabId = pwcaGetSelectionActiveTabId();
    const fromLayerList = window.pw_selectionFromLayerList === true;

    if (activeTabId === 'tab-tuan' && fromLayerList) {
        window.pw_selectionFromLayerList = false;
        return;
    }

    const type = selectedObj.type;

    if (type === 'text' || type === 'i-text' || type === 'textbox') {
        if (typeof window.switchOperationPanelTab === 'function') {
            window.switchOperationPanelTab('tab-wenzi', { preserveSelection: true });
        }

        const addTextBox = document.getElementById('addTextBtn_box');
        if (addTextBox) {
            addTextBox.style.display = 'block';
        }

        try {
            document.querySelectorAll('.img_toolbar .toolbar_button').forEach((btn) => btn.classList.remove('active'));
        } catch (err) {}
        return;
    }

    if (type === 'image' && typeof window.switchOperationPanelTab === 'function') {
        window.switchOperationPanelTab('tab-pianquan', { preserveSelection: true });
    }
}

function pwcaHandleCanvasSelectionChange(options) {
    const selectedObj = pwcaGetSelectedObjectFromSelectionEvent(options);
    pwcaSyncToolbarBySelectedObject(selectedObj);
    pwcaSyncOperationPanelBySelectedObject(selectedObj);
}

function addCanvasSelectionListeners(fabricCanvas) {
    if (!fabricCanvas) return;
    fabricCanvas.on('selection:created', function (options) {
        pwcaHandleCanvasSelectionChange(options);
    });
    fabricCanvas.on('selection:updated', function (options) {
        pwcaHandleCanvasSelectionChange(options);
    });
    fabricCanvas.on('selection:cleared', function () {
        pwcaSyncToolbarBySelectedObject(null);
    });
}

function addCanvas3DModelListeners(fabricCanvas) {
    if (!fabricCanvas) return;
    const update = typeof window.updateModelFromCanvas === 'function' ? window.updateModelFromCanvas : null;
    if (!update) return;
    fabricCanvas.on('object:modified', function () { update(); });
    fabricCanvas.on('object:added', function () { update(); });
    fabricCanvas.on('object:removed', function () { update(); });
    fabricCanvas.on('object:moving', function () { update(); });
    fabricCanvas.on('object:scaling', function () { update(); });
    fabricCanvas.on('object:rotating', function () { update(); });
}

window.addCanvasEventListeners = addCanvasEventListeners;
window.addCanvasSelectionListeners = addCanvasSelectionListeners;
window.addCanvas3DModelListeners = addCanvas3DModelListeners;
