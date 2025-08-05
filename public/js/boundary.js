// 绘制边缘限制
const BOUNDARY_MARGIN = 10; // 边缘限制的宽度

function drawBoundary() {
    // 获取当前激活视图的 boundary canvas
    const canvasStore = window.Pinia && window.useCanvasStore ? window.useCanvasStore() : null;
    let boundaryCanvas = null;
    
    if (canvasStore && canvasStore.activeViewId) {
        // 多视图模式：获取当前激活视图的 boundary canvas
        boundaryCanvas = document.querySelector(`#view-container-${canvasStore.activeViewId} .boundary-layer`);
    } else {
        // 兼容模式：尝试获取原有的 boundaryLayer
        boundaryCanvas = document.getElementById('boundaryLayer');
    }
    
    if (!boundaryCanvas) {
        console.warn('未找到 boundary canvas 元素');
        return;
    }
    
    const boundaryCtx = boundaryCanvas.getContext('2d');
    if (!boundaryCtx) {
        console.warn('无法获取 boundary canvas 上下文');
        return;
    }
    
    boundaryCtx.clearRect(0, 0, boundaryCanvas.width, boundaryCanvas.height);
    // 绘制半透明红色边框
    boundaryCtx.fillStyle = 'rgba(255, 0, 0, 1)';
    // 上边框
    boundaryCtx.fillRect(0, 0, boundaryCanvas.width, BOUNDARY_MARGIN / 2);
    // 下边框
    boundaryCtx.fillRect(0, boundaryCanvas.height - BOUNDARY_MARGIN /2 , boundaryCanvas.width, BOUNDARY_MARGIN /2);
    // 左边框
    boundaryCtx.fillRect(0, BOUNDARY_MARGIN/2, BOUNDARY_MARGIN, boundaryCanvas.height -  BOUNDARY_MARGIN);
    // 右边框
    boundaryCtx.fillRect(boundaryCanvas.width - BOUNDARY_MARGIN, BOUNDARY_MARGIN/2, BOUNDARY_MARGIN, boundaryCanvas.height -  BOUNDARY_MARGIN);
}

// 为所有视图绘制边界
function drawBoundaryForAllViews() {
    const canvasStore = window.Pinia && window.useCanvasStore ? window.useCanvasStore() : null;
    
    if (canvasStore && canvasStore.views) {
        // 多视图模式：为每个视图绘制边界
        canvasStore.views.forEach(view => {
            const boundaryCanvas = document.querySelector(`#view-container-${view.id} .boundary-layer`);
            if (boundaryCanvas) {
                const boundaryCtx = boundaryCanvas.getContext('2d');
                if (boundaryCtx) {
                    boundaryCtx.clearRect(0, 0, boundaryCanvas.width, boundaryCanvas.height);
                    boundaryCtx.fillStyle = 'rgba(255, 0, 0, 1)';
                    // 上边框
                    boundaryCtx.fillRect(0, 0, boundaryCanvas.width, BOUNDARY_MARGIN / 2);
                    // 下边框
                    boundaryCtx.fillRect(0, boundaryCanvas.height - BOUNDARY_MARGIN /2 , boundaryCanvas.width, BOUNDARY_MARGIN /2);
                    // 左边框
                    boundaryCtx.fillRect(0, BOUNDARY_MARGIN/2, BOUNDARY_MARGIN, boundaryCanvas.height -  BOUNDARY_MARGIN);
                    // 右边框
                    boundaryCtx.fillRect(boundaryCanvas.width - BOUNDARY_MARGIN, BOUNDARY_MARGIN/2, BOUNDARY_MARGIN, boundaryCanvas.height -  BOUNDARY_MARGIN);
                }
            }
        });
    } else {
        // 兼容模式：绘制单个边界
        drawBoundary();
    }
}
