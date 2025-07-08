// 绘制边缘限制
const boundaryCanvas = document.getElementById('boundaryLayer');
const boundaryCtx = boundaryCanvas.getContext('2d');
const BOUNDARY_MARGIN = 10; // 边缘限制的宽度
function drawBoundary() {
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
