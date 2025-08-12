// 全局初始化函数
function init() {
    console.log('全局初始化函数被调用');
    
    // 检查 CanvasManager 是否可用
    if (typeof window.CanvasManager !== 'undefined') {
        console.log('CanvasManager 已加载，使用 CanvasManager 初始化');
        if (typeof window.initCanvasSystem === 'function') {
            window.initCanvasSystem();
        }
    } else {
        console.log('CanvasManager 未加载，使用传统方式初始化');
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
            
            console.log('传统 Canvas 初始化完成');
        }
    }
}

// 确保 init 函数在全局作用域可用
window.init = init;