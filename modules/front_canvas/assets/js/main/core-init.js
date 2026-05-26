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

const pwcaOptionalTabModuleMap = {
    'tab-pianquan': 'UPLOAD',
    'tab-wenzi': 'TEXT',
    'tab-sheji': 'DESIGN'
};

const pwcaDefaultOptionalModules = ['UPLOAD', 'TEXT', 'DESIGN'];

function pwcaGetUiStateAccess() {
    return window.pwcaUiStateAccess || null;
}

function pwcaGetCanvasStore() {
    const uiStateAccess = pwcaGetUiStateAccess();
    if (uiStateAccess && typeof uiStateAccess.getCanvasStore === 'function') {
        return uiStateAccess.getCanvasStore();
    }

    return null;
}

function pwcaGetActiveViewId() {
    const uiStateAccess = pwcaGetUiStateAccess();
    if (uiStateAccess && typeof uiStateAccess.getActiveViewId === 'function') {
        return uiStateAccess.getActiveViewId();
    }

    const store = pwcaGetCanvasStore();
    return store && store.activeViewId ? store.activeViewId : null;
}

function pwcaGetAllViewCanvases() {
    const uiStateAccess = pwcaGetUiStateAccess();
    if (uiStateAccess && typeof uiStateAccess.getAllViewCanvases === 'function') {
        return uiStateAccess.getAllViewCanvases();
    }

    return [];
}

function pwcaNormalizeOperationModules(modules) {
    if (!Array.isArray(modules)) {
        return [];
    }

    return modules
        .map((moduleName) => String(moduleName || '').trim().toUpperCase())
        .filter(Boolean);
}

function pwcaGetEnabledOperationModules() {
    const store = pwcaGetCanvasStore();
    if (!store) {
        return [];
    }

    const hasResolvedProductContext = !!store.productData ||
        !!store.productDataError ||
        !!store.activeViewId ||
        (Array.isArray(store.views) && store.views.length > 0) ||
        store.hasStoreCustomizationSettings === true ||
        !!store.storeCustomizationSettingsError;

    if (!hasResolvedProductContext) {
        return [];
    }

    if (Array.isArray(store.currentViewEnabledModules) && store.currentViewEnabledModules.length > 0) {
        return pwcaNormalizeOperationModules(store.currentViewEnabledModules);
    }

    const mergedSettings = store.currentViewCustomizationSettings;
    const selectedModules = pwcaNormalizeOperationModules(
        mergedSettings && mergedSettings.selected_modules
    );
    if (selectedModules.length > 0) {
        return selectedModules;
    }

    const activeModules = pwcaNormalizeOperationModules(
        mergedSettings && mergedSettings.active_modules
    );
    if (activeModules.length > 0) {
        return activeModules;
    }

    return [...pwcaDefaultOptionalModules];
}

function pwcaIsOperationPanelTabAvailable(tabId) {
    if (!Object.prototype.hasOwnProperty.call(pwcaOptionalTabModuleMap, tabId)) {
        return true;
    }

    return pwcaGetEnabledOperationModules().includes(pwcaOptionalTabModuleMap[tabId]);
}

function pwcaGetAvailableOperationPanelTabs() {
    const validTabs = ['tab-pinming', 'tab-tuan', 'tab-pianquan', 'tab-wenzi', 'tab-sheji'];
    return validTabs.filter((tabId) => pwcaIsOperationPanelTabAvailable(tabId));
}

function pwcaResolveOperationPanelFallbackTab(preferredTabId) {
    const availableTabs = pwcaGetAvailableOperationPanelTabs();
    if (availableTabs.length === 0) {
        return null;
    }

    if (preferredTabId && availableTabs.includes(preferredTabId)) {
        return preferredTabId;
    }

    const activeTab = document.querySelector('.tabs-nav .tab.active');
    if (activeTab && availableTabs.includes(activeTab.id)) {
        return activeTab.id;
    }

    return availableTabs[0];
}

function pwcaDispatchOperationPanelModulesUpdated() {
    document.dispatchEvent(
        new CustomEvent('pwcaOperationPanelModulesUpdated', {
            detail: {
                enabledModules: pwcaGetEnabledOperationModules(),
                availableTabs: pwcaGetAvailableOperationPanelTabs()
            }
        })
    );
}

function pwcaApplyOperationPanelModuleVisibility() {
    Object.keys(pwcaOptionalTabModuleMap).forEach((tabId) => {
        const shouldShow = pwcaIsOperationPanelTabAvailable(tabId);
        const tabElement = document.getElementById(tabId);
        const contentElement = document.getElementById(tabId.replace('tab-', 'content-'));

        if (tabElement) {
            tabElement.style.display = shouldShow ? '' : 'none';
            tabElement.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
        }

        if (contentElement) {
            if (!shouldShow) {
                contentElement.classList.remove('active');
            }
            contentElement.style.display = shouldShow ? '' : 'none';
            contentElement.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
        }
    });

    const activeTab = document.querySelector('.tabs-nav .tab.active');
    const activeTabId = activeTab ? activeTab.id : null;
    if (!activeTabId || !pwcaIsOperationPanelTabAvailable(activeTabId)) {
        const fallbackTabId = pwcaResolveOperationPanelFallbackTab();
        if (fallbackTabId) {
            switchOperationPanelTab(fallbackTabId, { force: true });
        }
    }

    pwcaDispatchOperationPanelModulesUpdated();
}

let pwcaOperationPanelModuleSyncBound = false;

function pwcaBindOperationPanelModuleSync() {
    const store = pwcaGetCanvasStore();
    if (!store) {
        window.setTimeout(pwcaBindOperationPanelModuleSync, 150);
        return;
    }

    if (pwcaOperationPanelModuleSyncBound) {
        pwcaApplyOperationPanelModuleVisibility();
        return;
    }

    pwcaApplyOperationPanelModuleVisibility();

    if (typeof store.$subscribe === 'function') {
        store.$subscribe((mutation) => {
            if (mutation && mutation.storeId === 'canvas') {
                pwcaApplyOperationPanelModuleVisibility();
            }
        });
    }

    pwcaOperationPanelModuleSyncBound = true;
}

function switchOperationPanelTab(tabId, opts = {}) {
    const validTabs = ['tab-pinming', 'tab-tuan', 'tab-pianquan', 'tab-wenzi', 'tab-sheji'];
    if (!validTabs.includes(tabId)) return false;
    const resolvedTabId = opts.force === true
        ? tabId
        : pwcaResolveOperationPanelFallbackTab(tabId);
    if (!resolvedTabId) return false;
    const tabs = document.querySelectorAll('.tabs-nav .tab');
    const contentPanes = document.querySelectorAll('.content-area .content-pane');
    if (tabs.length === 0 || contentPanes.length === 0) return false;
    tabs.forEach(tab => tab.classList.remove('active'));
    contentPanes.forEach(pane => pane.classList.remove('active'));
    const targetTab = document.getElementById(resolvedTabId);
    if (!targetTab) return false;
    targetTab.classList.add('active');
    const contentId = resolvedTabId.replace('tab-', 'content-');
    const targetContent = document.getElementById(contentId);
    if (!targetContent) return false;
    targetContent.classList.add('active');
    if (resolvedTabId === 'tab-pianquan') {
        try {
            const preserveSelection = !!opts.preserveSelection;
            if (!preserveSelection) {
                pwcaGetAllViewCanvases().forEach((canvas) => {
                    if (canvas && typeof canvas.discardActiveObject === 'function') {
                        canvas.discardActiveObject();
                        if (typeof canvas.requestRenderAll === 'function') canvas.requestRenderAll();
                        else if (typeof canvas.renderAll === 'function') canvas.renderAll();
                    }
                });
            }
        } catch (err) {}
    }
    if (resolvedTabId === 'tab-wenzi') {
        const preserveSelection = !!opts.preserveSelection;
        if (!preserveSelection) {
            try {
                pwcaGetAllViewCanvases().forEach((canvas) => {
                    if (canvas && typeof canvas.discardActiveObject === 'function') {
                        canvas.discardActiveObject();
                        if (typeof canvas.requestRenderAll === 'function') canvas.requestRenderAll();
                        else if (typeof canvas.renderAll === 'function') canvas.renderAll();
                    }
                });
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
window.pwcaGetEnabledOperationModules = pwcaGetEnabledOperationModules;
window.pwcaIsOperationPanelTabAvailable = pwcaIsOperationPanelTabAvailable;
window.pwcaApplyOperationPanelModuleVisibility = pwcaApplyOperationPanelModuleVisibility;
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
    const activeViewId = pwcaGetActiveViewId();
    if (activeViewId) {
        return {
            colorCanvas: document.getElementById(`colorLayer-${activeViewId}`),
            shadowCanvas: document.getElementById(`shadowLayer-${activeViewId}`),
            mainCanvas: document.getElementById(`mainCanvas-${activeViewId}`)
        };
    }
    return {
        colorCanvas: document.getElementById('colorLayer'),
        shadowCanvas: document.getElementById('shadowLayer'),
        mainCanvas: document.getElementById('mainCanvas')
    };
}

function getActiveCanvasContexts() {
    const elements = getActiveCanvasElements();
    return {
        colorCtx: elements.colorCanvas ? elements.colorCanvas.getContext('2d') : null,
        shadowCtx: elements.shadowCanvas ? elements.shadowCanvas.getContext('2d') : null
    };
}

let canvas = null;

function getActiveCanvas() {
    if (window.CanvasManager && typeof window.CanvasManager.getActiveCanvas === 'function') {
        const managedCanvas = window.CanvasManager.getActiveCanvas();
        if (managedCanvas) {
            return managedCanvas;
        }
    }

    const activeViewId = pwcaGetActiveViewId();
    if (activeViewId) {
        const canvasElement = document.getElementById(`mainCanvas-${activeViewId}`);
        if (canvasElement && canvasElement.__fabricCanvas) {
            return canvasElement.__fabricCanvas;
        }
    }

    return canvas || window.canvas || window.fabricCanvas || null;
}

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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', pwcaApplyOperationPanelModuleVisibility);
} else {
    pwcaApplyOperationPanelModuleVisibility();
}

document.addEventListener('canvasPiniaReady', pwcaBindOperationPanelModuleSync);
pwcaBindOperationPanelModuleSync();

const canvasStore = pwcaGetCanvasStore();
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
