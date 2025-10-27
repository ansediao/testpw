/**
 * 打印区域验证工具
 * 用于检查元素是否在打印区域内，并在需要时自动重新定位
 */

/**
 * 调整对象位置到打印区域内
 * @param {fabric.Canvas} canvas - Fabric.js 画布
 * @param {fabric.Object} object - 要调整的对象
 * @param {Object} objectBounds - 对象边界
 * @param {Object} printArea - 打印区域边界
 * @param {string} viewId - 视图ID
 */
function adjustObjectPosition(canvas, object, objectBounds, printArea, viewId) {
    // 计算需要调整的距离
    let newLeft = object.left;
    let newTop = object.top;

    // 检查左边界
    if (objectBounds.left < printArea.left) {
        newLeft = object.left + (printArea.left - objectBounds.left);
    }
    // 检查右边界
    else if (objectBounds.right > printArea.right) {
        newLeft = object.left - (objectBounds.right - printArea.right);
    }

    // 检查上边界
    if (objectBounds.top < printArea.top) {
        newTop = object.top + (printArea.top - objectBounds.top);
    }
    // 检查下边界
    else if (objectBounds.bottom > printArea.bottom) {
        newTop = object.top - (objectBounds.bottom - printArea.bottom);
    }

    // 应用新位置
    if (newLeft !== object.left || newTop !== object.top) {
        object.set({
            left: newLeft,
            top: newTop
        });
        canvas.renderAll();
    }
}

/**
 * 检查对象是否分配了打印方式
 * @param {fabric.Object} obj - Fabric.js 对象
 * @returns {boolean} 是否分配了打印方式
 */
function hasPrintMethodAssigned(obj) {
    if (!obj || !obj.id) return false;
    
    const printMethodStore = window.usePrintMethodStore ? window.usePrintMethodStore() : null;
    if (!printMethodStore) return false;
    
    // 检查图层直接分配的打印方式
    const layerPrintMethod = printMethodStore.layerPrintMethodMap[obj.id];
    if (layerPrintMethod) return true;
    
    // 检查图层组分配的打印方式
    if (obj.groupId) {
        const groupPrintMethod = printMethodStore.groupPrintMethodMap[obj.groupId];
        if (groupPrintMethod) return true;
        
        // 从组ID推断打印方式
        const match = String(obj.groupId).match(/^print-method-(.+)$/);
        if (match && match[1]) return true;
    }
    
    return false;
}

/**
 * 获取当前视图的打印区域边界
 * @param {string} viewId - 视图ID
 * @returns {Object} 打印区域边界对象 { left, top, right, bottom, width, height, centerX, centerY }
 */
function getPrintAreaBounds(viewId) {
    // 优先从 maskCanvas 的 printAreaRect 获取边界
    try {
        const maskCanvasElement = document.getElementById(`maskCanvas-${viewId}`);
        const maskCanvas = maskCanvasElement && maskCanvasElement.__fabricCanvas ? maskCanvasElement.__fabricCanvas : null;
        if (maskCanvas) {
            const rect = maskCanvas.getObjects().find(obj => obj && obj.name === 'printAreaRect');
            if (rect) {
                const scaleX = rect.scaleX || 1;
                const scaleY = rect.scaleY || 1;
                const left = rect.left;
                const top = rect.top;
                const right = left + rect.width * scaleX;
                const bottom = top + rect.height * scaleY;
                return {
                    left,
                    top,
                    right,
                    bottom,
                    width: right - left,
                    height: bottom - top,
                    centerX: left + (right - left) / 2,
                    centerY: top + (bottom - top) / 2
                };
            }
        }
    } catch (err) {
        console.warn('[PrintAreaValidator] 读取 maskCanvas 的 printAreaRect 失败，回退到打印方式尺寸', err);
    }

    // 回退：从当前视图的打印方式数据计算边界
    const printMethodStore = window.usePrintMethodStore ? window.usePrintMethodStore() : null;
    if (!printMethodStore || !printMethodStore.currentViewPrintMethods || printMethodStore.currentViewPrintMethods.length === 0) {
        return null;
    }

    const firstMethod = printMethodStore.currentViewPrintMethods[0];
    if (!firstMethod.print_method_area_width || !firstMethod.print_method_area_height) {
        return null;
    }

    const canvas = window.CanvasManager ? window.CanvasManager.getCanvas(viewId) : null;
    if (!canvas) return null;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const printAreaWidth = firstMethod.print_method_area_width * 50;
    const printAreaHeight = firstMethod.print_method_area_height * 50;

    const printAreaLeft = (canvasWidth - printAreaWidth) / 2;
    const printAreaTop = (canvasHeight - printAreaHeight) / 2;
    const printAreaRight = printAreaLeft + printAreaWidth;
    const printAreaBottom = printAreaTop + printAreaHeight;

    return {
        left: printAreaLeft,
        top: printAreaTop,
        right: printAreaRight,
        bottom: printAreaBottom,
        width: printAreaWidth,
        height: printAreaHeight,
        centerX: printAreaLeft + printAreaWidth / 2,
        centerY: printAreaTop + printAreaHeight / 2
    };
}

/**
 * 计算对象与打印区域的重叠面积
 * @param {fabric.Object} obj - Fabric.js 对象
 * @param {Object} printAreaBounds - 打印区域边界
 * @returns {number} 重叠面积（像素平方）
 */
function calculateOverlapArea(obj, printAreaBounds) {
    if (!obj || !printAreaBounds) return 0;
    
    // 获取对象的边界框
    const objBounds = obj.getBoundingRect();
    
    // 计算重叠区域
    const overlapLeft = Math.max(objBounds.left, printAreaBounds.left);
    const overlapTop = Math.max(objBounds.top, printAreaBounds.top);
    const overlapRight = Math.min(objBounds.left + objBounds.width, printAreaBounds.right);
    const overlapBottom = Math.min(objBounds.top + objBounds.height, printAreaBounds.bottom);
    
    // 如果没有重叠，返回0
    if (overlapRight <= overlapLeft || overlapBottom <= overlapTop) {
        return 0;
    }
    
    // 计算重叠面积
    const overlapWidth = overlapRight - overlapLeft;
    const overlapHeight = overlapBottom - overlapTop;
    return overlapWidth * overlapHeight;
}

/**
 * 检查对象是否在打印区域内（重叠面积 >= 10%）
 * @param {fabric.Object} obj - Fabric.js 对象
 * @param {Object} printAreaBounds - 打印区域边界
 * @returns {Object} 检查结果 { isValid, overlapRatio, overlapArea, objectArea }
 */
function isObjectInPrintArea(obj, printAreaBounds) {
    if (!obj || !printAreaBounds) {
        return { isValid: true, overlapRatio: 1, overlapArea: 0, objectArea: 0 };
    }
    
    // 获取对象的边界框和面积
    const objBounds = obj.getBoundingRect();
    const objectArea = objBounds.width * objBounds.height;
    
    if (objectArea === 0) {
        return { isValid: true, overlapRatio: 1, overlapArea: 0, objectArea: 0 };
    }
    
    // 计算重叠面积
    const overlapArea = calculateOverlapArea(obj, printAreaBounds);
    
    // 计算重叠比例
    const overlapRatio = overlapArea / objectArea;
    
    // 检查是否至少有10%在打印区域内
    const isValid = overlapRatio >= 0.1;
    
    return {
        isValid,
        overlapRatio,
        overlapArea,
        objectArea
    };
}

/**
 * 将对象移动到画布中心
 * @param {fabric.Object} obj - Fabric.js 对象
 * @param {fabric.Canvas} canvas - Fabric.js 画布
 * @param {Object} printAreaBounds - 打印区域边界
 */
function moveObjectToCanvasCenter(obj, canvas, printAreaBounds) {
    if (!obj || !canvas) {
        console.warn('[PrintAreaValidator] moveObjectToCanvasCenter 参数不完整，退出');
        return;
    }

    const centerX = (typeof canvas.getWidth === 'function' ? canvas.getWidth() : canvas.width) / 2;
    const centerY = (typeof canvas.getHeight === 'function' ? canvas.getHeight() : canvas.height) / 2;

    // 优先使用 fabric 的 setPositionByOrigin 以确保“对象中心”与“画布中心”对齐
    if (typeof fabric !== 'undefined' && fabric.Point && typeof obj.setPositionByOrigin === 'function') {
        obj.setPositionByOrigin(new fabric.Point(centerX, centerY), 'center', 'center');
    } else {
        // 兼容降级：根据对象 originX/originY 计算中心对齐
        const scaledW = typeof obj.getScaledWidth === 'function' ? obj.getScaledWidth() : (obj.width * (obj.scaleX || 1));
        const scaledH = typeof obj.getScaledHeight === 'function' ? obj.getScaledHeight() : (obj.height * (obj.scaleY || 1));
        const originX = obj.originX || 'left';
        const originY = obj.originY || 'top';
        let left = centerX;
        let top = centerY;
        if (originX === 'left') left -= scaledW / 2;
        if (originX === 'right') left += scaledW / 2;
        if (originY === 'top') top -= scaledH / 2;
        if (originY === 'bottom') top += scaledH / 2;
        obj.set({ left, top });
    }

    if (typeof obj.setCoords === 'function') obj.setCoords();
    canvas.renderAll();

    console.log(`[PrintAreaValidator] 对象已移动到画布中心: (${centerX}, ${centerY})`);
}

/**
 * 验证对象是否在打印区域内，如果不在则自动移动到中心
 * @param {fabric.Object} obj - Fabric.js 对象
 * @param {string} viewId - 视图ID
 * @returns {Object} 验证结果 { wasValid, wasMoved, overlapRatio }
 */
function validateAndRepositionObject(obj, viewId) {
    if (!obj || !viewId) {
        return { wasValid: true, wasMoved: false, overlapRatio: 1 };
    }

    // 读取视图流类型
    const canvasStore = window.useCanvasStore ? window.useCanvasStore() : null;
    const viewObj = canvasStore && Array.isArray(canvasStore.views) ? canvasStore.views.find(v => v && v.id === viewId) : null;
    const flow = (viewObj && (viewObj.view_flow || (viewObj.data && viewObj.data.view_flow))) || null;
    const isFourGrid = flow === '4-Grid Flow';

    // 检查对象是否分配了打印方式（保持与其他视图一致）
    const hasPrintMethod = hasPrintMethodAssigned(obj);
    if (!hasPrintMethod) {
        return { wasValid: true, wasMoved: false, overlapRatio: 1 };
    }

    // 获取画布实例
    const canvas = window.CanvasManager ? window.CanvasManager.getCanvas(viewId) : null;
    if (!canvas) {
        return { wasValid: true, wasMoved: false, overlapRatio: 1 };
    }

    // 计算检测边界：4格图用整画布边界，其它视图用打印区域边界
    let bounds = null;
    if (isFourGrid) {
        const w = typeof canvas.getWidth === 'function' ? canvas.getWidth() : canvas.width;
        const h = typeof canvas.getHeight === 'function' ? canvas.getHeight() : canvas.height;
        bounds = {
            left: 0,
            top: 0,
            right: w,
            bottom: h,
            width: w,
            height: h,
            centerX: w / 2,
            centerY: h / 2
        };
    } else {
        bounds = getPrintAreaBounds(viewId);
    }

    if (!bounds) {
        return { wasValid: true, wasMoved: false, overlapRatio: 1 };
    }

    // 检查对象是否在检测边界内（重叠比例 >= 10%）
    const checkResult = isObjectInPrintArea(obj, bounds);

    if (checkResult.isValid) {
        return { wasValid: true, wasMoved: false, overlapRatio: checkResult.overlapRatio };
    }

    // 不满足重叠比例，回到中心（中心对齐方式与其它视图一致）
    moveObjectToCanvasCenter(obj, canvas, bounds);
    return { wasValid: false, wasMoved: true, overlapRatio: checkResult.overlapRatio };
}

/**
 * 为画布添加打印区域验证事件监听器
 * @param {fabric.Canvas} canvas - Fabric.js 画布
 * @param {string} viewId - 视图ID
 */
function addPrintAreaValidationListeners(canvas, viewId) {
    if (!canvas || !viewId) {
        console.warn(`[PrintAreaValidator] addPrintAreaValidationListeners 参数无效: canvas=${!!canvas}, viewId=${viewId}`);
        return;
    }
    
    let isDragging = false;
    let draggedObject = null;
    
    // 监听对象移动结束事件
    canvas.on('object:modified', function(e) {
        const obj = e.target;
        if (obj) {
            setTimeout(() => {
                validateAndRepositionObject(obj, viewId);
            }, 100); // 增加延迟确保位置更新完成
        }
    });
    
    // 监听对象移动事件（拖拽过程中）
    canvas.on('object:moving', function(e) {
        const obj = e.target;
        if (obj) {
            isDragging = true;
            draggedObject = obj;
        }
    });
    
    // 监听鼠标释放事件（拖拽结束）
    canvas.on('mouse:up', function(e) {
        if (isDragging && draggedObject) {
            setTimeout(() => {
                validateAndRepositionObject(draggedObject, viewId);
            }, 100);
        }
        
        // 重置拖拽状态
        isDragging = false;
        draggedObject = null;
    });
    
    // 监听鼠标按下事件
    canvas.on('mouse:down', function(e) {
        const obj = canvas.getActiveObject();
        if (obj) {
            // 重置拖拽状态，准备新的拖拽操作
            isDragging = false;
            draggedObject = null;
        }
    });
}

// 将函数暴露到全局作用域
window.PrintAreaValidator = {
    hasPrintMethodAssigned,
    getPrintAreaBounds,
    calculateOverlapArea,
    isObjectInPrintArea,
    moveObjectToCanvasCenter,
    validateAndRepositionObject,
    addPrintAreaValidationListeners,
    // 添加调试方法
    checkModuleStatus: function() {
        console.log('[PrintAreaValidator] 模块状态检查:');
        console.log('- CanvasManager 存在:', !!window.CanvasManager);
        console.log('- usePrintMethodStore 存在:', !!window.usePrintMethodStore);
        console.log('- useCanvasStore 存在:', !!window.useCanvasStore);
        
        if (window.CanvasManager) {
            // 获取CanvasManager的所有方法（包括原型链上的）
            const methods = [];
            let obj = window.CanvasManager;
            while (obj && obj !== Object.prototype) {
                Object.getOwnPropertyNames(obj).forEach(name => {
                    if (typeof window.CanvasManager[name] === 'function' && !methods.includes(name)) {
                        methods.push(name);
                    }
                });
                obj = Object.getPrototypeOf(obj);
            }
            console.log('- CanvasManager 方法:', methods);
            
            const activeCanvas = window.CanvasManager.getActiveCanvas();
            console.log('- 当前激活画布:', !!activeCanvas);
            if (activeCanvas) {
                console.log('- 激活画布事件监听器数量:', Object.keys(activeCanvas.__eventListeners || {}).length);
                console.log('- 激活画布事件类型:', Object.keys(activeCanvas.__eventListeners || {}));
            }
        }
        
        return {
            canvasManager: !!window.CanvasManager,
            printMethodStore: !!window.usePrintMethodStore,
            canvasStore: !!window.useCanvasStore
        };
    }
};

/**
 * 测试函数 - 用于验证打印区域检查功能
 * 在浏览器控制台中运行：window.PrintAreaValidator.testPrintAreaValidation()
 */
function testPrintAreaValidation() {
    console.log('[PrintAreaValidator] 开始测试打印区域验证功能...');
    
    // 获取当前激活的画布
    const canvasStore = window.useCanvasStore ? window.useCanvasStore() : null;
    if (!canvasStore || !canvasStore.activeViewId) {
        console.warn('[PrintAreaValidator] 无法获取当前激活的视图');
        return;
    }
    
    const viewId = canvasStore.activeViewId;
    const canvas = window.CanvasManager ? window.CanvasManager.getCanvas(viewId) : null;
    if (!canvas) {
        console.warn('[PrintAreaValidator] 无法获取画布实例');
        return;
    }
    
    // 获取打印区域边界
    const printAreaBounds = getPrintAreaBounds(viewId);
    if (!printAreaBounds) {
        console.warn('[PrintAreaValidator] 无法获取打印区域边界');
        return;
    }
    
    console.log('[PrintAreaValidator] 打印区域边界:', printAreaBounds);
    
    // 获取当前选中的对象
    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
        console.warn('[PrintAreaValidator] 没有选中的对象，请先在画布上选择一个对象');
        return;
    }
    
    // 检查对象是否分配了打印方式
    const hasPrintMethod = hasPrintMethodAssigned(activeObject);
    console.log('[PrintAreaValidator] 对象是否分配了打印方式:', hasPrintMethod);
    
    // 检查对象与打印区域的重叠情况
    const overlapCheck = isObjectInPrintArea(activeObject, printAreaBounds);
    console.log('[PrintAreaValidator] 重叠检查结果:', overlapCheck);
    
    // 执行验证和重新定位
    const validationResult = validateAndRepositionObject(activeObject, viewId);
    console.log('[PrintAreaValidator] 验证结果:', validationResult);
    
    console.log('[PrintAreaValidator] 测试完成');
}

/**
 * 手动触发拖拽结束验证（用于调试）
 */
function testDragEndValidation() {
    console.log('[PrintAreaValidator] 手动触发拖拽结束验证');
    
    // 检查 CanvasManager 是否存在
    if (!window.CanvasManager) {
        console.error('[PrintAreaValidator] CanvasManager 未找到');
        return;
    }
    
    console.log('[PrintAreaValidator] CanvasManager 可用方法:', Object.getOwnPropertyNames(window.CanvasManager));
    
    const activeCanvas = window.CanvasManager.getActiveCanvas();
    if (!activeCanvas) {
        console.error('[PrintAreaValidator] 无法获取激活的画布');
        
        // 尝试获取所有可用的视图ID
        const viewIds = window.CanvasManager.getViewIds();
        console.log('[PrintAreaValidator] 可用的视图ID:', viewIds);
        
        if (viewIds.length > 0) {
            console.log('[PrintAreaValidator] 尝试使用第一个可用的视图');
            const firstViewId = viewIds[0];
            const firstCanvas = window.CanvasManager.getCanvas(firstViewId);
            
            if (firstCanvas) {
                const activeObject = firstCanvas.getActiveObject();
                if (!activeObject) {
                    console.error('[PrintAreaValidator] 第一个画布中没有选中的对象');
                    return;
                }
                
                console.log(`[PrintAreaValidator] 使用视图 ${firstViewId} 进行验证`);
                validateAndRepositionObject(activeObject, firstViewId);
                return;
            }
        }
        
        return;
    }
    
    const activeObject = activeCanvas.getActiveObject();
    if (!activeObject) {
        console.error('[PrintAreaValidator] 没有选中的对象');
        return;
    }
    
    const currentViewId = window.CanvasManager.getCurrentViewId();
    console.log(`[PrintAreaValidator] 当前视图ID: ${currentViewId}`);
    
    if (!currentViewId) {
        // 如果没有当前视图ID，尝试从所有视图中找到包含激活画布的视图
        const viewIds = window.CanvasManager.getViewIds();
        console.log('[PrintAreaValidator] 所有视图ID:', viewIds);
        
        for (const viewId of viewIds) {
            const canvas = window.CanvasManager.getCanvas(viewId);
            if (canvas === activeCanvas) {
                console.log(`[PrintAreaValidator] 找到匹配的视图ID: ${viewId}`);
                validateAndRepositionObject(activeObject, viewId);
                return;
            }
        }
        
        console.error('[PrintAreaValidator] 无法确定当前视图ID');
        return;
    }
    
    console.log('[PrintAreaValidator] 模拟拖拽结束，触发验证...');
    validateAndRepositionObject(activeObject, currentViewId);
}

/**
 * 手动为当前激活画布添加事件监听器（用于调试）
 */
function manualAddListeners() {
    console.log('[PrintAreaValidator] 手动添加事件监听器...');
    
    const activeCanvas = window.CanvasManager ? window.CanvasManager.getActiveCanvas() : null;
    const currentViewId = window.CanvasManager ? window.CanvasManager.getCurrentViewId() : null;
    
    if (!activeCanvas) {
        console.error('[PrintAreaValidator] 无法获取激活画布');
        return false;
    }
    
    if (!currentViewId) {
        console.error('[PrintAreaValidator] 无法获取当前视图ID');
        return false;
    }
    
    console.log(`[PrintAreaValidator] 为视图 ${currentViewId} 手动添加监听器`);
    
    // 检查添加前的监听器数量
    const beforeMouseUp = activeCanvas.__eventListeners['mouse:up'] ? activeCanvas.__eventListeners['mouse:up'].length : 0;
    const beforeObjectModified = activeCanvas.__eventListeners['object:modified'] ? activeCanvas.__eventListeners['object:modified'].length : 0;
    
    console.log(`[PrintAreaValidator] 添加前 - mouse:up: ${beforeMouseUp}, object:modified: ${beforeObjectModified}`);
    
    // 调用添加函数
    addPrintAreaValidationListeners(activeCanvas, currentViewId);
    
    // 检查添加后的监听器数量
    const afterMouseUp = activeCanvas.__eventListeners['mouse:up'] ? activeCanvas.__eventListeners['mouse:up'].length : 0;
    const afterObjectModified = activeCanvas.__eventListeners['object:modified'] ? activeCanvas.__eventListeners['object:modified'].length : 0;
    
    console.log(`[PrintAreaValidator] 添加后 - mouse:up: ${afterMouseUp}, object:modified: ${afterObjectModified}`);
    
    return true;
}

// 将测试函数添加到暴露的对象中
window.PrintAreaValidator.testPrintAreaValidation = testPrintAreaValidation;
window.PrintAreaValidator.testDragEndValidation = testDragEndValidation;
window.PrintAreaValidator.manualAddListeners = manualAddListeners;

// 模块加载完成