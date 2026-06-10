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

function pwcaIsUserInitiatedAction(obj) {
    if (obj.skipLayerSync === true) return false;
    if (obj.isSystemImage === true) return false;
    return obj.userInitiated === true || obj.fromToolbar === true || obj.fromButton === true;
}

window.pwcaCanvasInitializationState = CanvasInitializationState;
window.pwcaIsUserInitiatedAction = pwcaIsUserInitiatedAction;

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

function pwcaGetEnabledOperationModules(storeFromCaller) {
    const store = storeFromCaller || pwcaGetCanvasStore();
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

    // 尝试从 getter 获取启用的模块列表
    if (Array.isArray(store.currentViewEnabledModules) && store.currentViewEnabledModules.length > 0) {
        const normalized = pwcaNormalizeOperationModules(store.currentViewEnabledModules);
        // 防御性检查：如果归一化后为空（例如原始数组包含无效条目），不回退到此结果，
        // 而是继续向下尝试备用数据源
        if (normalized.length > 0) {
            return normalized;
        }
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

function pwcaIsOperationPanelTabAvailable(tabId, storeFromCaller) {
    if (!Object.prototype.hasOwnProperty.call(pwcaOptionalTabModuleMap, tabId)) {
        return true;
    }

    return pwcaGetEnabledOperationModules(storeFromCaller).includes(pwcaOptionalTabModuleMap[tabId]);
}

function pwcaGetAvailableOperationPanelTabs(storeFromCaller) {
    const validTabs = ['tab-pinming', 'tab-tuan', 'tab-pianquan', 'tab-wenzi', 'tab-sheji'];
    return validTabs.filter((tabId) => pwcaIsOperationPanelTabAvailable(tabId, storeFromCaller));
}

function pwcaResolveOperationPanelFallbackTab(preferredTabId, storeFromCaller) {
    const availableTabs = pwcaGetAvailableOperationPanelTabs(storeFromCaller);
    if (availableTabs.length === 0) {
        return null;
    }

    if (preferredTabId && availableTabs.includes(preferredTabId)) {
        return preferredTabId;
    }

    const activeTab = document.querySelector('.pwca-tabs-nav .pwca-tab.active');
    if (activeTab && availableTabs.includes(activeTab.id)) {
        return activeTab.id;
    }

    return availableTabs[0];
}

function pwcaDispatchOperationPanelModulesUpdated(storeFromCaller) {
    document.dispatchEvent(
        new CustomEvent('pwcaOperationPanelModulesUpdated', {
            detail: {
                enabledModules: pwcaGetEnabledOperationModules(storeFromCaller),
                availableTabs: pwcaGetAvailableOperationPanelTabs(storeFromCaller)
            }
        })
    );
}

function pwcaApplyOperationPanelModuleVisibility(storeFromCaller) {
    const enabledModules = pwcaGetEnabledOperationModules(storeFromCaller);
    let anyOptionalHidden = false;

    Object.keys(pwcaOptionalTabModuleMap).forEach((tabId) => {
        const shouldShow = enabledModules.includes(pwcaOptionalTabModuleMap[tabId]);
        if (!shouldShow) anyOptionalHidden = true;
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

    // 运行时诊断：如果所有可选标签页都隐藏了，记录 store 关键状态
    if (anyOptionalHidden) {
        const store = storeFromCaller || pwcaGetCanvasStore();
        console.warn('[PW Canvas] 操作面板可选标签页被隐藏', {
            enabledModules,
            storeState: store ? {
                hasProductData: !!store.productData,
                activeViewId: store.activeViewId,
                viewsCount: Array.isArray(store.views) ? store.views.length : 0
            } : 'store unavailable'
        });
    }

    const activeTab = document.querySelector('.pwca-tabs-nav .pwca-tab.active');
    const activeTabId = activeTab ? activeTab.id : null;
    if (!activeTabId || !pwcaIsOperationPanelTabAvailable(activeTabId, storeFromCaller)) {
        const fallbackTabId = pwcaResolveOperationPanelFallbackTab(activeTabId, storeFromCaller);
        if (fallbackTabId) {
            pwcaSwitchOperationPanelTab(fallbackTabId, { force: true });
        }
    }

    pwcaDispatchOperationPanelModulesUpdated(storeFromCaller);
}

let pwcaOperationPanelModuleSyncBound = false;

function pwcaBindOperationPanelModuleSync() {
    const store = pwcaGetCanvasStore();
    if (!store) {
        console.warn('[PW Canvas] Failed to bind operation panel sync: store is not ready');
        return;
    }

    if (pwcaOperationPanelModuleSyncBound) {
        pwcaApplyOperationPanelModuleVisibility(store);
        return;
    }

    // 立即应用一次可见性
    pwcaApplyOperationPanelModuleVisibility(store);

    // 监听 Store 变化，动态更新面板
    if (typeof store.$subscribe === 'function') {
        store.$subscribe((mutation) => {
            // 当 store 状态变化时（如产品数据加载完成、视图切换等），更新面板可见性
            // 重要：传递已捕获的 store 引用，避免在 Vue flush 微任务期间通过
            // pwcaGetCanvasStore() 重新获取可能失败的问题
            pwcaApplyOperationPanelModuleVisibility(store);
        });
    }

    pwcaOperationPanelModuleSyncBound = true;
    console.log('[PW Canvas] Operation panel UI sync bound successfully');
}

function pwcaSwitchOperationPanelTab(tabId, opts = {}) {
    const validTabs = ['tab-pinming', 'tab-tuan', 'tab-pianquan', 'tab-wenzi', 'tab-sheji'];
    if (!validTabs.includes(tabId)) return false;
    const resolvedTabId = opts.force === true
        ? tabId
        : pwcaResolveOperationPanelFallbackTab(tabId);
    if (!resolvedTabId) return false;
    const tabs = document.querySelectorAll('.pwca-tabs-nav .pwca-tab');
    const contentPanes = document.querySelectorAll('.pwca-content-area .pwca-content-pane');
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
            const textButtons = document.querySelectorAll('.pwca-text-toolbar .pwca-toolbar-button');
            textButtons.forEach(btn => btn.classList.remove('active'));
            const textInputBtn = document.getElementById('text_input');
            if (textInputBtn) textInputBtn.classList.add('active');
        } catch (e) {}
    }
    return true;
}

function pwcaGetCurrentActiveTab() {
    const activeTab = document.querySelector('.pwca-tabs-nav .pwca-tab.active');
    return activeTab ? activeTab.id : null;
}

function pwcaListAvailableTabs() {
    const tabs = document.querySelectorAll('.pwca-tabs-nav .pwca-tab');
    return Array.from(tabs).map(tab => ({
        id: tab.id,
        title: tab.querySelector('.pwca-tab-title')?.textContent || 'Unknown',
        active: tab.classList.contains('active')
    }));
}

window.pwcaSwitchOperationPanelTab = pwcaSwitchOperationPanelTab;
window.pwcaGetCurrentActiveTab = pwcaGetCurrentActiveTab;
window.pwcaListAvailableTabs = pwcaListAvailableTabs;
window.pwcaGetEnabledOperationModules = pwcaGetEnabledOperationModules;
window.pwcaIsOperationPanelTabAvailable = pwcaIsOperationPanelTabAvailable;
window.pwcaApplyOperationPanelModuleVisibility = pwcaApplyOperationPanelModuleVisibility;
window.pwcaShowTabControlHelp = function() {
    const help = {
        'pwcaSwitchOperationPanelTab(tabId)': 'Switch to the specified tab',
        'pwcaGetCurrentActiveTab()': 'Get the current active tab ID',
        'pwcaListAvailableTabs()': 'List all available tabs and their state',
        'Available tabId': ['tab-pinming (Product)', 'tab-tuan (Layers)', 'tab-pianquan (Image)', 'tab-wenzi (Text)', 'tab-sheji (Designs)']
    };
    return help;
};

let canvas = null;

function pwcaGetActiveCanvas() {
    if (window.pwcaCanvasManager && typeof window.pwcaCanvasManager.getActiveCanvas === 'function') {
        const managedCanvas = window.pwcaCanvasManager.getActiveCanvas();
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

    return canvas || window.pwcaCanvas || window.pwcaFabricCanvas || null;
}

function pwcaSetGlobalCanvas(fabricCanvas) {
    canvas = fabricCanvas;
    window.pwcaCanvas = fabricCanvas;
    window.pwcaFabricCanvas = fabricCanvas;
}

window.pwcaGetActiveCanvas = pwcaGetActiveCanvas;
window.pwcaSetGlobalCanvas = pwcaSetGlobalCanvas;

const pwca_default_color = '#3498db';
let pwca_current_color = pwca_default_color;
window.pwca_default_color = pwca_default_color;
window.pwca_current_color = pwca_current_color;

// 初始 UI 状态由 page-bootstrap.js 的异步队列统一调度绑定
// 暴露方法供外部显式调用
window.pwcaBindOperationPanelModuleSync = pwcaBindOperationPanelModuleSync;
window.pwcaApplyOperationPanelModuleVisibility = pwcaApplyOperationPanelModuleVisibility;

