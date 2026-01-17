/**
 * Canvas 管理器
 * 用于管理 Fabric.js Canvas 实例，将其与 Vue 响应式系统隔离
 */
 
class CanvasManager {
    constructor() {
        // 使用 WeakMap 存储 Canvas 实例，避免内存泄漏
        this._canvasInstances = new WeakMap();
        // 使用普通对象存储 Canvas 引用，不进入响应式系统
        this._canvasMap = {};
        this._activeCanvasId = null;
    }
 
    /**
     * 创建并注册 Canvas 实例
     * @param {string} canvasId - Canvas DOM 元素 ID
     * @param {string} viewId - 视图 ID
     * @param {Object} options - Fabric Canvas 选项
     * @returns {fabric.Canvas} Canvas 实例
     */
    createCanvas(canvasId, viewId = 'default', options = {}) {
        if (typeof fabric === 'undefined') {
            throw new Error('Fabric.js 未加载');
        }
 
        const canvasElement = document.getElementById(canvasId);
        if (!canvasElement) {
            throw new Error(`Canvas 元素未找到: ${canvasId}`);
        }
 
        // 创建 Fabric Canvas 实例
        const canvas = new fabric.Canvas(canvasId, {
            backgroundColor: 'transparent',
            selection: true,
            preserveObjectStacking: true,
            ...options
        });
 
        // 存储 Canvas 实例到普通对象，不进入响应式系统
        this._canvasMap[viewId] = canvas;
        
        // 将 Canvas 实例与 DOM 元素关联
        canvasElement.__fabricCanvas = canvas;
        canvasElement.__viewId = viewId;
 
        return canvas;
    }
 
    /**
     * 获取 Canvas 实例
     * @param {string} viewId - 视图 ID
     * @returns {fabric.Canvas|null} Canvas 实例
     */
    getCanvas(viewId = null) {
        const targetViewId = viewId || this._activeCanvasId || 'default';
        return this._canvasMap[targetViewId] || null;
    }
 
    /**
     * 获取当前激活的 Canvas 实例
     * @returns {fabric.Canvas|null} Canvas 实例
     */
    getActiveCanvas() {
        return this.getCanvas(this._activeCanvasId);
    }
 
    /**
     * 设置激活的 Canvas
     * @param {string} viewId - 视图 ID
     */
    setActiveCanvas(viewId) {
        this._activeCanvasId = viewId;
    }
 
    /**
     * 获取当前激活的视图 ID
     * @returns {string|null} 当前激活的视图 ID
     */
    getCurrentViewId() {
        return this._activeCanvasId;
    }
 
    /**
     * 销毁 Canvas 实例
     * @param {string} viewId - 视图 ID
     */
    destroyCanvas(viewId) {
        const canvas = this._canvasMap[viewId];
        if (canvas) {
            // 移除所有对象
            canvas.clear();
            // 销毁 Canvas
            canvas.dispose();
            
            // 清理引用
            delete this._canvasMap[viewId];
            
            // 清理 DOM 元素关联
            const canvasElements = document.querySelectorAll(`canvas[__viewId="${viewId}"]`);
            canvasElements.forEach(element => {
                delete element.__fabricCanvas;
                delete element.__viewId;
            });
 
            // 如果销毁的是当前激活的 Canvas，重置激活状态
            if (this._activeCanvasId === viewId) {
                this._activeCanvasId = null;
            }
        }
    }
 
    /**
     * 销毁所有 Canvas 实例
     */
    destroyAllCanvases() {
        Object.keys(this._canvasMap).forEach(viewId => {
            this.destroyCanvas(viewId);
        });
        this._canvasMap = {};
        this._activeCanvasId = null;
    }
 
    /**
     * 获取所有视图 ID
     * @returns {string[]} 视图 ID 数组
     */
    getViewIds() {
        return Object.keys(this._canvasMap);
    }
 
    /**
     * 获取所有 Canvas ID
     * @returns {string[]} Canvas ID 数组
     */
    getAllCanvasIds() {
        return Object.keys(this._canvasMap);
    }
 
    /**
     * 检查 Canvas 是否存在
     * @param {string} viewId - 视图 ID
     * @returns {boolean} 是否存在
     */
    hasCanvas(viewId) {
        return !!this._canvasMap[viewId];
    }
 
    /**
     * 导出 Canvas 为数据
     * @param {string} viewId - 视图 ID
     * @param {Object} options - 导出选项
     * @returns {string} 图片数据 URL
     */
    exportCanvas(viewId, options = {}) {
        const canvas = this.getCanvas(viewId);
        if (!canvas) {
            throw new Error(`Canvas 未找到: ${viewId}`);
        }
 
        return canvas.toDataURL(options.format || 'png', options.quality || 1);
    }
 
    /**
     * 获取 Canvas 状态（序列化数据）
     * @param {string} viewId - 视图 ID
     * @returns {Object} Canvas 状态数据
     */
    getCanvasState(viewId) {
        const canvas = this.getCanvas(viewId);
        if (!canvas) {
            return null;
        }
 
        return {
            objects: canvas.toJSON(),
            width: canvas.width,
            height: canvas.height,
            backgroundColor: canvas.backgroundColor,
            viewportTransform: canvas.viewportTransform
        };
    }
 
    /**
     * 从状态恢复 Canvas
     * @param {string} viewId - 视图 ID
     * @param {Object} state - Canvas 状态数据
     */
    restoreCanvasState(viewId, state) {
        const canvas = this.getCanvas(viewId);
        if (!canvas || !state) {
            return false;
        }
 
        try {
            // 清除现有内容
            canvas.clear();
            
            // 恢复画布属性
            if (state.width) canvas.setWidth(state.width);
            if (state.height) canvas.setHeight(state.height);
            if (state.backgroundColor) canvas.setBackgroundColor(state.backgroundColor);
            if (state.viewportTransform) canvas.setViewportTransform(state.viewportTransform);
            
            // 恢复对象
            if (state.objects) {
                fabric.util.enlivenObjects(state.objects.objects || [], (objects) => {
                    objects.forEach(obj => canvas.add(obj));
                    canvas.renderAll();
                });
            }
            
            return true;
        } catch (error) {
            return false;
        }
    }
}
 
// 创建全局 Canvas 管理器实例
const canvasManager = new CanvasManager();
 
// 暴露到全局
window.CanvasManager = canvasManager;
 
// 兼容旧代码的导出（注释掉以避免在非模块环境中的语法错误）
// export { CanvasManager, canvasManager };

