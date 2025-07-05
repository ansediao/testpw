// 更新动态工具栏
function updateDynamicToolbar(obj) {
    const textToolbarArea = document.querySelector('#content-wenzi-control');
    const imgOriginControls = document.querySelector('#img_origin_controls');
    const imgAddControls = document.querySelector('#img_add_controls');
    const textToolbar = document.querySelector('.text_toolbar');
    const imgToolbar = document.querySelector('.img_toolbar');
    // 清空文本工具栏
    textToolbarArea.innerHTML = '';
    // 如果没有选中对象，则不显示工具栏
    if (!obj) {
        textToolbar.style.display = 'none';
        imgAddControls.style.display = 'none';
        const imgToolbar = document.querySelector('.img_toolbar');
        imgToolbar.style.display = 'none';
        // 恢复图片工具栏区域的原始内容
        imgOriginControls.style.display = 'block';
        return;
    }

    // 如果选中的是文本对象
    if (obj.type === 'text') {
        textToolbar.style.display = 'block';
        imgToolbar.style.display = 'none';
        // 获取当前活动的按钮
        const activeButton = document.querySelector('.toolbar_button.active');
        const activeButtonId = activeButton ? activeButton.id : 'text_input';

        // 创建字体选择器
        if (activeButtonId === 'text_font_style') {
            const fontSelector = document.createElement('div');
            fontSelector.className = 'toolbar-item';
            fontSelector.innerHTML = `
            <label for="fontFamily">字体：</label>
            <select id="fontFamily">
              <option value="Arial" ${obj.fontFamily === 'Arial' ? 'selected' : ''}>Arial</option>
              <option value="Times New Roman" ${obj.fontFamily === 'Times New Roman' ? 'selected' : ''}>Times New Roman</option>
              <option value="Courier New" ${obj.fontFamily === 'Courier New' ? 'selected' : ''}>Courier New</option>
              <option value="SimSun" ${obj.fontFamily === 'SimSun' ? 'selected' : ''}>宋体</option>
              <option value="Microsoft YaHei" ${obj.fontFamily === 'Microsoft YaHei' ? 'selected' : ''}>微软雅黑</option>
            </select>
          `;
            textToolbarArea.appendChild(fontSelector);
            // 创建字体大小选择器
            const fontSizeSelector = document.createElement('div');
            fontSizeSelector.className = 'toolbar-item';
            fontSizeSelector.innerHTML = `
            <label for="fontSize">字号：</label>
            <input type="number" id="fontSize" min="8" max="120" value="${obj.fontSize}">
          `;
            textToolbarArea.appendChild(fontSizeSelector);
        }

        // 创建颜色选择器
        if (activeButtonId === 'text_color') {
            const colorSelector = document.createElement('div');
            colorSelector.className = 'toolbar-item';
            colorSelector.innerHTML = `
            <label for="textColor">颜色：</label>
            <input type="color" id="textColor" value="${obj.fill}">
          `;
            textToolbarArea.appendChild(colorSelector);
        }

        // 创建旋转控制
        if (activeButtonId === 'text_rotate') {
            const rotationControl = document.createElement('div');
            rotationControl.className = 'toolbar-item';
            rotationControl.innerHTML = `
            <label for="textRotation">旋转：</label>
            <input type="number" id="textRotation" min="0" max="360" value="${obj.angle}">
          `;
            textToolbarArea.appendChild(rotationControl);
        }

        // 创建位置控制
        if (activeButtonId === 'text_position') {
            const positionControl = document.createElement('div');
            positionControl.className = 'toolbar-item';
            positionControl.innerHTML = `
            <label>位置：</label>
            <input type="number" id="textPositionX" style="width: 60px;" value="${Math.round(obj.left)}">
            <input type="number" id="textPositionY" style="width: 60px;" value="${Math.round(obj.top)}">
          `;
            textToolbarArea.appendChild(positionControl);

            // 添加对齐按钮
            const alignmentControl = document.createElement('div');
            alignmentControl.className = 'toolbar-item';
            alignmentControl.innerHTML = `
            <label>对齐：</label>
            <button id="textAlignCenterH">水平居中</button>
            <button id="textAlignCenterV">垂直居中</button>
            <button id="textAlignLeft">左对齐</button>
            <button id="textAlignRight">右对齐</button>
            <button id="textAlignTop">上对齐</button>
            <button id="textAlignBottom">下对齐</button>
          `;
            textToolbarArea.appendChild(alignmentControl);

            // 对齐按钮事件监听
            document.getElementById('textAlignCenterH').addEventListener('click', function () {
                if (canvas.getActiveObject() && canvas.getActiveObject().type === 'text') {
                    canvas.getActiveObject().set('left', canvas.width / 2);
                    canvas.getActiveObject().set('originX', 'center');
                    canvas.renderAll();
                    document.getElementById('textPositionX').value = Math.round(canvas.getActiveObject().left);
                }
            });
            document.getElementById('textAlignCenterV').addEventListener('click', function () {
                if (canvas.getActiveObject() && canvas.getActiveObject().type === 'text') {
                    canvas.getActiveObject().set('top', canvas.height / 2);
                    canvas.getActiveObject().set('originY', 'center');
                    canvas.renderAll();
                    document.getElementById('textPositionY').value = Math.round(canvas.getActiveObject().top);
                }
            });
            document.getElementById('textAlignLeft').addEventListener('click', function () {
                if (canvas.getActiveObject() && canvas.getActiveObject().type === 'text') {
                    canvas.getActiveObject().set('left', 0);
                    canvas.getActiveObject().set('originX', 'left');
                    canvas.renderAll();
                    document.getElementById('textPositionX').value = Math.round(canvas.getActiveObject().left);
                }
            });
            document.getElementById('textAlignRight').addEventListener('click', function () {
                if (canvas.getActiveObject() && canvas.getActiveObject().type === 'text') {
                    canvas.getActiveObject().set('left', canvas.width);
                    canvas.getActiveObject().set('originX', 'right');
                    canvas.renderAll();
                    document.getElementById('textPositionX').value = Math.round(canvas.getActiveObject().left);
                }
            });
            document.getElementById('textAlignTop').addEventListener('click', function () {
                if (canvas.getActiveObject() && canvas.getActiveObject().type === 'text') {
                    canvas.getActiveObject().set('top', 0);
                    canvas.getActiveObject().set('originY', 'top');
                    canvas.renderAll();
                    document.getElementById('textPositionY').value = Math.round(canvas.getActiveObject().top);
                }
            });
            document.getElementById('textAlignBottom').addEventListener('click', function () {
                if (canvas.getActiveObject() && canvas.getActiveObject().type === 'text') {
                    canvas.getActiveObject().set('top', canvas.height);
                    canvas.getActiveObject().set('originY', 'bottom');
                    canvas.renderAll();
                    document.getElementById('textPositionY').value = Math.round(canvas.getActiveObject().top);
                }
            });
        }

        // 创建弯曲控制（使用路径来实现文本弯曲效果）
        if (activeButtonId === 'text_distort') {
            const distortControl = document.createElement('div');
            distortControl.className = 'toolbar-item';
            distortControl.innerHTML = `
            <label for="textDistort">弯曲程度：</label>
            <input type="range" id="textDistort" min="-100" max="100" value="0">
            <span id="distortValue">0</span>
          `;
            textToolbarArea.appendChild(distortControl);
        }

        // 如果是输入按钮，隐藏所有控制项
        if (activeButtonId === 'text_input') {
            // 不添加任何控制项，保持工具栏区域为空
        }
        // 添加事件监听，确保元素存在
        const fontFamilyElement = document.getElementById('fontFamily');
        if (fontFamilyElement) {
            fontFamilyElement.addEventListener('change', function () {
                if (canvas.getActiveObject() && canvas.getActiveObject().type === 'text') {
                    canvas.getActiveObject().set('fontFamily', this.value);
                    canvas.renderAll();
                }
            });
        }
        const fontSizeElement = document.getElementById('fontSize');
        if (fontSizeElement) {
            fontSizeElement.addEventListener('change', function () {
                if (canvas.getActiveObject() && canvas.getActiveObject().type === 'text') {
                    canvas.getActiveObject().set('fontSize', parseInt(this.value, 10));
                    canvas.renderAll();
                }
            });
        }
        const textColorElement = document.getElementById('textColor');
        if (textColorElement) {
            textColorElement.addEventListener('input', function () {
                if (canvas.getActiveObject() && canvas.getActiveObject().type === 'text') {
                    canvas.getActiveObject().set('fill', this.value);
                    canvas.renderAll();
                }
            });
        }

        // 旋转事件监听
        const textRotationElement = document.getElementById('textRotation');
        if (textRotationElement) {
            textRotationElement.addEventListener('change', function () {
                if (canvas.getActiveObject() && canvas.getActiveObject().type === 'text') {
                    canvas.getActiveObject().set('angle', parseInt(this.value, 10));
                    canvas.renderAll();
                    console.log('文本旋转已更新为：', this.value);
                }
            });
        }

        // 位置事件监听
        const textPositionXElement = document.getElementById('textPositionX');
        if (textPositionXElement) {
            textPositionXElement.addEventListener('change', function () {
                if (canvas.getActiveObject() && canvas.getActiveObject().type === 'text') {
                    canvas.getActiveObject().set('left', parseInt(this.value, 10));
                    canvas.renderAll();
                }
            });
        }
        const textPositionYElement = document.getElementById('textPositionY');
        if (textPositionYElement) {
            textPositionYElement.addEventListener('change', function () {
                if (canvas.getActiveObject() && canvas.getActiveObject().type === 'text') {
                    canvas.getActiveObject().set('top', parseInt(this.value, 10));
                    canvas.renderAll();
                }
            });
        }

        // 弯曲事件监听
        const distortInput = document.getElementById('textDistort');
        const distortValue = document.getElementById('distortValue');
        if (distortInput && distortValue) {
            distortInput.addEventListener('input', function () {
                const sliderValue = parseFloat(this.value);
                distortValue.textContent = sliderValue;
                if (canvas.getActiveObject() && canvas.getActiveObject().type === 'text') {
                    const text = canvas.getActiveObject();
                    const textWidth = text.width;
                    const textHeight = text.height;
                    const k = 1; // 弯曲程度的缩放因子
                    const cy = -k * sliderValue; // 负值向上弯曲
                    // 调整弯曲顶点位置，使其基于文字顶部或底部
                    const baseY = sliderValue >= 0 ? textHeight / 2 : -textHeight / 2;
                    const newPathStr = 'M 0 ' + baseY + ' Q ' + (textWidth / 2) + ' ' + (baseY + cy) + ' ' + textWidth + ' ' + baseY;
                    const newPath = new fabric.Path(newPathStr);
                    // 设置路径填充为透明，防止黑块出现
                    newPath.set({ fill: '' });
                    text.set('path', newPath);
                    // 确保文本有颜色
                    text.set('fill', text.fill || 'black');
                    // 清除背景色
                    text.set('backgroundColor', '');
                    // 重新计算边界并渲染
                    text.setCoords();
                    canvas.renderAll();
                }
            });
        }
    }
    // 如果选中的是图片对象
    else if (obj.type === 'image') {
        textToolbar.style.display = 'none';
        imgAddControls.style.display = 'block';
        imgToolbar.style.display = 'block';
        // 获取当前活动的按钮
        const activeButton = document.querySelector('.toolbar_button.active');
        const activeButtonId = activeButton ? activeButton.id : 'img_input';

        // 隐藏图片工具栏区域的原始内容
        imgOriginControls.style.display = 'none';

        // 创建一个新的容器用于放置工具栏项
        let tempContainer = document.getElementById('img_add_controls');
        if (!tempContainer) {
            tempContainer = document.createElement('div');
            tempContainer.id = 'temp-img-controls';
            document.body.appendChild(tempContainer);
        } else {
            tempContainer.innerHTML = ''; // 清空之前的控制项
        }

        // 创建变形控制 (透明度、旋转、宽度、高度、反转)
        if (activeButtonId === 'img_input') {
            // 透明度控制
            const opacityControl = document.createElement('div');
            opacityControl.className = 'toolbar-item';
            opacityControl.innerHTML = `
            <label for="imageOpacity">透明度：</label>
            <input type="range" id="imageOpacity" min="0" max="100" value="${obj.opacity * 100}">
            <span id="opacityValue">${Math.round(obj.opacity * 100)}%</span>
          `;
            tempContainer.appendChild(opacityControl);

            // 添加透明度变化事件监听
            const opacityInput = opacityControl.querySelector('#imageOpacity');
            const opacityValue = opacityControl.querySelector('#opacityValue');
            opacityInput.addEventListener('input', function () {
                const value = this.value;
                opacityValue.textContent = value + '%';
                obj.set('opacity', value / 100);
                canvas.renderAll();
            });

            // 旋转控制
            const rotationControl = document.createElement('div');
            rotationControl.className = 'toolbar-item';
            rotationControl.innerHTML = `
            <label for="imageRotation">旋转：</label>
            <input type="number" id="imageRotation" min="0" max="360" value="${obj.angle}">
          `;
            tempContainer.appendChild(rotationControl);

            // 添加旋转事件监听
            const rotationInput = document.getElementById('imageRotation');
            if (rotationInput) {
                rotationInput.addEventListener('change', function () {
                    obj.set('angle', parseInt(this.value, 10));
                    canvas.renderAll();
                });
            }

            // 宽度控制
            const widthControl = document.createElement('div');
            widthControl.className = 'toolbar-item';
            widthControl.innerHTML = `
            <label for="imageWidth">宽度：</label>
            <input type="number" id="imageWidth" min="10" value="${Math.round(obj.width * obj.scaleX)}">
          `;
            tempContainer.appendChild(widthControl);

            // 添加宽度事件监听
            const widthInput = document.getElementById('imageWidth');
            if (widthInput) {
                widthInput.addEventListener('change', function () {
                    obj.set('scaleX', parseInt(this.value, 10) / obj.width);
                    canvas.renderAll();
                });
            }

            // 高度控制
            const heightControl = document.createElement('div');
            heightControl.className = 'toolbar-item';
            heightControl.innerHTML = `
            <label for="imageHeight">高度：</label>
            <input type="number" id="imageHeight" min="10" value="${Math.round(obj.height * obj.scaleY)}">
          `;
            tempContainer.appendChild(heightControl);

            // 添加高度事件监听
            const heightInput = document.getElementById('imageHeight');
            if (heightInput) {
                heightInput.addEventListener('change', function () {
                    obj.set('scaleY', parseInt(this.value, 10) / obj.height);
                    canvas.renderAll();
                });
            }

            // 横向反转按钮
            const flipXControl = document.createElement('div');
            flipXControl.className = 'toolbar-item';
            flipXControl.innerHTML = `
            <button id="imageFlipX">横向反转</button>
          `;
            tempContainer.appendChild(flipXControl);

            // 添加横向反转事件监听
            const flipXButton = document.getElementById('imageFlipX');
            if (flipXButton) {
                flipXButton.addEventListener('click', function () {
                    obj.set('flipX', !obj.flipX);
                    canvas.renderAll();
                });
            }

            // 纵向反转按钮
            const flipYControl = document.createElement('div');
            flipYControl.className = 'toolbar-item';
            flipYControl.innerHTML = `
            <button id="imageFlipY">纵向反转</button>
          `;
            tempContainer.appendChild(flipYControl);

            // 添加纵向反转事件监听
            const flipYButton = document.getElementById('imageFlipY');
            if (flipYButton) {
                flipYButton.addEventListener('click', function () {
                    obj.set('flipY', !obj.flipY);
                    canvas.renderAll();
                });
            }
        }

        // 创建位置控制
        if (activeButtonId === 'img_position') {
            const positionControl = document.createElement('div');
            positionControl.className = 'toolbar-item';
            positionControl.innerHTML = `
            <label>位置：</label>
            <input type="number" id="imgPositionX" style="width: 60px;" value="${Math.round(obj.left)}">
            <input type="number" id="imgPositionY" style="width: 60px;" value="${Math.round(obj.top)}">
          `;
            tempContainer.appendChild(positionControl);

            // 位置事件监听
            document.getElementById('imgPositionX').addEventListener('change', function () {
                if (canvas.getActiveObject() && canvas.getActiveObject().type === 'image') {
                    canvas.getActiveObject().set('left', parseInt(this.value, 10));
                    canvas.requestRenderAll();
                }
            });
            document.getElementById('imgPositionY').addEventListener('change', function () {
                if (canvas.getActiveObject() && canvas.getActiveObject().type === 'image') {
                    canvas.getActiveObject().set('top', parseInt(this.value, 10));
                    canvas.requestRenderAll();
                }
            });

            // 添加对齐按钮
            const alignmentControl = document.createElement('div');
            alignmentControl.className = 'toolbar-item';
            alignmentControl.innerHTML = `
            <label>对齐：</label>
            <button id="imgAlignCenterH">水平居中</button>
            <button id="imgAlignCenterV">垂直居中</button>
            <button id="imgAlignLeft">左对齐</button>
            <button id="imgAlignRight">右对齐</button>
            <button id="imgAlignTop">上对齐</button>
            <button id="imgAlignBottom">下对齐</button>
          `;
            tempContainer.appendChild(alignmentControl);

            // 对齐按钮事件监听
            document.getElementById('imgAlignCenterH').addEventListener('click', function () {
                if (canvas.getActiveObject() && canvas.getActiveObject().type === 'image') {
                    canvas.getActiveObject().set('left', canvas.width / 2);
                    canvas.getActiveObject().set('originX', 'center');
                    canvas.requestRenderAll();
                    document.getElementById('imgPositionX').value = Math.round(canvas.getActiveObject().left);
                }
            });
            document.getElementById('imgAlignCenterV').addEventListener('click', function () {
                if (canvas.getActiveObject() && canvas.getActiveObject().type === 'image') {
                    canvas.getActiveObject().set('top', canvas.height / 2);
                    canvas.getActiveObject().set('originY', 'center');
                    canvas.requestRenderAll();
                    document.getElementById('imgPositionY').value = Math.round(canvas.getActiveObject().top);
                }
            });
            document.getElementById('imgAlignLeft').addEventListener('click', function () {
                if (canvas.getActiveObject() && canvas.getActiveObject().type === 'image') {
                    canvas.getActiveObject().set('left', 0);
                    canvas.getActiveObject().set('originX', 'left');
                    canvas.requestRenderAll();
                    document.getElementById('imgPositionX').value = Math.round(canvas.getActiveObject().left);
                }
            });
            document.getElementById('imgAlignRight').addEventListener('click', function () {
                if (canvas.getActiveObject() && canvas.getActiveObject().type === 'image') {
                    canvas.getActiveObject().set('left', canvas.width);
                    canvas.getActiveObject().set('originX', 'right');
                    canvas.requestRenderAll();
                    document.getElementById('imgPositionX').value = Math.round(canvas.getActiveObject().left);
                }
            });
            document.getElementById('imgAlignTop').addEventListener('click', function () {
                if (canvas.getActiveObject() && canvas.getActiveObject().type === 'image') {
                    canvas.getActiveObject().set('top', 0);
                    canvas.getActiveObject().set('originY', 'top');
                    canvas.requestRenderAll();
                    document.getElementById('imgPositionY').value = Math.round(canvas.getActiveObject().top);
                }
            });
            document.getElementById('imgAlignBottom').addEventListener('click', function () {
                if (canvas.getActiveObject() && canvas.getActiveObject().type === 'image') {
                    canvas.getActiveObject().set('top', canvas.height);
                    canvas.getActiveObject().set('originY', 'bottom');
                    canvas.requestRenderAll();
                    document.getElementById('imgPositionY').value = Math.round(canvas.getActiveObject().top);
                }
            });
        }

        // 创建裁剪控制
        if (activeButtonId === 'img_size') {
            const cropControl = document.createElement('div');
            cropControl.className = 'toolbar-item';
            cropControl.innerHTML = `
            <label>裁剪模式：</label>
            <button id="startCrop">开始裁剪</button>
            <button id="applyCrop" style="display: none;">确认裁剪</button>
            <button id="cancelCrop" style="display: none;">取消裁剪</button>
          `;
            tempContainer.appendChild(cropControl);

            // 裁剪模式按钮事件监听
            document.getElementById('startCrop').addEventListener('click', function () {
                if (canvas.getActiveObject() && canvas.getActiveObject().type === 'image') {
                    const img = canvas.getActiveObject();
                    // 创建裁剪框，考虑图片的原点位置
                    const imgBoundingRect = img.getBoundingRect(true, true);
                    const cropRect = new fabric.Rect({
                        left: imgBoundingRect.left,
                        top: imgBoundingRect.top,
                        width: imgBoundingRect.width,
                        height: imgBoundingRect.height,
                        stroke: 'rgba(0,0,255,0.5)',
                        strokeWidth: 2,
                        fill: 'rgba(0,0,0,0)',
                        strokeDashArray: [5, 5],
                        selectable: true,
                        evented: true
                    });
                    canvas.add(cropRect);
                    canvas.setActiveObject(cropRect);
                    img.set({ selectable: false, evented: false });
                    canvas.requestRenderAll();
                    document.getElementById('startCrop').style.display = 'none';
                    document.getElementById('applyCrop').style.display = 'inline-block';
                    document.getElementById('cancelCrop').style.display = 'inline-block';
                }
            });

            document.getElementById('applyCrop').addEventListener('click', function () {
                const activeObject = canvas.getActiveObject();
                if (activeObject && activeObject.type === 'rect') {
                    const img = canvas.getObjects('image').find(obj => !obj.selectable);
                    if (img) {
                        const cropRect = activeObject;
                        const imgGlobal = img.getBoundingRect(true, true);
                        const cropGlobal = cropRect.getBoundingRect(true, true);

                        const cropX = Math.max(0, (cropGlobal.left - imgGlobal.left) / img.scaleX);
                        const cropY = Math.max(0, (cropGlobal.top - imgGlobal.top) / img.scaleY);
                        const cropWidth = Math.min(img.width - cropX, cropGlobal.width / img.scaleX);
                        const cropHeight = Math.min(img.height - cropY, cropGlobal.height / img.scaleY);

                        img.set({
                            cropX: cropX,
                            cropY: cropY,
                            width: cropWidth,
                            height: cropHeight,
                            left: cropGlobal.left,
                            top: cropGlobal.top,
                            scaleX: img.scaleX,
                            scaleY: img.scaleY,
                            selectable: true,
                            evented: true
                        });
                        canvas.remove(cropRect);
                        canvas.setActiveObject(img);
                        canvas.requestRenderAll();
                    }
                    document.getElementById('startCrop').style.display = 'inline-block';
                    document.getElementById('applyCrop').style.display = 'none';
                    document.getElementById('cancelCrop').style.display = 'none';
                }
            });

            document.getElementById('cancelCrop').addEventListener('click', function () {
                const activeObject = canvas.getActiveObject();
                if (activeObject && activeObject.type === 'rect') {
                    const img = canvas.getObjects('image').find(obj => !obj.selectable);
                    if (img) {
                        img.set({ selectable: true, evented: true });
                        canvas.remove(activeObject);
                        canvas.setActiveObject(img);
                        canvas.requestRenderAll();
                    }
                    document.getElementById('startCrop').style.display = 'inline-block';
                    document.getElementById('applyCrop').style.display = 'none';
                    document.getElementById('cancelCrop').style.display = 'none';
                }
            });
        }

        // 创建颜色控制 (色调)
        if (activeButtonId === 'img_color') {
            const colorControl = document.createElement('div');
            colorControl.className = 'toolbar-item';
            colorControl.innerHTML = `
            <label for="imgTint">色调：</label>
            <input type="color" id="imgTint" value="#ffffff">
          `;
            tempContainer.appendChild(colorControl);

            // 添加预设色块
            const colorPresets = document.createElement('div');
            colorPresets.className = 'toolbar-item';
            colorPresets.innerHTML = `
            <label>预设颜色：</label>
            <div style="display: flex; gap: 10px;">
              <div style="width: 30px; height: 30px; background-color: #ff0000; cursor: pointer;" class="color-preset" data-color="#ff0000"></div>
              <div style="width: 30px; height: 30px; background-color: #00ff00; cursor: pointer;" class="color-preset" data-color="#00ff00"></div>
              <div style="width: 30px; height: 30px; background-color: #0000ff; cursor: pointer;" class="color-preset" data-color="#0000ff"></div>
              <div style="width: 30px; height: 30px; background-color: #ffff00; cursor: pointer;" class="color-preset" data-color="#ffff00"></div>
              <div style="width: 30px; height: 30px; background-color: #ff00ff; cursor: pointer;" class="color-preset" data-color="#ff00ff"></div>
            </div>
          `;
            tempContainer.appendChild(colorPresets);

            // 色调事件监听
            document.getElementById('imgTint').addEventListener('input', function () {
                const activeObject = canvas.getActiveObject();
                if (activeObject) {
                    if (activeObject.type === 'image') {
                        activeObject.filters = activeObject.filters || [];
                        // 移除旧的色调滤镜
                        activeObject.filters = activeObject.filters.filter(f => !(f instanceof fabric.Image.filters.BlendColor));
                        // 添加新的色调滤镜
                        activeObject.filters.push(new fabric.Image.filters.BlendColor({
                            color: this.value,
                            mode: 'tint',
                            alpha: 0.5
                        }));
                        activeObject.applyFilters();
                    } else if (activeObject.type === 'group' && activeObject._objects) {
                        // 处理 SVG 图片，遍历子对象并设置颜色
                        activeObject._objects.forEach(obj => {
                            if (obj.type === 'path' || obj.type === 'circle' || obj.type === 'rect') {
                                obj.set('fill', this.value);
                            }
                        });
                    }
                    canvas.requestRenderAll();
                }
            });

            // 预设色块事件监听
            document.querySelectorAll('.color-preset').forEach(preset => {
                preset.addEventListener('click', function () {
                    const color = this.getAttribute('data-color');
                    const activeObject = canvas.getActiveObject();
                    if (activeObject) {
                        if (activeObject.type === 'image') {
                            activeObject.filters = activeObject.filters || [];
                            // 移除旧的色调滤镜
                            activeObject.filters = activeObject.filters.filter(f => !(f instanceof fabric.Image.filters.BlendColor));
                            // 添加新的色调滤镜
                            activeObject.filters.push(new fabric.Image.filters.BlendColor({
                                color: color,
                                mode: 'tint',
                                alpha: 0.5
                            }));
                            activeObject.applyFilters();
                        } else if (activeObject.type === 'group' && activeObject._objects) {
                            // 处理 SVG 图片，遍历子对象并设置颜色
                            activeObject._objects.forEach(obj => {
                                if (obj.type === 'path' || obj.type === 'circle' || obj.type === 'rect') {
                                    obj.set('fill', color);
                                }
                            });
                        }
                        canvas.requestRenderAll();
                        // 更新颜色选择器的值
                        document.getElementById('imgTint').value = color;
                    }
                });
            });
        }


    }
}

// 修改添加图片函数，确保添加到图层面板
function addImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    console.log('addImage 函数被调用，文件名称：', file.name);
    const reader = new FileReader();
    reader.onload = function (e) {
        fabric.Image.fromURL(e.target.result, function (img) {
            img.scaleToWidth(200);
            const newId = 'layer_' + layerCounter++;
            img.set({
                left: canvas.width / 2,
                top: canvas.height / 2,
                originX: 'center',
                originY: 'center',
                id: newId
            });
            // 检查画布上是否已经存在相同 ID 的对象
            const existingObject = canvas.getObjects().find(obj => obj.id === newId);
            if (!existingObject) {
                canvas.add(img);
                canvas.setActiveObject(img);
                console.log('图片已添加到画布，ID：', newId);
            } else {
                console.log('图片已存在，避免重复添加，ID：', newId);
            }
        });
    }
    reader.readAsDataURL(file);
}
// 添加设计到画布的函数
function addDesignToCanvas(designId) {
    // 获取设计图片的 URL
    const designImg = document.querySelector(`.design-item img[onclick="addDesignToCanvas(${designId})"]`);
    if (designImg) {
        const imageUrl = designImg.src;
        fabric.Image.fromURL(imageUrl, function (img) {
            img.scaleToWidth(200);
            const newId = 'layer_' + layerCounter++;
            img.set({
                left: canvas.width / 2,
                top: canvas.height / 2,
                originX: 'center',
                originY: 'center',
                id: newId
            });
            // 检查画布上是否已经存在相同 ID 的对象
            const existingObject = canvas.getObjects().find(obj => obj.id === newId);
            if (!existingObject) {
                canvas.add(img);
                canvas.setActiveObject(img);
                console.log('设计图片已添加到画布，ID：', newId);
            } else {
                console.log('设计图片已存在，避免重复添加，ID：', newId);
            }
        });
    } else {
        console.error('无法找到设计图片，ID：', designId);
    }
}

// 添加键盘快捷键支持
document.addEventListener('keydown', function (e) {
    // 如果正在编辑文本，不处理快捷键
    if (canvas.getActiveObject() && canvas.getActiveObject().isEditing) return;
    // Delete 或 Backspace 键删除选中对象
    if ((e.key === 'Delete' || e.key === 'Backspace') && canvas.getActiveObject()) {
        canvas.remove(canvas.getActiveObject());
    }
});
