(function () {
    'use strict';

    window.addEventListener('load', function () {
        const previewCanvas = document.getElementById('previewCanvas');
        const shadowLayer = document.getElementById('shadowLayer');
        const designPreviewCanvas = document.getElementById('designPreviewCanvas');

        if (!previewCanvas || !designPreviewCanvas) {
            return;
        }

        const productImage = previewCanvas.getAttribute('data-product-image');
        if (productImage) {
            pwcaInitPreviewBaseCanvas(previewCanvas, productImage);
        }

        if (shadowLayer) {
            const colorImage = shadowLayer.getAttribute('data-color-image');
            if (colorImage) {
                pwcaInitDesignPreviewClip(shadowLayer, designPreviewCanvas, colorImage);
            }
        }
    });

    function pwcaInitPreviewBaseCanvas(canvasElement, imageUrl) {
        const ctx = canvasElement.getContext('2d');
        if (!ctx) {
            return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () {
            ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            ctx.drawImage(img, 0, 0, canvasElement.width, canvasElement.height);
        };
        img.src = imageUrl;
    }

    function pwcaInitDesignPreviewClip(shadowCanvasElement, designCanvasElement, imageUrl) {
        const designCtx = designCanvasElement.getContext('2d');
        if (!designCtx) {
            return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = shadowCanvasElement.width;
            tempCanvas.height = shadowCanvasElement.height;

            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) {
                return;
            }

            tempCtx.drawImage(img, 0, 0, shadowCanvasElement.width, shadowCanvasElement.height);
            const imageData = tempCtx.getImageData(0, 0, shadowCanvasElement.width, shadowCanvasElement.height);

            pwcaApplyClipFromAlpha(
                designCtx,
                imageData,
                shadowCanvasElement.width,
                shadowCanvasElement.height
            );
        };
        img.src = imageUrl;
    }

    function pwcaApplyClipFromAlpha(designCtx, imageData, width, height) {
        const padding = 3;
        const data = imageData.data;

        designCtx.beginPath();

        for (let y = padding; y < height - padding; y++) {
            for (let x = padding; x < width - padding; x++) {
                const index = (y * width + x) * 4;
                const alpha = data[index + 3];

                if (!alpha) {
                    continue;
                }

                const isValid = pwcaIsOpaqueBlock(data, x, y, width, height, padding);
                if (isValid) {
                    designCtx.rect(x, y, 1, 1);
                }
            }
        }

        designCtx.closePath();
        designCtx.clip();
    }

    function pwcaIsOpaqueBlock(data, x, y, width, height, padding) {
        for (let dy = -padding; dy <= padding; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= height) {
                continue;
            }

            for (let dx = -padding; dx <= padding; dx++) {
                const nx = x + dx;
                if (nx < 0 || nx >= width) {
                    continue;
                }

                const neighborIndex = (ny * width + nx) * 4;
                if (data[neighborIndex + 3] === 0) {
                    return false;
                }
            }
        }

        return true;
    }
})();