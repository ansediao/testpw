<script>
// 让所有canvas高度100%，宽度根据图片比例自适应
document.addEventListener('DOMContentLoaded', function() {
    function setCanvasSize(canvas, imgW, imgH) {
        if (imgW > 0 && imgH > 0) {
            var parent = canvas.parentElement;
            var parentHeight = parent.clientHeight || 500; // 默认500
            canvas.height = parentHeight;
            canvas.width = Math.round(parentHeight * imgW / imgH);
            canvas.style.height = '100%';
            canvas.style.width = 'auto';
        }
    }

    // shadowLayer
    var shadowLayer = document.getElementById('shadowLayer');
    if (shadowLayer) {
        var imgW = parseInt(shadowLayer.getAttribute('data-img-width'), 10);
        var imgH = parseInt(shadowLayer.getAttribute('data-img-height'), 10);
        setCanvasSize(shadowLayer, imgW, imgH);

        // 其他canvas同步设置
        var colorLayer = document.getElementById('colorLayer');
        var mainCanvas = document.getElementById('mainCanvas');
        var boundaryLayer = document.getElementById('boundaryLayer');
        [colorLayer, mainCanvas, boundaryLayer].forEach(function(c) {
            if (c) setCanvasSize(c, imgW, imgH);
        });
    }
});
</script>
