<!-- 图片 -->
<div id="content-pianquan" class="content-pane">
    <div id="img_origin_controls">
        <div id="dropZone" style="border: 2px dashed #ccc; padding: 20px; text-align: center; margin-bottom: 10px;">
            Drag and drop your image here or click to upload
        </div>
        <input type="file" id="imageInput" accept="image/*" style="display: none;" />
        <script>
            // 拖放事件处理
            const dropZone = document.getElementById('dropZone');
            dropZone.addEventListener('dragover', (event) => {
                event.preventDefault();
                dropZone.style.backgroundColor = '#f0f0f0';
            });
            dropZone.addEventListener('dragleave', () => {
                dropZone.style.backgroundColor = '#fff';
            });
            dropZone.addEventListener('drop', (event) => {
                event.preventDefault();
                dropZone.style.backgroundColor = '#fff';
                const files = event.dataTransfer.files;
                if (files.length > 0) {
                    const file = files[0];
                    if (file.type.startsWith('image/')) {
                        uploadImageToServer(file);
                    } else {
                        alert('请上传有效的图片文件。');
                    }
                }
            });

            // 上传图片到服务器的函数
            function uploadImageToServer(file) {
                const formData = new FormData();
                formData.append('file', file);

                // 显示上传中状态
                const dropZone = document.getElementById('dropZone');
                const originalText = dropZone.innerHTML;
                dropZone.innerHTML = '<div style="color: #666;">Uploading...</div>';
                dropZone.style.backgroundColor = '#f0f0f0';

                fetch('/wp-json/pw-canvas/v1/upload-image', {
                    method: 'POST',
                    body: formData,
                })
                .then(response => response.json())
                .then(data => {
                    // 恢复原始状态
                    dropZone.innerHTML = originalText;
                    dropZone.style.backgroundColor = '#fff';

                    if (data.success) {
                        const imgElement = new Image();
                        imgElement.src = data.url;
                        imgElement.onload = function() {
                            addImageToCanvas(imgElement, data.filename);
                        };
                    } else {
                        alert('上传失败: ' + (data.message || '未知错误'));
                    }
                })
                .catch(error => {
                    // 恢复原始状态
                    dropZone.innerHTML = originalText;
                    dropZone.style.backgroundColor = '#fff';
                    console.error('上传错误:', error);
                    alert('上传失败: ' + error.message);
                });
            }
            // 添加图片到画布的函数
            function addImageToCanvas(imgElement, fileName = '') {
                // 获取当前激活的画布
                const activeCanvas = getActiveCanvas();
                if (!activeCanvas) {
                    console.warn('No active canvas found');
                    return;
                }

                // 计算宽高比
                const aspectRatio = imgElement.width / imgElement.height;

                // 设定目标宽度为200px
                const targetWidth = 200;
                // 根据宽高比计算目标高度
                const targetHeight = targetWidth / aspectRatio;

                // 生成唯一的图层ID
                const layerId = 'layer_' + Date.now();

                // 保存现有图片对象的引用，防止它们的属性被修改
                const existingImageObjects = activeCanvas.getObjects().filter(obj => obj.type === 'image');
                const existingImageSources = existingImageObjects.map(obj => ({
                    id: obj.id,
                    src: obj._element ? obj._element.src : (obj.src || ''),
                    element: obj._element,
                    originalElement: obj._originalElement
                }));

                const fabricImage = new fabric.Image(imgElement, {
                    left: activeCanvas.width / 2,
                    top: activeCanvas.height / 2,
                    scaleX: targetWidth / imgElement.width,
                    scaleY: targetHeight / imgElement.height,
                    originX: 'center',
                    originY: 'center',
                    id: layerId,
                    // ===== 核心修复：添加用户操作标记 =====
                    userInitiated: true,  // 标记为用户操作
                    fromButton: true,     // 标记来源为按钮操作
                    fromToolbar: true     // 标记来源为工具栏
                });

                // 检查画布上是否已存在相同来源的图片
                let imageExists = false;
                existingImageSources.forEach(imgInfo => {
                    if (imgInfo.src === imgElement.src) {
                        imageExists = true;
                    }
                });

                if (!imageExists) {
                    activeCanvas.add(fabricImage);
                    activeCanvas.setActiveObject(fabricImage);
                    
                    // 确保现有图片对象的属性不被修改
                    existingImageObjects.forEach((obj, index) => {
                        const originalInfo = existingImageSources[index];
                        if (originalInfo.element && !obj._element) {
                            obj._element = originalInfo.element;
                        }
                        if (originalInfo.originalElement && !obj._originalElement) {
                            obj._originalElement = originalInfo.originalElement;
                        }
                        if (originalInfo.src && !obj.src) {
                            obj.src = originalInfo.src;
                        }
                    });
                    
                    activeCanvas.renderAll();

                    // 不再强制更新全局canvas引用，让CanvasManager管理画布实例
                    // 这样可以确保每个视图的画布独立工作

                    // 延迟再次渲染以确保显示
                     setTimeout(() => {
                         // 再次确保现有图片对象的属性完整
                         existingImageObjects.forEach((obj, index) => {
                             const originalInfo = existingImageSources[index];
                             if (originalInfo.element && !obj._element) {
                                 obj._element = originalInfo.element;
                             }
                             if (originalInfo.src && (!obj.src || obj.src === '')) {
                                 obj.src = originalInfo.src;
                             }
                         });
                         
                         activeCanvas.renderAll();
                         
                         // 强制刷新当前视图显示
                         const store = window.useCanvasStore && window.useCanvasStore();
                         if (store && store.activeViewId) {
                             const viewContainer = document.getElementById(`view-container-${store.activeViewId}`);
                             if (viewContainer) {
                                 // 隐藏所有视图容器
                                 document.querySelectorAll('.view-container').forEach(container => {
                                     container.style.display = 'none';
                                 });
                                 // 重新显示当前视图容器
                                 viewContainer.style.display = 'block';
                             }
                         }
                         
                         if (typeof window.updatePreviewCanvas === 'function') {
                             window.updatePreviewCanvas();
                         }
                     }, 50);

                    // 同时添加到图层管理系统
                    const layerName = fileName || '图片';
                    if (typeof window.addLayerToStore === 'function') {
                        window.addLayerToStore(layerId, layerName, 'image');
                        
                        // 延迟触发图层面板刷新，确保缩略图正确显示
                        setTimeout(() => {
                            // 触发Vue组件的强制更新
                            const layersApp = document.querySelector('#layers-box').__vue_app__;
                            if (layersApp && layersApp._instance) {
                                layersApp._instance.proxy.$forceUpdate();
                            }
                            
                            // 或者通过事件通知图层组件刷新
                            const refreshEvent = new CustomEvent('layerThumbnailRefresh', {
                                detail: { layerId: layerId }
                            });
                            document.dispatchEvent(refreshEvent);
                        }, 100);
                    } else {
                        console.warn('图层管理系统未初始化');
                    }
                }

                // 添加到上传列表（只存base64和文件名）
                if (imgElement.src && !window.uploadedImages.some(img => img.src === imgElement.src)) {
                    addImageToUploadedList({
                        src: imgElement.src,
                        fileName: fileName
                    });
                }
            }

            // 获取当前激活的画布实例
            function getActiveCanvas() {
                // 优先使用 CanvasManager 获取当前激活视图的画布
                if (window.CanvasManager) {
                    const canvas = window.CanvasManager.getActiveCanvas();
                    if (canvas) {
                        return canvas;
                    }
                }
                
                // 回退方案：通过 store 和 DOM 获取画布实例
                const store = window.useCanvasStore && window.useCanvasStore();
                if (store && store.activeViewId) {
                    // 从 DOM 获取对应视图的画布元素
                    const canvasElement = document.getElementById(`mainCanvas-${store.activeViewId}`);
                    if (canvasElement && canvasElement.__fabricCanvas) {
                        return canvasElement.__fabricCanvas;
                    }
                }
                
                // 最后的回退方案
                return window.canvas || window.fabricCanvas;
            }
        </script>

        <button id="addImageBtn" class="btn btn-custom" style="margin-top: 10px;" onclick="document.getElementById('imageInput').click()">
            <svg viewBox="0 0 24 24" width="16" height="16" style="vertical-align: middle;">
                <path fill="currentColor"
                    d="M21,19V5c0-1.1-0.9-2-2-2H5c-1.1,0-2,0.9-2,2v14c0,1.1,0.9,2,2,2h14C20.1,21,21,20.1,21,19z M8.5,13.5l2.5,3.01L14.5,12l4.5,6H5l3.5-4.5z" />
            </svg>
            Add Image
        </button>

        <!-- 已上传过的图片 列表显示在这 -->
        <div id="uploaded-images-list" style="margin-top: 20px;">
            <h3 style="font-size: 1rem; margin-bottom: 10px;">Uploaded Images</h3>
            <div id="uploaded-images-container" style="display: flex; flex-wrap: wrap; gap: 10px;">
                <!-- 图片缩略图将通过JS动态插入 -->
            </div>
        </div>
        <script>
            // 存储已上传图片的数组（对象：{src, fileName}）
            window.uploadedImages = [];

            // 添加图片到上传列表
            function addImageToUploadedList(imgObj) {
                // 检查图片是否已存在于列表中
                if (!window.uploadedImages.some(img => img.src === imgObj.src)) {
                    window.uploadedImages.push(imgObj);
                    renderUploadedImages();
                }
            }

            // 渲染已上传图片缩略图
            function renderUploadedImages() {
                const container = document.getElementById('uploaded-images-container');
                container.innerHTML = '';
                if (window.uploadedImages.length === 0) {
                    container.innerHTML = '<div style="color:#888;">No uploaded images</div>';

                    return;
                }
                window.uploadedImages.forEach((imgObj, idx) => {
                    const src = imgObj.src;
                    const fileName = imgObj.fileName || '未知';
                    const wrapper = document.createElement('div');
                    wrapper.style.position = 'relative';
                    wrapper.style.width = '70px';
                    wrapper.style.height = '110px'; // 增高以容纳更多信息
                    wrapper.style.border = '1px solid #eee';
                    wrapper.style.borderRadius = '6px';
                    wrapper.style.overflow = 'hidden';
                    wrapper.style.background = '#fafafa';
                    wrapper.style.display = 'flex';
                    wrapper.style.flexDirection = 'column';
                    wrapper.style.alignItems = 'center';

                    const img = document.createElement('img');
                    img.src = src;
                    img.style.width = '60px';
                    img.style.height = '60px';
                    img.style.objectFit = 'cover';
                    img.title = '点击添加到画布';
                    img.style.cursor = 'pointer';
                    img.onclick = function() {
                        // 重新添加到画布
                        const imgElement = new Image();
                        imgElement.src = src;
                        imgElement.onload = function() {
                            addImageToCanvas(imgElement, fileName);
                        };
                    };

                    // 信息div
                    const infoDiv = document.createElement('div');
                    infoDiv.style.fontSize = '11px';
                    infoDiv.style.color = '#666';
                    infoDiv.style.textAlign = 'center';
                    infoDiv.style.marginTop = '2px';
                    infoDiv.innerText = '加载中...';

                    // 解析文件类型
                    let fileType = '';
                    if (src.startsWith('data:image/')) {
                        const match = src.match(/^data:(image\/[a-zA-Z0-9.+-]+);/);
                        if (match) {
                            fileType = match[1];
                        }
                    }

                    // 计算图片尺寸和大小
                    const tempImg = new Image();
                    tempImg.src = src;
                    tempImg.onload = function() {
                        // base64图片大小
                        let size = 0;
                        if (src.startsWith('data:image/')) {
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

                        // 尝试获取DPI（仅部分图片格式支持，base64无法直接获取，通常为72）
                        let dpi = 72;

                        // 展示信息
                        infoDiv.innerHTML = `
                        <div style="word-break:break-all;">${fileName}</div>
                        <div>${fileType ? fileType : ''}</div>
                        <div>${tempImg.width}×${tempImg.height} ${sizeStr}</div>
                        <div>DPI: ${dpi}</div>
                    `;
                    };

                    // 删除按钮
                    const delBtn = document.createElement('button');
                    delBtn.innerHTML = '&times;';
                    delBtn.style.position = 'absolute';
                    delBtn.style.top = '2px';
                    delBtn.style.right = '2px';
                    delBtn.style.background = 'rgba(0,0,0,0.5)';
                    delBtn.style.color = '#fff';
                    delBtn.style.border = 'none';
                    delBtn.style.borderRadius = '50%';
                    delBtn.style.width = '18px';
                    delBtn.style.height = '18px';
                    delBtn.style.cursor = 'pointer';
                    delBtn.title = '删除图片';
                    delBtn.onclick = function(e) {
                        e.stopPropagation();
                        window.uploadedImages.splice(idx, 1);
                        renderUploadedImages();
                    };

                    wrapper.appendChild(img);
                    wrapper.appendChild(delBtn);
                    wrapper.appendChild(infoDiv);
                    container.appendChild(wrapper);
                });
            }

            // 修改addImageToCanvas和拖拽上传，添加到上传列表
            // 已在上面实现

            // 监听文件上传input
            document.getElementById('imageInput').addEventListener('change', function(event) {
                const file = event.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    uploadImageToServer(file);
                }
                // 清空input值，允许重复上传同一文件
                event.target.value = '';
            });

            // 已移除重复的拖拽上传事件监听器，以防止图片重复添加

            // 初始化
            renderUploadedImages();
        </script>
    </div>
    <div id="img_add_controls">

    </div>
</div>