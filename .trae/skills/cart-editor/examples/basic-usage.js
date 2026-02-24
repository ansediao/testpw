/**
 * 基础使用示例
 */

import { DataManager, CartEditor, UrlParams } from '../index.js';

// ==========================================
// 1. 初始化数据管理器
// ==========================================
const dataManager = new DataManager({
  appName: 'my-design-app',
  storageKey: 'my-app-cart-data',
  dbName: 'my-app-cart-db'
});

// ==========================================
// 2. 初始化购物车编辑器
// ==========================================
const cartEditor = new CartEditor({
  dataManager,

  // 必需：产品加载回调
  onLoadProduct: async (productData) => {
    console.log('加载产品数据:', productData);
    
    // 在这里实现你的编辑器恢复逻辑
    // 例如：恢复画布、对象、设置等
    
    if (productData.designData && productData.designData.stages) {
      console.log('恢复设计阶段:', productData.designData.stages);
      // restoreStages(productData.designData.stages);
    }

    if (productData.options) {
      console.log('恢复用户选项:', productData.options);
      // restoreOptions(productData.options);
    }
  },

  // 可选：开始编辑时的回调
  onEditStart: (item) => {
    console.log('开始编辑购物车项:', item);
    // 可以在这里显示编辑状态提示
    // showEditStatus(`正在编辑: ${item.productName}`);
  },

  // 可选：取消编辑时的回调
  onEditCancel: (cartId) => {
    console.log('取消编辑:', cartId);
    // 可以在这里清除编辑状态
    // clearEditStatus();
  }
});

// ==========================================
// 3. 页面加载时检查 URL 并自动编辑
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const isEditing = await cartEditor.checkUrlAndEdit();
    if (isEditing) {
      console.log('已自动加载编辑状态');
    }
  } catch (error) {
    console.error('初始化失败:', error);
  }
});

// ==========================================
// 4. 创建购物车项（加入购物车时）
// ==========================================
async function addToCart() {
  const cartItem = await cartEditor.createCartItem(
    {
      productId: 'product-001',
      productName: '定制 T 恤',
      options: {
        size: 'L',
        color: 'red'
      }
    },
    {
      stages: {
        front: {
          objects: [
            { type: 'text', content: 'Hello World' },
            { type: 'image', src: '...' }
          ],
          background: '#ffffff'
        }
      },
      settings: {
        resolution: 300
      }
    }
  );

  console.log('已创建购物车项:', cartItem);
  return cartItem;
}

// ==========================================
// 5. 在购物车页面生成编辑链接
// ==========================================
function generateEditLink(cartId) {
  const editUrl = cartEditor.getEditUrl(cartId, '/editor');
  console.log('编辑链接:', editUrl);
  
  // 返回 HTML 链接
  return `<a href="${editUrl}" class="edit-design-btn">编辑设计</a>`;
}

// ==========================================
// 6. 保存编辑后的更改
// ==========================================
async function saveEditChanges() {
  if (!cartEditor.isEditing()) {
    console.warn('当前没有正在编辑的项');
    return;
  }

  const updatedItem = await cartEditor.saveCurrentEdit({
    options: {
      size: 'XL',  // 更新后的选项
      color: 'blue'
    },
    designData: {
      stages: {
        front: {
          objects: [
            { type: 'text', content: 'Updated Text' }
          ]
        }
      }
    }
  });

  console.log('已保存更改:', updatedItem);
}

// ==========================================
// 7. 取消编辑
// ==========================================
function cancelEditing() {
  cartEditor.cancelEdit();
  console.log('已取消编辑');
}

// ==========================================
// 8. 获取所有购物车项
// ==========================================
function getAllCartItems() {
  const items = dataManager.getAllCartItems();
  console.log('所有购物车项:', items);
  return items;
}

// ==========================================
// 9. 删除购物车项
// ==========================================
function removeCartItem(cartId) {
  dataManager.deleteCartItem(cartId);
  console.log('已删除购物车项:', cartId);
}

// ==========================================
// 导出供其他模块使用
// ==========================================
export {
  dataManager,
  cartEditor,
  addToCart,
  generateEditLink,
  saveEditChanges,
  cancelEditing,
  getAllCartItems,
  removeCartItem
};
