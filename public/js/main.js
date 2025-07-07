// 获取画布和上下文
const colorCanvas = document.getElementById('colorLayer');
const shadowCanvas = document.getElementById('shadowLayer');
const colorCtx = colorCanvas.getContext('2d');
const shadowCtx = shadowCanvas.getContext('2d');
 // 历史记录管理逻辑
// 历史记录数组和当前索引
let history = [];
let historyPointer = -1;
const MAX_HISTORY_STEPS = 50; // 限制历史记录步数
let isRestoring = false; // 标志以防止恢复状态时触发保存

// 保存画布当前状态到历史记录
function saveState() {
  // 如果在历史记录中间进行了新操作，则清除未来的历史记录
  if (historyPointer < history.length - 1) {
    history = history.slice(0, historyPointer + 1);
  }
  // 将当前画布内容保存为 Data URL
  history.push(canvas.toDataURL());
  historyPointer++;

  // 限制历史记录步数
  if (history.length > MAX_HISTORY_STEPS) {
    history.shift(); // 移除最旧的记录
    historyPointer--;
  }

  updateHistoryButtons();
  console.log('保存状态，当前历史记录指针：', historyPointer);
}

// 从历史记录中加载指定状态并绘制到画布
function restoreState(index) {
  if (index >= 0 && index < history.length) {
    isRestoring = true;
    canvas.clear(); // 清空画布
    const img = new Image();
    img.src = history[index];
    img.onload = () => {
      fabric.Image.fromURL(img.src, function(oImg) {
        // 调整图像尺寸以适应画布
        oImg.scaleToWidth(canvas.width);
        oImg.scaleToHeight(canvas.height);
        canvas.add(oImg);
        canvas.renderAll();
        historyPointer = index;
        updateHistoryButtons();
        console.log('恢复状态，当前历史记录指针：', historyPointer);
        isRestoring = false;
      }, { crossOrigin: 'anonymous' });
    };
  }
}

// 更新前进/后退按钮状态
function updateHistoryButtons() {
  const forwardBtn = document.getElementById('forward');
  const backwardBtn = document.getElementById('backward');
  if (forwardBtn) forwardBtn.disabled = historyPointer >= history.length - 1;
  if (backwardBtn) backwardBtn.disabled = historyPointer <= 0;
  console.log('更新按钮状态，前进按钮：', forwardBtn ? forwardBtn.disabled : '未找到', '，后退按钮：', backwardBtn ? backwardBtn.disabled : '未找到');
}

// 初始化画布尺寸并清空
function initializeCanvas() {
  canvas.setWidth(canvas.getElement().parentElement.clientWidth);
  canvas.setHeight(canvas.getElement().parentElement.clientHeight);
  canvas.clear();
  saveState(); // 保存初始空白状态
}

// 初始化Fabric.js画布

const canvas = new fabric.Canvas('mainCanvas', {
  // 设置选中对象时的控制框样式
  selectionBorderColor: 'rgba(0,0,0,0.3)',
  
  selectionLineWidth: 1
});


canvas.on('object:modified', () => {
  updatePreviewCanvas();
  if (!isRestoring) saveState();
});
canvas.on('object:added', () => {
  updatePreviewCanvas();
  if (!isRestoring) saveState();
});
canvas.on('object:removed', () => {
  updatePreviewCanvas();
  if (!isRestoring) saveState();
});

const arcSlider = document.getElementById('arcSlider');
if (arcSlider) {
  arcSlider.addEventListener('input', function () {
    updatePreviewCanvas();
  });
}


// 更新预览画布的函数
function updatePreviewCanvas() {
  const designPreviewCanvas = document.getElementById('designPreviewCanvas');
  if (!designPreviewCanvas) return;

  const mainCanvas = canvas.toDataURL({
    format: 'png',
    quality: 1
  });

  const img = new Image();
  img.onload = function () {
    const ctx = designPreviewCanvas.getContext('2d');
    ctx.clearRect(0, 0, designPreviewCanvas.width, designPreviewCanvas.height);

    // 计算中间50%的区域
    const sourceX = img.width * 0.25; // 从25%处开始
    const sourceWidth = img.width * 0.5; // 截取50%的宽度

    // 从 id="arcSlider" input 获取弧度参数
    const arcSlider = document.getElementById('arcSlider');
    const arc = arcSlider.value;

    // 使用弯曲函数替代普通的drawImage，传入裁剪参数
    drawImageCurvedAndCentered(
      ctx,
      img,
      0,
      0,
      designPreviewCanvas.width,
      designPreviewCanvas.height,
      arc,
      sourceX,
      sourceWidth
    );
  };
  img.src = mainCanvas;
}

// 修改弯曲图像绘制函数，添加裁剪参数
function drawImageCurvedAndCentered(ctx, image, x, y, width, height, arc, sourceX, sourceWidth) {
  const steps = 50;
  const step = width / steps;

  for (let i = 0; i < steps; i++) {
    const sx = sourceX + (i * sourceWidth) / steps;
    const sWidth = sourceWidth / steps;
    const dy = Math.sin((i / steps) * Math.PI) * (arc / 10);

    ctx.drawImage(
      image,
      sx,
      0,
      sWidth,
      image.height,
      x + i * step,
      y + dy,
      step + 1,
      height
    );
  }
}




// 监听对象选择事件
canvas.on('selection:created', function (options) {
  updateDynamicToolbar(options.selected[0]);
});
canvas.on('selection:updated', function (options) {
  updateDynamicToolbar(options.selected[0]);
});
canvas.on('selection:cleared', function () {
  updateDynamicToolbar(null);
});

// 默认颜色
const defaultColor = '#3498db';
let currentColor = defaultColor;
// 初始化画布
init();
// 初始化时绘制边界
drawBoundary();
// 初始化画布尺寸和历史记录
initializeCanvas();

// 前进按钮事件
const forwardBtn = document.getElementById('forward');
if (forwardBtn) {
  forwardBtn.addEventListener('click', () => {
    if (historyPointer < history.length - 1) {
      restoreState(historyPointer + 1);
      console.log('前进操作，目标历史记录指针：', historyPointer + 1);
    } else {
      console.log('已到达历史记录终点，无法继续前进');
    }
  });
}

// 后退按钮事件
const backwardBtn = document.getElementById('backward');
if (backwardBtn) {
  backwardBtn.addEventListener('click', () => {
    if (historyPointer > 0) {
      restoreState(historyPointer - 1);
      console.log('后退操作，目标历史记录指针：', historyPointer - 1);
    } else {
      console.log('已到达历史记录起点，无法继续后退');
    }
  });
}


// 添加渲染预览按钮的点击事件
document.getElementById('renderBtn').addEventListener('click', async function () {
  // 检查是否存在预览容器
  const previewContainer = document.querySelector('.preview-canvas-container');
  // 根据是否存在预览容器选择不同的捕获函数
  const imageData = await (previewContainer ? capturePreviewCanvas() : captureCanvas());
  // 创建一个新窗口并写入HTML内容
  const previewWindow = window.open('', '_blank');
  previewWindow.document.write(`
     <html>
       <head>
         <title>预览效果</title>
         <style>
           body {
             margin: 0;
             display: flex;
             justify-content: center;
             align-items: center;
             min-height: 100vh;
             background: #f0f0f0;
           }
           img {
             max-width: 100%;
             max-height: 90vh;
             box-shadow: 0 0 20px rgba(0,0,0,0.1);
           }
         </style>
       </head>
       <body>
         <img src="${imageData}" alt="预览效果">
       </body>
     </html>
   `);
  previewWindow.document.close();
});
// 修改文本工具栏事件监听器，添加实时更新
document.addEventListener('DOMContentLoaded', function () {
  // 监听动态工具栏中的文本属性变化
  document.body.addEventListener('change', function (e) {
    if (e.target.id === 'fontFamily' || e.target.id === 'fontSize') {
      setTimeout(() => updateModelFromCanvas(), 100);
    }
  });
  document.body.addEventListener('input', function (e) {
    if (e.target.id === 'textColor') {
      setTimeout(() => updateModelFromCanvas(), 100);
    }
  });
});

// 有 id=model3dContainer 才初始化
if (document.getElementById('model3dContainer')) {
  // 页面加载完成后初始化3D模型
  document.addEventListener('DOMContentLoaded', function () {
    // 加载Font Awesome图标
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    document.head.appendChild(fontAwesome);
    // 加载Sortable.js
    const sortableScript = document.createElement('script');
    sortableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.14.0/Sortable.min.js';
    sortableScript.onload = initSortable;
    document.body.appendChild(sortableScript);


    init3DModel();




    // 添加一个短暂延迟后强制触发窗口大小调整事件，以确保3D渲染器正确初始化
    setTimeout(function () {
      window.dispatchEvent(new Event('resize'));
    }, 500);
  });
}

// 添加Canvas事件监听，以便在修改时更新3D模型纹理
// 对象修改事件
canvas.on('object:modified', function () {
  updateModelFromCanvas();
});
// 对象添加事件
canvas.on('object:added', function () {
  updateModelFromCanvas();
});
// 对象移除事件
canvas.on('object:removed', function () {
  updateModelFromCanvas();
});
// 对象移动事件
canvas.on('object:moving', function () {
  updateModelFromCanvas();
});
// 对象缩放事件
canvas.on('object:scaling', function () {
  updateModelFromCanvas();
});
// 对象旋转事件
canvas.on('object:rotating', function () {
  updateModelFromCanvas();
});

// 监听对象添加事件
canvas.on('object:added', function (e) {
  const obj = e.target;
  addLayerItem(obj);
});
// 监听对象移除事件
canvas.on('object:removed', function (e) {
  const obj = e.target;
  if (obj.id) {
    const layerItem = document.querySelector(`.layer-item[data-id="${obj.id
      }"]`);
    if (layerItem)
      layerItem.remove();


  }
});
// 监听选择事件，更新图层面板中的选中状态
canvas.on('selection:created', function (e) {
  updateLayerSelection(e.selected[0]);
});
canvas.on('selection:updated', function (e) {
  updateLayerSelection(e.selected[0]);
});
canvas.on('selection:cleared', function () {
  document.querySelectorAll('.layer-item').forEach(item => {
    item.classList.remove('selected');
  });
});

// 计算弧形文字的每个字符的属性
function calculateArcTextProperties(textObject, arcValue) {
  const originalText = textObject.text;
  const chars = originalText.split('');
  const totalWidth = textObject.width;
  const fontSize = textObject.fontSize;

  const charProperties = [];
  let currentX = 0; // 相对于文本对象左边缘的当前X位置

  // 假设每个字符的宽度是大致相等的，这里可以做更精确的测量
  // Fabric.js 的 Text 对象在渲染时会处理字符间距和宽度
  // 这里我们近似计算每个字符的平均宽度
  const avgCharWidth = totalWidth / chars.length;

  chars.forEach((char, index) => {
    // 字符的中心X位置相对于文本对象的中心
    const charRelativeCenterX = currentX + avgCharWidth / 2 - totalWidth / 2;

    // 归一化字符的X位置到 -0.5 到 0.5 之间
    const normalizedX = charRelativeCenterX / totalWidth;

    // 使用正弦函数计算垂直偏移 (dy)
    // arcValue 控制弯曲程度，除以一个系数来调整幅度
    // 增加幅度，例如乘以一个更大的系数
    const dy = Math.sin((normalizedX + 0.5) * Math.PI) * (arcValue * 0.5); // 调整幅度

    // 计算旋转角度 (angle)
    // 角度与正弦曲线的斜率相关，即余弦函数
    // 调整系数以控制角度变化幅度
    const angle = Math.cos((normalizedX + 0.5) * Math.PI) * (arcValue * 0.1); // 调整幅度，角度是度数

    charProperties.push({
      char: char,
      dx: charRelativeCenterX, // 字符相对于文本对象中心的X偏移
      dy: dy,
      angle: angle,
      width: avgCharWidth // 暂时使用平均宽度
    });

    currentX += avgCharWidth;
  });

  return charProperties;
}

// 应用弧形文字扭曲到 Fabric.js 文本对象
function applyArcDistortionToTextObject(textObject, arcValue) {
    if (!textObject || (textObject.type !== 'text' && !(textObject.type === 'group' && textObject._isArcDistorted))) {
        return;
    }

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
        width: textObject.width, // 确保原始宽度被保存
        height: textObject.height,
        // 其他需要保存的属性
    };

    // 移除旧的文本对象或组
    canvas.remove(textObject);

    const chars = originalText.split('');
    const charObjects = [];
    let currentXOffset = 0; // 累积的字符宽度偏移

    // 使用一个临时的 Fabric.Text 对象来精确测量每个字符的宽度
    const tempMeasurer = new fabric.Text('', {
        fontFamily: originalOptions.fontFamily,
        fontSize: originalOptions.fontSize,
    });

    chars.forEach((char, index) => {
        tempMeasurer.set('text', char);
        const charWidth = tempMeasurer.width * originalOptions.scaleX; // 考虑原始缩放

        // 调用之前定义的函数计算弧形属性
        // 确保传入 calculateArcTextProperties 的 textObject 包含正确的 width
        const charProps = calculateArcTextProperties({
            text: originalText,
            width: originalOptions.width,
            fontSize: originalOptions.fontSize
        }, arcValue)[index];

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
            textBaseline: 'alphabetic', // 明确设置为正确的值
        });
        charObjects.push(charObject);
        currentXOffset += charWidth;
    });

    // 将所有字符对象组合成一个 Fabric.Group
    const arcGroup = new fabric.Group(charObjects, {
        left: originalOptions.left,
        top: originalOptions.top,
        angle: originalOptions.angle,
        selectable: true,
        evented: true,
        _isArcDistorted: true, // 标记为弧形扭曲的组
        _originalTextConfig: {
            text: originalText,
            options: originalOptions
        }, // 保存原始文本配置
        id: textObject.id // 继承原始ID
    });

    canvas.add(arcGroup);
    canvas.setActiveObject(arcGroup);
    canvas.renderAll();
}
