/**
 * Canvas State Manager
 * 画布状态管理器 - 负责画布状态的持久化和恢复
 * 
 * 功能：
 * - 将画布状态保存到 LocalStorage
 * - 从 LocalStorage 恢复画布状态
 * - 管理多视图状态
 * - 产品隔离（不同产品的状态独立存储）
 * 
 * 存储键名格式：pwca-canvas-state-{productId}
 * 
 * @requires VueUse (window.VueUse.useStorage)
 * @requires Pinia stores (useCanvasStore, usePrintMethodStore)
 * @requires CanvasManager (window.CanvasManager)
 */

// 数据版本号，用于迁移
const CURRENT_VERSION = '1.0.0';

const CANVAS_PERSIST_EXTRA_PROPS = [
    'id',
    'layerName',
    'layerType',
    'groupId',
    'groupOrder',
    'userInitiated',
    'isSystemImage',
    'skipLayerSync',
    'fromToolbar',
    'fromButton',
    'designMeta',
    'isBackground',
    'name'
];

/**
 * 错误类型枚举
 * @enum {string}
 */
const ErrorTypes = {
    INIT_ERROR: 'INIT_ERROR',
    URL_PARSE_ERROR: 'URL_PARSE_ERROR',
    STORAGE_UNAVAILABLE: 'STORAGE_UNAVAILABLE',
    STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
    JSON_PARSE_ERROR: 'JSON_PARSE_ERROR',
    INVALID_STATE: 'INVALID_STATE',
    INVALID_VIEW_STATE: 'INVALID_VIEW_STATE',
    INVALID_LAYER_DATA: 'INVALID_LAYER_DATA',
    INVALID_LAYER_GROUP_DATA: 'INVALID_LAYER_GROUP_DATA',
    INVALID_PRINT_METHOD_MAP: 'INVALID_PRINT_METHOD_MAP',
    VERSION_MISMATCH: 'VERSION_MISMATCH',
    MIGRATION_ERROR: 'MIGRATION_ERROR',
    SAVE_ERROR: 'SAVE_ERROR',
    RESTORE_ERROR: 'RESTORE_ERROR',
    CANVAS_ERROR: 'CANVAS_ERROR',
    STORE_ERROR: 'STORE_ERROR'
};

/**
 * 数据验证工具类
 * 提供各种数据结构的验证方法
 */
class DataValidator {
    /**
     * 验证是否为非空字符串
     * @param {*} value - 要验证的值
     * @returns {boolean}
     */
    static isNonEmptyString(value) {
        return typeof value === 'string' && value.trim().length > 0;
    }

    /**
     * 验证是否为有效对象（非 null 且为 object 类型）
     * @param {*} value - 要验证的值
     * @returns {boolean}
     */
    static isValidObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    /**
     * 验证是否为有效数组
     * @param {*} value - 要验证的值
     * @returns {boolean}
     */
    static isValidArray(value) {
        return Array.isArray(value);
    }

    /**
     * 验证是否为有效的布尔值
     * @param {*} value - 要验证的值
     * @returns {boolean}
     */
    static isValidBoolean(value) {
        return typeof value === 'boolean';
    }

    /**
     * 验证是否为有效的数字
     * @param {*} value - 要验证的值
     * @returns {boolean}
     */
    static isValidNumber(value) {
        return typeof value === 'number' && !isNaN(value);
    }

    /**
     * 验证版本号格式（语义化版本）
     * @param {*} version - 要验证的版本号
     * @returns {boolean}
     */
    static isValidVersion(version) {
        if (!DataValidator.isNonEmptyString(version)) {
            return false;
        }
        // 简单的语义化版本验证：x.y.z 格式
        const versionRegex = /^\d+\.\d+\.\d+$/;
        return versionRegex.test(version);
    }

    /**
     * 验证图层数据结构
     * @param {object} layer - 图层数据对象
     * @returns {{valid: boolean, errors: string[]}}
     */
    static validateLayerData(layer) {
        const errors = [];

        if (!DataValidator.isValidObject(layer)) {
            return { valid: false, errors: ['图层数据必须是对象'] };
        }

        // 验证必需字段
        if (!DataValidator.isNonEmptyString(layer.id)) {
            errors.push('图层缺少有效的 id 字段');
        }

        if (!DataValidator.isNonEmptyString(layer.type)) {
            errors.push('图层缺少有效的 type 字段');
        }

        // 验证可选字段的类型（如果存在）
        if (layer.name !== undefined && typeof layer.name !== 'string') {
            errors.push('图层 name 字段类型错误，应为字符串');
        }

        if (layer.locked !== undefined && !DataValidator.isValidBoolean(layer.locked)) {
            errors.push('图层 locked 字段类型错误，应为布尔值');
        }

        if (layer.groupId !== undefined && layer.groupId !== null && typeof layer.groupId !== 'string') {
            errors.push('图层 groupId 字段类型错误，应为字符串或 null');
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * 验证图层组数据结构
     * @param {object} layerGroup - 图层组数据对象
     * @returns {{valid: boolean, errors: string[]}}
     */
    static validateLayerGroupData(layerGroup) {
        const errors = [];

        if (!DataValidator.isValidObject(layerGroup)) {
            return { valid: false, errors: ['图层组数据必须是对象'] };
        }

        // 验证必需字段
        if (!DataValidator.isNonEmptyString(layerGroup.id)) {
            errors.push('图层组缺少有效的 id 字段');
        }

        if (!DataValidator.isNonEmptyString(layerGroup.name)) {
            errors.push('图层组缺少有效的 name 字段');
        }

        // 验证可选字段的类型（如果存在）
        if (layerGroup.expanded !== undefined && !DataValidator.isValidBoolean(layerGroup.expanded)) {
            errors.push('图层组 expanded 字段类型错误，应为布尔值');
        }

        if (layerGroup.locked !== undefined && !DataValidator.isValidBoolean(layerGroup.locked)) {
            errors.push('图层组 locked 字段类型错误，应为布尔值');
        }

        if (layerGroup.selectOnly !== undefined && !DataValidator.isValidBoolean(layerGroup.selectOnly)) {
            errors.push('图层组 selectOnly 字段类型错误，应为布尔值');
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * 验证印刷方式映射数据结构
     * @param {object} printMethodMap - 印刷方式映射对象
     * @returns {{valid: boolean, errors: string[]}}
     */
    static validatePrintMethodMap(printMethodMap) {
        const errors = [];

        if (!DataValidator.isValidObject(printMethodMap)) {
            return { valid: false, errors: ['印刷方式映射必须是对象'] };
        }

        // 验证每个映射项
        for (const [key, value] of Object.entries(printMethodMap)) {
            if (!DataValidator.isNonEmptyString(key)) {
                errors.push(`印刷方式映射键无效: ${key}`);
            }
            if (!DataValidator.isNonEmptyString(value)) {
                errors.push(`印刷方式映射值无效，键: ${key}`);
            }
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * 验证画布 JSON 数据结构
     * @param {object} canvasJSON - 画布 JSON 对象
     * @returns {{valid: boolean, errors: string[]}}
     */
    static validateCanvasJSON(canvasJSON) {
        const errors = [];

        if (!DataValidator.isValidObject(canvasJSON)) {
            return { valid: false, errors: ['画布 JSON 必须是对象'] };
        }

        // 验证 objects 字段（如果存在）
        if (canvasJSON.objects !== undefined && !DataValidator.isValidArray(canvasJSON.objects)) {
            errors.push('画布 JSON 的 objects 字段必须是数组');
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * 验证视图状态数据结构
     * @param {object} viewState - 视图状态对象
     * @returns {{valid: boolean, errors: string[]}}
     */
    static validateViewState(viewState) {
        const errors = [];

        if (!DataValidator.isValidObject(viewState)) {
            return { valid: false, errors: ['视图状态必须是对象'] };
        }

        // 验证 canvasJSON
        const canvasResult = DataValidator.validateCanvasJSON(viewState.canvasJSON);
        if (!canvasResult.valid) {
            errors.push(...canvasResult.errors.map(e => `canvasJSON: ${e}`));
        }

        // 验证 layers 数组
        if (!DataValidator.isValidArray(viewState.layers)) {
            errors.push('视图状态缺少有效的 layers 数组');
        } else {
            viewState.layers.forEach((layer, index) => {
                const layerResult = DataValidator.validateLayerData(layer);
                if (!layerResult.valid) {
                    errors.push(...layerResult.errors.map(e => `layers[${index}]: ${e}`));
                }
            });
        }

        // 验证 layerGroups 数组
        if (!DataValidator.isValidArray(viewState.layerGroups)) {
            errors.push('视图状态缺少有效的 layerGroups 数组');
        } else {
            viewState.layerGroups.forEach((group, index) => {
                const groupResult = DataValidator.validateLayerGroupData(group);
                if (!groupResult.valid) {
                    errors.push(...groupResult.errors.map(e => `layerGroups[${index}]: ${e}`));
                }
            });
        }

        // 验证印刷方式映射
        if (!DataValidator.isValidObject(viewState.layerPrintMethodMap)) {
            errors.push('视图状态缺少有效的 layerPrintMethodMap 对象');
        }

        if (!DataValidator.isValidObject(viewState.groupPrintMethodMap)) {
            errors.push('视图状态缺少有效的 groupPrintMethodMap 对象');
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * 验证完整的持久化状态数据结构
     * @param {object} state - 完整状态对象
     * @returns {{valid: boolean, errors: string[]}}
     */
    static validatePersistedState(state) {
        const errors = [];

        if (!DataValidator.isValidObject(state)) {
            return { valid: false, errors: ['状态数据必须是对象'] };
        }

        // 验证版本号
        if (!DataValidator.isValidVersion(state.version)) {
            errors.push('状态数据缺少有效的 version 字段');
        }

        // 验证产品 ID
        if (!DataValidator.isNonEmptyString(state.productId)) {
            errors.push('状态数据缺少有效的 productId 字段');
        }

        // 验证 views 对象
        if (!DataValidator.isValidObject(state.views)) {
            errors.push('状态数据缺少有效的 views 对象');
        } else {
            // 验证每个视图状态
            for (const [viewId, viewState] of Object.entries(state.views)) {
                const viewResult = DataValidator.validateViewState(viewState);
                if (!viewResult.valid) {
                    errors.push(...viewResult.errors.map(e => `views[${viewId}]: ${e}`));
                }
            }
        }

        // 验证 selectedColorsByView（可选字段）
        if (state.selectedColorsByView !== undefined && !DataValidator.isValidObject(state.selectedColorsByView)) {
            errors.push('状态数据的 selectedColorsByView 字段类型错误');
        }

        // 验证 lastModified（可选字段）
        if (state.lastModified !== undefined && !DataValidator.isValidNumber(state.lastModified)) {
            errors.push('状态数据的 lastModified 字段类型错误');
        }

        return { valid: errors.length === 0, errors };
    }
}

/**
 * 错误处理工具类
 * 提供统一的错误处理和日志记录方法
 */
class ErrorHandler {
    /**
     * 记录错误日志
     * @param {string} errorType - 错误类型
     * @param {*} details - 错误详情
     * @param {Error} [error] - 原始错误对象
     */
    static logError(errorType, details, error = null) {
        console.error('[CanvasStateManager] 错误类型:', errorType, '详情:', details);
        if (error && error.stack) {
            console.error('[CanvasStateManager] 堆栈:', error.stack);
        }
    }

    /**
     * 记录警告日志
     * @param {string} message - 警告消息
     * @param {*} [details] - 额外详情
     */
    static logWarning(message, details = null) {
        if (details !== null) {
            console.warn('[CanvasStateManager]', message, details);
        } else {
            console.warn('[CanvasStateManager]', message);
        }
    }

    /**
     * 记录信息日志
     * @param {string} message - 信息消息
     * @param {*} [details] - 额外详情
     */
    static logInfo(message, details = null) {
        if (details !== null) {
            console.log('[CanvasStateManager]', message, details);
        } else {
            console.log('[CanvasStateManager]', message);
        }
    }

    /**
     * 检查 LocalStorage 是否可用
     * @returns {boolean}
     */
    static isLocalStorageAvailable() {
        try {
            const testKey = '__canvas_state_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * 检查是否为存储配额超限错误
     * @param {Error} error - 错误对象
     * @returns {boolean}
     */
    static isQuotaExceededError(error) {
        if (!error) return false;
        
        // 不同浏览器的配额超限错误名称不同
        const quotaErrorNames = [
            'QuotaExceededError',
            'NS_ERROR_DOM_QUOTA_REACHED',
            'QUOTA_EXCEEDED_ERR'
        ];
        
        return quotaErrorNames.includes(error.name) ||
               (error.code && (error.code === 22 || error.code === 1014));
    }

    /**
     * 安全解析 JSON
     * @param {string} jsonString - JSON 字符串
     * @returns {{success: boolean, data: object|null, error: Error|null}}
     */
    static safeParseJSON(jsonString) {
        try {
            if (typeof jsonString !== 'string') {
                return { success: false, data: null, error: new Error('输入不是字符串') };
            }
            const data = JSON.parse(jsonString);
            return { success: true, data, error: null };
        } catch (error) {
            return { success: false, data: null, error };
        }
    }

    /**
     * 安全序列化 JSON
     * @param {object} data - 要序列化的数据
     * @returns {{success: boolean, json: string|null, error: Error|null}}
     */
    static safeStringifyJSON(data) {
        try {
            const json = JSON.stringify(data);
            return { success: true, json, error: null };
        } catch (error) {
            return { success: false, json: null, error };
        }
    }
}

/**
 * 画布状态管理器类
 */
class CanvasStateManager {
    constructor() {
        /**
         * 当前产品ID
         * @type {string|null}
         */
        this.productId = null;
        
        /**
         * VueUse useStorage 实例
         * @type {object|null}
         */
        this.storage = null;
        
        /**
         * 防抖保存定时器
         * @type {number|null}
         */
        this.saveDebounceTimer = null;
        
        /**
         * 防抖保存延迟时间（毫秒）
         * @type {number}
         */
        this.SAVE_DEBOUNCE_MS = 300;
        
        /**
         * 是否已初始化
         * @type {boolean}
         */
        this.initialized = false;
        
        /**
         * 是否使用内存存储（降级模式）
         * @type {boolean}
         */
        this.usingMemoryStorage = false;
    }
    
    /**
     * 获取存储键名
     * @param {string} productId - 产品ID
     * @returns {string} 存储键名
     */
    getStorageKey(productId) {
        return `pwca-canvas-state-${productId}`;
    }
    
    /**
     * 从 URL 获取产品 ID
     * @returns {string|null} 产品ID，如果未找到则返回 null
     */
    getProductIdFromUrl() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('product_id');
            
            if (productId && productId !== 'unknown') {
                return productId;
            }
            
            // 备用方案：尝试从 URL 路径中提取
            const pathMatch = window.location.pathname.match(/\/product\/(\d+)/);
            if (pathMatch && pathMatch[1]) {
                return pathMatch[1];
            }
            
            return null;
        } catch (error) {
            console.error('[CanvasStateManager] 错误类型:', 'URL_PARSE_ERROR', '详情:', error);
            return null;
        }
    }
    
    /**
     * 初始化状态管理器
     * @param {string} [productId] - 产品ID（可选，如果不提供则从 URL 获取）
     * @returns {boolean} 是否初始化成功
     */
    init(productId) {
        try {
            // 获取产品 ID
            this.productId = productId || this.getProductIdFromUrl();
            
            if (!this.productId) {
                ErrorHandler.logWarning('无法获取产品ID，状态持久化功能将被禁用');
                return false;
            }
            
            // 检查 LocalStorage 是否可用
            const localStorageAvailable = ErrorHandler.isLocalStorageAvailable();
            
            // 检查 VueUse 是否可用
            if (!window.VueUse || !window.VueUse.useStorage) {
                ErrorHandler.logWarning('VueUse.useStorage 不可用，将使用内存存储');
                this.storage = this._createMemoryStorage();
                this.usingMemoryStorage = true;
            } else if (!localStorageAvailable) {
                // LocalStorage 不可用，降级为内存存储
                ErrorHandler.logError(ErrorTypes.STORAGE_UNAVAILABLE, 'LocalStorage 不可用，将使用内存存储（数据不会持久化）');
                this.storage = this._createMemoryStorage();
                this.usingMemoryStorage = true;
            } else {
                // 使用 VueUse useStorage 初始化存储
                const storageKey = this.getStorageKey(this.productId);
                
                try {
                    this.storage = window.VueUse.useStorage(storageKey, this._createEmptyState());
                    this.usingMemoryStorage = false;
                    
                    // 验证并迁移已存储的数据
                    this._validateAndMigrateStoredData();
                } catch (storageError) {
                    // 处理存储初始化错误
                    if (ErrorHandler.isQuotaExceededError(storageError)) {
                        ErrorHandler.logError(ErrorTypes.STORAGE_QUOTA_EXCEEDED, '存储配额已满，尝试清理旧数据');
                        this._handleQuotaExceeded();
                    } else {
                        ErrorHandler.logError(ErrorTypes.INIT_ERROR, '存储初始化失败，降级为内存存储', storageError);
                        this.storage = this._createMemoryStorage();
                        this.usingMemoryStorage = true;
                    }
                }
            }
            
            this.initialized = true;
            ErrorHandler.logInfo('初始化成功，产品ID:', this.productId);
            if (this.usingMemoryStorage) {
                ErrorHandler.logWarning('当前使用内存存储，页面刷新后数据将丢失');
            }
            
            return true;
        } catch (error) {
            ErrorHandler.logError(ErrorTypes.INIT_ERROR, '初始化失败', error);
            return false;
        }
    }
    
    /**
     * 验证并迁移已存储的数据
     * @private
     */
    _validateAndMigrateStoredData() {
        try {
            const state = this.getState();
            if (!state || Object.keys(state).length === 0) {
                // 没有存储的数据，无需迁移
                return;
            }
            
            // 使用详细验证
            const validationResult = DataValidator.validatePersistedState(state);
            
            if (!validationResult.valid) {
                ErrorHandler.logWarning('存储数据验证失败，尝试迁移:', validationResult.errors);
                
                // 尝试迁移数据
                const migratedState = this.migrateState(state);
                const migratedValidation = DataValidator.validatePersistedState(migratedState);
                
                if (migratedValidation.valid) {
                    this._updateState(migratedState);
                    ErrorHandler.logInfo('数据迁移成功');
                } else {
                    // 迁移后仍然无效，清除损坏数据
                    ErrorHandler.logError(ErrorTypes.MIGRATION_ERROR, '数据迁移失败，将清除损坏数据', migratedValidation.errors);
                    this._updateState(this._createEmptyState());
                }
            }
        } catch (error) {
            ErrorHandler.logError(ErrorTypes.MIGRATION_ERROR, '验证/迁移过程出错', error);
            // 出错时重置为空状态
            this._updateState(this._createEmptyState());
        }
    }
    
    /**
     * 处理存储配额超限
     * @private
     */
    _handleQuotaExceeded() {
        try {
            // 尝试清除当前产品的旧数据
            const storageKey = this.getStorageKey(this.productId);
            localStorage.removeItem(storageKey);
            
            // 重新尝试初始化存储
            this.storage = window.VueUse.useStorage(storageKey, this._createEmptyState());
            this.usingMemoryStorage = false;
            
            ErrorHandler.logInfo('已清除旧数据，存储重新初始化成功');
        } catch (error) {
            // 如果仍然失败，降级为内存存储
            ErrorHandler.logError(ErrorTypes.STORAGE_QUOTA_EXCEEDED, '清理后仍无法使用存储，降级为内存存储', error);
            this.storage = this._createMemoryStorage();
            this.usingMemoryStorage = true;
        }
    }
    
    /**
     * 创建空的状态对象
     * @returns {object} 空状态对象
     * @private
     */
    _createEmptyState() {
        return {
            version: CURRENT_VERSION,
            productId: this.productId,
            lastModified: Date.now(),
            views: {},
            selectedColorsByView: {}
        };
    }
    
    /**
     * 创建内存存储（当 LocalStorage 不可用时的降级方案）
     * @returns {object} 内存存储对象
     * @private
     */
    _createMemoryStorage() {
        const state = this._createEmptyState();
        return {
            value: state,
            // 模拟 ref 的行为
            get() {
                return this.value;
            },
            set(newValue) {
                this.value = newValue;
            }
        };
    }
    
    /**
     * 获取当前存储的状态
     * @returns {object|null} 存储的状态对象
     */
    getState() {
        if (!this.initialized || !this.storage) {
            return null;
        }
        
        try {
            // VueUse useStorage 返回的是 ref，需要访问 .value
            const state = this.storage.value || this.storage;
            return state;
        } catch (error) {
            ErrorHandler.logError(ErrorTypes.RESTORE_ERROR, '获取状态失败', error);
            return null;
        }
    }
    
    /**
     * 更新存储的状态
     * @param {object} newState - 新的状态对象
     * @returns {boolean} 是否更新成功
     * @private
     */
    _updateState(newState) {
        if (!this.initialized || !this.storage) {
            return false;
        }
        
        try {
            newState.lastModified = Date.now();
            
            // VueUse useStorage 返回的是 ref
            if (this.storage.value !== undefined) {
                this.storage.value = newState;
            } else {
                this.storage = newState;
            }
            
            return true;
        } catch (error) {
            // 检查是否为存储配额超限错误
            if (ErrorHandler.isQuotaExceededError(error)) {
                ErrorHandler.logError(ErrorTypes.STORAGE_QUOTA_EXCEEDED, '存储配额已满，无法保存状态');
                
                // 尝试清理并重试
                if (!this.usingMemoryStorage) {
                    this._handleQuotaExceeded();
                    // 重试一次
                    try {
                        if (this.storage.value !== undefined) {
                            this.storage.value = newState;
                        } else {
                            this.storage = newState;
                        }
                        return true;
                    } catch (retryError) {
                        ErrorHandler.logError(ErrorTypes.STORAGE_QUOTA_EXCEEDED, '重试保存失败', retryError);
                    }
                }
            } else {
                ErrorHandler.logError(ErrorTypes.SAVE_ERROR, '更新状态失败', error);
            }
            
            return false;
        }
    }
    
    /**
     * 验证状态数据的有效性
     * @param {object} state - 要验证的状态对象
     * @returns {boolean} 是否有效
     */
    validateState(state) {
        const result = DataValidator.validatePersistedState(state);
        if (!result.valid && result.errors.length > 0) {
            ErrorHandler.logWarning('状态验证失败:', result.errors);
        }
        return result.valid;
    }
    
    /**
     * 详细验证状态数据
     * @param {object} state - 要验证的状态对象
     * @returns {{valid: boolean, errors: string[]}} 验证结果
     */
    validateStateDetailed(state) {
        return DataValidator.validatePersistedState(state);
    }
    
    /**
     * 迁移旧版本数据
     * @param {object} state - 旧状态对象
     * @returns {object} 迁移后的状态对象
     */
    migrateState(state) {
        if (!state) {
            return this._createEmptyState();
        }
        
        try {
            // 创建状态副本以避免修改原始对象
            const migratedState = JSON.parse(JSON.stringify(state));
            
            // 如果没有版本号，假设是旧版本数据
            if (!migratedState.version) {
                ErrorHandler.logInfo('检测到无版本号数据，迁移到版本', CURRENT_VERSION);
                migratedState.version = CURRENT_VERSION;
            }
            
            // 确保 lastModified 存在
            if (!migratedState.lastModified) {
                migratedState.lastModified = Date.now();
            }
            
            // 确保必需字段存在
            if (!migratedState.views || typeof migratedState.views !== 'object') {
                migratedState.views = {};
            }
            
            if (!migratedState.selectedColorsByView || typeof migratedState.selectedColorsByView !== 'object') {
                migratedState.selectedColorsByView = {};
            }
            
            if (!migratedState.productId) {
                migratedState.productId = this.productId;
            }
            
            // 迁移每个视图的数据结构
            for (const viewId of Object.keys(migratedState.views)) {
                const viewState = migratedState.views[viewId];
                if (viewState) {
                    // 确保视图状态的必需字段存在
                    if (!viewState.layers || !Array.isArray(viewState.layers)) {
                        viewState.layers = [];
                    }
                    if (!viewState.layerGroups || !Array.isArray(viewState.layerGroups)) {
                        viewState.layerGroups = [];
                    }
                    if (!viewState.layerPrintMethodMap || typeof viewState.layerPrintMethodMap !== 'object') {
                        viewState.layerPrintMethodMap = {};
                    }
                    if (!viewState.groupPrintMethodMap || typeof viewState.groupPrintMethodMap !== 'object') {
                        viewState.groupPrintMethodMap = {};
                    }
                    if (!viewState.canvasJSON || typeof viewState.canvasJSON !== 'object') {
                        viewState.canvasJSON = { objects: [] };
                    }
                    
                    // 迁移图层数据：确保每个图层有必需字段
                    viewState.layers = viewState.layers.map((layer, index) => {
                        if (!layer || typeof layer !== 'object') {
                            return null;
                        }
                        return {
                            id: layer.id || `layer_${index}_${Date.now()}`,
                            type: layer.type || 'unknown',
                            name: layer.name || `图层 ${index + 1}`,
                            locked: Boolean(layer.locked),
                            groupId: layer.groupId || null
                        };
                    }).filter(layer => layer !== null);
                    
                    // 迁移图层组数据：确保每个图层组有必需字段
                    viewState.layerGroups = viewState.layerGroups.map((group, index) => {
                        if (!group || typeof group !== 'object') {
                            return null;
                        }
                        return {
                            id: group.id || `group_${index}_${Date.now()}`,
                            name: group.name || `图层组 ${index + 1}`,
                            expanded: group.expanded !== undefined ? Boolean(group.expanded) : true,
                            locked: Boolean(group.locked),
                            selectOnly: Boolean(group.selectOnly)
                        };
                    }).filter(group => group !== null);
                }
            }
            
            // 版本迁移逻辑
            // 从 1.0.0 迁移到未来版本时在这里添加
            // if (migratedState.version === '1.0.0') {
            //     // 迁移到 1.1.0
            //     migratedState.version = '1.1.0';
            // }
            
            return migratedState;
        } catch (error) {
            ErrorHandler.logError(ErrorTypes.MIGRATION_ERROR, '数据迁移过程出错', error);
            return this._createEmptyState();
        }
    }
    
    /**
     * 检查是否已初始化
     * @returns {boolean} 是否已初始化
     */
    isInitialized() {
        return this.initialized;
    }
    
    /**
     * 获取当前产品ID
     * @returns {string|null} 产品ID
     */
    getProductId() {
        return this.productId;
    }
    
    /**
     * 获取数据版本号
     * @returns {string} 版本号
     */
    getVersion() {
        return CURRENT_VERSION;
    }
    
    /**
     * 保存指定视图的画布状态
     * @param {string} viewId - 视图ID
     * @returns {boolean} 是否保存成功
     */
    saveViewState(viewId) {
        if (!this.initialized || !this.storage) {
            ErrorHandler.logWarning('未初始化，无法保存状态');
            return false;
        }
        
        if (!viewId) {
            ErrorHandler.logWarning('视图ID为空，无法保存状态');
            return false;
        }
        
        try {
            // 检查是否正在恢复状态，防止循环保存
            const canvasStore = window.useCanvasStore ? window.useCanvasStore() : null;
            if (canvasStore && canvasStore.isRestoringState) {
                return false;
            }
            
            // 从 CanvasManager 获取画布实例
            const canvas = window.CanvasManager ? window.CanvasManager.getCanvas(viewId) : null;
            if (!canvas) {
                ErrorHandler.logWarning('无法获取画布实例，viewId:', viewId);
                return false;
            }
            
            const canvasJSON = canvas.toJSON(CANVAS_PERSIST_EXTRA_PROPS);
            
            // 从 Canvas Store 获取图层和图层组数据
            const layers = canvasStore ? canvasStore.getViewLayers(viewId) : [];
            const layerGroups = canvasStore ? canvasStore.getViewLayerGroups(viewId) : [];
            
            // 转换图层数据为持久化格式
            const layerData = layers.map(layer => ({
                id: layer.id,
                type: layer.type,
                name: layer.name,
                locked: layer.locked || false,
                groupId: layer.groupId || null
            }));
            
            // 转换图层组数据为持久化格式
            const layerGroupData = layerGroups.map(group => ({
                id: group.id,
                name: group.name,
                expanded: group.expanded !== undefined ? group.expanded : true,
                locked: group.locked || false,
                selectOnly: group.selectOnly || false
            }));
            
            // 从 Print Method Store 获取印刷方式映射
            const printMethodStore = window.usePrintMethodStore ? window.usePrintMethodStore() : null;
            const layerPrintMethodMap = {};
            const groupPrintMethodMap = {};
            
            if (printMethodStore) {
                // 获取当前视图相关的图层印刷方式映射
                layers.forEach(layer => {
                    const methodId = printMethodStore.layerPrintMethodMap[layer.id];
                    if (methodId) {
                        layerPrintMethodMap[layer.id] = methodId;
                    }
                });
                
                // 获取当前视图相关的图层组印刷方式映射
                layerGroups.forEach(group => {
                    const methodId = printMethodStore.groupPrintMethodMap[group.id];
                    if (methodId) {
                        groupPrintMethodMap[group.id] = methodId;
                    }
                });
            }
            
            // 组装完整的 ViewState 数据结构
            const viewState = {
                canvasJSON: canvasJSON,
                layers: layerData,
                layerGroups: layerGroupData,
                layerPrintMethodMap: layerPrintMethodMap,
                groupPrintMethodMap: groupPrintMethodMap
            };
            
            // 验证视图状态数据
            const validationResult = DataValidator.validateViewState(viewState);
            if (!validationResult.valid) {
                ErrorHandler.logWarning('视图状态数据验证失败，但仍尝试保存:', validationResult.errors);
            }
            
            // 获取当前状态并更新
            const state = this.getState();
            if (!state) {
                ErrorHandler.logError(ErrorTypes.SAVE_ERROR, '无法获取当前状态');
                return false;
            }
            
            // 确保 views 对象存在
            if (!state.views) {
                state.views = {};
            }
            
            // 保存视图状态
            state.views[viewId] = viewState;
            
            // 更新状态
            return this._updateState(state);
        } catch (error) {
            ErrorHandler.logError(ErrorTypes.SAVE_ERROR, `保存视图状态失败，viewId: ${viewId}`, error);
            return false;
        }
    }
    
    /**
     * 防抖保存视图状态
     * 使用防抖机制避免频繁写入 LocalStorage
     * @param {string} viewId - 视图ID
     */
    debouncedSaveViewState(viewId) {
        // 检查是否正在恢复状态，防止循环保存
        const canvasStore = window.useCanvasStore ? window.useCanvasStore() : null;
        if (canvasStore && canvasStore.isRestoringState) {
            return;
        }
        
        // 清除之前的定时器
        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
        }
        
        // 设置新的防抖定时器
        this.saveDebounceTimer = setTimeout(() => {
            this.saveViewState(viewId);
            this.saveDebounceTimer = null;
        }, this.SAVE_DEBOUNCE_MS);
    }
    
    /**
     * 保存所有视图的状态
     * @returns {boolean} 是否保存成功
     */
    saveAllViewStates() {
        if (!this.initialized || !this.storage) {
            ErrorHandler.logWarning('未初始化，无法保存所有视图状态');
            return false;
        }
        
        try {
            // 检查是否正在恢复状态，防止循环保存
            const canvasStore = window.useCanvasStore ? window.useCanvasStore() : null;
            if (canvasStore && canvasStore.isRestoringState) {
                return false;
            }
            
            // 获取所有视图ID
            const viewIds = window.CanvasManager ? window.CanvasManager.getViewIds() : [];
            
            if (viewIds.length === 0) {
                ErrorHandler.logWarning('没有可保存的视图');
                return false;
            }
            
            // 遍历所有视图并保存状态
            let allSuccess = true;
            viewIds.forEach(viewId => {
                const success = this.saveViewState(viewId);
                if (!success) {
                    allSuccess = false;
                }
            });
            
            // 保存 selectedColorsByView 数据
            if (canvasStore && canvasStore.selectedColorsByView) {
                const state = this.getState();
                if (state) {
                    state.selectedColorsByView = { ...canvasStore.selectedColorsByView };
                    this._updateState(state);
                }
            }
            
            return allSuccess;
        } catch (error) {
            ErrorHandler.logError(ErrorTypes.SAVE_ERROR, '保存所有视图状态失败', error);
            return false;
        }
    }
    
    /**
     * 保存颜色选择数据
     * @returns {boolean} 是否保存成功
     */
    saveColorSelections() {
        if (!this.initialized || !this.storage) {
            return false;
        }
        
        try {
            const canvasStore = window.useCanvasStore ? window.useCanvasStore() : null;
            if (!canvasStore) {
                return false;
            }
            
            // 检查是否正在恢复状态
            if (canvasStore.isRestoringState) {
                return false;
            }
            
            const state = this.getState();
            if (!state) {
                return false;
            }
            
            // 保存颜色选择数据
            state.selectedColorsByView = { ...canvasStore.selectedColorsByView };
            return this._updateState(state);
        } catch (error) {
            ErrorHandler.logError(ErrorTypes.SAVE_ERROR, '保存颜色选择失败', error);
            return false;
        }
    }

    /**
     * 使用外部状态覆盖当前存储状态
     * 通常用于从服务器或购物车中恢复特定订单的画布状态
     * @param {object} externalState - 外部提供的完整状态对象
     * @returns {boolean} 是否应用成功
     */
    loadExternalState(externalState) {
        if (!this.initialized || !this.storage) {
            ErrorHandler.logWarning('未初始化，无法应用外部画布状态');
            return false;
        }

        if (!externalState || typeof externalState !== 'object') {
            ErrorHandler.logWarning('外部画布状态无效，必须是对象');
            return false;
        }

        try {
            // 深拷贝以避免修改原始对象
            const cloned = JSON.parse(JSON.stringify(externalState));

            // 确保 productId 与当前产品一致
            if (!cloned.productId || String(cloned.productId) !== String(this.productId)) {
                cloned.productId = this.productId || this.getProductIdFromUrl() || '';
            }

            // 确保版本号存在
            if (!cloned.version) {
                cloned.version = CURRENT_VERSION;
            }

            // 通过迁移函数补全缺失字段
            const migrated = this.migrateState(cloned);

            // 验证外部状态结构是否有效
            const validation = DataValidator.validatePersistedState(migrated);
            if (!validation.valid) {
                ErrorHandler.logError(ErrorTypes.INVALID_STATE, '外部画布状态数据验证失败', validation.errors);
                return false;
            }

            return this._updateState(migrated);
        } catch (error) {
            ErrorHandler.logError(ErrorTypes.MIGRATION_ERROR, '应用外部画布状态失败', error);
            return false;
        }
    }
    
    /**
     * 验证视图状态数据的有效性
     * @param {object} viewState - 要验证的视图状态对象
     * @returns {boolean} 是否有效
     * @private
     */
    _validateViewState(viewState) {
        const result = DataValidator.validateViewState(viewState);
        if (!result.valid && result.errors.length > 0) {
            ErrorHandler.logWarning('视图状态验证失败:', result.errors);
        }
        return result.valid;
    }
    
    /**
     * 详细验证视图状态数据
     * @param {object} viewState - 要验证的视图状态对象
     * @returns {{valid: boolean, errors: string[]}} 验证结果
     */
    validateViewStateDetailed(viewState) {
        return DataValidator.validateViewState(viewState);
    }
    
    /**
     * 恢复指定视图的画布状态
     * @param {string} viewId - 视图ID
     * @returns {Promise<boolean>} 是否成功恢复
     */
    async restoreViewState(viewId) {
        if (!this.initialized || !this.storage) {
            ErrorHandler.logWarning('未初始化，无法恢复状态');
            return false;
        }
        
        if (!viewId) {
            ErrorHandler.logWarning('视图ID为空，无法恢复状态');
            return false;
        }
        
        try {
            // 获取 Canvas Store 并设置恢复状态标记
            const canvasStore = window.useCanvasStore ? window.useCanvasStore() : null;
            if (canvasStore && canvasStore.setRestoringState) {
                canvasStore.setRestoringState(true);
            }
            
            try {
                // 从 LocalStorage 读取状态数据
                const state = this.getState();
                if (!state) {
                    ErrorHandler.logWarning('无法获取存储状态');
                    return false;
                }
                
                // 验证数据有效性（版本号）
                if (!this.validateState(state)) {
                    ErrorHandler.logWarning('存储状态数据无效，尝试迁移');
                    const migratedState = this.migrateState(state);
                    if (!this.validateState(migratedState)) {
                        ErrorHandler.logError(ErrorTypes.INVALID_STATE, '状态数据迁移后仍然无效');
                        return false;
                    }
                    this._updateState(migratedState);
                }
                
                // 检查是否存在该视图的状态
                if (!state.views || !state.views[viewId]) {
                    ErrorHandler.logInfo('视图状态不存在，viewId:', viewId);
                    return false;
                }
                
                const viewState = state.views[viewId];
                
                // 验证视图状态数据的有效性
                if (!this._validateViewState(viewState)) {
                    ErrorHandler.logError(ErrorTypes.INVALID_VIEW_STATE, `视图状态数据无效，viewId: ${viewId}`);
                    return false;
                }
                
                // 获取画布实例
                const canvas = window.CanvasManager ? window.CanvasManager.getCanvas(viewId) : null;
                if (!canvas) {
                    ErrorHandler.logWarning('无法获取画布实例，viewId:', viewId);
                    return false;
                }
                
                // 使用 fabric.loadFromJSON 恢复画布对象
                try {
                    await this._restoreCanvasObjects(canvas, viewState.canvasJSON);
                } catch (canvasError) {
                    // 即使画布恢复出错，也继续尝试恢复图层数据
                    // 因为对象可能已经被部分添加到画布
                    ErrorHandler.logWarning('画布对象恢复过程中出现错误，但将继续恢复图层数据:', canvasError);
                }
                
                // 恢复图层数据（传入 canvas 以便在图层数据为空时从画布对象重建）
                this._restoreLayerData(viewId, viewState.layers, viewState.layerGroups, canvas);
                
                // 恢复印刷方式映射
                this._restorePrintMethodMappings(viewId, viewState.layerPrintMethodMap, viewState.groupPrintMethodMap);
                
                // 恢复颜色选择
                this._restoreColorSelections(state.selectedColorsByView);
                
                ErrorHandler.logInfo('视图状态恢复成功，viewId:', viewId);
                return true;
            } finally {
                // 确保恢复状态标记被重置
                if (canvasStore && canvasStore.setRestoringState) {
                    canvasStore.setRestoringState(false);
                }
            }
        } catch (error) {
            ErrorHandler.logError(ErrorTypes.RESTORE_ERROR, `恢复视图状态失败，viewId: ${viewId}`, error);
            
            // 确保恢复状态标记被重置
            const canvasStore = window.useCanvasStore ? window.useCanvasStore() : null;
            if (canvasStore && canvasStore.setRestoringState) {
                canvasStore.setRestoringState(false);
            }
            
            return false;
        }
    }
    
    /**
     * 恢复画布对象
     * @param {fabric.Canvas} canvas - Fabric.js 画布实例
     * @param {object} canvasJSON - 画布 JSON 数据
     * @returns {Promise<void>}
     * @private
     */
    _restoreCanvasObjects(canvas, canvasJSON) {
        return new Promise((resolve, reject) => {
            try {
                if (!canvas || !canvasJSON) {
                    resolve();
                    return;
                }
                
                // 保存当前背景色（如果有）
                const currentBackgroundColor = canvas.backgroundColor;
                
                // 清除现有对象（但保留背景）
                const existingObjects = canvas.getObjects();
                existingObjects.forEach(obj => {
                    // 跳过背景相关的对象
                    if (obj.isBackground || obj.name === 'background') {
                        return;
                    }
                    canvas.remove(obj);
                });
                
                // 检查 canvasJSON 是否有对象需要恢复
                let objectsToRestore = canvasJSON.objects || [];
                
                if (objectsToRestore.length === 0) {
                    canvas.renderAll();
                    resolve();
                    return;
                }
                
                // 清理不兼容的属性（修复 Fabric.js 兼容性问题）
                objectsToRestore = objectsToRestore.map(obj => {
                    const cleanedObj = { ...obj };
                    // 移除 pathAlign 属性，它会导致 "alphabetical is not a valid enum value" 错误
                    if (cleanedObj.pathAlign !== undefined) {
                        delete cleanedObj.pathAlign;
                    }
                    // 移除其他可能导致问题的属性
                    if (cleanedObj.pathSide !== undefined) {
                        delete cleanedObj.pathSide;
                    }
                    if (cleanedObj.pathStartOffset !== undefined) {
                        delete cleanedObj.pathStartOffset;
                    }
                    return cleanedObj;
                });
                
                // 使用 fabric.util.enlivenObjects 处理图片对象的异步加载
                fabric.util.enlivenObjects(objectsToRestore, (objects) => {
                    try {
                        objects.forEach(obj => {
                            // 跳过背景相关的对象
                            if (obj.isBackground || obj.name === 'background') {
                                return;
                            }
                            canvas.add(obj);
                        });
                        
                        // 恢复背景色（如果 JSON 中没有指定，保留当前背景色）
                        if (canvasJSON.background) {
                            canvas.setBackgroundColor(canvasJSON.background, () => {
                                canvas.renderAll();
                            });
                        } else if (currentBackgroundColor) {
                            canvas.setBackgroundColor(currentBackgroundColor, () => {
                                canvas.renderAll();
                            });
                        } else {
                            canvas.renderAll();
                        }
                        
                        resolve();
                    } catch (innerError) {
                        ErrorHandler.logError(ErrorTypes.CANVAS_ERROR, '恢复画布对象时出错', innerError);
                        reject(innerError);
                    }
                }, null, (error) => {
                    ErrorHandler.logError(ErrorTypes.CANVAS_ERROR, 'fabric.util.enlivenObjects 回调错误', error);
                    reject(error);
                });
            } catch (error) {
                ErrorHandler.logError(ErrorTypes.CANVAS_ERROR, '恢复画布对象失败', error);
                reject(error);
            }
        });
    }
    
    /**
     * 恢复图层数据
     * @param {string} viewId - 视图ID
     * @param {Array} layers - 图层数据数组
     * @param {Array} layerGroups - 图层组数据数组
     * @param {fabric.Canvas} canvas - 画布实例（可选，用于从画布对象重建图层）
     * @private
     */
    _restoreLayerData(viewId, layers, layerGroups, canvas = null) {
        try {
            const canvasStore = window.useCanvasStore ? window.useCanvasStore() : null;
            if (!canvasStore) {
                ErrorHandler.logWarning('Canvas Store 不可用，无法恢复图层数据');
                return;
            }
            
            let layersToRestore = layers || [];
            let layerGroupsToRestore = layerGroups || [];
            
            let userObjects = [];
            if (canvas && typeof canvas.getObjects === 'function') {
                const canvasObjects = canvas.getObjects();
                userObjects = canvasObjects.filter(obj => {
                    return obj && !obj.isBackground && obj.name !== 'background';
                });
            }
            
            if (layersToRestore.length > 0 && userObjects.length > 0) {
                const minLen = Math.min(layersToRestore.length, userObjects.length);
                for (let i = 0; i < minLen; i++) {
                    const layer = layersToRestore[i];
                    const obj = userObjects[i];
                    if (!layer || !obj) {
                        continue;
                    }
                    
                    if (!obj.id) {
                        obj.id = layer.id;
                    }
                    if (!obj.layerName && layer.name) {
                        obj.layerName = layer.name;
                    }
                    if (!obj.layerType && layer.type) {
                        obj.layerType = layer.type;
                    }
                    if (!obj.groupId && layer.groupId) {
                        obj.groupId = layer.groupId;
                    }
                    if (typeof layer.groupOrder === 'number' && (obj.groupOrder === undefined || obj.groupOrder === null)) {
                        obj.groupOrder = layer.groupOrder;
                    }
                }
            }
            
            if (layersToRestore.length === 0 && userObjects.length > 0) {
                ErrorHandler.logInfo('从画布对象重建图层列表，对象数:', userObjects.length);
                layersToRestore = userObjects.map((obj, index) => {
                    if (!obj) {
                        return null;
                    }
                    
                    if (!obj.id) {
                        obj.id = `layer_${index}_${Date.now()}`;
                    }
                    
                    let layerName = obj.layerName;
                    if (!layerName) {
                        if (obj.type === 'text' || obj.type === 'i-text') {
                            const text = obj.text || '';
                            layerName = text.length > 15 ? text.substring(0, 15) + '...' : text;
                        } else if (obj.type === 'image') {
                            layerName = 'Image ' + Date.now().toString().slice(-4);
                        } else {
                            layerName = 'Layer ' + (index + 1);
                        }
                    }
                    
                    let layerType = obj.layerType;
                    if (!layerType) {
                        if (obj.type === 'text' || obj.type === 'i-text') {
                            layerType = 'text';
                        } else if (obj.type === 'image') {
                            layerType = 'image';
                        } else {
                            layerType = 'other';
                        }
                    }
                    
                    return {
                        id: obj.id,
                        name: layerName,
                        type: layerType,
                        visible: obj.visible !== false,
                        locked: obj.selectable === false,
                        groupId: obj.groupId || null,
                        groupOrder: obj.groupOrder || 0
                    };
                }).filter(layerItem => layerItem !== null);
            }
            
            // 检查是否有 restoreViewData 方法
            if (typeof canvasStore.restoreViewData === 'function') {
                canvasStore.restoreViewData(viewId, { layers: layersToRestore, layerGroups: layerGroupsToRestore });
            } else {
                // 降级方案：使用现有方法
                canvasStore.setViewLayers(viewId, layersToRestore);
                canvasStore.setViewLayerGroups(viewId, layerGroupsToRestore);
            }
            
            ErrorHandler.logInfo('图层数据恢复成功，viewId:', viewId + '，图层数: ' + layersToRestore.length + '，图层组数: ' + layerGroupsToRestore.length);
        } catch (error) {
            ErrorHandler.logError(ErrorTypes.STORE_ERROR, `恢复图层数据失败，viewId: ${viewId}`, error);
        }
    }
    
    /**
     * 恢复印刷方式映射
     * @param {string} viewId - 视图ID
     * @param {object} layerPrintMethodMap - 图层印刷方式映射
     * @param {object} groupPrintMethodMap - 图层组印刷方式映射
     * @private
     */
    _restorePrintMethodMappings(viewId, layerPrintMethodMap, groupPrintMethodMap) {
        try {
            const printMethodStore = window.usePrintMethodStore ? window.usePrintMethodStore() : null;
            if (!printMethodStore) {
                ErrorHandler.logWarning('Print Method Store 不可用，无法恢复印刷方式映射');
                return;
            }
            
            // 检查是否有 restorePrintMethodMappings 方法
            if (typeof printMethodStore.restorePrintMethodMappings === 'function') {
                printMethodStore.restorePrintMethodMappings(viewId, {
                    layerMap: layerPrintMethodMap || {},
                    groupMap: groupPrintMethodMap || {}
                });
            } else {
                // 降级方案：手动恢复映射
                // 恢复图层映射
                if (layerPrintMethodMap) {
                    Object.entries(layerPrintMethodMap).forEach(([layerId, methodId]) => {
                        printMethodStore.layerPrintMethodMap[layerId] = methodId;
                    });
                }
                
                // 恢复图层组映射
                if (groupPrintMethodMap) {
                    Object.entries(groupPrintMethodMap).forEach(([groupId, methodId]) => {
                        printMethodStore.groupPrintMethodMap[groupId] = methodId;
                    });
                }
                
                // 重新计算已使用印刷方式
                if (typeof printMethodStore.recomputeUsedPrintMethodsForView === 'function') {
                    printMethodStore.recomputeUsedPrintMethodsForView(viewId);
                }
            }
            
            ErrorHandler.logInfo('印刷方式映射恢复成功，viewId:', viewId);
        } catch (error) {
            ErrorHandler.logError(ErrorTypes.STORE_ERROR, `恢复印刷方式映射失败，viewId: ${viewId}`, error);
        }
    }
    
    /**
     * 恢复颜色选择
     * @param {object} selectedColorsByView - 按视图分组的颜色选择数据
     * @private
     */
    _restoreColorSelections(selectedColorsByView) {
        try {
            if (!selectedColorsByView || typeof selectedColorsByView !== 'object') {
                return;
            }
            
            const canvasStore = window.useCanvasStore ? window.useCanvasStore() : null;
            if (!canvasStore) {
                ErrorHandler.logWarning('Canvas Store 不可用，无法恢复颜色选择');
                return;
            }
            
            // 恢复每个视图的颜色选择
            Object.entries(selectedColorsByView).forEach(([viewId, colorData]) => {
                if (colorData && typeof canvasStore.setSelectedColorByView === 'function') {
                    canvasStore.setSelectedColorByView(viewId, colorData);
                }
            });
            
            ErrorHandler.logInfo('颜色选择恢复成功');
        } catch (error) {
            ErrorHandler.logError(ErrorTypes.STORE_ERROR, '恢复颜色选择失败', error);
        }
    }
    
    /**
     * 清除指定产品的所有状态
     * 从 LocalStorage 删除指定产品的所有数据
     * @param {string} [productId] - 产品ID（可选，默认当前产品）
     * @returns {boolean} 是否清除成功
     */
    clearProductState(productId) {
        try {
            // 使用传入的 productId 或当前产品 ID
            const targetProductId = productId || this.productId;
            
            if (!targetProductId) {
                ErrorHandler.logWarning('产品ID为空，无法清除状态');
                return false;
            }
            
            const storageKey = this.getStorageKey(targetProductId);
            
            // 从 LocalStorage 删除数据
            try {
                localStorage.removeItem(storageKey);
                ErrorHandler.logInfo('产品状态已清除，productId:', targetProductId);
            } catch (storageError) {
                ErrorHandler.logError(ErrorTypes.SAVE_ERROR, `从 LocalStorage 删除数据失败，productId: ${targetProductId}`, storageError);
                return false;
            }
            
            // 如果清除的是当前产品，重置内部存储状态
            if (targetProductId === this.productId && this.storage) {
                const emptyState = this._createEmptyState();
                this._updateState(emptyState);
            }
            
            return true;
        } catch (error) {
            ErrorHandler.logError(ErrorTypes.SAVE_ERROR, `清除产品状态失败，productId: ${productId}`, error);
            return false;
        }
    }
    
    /**
     * 清除指定视图的状态
     * 从存储中删除指定视图的数据
     * @param {string} viewId - 视图ID
     * @returns {boolean} 是否清除成功
     */
    clearViewState(viewId) {
        if (!this.initialized || !this.storage) {
            ErrorHandler.logWarning('未初始化，无法清除视图状态');
            return false;
        }
        
        if (!viewId) {
            ErrorHandler.logWarning('视图ID为空，无法清除状态');
            return false;
        }
        
        try {
            // 获取当前状态
            const state = this.getState();
            if (!state) {
                ErrorHandler.logWarning('无法获取当前状态');
                return false;
            }
            
            // 检查视图是否存在
            if (!state.views || !state.views[viewId]) {
                ErrorHandler.logInfo('视图状态不存在，无需清除，viewId:', viewId);
                return true; // 视图不存在也算清除成功
            }
            
            // 删除视图状态
            delete state.views[viewId];
            
            // 同时删除该视图的颜色选择（如果存在）
            if (state.selectedColorsByView && state.selectedColorsByView[viewId]) {
                delete state.selectedColorsByView[viewId];
            }
            
            // 更新状态到 LocalStorage
            const success = this._updateState(state);
            
            if (success) {
                ErrorHandler.logInfo('视图状态已清除，viewId:', viewId);
            }
            
            return success;
        } catch (error) {
            ErrorHandler.logError(ErrorTypes.SAVE_ERROR, `清除视图状态失败，viewId: ${viewId}`, error);
            return false;
        }
    }
    
    /**
     * 检查是否使用内存存储（降级模式）
     * @returns {boolean}
     */
    isUsingMemoryStorage() {
        return this.usingMemoryStorage;
    }
    
    /**
     * 获取错误类型枚举
     * @returns {object}
     */
    static getErrorTypes() {
        return ErrorTypes;
    }
    
    /**
     * 获取数据验证器
     * @returns {DataValidator}
     */
    static getDataValidator() {
        return DataValidator;
    }
    
    /**
     * 获取错误处理器
     * @returns {ErrorHandler}
     */
    static getErrorHandler() {
        return ErrorHandler;
    }
}

// 创建单例实例
const canvasStateManager = new CanvasStateManager();

// 导出类和单例实例
export { CanvasStateManager, canvasStateManager, CURRENT_VERSION, DataValidator, ErrorHandler, ErrorTypes };

// 挂载到全局对象，方便非模块化代码访问
window.CanvasStateManager = CanvasStateManager;
window.canvasStateManager = canvasStateManager;
window.CANVAS_STATE_VERSION = CURRENT_VERSION;
window.CanvasStateDataValidator = DataValidator;
window.CanvasStateErrorHandler = ErrorHandler;
window.CanvasStateErrorTypes = ErrorTypes;
