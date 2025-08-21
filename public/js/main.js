// 获取画布和上下文 - 动态获取当前激活视图的 canvas
function getActiveCanvasElements() {
    const store = window.useCanvasStore && window.useCanvasStore();
    if (store && store.activeViewId) {
        return {
            colorCanvas: document.getElementById(`colorLayer-${store.activeViewId}`),
            shadowCanvas: document.getElementById(`shadowLayer-${store.activeViewId}`),
            mainCanvas: document.getElementById(`mainCanvas-${store.activeViewId}`)
        };
    }
    // 回退到原始 ID（兼容性）
    return {
        colorCanvas: document.getElementById('colorLayer'),
        shadowCanvas: document.getElementById('shadowLayer'),
        mainCanvas: document.getElementById('mainCanvas')
    };
}

// 动态获取上下文
function getActiveCanvasContexts() {
    const elements = getActiveCanvasElements();
    return {
        colorCtx: elements.colorCanvas ? elements.colorCanvas.getContext('2d') : null,
        shadowCtx: elements.shadowCanvas ? elements.shadowCanvas.getContext('2d') : null
    };
}
 // 历史记录管理逻辑
// 历史记录数组和当前索引
let history = [];
let historyPointer = -1;
const MAX_HISTORY_STEPS = 50; // 限制历史记录步数
let isRestoring = false; // 标志以防止恢复状态时触发保存

// 保存画布当前状态到历史记录
function saveState() {
  const activeCanvas = getActiveCanvas();
  if (!activeCanvas) return;
  
  // 如果在历史记录中间进行了新操作，则清除未来的历史记录
  if (historyPointer < history.length - 1) {
    history = history.slice(0, historyPointer + 1);
  }
  // 将当前画布内容保存为 Data URL
  history.push(activeCanvas.toDataURL());
  historyPointer++;

  // 限制历史记录步数
  if (history.length > MAX_HISTORY_STEPS) {
    history.shift(); // 移除最旧的记录
    historyPointer--;
  }

  updateHistoryButtons();

}

// 从历史记录中加载指定状态并绘制到画布
function restoreState(index) {
  const activeCanvas = getActiveCanvas();
  if (!activeCanvas || index < 0 || index >= history.length) return;
  
  isRestoring = true;
  activeCanvas.clear(); // 清空画布
  const img = new Image();
  img.src = history[index];
  img.onload = () => {
    fabric.Image.fromURL(img.src, function(oImg) {
      // 调整图像尺寸以适应画布
      oImg.scaleToWidth(activeCanvas.width);
      oImg.scaleToHeight(activeCanvas.height);
      activeCanvas.add(oImg);
      activeCanvas.renderAll();
      historyPointer = index;
      updateHistoryButtons();

      isRestoring = false;
    }, { crossOrigin: 'anonymous' });
  };
}

// 更新前进/后退按钮状态
function updateHistoryButtons() {
  const forwardBtn = document.getElementById('forward');
  const backwardBtn = document.getElementById('backward');
  if (forwardBtn) forwardBtn.disabled = historyPointer >= history.length - 1;
  if (backwardBtn) backwardBtn.disabled = historyPointer <= 0;

}

// 初始化画布尺寸并清空
function initializeCanvas() {
  canvas.setWidth(canvas.getElement().parentElement.clientWidth);
  canvas.setHeight(canvas.getElement().parentElement.clientHeight);
  canvas.clear();
  saveState(); // 保存初始空白状态
}

// Canvas 初始化将在多视图系统中处理
// 这里保留全局变量的声明以保持兼容性
let canvas = null;

// 获取当前激活的 canvas 实例
function getActiveCanvas() {
    // 优先使用 CanvasManager
    if (window.CanvasManager) {
        return window.CanvasManager.getActiveCanvas();
    }
    
    // 回退到传统方式
    const store = window.useCanvasStore && window.useCanvasStore();
    if (store && store.activeViewId) {
        // 从 DOM 获取 Canvas 实例
        const canvasElement = document.getElementById(`mainCanvas-${store.activeViewId}`);
        if (canvasElement && canvasElement.__fabricCanvas) {
            return canvasElement.__fabricCanvas;
        }
    }
    return window.canvas || window.fabricCanvas;
}

// 动态设置全局 canvas 引用
function setGlobalCanvas(fabricCanvas) {
    canvas = fabricCanvas;
    window.canvas = fabricCanvas;
    window.fabricCanvas = fabricCanvas;
}

// 为 canvas 添加所有必要的事件监听器
function initializeCanvasEventListeners(fabricCanvas) {
  if (!fabricCanvas) return;
  
  addCanvasEventListeners(fabricCanvas);
  addCanvasSelectionListeners(fabricCanvas);
  addCanvas3DModelListeners(fabricCanvas);
  addCanvasLayerListeners(fabricCanvas);
  
  console.log('Canvas event listeners initialized');
}

// 暴露给全局使用
window.initializeCanvasEventListeners = initializeCanvasEventListeners;
window.setGlobalCanvas = setGlobalCanvas;


// 为当前激活的 canvas 添加事件监听器
function addCanvasEventListeners(fabricCanvas) {
  if (!fabricCanvas) return;
  
  // 监听画布对象修改事件，保存状态
  fabricCanvas.on('object:modified', () => {
    updatePreviewCanvas();
    if (!isRestoring) saveState();
  });
  fabricCanvas.on('object:added', () => {
    updatePreviewCanvas();
    if (!isRestoring) saveState();
  });
  fabricCanvas.on('object:removed', () => {
    updatePreviewCanvas();
    if (!isRestoring) saveState();
  });
}

const arcSlider = document.getElementById('arcSlider');
if (arcSlider) {
  arcSlider.addEventListener('input', function () {
    updatePreviewCanvas();
  });
}


// 更新预览画布的函数
function updatePreviewCanvas() {
  const activeCanvas = getActiveCanvas();
  if (!activeCanvas) return;
  
  const designPreviewCanvas = document.getElementById('designPreviewCanvas');
  if (!designPreviewCanvas) return;

  const mainCanvas = activeCanvas.toDataURL({
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




// 为当前激活的 canvas 添加选择事件监听器
function addCanvasSelectionListeners(fabricCanvas) {
  if (!fabricCanvas) return;
  
  // 监听对象选择事件
  fabricCanvas.on('selection:created', function (options) {
    updateDynamicToolbar(options.selected[0]);
  });
  fabricCanvas.on('selection:updated', function (options) {
    updateDynamicToolbar(options.selected[0]);
  });
  fabricCanvas.on('selection:cleared', function () {
    updateDynamicToolbar(null);
  });
}

// 默认颜色
const defaultColor = '#3498db';
let currentColor = defaultColor;

// 检查是否为多视图模式
const canvasStore = window.Pinia && window.useCanvasStore ? window.useCanvasStore() : null;
const isMultiViewMode = canvasStore && canvasStore.views && canvasStore.views.length > 0;
const hasMultiViewContainer = document.querySelector('.multi-view-container') !== null;

if (!isMultiViewMode && !hasMultiViewContainer) {
  // 单视图模式：执行传统初始化
  if (typeof window.initCanvasSystem === 'function') {
    window.initCanvasSystem();
  } else if (typeof init === 'function') {
    init();
  }
  // 检查是否存在 boundary canvas 元素再绘制
  if (document.getElementById('boundaryLayer')) {
    drawBoundary();
  }
  // 只有在 canvas 存在时才初始化
  if (canvas) {
    initializeCanvas();
  }
} else {
  // 多视图模式：初始化将由多视图系统处理
  console.log('多视图模式已激活，跳过传统初始化');
}

// 前进按钮事件
const forwardBtn = document.getElementById('forward');
if (forwardBtn) {
  forwardBtn.addEventListener('click', () => {
    if (historyPointer < history.length - 1) {
      restoreState(historyPointer + 1);

    } else {

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
  // 检查Pinia条件：productViewFlow = "Flat Flow" 且 views数组长度大于1
  if (typeof window.useCanvasStore === 'function') {
    try {
      const store = window.useCanvasStore();
      const productViewFlow = store.getProductViewFlow();
      const views = store.views || [];
      
      if (productViewFlow === "Flat Flow" && views.length > 1) {
        // 满足条件，在本窗口显示左右分栏的多Canvas预览
        await showMultiViewPreview(views);
        return;
      }
    } catch (error) {
      console.error('Failed to check Pinia conditions:', error);
    }
  }
  
  // 不满足条件，使用原有的新窗口预览方式
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

// 为当前激活的 canvas 添加3D模型更新事件监听器
function addCanvas3DModelListeners(fabricCanvas) {
  if (!fabricCanvas) return;
  
  // 添加Canvas事件监听，以便在修改时更新3D模型纹理
  // 对象修改事件
  fabricCanvas.on('object:modified', function () {
    updateModelFromCanvas();
  });
  // 对象添加事件
  fabricCanvas.on('object:added', function () {
    updateModelFromCanvas();
  });
  // 对象移除事件
  fabricCanvas.on('object:removed', function () {
    updateModelFromCanvas();
  });
  // 对象移动事件
  fabricCanvas.on('object:moving', function () {
    updateModelFromCanvas();
  });
  // 对象缩放事件
  fabricCanvas.on('object:scaling', function () {
    updateModelFromCanvas();
  });
  // 对象旋转事件
  fabricCanvas.on('object:rotating', function () {
    updateModelFromCanvas();
  });
}

// 为当前激活的 canvas 添加图层管理事件监听器
function addCanvasLayerListeners(fabricCanvas) {
  if (!fabricCanvas) return;
  
  // 监听对象添加事件 - 同步到图层管理系统
  fabricCanvas.on('object:added', function (e) {
    const obj = e.target;
    
    // 确保对象有 ID
    if (!obj.id) {
      obj.id = `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('Assigned ID to object:', obj.id);
    }
    
    // 同步到新的 Pinia store 系统
    syncCanvasObjectToStore(obj, 'added');
  });

  // 监听对象移除事件 - 同步到图层管理系统
  fabricCanvas.on('object:removed', function (e) {
    const obj = e.target;
    
    // 同步到新的 Pinia store 系统
    syncCanvasObjectToStore(obj, 'removed');
  });

  // 监听选择事件，更新图层面板中的选中状态
  fabricCanvas.on('selection:created', function (e) {
    // 同步选中状态到 Pinia store
    if (e.selected && e.selected.length > 0 && e.selected[0].id) {
      syncSelectionToStore(e.selected[0].id);
    }
  });

  fabricCanvas.on('selection:updated', function (e) {
    // 同步选中状态到 Pinia store
    if (e.selected && e.selected.length > 0 && e.selected[0].id) {
      syncSelectionToStore(e.selected[0].id);
    }
  });

  fabricCanvas.on('selection:cleared', function () {
    // 清除 Pinia store 中的选中状态
    syncSelectionToStore(null);
  });
  
  // 监听对象修改事件（用于更新缩略图）
  fabricCanvas.on('object:modified', function(e) {
    const obj = e.target;
    if (obj && obj.id) {
      // 触发缩略图刷新
      setTimeout(() => {
        const refreshEvent = new CustomEvent('layerThumbnailRefresh', {
          detail: { layerId: obj.id }
        });
        document.dispatchEvent(refreshEvent);
      }, 100);
    }
  });
}

// 同步画布对象到 Pinia store 的函数
function syncCanvasObjectToStore(obj, action) {
  if (typeof window.useCanvasStore === 'function') {
    try {
      const store = window.useCanvasStore();
      const currentViewId = store.activeViewId;
      
      if (!currentViewId) {
        console.warn('No active view, cannot sync layer');
        return;
      }
      
      if (action === 'added' && obj.id) {
        // 检查当前视图的图层是否已存在（避免重复添加）
        const currentViewLayers = store.getViewLayers(currentViewId);
        const existingLayer = currentViewLayers.find(layer => layer.id === obj.id);
        if (!existingLayer) {
          const layerName = getLayerName(obj);
          const layerType = getLayerType(obj);
          
          const newLayer = {
            id: obj.id,
            name: layerName,
            type: layerType,
            visible: obj.visible !== false,
            locked: !obj.selectable,
            groupId: obj.groupId || null,
            groupOrder: obj.groupOrder || 0
          };
          
          // 添加图层到当前视图
          store.addLayerToView(currentViewId, newLayer);
        }
      } else if (action === 'removed' && obj.id) {
        // 从当前视图中移除图层
        store.removeLayerFromView(currentViewId, obj.id);
        
        // 如果删除的是当前选中的图层，清除选中状态
        if (store.activeObjectId === obj.id) {
          store.setActiveObjectId(null);
        }
      }
    } catch (error) {
      console.error('Failed to sync canvas object to layer management system:', error);
    }
  }
}

// 同步选中状态到 Pinia store
function syncSelectionToStore(objectId) {
  if (typeof window.useCanvasStore === 'function') {
    try {
      const store = window.useCanvasStore();
      store.setActiveObjectId(objectId);
    } catch (error) {
      console.error('Failed to sync selection state:', error);
    }
  }
}

// 获取图层名称的辅助函数
function getLayerName(obj) {
  // 优先使用对象上设置的 layerName 属性（用于复制等场景）
  if (obj.layerName) {
    return obj.layerName;
  }
  
  if (obj.type === 'text' || obj.type === 'i-text') {
    const text = obj.text || '';
    return text.length > 15 ? text.substring(0, 15) + '...' : text;
  } else if (obj.type === 'image') {
    return '图片 ' + Date.now().toString().slice(-4);
  } else {
    return '图层 ' + Date.now().toString().slice(-4);
  }
}

// 获取图层类型的辅助函数
function getLayerType(obj) {
  // 优先使用对象上设置的 layerType 属性（用于复制等场景）
  if (obj.layerType) {
    return obj.layerType;
  }
  
  if (obj.type === 'text' || obj.type === 'i-text') {
    return 'text';
  } else if (obj.type === 'image') {
    return 'image';
  } else {
    return 'other';
  }
}

// 导出所有视图的画板图片
async function exportAllViewsAsImages() {
    const store = window.useCanvasStore();
    if (!store || !store.views || store.views.length === 0) {
        console.error('No view data found');
        return;
    }

    const originalActiveViewId = store.activeViewId;
    const exportedImages = [];

    try {
        for (const view of store.views) {
            console.log(`Exporting view: ${view.name}`);
            
            // 切换到当前视图
            store.setActiveViewId(view.id);
            
            // 手动触发视图切换逻辑
            const viewContainer = document.getElementById(`view-container-${view.id}`);
            if (viewContainer) {
                // 隐藏所有视图容器
                document.querySelectorAll('.view-container').forEach(container => {
                    container.style.display = 'none';
                });
                // 显示当前视图容器
                viewContainer.style.display = 'block';
            }
            
            // 使用 CanvasManager 获取当前视图的画布
            if (window.CanvasManager) {
                const canvas = window.CanvasManager.getCanvas(view.id);
                if (canvas) {
                    // 取消所有视图上所有元素的选中状态
                    const allCanvasIds = window.CanvasManager.getAllCanvasIds();
                    allCanvasIds.forEach(canvasId => {
                        const viewCanvas = window.CanvasManager.getCanvas(canvasId);
                        if (viewCanvas && typeof viewCanvas.discardActiveObject === 'function') {
                            viewCanvas.discardActiveObject();
                            viewCanvas.renderAll();
                        }
                    });
                    
                    // 更新全局 canvas 引用
                    if (window.setGlobalCanvas) {
                        window.setGlobalCanvas(canvas);
                    } else {
                        window.canvas = canvas;
                        window.fabricCanvas = canvas;
                    }
                    
                    // 重新渲染 canvas
                    canvas.renderAll();
                }
            }
            
            // 等待视图切换和渲染完成
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // 捕获当前视图的画板内容
            const imageDataUrl = await captureCanvas();
            if (imageDataUrl) {
                exportedImages.push({
                    viewName: view.name,
                    imageData: imageDataUrl
                });
                console.log(`View ${view.name} exported successfully`);
            } else {
                console.warn(`View ${view.name} export failed`);
            }
        }

        // 在新窗口中展示所有图片
        if (exportedImages.length > 0) {
            const newWindow = window.open('', '_blank');
            let htmlContent = `
                <html>
                    <head>
                        <title>所有视图导出</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; }
                            .view-section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; }
                            .view-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
                            .download-link { display: inline-block; margin-top: 10px; padding: 8px 16px; background: #007cba; color: white; text-decoration: none; border-radius: 4px; }
                            .download-link:hover { background: #005a87; }
                            img { max-width: 100%; height: auto; border: 1px solid #ccc; }
                        </style>
                    </head>
                    <body>
                        <h1>所有视图画板导出</h1>
            `;
            
            exportedImages.forEach((item, index) => {
                htmlContent += `
                    <div class="view-section">
                        <div class="view-title">${item.viewName}</div>
                        <img src="${item.imageData}" alt="${item.viewName}" />
                        <br>
                        <a href="${item.imageData}" download="${item.viewName}.png" class="download-link">下载 ${item.viewName}</a>
                    </div>
                `;
            });
            
            htmlContent += `
                    </body>
                </html>
            `;
            
            newWindow.document.write(htmlContent);
            newWindow.document.close();
            
            console.log(`Successfully exported ${exportedImages.length} views`);
        } else {
            console.warn('No views were successfully exported');
        }
    } catch (error) {
        console.error('Error occurred while exporting all views:', error);
    } finally {
        // 恢复到原始激活视图
        if (originalActiveViewId) {
            console.log(`Restored to original view: ${originalActiveViewId}`);
            store.setActiveViewId(originalActiveViewId);
            
            // 手动触发视图切换逻辑以恢复显示
            const originalViewContainer = document.getElementById(`view-container-${originalActiveViewId}`);
            if (originalViewContainer) {
                // 隐藏所有视图容器
                document.querySelectorAll('.view-container').forEach(container => {
                    container.style.display = 'none';
                });
                // 显示原始视图容器
                originalViewContainer.style.display = 'block';
            }
            
            // 使用 CanvasManager 恢复原始视图的画布
            if (window.CanvasManager) {
                const originalCanvas = window.CanvasManager.getCanvas(originalActiveViewId);
                if (originalCanvas) {
                    window.CanvasManager.setActiveCanvas(originalActiveViewId);
                    
                    if (window.setGlobalCanvas) {
                        window.setGlobalCanvas(originalCanvas);
                    } else {
                        window.canvas = originalCanvas;
                        window.fabricCanvas = originalCanvas;
                    }
                    originalCanvas.renderAll();
                }
            }
        }
    }
}

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

/**
 * 显示多视图预览界面（左右分栏）
 * @param {Array} views - 视图数组
 */
async function showMultiViewPreview(views) {
    // 检查是否已存在预览界面，如果存在则先移除
    const existingModal = document.getElementById('multi-view-preview-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // 创建MicroModal结构的预览界面
    const modalHTML = `
        <div class="modal micromodal-slide" id="multi-view-preview-modal" aria-hidden="true">
            <div class="modal__overlay" tabindex="-1" data-micromodal-close>
                <div class="modal__container modal__container--fullscreen" role="dialog" aria-modal="true" aria-labelledby="multi-view-title">
                    <header class="modal__header">
                        <h2 class="modal__title" id="multi-view-title">多视图预览</h2>
                        <button class="modal__close" aria-label="Close modal" data-micromodal-close></button>
                    </header>
                    <main class="modal__content modal__content--scrollable">
                        <div class="preview-body">
                             <div class="thumbnail-list">
                                 <div class="loading">正在加载视图...</div>
                             </div>
                             <div class="main-preview">
                                 <div class="preview-placeholder">请选择左侧视图查看预览</div>
                             </div>
                         </div>
                    </main>
                </div>
            </div>
        </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        /* MicroModal全屏样式 */
        #multi-view-preview-modal {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 99999 !important;
            display: none;
        }
        
        #multi-view-preview-modal.is-open {
            display: flex !important;
        }
        
        #multi-view-preview-modal .modal__overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background: rgba(0, 0, 0, 0.8) !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            z-index: 99999 !important;
            width: 100% !important;
            height: 100% !important;
        }
        
        #multi-view-preview-modal .modal__container {
            background-color: white !important;
            padding: 0 !important;
            border-radius: 8px !important;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important;
            width: 95vw !important;
            height: 90vh !important;
            max-width: none !important;
            max-height: none !important;
            overflow: hidden !important;
            position: relative !important;
            z-index: 100000 !important;
        }
        
        .modal__container--fullscreen {
            width: 100vw !important;
            height: 100vh !important;
            max-width: none !important;
            max-height: none !important;
            margin: 0 !important;
            border-radius: 0 !important;
            display: flex;
            flex-direction: column;
        }
        
        .modal__content--scrollable {
            flex: 1;
            overflow-y: auto;
            padding: 0;
        }
        
        .modal__header {
            padding: 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f8f9fa;
            flex-shrink: 0;
        }
        
        .modal__title {
            margin: 0;
            color: #333;
            font-size: 18px;
        }
        
        .modal__close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
        }
        
        .modal__close:hover {
            background: #e9ecef;
            color: #333;
        }
        
        .modal__close::before {
            content: '×';
        }
        
        .preview-body {
            display: flex;
            height: 100%;
            min-height: calc(100vh - 80px);
        }
        
        .thumbnail-list {
            width: 300px;
            background: #f8f9fa;
            border-right: 1px solid #eee;
            overflow-y: auto;
            padding: 20px;
            flex-shrink: 0;
        }
        
        .thumbnail-item {
            margin-bottom: 15px;
            cursor: pointer;
            border: 2px solid transparent;
            border-radius: 8px;
            overflow: hidden;
            transition: all 0.3s ease;
        }
        
        .thumbnail-item:hover {
            border-color: #007bff;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
        }
        
        .thumbnail-item.active {
            border-color: #007bff;
            box-shadow: 0 0 0 1px #007bff;
        }
        
        .thumbnail-item img {
            width: 100%;
            height: auto;
            display: block;
        }
        
        .thumbnail-label {
            padding: 10px;
            background: white;
            text-align: center;
            font-size: 14px;
            color: #333;
            border-top: 1px solid #eee;
        }
        
        .main-preview {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: #fff;
            overflow: auto;
        }
        
        .main-preview img {
            max-width: 100%;
            max-height: 100%;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        
        .preview-placeholder {
            color: #666;
            font-size: 16px;
            text-align: center;
        }
        
        .loading {
            text-align: center;
            color: #666;
            padding: 20px;
        }
        
        /* 响应式设计 */
        @media (max-width: 768px) {
            .preview-body {
                flex-direction: column;
            }
            
            .thumbnail-list {
                width: 100%;
                max-height: 200px;
                border-right: none;
                border-bottom: 1px solid #eee;
            }
            
            .main-preview {
                flex: 1;
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // 等待DOM插入完成
    setTimeout(() => {
        const modal = document.getElementById('multi-view-preview-modal');
        if (!modal) {
            console.error('Modal element not found');
            return;
        }
        
        // 确保MicroModal已加载并初始化
        if (typeof MicroModal !== 'undefined') {
            // 初始化MicroModal（如果还未初始化）
            try {
                MicroModal.init({
                    disableScroll: true,
                    disableFocus: false,
                    awaitCloseAnimation: false,
                    debugMode: false
                });
            } catch (e) {
                // 可能已经初始化过了，忽略错误
            }
            
            // 显示弹窗
            try {
                MicroModal.show('multi-view-preview-modal');
            } catch (e) {
                console.warn('MicroModal show failed, using fallback:', e);
                // 降级处理
                modal.style.display = 'flex';
                modal.classList.add('is-open');
            }
        } else {
            console.error('MicroModal not loaded, using fallback');
            // 降级处理：直接显示
            modal.style.display = 'flex';
            modal.classList.add('is-open');
        }
    }, 10);
    
    // 捕获所有视图的截图
    const viewImages = await captureAllViewsImages(views);
    
    // 生成缩略图列表
    const thumbnailList = document.querySelector('#multi-view-preview-modal .thumbnail-list');
    const mainPreview = document.querySelector('#multi-view-preview-modal .main-preview');
    
    thumbnailList.innerHTML = '';
    
    viewImages.forEach((imageData, index) => {
        const view = views[index];
        const thumbnailItem = document.createElement('div');
        thumbnailItem.className = `thumbnail-item ${index === 0 ? 'active' : ''}`;
        thumbnailItem.innerHTML = `
            <img src="${imageData}" alt="${view.name || `视图 ${index + 1}`}" />
            <div class="thumbnail-label">${view.name || `视图 ${index + 1}`}</div>
        `;
        
        // 点击缩略图更新大图
        thumbnailItem.addEventListener('click', () => {
            // 移除其他缩略图的active状态
            thumbnailList.querySelectorAll('.thumbnail-item').forEach(item => {
                item.classList.remove('active');
            });
            // 添加当前缩略图的active状态
            thumbnailItem.classList.add('active');
            // 更新大图
            mainPreview.innerHTML = `<img src="${imageData}" alt="${view.name || `视图 ${index + 1}`}">`;
        });
        
        thumbnailList.appendChild(thumbnailItem);
    });
    
    // 设置默认大图（第一个视图）
    if (viewImages.length > 0) {
        mainPreview.innerHTML = `<img src="${viewImages[0]}" alt="${views[0].name || '视图 1'}">`;
    }
}

/**
 * 捕获所有视图的Canvas截图（应用遮罩效果）
 * @param {Array} views - 视图数组
 * @returns {Promise<Array>} 图片数据数组
 */
async function captureAllViewsImages(views) {
    const images = [];
    
    for (const view of views) {
        try {
            // 获取对应视图的Canvas实例
            const canvasId = `mainCanvas-${view.id}`;
            const canvasElement = document.getElementById(canvasId);
            
            if (canvasElement && window.CanvasManager) {
                const fabricCanvas = window.CanvasManager.getCanvas(view.id);
                if (fabricCanvas) {
                    // 强制渲染
                    fabricCanvas.renderAll();
                    
                    // 捕获Canvas内容（应用遮罩效果）
                    const imageData = await captureCanvasWithMask(fabricCanvas, view);
                    images.push(imageData);
                } else {
                    console.warn(`Canvas not found for view: ${view.id}`);
                    // 添加占位图
                    images.push('data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">无法加载视图</text></svg>'));
                }
            } else {
                console.warn(`Canvas element not found: ${canvasId}`);
                // 添加占位图
                images.push('data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">视图不存在</text></svg>'));
            }
        } catch (error) {
            console.error(`Failed to capture view ${view.id}:`, error);
            // 添加错误占位图
            images.push('data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">截图失败</text></svg>'));
        }
    }
    
    return images;
}

/**
 * 根据Fabric Canvas实例捕获截图（应用遮罩效果）
 * @param {fabric.Canvas} fabricCanvas - Fabric Canvas实例
 * @param {Object} view - 视图对象
 * @returns {Promise<string>} 图片数据URL
 */
function captureCanvasWithMask(fabricCanvas, view) {
    return new Promise((resolve) => {
        try {
            // 强制渲染
            fabricCanvas.renderAll();
            
            // 获取打印区域尺寸
            let printAreaWidth = 100; // 默认值
            let printAreaHeight = 120; // 默认值
            
            // 从 Pinia printMethod store 获取打印区域尺寸
            if (window.usePrintMethodStore) {
                const printMethodStore = window.usePrintMethodStore();
                const currentMethods = printMethodStore.currentViewPrintMethods;
                
                if (currentMethods && currentMethods.length > 0) {
                    const firstMethod = currentMethods[0];
                    if (firstMethod.print_method_area_width && firstMethod.print_method_area_height) {
                        // 将尺寸乘以50转换为像素
                        printAreaWidth = firstMethod.print_method_area_width * 50;
                        printAreaHeight = firstMethod.print_method_area_height * 50;
                    }
                }
            }
            
            // 创建临时画布
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = fabricCanvas.width;
            tempCanvas.height = fabricCanvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // 绘制白色背景
            tempCtx.fillStyle = '#FFFFFF';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            // 获取fabric.js画布的数据URL
            const fabricImage = new Image();
            fabricImage.src = fabricCanvas.toDataURL({
                format: 'png',
                quality: 1,
                multiplier: 1
            });
            
            fabricImage.onload = function () {
                // 绘制主画布内容
                tempCtx.drawImage(fabricImage, 0, 0);
                
                // 应用遮罩效果：只保留镂空区域
                const maskCanvas = document.createElement('canvas');
                maskCanvas.width = fabricCanvas.width;
                maskCanvas.height = fabricCanvas.height;
                const maskCtx = maskCanvas.getContext('2d');
                
                // 计算镂空区域位置
                const cutoutX = (fabricCanvas.width - printAreaWidth) / 2;
                const cutoutY = (fabricCanvas.height - printAreaHeight) / 2;
                
                // 绘制镂空区域的内容
                maskCtx.drawImage(tempCanvas, cutoutX, cutoutY, printAreaWidth, printAreaHeight, 0, 0, printAreaWidth, printAreaHeight);
                
                // 创建最终的裁剪画布
                const finalCanvas = document.createElement('canvas');
                finalCanvas.width = printAreaWidth;
                finalCanvas.height = printAreaHeight;
                const finalCtx = finalCanvas.getContext('2d');
                
                // 绘制白色背景
                finalCtx.fillStyle = '#FFFFFF';
                finalCtx.fillRect(0, 0, printAreaWidth, printAreaHeight);
                
                // 绘制裁剪后的内容
                finalCtx.drawImage(tempCanvas, cutoutX, cutoutY, printAreaWidth, printAreaHeight, 0, 0, printAreaWidth, printAreaHeight);
                
                resolve(finalCanvas.toDataURL('image/png'));
            };
            
            fabricImage.onerror = function () {
                console.error('Failed to load fabric canvas image');
                resolve('data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">图片加载失败</text></svg>'));
            };
        } catch (error) {
            console.error('Error capturing canvas with mask:', error);
            resolve('data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">截图异常</text></svg>'));
        }
    });
}

/**
 * 根据Fabric Canvas实例捕获截图（原始版本，不应用遮罩）
 * @param {fabric.Canvas} fabricCanvas - Fabric Canvas实例
 * @returns {Promise<string>} 图片数据URL
 */
function captureCanvasById(fabricCanvas) {
    return new Promise((resolve) => {
        try {
            // 强制渲染
            fabricCanvas.renderAll();
            
            // 创建临时画布
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = fabricCanvas.width;
            tempCanvas.height = fabricCanvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // 绘制白色背景
            tempCtx.fillStyle = '#FFFFFF';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            // 获取fabric.js画布的数据URL
            const fabricImage = new Image();
            fabricImage.src = fabricCanvas.toDataURL({
                format: 'png',
                quality: 1,
                multiplier: 1
            });
            
            fabricImage.onload = function () {
                // 绘制主画布内容
                tempCtx.drawImage(fabricImage, 0, 0);
                resolve(tempCanvas.toDataURL('image/png'));
            };
            
            fabricImage.onerror = function () {
                console.error('Failed to load fabric canvas image');
                resolve('data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">图片加载失败</text></svg>'));
            };
        } catch (error) {
            console.error('Error capturing canvas:', error);
            resolve('data:image/svg+xml;base64,' + btoa('<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffe6e6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000">截图异常</text></svg>'));
        }
    });
}

/**
 * 关闭多视图预览
 */
function closeMultiViewPreview() {
    const modal = document.getElementById('multi-view-preview-modal');
    if (modal) {
        // 先尝试用MicroModal关闭
        if (typeof MicroModal !== 'undefined') {
            try {
                MicroModal.close('multi-view-preview-modal');
            } catch (e) {
                console.warn('MicroModal close failed:', e);
            }
        }
        
        // 手动隐藏并移除
        modal.style.display = 'none';
        modal.classList.remove('is-open');
        
        // 延迟移除DOM元素，确保动画完成
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 100);
    }
}

// 将关闭函数暴露到全局
window.closeMultiViewPreview = closeMultiViewPreview;
