function pwcaGetPixelData(canvas, ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return imageData.data;
}

function pwcaGetTopMargin(imageUrl, canvas, ctx) {
    const pixelData = pwcaGetPixelData(canvas, ctx);
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const index = (y * canvas.width + x) * 4;
            const alpha = pixelData[index + 3];
            if (alpha > 0) { return y; }
        }
    }
    return 0;
}

function pwcaGetTopMostY(canvas, ctx) {
    const pixelData = pwcaGetPixelData(canvas, ctx);
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const index = (y * canvas.width + x) * 4;
            const alpha = pixelData[index + 3];
            if (alpha > 0) { return y; }
        }
    }
    return 0;
}

function pwcaGetBottomMostY(canvas, ctx) {
    const pixelData = pwcaGetPixelData(canvas, ctx);
    for (let y = canvas.height - 1; y >= 0; y--) {
        for (let x = 0; x < canvas.width; x++) {
            const index = (y * canvas.width + x) * 4;
            const alpha = pixelData[index + 3];
            if (alpha > 0) { return y; }
        }
    }
    return canvas.height - 1;
}

function pwcaGetBoundingRectHeight(imageUrl, canvas, ctx) {
    const top = pwcaGetTopMostY(canvas, ctx);
    const bottom = pwcaGetBottomMostY(canvas, ctx);
    return bottom - top + 1;
}

async function pwcaAnalyzeImageInfo(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height; const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imageWidth = img.width; const imageHeight = img.height;
            const nonTransparentHeight = pwcaGetBoundingRectHeight(imageUrl, canvas, ctx);
            const topMargin = pwcaGetTopMargin(imageUrl, canvas, ctx);
            resolve({ imageWidth, imageHeight, nonTransparentHeight, topMargin });
        };
        img.onerror = (error) => { reject(error); };
        img.src = imageUrl;
    });
}

window.pwcaGetPixelData = pwcaGetPixelData;
window.pwcaGetTopMargin = pwcaGetTopMargin;
window.pwcaGetTopMostY = pwcaGetTopMostY;
window.pwcaGetBottomMostY = pwcaGetBottomMostY;
window.pwcaGetBoundingRectHeight = pwcaGetBoundingRectHeight;
window.pwcaAnalyzeImageInfo = pwcaAnalyzeImageInfo;