const viewHistories = new Map();
function getActiveViewId() {
    const store = typeof window.useCanvasStore === 'function' ? window.useCanvasStore() : null;
    return store && store.activeViewId ? store.activeViewId : null;
}
function ensureViewHistory(viewId) {
    if (!viewId) return null;
    if (!viewHistories.has(viewId)) {
        viewHistories.set(viewId, { history: [], pointer: -1 });
    }
    return viewHistories.get(viewId);
}
const MAX_HISTORY_STEPS = 50;
let isRestoring = false;

function saveState(viewId = getActiveViewId()) {
    const activeCanvas = typeof window.getActiveCanvas === 'function' ? window.getActiveCanvas() : null;
    const vh = ensureViewHistory(viewId);
    if (!activeCanvas || !vh) return;
    if (vh.pointer < vh.history.length - 1) vh.history = vh.history.slice(0, vh.pointer + 1);
    vh.history.push(activeCanvas.toDataURL());
    vh.pointer++;
    if (vh.history.length > MAX_HISTORY_STEPS) { vh.history.shift(); vh.pointer--; }
    updateHistoryButtons(viewId);
}

function restoreState(index, viewId = getActiveViewId()) {
    const activeCanvas = typeof window.getActiveCanvas === 'function' ? window.getActiveCanvas() : null;
    const vh = ensureViewHistory(viewId);
    if (!activeCanvas || !vh || index < 0 || index >= vh.history.length) return;
    isRestoring = true;
    activeCanvas.clear();
    const img = new Image();
    img.src = vh.history[index];
    img.onload = () => {
        fabric.Image.fromURL(img.src, function (oImg) {
            oImg.scaleToWidth(activeCanvas.width);
            oImg.scaleToHeight(activeCanvas.height);
            activeCanvas.add(oImg);
            activeCanvas.renderAll();
            vh.pointer = index;
            updateHistoryButtons(viewId);
            isRestoring = false;
        }, { crossOrigin: 'anonymous' });
    };
}

function updateHistoryButtons(viewId = getActiveViewId()) {
    const vh = ensureViewHistory(viewId);
    if (!vh) return;
    const forwardBtn = document.getElementById(`forward-${viewId}`);
    const backwardBtn = document.getElementById(`backward-${viewId}`);
    if (forwardBtn) forwardBtn.disabled = vh.pointer >= vh.history.length - 1;
    if (backwardBtn) backwardBtn.disabled = vh.pointer <= 0;
}

function stepHistory(direction, viewId = getActiveViewId()) {
    const vh = ensureViewHistory(viewId);
    if (!vh) return;
    if (direction === 'forward' && vh.pointer < vh.history.length - 1) {
        restoreState(vh.pointer + 1, viewId);
    }
    if (direction === 'backward' && vh.pointer > 0) {
        restoreState(vh.pointer - 1, viewId);
    }
}

function initializeCanvas() {
    const c = typeof window.getActiveCanvas === 'function' ? window.getActiveCanvas() : null;
    if (!c) return;
    c.setWidth(c.getElement().parentElement.clientWidth);
    c.setHeight(c.getElement().parentElement.clientHeight);
    c.clear();
    saveState();
}

window.saveState = saveState;
window.restoreState = restoreState;
window.updateHistoryButtons = updateHistoryButtons;
window.initializeCanvas = initializeCanvas;
window.stepHistory = stepHistory;

window.__historyInternals = { isRestoringRef: () => isRestoring };
