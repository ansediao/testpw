/**
 * 数据管理器
 * 负责 LocalStorage 和 IndexedDB 的存储操作
 */
export class DataManager {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {string} options.appName - 应用名称（必需）
   * @param {string} [options.storageKey] - LocalStorage 键名
   * @param {string} [options.dbName] - IndexedDB 数据库名
   * @param {number} [options.dbVersion] - IndexedDB 版本
   */
  constructor(options) {
    if (!options || !options.appName) {
      throw new Error('DataManager: appName is required');
    }

    this.appName = options.appName;
    this.storageKey = options.storageKey || `${this.appName}-cart-data`;
    this.dbName = options.dbName || `${this.appName}-cart`;
    this.dbVersion = options.dbVersion || 1;
    this.db = null;
    this.dbStoreName = 'designs';
  }

  /**
   * 初始化 IndexedDB
   * @returns {Promise<IDBDatabase>}
   */
  async initDB() {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('IndexedDB 打开失败'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.dbStoreName)) {
          const store = db.createObjectStore(this.dbStoreName, { keyPath: 'id' });
          store.createIndex('id', 'id', { unique: true });
        }
      };
    });
  }

  /**
   * 从 LocalStorage 获取所有购物车项
   * @returns {Object} 购物车项对象 { id: item }
   */
  getAllCartItems() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('读取购物车数据失败:', e);
      return {};
    }
  }

  /**
   * 保存购物车数据到 LocalStorage
   * @param {Object} items - 购物车项对象
   */
  saveCartItems(items) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch (e) {
      console.error('保存购物车数据失败:', e);
    }
  }

  /**
   * 保存单个购物车项
   * @param {Object} item - 购物车项
   * @returns {Object} 保存后的项
   */
  saveCartItem(item) {
    if (!item || !item.id) {
      throw new Error('购物车项必须包含 id');
    }

    const items = this.getAllCartItems();
    item.updatedAt = Date.now();
    if (!item.createdAt) {
      item.createdAt = item.updatedAt;
    }
    items[item.id] = item;
    this.saveCartItems(items);
    return item;
  }

  /**
   * 获取单个购物车项
   * @param {string} id - 购物车项 ID
   * @returns {Object|null}
   */
  getCartItem(id) {
    const items = this.getAllCartItems();
    return items[id] || null;
  }

  /**
   * 删除购物车项
   * @param {string} id - 购物车项 ID
   */
  deleteCartItem(id) {
    const items = this.getAllCartItems();
    delete items[id];
    this.saveCartItems(items);
    this.deleteDesignData(id);
  }

  /**
   * 保存完整设计数据到 IndexedDB
   * @param {string} id - 购物车项 ID
   * @param {Object} data - 设计数据
   * @returns {Promise<void>}
   */
  async saveDesignData(id, data) {
    await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.dbStoreName], 'readwrite');
      const store = transaction.objectStore(this.dbStoreName);
      const request = store.put({
        id,
        data,
        updatedAt: Date.now()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('保存设计数据失败'));
    });
  }

  /**
   * 从 IndexedDB 获取设计数据
   * @param {string} id - 购物车项 ID
   * @returns {Promise<Object|null>}
   */
  async getDesignData(id) {
    await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.dbStoreName], 'readonly');
      const store = transaction.objectStore(this.dbStoreName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result ? request.result.data : null);
      };
      request.onerror = () => reject(new Error('获取设计数据失败'));
    });
  }

  /**
   * 删除设计数据
   * @param {string} id - 购物车项 ID
   * @returns {Promise<void>}
   */
  async deleteDesignData(id) {
    try {
      await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.dbStoreName], 'readwrite');
        const store = transaction.objectStore(this.dbStoreName);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('删除设计数据失败'));
      });
    } catch (e) {
      console.warn('删除设计数据时出错:', e);
    }
  }

  /**
   * 清理过期数据（可选）
   * @param {number} days - 保留天数，默认 30 天
   */
  async cleanupOldData(days = 30) {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const items = this.getAllCartItems();
    let cleaned = 0;

    for (const id in items) {
      if (items[id].updatedAt && items[id].updatedAt < cutoff) {
        delete items[id];
        await this.deleteDesignData(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.saveCartItems(items);
    }

    return cleaned;
  }

  /**
   * 生成唯一 ID
   * @returns {string}
   */
  static generateId() {
    return Date.now().toString(36).toUpperCase() + 
           Math.random().toString(36).substr(2, 6).toUpperCase();
  }
}
