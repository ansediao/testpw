function addCanvasLayerListeners(fabricCanvas) {
    if (!fabricCanvas) return;
    fabricCanvas.on('object:added', function (e) {
        const obj = e.target;
        if (!obj.id) obj.id = `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        syncCanvasObjectToStore(obj, 'added');
    });
    fabricCanvas.on('object:removed', function (e) {
        const obj = e.target;
        syncCanvasObjectToStore(obj, 'removed');
    });
    fabricCanvas.on('selection:created', function (e) {
        if (e.selected && e.selected.length > 0 && e.selected[0].id) syncSelectionToStore(e.selected[0].id);
    });
    fabricCanvas.on('selection:updated', function (e) {
        if (e.selected && e.selected.length > 0 && e.selected[0].id) syncSelectionToStore(e.selected[0].id);
    });
    fabricCanvas.on('selection:cleared', function () { syncSelectionToStore(null); });
    fabricCanvas.on('object:modified', function (e) {
        const obj = e.target;
        if (obj && obj.id) {
            setTimeout(() => {
                const refreshEvent = new CustomEvent('layerThumbnailRefresh', { detail: { layerId: obj.id } });
                document.dispatchEvent(refreshEvent);
            }, 100);
        }
    });
}

function pwcaGetUiStateAccess() {
    return window.pwcaUiStateAccess || null;
}

function syncCanvasObjectToStore(obj, action) {
    if (window.CanvasInitializationState && window.CanvasInitializationState.isInitializing) return;
    if (!window.isUserInitiatedAction || !window.isUserInitiatedAction(obj)) return;
    const stateAccess = pwcaGetUiStateAccess();
    if (stateAccess && typeof stateAccess.getCanvasStore === 'function') {
        try {
            const store = stateAccess.getCanvasStore();
            const currentViewId = stateAccess.getActiveViewId();
            if (!currentViewId) return;
            if (action === 'added' && obj.id) {
                const currentViewLayers = store.getViewLayers(currentViewId);
                const existingLayer = currentViewLayers.find(layer => layer.id === obj.id);
                if (!existingLayer) {
                    const layerName = getLayerName(obj);
                    const layerType = getLayerType(obj);
                    const newLayer = {
                        id: obj.id,
                        name: layerName,
                        type: layerType,
                        visible: obj.visible !== false,
                        locked: !obj.selectable,
                        groupId: obj.groupId || null,
                        groupOrder: obj.groupOrder || 0
                    };
                    store.addLayerToView(currentViewId, newLayer);
                }
            } else if (action === 'removed' && obj.id) {
                store.removeLayerFromView(currentViewId, obj.id);
                if (store.activeObjectId === obj.id) store.setActiveObjectId(null);
            }
        } catch (error) {}
    }
}

function syncSelectionToStore(objectId) {
    const stateAccess = pwcaGetUiStateAccess();
    if (stateAccess && typeof stateAccess.getCanvasStore === 'function') {
        try {
            const store = stateAccess.getCanvasStore();
            store.setActiveObjectId(objectId);
            updateDongtaiAreaButtons(objectId);
            controlMaskCanvasFromMain(objectId);
            controlMainWrapperDisplayArea(objectId);
        } catch (error) {}
    }
}

function updateDongtaiAreaButtons(objectId) {
    const dongtaiArea = document.querySelector('.dongtai-area');
    if (!dongtaiArea) return;
    const stateAccess = pwcaGetUiStateAccess();
    const canvas =
        stateAccess && typeof stateAccess.getActiveCanvas === 'function'
            ? stateAccess.getActiveCanvas()
            : (typeof window.getActiveCanvas === 'function' ? window.getActiveCanvas() : null);
    if (!canvas || !objectId) { dongtaiArea.style.display = 'none'; return; }
    const selectedObject = canvas.getObjects().find(obj => obj.id === objectId);
    if (selectedObject) { dongtaiArea.style.display = 'block'; showRelevantButtonGroup(selectedObject); }
    else { dongtaiArea.style.display = 'none'; }
}

function showRelevantButtonGroup(selectedObject) {
    if (!selectedObject) return;
    const textToolbar = document.querySelector('.text_toolbar');
    const imgToolbar = document.querySelector('.img_toolbar');
    if (textToolbar) textToolbar.style.display = 'none';
    if (imgToolbar) imgToolbar.style.display = 'none';
    if (selectedObject.type === 'text' || selectedObject.type === 'i-text') { if (textToolbar) textToolbar.style.display = 'block'; }
    else if (selectedObject.type === 'image') { if (imgToolbar) imgToolbar.style.display = 'block'; }
    if (typeof window.updateDynamicToolbar === 'function') window.updateDynamicToolbar(selectedObject);
}

function controlMaskCanvasFromMain(objectId) {
    const stateAccess = pwcaGetUiStateAccess();
    const store = stateAccess && stateAccess.getCanvasStore ? stateAccess.getCanvasStore() : null;
    const currentViewId = stateAccess && stateAccess.getActiveViewId ? stateAccess.getActiveViewId() : null;
    if (!store || !currentViewId) return;
    const maskWrapper = document.getElementById(`maskWrapper-${currentViewId}`);
    if (!maskWrapper) return;
    let isGrouped = false;
    if (objectId) {
        const layer =
            stateAccess && typeof stateAccess.findCurrentViewLayerById === 'function'
                ? stateAccess.findCurrentViewLayerById(objectId)
                : null;
        isGrouped = layer && layer.groupId;
    }
    maskWrapper.style.display = isGrouped ? 'block' : 'none';
}

function controlMainWrapperDisplayArea(objectId) {
    const stateAccess = pwcaGetUiStateAccess();
    const store = stateAccess && stateAccess.getCanvasStore ? stateAccess.getCanvasStore() : null;
    const currentViewId = stateAccess && stateAccess.getActiveViewId ? stateAccess.getActiveViewId() : null;
    if (!store || !currentViewId) return;
    const mainCanvas =
        stateAccess && typeof stateAccess.getCanvasByViewId === 'function'
            ? stateAccess.getCanvasByViewId(currentViewId)
            : window.CanvasManager?.getCanvas(currentViewId);
    if (!mainCanvas) return;
    const maskCanvasElement = document.getElementById(`maskCanvas-${currentViewId}`);
    if (!maskCanvasElement || !maskCanvasElement.__fabricCanvas) return;
    const maskCanvas = maskCanvasElement.__fabricCanvas;
    const maskObjects = maskCanvas.getObjects();
    let centerRectCoords = null;
    const printAreaRect = maskObjects.find(obj => obj.name === 'printAreaRect');
    if (printAreaRect) {
        const scaleX = printAreaRect.scaleX || 1;
        const scaleY = printAreaRect.scaleY || 1;
        centerRectCoords = { left: printAreaRect.left, top: printAreaRect.top, width: (printAreaRect.width || 0) * scaleX, height: (printAreaRect.height || 0) * scaleY };
    } else {
        const printAreaMask = maskObjects.find(obj => obj.name === 'printAreaMask');
        if (!printAreaMask || !Array.isArray(printAreaMask.path) || printAreaMask.path.length < 10) return;
        const pathData = printAreaMask.path;
        let secondMIndex = -1; let mCount = 0;
        for (let i = 0; i < pathData.length; i++) { if (pathData[i] && pathData[i][0] === 'M') { mCount++; if (mCount === 2) { secondMIndex = i; break; } } }
        if (secondMIndex !== -1) {
            const x1 = pathData[secondMIndex][1]; const y1 = pathData[secondMIndex][2];
            let xCoords = [x1]; let yCoords = [y1];
            for (let i = secondMIndex + 1; i < pathData.length; i++) {
                if (pathData[i] && pathData[i][0] === 'L') { const lx = pathData[i][1]; const ly = pathData[i][2]; xCoords.push(lx); yCoords.push(ly); }
                else if (pathData[i] && pathData[i][0] === 'Z') { break; }
            }
            if (xCoords.length >= 2 && yCoords.length >= 2) {
                const minX = Math.min(...xCoords); const maxX = Math.max(...xCoords); const minY = Math.min(...yCoords); const maxY = Math.max(...yCoords);
                centerRectCoords = { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
            }
        }
    }
    if (!centerRectCoords || isNaN(centerRectCoords.width) || isNaN(centerRectCoords.height) || centerRectCoords.width <= 0 || centerRectCoords.height <= 0) return;
    const applyClipForObject = (obj) => {
        let isBound = false;
        if (window.PrintAreaValidator && typeof window.PrintAreaValidator.hasPrintMethodAssigned === 'function') {
            isBound = !!window.PrintAreaValidator.hasPrintMethodAssigned(obj);
        } else {
            const pmStore =
                stateAccess && typeof stateAccess.getPrintMethodStore === 'function'
                    ? stateAccess.getPrintMethodStore()
                    : null;
            if (pmStore) {
                const methodId = pmStore.layerPrintMethodMap[obj.id];
                if (methodId) { isBound = true; }
                else if (obj.groupId) {
                    const groupMethodId = pmStore.groupPrintMethodMap[obj.groupId];
                    if (groupMethodId) { isBound = true; }
                    else {
                        const match = String(obj.groupId).match(/^print-method-(.+)$/);
                        if (match && match[1]) { isBound = true; }
                    }
                }
            }
        }
        if (isBound) {
            const clipRect = new fabric.Rect({ left: centerRectCoords.left, top: centerRectCoords.top, width: centerRectCoords.width, height: centerRectCoords.height, originX: 'left', originY: 'top', fill: 'transparent', stroke: 'transparent', strokeWidth: 0, selectable: false, evented: false, excludeFromExport: true, absolutePositioned: true });
            obj.clipPath = clipRect; obj.dirty = true; obj.setCoords();
        } else { if (obj.clipPath) obj.clipPath = null; }
    };
    mainCanvas.getObjects().forEach(applyClipForObject);
    if (mainCanvas.clipPath) { mainCanvas.clipPath = null; }
    mainCanvas.renderAll();
    return;
}

function getLayerName(obj) {
    if (obj.layerName) return obj.layerName;
    if (obj.type === 'text' || obj.type === 'i-text') { const text = obj.text || ''; return text.length > 15 ? text.substring(0, 15) + '...' : text; }
    else if (obj.type === 'image') { return 'Image ' + Date.now().toString().slice(-4); }
    else { return 'Layer ' + Date.now().toString().slice(-4); }
}

function getLayerType(obj) {
    if (obj.layerType) return obj.layerType;
    if (obj.type === 'text' || obj.type === 'i-text') return 'text';
    else if (obj.type === 'image') return 'image';
    else return 'other';
}

window.addCanvasLayerListeners = addCanvasLayerListeners;
window.syncCanvasObjectToStore = syncCanvasObjectToStore;
window.syncSelectionToStore = syncSelectionToStore;
window.updateDongtaiAreaButtons = updateDongtaiAreaButtons;
window.showRelevantButtonGroup = showRelevantButtonGroup;
window.controlMaskCanvasFromMain = controlMaskCanvasFromMain;
window.controlMainWrapperDisplayArea = controlMainWrapperDisplayArea;
window.getLayerName = getLayerName;
window.getLayerType = getLayerType;
