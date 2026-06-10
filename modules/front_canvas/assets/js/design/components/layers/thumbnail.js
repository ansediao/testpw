// 缩略图与图片信息相关逻辑
// 负责：生成图层缩略图、解析图片信息（文件名/格式/DPI）、管理缩略图缓存

export function createThumbnailHelpers(getCanvasInstance) {
    const thumbnailCache = Vue.ref(new Map());

    const clearThumbnailCache = (layerId = null) => {
        if (layerId) {
            thumbnailCache.value.delete(layerId);
        } else {
            thumbnailCache.value.clear();
        }
    };

    const generateThumbnail = (obj, layerId) => {
        try {
            const THUMBNAIL_SIZE = 32;
            const THUMBNAIL_PADDING = 0;
            const CONTENT_SIZE = THUMBNAIL_SIZE - THUMBNAIL_PADDING * 2;

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = THUMBNAIL_SIZE;
            tempCanvas.height = THUMBNAIL_SIZE;
            const tempCtx = tempCanvas.getContext('2d');

            tempCtx.fillStyle = '#f5f5f5';
            tempCtx.fillRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);

            if (obj.type === 'image') {
                return generateImageThumbnail(
                    obj,
                    layerId,
                    tempCanvas,
                    tempCtx,
                    CONTENT_SIZE,
                    THUMBNAIL_PADDING
                );
            }

            const tempFabricCanvas = new fabric.Canvas(tempCanvas);

            obj.clone((cloned) => {
                try {
                    const objWidth =
                        cloned.width * cloned.scaleX || cloned.width || 100;
                    const objHeight =
                        cloned.height * cloned.scaleY || cloned.height || 100;

                    const scale = Math.min(
                        CONTENT_SIZE / objWidth,
                        CONTENT_SIZE / objHeight
                    );

                    cloned.set({
                        left: THUMBNAIL_SIZE / 2,
                        top: THUMBNAIL_SIZE / 2,
                        scaleX: scale,
                        scaleY: scale,
                        originX: 'center',
                        originY: 'center'
                    });

                    tempFabricCanvas.add(cloned);
                    tempFabricCanvas.renderAll();
                } catch (error) {
                    // ignore
                }
            });

            const dataUrl = tempCanvas.toDataURL('image/png');
            tempFabricCanvas.dispose();

            if (dataUrl) {
                thumbnailCache.value.set(layerId, {
                    src: dataUrl,
                    timestamp: Date.now()
                });
            }

            return dataUrl;
        } catch (error) {
            return '';
        }
    };

    const drawImageThumbnail = (ctx, imageElement, contentSize, padding) => {
        const imgWidth = imageElement.naturalWidth || imageElement.width;
        const imgHeight = imageElement.naturalHeight || imageElement.height;

        if (imgWidth === 0 || imgHeight === 0) {
            return;
        }

        const scale = Math.min(
            contentSize / imgWidth,
            contentSize / imgHeight
        );
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;

        const x = padding + (contentSize - scaledWidth) / 2;
        const y = padding + (contentSize - scaledHeight) / 2;

        ctx.drawImage(imageElement, x, y, scaledWidth, scaledHeight);
    };

    const generateImageThumbnail = (
        obj,
        layerId,
        canvas,
        ctx,
        contentSize,
        padding
    ) => {
        try {
            let imageElement = null;
            let imageSrc = '';

            if (obj._element && obj._element.src) {
                imageElement = obj._element;
                imageSrc = obj._element.src;
            } else if (obj.src) {
                imageSrc = obj.src;
            } else if (obj._originalElement && obj._originalElement.src) {
                imageElement = obj._originalElement;
                imageSrc = obj._originalElement.src;
            } else if (obj.getElement && obj.getElement()) {
                const element = obj.getElement();
                if (element && element.src) {
                    imageElement = element;
                    imageSrc = element.src;
                }
            }

            if (!imageSrc && window.pwcaUploadedImages) {
                const matchedImg = window.pwcaUploadedImages.find((img) => {
                    return (
                        img.fileName === obj.layerName ||
                        (obj.id && img.layerId === obj.id)
                    );
                });
                if (matchedImg && matchedImg.src) {
                    imageSrc = matchedImg.src;
                }
            }

            if (!imageSrc) {
                return generateThumbnail(obj, layerId);
            }

            if (imageElement && imageElement.complete) {
                drawImageThumbnail(ctx, imageElement, contentSize, padding);
                const dataUrl = canvas.toDataURL('image/png');

                thumbnailCache.value.set(layerId, {
                    src: dataUrl,
                    timestamp: Date.now()
                });

                return dataUrl;
            }

            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                try {
                    drawImageThumbnail(ctx, img, contentSize, padding);
                    const dataUrl = canvas.toDataURL('image/png');

                    thumbnailCache.value.set(layerId, {
                        src: dataUrl,
                        timestamp: Date.now()
                    });

                    const refreshEvent = new CustomEvent(
                        'layerThumbnailRefresh',
                        {
                            detail: { layerId }
                        }
                    );
                    document.dispatchEvent(refreshEvent);
                } catch (error) {
                    // ignore
                }
            };

            img.onerror = () => {
                // ignore
            };

            img.src = imageSrc;

            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(padding, padding, contentSize, contentSize);
            ctx.fillStyle = '#999';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                '...',
                canvas.width / 2,
                canvas.height / 2 + 3
            );

            return canvas.toDataURL('image/png');
        } catch (error) {
            return '';
        }
    };

    const getDpiFromJPEG = (arrayBuffer) => {
        const view = new DataView(arrayBuffer);
        let offset = 0;

        if (view.getUint16(offset, false) !== 0xffd8) {
            return null;
        }
        offset += 2;

        while (offset < view.byteLength - 1) {
            const marker = view.getUint16(offset, false);
            offset += 2;

            if (marker === 0xffe0) {
                const length = view.getUint16(offset, false);
                if (offset + length > view.byteLength) {
                    break;
                }

                const identifier = String.fromCharCode(
                    view.getUint8(offset + 2),
                    view.getUint8(offset + 3),
                    view.getUint8(offset + 4),
                    view.getUint8(offset + 5),
                    view.getUint8(offset + 6)
                );

                if (identifier === 'JFIF\0') {
                    const units = view.getUint8(offset + 9);
                    const xDensity = view.getUint16(offset + 10, false);
                    const yDensity = view.getUint16(offset + 12, false);

                    if (units === 1 && xDensity > 0 && yDensity > 0) {
                        return { x: xDensity, y: yDensity };
                    }
                    if (units === 2 && xDensity > 0 && yDensity > 0) {
                        return {
                            x: Math.round(xDensity * 2.54),
                            y: Math.round(yDensity * 2.54)
                        };
                    }
                }
                offset += length;
            } else {
                if (offset >= view.byteLength - 1) {
                    break;
                }
                const segmentLength = view.getUint16(offset, false);
                if (
                    segmentLength === 0 ||
                    offset + segmentLength > view.byteLength
                ) {
                    break;
                }
                offset += segmentLength;
            }
        }

        return null;
    };

    const getDpiFromPNG = (arrayBuffer) => {
        const view = new DataView(arrayBuffer);
        let offset = 0;

        const pngSignature = [
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
        ];
        for (let i = 0; i < pngSignature.length; i++) {
            if (view.getUint8(offset + i) !== pngSignature[i]) {
                return null;
            }
        }
        offset += 8;

        while (offset < view.byteLength - 8) {
            const length = view.getUint32(offset, false);
            const type = String.fromCharCode(
                view.getUint8(offset + 4),
                view.getUint8(offset + 5),
                view.getUint8(offset + 6),
                view.getUint8(offset + 7)
            );

            if (type === 'pHYs') {
                const pixelsPerUnitX = view.getUint32(offset + 8, false);
                const pixelsPerUnitY = view.getUint32(offset + 12, false);
                const unitSpecifier = view.getUint8(offset + 16);

                if (
                    unitSpecifier === 1 &&
                    pixelsPerUnitX > 0 &&
                    pixelsPerUnitY > 0
                ) {
                    const dpiX = Math.round(pixelsPerUnitX / 39.3701);
                    const dpiY = Math.round(pixelsPerUnitY / 39.3701);
                    return { x: dpiX, y: dpiY };
                }
            }

            offset += 8 + length + 4;
        }

        return null;
    };

    const getImageLayerInfo = (layer) => {
        const canvasInstance = getCanvasInstance();
        if (!canvasInstance) {
            return null;
        }

        const obj = canvasInstance.getObjects().find((o) => o.id === layer.id);
        if (!obj || obj.type !== 'image') {
            return null;
        }

        try {
            let imageName = 'Unknown';
            let src = '';

            if (obj._element && obj._element.src) {
                src = obj._element.src;
            } else if (obj.src) {
                src = obj.src;
            }

            if (src && window.pwcaUploadedImages) {
                const matchedImg = window.pwcaUploadedImages.find(
                    (img) => img.src === src
                );
                if (matchedImg && matchedImg.fileName) {
                    imageName = matchedImg.fileName;
                }
            }

            if (imageName === 'Unknown' && src) {
                if (src.startsWith('data:image/')) {
                    imageName = 'image.jpg';
                } else {
                    const urlParts = src.split('/');
                    imageName = urlParts[urlParts.length - 1];
                    if (imageName.includes('?')) {
                        imageName = imageName.split('?')[0];
                    }
                }
            }

            if (imageName === 'Unknown' || imageName === '') {
                if (layer.name && layer.name !== layer.id) {
                    imageName = layer.name;
                } else {
                    imageName = `Image_${layer.id.replace('layer_', '')}.jpg`;
                }
            }

            let format = 'Unknown';
            if (src && src.startsWith('data:image/')) {
                const match = src.match(/^data:(image\/[a-zA-Z0-9.+-]+);/);
                if (match) {
                    format = match[1].replace('image/', '').toUpperCase();
                }
            } else if (imageName.includes('.')) {
                const extension = imageName.split('.').pop().toLowerCase();
                switch (extension) {
                    case 'jpg':
                    case 'jpeg':
                        format = 'JPEG';
                        break;
                    case 'png':
                        format = 'PNG';
                        break;
                    case 'gif':
                        format = 'GIF';
                        break;
                    case 'svg':
                        format = 'SVG';
                        break;
                    case 'webp':
                        format = 'WebP';
                        break;
                    default:
                        format = extension.toUpperCase();
                }
            }

            let dpiText = 'Unknown DPI';

            if (
                obj._element &&
                obj._element.src &&
                obj._element.src.startsWith('data:image/')
            ) {
                try {
                    const base64Data = obj._element.src.split(',')[1];
                    const binaryString = atob(base64Data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }

                    let dpi = null;
                    if (format === 'JPEG') {
                        dpi = getDpiFromJPEG(bytes.buffer);
                    } else if (format === 'PNG') {
                        dpi = getDpiFromPNG(bytes.buffer);
                    }

                    if (dpi && dpi.x > 0) {
                        if (dpi.x >= 300) {
                            dpiText = `Good ${dpi.x}DPI`;
                        } else if (dpi.x >= 150) {
                            dpiText = `${dpi.x}DPI`;
                        } else {
                            dpiText = `Low ${dpi.x}DPI`;
                        }
                    } else {
                        dpiText = 'Low 72DPI';
                    }
                } catch (error) {
                    dpiText = 'Low 72DPI';
                }
            } else {
                dpiText = 'Low 72DPI';
            }

            return {
                name: imageName,
                format,
                dpi: dpiText
            };
        } catch (error) {
            return null;
        }
    };

    const getLayerThumbnail = (layer) => {
        if (thumbnailCache.value.has(layer.id)) {
            const cached = thumbnailCache.value.get(layer.id);
            if (Date.now() - cached.timestamp < 300000) {
                return cached.src;
            }
        }

        const canvasInstance = getCanvasInstance();
        if (!canvasInstance) {
            return '';
        }

        const obj = canvasInstance.getObjects().find((o) => o.id === layer.id);
        if (!obj) {
            return '';
        }

        try {
            return generateThumbnail(obj, layer.id);
        } catch (error) {
            return '';
        }
    };

    // 监听缩略图刷新事件，按需清理缓存
    Vue.onMounted(() => {
        const handleThumbnailRefresh = (event) => {
            if (event.detail && event.detail.layerId) {
                clearThumbnailCache(event.detail.layerId);
            } else {
                clearThumbnailCache();
            }
            Vue.nextTick(() => {
                // 占位：依赖 getLayerThumbnail 的地方会自动重新计算
            });
        };

        document.addEventListener(
            'layerThumbnailRefresh',
            handleThumbnailRefresh
        );

        Vue.onUnmounted(() => {
            document.removeEventListener(
                'layerThumbnailRefresh',
                handleThumbnailRefresh
            );
        });
    });

    return {
        thumbnailCache,
        getLayerThumbnail,
        getImageLayerInfo,
        clearThumbnailCache,
        generateThumbnail,
        generateImageThumbnail
    };
}