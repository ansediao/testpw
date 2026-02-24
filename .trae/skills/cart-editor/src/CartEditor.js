import { UrlParams } from './UrlParams.js';

/**
 * 购物车编辑器
 * 负责购物车项编辑流程管理
 */
export class CartEditor {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {DataManager} options.dataManager - 数据管理器实例（必需）
   * @param {Function} options.onLoadProduct - 加载产品的回调函数（必需）
   * @param {Function} [options.onEditStart] - 开始编辑时的回调
   * @param {Function} [options.onEditCancel] - 取消编辑时的回调
   * @param {string} [options.urlParamCart] - URL 参数名，默认 'cart'
   */
  constructor(options) {
    if (!options || !options.dataManager) {
      throw new Error('CartEditor: dataManager is required');
    }
    if (!options.onLoadProduct || typeof options.onLoadProduct !== 'function') {
      throw new Error('CartEditor: onLoadProduct callback is required');
    }

    this.dataManager = options.dataManager;
    this.onLoadProduct = options.onLoadProduct;
    this.onEditStart = options.onEditStart || (() => {});
    this.onEditCancel = options.onEditCancel || (() => {});
    this.urlParamCart = options.urlParamCart || 'cart';
    
    this.currentEditingId = null;
    this._isEditing = false;
  }

  /**
   * 检查 URL 参数并自动编辑
   * 如果 URL 中有 cart 参数，则自动加载对应购物车项
   */
  async checkUrlAndEdit() {
    const cartId = UrlParams.get(this.urlParamCart);
    if (cartId) {
      const item = this.dataManager.getCartItem(cartId);
      if (item) {
        await this.editItem(cartId);
        return true;
      } else {
        console.warn(`购物车项 ${cartId} 不存在`);
        UrlParams.remove(this.urlParamCart);
      }
    }
    return false;
  }

  /**
   * 编辑指定的购物车项
   * @param {string} cartId - 购物车项 ID
   */
  async editItem(cartId) {
    const item = this.dataManager.getCartItem(cartId);
    if (!item) {
      throw new Error(`购物车项 ${cartId} 不存在`);
    }

    this.currentEditingId = cartId;
    this._isEditing = true;

    try {
      const designData = await this.dataManager.getDesignData(cartId);

      const productData = {
        ...item,
        designData: designData || item.designData
      };

      UrlParams.set(this.urlParamCart, cartId);

      this.onEditStart(item);

      await this.onLoadProduct(productData);

      return true;
    } catch (error) {
      console.error('编辑购物车项时出错:', error);
      this._isEditing = false;
      this.currentEditingId = null;
      throw error;
    }
  }

  /**
   * 取消编辑
   */
  cancelEdit() {
    if (!this._isEditing) {
      return;
    }

    UrlParams.remove(this.urlParamCart);
    this.onEditCancel(this.currentEditingId);
    this._isEditing = false;
    this.currentEditingId = null;
  }

  /**
   * 检查是否正在编辑
   * @returns {boolean}
   */
  isEditing() {
    return this._isEditing;
  }

  /**
   * 获取当前正在编辑的购物车项 ID
   * @returns {string|null}
   */
  getCurrentEditingId() {
    return this.currentEditingId;
  }

  /**
   * 保存当前编辑（可选调用）
   * @param {Object} updatedData - 更新后的数据
   */
  async saveCurrentEdit(updatedData) {
    if (!this._isEditing || !this.currentEditingId) {
      throw new Error('当前没有正在编辑的项');
    }

    const existingItem = this.dataManager.getCartItem(this.currentEditingId);
    if (!existingItem) {
      throw new Error('购物车项不存在');
    }

    const updatedItem = {
      ...existingItem,
      ...updatedData,
      id: this.currentEditingId
    };

    this.dataManager.saveCartItem(updatedItem);

    if (updatedData.designData) {
      await this.dataManager.saveDesignData(
        this.currentEditingId, 
        updatedData.designData
      );
    }

    return updatedItem;
  }

  /**
   * 创建新购物车项
   * @param {Object} itemData - 购物车项数据
   * @param {Object} designData - 设计数据
   * @returns {Object} 创建的购物车项
   */
  async createCartItem(itemData, designData = null) {
    const id = itemData.id || DataManager.generateId();
    const item = {
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...itemData
    };

    this.dataManager.saveCartItem(item);

    if (designData) {
      await this.dataManager.saveDesignData(id, designData);
    }

    return item;
  }

  /**
   * 获取编辑链接
   * @param {string} cartId - 购物车项 ID
   * @param {string} baseUrl - 基础 URL
   * @returns {string}
   */
  getEditUrl(cartId, baseUrl = window.location.pathname) {
    const url = new URL(baseUrl, window.location.origin);
    url.searchParams.set(this.urlParamCart, cartId);
    return url.toString();
  }
}

export { DataManager } from './DataManager.js';
export { UrlParams } from './UrlParams.js';
