/**
 * 完整示例：集成购物车列表和编辑器
 */

import { DataManager, CartEditor, UrlParams } from '../index.js';

// ==========================================
// 应用配置
// ==========================================
const APP_CONFIG = {
  appName: 'complete-demo-app',
  editorUrl: '/design-editor',
  cartUrl: '/cart'
};

// ==========================================
// 初始化模块
// ==========================================
const dataManager = new DataManager({
  appName: APP_CONFIG.appName
});

const cartEditor = new CartEditor({
  dataManager,

  onLoadProduct: async (productData) => {
    console.log('=== 加载产品 ===');
    console.log('产品 ID:', productData.productId);
    console.log('产品名称:', productData.productName);
    console.log('选项:', productData.options);
    
    await loadEditorState(productData);
  },

  onEditStart: (item) => {
    showNotification(`正在编辑: ${item.productName}`, 'info');
  },

  onEditCancel: () => {
    showNotification('已取消编辑', 'warning');
  }
});

// ==========================================
// 编辑器模拟
// ==========================================
let currentEditorState = null;

async function loadEditorState(productData) {
  currentEditorState = {
    productId: productData.productId,
    options: productData.options,
    design: productData.designData || { stages: {} }
  };
  
  console.log('编辑器状态已加载:', currentEditorState);
  renderEditor();
}

function renderEditor() {
  const editorEl = document.getElementById('editor-container');
  if (!editorEl || !currentEditorState) return;

  editorEl.innerHTML = `
    <div class="editor-header">
      <h2>编辑: ${currentEditorState.options?.productName || '未命名产品'}</h2>
      <div class="editor-actions">
        <button onclick="cancelEdit()">取消</button>
        <button onclick="saveAndUpdateCart()">保存并更新</button>
      </div>
    </div>
    <div class="editor-canvas">
      <p>（编辑器画布区域）</p>
      <pre>${JSON.stringify(currentEditorState, null, 2)}</pre>
    </div>
  `;
}

// ==========================================
// 购物车列表渲染
// ==========================================
function renderCartList() {
  const cartContainer = document.getElementById('cart-list');
  if (!cartContainer) return;

  const items = dataManager.getAllCartItems();
  const itemArray = Object.values(items);

  if (itemArray.length === 0) {
    cartContainer.innerHTML = '<p class="empty-cart">购物车是空的</p>';
    return;
  }

  cartContainer.innerHTML = itemArray.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <div class="item-info">
        <h3>${item.productName}</h3>
        <p>产品 ID: ${item.productId}</p>
        <p>创建时间: ${new Date(item.createdAt).toLocaleString()}</p>
        ${item.options ? `<pre>选项: ${JSON.stringify(item.options)}</pre>` : ''}
      </div>
      <div class="item-actions">
        <a href="${cartEditor.getEditUrl(item.id, APP_CONFIG.editorUrl)}" 
           class="btn-edit">
          编辑
        </a>
        <button onclick="removeItem('${item.id}')" class="btn-remove">
          删除
        </button>
      </div>
    </div>
  `).join('');
}

// ==========================================
// 操作函数
// ==========================================

window.cancelEdit = function() {
  cartEditor.cancelEdit();
  currentEditorState = null;
  window.location.href = APP_CONFIG.cartUrl;
};

window.saveAndUpdateCart = async function() {
  if (!cartEditor.isEditing()) return;

  try {
    await cartEditor.saveCurrentEdit({
      ...currentEditorState,
      designData: currentEditorState.design
    });
    
    showNotification('已保存更改', 'success');
    window.location.href = APP_CONFIG.cartUrl;
  } catch (error) {
    showNotification('保存失败: ' + error.message, 'error');
  }
};

window.addDemoItem = async function() {
  const item = await cartEditor.createCartItem(
    {
      productId: 'demo-' + Date.now(),
      productName: '演示产品 ' + new Date().toLocaleTimeString(),
      options: {
        size: 'M',
        color: 'blue'
      }
    },
    {
      stages: {
        front: {
          objects: [
            { type: 'text', content: 'Demo Text' }
          ]
        }
      }
    }
  );

  showNotification('已添加演示产品', 'success');
  renderCartList();
};

window.removeItem = function(cartId) {
  if (confirm('确定要删除这个项目吗？')) {
    dataManager.deleteCartItem(cartId);
    renderCartList();
    showNotification('已删除', 'success');
  }
};

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 24px;
    background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
    color: white;
    border-radius: 4px;
    z-index: 10000;
    animation: fadeIn 0.3s;
  `;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// ==========================================
// 页面初始化
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  const path = window.location.pathname;

  if (path === APP_CONFIG.editorUrl || path.includes('editor')) {
    await cartEditor.checkUrlAndEdit();
  } else if (path === APP_CONFIG.cartUrl || path.includes('cart')) {
    renderCartList();
  }
});

// ==========================================
// CSS 样式（用于示例）
// ==========================================
const style = document.createElement('style');
style.textContent = `
  .cart-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 16px;
    margin: 8px 0;
    border: 1px solid #eee;
    border-radius: 8px;
  }
  .item-info h3 { margin: 0 0 8px 0; }
  .item-info p { margin: 4px 0; color: #666; }
  .item-actions { display: flex; gap: 8px; }
  .btn-edit, .btn-remove {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none;
  }
  .btn-edit { background: #2196f3; color: white; }
  .btn-remove { background: #f44336; color: white; }
  .empty-cart { color: #999; text-align: center; padding: 40px; }
  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #eee;
  }
  .editor-header h2 { margin: 0; }
  .editor-actions button { margin-left: 8px; padding: 8px 16px; }
  .editor-canvas { padding: 24px; min-height: 300px; background: #f9f9f9; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
`;
document.head.appendChild(style);
