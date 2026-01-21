(function () {
    'use strict';

    function pwcaEnsureUploadedImagesStore() {
        if (!Array.isArray(window.uploadedImages)) {
            window.uploadedImages = [];
        }
        return window.uploadedImages;
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
            if (file && file.type && file.type.startsWith('image/')) {
                pwcaUploadImageToServer(file, dropZone);
            } else {
                // eslint-disable-next-line no-alert
                window.alert('请上传有效的图片文件。');
            }
        });

        dropZone.addEventListener('click', function () {
            if (imageInput) {
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

        const aspectRatio = imgElement.height ? (imgElement.width / imgElement.height) : 1;
        const targetWidth = 200;
        const targetHeight = targetWidth / aspectRatio;
        const layerId = 'layer_' + Date.now();

        const snapshots = pwcaSnapshotExistingImages(activeCanvas);
        const imageExists = snapshots.some(function (info) {
            return info.src === imgElement.src;
        });

        if (!imageExists) {
            const fabricImage = new fabric.Image(imgElement, {
                left: activeCanvas.width / 2,
                top: activeCanvas.height / 2,
                scaleX: targetWidth / imgElement.width,
                scaleY: targetHeight / imgElement.height,
                originX: 'center',
                originY: 'center',
                id: layerId,
                userInitiated: true,
                fromButton: true,
                fromToolbar: true
            });

            activeCanvas.add(fabricImage);
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
            if (file && file.type && file.type.startsWith('image/')) {
                pwcaUploadImageToServer(file, dropZone);
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
                imageInput.click();
            });
        }
    }

    function pwcaInitImageTab() {
        const dropZone = document.getElementById('dropZone');
        const imageInput = document.getElementById('imageInput');
        if (!dropZone || !imageInput) {
            return;
        }

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
})();
