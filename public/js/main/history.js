let history = [];
let historyPointer = -1;
const MAX_HISTORY_STEPS = 50;
let isRestoring = false;

function saveState() {
    const activeCanvas = typeof window.getActiveCanvas === 'function' ? window.getActiveCanvas() : null;
    if (!activeCanvas) return;
    if (historyPointer < history.length - 1) history = history.slice(0, historyPointer + 1);
    history.push(activeCanvas.toDataURL());
    historyPointer++;
    if (history.length > MAX_HISTORY_STEPS) { history.shift(); historyPointer--; }
    updateHistoryButtons();
}

function restoreState(index) {
    const activeCanvas = typeof window.getActiveCanvas === 'function' ? window.getActiveCanvas() : null;
    if (!activeCanvas || index < 0 || index >= history.length) return;
    isRestoring = true;
    activeCanvas.clear();
    const img = new Image();
    img.src = history[index];
    img.onload = () => {
        fabric.Image.fromURL(img.src, function (oImg) {
            oImg.scaleToWidth(activeCanvas.width);
            oImg.scaleToHeight(activeCanvas.height);
            activeCanvas.add(oImg);
            activeCanvas.renderAll();
            historyPointer = index;
            updateHistoryButtons();
            isRestoring = false;
        }, { crossOrigin: 'anonymous' });
    };
}

function updateHistoryButtons() {
    const forwardBtn = document.getElementById('forward');
    const backwardBtn = document.getElementById('backward');
    if (forwardBtn) forwardBtn.disabled = historyPointer >= history.length - 1;
    if (backwardBtn) backwardBtn.disabled = historyPointer <= 0;
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

const forwardBtn = document.getElementById('forward');
if (forwardBtn) {
    forwardBtn.addEventListener('click', () => {
        if (historyPointer < history.length - 1) restoreState(historyPointer + 1);
    });
}

const backwardBtn = document.getElementById('backward');
if (backwardBtn) {
    backwardBtn.addEventListener('click', () => {
        if (historyPointer > 0) restoreState(historyPointer - 1);
    });
}

window.__historyInternals = { isRestoringRef: () => isRestoring };