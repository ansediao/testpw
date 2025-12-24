// ===== 全局初始化状态管理系统 =====
const CanvasInitializationState = {
    isInitializing: false,
    viewInitializationStatus: new Map(),
    startInitialization(viewId = 'global') {
        this.isInitializing = true;
        this.viewInitializationStatus.set(viewId, true);
    },
    completeInitialization(viewId = 'global') {
        this.viewInitializationStatus.set(viewId, false);
        const allCompleted = Array.from(this.viewInitializationStatus.values()).every(status => !status);
        if (allCompleted) {
            this.isInitializing = false;
            document.dispatchEvent(new CustomEvent('canvasInitializationComplete', { detail: { timestamp: Date.now() } }));
        }
    },
    isViewInitializing(viewId) {
        return this.viewInitializationStatus.get(viewId) || false;
    },
    reset() {
        this.isInitializing = false;
        this.viewInitializationStatus.clear();
    }
};

function isUserInitiatedAction(obj) {
    if (obj.skipLayerSync === true) return false;
    if (obj.isSystemImage === true) return false;
    return obj.userInitiated === true || obj.fromToolbar === true || obj.fromButton === true;
}

window.CanvasInitializationState = CanvasInitializationState;
window.isUserInitiatedAction = isUserInitiatedAction;

function switchOperationPanelTab(tabId, opts = {}) {
    const validTabs = ['tab-pinming', 'tab-tuan', 'tab-pianquan', 'tab-wenzi', 'tab-sheji'];
    if (!validTabs.includes(tabId)) return false;
    const tabs = document.querySelectorAll('.tabs-nav .tab');
    const contentPanes = document.querySelectorAll('.content-area .content-pane');
    if (tabs.length === 0 || contentPanes.length === 0) return false;
    tabs.forEach(tab => tab.classList.remove('active'));
    contentPanes.forEach(pane => pane.classList.remove('active'));
    const targetTab = document.getElementById(tabId);
    if (!targetTab) return false;
    targetTab.classList.add('active');
    const contentId = tabId.replace('tab-', 'content-');
    const targetContent = document.getElementById(contentId);
    if (!targetContent) return false;
    targetContent.classList.add('active');
    if (tabId === 'tab-pianquan') {
        try {
            const preserveSelection = !!opts.preserveSelection;
            if (!preserveSelection) {
                if (window.CanvasManager && typeof window.CanvasManager.getViewIds === 'function') {
                    const viewIds = window.CanvasManager.getViewIds();
                    viewIds.forEach(viewId => {
                        const canvas = window.CanvasManager.getCanvas(viewId);
                        if (canvas && typeof canvas.discardActiveObject === 'function') {
                            canvas.discardActiveObject();
                            if (typeof canvas.requestRenderAll === 'function') canvas.requestRenderAll();
                            else if (typeof canvas.renderAll === 'function') canvas.renderAll();
                        }
                    });
                }
            }
        } catch (err) {}
    }
    if (tabId === 'tab-wenzi') {
        const preserveSelection = !!opts.preserveSelection;
        if (!preserveSelection) {
            try {
                if (window.CanvasManager && typeof window.CanvasManager.getViewIds === 'function') {
                    const viewIds = window.CanvasManager.getViewIds();
                    viewIds.forEach(viewId => {
                        const canvas = window.CanvasManager.getCanvas(viewId);
                        if (canvas && typeof canvas.discardActiveObject === 'function') {
                            canvas.discardActiveObject();
                            if (typeof canvas.requestRenderAll === 'function') canvas.requestRenderAll();
                            else if (typeof canvas.renderAll === 'function') canvas.renderAll();
                        }
                    });
                }
            } catch (err) {}
        }
        try {
            const addTextBox = document.getElementById('addTextBtn_box');
            if (addTextBox) addTextBox.style.display = 'block';
        } catch (e) {}
        try {
            const textButtons = document.querySelectorAll('.text_toolbar .toolbar_button');
            textButtons.forEach(btn => btn.classList.remove('active'));
            const textInputBtn = document.getElementById('text_input');
            if (textInputBtn) textInputBtn.classList.add('active');
        } catch (e) {}
    }
    return true;
}

function getCurrentActiveTab() {
    const activeTab = document.querySelector('.tabs-nav .tab.active');
    return activeTab ? activeTab.id : null;
}

function listAvailableTabs() {
    const tabs = document.querySelectorAll('.tabs-nav .tab');
    return Array.from(tabs).map(tab => ({
        id: tab.id,
        title: tab.querySelector('.tab_title')?.textContent || 'Unknown',
        active: tab.classList.contains('active')
    }));
}

window.switchOperationPanelTab = switchOperationPanelTab;
window.getCurrentActiveTab = getCurrentActiveTab;
window.listAvailableTabs = listAvailableTabs;
window.showTabControlHelp = function() {
    const help = {
        'switchOperationPanelTab(tabId)': 'Switch to the specified tab',
        'getCurrentActiveTab()': 'Get the current active tab ID',
        'listAvailableTabs()': 'List all available tabs and their state',
        'Available tabId': ['tab-pinming (Product)', 'tab-tuan (Layers)', 'tab-pianquan (Image)', 'tab-wenzi (Text)', 'tab-sheji (Designs)']
    };
    return help;
};

function getActiveCanvasElements() {
    const store = window.useCanvasStore && window.useCanvasStore();
    if (store && store.activeViewId) {
        return {
            colorCanvas: document.getElementById(`colorLayer-${store.activeViewId}`),
            shadowCanvas: document.getElementById(`shadowLayer-${store.activeViewId}`),
            mainCanvas: document.getElementById(`mainCanvas-${store.activeViewId}`)
        };
    }
    return { colorCanvas: document.getElementById('colorLayer'), shadowCanvas: document.getElementById('shadowLayer'), mainCanvas: document.getElementById('mainCanvas') };
}

function getActiveCanvasContexts() {
    const elements = getActiveCanvasElements();
    return {
        colorCtx: elements.colorCanvas ? elements.colorCanvas.getContext('2d') : null,
        shadowCtx: elements.shadowCanvas ? elements.shadowCanvas.getContext('2d') : null
    };
}

let canvas = null;

function setGlobalCanvas(fabricCanvas) {
    canvas = fabricCanvas;
    window.canvas = fabricCanvas;
    window.fabricCanvas = fabricCanvas;
}

window.getActiveCanvasElements = getActiveCanvasElements;
window.getActiveCanvasContexts = getActiveCanvasContexts;
window.getActiveCanvas = getActiveCanvas;
window.setGlobalCanvas = setGlobalCanvas;

const defaultColor = '#3498db';
let currentColor = defaultColor;
window.defaultColor = defaultColor;
window.currentColor = currentColor;

const canvasStore = window.Pinia && window.useCanvasStore ? window.useCanvasStore() : null;
const isMultiViewMode = canvasStore && canvasStore.views && canvasStore.views.length > 0;
const hasMultiViewContainer = document.querySelector('.multi-view-container') !== null;
if (!isMultiViewMode && !hasMultiViewContainer) {
    if (typeof window.initCanvasSystem === 'function') {
        window.initCanvasSystem();
    } else if (typeof init === 'function') {
        init();
    }
    if (document.getElementById('boundaryLayer')) {
        drawBoundary();
    }
    if (canvas) {
        if (typeof window.initializeCanvas === 'function') window.initializeCanvas();
    }
}
