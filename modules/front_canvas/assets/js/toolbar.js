// 更新动态工具栏
// 滑块填充更新工具函数：根据当前值更新 CSS 变量 --value-percent
function pwcaUpdateRangeFill(rangeEl) {
    if (!rangeEl) return;
    const min = (rangeEl.min !== undefined && rangeEl.min !== '') ? parseFloat(rangeEl.min) : 0;
    const max = (rangeEl.max !== undefined && rangeEl.max !== '') ? parseFloat(rangeEl.max) : 100;
    const value = (rangeEl.value !== undefined && rangeEl.value !== '') ? parseFloat(rangeEl.value) : min;
    const percent = ((value - min) / (max - min)) * 100;
    rangeEl.style.setProperty('--value-percent', `${percent}%`);
}

function pwcaEscapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function pwcaGetAvailableTextFonts() {
    const fallbackFonts = ['Arial', 'Times New Roman', 'Courier New', 'SimSun', 'Microsoft YaHei'];
    const stateAccess = window.pwcaUiStateAccess;

    if (!stateAccess || typeof stateAccess.pwcaGetCanvasStore !== 'function') {
        return fallbackFonts;
    }

    try {
        const store = stateAccess.pwcaGetCanvasStore();
        if (Array.isArray(store.currentTextFontOptions) && store.currentTextFontOptions.length > 0) {
            return store.currentTextFontOptions;
        }
    } catch (error) {
    }

    return fallbackFonts;
}

function pwcaBuildFontOptionsMarkup(selectedFontFamily) {
    return pwcaGetAvailableTextFonts()
        .map((fontName) => {
            const escapedFontName = pwcaEscapeHtml(fontName);
            const isSelected = fontName === selectedFontFamily ? ' selected' : '';
            return `<option value="${escapedFontName}"${isSelected}>${escapedFontName}</option>`;
        })
        .join('');
}

function pwcaGetToolbarPrintMethodStore() {
    const stateAccess = window.pwcaUiStateAccess;
    if (!stateAccess || typeof stateAccess.pwcaGetPrintMethodStore !== 'function') {
        return null;
    }

    try {
        return stateAccess.pwcaGetPrintMethodStore();
    } catch (error) {
    }

    return null;
}

function pwcaGetToolbarActiveCanvas() {
    const stateAccess = window.pwcaUiStateAccess;
    if (stateAccess && typeof stateAccess.pwcaGetActiveCanvas === 'function') {
        const canvas = stateAccess.pwcaGetActiveCanvas();
        if (canvas) {
            return canvas;
        }
    }

    return typeof window.pwcaGetActiveCanvas === 'function' ? window.pwcaGetActiveCanvas() : null;
}

function pwcaIsTextLikeObject(obj) {
    if (typeof window.pwcaIsTextLikeObject === 'function') {
        return window.pwcaIsTextLikeObject(obj);
    }

    return !!obj && (
        obj.type === 'text' ||
        obj.type === 'i-text' ||
        obj.type === 'textbox'
    );
}

function pwcaApplyToolbarArcPathToTextObject(textObject, arcValue) {
    if (typeof window.pwcaApplyArcPathToTextObject === 'function') {
        return window.pwcaApplyArcPathToTextObject(textObject, arcValue);
    }

    if (!pwcaIsTextLikeObject(textObject) || typeof fabric === 'undefined') {
        return textObject;
    }

    const normalizedArc = Number(arcValue);
    const safeArc = Number.isFinite(normalizedArc) ? normalizedArc : 0;
    const textWidth = Math.max(Number(textObject.width || 0), 1);
    const textHeight = Math.max(
        Number(textObject.height || 0),
        Number(textObject.fontSize || 0),
        1
    );

    if (Math.abs(safeArc) < 0.01) {
        textObject.set('path', null);
        textObject._arcValue = 0;
        textObject.setCoords();
        return textObject;
    }

    const baseY = safeArc >= 0 ? textHeight / 2 : -textHeight / 2;
    const controlY = baseY - safeArc;
    const path = new fabric.Path(
        `M 0 ${baseY} Q ${textWidth / 2} ${controlY} ${textWidth} ${baseY}`
    );
    path.set({ fill: '' });

    textObject.set('path', path);
    textObject.set('backgroundColor', '');
    textObject._arcValue = safeArc;
    textObject.setCoords();

    return textObject;
}

function pwcaUpdateDynamicToolbar(obj) {
    // 获取当前活动的 canvas 实例
    const stateAccess = window.pwcaUiStateAccess;
    const canvas =
        stateAccess && typeof stateAccess.pwcaGetActiveCanvas === 'function'
            ? stateAccess.pwcaGetActiveCanvas()
            : (typeof window.pwcaGetActiveCanvas === 'function' ? window.pwcaGetActiveCanvas() : null);
    if (!canvas) {
        return;
    }
    
    const textToolbarArea = document.querySelector('#content-wenzi-control');
    const imgOriginControls = document.querySelector('#img_origin_controls');
    const imgAddControls = document.querySelector('#img_add_controls');
    const textToolbar = document.querySelector('.pwca-text-toolbar');
    const imgToolbar = document.querySelector('.pwca-img-toolbar');
    // 清空文本工具栏
    textToolbarArea.innerHTML = '';
    // 如果没有选中对象，则不显示工具栏
    if (!obj) {
        textToolbar.style.display = 'none';
        imgAddControls.style.display = 'none';
        const imgToolbar = document.querySelector('.pwca-img-toolbar');
        imgToolbar.style.display = 'none';
        // 恢复图片工具栏区域的原始内容
        imgOriginControls.style.display = 'block';
        return;
    }

    // 如果选中的是文本对象（兼容 i-text、textbox）
    if (pwcaIsTextLikeObject(obj)) {
        textToolbar.style.display = 'block';
        imgToolbar.style.display = 'none';
        // 获取当前活动的文字工具按钮（仅限文字工具栏作用域）
        const activeTextButton = document.querySelector('.pwca-text-toolbar .pwca-toolbar-button.active');
        const activeButtonId = activeTextButton ? activeTextButton.id : 'text_input';

        // 根据当前按钮显示/隐藏添加文字区域
        const addTextBox = document.getElementById('addTextBtn_box');
        if (addTextBox) {
            addTextBox.style.display = (activeButtonId === 'text_input') ? 'block' : 'none';
        }

        // 创建字体选择器
        if (activeButtonId === 'text_font_style') {
            const fontSelector = document.createElement('div');
            fontSelector.className = 'toolbar-item';
            fontSelector.innerHTML = `
            <label for="fontFamily" class="tab_control_title">Font</label>
            <br>
            <select id="fontFamily">
              ${pwcaBuildFontOptionsMarkup(obj.fontFamily)}
            </select>
          `;
            textToolbarArea.appendChild(fontSelector);
            // 创建字体大小和字距控制容器
            const textControlsContainer = document.createElement('div');
            textControlsContainer.className = 'toolbar-item pwca-text-controls-container';
            textControlsContainer.innerHTML = `
            <div>
                <label for="fontSize" class="tab_control_title">Font-Size</label>
                <div class="pwca-font-size-control">
                    <button type="button" id="fontSizeDecrease" class="pwca-font-size-btn">-</button>
                    <input type="number" id="fontSize" min="8" max="120" value="${obj.fontSize}" class="pwca-font-size-input">
                    <button type="button" id="fontSizeIncrease" class="pwca-font-size-btn">+</button>
                </div>
            </div>
            <div>
                <label for="letterSpacing" class="tab_control_title">Letter Spacing</label>
                <div class="pwca-letter-spacing-control">
                    <button type="button" id="letterSpacingDecrease" class="pwca-letter-spacing-btn">-</button>
                    <input type="number" id="letterSpacing" min="-10" max="50" value="${obj.charSpacing || 0}" class="pwca-letter-spacing-input">
                    <button type="button" id="letterSpacingIncrease" class="pwca-letter-spacing-btn">+</button>
                </div>
            </div>
          `;
            textToolbarArea.appendChild(textControlsContainer);
        }

        // 创建颜色选择器（优先使用印刷方式的自定义颜色）
        if (activeButtonId === 'text_color') {
            const method =
                stateAccess && typeof stateAccess.pwcaGetPrintMethodForObject === 'function'
                    ? stateAccess.pwcaGetPrintMethodForObject(obj)
                    : null;

            const colors = method && method.customColors && method.customColors.data && Array.isArray(method.customColors.data.colors)
                ? method.customColors.data.colors
                : null;

            if (colors && colors.length > 0) {
                const swatchContainer = document.createElement('div');
                swatchContainer.className = 'toolbar-item';
                const label = document.createElement('label');
                label.className = 'tab_control_title';
                label.textContent = 'Color';
                swatchContainer.appendChild(label);

                const swatchesBox = document.createElement('div');
                swatchesBox.className = 'pwca-color-swatches-box';
                swatchesBox.style.display = 'flex';
                swatchesBox.style.flexWrap = 'wrap';
                swatchesBox.style.gap = '8px';

                colors.forEach(c => {
                    if (!c || !c.hex_code) return;
                    const sw = document.createElement('div');
                    sw.className = 'pwca-color-swatch';
                    sw.style.width = '24px';
                    sw.style.height = '24px';
                    sw.style.borderRadius = '4px';
                    sw.style.cursor = 'pointer';
                    sw.style.border = '1px solid #ddd';
                    sw.style.backgroundColor = c.hex_code;
                    sw.title = c.name || c.hex_code;
                    sw.addEventListener('click', function () {
                        const activeCanvas = typeof window.pwcaGetActiveCanvas === 'function' ? window.pwcaGetActiveCanvas() : null;
                        const activeObj = activeCanvas ? activeCanvas.getActiveObject() : null;
                        if (pwcaIsTextLikeObject(activeObj)) {
                            activeObj.set('fill', c.hex_code);
                            activeCanvas.renderAll();
                        }
                    });
                    swatchesBox.appendChild(sw);
                });

                swatchContainer.appendChild(swatchesBox);
                textToolbarArea.appendChild(swatchContainer);
            } else {
                const colorSelector = document.createElement('div');
                colorSelector.className = 'toolbar-item';
                colorSelector.innerHTML = `
                <label for="textColor" class="tab_control_title">Color</label>
                <br>
                <input type="color" id="textColor" value="${obj.fill}">
              `;
                textToolbarArea.appendChild(colorSelector);
            }
        }

        // 创建旋转控制
        if (activeButtonId === 'text_rotate') {
            const rotationControl = document.createElement('div');
            rotationControl.className = 'toolbar-item';
            rotationControl.innerHTML = `
            <label for="textRotation" class="tab_control_title">Rotate</label>
            <br>
            <div class="pwca-pwca-content-area-rotate-control">
                <input type="range" id="textRotationRange" min="-180" max="180" step="1" value="${obj.angle}">
                <input type="number" id="textRotation" min="0" max="360" value="${obj.angle}">
            </div>
          `;
            textToolbarArea.appendChild(rotationControl);
        }

    // 创建位置控制
        if (activeButtonId === 'text_position') {
        //     const positionControl = document.createElement('div');
        //     positionControl.className = 'toolbar-item';
        //     positionControl.innerHTML = `
        //     <label class="tab_control_title">位置</label>
        //     <input type="number" id="textPositionX" style="width: 60px;" value="${Math.round(obj.left)}">
        //     <input type="number" id="textPositionY" style="width: 60px;" value="${Math.round(obj.top)}">
        //   `;
        //     textToolbarArea.appendChild(positionControl);

            // 添加对齐按钮
            const alignmentControl = document.createElement('div');
            alignmentControl.className = 'toolbar-item';
            alignmentControl.innerHTML = `
            <label class="tab_control_title">Align</label>
            <br>
            <button id="textAlignCenterH"><i class="iconfont icon-format-horizontal-align-center"></i></button>
            <button id="textAlignCenterV"><i class="iconfont icon-vertical-align-middl"></i></button>
            <button id="textAlignLeft"><i class="iconfont icon-format-horizontal-align-left"></i></button>
            <button id="textAlignRight"><i class="iconfont icon-format-horizontal-align-right"></i></button>
            <button id="textAlignTop"><i class="iconfont icon-vertical-align-top"></i></button>
            <button id="textAlignBottom"><i class="iconfont icon-vertical-align-botto"></i></button>
          `;
            textToolbarArea.appendChild(alignmentControl);

            // ===== 对齐按钮事件监听（基于 viewportTransform 严格贴齐画布边缘/中心）=====
            const alignByBoundingRect = function(mode) {
                const active = canvas.getActiveObject();
                if (!active) return;
                if (typeof active.setCoords === 'function') active.setCoords();
                const rect = active.getBoundingRect(true, true);
                if (!rect) return;
                const cw = typeof canvas.getWidth === 'function' ? canvas.getWidth() : canvas.width;
                const ch = typeof canvas.getHeight === 'function' ? canvas.getHeight() : canvas.height;
                const vpt = canvas.viewportTransform || [1,0,0,1,0,0];
                const sx = vpt[0] || 1; // 缩放X
                const sy = vpt[3] || sx; // 缩放Y

                // 画布边缘与中心（视口坐标）
                const tl = fabric.util.transformPoint(new fabric.Point(0, 0), vpt);
                const tr = fabric.util.transformPoint(new fabric.Point(cw, 0), vpt);
                const bl = fabric.util.transformPoint(new fabric.Point(0, ch), vpt);
                const center = fabric.util.transformPoint(new fabric.Point(cw / 2, ch / 2), vpt);

                const brLeft = rect.left;
                const brTop = rect.top;
                const brRight = rect.left + rect.width;
                const brBottom = rect.top + rect.height;
                const brCenterX = rect.left + rect.width / 2;
                const brCenterY = rect.top + rect.height / 2;

                let dx = 0, dy = 0;
                switch (mode) {
                    case 'centerH': {
                        dx = (center.x - brCenterX) / sx;
                        break;
                    }
                    case 'centerV': {
                        dy = (center.y - brCenterY) / sy;
                        break;
                    }
                    case 'left': {
                        dx = (tl.x - brLeft) / sx;
                        break;
                    }
                    case 'right': {
                        dx = (tr.x - brRight) / sx;
                        break;
                    }
                    case 'top': {
                        dy = (tl.y - brTop) / sy;
                        break;
                    }
                    case 'bottom': {
                        dy = (bl.y - brBottom) / sy;
                        break;
                    }
                }
                active.set({ left: active.left + dx, top: active.top + dy });
                if (typeof active.setCoords === 'function') active.setCoords();
                canvas.requestRenderAll();
                const posXEl = document.getElementById('textPositionX');
                const posYEl = document.getElementById('textPositionY');
                if (posXEl) posXEl.value = Math.round(active.left);
                if (posYEl) posYEl.value = Math.round(active.top);
            };

            document.getElementById('textAlignCenterH').addEventListener('click', function () { alignByBoundingRect('centerH'); });
            document.getElementById('textAlignCenterV').addEventListener('click', function () { alignByBoundingRect('centerV'); });
            document.getElementById('textAlignLeft').addEventListener('click', function () { alignByBoundingRect('left'); });
            document.getElementById('textAlignRight').addEventListener('click', function () { alignByBoundingRect('right'); });
            document.getElementById('textAlignTop').addEventListener('click', function () { alignByBoundingRect('top'); });
            document.getElementById('textAlignBottom').addEventListener('click', function () { alignByBoundingRect('bottom'); });
        }

        // 创建弯曲控制（使用路径来实现文本弯曲效果）
        if (activeButtonId === 'text_distort') {
            const distortControl = document.createElement('div');
            distortControl.className = 'toolbar-item';
            distortControl.innerHTML = `
            <label for="textDistort" class="tab_control_title">Arc</label>
            <br>
            <div class="pwca-pwca-content-area-rotate-control">
                <input type="range" id="textDistort" min="-100" max="100" value="${Number(obj._arcValue || 0)}">
                <input type="number" id="distortValue" min="-100" max="100" value="${Number(obj._arcValue || 0)}">
            </div>
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
                if (pwcaIsTextLikeObject(canvas.getActiveObject())) {
                    canvas.getActiveObject().set('fontFamily', this.value);
                    canvas.renderAll();
                }
            });
        }
        const fontSizeElement = document.getElementById('fontSize');
        if (fontSizeElement) {
            fontSizeElement.addEventListener('change', function () {
                if (pwcaIsTextLikeObject(canvas.getActiveObject())) {
                    canvas.getActiveObject().set('fontSize', parseInt(this.value, 10));
                    canvas.renderAll();
                }
            });
        }
        
        // 字体大小加减按钮事件
        const fontSizeDecreaseBtn = document.getElementById('fontSizeDecrease');
        const fontSizeIncreaseBtn = document.getElementById('fontSizeIncrease');
        
        if (fontSizeDecreaseBtn) {
            fontSizeDecreaseBtn.addEventListener('click', function () {
                if (pwcaIsTextLikeObject(canvas.getActiveObject())) {
                    const currentSize = parseInt(fontSizeElement.value, 10);
                    const newSize = Math.max(8, currentSize - 1);
                    fontSizeElement.value = newSize;
                    canvas.getActiveObject().set('fontSize', newSize);
                    canvas.renderAll();
                }
            });
        }
        
        if (fontSizeIncreaseBtn) {
            fontSizeIncreaseBtn.addEventListener('click', function () {
                if (pwcaIsTextLikeObject(canvas.getActiveObject())) {
                    const currentSize = parseInt(fontSizeElement.value, 10);
                    const newSize = Math.min(120, currentSize + 1);
                    fontSizeElement.value = newSize;
                    canvas.getActiveObject().set('fontSize', newSize);
                    canvas.renderAll();
                }
            });
        }
        
        // 字距控制事件
        const letterSpacingElement = document.getElementById('letterSpacing');
        if (letterSpacingElement) {
            letterSpacingElement.addEventListener('change', function () {
                if (pwcaIsTextLikeObject(canvas.getActiveObject())) {
                    canvas.getActiveObject().set('charSpacing', parseInt(this.value, 10));
                    canvas.renderAll();
                }
            });
        }
        
        // 字距加减按钮事件
        const letterSpacingDecreaseBtn = document.getElementById('letterSpacingDecrease');
        const letterSpacingIncreaseBtn = document.getElementById('letterSpacingIncrease');
        
        if (letterSpacingDecreaseBtn) {
            letterSpacingDecreaseBtn.addEventListener('click', function () {
                if (pwcaIsTextLikeObject(canvas.getActiveObject())) {
                    const currentSpacing = parseInt(letterSpacingElement.value, 10);
                    const newSpacing = Math.max(-10, currentSpacing - 1);
                    letterSpacingElement.value = newSpacing;
                    canvas.getActiveObject().set('charSpacing', newSpacing);
                    canvas.renderAll();
                }
            });
        }
        
        if (letterSpacingIncreaseBtn) {
            letterSpacingIncreaseBtn.addEventListener('click', function () {
                if (pwcaIsTextLikeObject(canvas.getActiveObject())) {
                    const currentSpacing = parseInt(letterSpacingElement.value, 10);
                    const newSpacing = Math.min(50, currentSpacing + 1);
                    letterSpacingElement.value = newSpacing;
                    canvas.getActiveObject().set('charSpacing', newSpacing);
                    canvas.renderAll();
                }
            });
        }
        const textColorElement = document.getElementById('textColor');
        if (textColorElement) {
            textColorElement.addEventListener('input', function () {
                if (pwcaIsTextLikeObject(canvas.getActiveObject())) {
                    canvas.getActiveObject().set('fill', this.value);
                    canvas.renderAll();
                }
            });
        }

        // 旋转事件监听（滑块与输入双向同步）
        const textRotationInput = document.getElementById('textRotation');
        const textRotationRange = document.getElementById('textRotationRange');
        if (textRotationRange) {
            // 初始化一次填充效果
            pwcaUpdateRangeFill(textRotationRange);
            textRotationRange.addEventListener('input', function () {
                const val = parseInt(this.value, 10) || 0;
                if (textRotationInput) textRotationInput.value = val;
                // 根据当前值更新滑块填充
                pwcaUpdateRangeFill(textRotationRange);
                if (pwcaIsTextLikeObject(canvas.getActiveObject())) {
                    canvas.getActiveObject().set('angle', val);
                    canvas.renderAll();
                }
            });
        }
        if (textRotationInput) {
            textRotationInput.addEventListener('input', function () {
                const val = parseInt(this.value, 10) || 0;
                if (textRotationRange) textRotationRange.value = val;
                if (textRotationRange) pwcaUpdateRangeFill(textRotationRange);
                if (pwcaIsTextLikeObject(canvas.getActiveObject())) {
                    canvas.getActiveObject().set('angle', val);
                    canvas.renderAll();
                }
            });
        }

        // 位置事件监听
        const textPositionXElement = document.getElementById('textPositionX');
        if (textPositionXElement) {
            textPositionXElement.addEventListener('change', function () {
                if (pwcaIsTextLikeObject(canvas.getActiveObject())) {
                    canvas.getActiveObject().set('left', parseInt(this.value, 10));
                    canvas.renderAll();
                }
            });
        }
        const textPositionYElement = document.getElementById('textPositionY');
        if (textPositionYElement) {
            textPositionYElement.addEventListener('change', function () {
                if (pwcaIsTextLikeObject(canvas.getActiveObject())) {
                    canvas.getActiveObject().set('top', parseInt(this.value, 10));
                    canvas.renderAll();
                }
            });
        }

        // 弯曲事件监听（滑块与输入双向同步）
        const distortInput = document.getElementById('textDistort');
        const distortValue = document.getElementById('distortValue');
        if (distortInput && distortValue) {
            // 初始化一次填充效果
            pwcaUpdateRangeFill(distortInput);
            const applyDistort = function(val) {
                const activeTextObject = canvas.getActiveObject();
                if (pwcaIsTextLikeObject(activeTextObject)) {
                    pwcaApplyToolbarArcPathToTextObject(activeTextObject, val);
                    canvas.renderAll();
                }
            };
            distortInput.addEventListener('input', function () {
                const sliderValue = parseFloat(this.value) || 0;
                distortValue.value = sliderValue;
                // 根据当前值更新滑块填充
                pwcaUpdateRangeFill(distortInput);
                applyDistort(sliderValue);
            });
            distortValue.addEventListener('input', function () {
                const manualValue = parseFloat(this.value) || 0;
                distortInput.value = manualValue;
                pwcaUpdateRangeFill(distortInput);
                applyDistort(manualValue);
            });
        }
    }
    // 如果选中的是图片对象
    else if (obj.type === 'image') {
        textToolbar.style.display = 'none';
        imgToolbar.style.display = 'block';
        // 默认：若没有激活的图片子工具，则显示原始内容区域
        imgAddControls.style.display = 'none';
        const activeImgButton = document.querySelector('.pwca-img-toolbar .pwca-toolbar-button.active');

        // 没有激活的图片工具按钮时，显示原始内容并取消所有激活状态
        if (!activeImgButton) {
            if (imgOriginControls) {
                imgOriginControls.style.display = 'block';
            }
            document.querySelectorAll('.pwca-img-toolbar .pwca-toolbar-button').forEach(btn => btn.classList.remove('active'));
            return;
        }

        // 有激活按钮时，隐藏原始内容并显示添加控制区
        if (imgOriginControls) {
            imgOriginControls.style.display = 'none';
        }
        imgAddControls.style.display = 'block';
        const activeButtonId = activeImgButton.id;

        // 创建一个新的容器用于放置工具栏控件
        let tempContainer = document.getElementById('img_add_controls');
        if (!tempContainer) {
            tempContainer = document.createElement('div');
            tempContainer.id = 'temp-img-controls';
            document.body.appendChild(tempContainer);
        } else {
            tempContainer.innerHTML = '';
        }

        // 控制项仅在有激活按钮时生成（此时 activeButtonId 已存在）

        // 创建变形控制（透明度、旋转、宽度、高度、反转）
        if (activeButtonId === 'img_input') {
            // 透明度控件
        //     const opacityControl = document.createElement('div');
        //     opacityControl.className = 'toolbar-item';
        //     opacityControl.innerHTML = `
        //     <label for="imageOpacity">透明度：</label>
        //     <input type="range" id="imageOpacity" min="0" max="100" value="${obj.opacity * 100}">
        //     <span id="opacityValue">${Math.round(obj.opacity * 100)}%</span>
        //   `;
        //     tempContainer.appendChild(opacityControl);

            // 添加透明度变化事件监听
            // const opacityInput = opacityControl.querySelector('#imageOpacity');
            // const opacityValue = opacityControl.querySelector('#opacityValue');
            // opacityInput.addEventListener('input', function () {
            //     const value = this.value;
            //     opacityValue.textContent = value + '%';
            //     obj.set('opacity', value / 100);
            //     canvas.renderAll();
            // });

            // 旋转控制
            const rotationControl = document.createElement('div');
            rotationControl.className = 'toolbar-item';
            rotationControl.innerHTML = `
            <label for="imageRotation" class="tab_control_title">Transform</label>
            <br>
            <div class="pwca-pwca-content-area-rotate-control">
                <input type="range" id="imageRotationRange" min="-180" max="180" step="1" value="${obj.angle}">
                <input type="number" id="imageRotation" min="0" max="360" value="${obj.angle}">
            </div>
          `;
            tempContainer.appendChild(rotationControl);

            // 添加旋转事件监听（滑块与输入双向同步）
            const rotationInput = document.getElementById('imageRotation');
            const rotationRange = document.getElementById('imageRotationRange');
            if (rotationRange) {
                // 初始化一次填充效果
                pwcaUpdateRangeFill(rotationRange);
                rotationRange.addEventListener('input', function () {
                    const val = parseInt(this.value, 10) || 0;
                    if (rotationInput) rotationInput.value = val;
                    // 根据当前值更新滑块填充
                    pwcaUpdateRangeFill(rotationRange);
                    obj.set('angle', val);
                    canvas.renderAll();
                });
            }
            if (rotationInput) {
                rotationInput.addEventListener('input', function () {
                    const val = parseInt(this.value, 10) || 0;
                    if (rotationRange) rotationRange.value = val;
                    if (rotationRange) pwcaUpdateRangeFill(rotationRange);
                    obj.set('angle', val);
                    canvas.renderAll();
                });
            }

            // 宽度控制
            const widthControl = document.createElement('div');
            widthControl.className = 'toolbar-item tab_control_imageWidthHeight';
            widthControl.innerHTML = `
            <div class="tab_control_imageWidth">
            <label for="imageWidth" class="tab_control_title">Width</label>

            <input type="number" id="imageWidth" min="10" value="${Math.round(obj.width * obj.scaleX)}">
            </div>
            <div class="tab_control_imageHeight">
            <label for="imageHeight" class="tab_control_title">Height</label>
       
            <input type="number" id="imageHeight" min="10" value="${Math.round(obj.height * obj.scaleY)}">
            </div>
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
            <label for="imageHeight" class="tab_control_title">Flip</label>
            <br>
            <button id="imageFlipX"><i class="iconfont icon-jingxiang"></i> Horizontally</button>
            <button id="imageFlipY"><i class="iconfont icon-jingxiang1"></i> Vertically</button>
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
        //     const positionControl = document.createElement('div');
        //     positionControl.className = 'toolbar-item';
        //     positionControl.innerHTML = `
        //     <label>位置</label>
        //     <input type="number" id="imgPositionX" style="width: 60px;" value="${Math.round(obj.left)}">
        //     <input type="number" id="imgPositionY" style="width: 60px;" value="${Math.round(obj.top)}">
        //   `;
        //     tempContainer.appendChild(positionControl);

        //     // 位置事件监听
        //     document.getElementById('imgPositionX').addEventListener('change', function () {
        //         if (canvas.getActiveObject() && canvas.getActiveObject().type === 'image') {
        //             canvas.getActiveObject().set('left', parseInt(this.value, 10));
        //             canvas.requestRenderAll();
        //         }
        //     });
        //     document.getElementById('imgPositionY').addEventListener('change', function () {
        //         if (canvas.getActiveObject() && canvas.getActiveObject().type === 'image') {
        //             canvas.getActiveObject().set('top', parseInt(this.value, 10));
        //             canvas.requestRenderAll();
        //         }
        //     });

            // 添加对齐按钮
            const alignmentControl = document.createElement('div');
            alignmentControl.className = 'toolbar-item';
            alignmentControl.innerHTML = `
            <label class="tab_control_title">Align</label>
            <br>
            <button id="imgAlignCenterH"><i class="iconfont icon-format-horizontal-align-center"></i></button>
            <button id="imgAlignCenterV"><i class="iconfont icon-vertical-align-middl"></i></button>
            <button id="imgAlignLeft"><i class="iconfont icon-format-horizontal-align-left"></i></button>
            <button id="imgAlignRight"><i class="iconfont icon-format-horizontal-align-right"></i></button>
            <button id="imgAlignTop"><i class="iconfont icon-vertical-align-top"></i></button>
            <button id="imgAlignBottom"><i class="iconfont icon-vertical-align-botto"></i></button>
          `;
            tempContainer.appendChild(alignmentControl);

            // ===== 对齐按钮事件监听（基于 viewportTransform 严格贴齐画布边缘/中心）=====
            const alignImgByBoundingRect = function(mode) {
                const active = canvas.getActiveObject();
                if (!active) return;
                if (typeof active.setCoords === 'function') active.setCoords();
                const rect = active.getBoundingRect(true, true);
                if (!rect) return;
                const cw = typeof canvas.getWidth === 'function' ? canvas.getWidth() : canvas.width;
                const ch = typeof canvas.getHeight === 'function' ? canvas.getHeight() : canvas.height;
                const vpt = canvas.viewportTransform || [1,0,0,1,0,0];
                const sx = vpt[0] || 1;
                const sy = vpt[3] || sx;

                // 画布边缘与中心（视口坐标）
                const tl = fabric.util.transformPoint(new fabric.Point(0, 0), vpt);
                const tr = fabric.util.transformPoint(new fabric.Point(cw, 0), vpt);
                const bl = fabric.util.transformPoint(new fabric.Point(0, ch), vpt);
                const center = fabric.util.transformPoint(new fabric.Point(cw / 2, ch / 2), vpt);

                const brLeft = rect.left;
                const brTop = rect.top;
                const brRight = rect.left + rect.width;
                const brBottom = rect.top + rect.height;
                const brCenterX = rect.left + rect.width / 2;
                const brCenterY = rect.top + rect.height / 2;

                let dx = 0, dy = 0;
                switch (mode) {
                    case 'centerH': {
                        dx = (center.x - brCenterX) / sx;
                        break;
                    }
                    case 'centerV': {
                        dy = (center.y - brCenterY) / sy;
                        break;
                    }
                    case 'left': {
                        dx = (tl.x - brLeft) / sx;
                        break;
                    }
                    case 'right': {
                        dx = (tr.x - brRight) / sx;
                        break;
                    }
                    case 'top': {
                        dy = (tl.y - brTop) / sy;
                        break;
                    }
                    case 'bottom': {
                        dy = (bl.y - brBottom) / sy;
                        break;
                    }
                }
                active.set({ left: active.left + dx, top: active.top + dy });
                if (typeof active.setCoords === 'function') active.setCoords();
                canvas.requestRenderAll();
                const posXEl = document.getElementById('imgPositionX');
                const posYEl = document.getElementById('imgPositionY');
                if (posXEl) posXEl.value = Math.round(active.left);
                if (posYEl) posYEl.value = Math.round(active.top);
            };

            document.getElementById('imgAlignCenterH').addEventListener('click', function () { alignImgByBoundingRect('centerH'); });
            document.getElementById('imgAlignCenterV').addEventListener('click', function () { alignImgByBoundingRect('centerV'); });
            document.getElementById('imgAlignLeft').addEventListener('click', function () { alignImgByBoundingRect('left'); });
            document.getElementById('imgAlignRight').addEventListener('click', function () { alignImgByBoundingRect('right'); });
            document.getElementById('imgAlignTop').addEventListener('click', function () { alignImgByBoundingRect('top'); });
            document.getElementById('imgAlignBottom').addEventListener('click', function () { alignImgByBoundingRect('bottom'); });
        }

        // 创建裁剪控制
        if (activeButtonId === 'img_size') {
            const cropControl = document.createElement('div');
            cropControl.className = 'toolbar-item';
            cropControl.innerHTML = `
            <label class="tab_control_title">Crop</label>
            <button id="startCrop">Start</button>
            <button id="applyCrop" class="pwca-crop-apply">Done</button>
            <button id="cancelCrop" class="pwca-crop-cancel">Esc</button>
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

        // 创建颜色控制 (优先使用印刷方式的自定义颜色)
        if (activeButtonId === 'img_color') {
            const printMethodStore = pwcaGetToolbarPrintMethodStore();
            let method = null;
            if (printMethodStore) {
                method = printMethodStore.pwcaGetLayerPrintMethod ? printMethodStore.pwcaGetLayerPrintMethod(obj.id) : null;
                if (!method && obj.groupId && printMethodStore.pwcaGetGroupPrintMethod) {
                    method = printMethodStore.pwcaGetGroupPrintMethod(obj.groupId);
                }
            }

            const colors = method && method.customColors && method.customColors.data && Array.isArray(method.customColors.data.colors)
                ? method.customColors.data.colors
                : null;

            if (colors && colors.length > 0) {
                const swatchContainer = document.createElement('div');
                swatchContainer.className = 'toolbar-item';
                const label = document.createElement('label');
                label.className = 'tab_control_title';
                label.textContent = 'Color';
                swatchContainer.appendChild(label);

                const swatchesBox = document.createElement('div');
                swatchesBox.className = 'pwca-color-swatches-box';
                swatchesBox.style.display = 'flex';
                swatchesBox.style.flexWrap = 'wrap';
                swatchesBox.style.gap = '8px';

                colors.forEach(c => {
                    if (!c || !c.hex_code) return;
                    const sw = document.createElement('div');
                    sw.className = 'pwca-color-swatch';
                    sw.style.width = '24px';
                    sw.style.height = '24px';
                    sw.style.borderRadius = '4px';
                    sw.style.cursor = 'pointer';
                    sw.style.border = '1px solid #ddd';
                    sw.style.backgroundColor = c.hex_code;
                    sw.title = c.name || c.hex_code;
                    sw.addEventListener('click', function () {
                        const activeObject = canvas.getActiveObject();
                        if (activeObject) {
                            if (activeObject.type === 'image') {
                                activeObject.filters = activeObject.filters || [];
                                activeObject.filters = activeObject.filters.filter(f => !(f instanceof fabric.Image.filters.BlendColor));
                                activeObject.filters.push(new fabric.Image.filters.BlendColor({
                                    color: c.hex_code,
                                    mode: 'tint',
                                    alpha: 0.5
                                }));
                                activeObject.applyFilters();
                            } else if (activeObject.type === 'group' && activeObject._objects) {
                                activeObject._objects.forEach(o => {
                                    if (o.type === 'path' || o.type === 'circle' || o.type === 'rect') {
                                        o.set('fill', c.hex_code);
                                    }
                                });
                            }
                            canvas.requestRenderAll();
                        }
                    });
                    swatchesBox.appendChild(sw);
                });

                swatchContainer.appendChild(swatchesBox);
                tempContainer.appendChild(swatchContainer);
            } else {
                const colorControl = document.createElement('div');
                colorControl.className = 'toolbar-item';
                colorControl.innerHTML = `
                <label for="imgTint" class="tab_control_title">Color</label>
                <input type="color" id="imgTint" value="#ffffff">
              `;
                tempContainer.appendChild(colorControl);

                document.getElementById('imgTint').addEventListener('input', function () {
                    const activeObject = canvas.getActiveObject();
                    if (activeObject) {
                        if (activeObject.type === 'image') {
                            activeObject.filters = activeObject.filters || [];
                            activeObject.filters = activeObject.filters.filter(f => !(f instanceof fabric.Image.filters.BlendColor));
                            activeObject.filters.push(new fabric.Image.filters.BlendColor({
                                color: this.value,
                                mode: 'tint',
                                alpha: 0.5
                            }));
                            activeObject.applyFilters();
                        } else if (activeObject.type === 'group' && activeObject._objects) {
                            activeObject._objects.forEach(obj => {
                                if (obj.type === 'path' || obj.type === 'circle' || obj.type === 'rect') {
                                    obj.set('fill', this.value);
                                }
                            });
                        }
                        canvas.requestRenderAll();
                    }
                });
            }
        }


    }
}

// 修改添加图片函数，确保添加到图层面板
function pwcaAddImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        // 获取当前活动的 canvas 实例
        const canvas = typeof window.pwcaGetActiveCanvas === 'function' ? window.pwcaGetActiveCanvas() : null;
        if (!canvas) {
            return;
        }
        
        fabric.Image.fromURL(e.target.result, function (img) {
            img.scaleToWidth(200);
            // 初始化 layerCounter（如果不存在）
            if (typeof window.pwcaLayerCounter === 'undefined') {
                window.pwcaLayerCounter = 0;
            }
            const newId = 'layer_' + (++window.pwcaLayerCounter);
            
            // ===== 核心修复：添加用户操作标记 =====
            img.set({
                left: canvas.width / 2,
                top: canvas.height / 2,
                originX: 'center',
                originY: 'center',
                id: newId,
                userInitiated: true,  // 标记为用户操作
                fromButton: true,     // 标记来源为按钮操作
                fromToolbar: true,     // 标记来源为工具栏
                isDesignElement: true
            });
            img.designMeta = { id: String(designId), name: String(designImg.alt || ''), image: String(imageUrl), sku: String((designImg && designImg.getAttribute && designImg.getAttribute('data-design-sku')) || '') };
            
            // 检查画布上是否已经存在相同 ID 的对象
            const existingObject = canvas.getObjects().find(obj => obj.id === newId);
            if (!existingObject) {
                canvas.add(img);
                canvas.setActiveObject(img);
                try {
                    if (typeof window.useDesignUsageStore === 'function') {
                        const store = window.pinia ? window.useDesignUsageStore(window.pinia) : window.useDesignUsageStore();
                        store.addDesign({ id: String(designId), name: String(designImg.alt || ''), image: String(imageUrl), sku: String((designImg && designImg.getAttribute && designImg.getAttribute('data-design-sku')) || '') });
                    }
                } catch (e) {}
            } else {
                
            }
        });
    }
    reader.readAsDataURL(file);
}
// 添加设计到画布的函数
function pwcaAddDesignToCanvas(designId) {
    // 获取当前活动的 canvas 实例
    const canvas = typeof window.pwcaGetActiveCanvas === 'function' ? window.pwcaGetActiveCanvas() : null;
    if (!canvas) {
        return;
    }
    
    // 获取设计图片的 DOM 元素
    const designImg = document.querySelector(`.design-item img[data-design-id="${designId}"]`);
    if (!designImg) {
        console.warn(`Design image not found for ID: ${designId}`);
        return;
    }

    const imageUrl = designImg.src;
    const designName = designImg.alt || '';
    const designSku = designImg.getAttribute('data-design-sku') || '';

    fabric.Image.fromURL(imageUrl, function (img) {
        img.scaleToWidth(200);
        
        // 初始化 layerCounter（如果不存在）
        if (typeof window.pwcaLayerCounter === 'undefined') {
            window.pwcaLayerCounter = 0;
        }
        const newId = 'layer_' + (++window.pwcaLayerCounter);
        
        // 设置 Fabric 对象属性
        img.set({
            left: canvas.width / 2,
            top: canvas.height / 2,
            originX: 'center',
            originY: 'center',
            id: newId,
            userInitiated: true,
            fromButton: true,
            fromToolbar: true,
            isDesignElement: true
        });

        // 存储元数据
        const meta = { 
            id: String(designId), 
            name: String(designName), 
            image: String(imageUrl), 
            sku: String(designSku) 
        };
        img.designMeta = meta;
        
        // 检查画布上是否已经存在相同 ID 的对象
        const existingObject = canvas.getObjects().find(obj => obj.id === newId);
        if (!existingObject) {
            canvas.add(img);
            canvas.setActiveObject(img);
            
            // 记录使用情况
            try {
                if (typeof pwcaRecordDesignUsage === 'function') {
                    pwcaRecordDesignUsage(meta);
                } else if (typeof window.useDesignUsageStore === 'function') {
                    const store = window.pinia ? window.useDesignUsageStore(window.pinia) : window.useDesignUsageStore();
                    store.addDesign(meta);
                }
            } catch (e) {
                console.error('Failed to record design usage:', e);
            }
        }
    }, { crossOrigin: 'anonymous' }); // 确保跨域图片可以正常导出
}

// 添加键盘快捷键支持
document.addEventListener('keydown', function (e) {
    // 获取当前激活的画布
    const activeCanvas = pwcaGetToolbarActiveCanvas();
    if (!activeCanvas) return;
    
    // 如果正在编辑文本，不处理快捷键
    if (activeCanvas.getActiveObject() && activeCanvas.getActiveObject().isEditing) return;
    // Delete 或 Backspace 键删除选中对象
    if ((e.key === 'Delete' || e.key === 'Backspace') && activeCanvas.getActiveObject()) {
        activeCanvas.remove(activeCanvas.getActiveObject());
    }
});

function pwcaRecordDesignUsage(meta) {
    try {
        if (typeof window.useDesignUsageStore === 'function') {
            const store = window.pinia ? window.useDesignUsageStore(window.pinia) : window.useDesignUsageStore();
            store.addDesign({ id: String(meta.id || ''), name: String(meta.name || ''), image: String(meta.image || ''), sku: String(meta.sku || '') });
            return true;
        }
    } catch (e) {}
    return false;
}

function pwcaQueueDesignUsage(meta) {
    if (pwcaRecordDesignUsage(meta)) return;
    const handler = () => {
        pwcaRecordDesignUsage(meta);
        document.removeEventListener('canvasPiniaReady', handler);
    };
    document.addEventListener('canvasPiniaReady', handler);
}

window.recordDesignUsage = pwcaRecordDesignUsage;
window.queueDesignUsage = pwcaQueueDesignUsage;
