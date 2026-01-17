function getPixelData(canvas, ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return imageData.data;
}

function getTopMargin(imageUrl, canvas, ctx) {
    const pixelData = getPixelData(canvas, ctx);
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const index = (y * canvas.width + x) * 4;
            const alpha = pixelData[index + 3];
            if (alpha > 0) { return y; }
        }
    }
    return 0;
}

function getTopMostY(canvas, ctx) {
    const pixelData = getPixelData(canvas, ctx);
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const index = (y * canvas.width + x) * 4;
            const alpha = pixelData[index + 3];
            if (alpha > 0) { return y; }
        }
    }
    return 0;
}

function getBottomMostY(canvas, ctx) {
    const pixelData = getPixelData(canvas, ctx);
    for (let y = canvas.height - 1; y >= 0; y--) {
        for (let x = 0; x < canvas.width; x++) {
            const index = (y * canvas.width + x) * 4;
            const alpha = pixelData[index + 3];
            if (alpha > 0) { return y; }
        }
    }
    return canvas.height - 1;
}

function getBoundingRectHeight(imageUrl, canvas, ctx) {
    const top = getTopMostY(canvas, ctx);
    const bottom = getBottomMostY(canvas, ctx);
    return bottom - top + 1;
}

async function analyzeImageInfo(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height; const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imageWidth = img.width; const imageHeight = img.height;
            const nonTransparentHeight = getBoundingRectHeight(imageUrl, canvas, ctx);
            const topMargin = getTopMargin(imageUrl, canvas, ctx);
            resolve({ imageWidth, imageHeight, nonTransparentHeight, topMargin });
        };
        img.onerror = (error) => { reject(error); };
        img.src = imageUrl;
    });
}

window.getPixelData = getPixelData;
window.getTopMargin = getTopMargin;
window.getTopMostY = getTopMostY;
window.getBottomMostY = getBottomMostY;
window.getBoundingRectHeight = getBoundingRectHeight;
window.analyzeImageInfo = analyzeImageInfo;