// 独立印刷方式绑定 Modal 渲染器
// 用于在图层面板外部直接打开印刷方式绑定弹窗

let modalContainer = null;
let currentLayerId = null;
let printMethodStore = null;
let canvasStore = null;

function getModalContainer() {
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'pwca-print-method-binding-modal';
        modalContainer.className = 'pwca-print-method-modal-wrapper';
        modalContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10000;
            display: none;
            justify-content: center;
            align-items: center;
        `;
        document.body.appendChild(modalContainer);
    }
    return modalContainer;
}

function getModalStyles() {
    return `
        .pwca-print-method-modal-wrapper {
            background: rgba(0, 0, 0, 0.6);
        }
        .pwca-print-method-modal-box {
            background: #fff;
            border-radius: 8px;
            padding: 24px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        .pwca-print-method-modal-box h2 {
            margin: 0 0 20px 0;
            font-size: 18px;
            color: #333;
        }
        .pwca-print-method-modal-close {
            position: absolute;
            top: 12px;
            right: 12px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        }
        .pwca-print-method-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 12px;
            margin-bottom: 20px;
        }
        .pwca-print-method-item {
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 16px 12px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
        }
        .pwca-print-method-item:hover {
            border-color: #11bbf5;
            background: #f0f9ff;
        }
        .pwca-print-method-item.selected {
            border-color: #11bbf5;
            background: #e0f7ff;
        }
        .pwca-print-method-item input {
            display: none;
        }
        .pwca-print-method-name {
            font-size: 14px;
            font-weight: 500;
            color: #333;
        }
        .pwca-print-method-desc {
            font-size: 12px;
            color: #666;
            margin-top: 4px;
        }
        .pwca-print-method-modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid #e0e0e0;
        }
        .pwca-print-method-modal-btn {
            padding: 10px 24px;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            border: 1px solid #ddd;
        }
        .pwca-print-method-modal-btn.cancel {
            background: #fff;
            color: #666;
        }
        .pwca-print-method-modal-btn.cancel:hover {
            background: #f5f5f5;
        }
        .pwca-print-method-modal-btn.primary {
            background: #11bbf5;
            color: #fff;
            border-color: #11bbf5;
        }
        .pwca-print-method-modal-btn.primary:hover {
            background: #0ea5db;
        }
        .pwca-print-method-info {
            padding: 12px;
            background: #f5f5f5;
            border-radius: 6px;
            margin-bottom: 16px;
            font-size: 13px;
            color: #666;
        }
    `;
}

function renderModalContent(selectedMethodId) {
    const methods = printMethodStore ? printMethodStore.currentViewPrintMethods : [];
    
    let methodItems = '';
    methods.forEach(method => {
        const isSelected = method.id === selectedMethodId;
        methodItems += `
            <label class="pwca-print-method-item ${isSelected ? 'selected' : ''}" data-method-id="${method.id}">
                <input type="radio" name="printMethod" value="${method.id}" ${isSelected ? 'checked' : ''}>
                <div class="pwca-print-method-name">${method.label || method.name || 'Method ' + method.id}</div>
                ${method.description ? `<div class="pwca-print-method-desc">${method.description}</div>` : ''}
            </label>
        `;
    });
    
    return `
        <style>${getModalStyles()}</style>
        <div class="pwca-print-method-modal-box">
            <h2>选择印刷方式</h2>
            <div class="pwca-print-method-info">
                请为此元素选择一个印刷方式。选择后才能使用此工具进行编辑和操作。
            </div>
            <div class="pwca-print-method-grid">
                ${methodItems}
            </div>
            <div class="pwca-print-method-modal-footer">
                <button class="pwca-print-method-modal-btn cancel" id="pwca-print-method-cancel">取消</button>
                <button class="pwca-print-method-modal-btn primary" id="pwca-print-method-confirm">确定</button>
            </div>
        </div>
    `;
}

function setupEventListeners() {
    const container = getModalContainer();
    
    container.addEventListener('click', (e) => {
        if (e.target === container) {
            closePrintMethodBindingModal();
            return;
        }
        
        if (e.target.id === 'pwca-print-method-cancel') {
            closePrintMethodBindingModal();
            return;
        }
        
        if (e.target.id === 'pwca-print-method-confirm') {
            const selectedRadio = container.querySelector('input[name="printMethod"]:checked');
            if (selectedRadio) {
                const methodId = selectedRadio.value;
                assignPrintMethod(methodId);
            }
            closePrintMethodBindingModal();
            return;
        }
        
        const methodItem = e.target.closest('.pwca-print-method-item');
        if (methodItem) {
            container.querySelectorAll('.pwca-print-method-item').forEach(item => {
                item.classList.remove('selected');
            });
            methodItem.classList.add('selected');
            const radio = methodItem.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        }
    });
}

function assignPrintMethod(methodId) {
    if (!printMethodStore || !currentLayerId || !canvasStore) return;
    
    printMethodStore.assignLayerPrintMethod(currentLayerId, methodId);
    
    const event = new CustomEvent('printMethodAssigned', {
        detail: {
            layerId: currentLayerId,
            methodId: methodId
        }
    });
    document.dispatchEvent(event);
    
    if (typeof window.updateModelFromCanvas === 'function') {
        setTimeout(() => window.updateModelFromCanvas(), 100);
    }
}

function openPrintMethodBindingModal(layerId) {
    currentLayerId = layerId;
    
    const stateAccess = window.pwcaUiStateAccess;
    if (!stateAccess) return false;
    
    canvasStore = typeof stateAccess.getCanvasStore === 'function' 
        ? stateAccess.getCanvasStore() 
        : null;
    
    printMethodStore = typeof stateAccess.getPrintMethodStore === 'function' 
        ? stateAccess.getPrintMethodStore() 
        : null;
    
    if (!canvasStore || !printMethodStore) return false;
    
    const currentViewId = canvasStore.activeViewId;
    if (!currentViewId) return false;
    
    const viewLayers = canvasStore.getViewLayers(currentViewId);
    const layer = viewLayers.find(l => l.id === layerId);
    if (!layer) return false;
    
    const currentMethodId = printMethodStore.getLayerPrintMethod
        ? printMethodStore.getLayerPrintMethod(layerId)?.id
        : null;
    
    const container = getModalContainer();
    container.innerHTML = renderModalContent(currentMethodId || printMethodStore.selectedPrintMethodId);
    container.style.display = 'flex';
    
    return true;
}

function closePrintMethodBindingModal() {
    const container = getModalContainer();
    container.style.display = 'none';
    currentLayerId = null;
}

function isPrintMethodBindingModalOpen() {
    const container = getModalContainer();
    return container && container.style.display === 'flex';
}

function initPrintMethodBindingModal() {
    setupEventListeners();
    
    window.pwcaOpenPrintMethodBindingModal = openPrintMethodBindingModal;
    window.pwcaClosePrintMethodBindingModal = closePrintMethodBindingModal;
    window.pwcaIsPrintMethodBindingModalOpen = isPrintMethodBindingModalOpen;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPrintMethodBindingModal);
} else {
    initPrintMethodBindingModal();
}

export {
    openPrintMethodBindingModal,
    closePrintMethodBindingModal,
    isPrintMethodBindingModalOpen
};
