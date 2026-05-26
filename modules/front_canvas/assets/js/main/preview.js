const arcSliderEl = document.getElementById('arcSlider');
if (arcSliderEl) { arcSliderEl.addEventListener('input', function () { if (typeof updatePreviewCanvas === 'function') updatePreviewCanvas(); }); }

function pwcaGetUiStateAccess() {
    return window.pwcaUiStateAccess || null;
}

function pwcaGetPreviewActiveCanvas() {
    const uiStateAccess = pwcaGetUiStateAccess();
    if (uiStateAccess && typeof uiStateAccess.getActiveCanvas === 'function') {
        return uiStateAccess.getActiveCanvas();
    }

    return typeof window.getActiveCanvas === 'function' ? window.getActiveCanvas() : null;
}

function pwcaGetPreviewCanvasStore() {
    const uiStateAccess = pwcaGetUiStateAccess();
    if (uiStateAccess && typeof uiStateAccess.getCanvasStore === 'function') {
        return uiStateAccess.getCanvasStore();
    }

    return typeof window.useCanvasStore === 'function' ? window.useCanvasStore() : null;
}

function pwcaGetAllViewCanvases() {
    const uiStateAccess = pwcaGetUiStateAccess();
    if (uiStateAccess && typeof uiStateAccess.getAllViewCanvases === 'function') {
        return uiStateAccess.getAllViewCanvases();
    }

    return [];
}

function updatePreviewCanvas() {
    const activeCanvas = pwcaGetPreviewActiveCanvas();
    if (!activeCanvas) return;
    const designPreviewCanvas = document.getElementById('designPreviewCanvas');
    if (!designPreviewCanvas) return;
    const mainCanvas = activeCanvas.toDataURL({ format: 'png', quality: 1 });
    const img = new Image();
    img.onload = function () {
        const ctx = designPreviewCanvas.getContext('2d');
        ctx.clearRect(0, 0, designPreviewCanvas.width, designPreviewCanvas.height);
        const sourceX = img.width * 0.25;
        const sourceWidth = img.width * 0.5;
        const arcSlider = document.getElementById('arcSlider');
        const arc = arcSlider ? arcSlider.value : 0;
        drawImageCurvedAndCentered(ctx, img, 0, 0, designPreviewCanvas.width, designPreviewCanvas.height, arc, sourceX, sourceWidth);
    };
    img.src = mainCanvas;
}

function drawImageCurvedAndCentered(ctx, image, x, y, width, height, arc, sourceX, sourceWidth) {
    const steps = 50; const step = width / steps;
    for (let i = 0; i < steps; i++) {
        const sx = sourceX + (i * sourceWidth) / steps;
        const sWidth = sourceWidth / steps;
        const dy = Math.sin((i / steps) * Math.PI) * (arc / 10);
        ctx.drawImage(image, sx, 0, sWidth, image.height, x + i * step, y + dy, step + 1, height);
    }
}

window.updatePreviewCanvas = updatePreviewCanvas;

document.getElementById('renderBtn')?.addEventListener('click', async function () {
    try {
        const allViewCanvases = pwcaGetAllViewCanvases();
        if (allViewCanvases.length > 0) {
            allViewCanvases.forEach((fc) => {
                try {
                    const active = typeof fc.getActiveObject === 'function' ? fc.getActiveObject() : null;
                    if (active && active.isEditing && typeof active.exitEditing === 'function') active.exitEditing();
                    if (typeof fc.discardActiveObject === 'function') fc.discardActiveObject();
                    fc.renderAll();
                } catch (e) {}
            });
        } else {
            const fc = pwcaGetPreviewActiveCanvas();
            if (fc) {
                const active = typeof fc.getActiveObject === 'function' ? fc.getActiveObject() : null;
                if (active && active.isEditing && typeof active.exitEditing === 'function') active.exitEditing();
                if (typeof fc.discardActiveObject === 'function') fc.discardActiveObject();
                fc.renderAll();
            }
        }
    } catch (e) {}
    try {
        const store = pwcaGetPreviewCanvasStore();
        const views = store && Array.isArray(store.views) ? store.views : [];
        if (views.length > 0) { await window.showUniversalViewPreview(views); return; }
    } catch (error) {}
    const previewContainer = document.querySelector('.preview-canvas-container');
    const imageData = await (previewContainer ? capturePreviewCanvas() : captureCanvas());
    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(`
     <html>
       <head>
         <title>Preview</title>
         <style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f0f0;}img{max-width:100%;max-height:90vh;box-shadow:0 0 20px rgba(0,0,0,0.1);} </style>
       </head>
       <body>
         <img src="${imageData}" alt="Preview">
       </body>
     </html>
   `);
    previewWindow.document.close();
});

function calculateArcTextProperties(textObject, arcValue) {
    const originalText = textObject.text;
    const chars = originalText.split('');
    const totalWidth = textObject.width;
    const fontSize = textObject.fontSize;
    const charProperties = [];
    let currentX = 0;
    const avgCharWidth = totalWidth / chars.length;
    chars.forEach((char, index) => {
        const charRelativeCenterX = currentX + avgCharWidth / 2 - totalWidth / 2;
        const normalizedX = charRelativeCenterX / totalWidth;
        const dy = Math.sin((normalizedX + 0.5) * Math.PI) * (arcValue * 0.5);
        const angle = Math.cos((normalizedX + 0.5) * Math.PI) * (arcValue * 0.1);
        charProperties.push({ char: char, dx: charRelativeCenterX, dy: dy, angle: angle, width: avgCharWidth });
        currentX += avgCharWidth;
    });
    return charProperties;
}

function applyArcDistortionToTextObject(textObject, arcValue) {
    if (!textObject || (textObject.type !== 'text' && !(textObject.type === 'group' && textObject._isArcDistorted))) return;
    const originalText = textObject._isArcDistorted ? textObject._originalTextConfig.text : textObject.text;
    const originalOptions = textObject._isArcDistorted ? textObject._originalTextConfig.options : {
        left: textObject.left,
        top: textObject.top,
        fontFamily: textObject.fontFamily,
        fontSize: textObject.fontSize,
        fill: textObject.fill,
        angle: textObject.angle,
        scaleX: textObject.scaleX,
        scaleY: textObject.scaleY,
        originX: textObject.originX,
        originY: textObject.originY,
        width: textObject.width,
        height: textObject.height,
    };
    const c = typeof window.getActiveCanvas === 'function' ? window.getActiveCanvas() : null;
    if (!c) return;
    c.remove(textObject);
    const chars = originalText.split('');
    const charObjects = [];
    const tempMeasurer = new fabric.Text('', { fontFamily: originalOptions.fontFamily, fontSize: originalOptions.fontSize });
    chars.forEach((char, index) => {
        tempMeasurer.set('text', char);
        const charProps = calculateArcTextProperties({ text: originalText, width: originalOptions.width, fontSize: originalOptions.fontSize }, arcValue)[index];
        const charObject = new fabric.Text(char, {
            left: originalOptions.left + charProps.dx,
            top: originalOptions.top + charProps.dy,
            angle: originalOptions.angle + charProps.angle,
            fontFamily: originalOptions.fontFamily,
            fontSize: originalOptions.fontSize,
            fill: originalOptions.fill,
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            textBaseline: 'alphabetic',
        });
        charObjects.push(charObject);
    });
    const arcGroup = new fabric.Group(charObjects, {
        left: originalOptions.left,
        top: originalOptions.top,
        angle: originalOptions.angle,
        selectable: true,
        evented: true,
        _isArcDistorted: true,
        _originalTextConfig: { text: originalText, options: originalOptions },
        id: textObject.id
    });
    c.add(arcGroup);
    c.setActiveObject(arcGroup);
    c.renderAll();
}

window.calculateArcTextProperties = calculateArcTextProperties;
window.applyArcDistortionToTextObject = applyArcDistortionToTextObject;
