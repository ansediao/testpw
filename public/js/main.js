// ===== 全局初始化状态管理系统 =====
// 管理Canvas初始化状态，防止API数据被误同步到图层面板
const CanvasInitializationState = {
    isInitializing: false,
    viewInitializationStatus: new Map(),
    // 跟踪每个视图的初始化状态

    // 开始初始化过程
    startInitialization(viewId = 'global') {
        this.isInitializing = true;
        this.viewInitializationStatus.set(viewId, true);
        console.log(`[CanvasInit] 开始初始化视图: ${viewId}`);
    },

    // 完成初始化过程
    completeInitialization(viewId = 'global') {
        this.viewInitializationStatus.set(viewId, false);

        // 检查是否所有视图都完成初始化
        const allCompleted = Array.from(this.viewInitializationStatus.values()).every(status => !status);

        if (allCompleted) {
            this.isInitializing = false;
            console.log('[CanvasInit] 所有视图初始化完成，触发完成事件');

            // 触发全局初始化完成事件
            document.dispatchEvent(new CustomEvent('canvasInitializationComplete', {
                detail: {
                    timestamp: Date.now()
                }
            }));
        }

        console.log(`[CanvasInit] 视图 ${viewId} 初始化完成`);
    },

    // 检查指定视图是否正在初始化
    isViewInitializing(viewId) {
        return this.viewInitializationStatus.get(viewId) || false;
    },

    // 重置所有状态
    reset() {
        this.isInitializing = false;
        this.viewInitializationStatus.clear();
        console.log('[CanvasInit] 状态已重置');
    }
};

// 检查对象是否为用户操作触发
function isUserInitiatedAction(obj) { // 检查是否明确标记跳过同步
    if (obj.skipLayerSync === true) {
        return false;
    }

    // 检查是否为系统图片
    if (obj.isSystemImage === true) {
        return false;
    }

    // 检查对象是否有用户操作标记
    return obj.userInitiated === true || obj.fromToolbar === true || obj.fromButton === true;
}

// 暴露到全局作用域
window.CanvasInitializationState = CanvasInitializationState;
window.isUserInitiatedAction = isUserInitiatedAction;

// 动态加载 Tab 控制工具
/**
 * 操作面板 Tab 控制工具
 * 提供控制台接口来切换操作面板的 tab 状态
 */

// ===== 操作面板 Tab 控制工具 =====

/**
 * 切换操作面板的 tab
 * @param {string} tabId - tab 的 ID
 * @returns {boolean} - 操作是否成功
 */
function switchOperationPanelTab(tabId) {
    // 验证 tabId 是否有效
    const validTabs = ['tab-pinming', 'tab-tuan', 'tab-pianquan', 'tab-wenzi', 'tab-sheji'];
    if (!validTabs.includes(tabId)) {
        return false;
    }

    // 获取所有 tab 元素
    const tabs = document.querySelectorAll('.tabs-nav .tab');
    const contentPanes = document.querySelectorAll('.content-area .content-pane');

    if (tabs.length === 0 || contentPanes.length === 0) {
        return false;
    }

    // 移除所有 active 类
    tabs.forEach(tab => tab.classList.remove('active'));
    contentPanes.forEach(pane => pane.classList.remove('active'));

    // 激活指定的 tab
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add('active');
    } else {
        return false;
    }

    // 激活对应的内容面板
    const contentId = tabId.replace('tab-', 'content-');
    const targetContent = document.getElementById(contentId);
    if (targetContent) {
        targetContent.classList.add('active');
    } else {
        return false;
    }

    return true;
}

/**
 * 获取当前激活的 tab
 * @returns {string|null} - 当前激活的 tab ID
 */
function getCurrentActiveTab() {
    const activeTab = document.querySelector('.tabs-nav .tab.active');
    return activeTab ? activeTab.id : null;
}

/**
 * 列出所有可用的 tab
 * @returns {Array} - tab 列表
 */
function listAvailableTabs() {
    const tabs = document.querySelectorAll('.tabs-nav .tab');
    return Array.from(tabs).map(tab => ({
        id: tab.id,
        title: tab.querySelector('.tab_title')?.textContent || 'Unknown',
        active: tab.classList.contains('active')
    }));
}

// 暴露到全局作用域供控制台使用
window.switchOperationPanelTab = switchOperationPanelTab;
window.getCurrentActiveTab = getCurrentActiveTab;
window.listAvailableTabs = listAvailableTabs;

// 提供帮助函数（可选）
window.showTabControlHelp = function() {
    const help = {
        'switchOperationPanelTab(tabId)': '切换到指定的 tab',
        'getCurrentActiveTab()': '获取当前激活的 tab ID',
        'listAvailableTabs()': '列出所有可用的 tab 及其状态',
        '可用的 tabId': [
            'tab-pinming (Product)',
            'tab-tuan (Layers)',
            'tab-pianquan (Image)',
            'tab-wenzi (Text)',
            'tab-sheji (Designs)'
        ]
    };
    return help;
};

// ===== Canvas 元素获取函数 =====

// 获取画布和上下文 - 动态获取当前激活视图的 canvas
function getActiveCanvasElements() {
    const store = window.useCanvasStore && window.useCanvasStore();
    if (store && store.activeViewId) {
        return {
            colorCanvas: document.getElementById(`colorLayer-${
                store.activeViewId
            }`),
            shadowCanvas: document.getElementById(`shadowLayer-${
                store.activeViewId
            }`),
            mainCanvas: document.getElementById(`mainCanvas-${
                store.activeViewId
            }`)
        };
    }
    // 回退到原始 ID（兼容性）
    return {colorCanvas: document.getElementById('colorLayer'), shadowCanvas: document.getElementById('shadowLayer'), mainCanvas: document.getElementById('mainCanvas')};
}

// 动态获取上下文
function getActiveCanvasContexts() {
    const elements = getActiveCanvasElements();
    return {
        colorCtx: elements.colorCanvas ? elements.colorCanvas.getContext('2d') : null,
        shadowCtx: elements.shadowCanvas ? elements.shadowCanvas.getContext('2d') : null
    };
}
// 历史记录管理逻辑
// 历史记录数组和当前索引
let history = [];
let historyPointer = -1;
const MAX_HISTORY_STEPS = 50; // 限制历史记录步数
let isRestoring = false;
// 标志以防止恢复状态时触发保存

// 保存画布当前状态到历史记录
function saveState() {
    const activeCanvas = getActiveCanvas();
    if (! activeCanvas) 
        return;
    

    // 如果在历史记录中间进行了新操作，则清除未来的历史记录
    if (historyPointer < history.length - 1) {
        history = history.slice(0, historyPointer + 1);
    }
    // 将当前画布内容保存为 Data URL
    history.push(activeCanvas.toDataURL());
    historyPointer++;

    // 限制历史记录步数
    if (history.length > MAX_HISTORY_STEPS) {
        history.shift(); // 移除最旧的记录
        historyPointer--;
    }

    updateHistoryButtons();

}

// 从历史记录中加载指定状态并绘制到画布
function restoreState(index) {
    const activeCanvas = getActiveCanvas();
    if (! activeCanvas || index < 0 || index >= history.length) 
        return;
    

    isRestoring = true;
    activeCanvas.clear(); // 清空画布
    const img = new Image();
    img.src = history[index];
    img.onload = () => {
        fabric.Image.fromURL(img.src, function (oImg) { // 调整图像尺寸以适应画布
            oImg.scaleToWidth(activeCanvas.width);
            oImg.scaleToHeight(activeCanvas.height);
            activeCanvas.add(oImg);
            activeCanvas.renderAll();
            historyPointer = index;
            updateHistoryButtons();

            isRestoring = false;
        }, {crossOrigin: 'anonymous'});
    };
}

// 更新前进/后退按钮状态
function updateHistoryButtons() {
    const forwardBtn = document.getElementById('forward');
    const backwardBtn = document.getElementById('backward');
    if (forwardBtn) 
        forwardBtn.disabled = historyPointer >= history.length - 1;
    
    if (backwardBtn) 
        backwardBtn.disabled = historyPointer <= 0;
    

}

// 初始化画布尺寸并清空
function initializeCanvas() {
    canvas.setWidth(canvas.getElement().parentElement.clientWidth);
    canvas.setHeight(canvas.getElement().parentElement.clientHeight);
    canvas.clear();
    saveState(); // 保存初始空白状态
}

// Canvas 初始化将在多视图系统中处理
// 这里保留全局变量的声明以保持兼容性
let canvas = null;

// 获取当前激活的 canvas 实例
function getActiveCanvas() { // 优先使用 CanvasManager
    if (window.CanvasManager) {
        return window.CanvasManager.getActiveCanvas();
    }

    // 回退到传统方式
    const store = window.useCanvasStore && window.useCanvasStore();
    if (store && store.activeViewId) { // 从 DOM 获取 Canvas 实例
        const canvasElement = document.getElementById(`mainCanvas-${
            store.activeViewId
        }`);
        if (canvasElement && canvasElement.__fabricCanvas) {
            return canvasElement.__fabricCanvas;
        }
    }
    return window.canvas || window.fabricCanvas;
}

// 动态设置全局 canvas 引用
function setGlobalCanvas(fabricCanvas) {
    canvas = fabricCanvas;
    window.canvas = fabricCanvas;
    window.fabricCanvas = fabricCanvas;
}

// 为 canvas 添加所有必要的事件监听器
function initializeCanvasEventListeners(fabricCanvas, options = {}) {
    if (!fabricCanvas) 
        return;
    

    // 立即添加基础事件监听器
    addCanvasEventListeners(fabricCanvas);
    addCanvasSelectionListeners(fabricCanvas);
    addCanvas3DModelListeners(fabricCanvas);

    // ===== 核心修复：延迟添加图层监听器 =====
    // 检查是否需要延迟激活图层监听器
    if (options.delayLayerListeners !== false) { // 如果正在初始化，延迟添加图层监听器
        if (CanvasInitializationState.isInitializing) {
            console.log('[CanvasInit] 初始化中，延迟激活图层监听器');

            // 监听初始化完成事件
            const completeHandler = () => {
                console.log('[CanvasInit] 初始化完成，激活图层监听器');
                addCanvasLayerListeners(fabricCanvas);
                document.removeEventListener('canvasInitializationComplete', completeHandler);
            };
            document.addEventListener('canvasInitializationComplete', completeHandler);
        } else { // 立即添加图层监听器
            console.log('[CanvasInit] 非初始化状态，立即激活图层监听器');
            addCanvasLayerListeners(fabricCanvas);
        }
    } else { // 强制立即添加图层监听器（用于特殊情况）
        console.log('[CanvasInit] 强制激活图层监听器');
        addCanvasLayerListeners(fabricCanvas);
    }

    console.log('Canvas event listeners initialized');
}

// 暴露给全局使用
window.initializeCanvasEventListeners = initializeCanvasEventListeners;
window.setGlobalCanvas = setGlobalCanvas;


// 为当前激活的 canvas 添加事件监听器
function addCanvasEventListeners(fabricCanvas) {
    if (! fabricCanvas) 
        return;
    

    // 用于标记需要在松开鼠标时显示提示的对象
    let needsAlertOnRelease = false;
    let alertTargetObject = null;

    // 监听画布对象修改事件，保存状态
    fabricCanvas.on('object:modified', (e) => {
        updatePreviewCanvas();
        if (! isRestoring) 
            saveState();
        

        // 如果标记了需要显示提示，在松开鼠标时显示
        if (needsAlertOnRelease && alertTargetObject) { // 先取消该元素选中状态
            // fabricCanvas.discardActiveObject();
            // fabricCanvas.renderAll();

            // 显示提示，直接传递当前操作的对象
            showPrintMethodBindingAlert(e.target);

            // 重置标记
            needsAlertOnRelease = false;
            alertTargetObject = null;
        }
    });
    fabricCanvas.on('object:added', () => {
        updatePreviewCanvas();
        if (! isRestoring) 
            saveState();
        
    });
    fabricCanvas.on('object:removed', () => {
        updatePreviewCanvas();
        if (! isRestoring) 
            saveState();
        
    });

    // 监听元素移动事件
    fabricCanvas.on('object:moving', (e) => {
        const obj = e.target;
        if (obj && !isElementInLayerGroup(obj)) {
            // 标记需要在松开鼠标时显示提示
            needsAlertOnRelease = true;
            alertTargetObject = obj;
        } else {
            // 如果元素在图层组中，清除标记
            needsAlertOnRelease = false;
            alertTargetObject = null;
        }
    });
    
    // 监听元素缩放事件
    fabricCanvas.on('object:scaling', (e) => {
        const obj = e.target;
        if (obj && !isElementInLayerGroup(obj)) {
            // 标记需要在松开鼠标时显示提示
            needsAlertOnRelease = true;
            alertTargetObject = obj;
        } else {
            // 如果元素在图层组中，清除标记
            needsAlertOnRelease = false;
            alertTargetObject = null;
        }
    });
    
    // 监听元素旋转事件
    fabricCanvas.on('object:rotating', (e) => {
        const obj = e.target;
        if (obj && !isElementInLayerGroup(obj)) {
            // 标记需要在松开鼠标时显示提示
            needsAlertOnRelease = true;
            alertTargetObject = obj;
        } else {
            // 如果元素在图层组中，清除标记
            needsAlertOnRelease = false;
            alertTargetObject = null;
        }
    });
}

// 检查元素是否在图层组中
function isElementInLayerGroup(obj) {
    // 检查对象是否有图层组信息
    // 这里可以根据实际的图层组实现来调整检查逻辑
    return obj && obj.group !== null && obj.group !== undefined;
}

// 显示绑定印刷方式提示 - 模拟点击Switch Printing Method按钮
function showPrintMethodBindingAlert(targetObject) {
    switchOperationPanelTab("tab-tuan");
    // 点击  layer-item ungrouped active  中的  <button class="assign-btn" title="切换印刷方式"><i class="iconfont icon-dayin"></i>Switch Printing Method </button>
    const assignBtn = document.querySelector('.layer-item.ungrouped.active .assign-btn');
    if (assignBtn) {
        assignBtn.click();
    }    
}

const arcSlider = document.getElementById('arcSlider');
if (arcSlider) {
    arcSlider.addEventListener('input', function () {
        updatePreviewCanvas();
    });
}


// 更新预览画布的函数
function updatePreviewCanvas() {
    const activeCanvas = getActiveCanvas();
    if (! activeCanvas) 
        return;
    

    const designPreviewCanvas = document.getElementById('designPreviewCanvas');
    if (! designPreviewCanvas) 
        return;
    

    const mainCanvas = activeCanvas.toDataURL({format: 'png', quality: 1});

    const img = new Image();
    img.onload = function () {
        const ctx = designPreviewCanvas.getContext('2d');
        ctx.clearRect(0, 0, designPreviewCanvas.width, designPreviewCanvas.height);

        // 计算中间50%的区域
        const sourceX = img.width * 0.25; // 从25%处开始
        const sourceWidth = img.width * 0.5;
        // 截取50%的宽度

        // 从 id="arcSlider" input 获取弧度参数
        const arcSlider = document.getElementById('arcSlider');
        const arc = arcSlider.value;

        // 使用弯曲函数替代普通的drawImage，传入裁剪参数
        drawImageCurvedAndCentered(ctx, img, 0, 0, designPreviewCanvas.width, designPreviewCanvas.height, arc, sourceX, sourceWidth);
    };
    img.src = mainCanvas;
}

// 修改弯曲图像绘制函数，添加裁剪参数
function drawImageCurvedAndCentered(ctx, image, x, y, width, height, arc, sourceX, sourceWidth) {
    const steps = 50;
    const step = width / steps;

    for (let i = 0; i < steps; i++) {
        const sx = sourceX + (i * sourceWidth) / steps;
        const sWidth = sourceWidth / steps;
        const dy = Math.sin((i / steps) * Math.PI) * (arc / 10);

        ctx.drawImage(image, sx, 0, sWidth, image.height, x + i * step, y + dy, step + 1, height);
    }
}


// 为当前激活的 canvas 添加选择事件监听器
function addCanvasSelectionListeners(fabricCanvas) {
    if (! fabricCanvas) 
        return;
    

    // 监听对象选择事件
    fabricCanvas.on('selection:created', function (options) {
        updateDynamicToolbar(options.selected[0]);
    });
    fabricCanvas.on('selection:updated', function (options) {
        updateDynamicToolbar(options.selected[0]);
    });
    fabricCanvas.on('selection:cleared', function () {
        updateDynamicToolbar(null);
    });
}

// 默认颜色
const defaultColor = '#3498db';
let currentColor = defaultColor;

// 检查是否为多视图模式
const canvasStore = window.Pinia && window.useCanvasStore ? window.useCanvasStore() : null;
const isMultiViewMode = canvasStore && canvasStore.views && canvasStore.views.length > 0;
const hasMultiViewContainer = document.querySelector('.multi-view-container') !== null;

if (! isMultiViewMode && ! hasMultiViewContainer) { // 单视图模式：执行传统初始化
    if (typeof window.initCanvasSystem === 'function') {
        window.initCanvasSystem();
    } else if (typeof init === 'function') {
        init();
    }
    // 检查是否存在 boundary canvas 元素再绘制
    if (document.getElementById('boundaryLayer')) {
        drawBoundary();
    }
    // 只有在 canvas 存在时才初始化
    if (canvas) {
        initializeCanvas();
    }
} else { // 多视图模式：初始化将由多视图系统处理
    console.log('多视图模式已激活，跳过传统初始化');
}

// 前进按钮事件
const forwardBtn = document.getElementById('forward');
if (forwardBtn) {
    forwardBtn.addEventListener('click', () => {
        if (historyPointer < history.length - 1) {
            restoreState(historyPointer + 1);

        } else {}
    });
}

// 后退按钮事件
const backwardBtn = document.getElementById('backward');
if (backwardBtn) {
    backwardBtn.addEventListener('click', () => {
        if (historyPointer > 0) {
            restoreState(historyPointer - 1);
            console.log('后退操作，目标历史记录指针：', historyPointer - 1);
        } else {
            console.log('已到达历史记录起点，无法继续后退');
        }
    });
}


// 添加渲染预览按钮的点击事件
document.getElementById('renderBtn').addEventListener('click', async function () { // 检查是否有多视图系统
    if (typeof window.useCanvasStore === 'function') {
        try {
            const store = window.useCanvasStore();
            const views = store.views || [];

            if (views.length > 0) { // 使用统一的多视图预览函数
                await showUniversalViewPreview(views);
                return;
            }
        } catch (error) {
            console.error('Failed to check views:', error);
        }
    }

    // 不满足条件，使用原有的新窗口预览方式
    // 检查是否存在预览容器
    const previewContainer = document.querySelector('.preview-canvas-container');
    // 根据是否存在预览容器选择不同的捕获函数
    const imageData = await(previewContainer ? capturePreviewCanvas() : captureCanvas());
    // 创建一个新窗口并写入HTML内容
    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(`
     <html>
       <head>
         <title>预览效果</title>
         <style>
           body {
             margin: 0;
             display: flex;
             justify-content: center;
             align-items: center;
             min-height: 100vh;
             background: #f0f0f0;
           }
           img {
             max-width: 100%;
             max-height: 90vh;
             box-shadow: 0 0 20px rgba(0,0,0,0.1);
           }
         </style>
       </head>
       <body>
         <img src="${imageData}" alt="预览效果">
       </body>
     </html>
   `);
    previewWindow.document.close();
});
// 修改文本工具栏事件监听器，添加实时更新
document.addEventListener('DOMContentLoaded', function () { // 监听动态工具栏中的文本属性变化
    document.body.addEventListener('change', function (e) {
        if (e.target.id === 'fontFamily' || e.target.id === 'fontSize') {
            setTimeout(() => updateModelFromCanvas(), 100);
        }
    });
    document.body.addEventListener('input', function (e) {
        if (e.target.id === 'textColor') {
            setTimeout(() => updateModelFromCanvas(), 100);
        }
    });
});

// 有 id=model3dContainer 才初始化
if (document.getElementById('model3dContainer')) { // 页面加载完成后初始化3D模型
    document.addEventListener('DOMContentLoaded', function () { // 加载Font Awesome图标
        const fontAwesome = document.createElement('link');
        fontAwesome.rel = 'stylesheet';
        fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
        document.head.appendChild(fontAwesome);
        // 加载Sortable.js
        const sortableScript = document.createElement('script');
        sortableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.14.0/Sortable.min.js';
        sortableScript.onload = initSortable;
        document.body.appendChild(sortableScript);


        init3DModel();


        // 添加一个短暂延迟后强制触发窗口大小调整事件，以确保3D渲染器正确初始化
        setTimeout(function () {
            window.dispatchEvent(new Event('resize'));
        }, 500);
    });
}


// 为当前激活的 canvas 添加3D模型更新事件监听器
function addCanvas3DModelListeners(fabricCanvas) {
    if (! fabricCanvas) 
        return;
    

    // 添加Canvas事件监听，以便在修改时更新3D模型纹理
    // 对象修改事件
    fabricCanvas.on('object:modified', function () {
        updateModelFromCanvas();
    });
    // 对象添加事件
    fabricCanvas.on('object:added', function () {
        updateModelFromCanvas();
    });
    // 对象移除事件
    fabricCanvas.on('object:removed', function () {
        updateModelFromCanvas();
    });
    // 对象移动事件
    fabricCanvas.on('object:moving', function () {
        updateModelFromCanvas();
    });
    // 对象缩放事件
    fabricCanvas.on('object:scaling', function () {
        updateModelFromCanvas();
    });
    // 对象旋转事件
    fabricCanvas.on('object:rotating', function () {
        updateModelFromCanvas();
    });
}

// 为当前激活的 canvas 添加图层管理事件监听器
function addCanvasLayerListeners(fabricCanvas) {
    if (! fabricCanvas) 
        return;
    

    // 监听对象添加事件 - 同步到图层管理系统
    fabricCanvas.on('object:added', function (e) {
        const obj = e.target;

        // 确保对象有 ID
        if (! obj.id) {
            obj.id = `layer_${
                Date.now()
            }_${
                Math.random().toString(36).substr(2, 9)
            }`;
            console.log('Assigned ID to object:', obj.id);
        }

        // 同步到新的 Pinia store 系统
        syncCanvasObjectToStore(obj, 'added');
    });

    // 监听对象移除事件 - 同步到图层管理系统
    fabricCanvas.on('object:removed', function (e) {
        const obj = e.target;

        // 同步到新的 Pinia store 系统
        syncCanvasObjectToStore(obj, 'removed');
    });

    // 监听选择事件，更新图层面板中的选中状态
    fabricCanvas.on('selection:created', function (e) { // 同步选中状态到 Pinia store
        if (e.selected && e.selected.length > 0 && e.selected[0].id) {
            syncSelectionToStore(e.selected[0].id);
        }
    });

    fabricCanvas.on('selection:updated', function (e) { // 同步选中状态到 Pinia store
        if (e.selected && e.selected.length > 0 && e.selected[0].id) {
            syncSelectionToStore(e.selected[0].id);
        }
    });

    fabricCanvas.on('selection:cleared', function () { // 清除 Pinia store 中的选中状态
        syncSelectionToStore(null);
    });

    // 监听对象修改事件（用于更新缩略图）
    fabricCanvas.on('object:modified', function (e) {
        const obj = e.target;
        if (obj && obj.id) { // 触发缩略图刷新
            setTimeout(() => {
                const refreshEvent = new CustomEvent('layerThumbnailRefresh', {
                    detail: {
                        layerId: obj.id
                    }
                });
                document.dispatchEvent(refreshEvent);
            }, 100);
        }
    });
}

// 同步画布对象到 Pinia store 的函数
function syncCanvasObjectToStore(obj, action) {
    // ===== 核心修复：添加初始化状态检查 =====
    // 检查是否处于初始化状态，如果是则跳过同步
    if (CanvasInitializationState.isInitializing) {
        console.log('[LayerSync] 跳过初始化阶段的图层同步:', obj.id || 'unknown');
        return;
    }

    // 检查对象是否来自用户操作
    if (! isUserInitiatedAction(obj)) {
        console.log('[LayerSync] 跳过非用户操作的对象:', obj.id || 'unknown');
        return;
    }

    if (typeof window.useCanvasStore === 'function') {
        try {
            const store = window.useCanvasStore();
            const currentViewId = store.activeViewId;

            if (! currentViewId) {
                console.warn('No active view, cannot sync layer');
                return;
            }

            console.log(`[LayerSync] 同步用户操作的图层: ${
                obj.id
            }, 动作: ${action}, 视图: ${currentViewId}`);

            if (action === 'added' && obj.id) { // 检查当前视图的图层是否已存在（避免重复添加）
                const currentViewLayers = store.getViewLayers(currentViewId);
                const existingLayer = currentViewLayers.find(layer => layer.id === obj.id);
                if (! existingLayer) {
                    const layerName = getLayerName(obj);
                    const layerType = getLayerType(obj);

                    const newLayer = {
                        id: obj.id,
                        name: layerName,
                        type: layerType,
                        visible: obj.visible !== false,
                        locked: ! obj.selectable,
                        groupId: obj.groupId || null,
                        groupOrder: obj.groupOrder || 0
                    };

                    // 添加图层到当前视图
                    store.addLayerToView(currentViewId, newLayer);
                    console.log('[LayerSync] 图层已成功添加到视图:', newLayer);
                } else {
                    console.log('[LayerSync] 图层已存在，跳过添加:', obj.id);
                }
            } else if (action === 'removed' && obj.id) { // 从当前视图中移除图层
                store.removeLayerFromView(currentViewId, obj.id);

                // 如果删除的是当前选中的图层，清除选中状态
                if (store.activeObjectId === obj.id) {
                    store.setActiveObjectId(null);
                }
                console.log('[LayerSync] 图层已从视图中移除:', obj.id);
            }
        } catch (error) {
            console.error('Failed to sync canvas object to layer management system:', error);
        }
    }
}

// 同步选中状态到 Pinia store
function syncSelectionToStore(objectId) {
    if (typeof window.useCanvasStore === 'function') {
        try {
            const store = window.useCanvasStore();
            store.setActiveObjectId(objectId);

            // ===== 核心修复：同步选中状态到.dongtai-area按钮组显示 =====
            updateDongtaiAreaButtons(objectId);

            // 控制蒙版画布的显示/隐藏
            controlMaskCanvasFromMain(objectId);

            // 控制 mainWrapper 的显示范围
            controlMainWrapperDisplayArea(objectId);

        } catch (error) {
            console.error('Failed to sync selection state:', error);
        }
    }
}

// 新增：更新.dongtai-area按钮组显示
function updateDongtaiAreaButtons(objectId) {
    const dongtaiArea = document.querySelector('.dongtai-area');
    if (! dongtaiArea) 
        return;
    

    const canvas = getActiveCanvas();
    if (! canvas || ! objectId) {
        dongtaiArea.style.display = 'none';
        return;
    }

    const selectedObject = canvas.getObjects().find(obj => obj.id === objectId);
    if (selectedObject) {
        dongtaiArea.style.display = 'block';

        // 根据对象类型显示对应的按钮组
        showRelevantButtonGroup(selectedObject);

        console.log('[SelectionSync] 已更新.dongtai-area按钮组显示:', objectId);
    } else {
        dongtaiArea.style.display = 'none';
    }
}

// 新增：根据对象类型显示相关按钮组
function showRelevantButtonGroup(selectedObject) {
    if (! selectedObject) 
        return;
    

    // 隐藏所有工具栏
    const textToolbar = document.querySelector('.text_toolbar');
    const imgToolbar = document.querySelector('.img_toolbar');

    if (textToolbar) 
        textToolbar.style.display = 'none';
    
    if (imgToolbar) 
        imgToolbar.style.display = 'none';
    

    // 根据对象类型显示对应工具栏
    if (selectedObject.type === 'text' || selectedObject.type === 'i-text') {
        if (textToolbar) {
            textToolbar.style.display = 'block';
            console.log('[SelectionSync] 显示文字工具栏');
        }
    } else if (selectedObject.type === 'image') {
        if (imgToolbar) {
            imgToolbar.style.display = 'block';
            console.log('[SelectionSync] 显示图片工具栏');
        }
    }

    // 触发动态工具栏更新（如果存在）
    if (typeof window.updateDynamicToolbar === 'function') {
        window.updateDynamicToolbar(selectedObject);
    }
}

// 暴露新增的函数到全局作用域
window.updateDongtaiAreaButtons = updateDongtaiAreaButtons;
window.showRelevantButtonGroup = showRelevantButtonGroup;

// 从主画布控制蒙版画布的显示/隐藏
function controlMaskCanvasFromMain(objectId) {
    const store = window.useCanvasStore();
    if (! store || ! store.activeViewId) 
        return;
    

    const currentViewId = store.activeViewId;
    const maskWrapper = document.getElementById(`maskWrapper-${currentViewId}`);
    if (! maskWrapper) 
        return;
    

    // 检查选中的对象是否属于分组
    let isGrouped = false;
    if (objectId) {
        const currentViewLayers = store.getViewLayers(currentViewId);
        const layer = currentViewLayers.find(l => l.id === objectId);
        isGrouped = layer && layer.groupId;
    }

    // 显示或隐藏蒙版画布
    maskWrapper.style.display = isGrouped ? 'block' : 'none';
    console.log(`[MaskCanvas] ${
        isGrouped ? '显示' : '隐藏'
    }蒙版画布, 对象ID: ${objectId}, 分组状态: ${isGrouped}`);
}

// 控制 mainWrapper 的显示范围
function controlMainWrapperDisplayArea(objectId) {
    const store = window.useCanvasStore();
    if (!store || !store.activeViewId) 
        return;
    
    const currentViewId = store.activeViewId;
    const mainCanvas = window.CanvasManager?.getCanvas(currentViewId);
    if (!mainCanvas) 
        return;
    
    // 如果没有选中任何元素，使用mask图层的中心矩形区域进行裁剪
    if (!objectId) {
        // 获取当前视图的mask画布
        const maskCanvasElement = document.getElementById(`maskCanvas-${currentViewId}`);
        if (!maskCanvasElement || !maskCanvasElement.__fabricCanvas) {
            console.warn(`[MainWrapper] 未找到mask画布: maskCanvas-${currentViewId}`);
            return;
        }
        
        const maskCanvas = maskCanvasElement.__fabricCanvas;
        const maskObjects = maskCanvas.getObjects();
        
        // 查找名为 'printAreaMask' 的遮罩对象
        const printAreaMask = maskObjects.find(obj => obj.name === 'printAreaMask');
        if (!printAreaMask) {
            console.warn(`[MainWrapper] 未找到打印区域遮罩对象`);
            return;
        }
        
        // 从mask路径中提取中心矩形区域的坐标
        // mask路径格式: [[M, x, y], [L, x, y], ...]
        const pathData = printAreaMask.path;
        console.log(`[MainWrapper] 原始路径数据:`, pathData);
        
        // 打印每个路径命令的详细信息
        pathData.forEach((cmd, index) => {
            console.log(`[MainWrapper] 路径命令 ${index}:`, cmd);
        });
        
        if (!pathData || pathData.length < 10) {
            console.warn(`[MainWrapper] 无效的mask路径数据`);
            return;
        }
        
        // 解析路径数据，获取中心矩形的坐标
        // 路径结构: 外部矩形 + Z + 内部矩形 + Z
        // 查找第二个M命令（内部矩形的开始）
        let centerRectCoords = null;
        let secondMIndex = -1;
        
        // 找到第二个M命令的索引
        let mCount = 0;
        for (let i = 0; i < pathData.length; i++) {
            if (pathData[i] && pathData[i][0] === 'M') {
                mCount++;
                console.log(`[MainWrapper] 找到第${mCount}个M命令，索引: ${i}, 坐标: [${pathData[i][1]}, ${pathData[i][2]}]`);
                if (mCount === 2) {
                    secondMIndex = i;
                    break;
                }
            }
        }
        
        if (secondMIndex !== -1) {
            // 第二个M命令的坐标 (左上角)
            const x1 = pathData[secondMIndex][1];
            const y1 = pathData[secondMIndex][2];
            
            console.log(`[MainWrapper] 中心矩形起始坐标: (${x1}, ${y1})`);
            
            // 收集第二个M命令后的所有L命令坐标
            let xCoords = [x1];
            let yCoords = [y1];
            
            // 从第二个M命令后开始查找L命令
            for (let i = secondMIndex + 1; i < pathData.length; i++) {
                if (pathData[i] && pathData[i][0] === 'L') {
                    const lx = pathData[i][1];
                    const ly = pathData[i][2];
                    xCoords.push(lx);
                    yCoords.push(ly);
                    console.log(`[MainWrapper] L命令坐标: (${lx}, ${ly})`);
                } else if (pathData[i] && pathData[i][0] === 'Z') {
                    // 遇到Z命令，矩形路径结束
                    console.log(`[MainWrapper] 遇到Z命令，矩形路径结束`);
                    break;
                }
            }
            
            if (xCoords.length >= 2 && yCoords.length >= 2) {
                const minX = Math.min(...xCoords);
                const maxX = Math.max(...xCoords);
                const minY = Math.min(...yCoords);
                const maxY = Math.max(...yCoords);
                
                centerRectCoords = {
                    left: minX,
                    top: minY,
                    width: maxX - minX,
                    height: maxY - minY
                };
                
                console.log(`[MainWrapper] 计算的边界: minX=${minX}, maxX=${maxX}, minY=${minY}, maxY=${maxY}`);
                console.log(`[MainWrapper] 计算的矩形尺寸: width=${centerRectCoords.width}, height=${centerRectCoords.height}`);
            }
        }
        
        if (!centerRectCoords || isNaN(centerRectCoords.width) || isNaN(centerRectCoords.height) || centerRectCoords.width <= 0 || centerRectCoords.height <= 0) {
            console.warn(`[MainWrapper] 无法解析中心矩形坐标或坐标无效:`, centerRectCoords);
            return;
        }
        
        // 创建Fabric.js矩形作为clipPath
        const clipRect = new fabric.Rect({
            left: centerRectCoords.left,
            top: centerRectCoords.top,
            width: centerRectCoords.width,
            height: centerRectCoords.height,
            fill: 'transparent',
            stroke: 'transparent',
            selectable: false,
            evented: false,
            excludeFromExport: true
        });
        
        // 应用clipPath到主画布
        mainCanvas.clipPath = clipRect;
        mainCanvas.renderAll();
        
        console.log(`[MainWrapper] 使用Fabric.js clipPath限制显示范围: ${centerRectCoords.width}x${centerRectCoords.height}px, 位置: (${centerRectCoords.left}, ${centerRectCoords.top})`);
    } else {
        // 有选中元素时，移除clipPath限制
        if (mainCanvas.clipPath) {
            mainCanvas.clipPath = null;
            mainCanvas.renderAll();
        }
        console.log(`[MainWrapper] 移除Fabric.js clipPath限制, 选中对象ID: ${objectId}`);
    }
}

// 暴露蒙版画布控制函数到全局作用域
window.controlMaskCanvasFromMain = controlMaskCanvasFromMain;
// 暴露 mainWrapper 显示范围控制函数到全局作用域
window.controlMainWrapperDisplayArea = controlMainWrapperDisplayArea;

// 获取图层名称的辅助函数
function getLayerName(obj) { // 优先使用对象上设置的 layerName 属性（用于复制等场景）
    if (obj.layerName) {
        return obj.layerName;
    }

    if (obj.type === 'text' || obj.type === 'i-text') {
        const text = obj.text || '';
        return text.length > 15 ? text.substring(0, 15) + '...' : text;
    } else if (obj.type === 'image') {
        return '图片 ' + Date.now().toString().slice(-4);
    } else {
        return '图层 ' + Date.now().toString().slice(-4);
    }
}

// 获取图层类型的辅助函数
function getLayerType(obj) { // 优先使用对象上设置的 layerType 属性（用于复制等场景）
    if (obj.layerType) {
        return obj.layerType;
    }

    if (obj.type === 'text' || obj.type === 'i-text') {
        return 'text';
    } else if (obj.type === 'image') {
        return 'image';
    } else {
        return 'other';
    }
}

// 导出所有视图的画板图片
async function exportAllViewsAsImages() {
    const store = window.useCanvasStore();
    if (! store || ! store.views || store.views.length === 0) {
        console.error('No view data found');
        return;
    }

    const originalActiveViewId = store.activeViewId;
    const exportedImages = [];

    try {
        for (const view of store.views) {
            console.log(`Exporting view: ${
                view.name
            }`);

            // 切换到当前视图
            store.setActiveViewId(view.id);

            // 手动触发视图切换逻辑
            const viewContainer = document.getElementById(`view-container-${
                view.id
            }`);
            if (viewContainer) { // 隐藏所有视图容器
                document.querySelectorAll('.view-container').forEach(container => {
                    container.style.display = 'none';
                });
                // 显示当前视图容器
                viewContainer.style.display = 'block';
            }

            // 使用 CanvasManager 获取当前视图的画布
            if (window.CanvasManager) {
                const canvas = window.CanvasManager.getCanvas(view.id);
                if (canvas) { // 取消所有视图上所有元素的选中状态
                    const allCanvasIds = window.CanvasManager.getAllCanvasIds();
                    allCanvasIds.forEach(canvasId => {
                        const viewCanvas = window.CanvasManager.getCanvas(canvasId);
                        if (viewCanvas && typeof viewCanvas.discardActiveObject === 'function') {
                            viewCanvas.discardActiveObject();
                            viewCanvas.renderAll();
                        }
                    });

                    // 更新全局 canvas 引用
                    if (window.setGlobalCanvas) {
                        window.setGlobalCanvas(canvas);
                    } else {
                        window.canvas = canvas;
                        window.fabricCanvas = canvas;
                    }

                    // 重新渲染 canvas
                    canvas.renderAll();
                }
            }

            // 等待视图切换和渲染完成
            await new Promise(resolve => setTimeout(resolve, 300));

            // 捕获当前视图的画板内容
            const imageDataUrl = await captureCanvas();
            if (imageDataUrl) {
                exportedImages.push({viewName: view.name, imageData: imageDataUrl});
                console.log(`View ${
                    view.name
                } exported successfully`);
            } else {
                console.warn(`View ${
                    view.name
                } export failed`);
            }
        }

        // 在新窗口中展示所有图片
        if (exportedImages.length > 0) {
            const newWindow = window.open('', '_blank');
            let htmlContent = `
                <html>
                    <head>
                        <title>所有视图导出</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; }
                            .view-section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; }
                            .view-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
                            .download-link { display: inline-block; margin-top: 10px; padding: 8px 16px; background: #007cba; color: white; text-decoration: none; border-radius: 4px; }
                            .download-link:hover { background: #005a87; }
                            img { max-width: 100%; height: auto; border: 1px solid #ccc; }
                        </style>
                    </head>
                    <body>
                        <h1>所有视图画板导出</h1>
            `;

            exportedImages.forEach((item, index) => {
                htmlContent += `
                    <div class="view-section">
                        <div class="view-title">${
                    item.viewName
                }</div>
                        <img src="${
                    item.imageData
                }" alt="${
                    item.viewName
                }" />
                        <br>
                        <a href="${
                    item.imageData
                }" download="${
                    item.viewName
                }.png" class="download-link">下载 ${
                    item.viewName
                }</a>
                    </div>
                `;
            });

            htmlContent += `
                    </body>
                </html>
            `;

            newWindow.document.write(htmlContent);
            newWindow.document.close();

            console.log(`Successfully exported ${
                exportedImages.length
            } views`);
        } else {
            console.warn('No views were successfully exported');
        }
    } catch (error) {
        console.error('Error occurred while exporting all views:', error);
    } finally { // 恢复到原始激活视图
        if (originalActiveViewId) {
            console.log(`Restored to original view: ${originalActiveViewId}`);
            store.setActiveViewId(originalActiveViewId);

            // 手动触发视图切换逻辑以恢复显示
            const originalViewContainer = document.getElementById(`view-container-${originalActiveViewId}`);
            if (originalViewContainer) { // 隐藏所有视图容器
                document.querySelectorAll('.view-container').forEach(container => {
                    container.style.display = 'none';
                });
                // 显示原始视图容器
                originalViewContainer.style.display = 'block';
            }

            // 使用 CanvasManager 恢复原始视图的画布
            if (window.CanvasManager) {
                const originalCanvas = window.CanvasManager.getCanvas(originalActiveViewId);
                if (originalCanvas) {
                    window.CanvasManager.setActiveCanvas(originalActiveViewId);

                    if (window.setGlobalCanvas) {
                        window.setGlobalCanvas(originalCanvas);
                    } else {
                        window.canvas = originalCanvas;
                        window.fabricCanvas = originalCanvas;
                    } originalCanvas.renderAll();
                }
            }
        }
    }
}

// 计算弧形文字的每个字符的属性
function calculateArcTextProperties(textObject, arcValue) {
    const originalText = textObject.text;
    const chars = originalText.split('');
    const totalWidth = textObject.width;
    const fontSize = textObject.fontSize;

    const charProperties = [];
    let currentX = 0;
    // 相对于文本对象左边缘的当前X位置

    // 假设每个字符的宽度是大致相等的，这里可以做更精确的测量
    // Fabric.js 的 Text 对象在渲染时会处理字符间距和宽度
    // 这里我们近似计算每个字符的平均宽度
    const avgCharWidth = totalWidth / chars.length;

    chars.forEach((char, index) => { // 字符的中心X位置相对于文本对象的中心
        const charRelativeCenterX = currentX + avgCharWidth / 2 - totalWidth / 2;

        // 归一化字符的X位置到 -0.5 到 0.5 之间
        const normalizedX = charRelativeCenterX / totalWidth;

        // 使用正弦函数计算垂直偏移 (dy)
        // arcValue 控制弯曲程度，除以一个系数来调整幅度
        // 增加幅度，例如乘以一个更大的系数
        const dy = Math.sin((normalizedX + 0.5) * Math.PI) * (arcValue * 0.5);
        // 调整幅度

        // 计算旋转角度 (angle)
        // 角度与正弦曲线的斜率相关，即余弦函数
        // 调整系数以控制角度变化幅度
        const angle = Math.cos((normalizedX + 0.5) * Math.PI) * (arcValue * 0.1); // 调整幅度，角度是度数

        charProperties.push({
            char: char,
            dx: charRelativeCenterX, // 字符相对于文本对象中心的X偏移
            dy: dy,
            angle: angle,
            width: avgCharWidth // 暂时使用平均宽度
        });

        currentX += avgCharWidth;
    });

    return charProperties;
}

// 应用弧形文字扭曲到 Fabric.js 文本对象
function applyArcDistortionToTextObject(textObject, arcValue) {
    if (! textObject || (textObject.type !== 'text' && !(textObject.type === 'group' && textObject._isArcDistorted))) {
        return;
    }

    const originalText = textObject._isArcDistorted ? textObject._originalTextConfig.text : textObject.text;
    const originalOptions = textObject._isArcDistorted ? textObject._originalTextConfig.options : {
        left: textObject.left,
        top: textObject.top,
        fontFamily: textObject.fontFamily,
        fontSize: textObject.fontSize,
        fill: textObject.fill,
        angle: textObject.angle,
        scaleX: textObject.scaleX,
        scaleY: textObject.scaleY,
        originX: textObject.originX,
        originY: textObject.originY,
        width: textObject.width, // 确保原始宽度被保存
        height: textObject.height,
        // 其他需要保存的属性
    };

    // 移除旧的文本对象或组
    canvas.remove(textObject);

    const chars = originalText.split('');
    const charObjects = [];
    let currentXOffset = 0;
    // 累积的字符宽度偏移

    // 使用一个临时的 Fabric.Text 对象来精确测量每个字符的宽度
    const tempMeasurer = new fabric.Text('', {
        fontFamily: originalOptions.fontFamily,
        fontSize: originalOptions.fontSize
    });

    chars.forEach((char, index) => {
        tempMeasurer.set('text', char);
        const charWidth = tempMeasurer.width * originalOptions.scaleX;
        // 考虑原始缩放

        // 调用之前定义的函数计算弧形属性
        // 确保传入 calculateArcTextProperties 的 textObject 包含正确的 width
        const charProps = calculateArcTextProperties({
            text: originalText,
            width: originalOptions.width,
            fontSize: originalOptions.fontSize
        }, arcValue)[index];

        const charObject = new fabric.Text(char, {
            left: originalOptions.left + charProps.dx,
            top: originalOptions.top + charProps.dy,
            angle: originalOptions.angle + charProps.angle,
            fontFamily: originalOptions.fontFamily,
            fontSize: originalOptions.fontSize,
            fill: originalOptions.fill,
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            textBaseline: 'alphabetic', // 明确设置为正确的值
        });
        charObjects.push(charObject);
        currentXOffset += charWidth;
    });

    // 将所有字符对象组合成一个 Fabric.Group
    const arcGroup = new fabric.Group(charObjects, {
        left: originalOptions.left,
        top: originalOptions.top,
        angle: originalOptions.angle,
        selectable: true,
        evented: true,
        _isArcDistorted: true, // 标记为弧形扭曲的组
        _originalTextConfig: {
            text: originalText,
            options: originalOptions
        }, // 保存原始文本配置
        id: textObject.id // 继承原始ID
    });

    canvas.add(arcGroup);
    canvas.setActiveObject(arcGroup);
    canvas.renderAll();
}

/**
 * 统一的多视图预览函数，根据每个视图的 view_flow 属性决定渲染方式
 * @param {Array} views - 视图数组
 */
async function showUniversalViewPreview(views) { // 检查是否已存在预览界面，如果存在则先移除
    const existingModal = document.getElementById('universal-view-preview-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // 创建MicroModal结构的预览界面
    const modalHTML = `
        <div class="modal micromodal-slide" id="universal-view-preview-modal" aria-hidden="true">
            <div class="modal__overlay" tabindex="-1" data-micromodal-close>
                <div class="modal__container modal__container--fullscreen" role="dialog" aria-modal="true" aria-labelledby="universal-view-title">
                    <header class="modal__header">
                        <h2 class="modal__title" id="universal-view-title">多视图预览</h2>
                        <button class="modal__close" aria-label="Close modal" data-micromodal-close></button>
                    </header>
                    <main class="modal__content modal__content--scrollable">
                        <div class="preview-body">
                             <div class="thumbnail-list">
                                 <div class="loading">正在加载视图...</div>
                             </div>
                             <div class="main-preview">
                                 <div class="preview-placeholder">请选择左侧视图查看预览</div>
                             </div>
                         </div>
                    </main>
                </div>
            </div>
        </div>
    `;

    // 添加样式（复用原有样式，但修改ID）
    const style = document.createElement('style');
    style.textContent = `
        /* 统一多视图预览样式 */
        #universal-view-preview-modal {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 99999 !important;
            display: none;
        }
        
        #universal-view-preview-modal.is-open {
            display: flex !important;
        }
        
        #universal-view-preview-modal .modal__overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background: rgba(0, 0, 0, 0.8) !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            z-index: 99999 !important;
            width: 100% !important;
            height: 100% !important;
        }
        
        #universal-view-preview-modal .modal__container {
            background-color: white !important;
            padding: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            width: 100vw !important;
            height: 100vh !important;
            max-width: none !important;
            max-height: none !important;
            overflow: hidden !important;
            position: relative !important;
            z-index: 100000 !important;
        }
        
        .modal__container--fullscreen {
            width: 100vw !important;
            height: 100vh !important;
            max-width: none !important;
            max-height: none !important;
            margin: 0 !important;
            border-radius: 0 !important;
            display: flex;
            flex-direction: column;
        }
        
        .modal__content--scrollable {
            flex: 1;
            overflow-y: auto;
            padding: 0;
        }
        
        .modal__header {
            padding: 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f8f9fa;
            flex-shrink: 0;
        }
        
        .modal__title {
            margin: 0;
            color: #333;
            font-size: 18px;
        }
        
        .modal__close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
        }
        
        .modal__close:hover {
            background: #e9ecef;
            color: #333;
        }
        
        .modal__close::before {
            content: '×';
        }
        
        .preview-body {
            display: flex;
            height: 100%;
            min-height: calc(100vh - 80px);
        }
        
        .thumbnail-list {
            width: 50%;
            background: #f8f9fa;
            border-right: 1px solid #eee;
            overflow-y: auto;
            padding: 20px;
            flex-shrink: 0;
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            align-content: flex-start;
        }
        
        .thumbnail-item {
            width: calc(24% - 12px);
            cursor: pointer;
            border: 2px solid transparent;
            border-radius: 8px;
            overflow: hidden;
            transition: all 0.3s ease;
            flex-shrink: 0;
        }
        
        .thumbnail-item:hover {
            border-color: #007bff;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
        }
        
        .thumbnail-item.active {
            border-color: #007bff;
            box-shadow: 0 0 0 1px #007bff;
        }
        
        .thumbnail-item img {
            width: 100%;
            height: auto;
            display: block;
        }
        
        .thumbnail-label {
            padding: 10px;
            background: white;
            text-align: center;
            font-size: 14px;
            color: #333;
            border-top: 1px solid #eee;
        }
        
        .main-preview {
            width: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff;
            overflow: auto;
            height: 100%;
        }
        
        .main-preview img {
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        
        .preview-placeholder {
            color: #666;
            font-size: 16px;
            text-align: center;
        }
        
        .loading {
            text-align: center;
            color: #666;
            padding: 20px;
        }
        
        /* 响应式设计 */
        @media (max-width: 768px) {
            .preview-body {
                flex-direction: column;
            }
            
            .thumbnail-list {
                width: 100%;
                max-height: 200px;
                border-right: none;
                border-bottom: 1px solid #eee;
                gap: 8px;
            }
            
            .thumbnail-item {
                width: calc(25% - 6px);
            }
            
            .main-preview {
                width: 100%;
                height: calc(100% - 200px);
            }
        }
    `;

    document.head.appendChild(style);
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // 等待DOM插入完成
    setTimeout(() => {
        const modal = document.getElementById('universal-view-preview-modal');
        if (! modal) {
            console.error('Universal modal element not found');
            return;
        }

        // 确保MicroModal已加载并初始化
        if (typeof MicroModal !== 'undefined') {
            try {
                MicroModal.init({disableScroll: true, disableFocus: false, awaitCloseAnimation: false, debugMode: false});
            } catch (e) { // 可能已经初始化过了，忽略错误
            }

            try {
                MicroModal.show('universal-view-preview-modal');
            } catch (e) {
                console.warn('MicroModal show failed, using fallback:', e);
                modal.style.display = 'flex';
                modal.classList.add('is-open');
            }
        } else {
            console.error('MicroModal not loaded, using fallback');
            modal.style.display = 'flex';
            modal.classList.add('is-open');
        }
    }, 10);

    // 生成所有视图的预览图片
    const viewImages = await generateUniversalViewImages(views);

    // 生成缩略图列表
    const thumbnailList = document.querySelector('#universal-view-preview-modal .thumbnail-list');
    const mainPreview = document.querySelector('#universal-view-preview-modal .main-preview');

    thumbnailList.innerHTML = '';

    viewImages.forEach((imageData, index) => {
        const view = views[index];
        const isGridView = view.view_flow === '4-Grid Flow';

        if (isGridView && Array.isArray(imageData)) { // 4格图视图：为每张图片创建独立的缩略图
            const gridLabels = ['前视图', '左视图', '右视图', '后视图'];
            imageData.forEach((gridImageData, gridIndex) => {
                const thumbnailItem = document.createElement('div');
                thumbnailItem.className = `thumbnail-item ${
                    thumbnailList.children.length === 0 ? 'active' : ''
                }`;
                thumbnailItem.innerHTML = `
                    <img src="${gridImageData}" alt="${
                    view.name || `视图 ${
                        index + 1
                    }`
                } - ${
                    gridLabels[gridIndex]
                }" />
                    <div class="thumbnail-label">${
                    view.name || `视图 ${
                        index + 1
                    }`
                } - ${
                    gridLabels[gridIndex]
                }</div>
                `;

                // 点击缩略图更新大图
                thumbnailItem.addEventListener('click', () => { // 移除其他缩略图的active状态
                    thumbnailList.querySelectorAll('.thumbnail-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    // 添加当前缩略图的active状态
                    thumbnailItem.classList.add('active');
                    // 显示单张大图
                    mainPreview.innerHTML = `<img src="${gridImageData}" alt="${
                        view.name || `视图 ${
                            index + 1
                        }`
                    } - ${
                        gridLabels[gridIndex]
                    }">`;
                });

                thumbnailList.appendChild(thumbnailItem);
            });
        } else { // 普通视图：创建单个缩略图
            const thumbnailItem = document.createElement('div');
            thumbnailItem.className = `thumbnail-item ${
                thumbnailList.children.length === 0 ? 'active' : ''
            }`;
            thumbnailItem.innerHTML = `
                <img src="${imageData}" alt="${
                view.name || `视图 ${
                    index + 1
                }`
            }" />
                <div class="thumbnail-label">${
                view.name || `视图 ${
                    index + 1
                }`
            }</div>
            `;

            // 点击缩略图更新大图
            thumbnailItem.addEventListener('click', () => { // 移除其他缩略图的active状态
                thumbnailList.querySelectorAll('.thumbnail-item').forEach(item => {
                    item.classList.remove('active');
                });
                // 添加当前缩略图的active状态
                thumbnailItem.classList.add('active');
                // 显示普通预览
                mainPreview.innerHTML = `<img src="${imageData}" alt="${
                    view.name || `视图 ${
                        index + 1
                    }`
                }">`;
            });

            thumbnailList.appendChild(thumbnailItem);
        }
    });

    // 设置默认大图（第一个缩略图）
    if (viewImages.length > 0) {
        const firstView = views[0];
        const firstImageData = viewImages[0];

        if (firstView.view_flow === '4-Grid Flow' && Array.isArray(firstImageData)) { // 显示4格图的第一张（前视图）
            mainPreview.innerHTML = `<img src="${
                firstImageData[0]
            }" alt="${
                firstView.name || '视图 1'
            } - 前视图">`;
        } else { // 显示普通视图
            mainPreview.innerHTML = `<img src="${firstImageData}" alt="${
                firstView.name || '视图 1'
            }">`;
        }
    }
}

/**
 * 捕获所有视图的Canvas截图（应用多层合成和遮罩效果）
 * @param {Array} views - 视图数组
 * @returns {Promise<Array>} 图片数据数组
 */
async function captureAllViewsImages(views) {
    const images = [];

    for (const view of views) {
        try { // 获取所有Canvas图层元素
            const baseCanvasElement = document.getElementById(`baseCanvas-${
                view.id
            }`);
            const mainCanvasElement = document.getElementById(`mainCanvas-${
                view.id
            }`);
            const overlayCanvasElement = document.getElementById(`overlayCanvas-${
                view.id
            }`);
            const maskCanvasElement = document.getElementById(`maskCanvas-${
                view.id
            }`);

            if (mainCanvasElement && window.CanvasManager) {
                const fabricCanvas = window.CanvasManager.getCanvas(view.id);
                if (fabricCanvas) { // 强制渲染主Canvas
                    fabricCanvas.renderAll();

                    // 捕获多层Canvas内容（应用遮罩效果）
                    const imageData = await captureMultiLayerCanvasWithMask({
                        baseCanvas: baseCanvasElement,
                        mainCanvas: mainCanvasElement,
                        overlayCanvas: overlayCanvasElement,
                        maskCanvas: maskCanvasElement,
                        fabricCanvas: fabricCanvas
                    }, view);
                    images.push(imageData);
                } else {
                    console.warn(`Canvas not found for view: ${
                        view.id
                    }`);
                    // 添加占位图
                    images.push('data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">无法加载视图</text></svg>'));
                }
            } else {
                console.warn(`Canvas element not found: mainCanvas-${
                    view.id
                }`);
                // 添加占位图
                images.push('data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">视图不存在</text></svg>'));
            }
        } catch (error) {
            console.error(`Failed to capture view ${
                view.id
            }:`, error);
            // 添加错误占位图
            images.push('data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">截图失败</text></svg>'));
        }
    }

    return images;
}

/**
 * 根据Fabric Canvas实例捕获截图（应用遮罩效果）
 * @param {fabric.Canvas} fabricCanvas - Fabric Canvas实例
 * @param {Object} view - 视图对象
 * @returns {Promise<string>} 图片数据URL
 */

/**
 * 为PDF生成捕获单个视图的多层Canvas内容
 * @param {string} viewId - 视图ID
 * @returns {Promise<string>} - 返回图片的base64数据
 */
async function captureViewForPDF(viewId) {
    try { // 获取指定视图的所有Canvas图层
        const baseCanvas = document.getElementById(`baseCanvas-${viewId}`);
        const mainCanvas = document.getElementById(`mainCanvas-${viewId}`);
        const overlayCanvas = document.getElementById(`overlayCanvas-${viewId}`);
        const maskCanvas = document.getElementById(`maskCanvas-${viewId}`);
        const fabricCanvas = window.CanvasManager ? window.CanvasManager.getCanvas(viewId) : null;

        const canvasLayers = {
            baseCanvas: baseCanvas,
            mainCanvas: mainCanvas,
            overlayCanvas: overlayCanvas,
            maskCanvas: maskCanvas,
            fabricCanvas: fabricCanvas
        };

        // 创建一个临时视图对象
        const view = {
            id: viewId,
            name: `View ${viewId}`
        };

        // 使用多层Canvas合成逻辑
        return await captureMultiLayerCanvasWithMask(canvasLayers, view);
    } catch (error) {
        console.error('PDF视图捕获失败:', error);
        return null;
    }
}

/**
 * 捕获多层Canvas并应用遮罩效果
 * @param {Object} canvasLayers - 包含所有Canvas图层的对象
 * @param {Object} view - 视图对象
 * @returns {Promise<string>} 图片数据URL
 */
function captureMultiLayerCanvasWithMask(canvasLayers, view) {
    return new Promise((resolve) => {
        try {
            const {
                baseCanvas,
                mainCanvas,
                overlayCanvas,
                maskCanvas,
                fabricCanvas
            } = canvasLayers;

            // 获取打印区域尺寸
            let printAreaWidth = 100; // 默认值
            let printAreaHeight = 120;
            // 默认值

            // 从 Pinia printMethod store 获取打印区域尺寸
            if (window.usePrintMethodStore) {
                const printMethodStore = window.usePrintMethodStore();
                const currentMethods = printMethodStore.currentViewPrintMethods;

                if (currentMethods && currentMethods.length > 0) {
                    const firstMethod = currentMethods[0];
                    if (firstMethod.print_method_area_width && firstMethod.print_method_area_height) { // 将尺寸乘以50转换为像素
                        printAreaWidth = firstMethod.print_method_area_width * 50;
                        printAreaHeight = firstMethod.print_method_area_height * 50;
                    }
                }
            }

            // 创建最终合成画布
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = fabricCanvas.width;
            finalCanvas.height = fabricCanvas.height;
            const finalCtx = finalCanvas.getContext('2d');

            // 绘制白色背景
            finalCtx.fillStyle = '#FFFFFF';
            finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

            let loadedImages = 0;
            const totalImages = 4; // baseCanvas, mainCanvas, overlayCanvas, maskCanvas
            const imagePromises = [];

            // 处理每个图层
            const processLayer = (canvasElement, layerName) => {
                return new Promise((layerResolve) => {
                    if (!canvasElement) {
                        layerResolve(null);
                        return;
                    }

                    if (layerName === 'mainCanvas') { // 主Canvas使用fabric.js的toDataURL
                        const dataURL = fabricCanvas.toDataURL({format: 'png', quality: 1, multiplier: 1});
                        const img = new Image();
                        img.onload = () => layerResolve({img, layerName});
                        img.onerror = () => layerResolve(null);
                        img.src = dataURL;
                    } else if (layerName === 'baseCanvas') {
                        // 对于 baseCanvas，需要根据当前的着色方式决定是否应用额外的纯色覆盖
                        try {
                            const dataURL = canvasElement.toDataURL('image/png');
                            const img = new Image();
                            img.onload = () => {
                                const explicitColor = getExplicitSelectedColor();

                                const fabricCanvas = canvasElement.__fabricCanvas || canvasElement.fabric || canvasElement.__canvas || null;
                                let hasGradientOverlay = false;
                                let hasTintFilter = false;

                                if (fabricCanvas && typeof fabricCanvas.getObjects === 'function') {
                                    const objects = fabricCanvas.getObjects();
                                    hasGradientOverlay = objects.some(obj => obj && ((obj.name && obj.name === 'Base Gradient Overlay') || (obj.id && typeof obj.id === 'string' && obj.id.startsWith('gradient-rect-'))));

                                    const baseLayerObject = objects.find(obj => obj && obj.name === 'Base Layer');
                                    if (baseLayerObject && Array.isArray(baseLayerObject.filters)) {
                                        hasTintFilter = baseLayerObject.filters.some(filter => !!filter);
                                    }
                                }

                                const shouldApplyFlatColor = explicitColor && !hasGradientOverlay && !hasTintFilter;

                                console.log('captureMultiLayerCanvasWithMask - baseCanvas 着色检测:', {
                                    explicitColor,
                                    hasGradientOverlay,
                                    hasTintFilter,
                                    shouldApplyFlatColor
                                });

                                if (shouldApplyFlatColor) {
                                    // 仅在画布尚未通过滤镜或渐变着色时，才应用纯色覆盖
                                    const tempCanvas = document.createElement('canvas');
                                    tempCanvas.width = canvasElement.width;
                                    tempCanvas.height = canvasElement.height;
                                    const tempCtx = tempCanvas.getContext('2d');

                                    tempCtx.drawImage(img, 0, 0);
                                    tempCtx.globalCompositeOperation = 'source-in';
                                    tempCtx.fillStyle = explicitColor;
                                    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                                    tempCtx.globalCompositeOperation = 'source-over';

                                    const coloredImg = new Image();
                                    coloredImg.onload = () => layerResolve({img: coloredImg, layerName});
                                    coloredImg.onerror = () => layerResolve({img, layerName});
                                    coloredImg.src = tempCanvas.toDataURL('image/png');
                                } else {
                                    layerResolve({img, layerName});
                                }
                            };
                            img.onerror = () => layerResolve(null);
                            img.src = dataURL;
                        } catch (error) {
                            console.warn(`Failed to capture ${layerName}:`, error);
                            layerResolve(null);
                        }
                    } else { // 其他Canvas直接使用toDataURL
                        try {
                            const dataURL = canvasElement.toDataURL('image/png');
                            const img = new Image();
                            img.onload = () => layerResolve({img, layerName});
                            img.onerror = () => layerResolve(null);
                            img.src = dataURL;
                        } catch (error) {
                            console.warn(`Failed to capture ${layerName}:`, error);
                            layerResolve(null);
                        }
                    }
                });
            };

            // 创建所有图层的Promise
            imagePromises.push(processLayer(baseCanvas, 'baseCanvas'));
            imagePromises.push(processLayer(mainCanvas, 'mainCanvas'));
            imagePromises.push(processLayer(overlayCanvas, 'overlayCanvas'));
            imagePromises.push(processLayer(maskCanvas, 'maskCanvas'));

            Promise.all(imagePromises).then((results) => {
                const layers = {};
                results.forEach(result => {
                    if (result) {
                        layers[result.layerName] = result.img;
                    }
                });

                // 按z-index顺序合成图层
                // 1. 绘制baseCanvas (z-index: 10)
                if (layers.baseCanvas) {
                    finalCtx.drawImage(layers.baseCanvas, 0, 0);
                }

                // 2. 处理mainCanvas和maskCanvas的遮罩效果 (z-index: 20)
                if (layers.mainCanvas && layers.maskCanvas) { // 创建临时画布用于遮罩处理
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = finalCanvas.width;
                    tempCanvas.height = finalCanvas.height;
                    const tempCtx = tempCanvas.getContext('2d');

                    // 先绘制mainCanvas内容
                    tempCtx.drawImage(layers.mainCanvas, 0, 0);

                    // 检查maskCanvas的内容
                    const maskImageData = tempCtx.createImageData(tempCanvas.width, tempCanvas.height);
                    const maskTempCanvas = document.createElement('canvas');
                    maskTempCanvas.width = tempCanvas.width;
                    maskTempCanvas.height = tempCanvas.height;
                    const maskTempCtx = maskTempCanvas.getContext('2d');
                    maskTempCtx.drawImage(layers.maskCanvas, 0, 0);
                    const maskData = maskTempCtx.getImageData(0, 0, maskTempCanvas.width, maskTempCanvas.height);

                    // 检查maskCanvas是否有非透明像素
                    let hasContent = false;
                    for (let i = 3; i < maskData.data.length; i += 4) {
                        if (maskData.data[i] > 0) {
                            hasContent = true;
                            break;
                        }
                    }

                    if (hasContent) { // 检查maskCanvas的像素数据以确定处理方式
                        const debugMaskCanvas = document.createElement('canvas');
                        debugMaskCanvas.width = layers.maskCanvas.width;
                        debugMaskCanvas.height = layers.maskCanvas.height;
                        const debugMaskCtx = debugMaskCanvas.getContext('2d');
                        debugMaskCtx.drawImage(layers.maskCanvas, 0, 0);
                        const debugMaskData = debugMaskCtx.getImageData(0, 0, debugMaskCanvas.width, debugMaskCanvas.height);

                        // 统计不同类型的像素
                        let opaquePixels = 0;
                        let semiTransparentPixels = 0;

                        for (let i = 3; i < debugMaskData.data.length; i += 4) {
                            const alpha = debugMaskData.data[i];
                            if (alpha === 255) {
                                opaquePixels++;
                            } else if (alpha > 0) {
                                semiTransparentPixels++;
                            }
                        }

                        // 处理半透明像素的遮罩
                        if (opaquePixels > 0 || semiTransparentPixels > 0) { // 创建二值化遮罩：将半透明像素转换为完全不透明
                            const binaryMaskCanvas = document.createElement('canvas');
                            binaryMaskCanvas.width = layers.maskCanvas.width;
                            binaryMaskCanvas.height = layers.maskCanvas.height;
                            const binaryMaskCtx = binaryMaskCanvas.getContext('2d');

                            // 绘制原遮罩
                            binaryMaskCtx.drawImage(layers.maskCanvas, 0, 0);

                            // 获取像素数据并二值化
                            const binaryImageData = binaryMaskCtx.getImageData(0, 0, binaryMaskCanvas.width, binaryMaskCanvas.height);
                            for (let i = 3; i < binaryImageData.data.length; i += 4) { // 将任何非透明像素设为完全不透明
                                if (binaryImageData.data[i] > 0) {
                                    binaryImageData.data[i] = 255;
                                }
                            }
                            binaryMaskCtx.putImageData(binaryImageData, 0, 0);

                            // 应用二值化后的遮罩
                            tempCtx.globalCompositeOperation = 'destination-out';
                            tempCtx.drawImage(binaryMaskCanvas, 0, 0);
                        }
                    }

                    // 将处理后的mainCanvas绘制到最终画布
                    finalCtx.drawImage(tempCanvas, 0, 0);
                } else if (layers.mainCanvas) {
                    console.log('没有遮罩，直接绘制mainCanvas');
                    // 如果没有遮罩，直接绘制mainCanvas
                    finalCtx.drawImage(layers.mainCanvas, 0, 0);
                } else {
                    console.log('mainCanvas不存在');
                }

                // 3. 绘制overlayCanvas (z-index: 30)
                if (layers.overlayCanvas) {
                    finalCtx.drawImage(layers.overlayCanvas, 0, 0);
                }

                // 返回完整画布大小（不裁剪到打印区域）
                resolve(finalCanvas.toDataURL('image/png'));

                // 注释：如果需要裁剪到打印区域，可以使用以下代码
                // const cutoutX = (finalCanvas.width - printAreaWidth) / 2;
                // const cutoutY = (finalCanvas.height - printAreaHeight) / 2;
                // const croppedCanvas = document.createElement('canvas');
                // croppedCanvas.width = printAreaWidth;
                // croppedCanvas.height = printAreaHeight;
                // const croppedCtx = croppedCanvas.getContext('2d');
                // croppedCtx.fillStyle = '#FFFFFF';
                // croppedCtx.fillRect(0, 0, printAreaWidth, printAreaHeight);
                // croppedCtx.drawImage(finalCanvas, cutoutX, cutoutY, printAreaWidth, printAreaHeight, 0, 0, printAreaWidth, printAreaHeight);
                // resolve(croppedCanvas.toDataURL('image/png'));
            }).catch((error) => {
                console.error('Error processing canvas layers:', error);
                resolve('data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">图层合成失败</text></svg>'));
            });

        } catch (error) {
            console.error('Error capturing multi-layer canvas:', error);
            resolve('data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">截图异常</text></svg>'));
        }
    });
}

function captureCanvasWithMask(fabricCanvas, view) {
    return new Promise((resolve) => {
        try { // 强制渲染
            fabricCanvas.renderAll();

            // 获取打印区域尺寸
            let printAreaWidth = 100; // 默认值
            let printAreaHeight = 120;
            // 默认值

            // 从 Pinia printMethod store 获取打印区域尺寸
            if (window.usePrintMethodStore) {
                const printMethodStore = window.usePrintMethodStore();
                const currentMethods = printMethodStore.currentViewPrintMethods;

                if (currentMethods && currentMethods.length > 0) {
                    const firstMethod = currentMethods[0];
                    if (firstMethod.print_method_area_width && firstMethod.print_method_area_height) { // 将尺寸乘以50转换为像素
                        printAreaWidth = firstMethod.print_method_area_width * 50;
                        printAreaHeight = firstMethod.print_method_area_height * 50;
                    }
                }
            }

            // 创建临时画布
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = fabricCanvas.width;
            tempCanvas.height = fabricCanvas.height;
            const tempCtx = tempCanvas.getContext('2d');

            // 绘制白色背景
            tempCtx.fillStyle = '#FFFFFF';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

            // 获取fabric.js画布的数据URL
            const fabricImage = new Image();
            fabricImage.src = fabricCanvas.toDataURL({format: 'png', quality: 1, multiplier: 1});

            fabricImage.onload = function () { // 绘制主画布内容
                tempCtx.drawImage(fabricImage, 0, 0);

                // 应用遮罩效果：只保留镂空区域
                const maskCanvas = document.createElement('canvas');
                maskCanvas.width = fabricCanvas.width;
                maskCanvas.height = fabricCanvas.height;
                const maskCtx = maskCanvas.getContext('2d');

                // 计算镂空区域位置
                const cutoutX = (fabricCanvas.width - printAreaWidth) / 2;
                const cutoutY = (fabricCanvas.height - printAreaHeight) / 2;

                // 绘制镂空区域的内容
                maskCtx.drawImage(tempCanvas, cutoutX, cutoutY, printAreaWidth, printAreaHeight, 0, 0, printAreaWidth, printAreaHeight);

                // 创建最终的裁剪画布
                const finalCanvas = document.createElement('canvas');
                finalCanvas.width = printAreaWidth;
                finalCanvas.height = printAreaHeight;
                const finalCtx = finalCanvas.getContext('2d');

                // 绘制白色背景
                finalCtx.fillStyle = '#FFFFFF';
                finalCtx.fillRect(0, 0, printAreaWidth, printAreaHeight);

                // 绘制裁剪后的内容
                finalCtx.drawImage(tempCanvas, cutoutX, cutoutY, printAreaWidth, printAreaHeight, 0, 0, printAreaWidth, printAreaHeight);

                resolve(finalCanvas.toDataURL('image/png'));
            };

            fabricImage.onerror = function () {
                console.error('Failed to load fabric canvas image');
                resolve('data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">图片加载失败</text></svg>'));
            };
        } catch (error) {
            console.error('Error capturing canvas with mask:', error);
            resolve('data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">截图异常</text></svg>'));
        }
    });
}

/**
 * 根据Fabric Canvas实例捕获截图（原始版本，不应用遮罩）
 * @param {fabric.Canvas} fabricCanvas - Fabric Canvas实例
 * @returns {Promise<string>} 图片数据URL
 */
function captureCanvasById(fabricCanvas) {
    return new Promise((resolve) => {
        try { // 强制渲染
            fabricCanvas.renderAll();

            // 创建临时画布
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = fabricCanvas.width;
            tempCanvas.height = fabricCanvas.height;
            const tempCtx = tempCanvas.getContext('2d');

            // 绘制白色背景
            tempCtx.fillStyle = '#FFFFFF';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

            // 获取fabric.js画布的数据URL
            const fabricImage = new Image();
            fabricImage.src = fabricCanvas.toDataURL({format: 'png', quality: 1, multiplier: 1});

            fabricImage.onload = function () { // 绘制主画布内容
                tempCtx.drawImage(fabricImage, 0, 0);
                resolve(tempCanvas.toDataURL('image/png'));
            };

            fabricImage.onerror = function () {
                console.error('Failed to load fabric canvas image');
                resolve('data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">图片加载失败</text></svg>'));
            };
        } catch (error) {
            console.error('Error capturing canvas:', error);
            resolve('data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">截图异常</text></svg>'));
        }
    });
}

/**
 * 关闭多视图预览
 */
function closeMultiViewPreview() {
    const modal = document.getElementById('multi-view-preview-modal');
    if (modal) { // 先尝试用MicroModal关闭
        if (typeof MicroModal !== 'undefined') {
            try {
                MicroModal.close('multi-view-preview-modal');
            } catch (e) {
                console.warn('MicroModal close failed:', e);
            }
        }

        // 手动隐藏并移除
        modal.style.display = 'none';
        modal.classList.remove('is-open');

        // 延迟移除DOM元素，确保动画完成
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 100);
    }
}

// 将关闭函数暴露到全局
window.closeMultiViewPreview = closeMultiViewPreview;
window.captureViewForPDF = captureViewForPDF;

/**
 * 生成统一多视图预览图片，根据 view_flow 决定渲染方式
 * @param {Array} views - 视图数组
 * @returns {Promise<Array>} 图片数据数组
 */
async function generateUniversalViewImages(views) {
    const images = [];

    for (const view of views) {
        try {
            if (view.view_flow === '4-Grid Flow') { // 生成4格图预览
                const gridImages = await generate4GridImagesForView(view);
                images.push(gridImages);
            } else { // 普通视图预览
                const imageData = await captureViewImage(view);
                images.push(imageData);
            }
        } catch (error) {
            console.error(`Failed to generate image for view ${
                view.id
            }:`, error);
            // 添加错误占位图
            images.push('data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">截图失败</text></svg>'));
        }
    }

    return images;
}

/**
 * 为单个视图生成4格图预览图片
 * @param {Object} view - 视图对象
 * @returns {Promise<Array>} 4张图片的数据数组
 */
async function generate4GridImagesForView(view) {
    if (! view || ! view.layers) {
        console.error('View or layers not found for 4-grid generation');
        return [
            'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">前视图</text></svg>'),
            'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">左视图</text></svg>'),
            'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">右视图</text></svg>'),
            'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">后视图</text></svg>')
        ];
    }

    // 查找特定图层
    const backgroundLayer = view.layers.find(layer => layer.name === 'Background Layer');
    const baseLayer = view.layers.find(layer => layer.name === 'Base Layer');
    const overlayLayer = view.layers.find(layer => layer.name === 'Overlay Layer');
    const mappingLayer = view.layers.find(layer => layer.name === 'Mapping Layer');

    // 获取画布尺寸（从Background Layer或默认值）
    let canvasWidth = 400;
    let canvasHeight = 400;

    if (backgroundLayer && backgroundLayer.layer_data && backgroundLayer.layer_data.dimensions) {
        const dimensions = backgroundLayer.layer_data.dimensions.layerSize;
        if (dimensions && dimensions.width && dimensions.height) {
            canvasWidth = dimensions.width;
            canvasHeight = dimensions.height;
        }
    }

    // 获取当前视图的画布而不是激活的画布
    let activeCanvas = null;
    if (window.CanvasManager && view.id) {
        activeCanvas = window.CanvasManager.getCanvas(view.id);
    }

    // 如果无法获取特定视图的画布，回退到原来的getActiveCanvas方法
    if (! activeCanvas) {
        activeCanvas = getActiveCanvas();
    }

    if (! activeCanvas) {
        console.error('No active canvas found for 4-grid generation');
        return [
            'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">无法获取画布</text></svg>'),
            'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">无法获取画布</text></svg>'),
            'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">无法获取画布</text></svg>'),
            'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">无法获取画布</text></svg>')
        ];
    }

    // 定义4个视图的配置（裁剪参数）
    const viewConfigs = [
        {
            name: 'front',
            label: '前视图',
            cropConfig: {
                x: 0.25,
                y: 0,
                width: 0.5,
                height: 1
            } // 中心1/2
        }, {
            name: 'left',
            label: '左视图',
            cropConfig: {
                x: 0,
                y: 0,
                width: 0.5,
                height: 1
            } // 左边1/2
        }, {
            name: 'right',
            label: '右视图',
            cropConfig: {
                x: 0.5,
                y: 0,
                width: 0.5,
                height: 1
            } // 右边1/2
        }, {
            name: 'back',
            label: '后视图',
            cropConfig: {
                x: 0.75,
                y: 0,
                width: 0.25,
                height: 1,
                extraCrop: {
                    x: 0,
                    y: 0,
                    width: 0.25,
                    height: 1
                }
            } // 右边1/4 + 左边1/4
        }
    ];

    const gridImages = [];

    // 为每个视图配置生成合成图片
    for (const config of viewConfigs) {
        try {
            const imageData = await generateCompositeImageForGrid({
                canvasWidth,
                canvasHeight,
                backgroundLayer,
                baseLayer,
                overlayLayer,
                mappingLayer,
                activeCanvas,
                cropConfig: config.cropConfig
            });
            gridImages.push(imageData);
        } catch (error) {
            console.error(`Failed to generate ${
                config.name
            } view:`, error);
            // 添加错误占位图
            gridImages.push('data:image/svg+xml;base64,' + btoa(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">${
                config.label
            }生成失败</text></svg>`));
        }
    }

    return gridImages;
}

/**
 * 获取当前选中的颜色
 * @returns {string|null} 当前选中的颜色值
 */
function getCurrentSelectedColor() { // 首先尝试从颜色选择器获取
    const selectedSwatch = document.querySelector('.color-swatch.selected');
    if (selectedSwatch) {
        const color = selectedSwatch.getAttribute('data-color');
        if (color) {
            return color;
        }
    }

    // 尝试从全局变量获取
    if (window.currentColor) {
        return window.currentColor;
    }

    // 尝试从自定义颜色选择器获取
    const customColorPicker = document.getElementById('customColorPicker');
    if (customColorPicker && customColorPicker.value) {
        return customColorPicker.value;
    }

    // 默认返回黑色
    return '#000000';
}

/**
 * 检查是否有明确选中的颜色（不包括默认状态）
 * @returns {string|null} 返回选中的颜色，如果没有明确选中则返回null
 */
function getExplicitSelectedColor() {
    console.log('=== getExplicitSelectedColor 调试信息 ===');
    
    // 首先尝试从颜色选择器获取
    const selectedSwatch = document.querySelector('.color-swatch.selected');
    if (selectedSwatch) {
        const color = selectedSwatch.getAttribute('data-color');
        if (color) {
            console.log('从颜色样本获取到颜色:', color);
            return color;
        }
    }

    // 尝试从全局变量获取（只有当值不是默认值时）
    if (window.currentColor && window.currentColor !== '#000000') {
        console.log('从 window.currentColor 获取到颜色:', window.currentColor);
        return window.currentColor;
    }

    // 尝试从自定义颜色选择器获取（只有当值不是默认值时）
    const customColorPicker = document.getElementById('customColorPicker');
    if (customColorPicker && customColorPicker.value && customColorPicker.value !== '#000000') {
        console.log('从 customColorPicker 获取到颜色:', customColorPicker.value);
        return customColorPicker.value;
    }

    // 调试信息：显示所有检查的值
    console.log('颜色检测结果:');
    console.log('- selectedSwatch:', selectedSwatch);
    console.log('- window.currentColor:', window.currentColor);
    console.log('- customColorPicker.value:', customColorPicker ? customColorPicker.value : 'picker not found');
    console.log('- 最终结果: 没有明确选中的颜色');
    
    // 没有明确选中的颜色
    return null;
}

/**
 * 生成4格图的合成图片（按图层叠加顺序）
 * @param {Object} options - 生成选项
 * @returns {Promise<string>} 图片数据URL
 */
async function generateCompositeImageForGrid(options) {
    const {
        canvasWidth,
        canvasHeight,
        backgroundLayer,
        baseLayer,
        overlayLayer,
        mappingLayer,
        activeCanvas,
        cropConfig
    } = options;

    // 创建临时画布
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasWidth;
    tempCanvas.height = canvasHeight;
    const ctx = tempCanvas.getContext('2d');

    // 清空画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    try {
        // 预先记录 Base 图层的图片 URL，用于后续遮罩逻辑识别
        if (baseLayer && baseLayer.layer_data && baseLayer.layer_data.content && baseLayer.layer_data.content.imageURL) {
            window.baseCupBoundaryImageUrl = baseLayer.layer_data.content.imageURL;
        }

        // 1. 绘制Background Layer（如果存在）
        if (backgroundLayer && backgroundLayer.layer_data && backgroundLayer.layer_data.content && backgroundLayer.layer_data.content.imageURL) {
            await drawLayerImageForGrid(ctx, backgroundLayer.layer_data.content.imageURL, canvasWidth, canvasHeight);
        }

        // 2. 绘制Base Layer（如果存在）并应用当前选中的颜色
        if (baseLayer && baseLayer.layer_data && baseLayer.layer_data.content && baseLayer.layer_data.content.imageURL) {
            const explicitColor = getExplicitSelectedColor();
            if (explicitColor) {
                // 有明确选中的颜色，应用颜色
                await drawLayerImageForGridWithColor(ctx, baseLayer.layer_data.content.imageURL, canvasWidth, canvasHeight, explicitColor);
            } else {
                // 没有明确选中的颜色，使用原始图片
                await drawLayerImageForGrid(ctx, baseLayer.layer_data.content.imageURL, canvasWidth, canvasHeight);
            }
        }

        // 3. 绘制Overlay Layer作为底层（如果存在）
        if (overlayLayer && overlayLayer.layer_data && overlayLayer.layer_data.content && overlayLayer.layer_data.content.imageURL) {
            await drawLayerImageForGrid(ctx, overlayLayer.layer_data.content.imageURL, canvasWidth, canvasHeight);
        }

        // 4. 绘制当前激活画布的裁剪区域，实现窗户效果
        if (activeCanvas) {
            await drawCroppedCanvasRegionWithWindowEffect(ctx, activeCanvas, cropConfig, canvasWidth, canvasHeight);
        }

        
        // 5.（移除）不再重复绘制 Base Layer 作为输出层


        return tempCanvas.toDataURL('image/png');
    } catch (error) {
        console.error('Error generating composite image for grid:', error);
        throw error;
    }
}

/**
 * 为4格图绘制图层图片
 * @param {CanvasRenderingContext2D} ctx - 画布上下文
 * @param {string} imageUrl - 图片URL
 * @param {number} width - 画布宽度
 * @param {number} height - 画布高度
 */
/**
 * 将图层图片绘制到网格预览画布，同时扫描非透明像素获取边界信息。
 * - 保持原始长宽比，将图片缩放到输出高度的 80% 并居中
 * - 在临时画布上读取像素数据，计算非透明区域的最小包围盒
 * - 将边界信息写入 `window.cupBoundary`，供后续 Canvas 逻辑使用
 * - 若为 Base 图层，额外记录 `window.baseCupBoundary`
 *
 * @param {CanvasRenderingContext2D} ctx 目标 2D 画布上下文
 * @param {string} imageUrl 要绘制的图片地址（需满足 CORS）
 * @param {number} width 目标输出区域宽度
 * @param {number} height 目标输出区域高度
 * @returns {Promise<void>} 图片绘制完成后 resolve
 */
async function drawLayerImageForGrid(ctx, imageUrl, width, height) {
    // 使用 Promise 封装图片加载与绘制流程，便于异步串联
    return new Promise((resolve, reject) => {
        const img = new Image();
        // 为避免跨域导致的 canvas 污染（tainted canvas），开启匿名跨域。
        // 注意：图片服务器需要返回 `Access-Control-Allow-Origin` 头。
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            // 1) 保持长宽比进行缩放：目标高度取输出区域的 80%，为上下留白
            const targetHeight = height * 0.8;
            const aspectRatio = img.width / img.height; // 原始宽高比
            const targetWidth = targetHeight * aspectRatio; // 按比例得到目标宽度

            // 2) 计算居中位置（在给定的 width/height 区域中水平/垂直居中）
            const x = (width - targetWidth) / 2;
            const y = (height - targetHeight) / 2;

            // 3) 使用临时画布渲染缩放后的图片，以便读取像素数据进行边界扫描
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = targetWidth;
            tempCanvas.height = targetHeight;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(img, 0, 0, targetWidth, targetHeight);

            // 4) 读取像素数据：每个像素包含 RGBA 四个通道，索引 3 为 alpha(不透明度)
            const imageData = tempCtx.getImageData(0, 0, targetWidth, targetHeight);
            const data = imageData.data;

            // 5) 计算非透明像素的最小包围盒
            // 初始化时令最小值为最大边界、最大值为 0，以便后续比较更新
            let minX = targetWidth,
                maxX = 0,
                minY = targetHeight,
                maxY = 0;
            for (let y = 0; y < targetHeight; y++) {
                for (let x = 0; x < targetWidth; x++) {
                    // 计算当前像素的 alpha 通道值，范围 [0, 255]
                    const alpha = data[(y * targetWidth + x) * 4 + 3];
                    // 使用阈值 10 过滤近似透明像素，避免边界过于贴近噪点
                    if (alpha > 10) {
                        minX = Math.min(minX, x);
                        maxX = Math.max(maxX, x);
                        minY = Math.min(minY, y);
                        maxY = Math.max(maxY, y);
                    }
                }
            }

            // 6) 存储计算得到的边界信息到全局，供其他绘制/交互逻辑使用
            // 说明：
            // - x/y 为包围盒在输出区域中的绝对位置（居中偏移 + 局部边界）
            // - width/height 为非透明区域的尺寸
            // - originalX/originalY/originalWidth/originalHeight 记录缩放后图片的整体位置与尺寸
            // - imageUrl 用于对齐与校验（如 Base 图层专用边界）
            window.cupBoundary = {
                x: x + minX,
                y: y + minY,
                width: maxX - minX,
                height: maxY - minY,
                originalX: x,
                originalY: y,
                originalWidth: targetWidth,
                originalHeight: targetHeight,
                imageUrl: imageUrl
            };

            // 若当前绘制的是 Base 图层（通过 imageUrl 标识），记录专用的 baseCupBoundary
            if (window.baseCupBoundaryImageUrl && window.baseCupBoundaryImageUrl === imageUrl) {
                window.baseCupBoundary = Object.assign({}, window.cupBoundary);
            }

            // 7) 将图片绘制到目标画布上（最终呈现到网格预览）
            ctx.drawImage(img, x, y, targetWidth, targetHeight);
            // 绘制流程完成，通知上层继续
            resolve();
        };
        // 图片加载失败时将错误传递出去，便于上层统一处理
        img.onerror = reject;
        // 触发图片加载
        img.src = imageUrl;
    });
}

/**
 * 为4格图绘制图层图片并应用颜色
 * @param {CanvasRenderingContext2D} ctx - 画布上下文
 * @param {string} imageUrl - 图片URL
 * @param {number} width - 画布宽度
 * @param {number} height - 画布高度
 * @param {string} color - 要应用的颜色
 */
async function drawLayerImageForGridWithColor(ctx, imageUrl, width, height, color) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => { // 计算保持长宽比的尺寸，高度为输出图片高度的80%
            const targetHeight = height * 0.8;
            const aspectRatio = img.width / img.height;
            const targetWidth = targetHeight * aspectRatio;

            // 计算居中位置
            const x = (width - targetWidth) / 2;
            const y = (height - targetHeight) / 2;

            // 创建临时画布来检测非透明像素区域和应用颜色
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = targetWidth;
            tempCanvas.height = targetHeight;
            const tempCtx = tempCanvas.getContext('2d');

            // 先绘制原图
            tempCtx.drawImage(img, 0, 0, targetWidth, targetHeight);

            // 应用颜色（使用 source-in 混合模式）
            tempCtx.globalCompositeOperation = 'source-in';
            tempCtx.fillStyle = color;
            tempCtx.fillRect(0, 0, targetWidth, targetHeight);

            // 重置混合模式
            tempCtx.globalCompositeOperation = 'source-over';

            // 获取图像数据来检测边界
            const imageData = tempCtx.getImageData(0, 0, targetWidth, targetHeight);
            const data = imageData.data;

            // 找到非透明像素的边界
            let minX = targetWidth,
                maxX = 0,
                minY = targetHeight,
                maxY = 0;
            for (let y = 0; y < targetHeight; y++) {
                for (let x = 0; x < targetWidth; x++) {
                    const alpha = data[(y * targetWidth + x) * 4 + 3];
                    if (alpha > 10) { // 非透明像素阈值
                        minX = Math.min(minX, x);
                        maxX = Math.max(maxX, x);
                        minY = Math.min(minY, y);
                        maxY = Math.max(maxY, y);
                    }
                }
            }

            // 存储杯子边界信息到全局变量，供canvas绘制函数使用
            window.cupBoundary = {
                x: x + minX,
                y: y + minY,
                width: maxX - minX,
                height: maxY - minY,
                originalX: x,
                originalY: y,
                originalWidth: targetWidth,
                originalHeight: targetHeight,
                imageUrl: imageUrl
            };

            // 如果当前绘制的是 Base 图层（应用了颜色），记录专用的 baseCupBoundary
            if (window.baseCupBoundaryImageUrl && window.baseCupBoundaryImageUrl === imageUrl) {
                window.baseCupBoundary = Object.assign({}, window.cupBoundary);
            }

            // 将应用了颜色的图片绘制到目标画布
            ctx.drawImage(tempCanvas, x, y);
            resolve();
        };
        img.onerror = reject;
        img.src = imageUrl;
    });
}

/**
 * 为4格图绘制裁剪的画布区域
 * @param {CanvasRenderingContext2D} ctx - 目标画布上下文
 * @param {fabric.Canvas} sourceCanvas - 源画布
 * @param {Object} cropConfig - 裁剪配置
 * @param {number} targetWidth - 目标宽度
 * @param {number} targetHeight - 目标高度
 */
async function drawCroppedCanvasRegionForGrid(ctx, sourceCanvas, cropConfig, targetWidth, targetHeight) {
    return new Promise((resolve) => { // 获取源画布的数据URL
        const sourceDataURL = sourceCanvas.toDataURL('image/png');
        const img = new Image();

        img.onload = () => {
            const sourceWidth = img.width;
            const sourceHeight = img.height;

            if (cropConfig.extraCrop) {
                // 后视图特殊处理：右边1/4 + 左边1/4
                // 创建临时画布来合成拼接图片
                const tempCanvas = document.createElement('canvas');
                const rightCropWidth = sourceWidth * cropConfig.width;
                const leftCropWidth = sourceWidth * cropConfig.extraCrop.width;
                const totalCropWidth = rightCropWidth + leftCropWidth;

                tempCanvas.width = totalCropWidth;
                tempCanvas.height = sourceHeight;
                const tempCtx = tempCanvas.getContext('2d');

                // 绘制右边1/4
                const rightCropX = sourceWidth * cropConfig.x;
                tempCtx.drawImage(img, rightCropX, 0, rightCropWidth, sourceHeight, 0, 0, rightCropWidth, sourceHeight);

                // 绘制左边1/4
                const leftCropX = sourceWidth * cropConfig.extraCrop.x;
                tempCtx.drawImage(img, leftCropX, 0, leftCropWidth, sourceHeight, rightCropWidth, 0, leftCropWidth, sourceHeight);

                // 计算保持长宽比的尺寸
                const cropHeight = targetHeight * 0.8;
                const aspectRatio = totalCropWidth / sourceHeight;
                const cropWidth = cropHeight * aspectRatio;

                // 计算居中位置
                const x = (targetWidth - cropWidth) / 2;
                const y = (targetHeight - cropHeight) / 2;

                // 限制在杯子边界内绘制
                drawCanvasWithinBoundary(ctx, tempCanvas, targetWidth, targetHeight);
            } else { // 普通裁剪
                const cropX = sourceWidth * cropConfig.x;
                const cropY = sourceHeight * cropConfig.y;
                const cropWidth = sourceWidth * cropConfig.width;
                const cropHeight = sourceHeight * cropConfig.height;

                // 创建裁剪后的临时画布
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = cropWidth;
                tempCanvas.height = cropHeight;
                const tempCtx = tempCanvas.getContext('2d');

                tempCtx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

                // 限制在杯子边界内绘制
                drawCanvasWithinBoundary(ctx, tempCanvas, targetWidth, targetHeight);
            }

            resolve();
        };

        img.src = sourceDataURL;
    });
}

/**
 * 为4格图绘制裁剪的画布区域，实现窗户效果
 * @param {CanvasRenderingContext2D} ctx - 目标画布上下文
 * @param {fabric.Canvas} sourceCanvas - 源画布
 * @param {Object} cropConfig - 裁剪配置
 * @param {number} targetWidth - 目标宽度
 * @param {number} targetHeight - 目标高度
 */
async function drawCroppedCanvasRegionWithWindowEffect(ctx, sourceCanvas, cropConfig, targetWidth, targetHeight) {
    return new Promise((resolve) => { // 获取源画布的数据URL
        const sourceDataURL = sourceCanvas.toDataURL('image/png');
        const img = new Image();

        img.onload = () => {
            const sourceWidth = img.width;
            const sourceHeight = img.height;

            // 获取杯子边界信息
            const cupBoundary = window.cupBoundary;
            
            if (! cupBoundary) {
                console.warn('Cup boundary not found, using original drawing method');
                // 如果没有边界信息，使用原来的绘制方式
                drawCroppedCanvasRegionForGrid(ctx, sourceCanvas, cropConfig, targetWidth, targetHeight).then(resolve);
                return;
            }

            // 保存当前画布状态
            ctx.save();

            // 先根据裁剪配置生成临时源画布（裁剪结果）
            let tempCanvas;
            if (cropConfig.extraCrop) { // 后视图特殊处理：右边1/4 + 左边1/4
                const rightCropWidth = sourceWidth * cropConfig.width;
                const leftCropWidth = sourceWidth * cropConfig.extraCrop.width;
                const totalCropWidth = rightCropWidth + leftCropWidth;

                tempCanvas = document.createElement('canvas');
                tempCanvas.width = totalCropWidth;
                tempCanvas.height = sourceHeight;
                const tempCtx = tempCanvas.getContext('2d');

                // 绘制右边1/4
                const rightCropX = sourceWidth * cropConfig.x;
                tempCtx.drawImage(img, rightCropX, 0, rightCropWidth, sourceHeight, 0, 0, rightCropWidth, sourceHeight);

                // 绘制左边1/4
                const leftCropX = sourceWidth * cropConfig.extraCrop.x;
                tempCtx.drawImage(img, leftCropX, 0, leftCropWidth, sourceHeight, rightCropWidth, 0, leftCropWidth, sourceHeight);
            } else { // 普通裁剪
                const cropX = sourceWidth * cropConfig.x;
                const cropY = sourceHeight * cropConfig.y;
                const cropWidth = sourceWidth * cropConfig.width;
                const cropHeight = sourceHeight * cropConfig.height;

                tempCanvas = document.createElement('canvas');
                tempCanvas.width = cropWidth;
                tempCanvas.height = cropHeight;
                const tempCtx = tempCanvas.getContext('2d');

                tempCtx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
            }

            // 创建离屏合成画布，用 baseLayer 非透明像素区域作为遮罩，应用 source-in
            const compositeCanvas = document.createElement('canvas');
            compositeCanvas.width = targetWidth;
            compositeCanvas.height = targetHeight;
            const compositeCtx = compositeCanvas.getContext('2d');

            const maskImg = new Image();
            maskImg.crossOrigin = 'anonymous';
            maskImg.onload = () => {
                // 绘制遮罩（baseLayer原图，保持与先前绘制一致的缩放与位置）
                compositeCtx.drawImage(maskImg, cupBoundary.originalX, cupBoundary.originalY, cupBoundary.originalWidth, cupBoundary.originalHeight);

                // 使用 source-in，将临时源画布裁剪到 baseLayer 的非透明像素区域
                compositeCtx.globalCompositeOperation = 'source-in';

                // 宽度自适应等比缩放，高度按比例缩放，底部对齐
                const scaleX = cupBoundary.width / tempCanvas.width;
                const scaleY = cupBoundary.height / tempCanvas.height;
                const scale = Math.min(scaleX, scaleY); // 保持比例缩放，确保不超出边界
                
                const desiredWidth = tempCanvas.width * scale;
                const desiredHeight = tempCanvas.height * scale;

                const drawY = cupBoundary.y + cupBoundary.height - desiredHeight; // 底部对齐
                const drawX = cupBoundary.x + (cupBoundary.width - desiredWidth) / 2; // 水平居中于像素区域

                compositeCtx.drawImage(tempCanvas, drawX, drawY, desiredWidth, desiredHeight);

                // 重置混合模式
                compositeCtx.globalCompositeOperation = 'source-over';

                // 将合成结果绘制到目标画布
                ctx.drawImage(compositeCanvas, 0, 0);

                // 恢复画布状态并完成
                ctx.restore();
                resolve();
            };
            maskImg.onerror = () => {
                console.warn('Mask image failed to load, fallback to boundary drawing');
                // 回退：在边界内绘制（不使用 source-in）
                drawCanvasWithinBoundaryForWindow(ctx, tempCanvas, cupBoundary);
                ctx.restore();
                resolve();
            };

            // 优先使用记录的 base 图像 URL
            const maskSrc = cupBoundary.imageUrl || window.baseCupBoundaryImageUrl;
            if (maskSrc) {
                maskImg.src = maskSrc;
            } else {
                // 无法获取遮罩图片，直接回退
                drawCanvasWithinBoundaryForWindow(ctx, tempCanvas, cupBoundary);
                ctx.restore();
                resolve();
            }
        };

        img.src = sourceDataURL;
    });
}

/**
 * 在杯子边界内绘制画布内容（窗户效果专用）
 * @param {CanvasRenderingContext2D} ctx - 目标画布上下文
 * @param {HTMLCanvasElement} sourceCanvas - 源画布
 * @param {Object} cupBoundary - 杯子边界信息
 */
function drawCanvasWithinBoundaryForWindow(ctx, sourceCanvas, cupBoundary) { // 计算源画布的缩放比例以适应杯子边界
    const scaleX = cupBoundary.width / sourceCanvas.width;
    const scaleY = cupBoundary.height / sourceCanvas.height;
    
    // ===== 修复：优先保证高度充分利用，宽度可以超出边界（会被裁剪） =====
    // 使用较大的缩放比例，优先保证高度填满杯子边界
    const scale = Math.max(scaleX, scaleY) * 0.95; // 改为使用Math.max，优先保证高度
    
    // 确保缩放后不会太小，至少保证高度利用率达到90%以上
    const adjustedScale = Math.max(scale, 0.9);
    
    const scaledWidth = sourceCanvas.width * adjustedScale;
    const scaledHeight = sourceCanvas.height * adjustedScale;


    // 在杯子边界内居中绘制（如果宽度超出边界，会被裁剪）
    const x = cupBoundary.x + (cupBoundary.width - scaledWidth) / 2;
    const y = cupBoundary.y + (cupBoundary.height - scaledHeight) / 2;
    
    ctx.drawImage(sourceCanvas, x, y, scaledWidth, scaledHeight);
}

/**
 * 在杯子边界内绘制画布内容
 * @param {CanvasRenderingContext2D} ctx - 目标画布上下文
 * @param {HTMLCanvasElement} sourceCanvas - 源画布
 * @param {number} targetWidth - 目标宽度
 * @param {number} targetHeight - 目标高度
 */
function drawCanvasWithinBoundary(ctx, sourceCanvas, targetWidth, targetHeight) { // 获取杯子边界信息
    const cupBoundary = window.cupBoundary;

    if (! cupBoundary) {
        console.warn('Cup boundary not found, using default drawing');
        // 如果没有边界信息，使用原来的绘制方式
        const drawHeight = targetHeight * 0.8;
        const aspectRatio = sourceCanvas.width / sourceCanvas.height;
        const drawWidth = drawHeight * aspectRatio;
        const x = (targetWidth - drawWidth) / 2;
        const y = (targetHeight - drawHeight) / 2;
        ctx.drawImage(sourceCanvas, x, y, drawWidth, drawHeight);
        return;
    }

    // 计算源画布的缩放比例以适应杯子边界
    const scaleX = cupBoundary.width / sourceCanvas.width;
    const scaleY = cupBoundary.height / sourceCanvas.height;
    const scale = Math.min(scaleX, scaleY) * 0.9; // 稍微缩小一点确保不超出边界

    const scaledWidth = sourceCanvas.width * scale;
    const scaledHeight = sourceCanvas.height * scale;

    // 在杯子边界内居中绘制
    const x = cupBoundary.x + (cupBoundary.width - scaledWidth) / 2;
    const y = cupBoundary.y + (cupBoundary.height - scaledHeight) / 2;

    ctx.drawImage(sourceCanvas, x, y, scaledWidth, scaledHeight);
}

/**
 * 根据裁剪配置裁剪图像
 * @param {string} imageDataUrl - 基础图像数据URL
 * @param {Object} cropConfig - 裁剪配置 {x, y, width, height}（百分比）
 * @returns {Promise<string>} 裁剪后的图像数据URL
 */
function cropImageWithConfig(imageDataUrl, cropConfig) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // 计算裁剪区域的像素坐标
            const sourceX = img.width * cropConfig.x;
            const sourceY = img.height * cropConfig.y;
            const sourceWidth = img.width * cropConfig.width;
            const sourceHeight = img.height * cropConfig.height;

            // 设置输出画布尺寸
            canvas.width = sourceWidth;
            canvas.height = sourceHeight;

            // 绘制裁剪后的图像
            ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, // 源区域
                    0, 0, sourceWidth, sourceHeight // 目标区域
            );

            resolve(canvas.toDataURL('image/png'));
        };

        img.onerror = function () {
            console.error('Failed to load base image for cropping');
            resolve('data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">图像加载失败</text></svg>'));
        };

        img.src = imageDataUrl;
    });
}

/**
 * 捕获单个视图的图像
 * @param {Object} view - 视图对象
 * @returns {Promise<string>} 图片数据URL
 */
async function captureViewImage(view) {
    try { // 获取所有Canvas图层元素
        const baseCanvasElement = document.getElementById(`baseCanvas-${
            view.id
        }`);
        const mainCanvasElement = document.getElementById(`mainCanvas-${
            view.id
        }`);
        const overlayCanvasElement = document.getElementById(`overlayCanvas-${
            view.id
        }`);
        const maskCanvasElement = document.getElementById(`maskCanvas-${
            view.id
        }`);

        if (mainCanvasElement && window.CanvasManager) {
            const fabricCanvas = window.CanvasManager.getCanvas(view.id);
            if (fabricCanvas) { // 强制渲染主Canvas
                fabricCanvas.renderAll();

                // 捕获多层Canvas内容（应用遮罩效果）
                const imageData = await captureMultiLayerCanvasWithMask({
                    baseCanvas: baseCanvasElement,
                    mainCanvas: mainCanvasElement,
                    overlayCanvas: overlayCanvasElement,
                    maskCanvas: maskCanvasElement,
                    fabricCanvas: fabricCanvas
                }, view);
                return imageData;
            } else {
                console.warn(`Canvas not found for view: ${
                    view.id
                }`);
                return 'data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">无法加载视图</text></svg>');
            }
        } else {
            console.warn(`Canvas element not found: mainCanvas-${
                view.id
            }`);
            return 'data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">视图不存在</text></svg>');
        }
    } catch (error) {
        console.error(`Failed to capture view ${
            view.id
        }:`, error);
        return 'data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">截图失败</text></svg>');
    }
}
