(function () {
    'use strict';

    function pwcaIsImageModuleEnabled() {
        if (typeof window.pwcaIsOperationPanelTabAvailable !== 'function') {
            return true;
        }

        return window.pwcaIsOperationPanelTabAvailable('tab-pianquan');
    }

    function pwcaEnsureUploadedImagesStore() {
        if (!Array.isArray(window.uploadedImages)) {
            window.uploadedImages = [];
        }
        return window.uploadedImages;
    }

    function pwcaGetCanvasStore() {
        if (typeof window.useCanvasStore !== 'function') {
            return null;
        }

        try {
            return window.useCanvasStore();
        } catch (error) {
            return null;
        }
    }

    function pwcaNormalizeImageFormatExtensions(imageFormatValue) {
        if (Array.isArray(imageFormatValue)) {
            imageFormatValue = imageFormatValue.join(',');
        }

        if (typeof imageFormatValue !== 'string') {
            return [];
        }

        const normalizedList = imageFormatValue
            .split(',')
            .map(function (item) {
                return String(item || '').trim().replace(/^\./, '').toLowerCase();
            })
            .filter(Boolean);

        const aliasMap = {
            jpg: ['jpg', 'jpeg'],
            jpeg: ['jpg', 'jpeg'],
            tif: ['tif', 'tiff'],
            tiff: ['tif', 'tiff']
        };

        const expandedList = [];
        normalizedList.forEach(function (ext) {
            const aliases = aliasMap[ext] || [ext];
            aliases.forEach(function (alias) {
                if (!expandedList.includes(alias)) {
                    expandedList.push(alias);
                }
            });
        });

        return expandedList;
    }

    function pwcaBuildImageAcceptValue(extensions) {
        if (!Array.isArray(extensions) || !extensions.length) {
            return 'image/*';
        }

        return extensions.map(function (ext) {
            return '.' + ext;
        }).join(',');
    }

    function pwcaGetCurrentUploadSettings() {
        const defaultSettings = {
            imageFormatRaw: '',
            allowedExtensions: [],
            accept: 'image/*',
            layerDepth: null,
            scaleMode: 'fit'
        };
        const store = pwcaGetCanvasStore();

        if (!store) {
            return defaultSettings;
        }

        const mergedSettings = store.currentViewCustomizationSettings
            && typeof store.currentViewCustomizationSettings === 'object'
            ? store.currentViewCustomizationSettings
            : (
                store.getStoreCustomizationSettingsData
                && typeof store.getStoreCustomizationSettingsData === 'object'
                    ? store.getStoreCustomizationSettingsData
                    : {}
            );
        const allowedExtensions = pwcaNormalizeImageFormatExtensions(mergedSettings.image_format);
        const layerDepthValue = Number(mergedSettings.layer_depth);
        const normalizedScaleMode = typeof mergedSettings.scale_mode === 'string'
            ? mergedSettings.scale_mode.trim().toLowerCase()
            : '';

        return {
            imageFormatRaw: typeof mergedSettings.image_format === 'string'
                ? mergedSettings.image_format
                : '',
            allowedExtensions: allowedExtensions,
            accept: pwcaBuildImageAcceptValue(allowedExtensions),
            layerDepth: Number.isFinite(layerDepthValue) ? layerDepthValue : null,
            scaleMode: ['fit', 'cover', 'original'].includes(normalizedScaleMode)
                ? normalizedScaleMode
                : 'fit'
        };
    }

    function pwcaGetFileExtension(fileName) {
        if (typeof fileName !== 'string') {
            return '';
        }

        const parts = fileName.split('.');
        return parts.length > 1 ? parts.pop().trim().toLowerCase() : '';
    }

    function pwcaIsAllowedImageFile(file, uploadSettings) {
        if (!file) {
            return false;
        }

        const settings = uploadSettings || pwcaGetCurrentUploadSettings();
        const allowedExtensions = Array.isArray(settings.allowedExtensions)
            ? settings.allowedExtensions
            : [];
        const fileType = typeof file.type === 'string' ? file.type.toLowerCase() : '';

        if (!allowedExtensions.length) {
            return fileType.startsWith('image/') || !!pwcaGetFileExtension(file.name);
        }

        const fileExtension = pwcaGetFileExtension(file.name);
        if (fileExtension && allowedExtensions.includes(fileExtension)) {
            return true;
        }

        const mimeExtension = fileType.startsWith('image/')
            ? fileType.replace('image/', '').split('+')[0]
            : '';

        return !!mimeExtension && allowedExtensions.includes(mimeExtension);
    }

    function pwcaGetInvalidImageTypeMessage(uploadSettings) {
        const settings = uploadSettings || pwcaGetCurrentUploadSettings();

        if (settings.imageFormatRaw) {
            return '请上传允许的图片格式：' + settings.imageFormatRaw;
        }

        return '请上传有效的图片文件。';
    }

    function pwcaSyncImageInputAccept(imageInput) {
        if (!imageInput) {
            return;
        }

        imageInput.setAttribute('accept', pwcaGetCurrentUploadSettings().accept);
    }

    function pwcaResolveImageScaleRatio(imgElement, canvas, scaleMode) {
        const imageWidth = Number(imgElement && imgElement.width);
        const imageHeight = Number(imgElement && imgElement.height);
        const canvasWidth = Number(canvas && canvas.width);
        const canvasHeight = Number(canvas && canvas.height);

        if (
            !Number.isFinite(imageWidth) || imageWidth <= 0 ||
            !Number.isFinite(imageHeight) || imageHeight <= 0 ||
            !Number.isFinite(canvasWidth) || canvasWidth <= 0 ||
            !Number.isFinite(canvasHeight) || canvasHeight <= 0
        ) {
            return 1;
        }

        if (scaleMode === 'original') {
            return 1;
        }

        const widthRatio = canvasWidth / imageWidth;
        const heightRatio = canvasHeight / imageHeight;

        if (scaleMode === 'cover') {
            return Math.max(widthRatio, heightRatio);
        }

        return Math.min(widthRatio, heightRatio);
    }

    function pwcaApplyLayerDepth(canvas, fabricImage, layerDepth) {
        if (!canvas || !fabricImage || !Number.isFinite(layerDepth)) {
            return;
        }

        const objects = typeof canvas.getObjects === 'function' ? canvas.getObjects() : [];
        const maxIndex = Math.max(0, objects.length - 1);

        if (layerDepth === -1) {
            if (typeof canvas.bringToFront === 'function') {
                canvas.bringToFront(fabricImage);
            }
            return;
        }

        if (layerDepth < 0) {
            return;
        }

        const targetIndex = Math.min(layerDepth, maxIndex);
        if (typeof canvas.moveTo === 'function') {
            canvas.moveTo(fabricImage, targetIndex);
        } else if (typeof fabricImage.moveTo === 'function') {
            fabricImage.moveTo(targetIndex);
        }
    }

    function pwcaInitDropZone(dropZone, imageInput) {
        dropZone.addEventListener('dragover', function (event) {
            event.preventDefault();
            dropZone.classList.add('pwca-dropzone--hover');
        });

        dropZone.addEventListener('dragleave', function () {
            dropZone.classList.remove('pwca-dropzone--hover');
        });

        dropZone.addEventListener('drop', function (event) {
            event.preventDefault();
            dropZone.classList.remove('pwca-dropzone--hover');
            const files = event.dataTransfer && event.dataTransfer.files ? event.dataTransfer.files : [];
            if (!files.length) {
                return;
            }
            const file = files[0];
            const uploadSettings = pwcaGetCurrentUploadSettings();
            if (pwcaIsAllowedImageFile(file, uploadSettings)) {
                pwcaUploadImageToServer(file, dropZone);
            } else {
                // eslint-disable-next-line no-alert
                window.alert(pwcaGetInvalidImageTypeMessage(uploadSettings));
            }
        });

        dropZone.addEventListener('click', function () {
            if (imageInput) {
                pwcaSyncImageInputAccept(imageInput);
                imageInput.click();
            }
        });
    }

    function pwcaShowDropZoneStatus(dropZone, message) {
        if (!dropZone) {
            return;
        }
        dropZone.classList.add('pwca-dropzone--uploading');
        dropZone.innerHTML = '';
        const status = document.createElement('div');
        status.className = 'pwca-dropzone-status';
        status.textContent = message;
        dropZone.appendChild(status);
    }

    function pwcaResetDropZoneStatus(dropZone, defaultText) {
        if (!dropZone) {
            return;
        }
        dropZone.classList.remove('pwca-dropzone--uploading');
        dropZone.textContent = defaultText;
    }

    function pwcaUploadImageToServer(file, dropZone) {
        const uploadSettings = pwcaGetCurrentUploadSettings();
        if (!pwcaIsAllowedImageFile(file, uploadSettings)) {
            // eslint-disable-next-line no-alert
            window.alert(pwcaGetInvalidImageTypeMessage(uploadSettings));
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        const defaultText = 'Drag and drop your image here or click to upload';
        pwcaShowDropZoneStatus(dropZone, 'Uploading...');

        window.fetch('/wp-json/pw-canvas/v1/upload-image', {
            method: 'POST',
            body: formData
        })
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                pwcaResetDropZoneStatus(dropZone, defaultText);

                if (!data || !data.success || !data.url) {
                    // eslint-disable-next-line no-alert
                    window.alert('上传失败: ' + (data && data.message ? data.message : '未知错误'));
                    return;
                }

                const imgElement = new Image();
                imgElement.src = data.url;
                imgElement.onload = function () {
                    pwcaAddImageToCanvas(imgElement, data.filename || '');
                };
            })
            .catch(function (error) {
                pwcaResetDropZoneStatus(dropZone, defaultText);
                // eslint-disable-next-line no-console
                console.error('上传错误:', error);
                // eslint-disable-next-line no-alert
                window.alert('上传失败: ' + error.message);
            });
    }

    function pwcaSnapshotExistingImages(canvas) {
        const objects = typeof canvas.getObjects === 'function' ? canvas.getObjects() : [];
        const imageObjects = objects.filter(function (obj) {
            return obj && obj.type === 'image';
        });

        return imageObjects.map(function (obj) {
            const element = obj._element || null;
            const src = element ? element.src : (obj.src || '');
            return {
                object: obj,
                element: element,
                originalElement: obj._originalElement || null,
                src: src
            };
        });
    }

    function pwcaRestoreExistingImages(snapshots) {
        snapshots.forEach(function (snapshot) {
            const obj = snapshot.object;
            if (!obj) {
                return;
            }
            if (snapshot.element && !obj._element) {
                obj._element = snapshot.element;
            }
            if (snapshot.originalElement && !obj._originalElement) {
                obj._originalElement = snapshot.originalElement;
            }
            if (snapshot.src && !obj.src) {
                obj.src = snapshot.src;
            }
        });
    }

    function pwcaRefreshActiveView(canvas) {
        const store = window.useCanvasStore && window.useCanvasStore();
        if (!store || !store.activeViewId) {
            return;
        }

        const viewContainer = document.getElementById('view-container-' + store.activeViewId);
        if (!viewContainer) {
            return;
        }

        const allContainers = document.querySelectorAll('.view-container');
        allContainers.forEach(function (container) {
            container.style.display = 'none';
        });

        viewContainer.style.display = 'block';

        if (typeof window.updatePreviewCanvas === 'function') {
            window.updatePreviewCanvas();
        }
    }

    function pwcaNotifyLayerStoreForImage(layerId, fileName) {
        const layerName = fileName || '图片';
        if (typeof window.addLayerToStore === 'function') {
            window.addLayerToStore(layerId, layerName, 'image');

            window.setTimeout(function () {
                const layersBox = document.getElementById('layers-box');
                const vueApp = layersBox && layersBox.__vue_app__ ? layersBox.__vue_app__ : null;
                if (vueApp && vueApp._instance && vueApp._instance.proxy && typeof vueApp._instance.proxy.$forceUpdate === 'function') {
                    vueApp._instance.proxy.$forceUpdate();
                }

                const refreshEvent = new CustomEvent('layerThumbnailRefresh', {
                    detail: { layerId: layerId }
                });
                document.dispatchEvent(refreshEvent);
            }, 100);
        } else {
            // eslint-disable-next-line no-console
            console.warn('图层管理系统未初始化');
        }
    }

    function pwcaGetActiveCanvasForImage() {
        if (typeof window.getActiveCanvas === 'function') {
            return window.getActiveCanvas();
        }
        if (window.CanvasManager && typeof window.CanvasManager.getActiveCanvas === 'function') {
            return window.CanvasManager.getActiveCanvas();
        }
        return window.canvas || window.fabricCanvas || null;
    }

    function pwcaAddImageToCanvas(imgElement, fileName) {
        const activeCanvas = pwcaGetActiveCanvasForImage();
        if (!activeCanvas) {
            // eslint-disable-next-line no-console
            console.warn('No active canvas found');
            return;
        }

        const uploadSettings = pwcaGetCurrentUploadSettings();
        const scaleRatio = pwcaResolveImageScaleRatio(
            imgElement,
            activeCanvas,
            uploadSettings.scaleMode
        );
        const layerId = 'layer_' + Date.now();

        const snapshots = pwcaSnapshotExistingImages(activeCanvas);
        const imageExists = snapshots.some(function (info) {
            return info.src === imgElement.src;
        });

        if (!imageExists) {
            const fabricImage = new fabric.Image(imgElement, {
                left: activeCanvas.width / 2,
                top: activeCanvas.height / 2,
                scaleX: scaleRatio,
                scaleY: scaleRatio,
                originX: 'center',
                originY: 'center',
                id: layerId,
                userInitiated: true,
                fromButton: true,
                fromToolbar: true
            });

            activeCanvas.add(fabricImage);
            pwcaApplyLayerDepth(activeCanvas, fabricImage, uploadSettings.layerDepth);
            activeCanvas.setActiveObject(fabricImage);

            pwcaRestoreExistingImages(snapshots);
            activeCanvas.renderAll();

            window.setTimeout(function () {
                pwcaRestoreExistingImages(pwcaSnapshotExistingImages(activeCanvas));
                activeCanvas.renderAll();
                pwcaRefreshActiveView(activeCanvas);
            }, 50);

            pwcaNotifyLayerStoreForImage(layerId, fileName);
        }

        const uploadedImages = pwcaEnsureUploadedImagesStore();
        if (imgElement.src && !uploadedImages.some(function (img) { return img.src === imgElement.src; })) {
            pwcaAddImageToUploadedList({
                src: imgElement.src,
                fileName: fileName
            });
        }

        if (typeof window.updatePreviewCanvas === 'function') {
            window.updatePreviewCanvas();
        }
    }

    function pwcaAddImageToUploadedList(imgObj) {
        const uploadedImages = pwcaEnsureUploadedImagesStore();
        if (!uploadedImages.some(function (img) { return img.src === imgObj.src; })) {
            uploadedImages.push(imgObj);
            pwcaRenderUploadedImages();
        }
    }

    function pwcaBuildImageMetaHtml(tempImg, src, fileName) {
        let fileType = '';
        if (src && src.indexOf('data:image/') === 0) {
            const match = src.match(/^data:(image\/[a-zA-Z0-9.+-]+);/);
            if (match) {
                fileType = match[1];
            }
        }

        let size = 0;
        if (src && src.indexOf('data:image/') === 0) {
            const base64Str = src.split(',')[1] || '';
            size = Math.floor((base64Str.length * 3) / 4);
        }
        let sizeStr = '';
        if (size > 1024 * 1024) {
            sizeStr = (size / (1024 * 1024)).toFixed(2) + 'MB';
        } else if (size > 1024) {
            sizeStr = (size / 1024).toFixed(1) + 'KB';
        } else {
            sizeStr = size + 'B';
        }

        const dpi = 72;
        const safeName = fileName || '未知';
        const dimensions = tempImg.width + '×' + tempImg.height;

        return ''
            + '<div class="pwca-uploaded-image-name">' + safeName + '</div>'
            + '<div class="pwca-uploaded-image-type">' + (fileType || '') + '</div>'
            + '<div class="pwca-uploaded-image-size">' + dimensions + ' ' + sizeStr + '</div>'
            + '<div class="pwca-uploaded-image-dpi">DPI: ' + dpi + '</div>';
    }

    function pwcaRenderUploadedImages() {
        const container = document.getElementById('uploaded-images-container');
        if (!container) {
            return;
        }

        container.innerHTML = '';
        const uploadedImages = pwcaEnsureUploadedImagesStore();

        if (!uploadedImages.length) {
            const empty = document.createElement('div');
            empty.className = 'pwca-uploaded-images-empty';
            empty.textContent = 'No uploaded images';
            container.appendChild(empty);
            return;
        }

        uploadedImages.forEach(function (imgObj, idx) {
            const src = imgObj.src;
            const fileName = imgObj.fileName || '未知';

            const wrapper = document.createElement('div');
            wrapper.className = 'pwca-uploaded-image-card';

            const img = document.createElement('img');
            img.src = src;
            img.className = 'pwca-uploaded-image';
            img.title = '点击添加到画布';
            img.addEventListener('click', function () {
                const imageEl = new Image();
                imageEl.src = src;
                imageEl.onload = function () {
                    pwcaAddImageToCanvas(imageEl, fileName);
                };
            });

            const infoDiv = document.createElement('div');
            infoDiv.className = 'pwca-uploaded-image-info';
            infoDiv.textContent = '加载中...';

            const tempImg = new Image();
            tempImg.src = src;
            tempImg.onload = function () {
                infoDiv.innerHTML = pwcaBuildImageMetaHtml(tempImg, src, fileName);
            };

            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'pwca-uploaded-image-delete';
            delBtn.innerHTML = '&times;';
            delBtn.title = '删除图片';
            delBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                uploadedImages.splice(idx, 1);
                pwcaRenderUploadedImages();
            });

            wrapper.appendChild(img);
            wrapper.appendChild(delBtn);
            wrapper.appendChild(infoDiv);
            container.appendChild(wrapper);
        });
    }

    function pwcaInitFileInput(imageInput, dropZone) {
        imageInput.addEventListener('change', function (event) {
            const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
            const uploadSettings = pwcaGetCurrentUploadSettings();
            if (pwcaIsAllowedImageFile(file, uploadSettings)) {
                pwcaUploadImageToServer(file, dropZone);
            } else if (file) {
                // eslint-disable-next-line no-alert
                window.alert(pwcaGetInvalidImageTypeMessage(uploadSettings));
            }
            event.target.value = '';
        });

        const addImageBtn = document.getElementById('addImageBtn');
        if (addImageBtn) {
            if (addImageBtn.dataset.pwcaImageBtnBound === '1') {
                return;
            }
            addImageBtn.dataset.pwcaImageBtnBound = '1';
            addImageBtn.addEventListener('click', function (event) {
                if (event && typeof event.preventDefault === 'function') {
                    event.preventDefault();
                }
                pwcaSyncImageInputAccept(imageInput);
                imageInput.click();
            });
        }
    }

    function pwcaInitImageTab() {
        if (!pwcaIsImageModuleEnabled()) {
            return;
        }

        const dropZone = document.getElementById('dropZone');
        const imageInput = document.getElementById('imageInput');
        if (!dropZone || !imageInput) {
            return;
        }

        pwcaSyncImageInputAccept(imageInput);

        if (dropZone.dataset.pwcaImageTabInited === '1') {
            pwcaRenderUploadedImages();
            return;
        }
        dropZone.dataset.pwcaImageTabInited = '1';

        pwcaEnsureUploadedImagesStore();
        pwcaInitDropZone(dropZone, imageInput);
        pwcaInitFileInput(imageInput, dropZone);
        pwcaRenderUploadedImages();
    }

    window.pwcaInitImageTab = pwcaInitImageTab;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', pwcaInitImageTab);
    } else {
        pwcaInitImageTab();
    }

    document.addEventListener('pwcaOperationPanelModulesUpdated', pwcaInitImageTab);
})();
