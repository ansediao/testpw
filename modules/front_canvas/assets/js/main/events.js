function pwcaInitializeCanvasEventListeners(fabricCanvas, options = {}) {
    if (!fabricCanvas) return;
    pwcaAddCanvasEventListeners(fabricCanvas);
    pwcaAddCanvasSelectionListeners(fabricCanvas);
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

window.pwcaInitializeCanvasEventListeners = pwcaInitializeCanvasEventListeners;

function pwcaAddCanvasEventListeners(fabricCanvas) {
    if (!fabricCanvas) return;
    let needsAlertOnRelease = false;
    let alertTargetObject = null;
   
    fabricCanvas.on('object:modified', (e) => {
        if (typeof window.pwcaUpdatePreviewCanvas === 'function') {
            window.pwcaUpdatePreviewCanvas();
        }

        if (needsAlertOnRelease && alertTargetObject) {
            pwcaShowPrintMethodBindingAlert(e.target);
            needsAlertOnRelease = false;
            alertTargetObject = null;
        }
    });
    fabricCanvas.on('object:added', () => {
        if (typeof window.pwcaUpdatePreviewCanvas === 'function') window.pwcaUpdatePreviewCanvas();
    });
    fabricCanvas.on('object:removed', (e) => {
        if (typeof window.pwcaUpdatePreviewCanvas === 'function') window.pwcaUpdatePreviewCanvas();
        try {
            const tgt = e && e.target ? e.target : null;
            if (tgt && tgt.type === 'image' && tgt.isDesignElement) {
                const meta = tgt.designMeta || {};
                if (typeof pwcaRecordDesignRemoval === 'function') {
                    pwcaRecordDesignRemoval(meta) || (typeof pwcaQueueDesignRemoval === 'function' && pwcaQueueDesignRemoval(meta));
                } else if (typeof window.useDesignUsageStore === 'function') {
                    const store = window.pinia ? window.useDesignUsageStore(window.pinia) : window.useDesignUsageStore();
                    store.removeDesign({ id: meta.id || '', image: meta.image || '' });
                }
            }
        } catch (err) {}
    });

function pwcaRecordDesignRemoval(meta) {
    try {
        if (typeof window.useDesignUsageStore === 'function') {
            const store = window.pinia ? window.useDesignUsageStore(window.pinia) : window.useDesignUsageStore();
            store.removeDesign({ id: String(meta.id || ''), image: String(meta.image || '') });
            return true;
        }
    } catch (e) {}
    return false;
}

function pwcaQueueDesignRemoval(meta) {
    if (pwcaRecordDesignRemoval(meta)) return;
    const handler = () => {
        pwcaRecordDesignRemoval(meta);
        document.removeEventListener('canvasPiniaReady', handler);
    };
    document.addEventListener('canvasPiniaReady', handler);
}
    fabricCanvas.on('object:moving', (e) => {
        const obj = e.target;
        if (obj && !pwcaIsElementInLayerGroup(obj)) { needsAlertOnRelease = true; alertTargetObject = obj; }
        else { needsAlertOnRelease = false; alertTargetObject = null; }
    });
    fabricCanvas.on('object:scaling', (e) => {
        const obj = e.target;
        if (obj && !pwcaIsElementInLayerGroup(obj)) { needsAlertOnRelease = true; alertTargetObject = obj; }
        else { needsAlertOnRelease = false; alertTargetObject = null; }
    });
    fabricCanvas.on('object:rotating', (e) => {
        const obj = e.target;
        if (obj && !pwcaIsElementInLayerGroup(obj)) { needsAlertOnRelease = true; alertTargetObject = obj; }
        else { needsAlertOnRelease = false; alertTargetObject = null; }
    });
}

function pwcaIsElementInLayerGroup(obj) {
    return obj && obj.group !== null && obj.group !== undefined;
}

function pwcaShowPrintMethodBindingAlert(targetObject) {
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
    if (uiStateAccess && typeof uiStateAccess.pwcaGetActiveObject === 'function') {
        return uiStateAccess.pwcaGetActiveObject();
    }

    return null;
}

function pwcaGetSelectionActiveTabId() {
    const uiStateAccess = pwcaGetUiStateAccess();
    if (uiStateAccess && typeof uiStateAccess.pwcaGetCurrentActiveTab === 'function') {
        return uiStateAccess.pwcaGetCurrentActiveTab();
    }

    if (typeof window.pwcaGetCurrentActiveTab === 'function') {
        return window.pwcaGetCurrentActiveTab();
    }

    return null;
}

function pwcaSyncToolbarBySelectedObject(selectedObj) {
    if (typeof window.pwcaUpdateDynamicToolbar === 'function') {
        window.pwcaUpdateDynamicToolbar(selectedObj);
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
        if (typeof window.pwcaSwitchOperationPanelTab === 'function') {
            window.pwcaSwitchOperationPanelTab('tab-wenzi', { preserveSelection: true });
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

    if (type === 'image' && typeof window.pwcaSwitchOperationPanelTab === 'function') {
        window.pwcaSwitchOperationPanelTab('tab-pianquan', { preserveSelection: true });
    }
}

function pwcaHandleCanvasSelectionChange(options) {
    const selectedObj = pwcaGetSelectedObjectFromSelectionEvent(options);
    pwcaSyncToolbarBySelectedObject(selectedObj);
    pwcaSyncOperationPanelBySelectedObject(selectedObj);
}

function pwcaAddCanvasSelectionListeners(fabricCanvas) {
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

window.pwcaAddCanvasEventListeners = pwcaAddCanvasEventListeners;
window.pwcaAddCanvasSelectionListeners = pwcaAddCanvasSelectionListeners;
window.pwcaShowPrintMethodBindingAlert = pwcaShowPrintMethodBindingAlert;
