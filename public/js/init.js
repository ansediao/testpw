// 全局初始化函数
function init() {
    
    // 检查 CanvasManager 是否可用
    if (typeof window.CanvasManager !== 'undefined') {
        if (typeof window.initCanvasSystem === 'function') {
            window.initCanvasSystem();
        }
    } else {
        // 传统初始化逻辑
        const canvasElement = document.getElementById('mainCanvas');
        if (canvasElement && typeof fabric !== 'undefined') {
            const canvas = new fabric.Canvas('mainCanvas', {
                width: 800,
                height: 600,
                backgroundColor: 'transparent'
            });
            
            // 设置全局变量
            window.canvas = canvas;
            window.fabricCanvas = canvas;
            
            // 初始化事件监听器
            if (typeof window.initializeCanvasEventListeners === 'function') {
                window.initializeCanvasEventListeners(canvas);
            }
            
        }
    }
}

// 确保 init 函数在全局作用域可用
window.init = init;