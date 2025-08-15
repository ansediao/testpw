<?php
// 获取产品ID参数
$product_id = isset($_GET['product_id']) ? intval($_GET['product_id']) : 258;

// 获取产品名称和 pw_id meta 值
$product_name = '';
$pw_id = '';
if ($product_id > 0) {
  $product = wc_get_product($product_id);
  if ($product) {
    $product_name = $product->get_name();
    // 获取产品的 pw_id meta 值
    $pw_id = get_post_meta($product_id, 'pw_id', true);
  }
}

?>

<!DOCTYPE html>
<html lang="zh">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>在线定制<?php echo $product_name ? ' - ' . esc_html($product_name) : ''; ?></title>


  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  <script src="https://unpkg.com/vue-demi@0.14.7/lib/index.iife.js"></script>
  <script src="https://unpkg.com/pinia@2/dist/pinia.iife.js"></script>
  <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <!-- 引入 Layui CSS -->
  <link href="//unpkg.com/layui@2.11.5/dist/css/layui.css" rel="stylesheet">
  <!-- 引入 Layui JS -->
  <script src="//unpkg.com/layui@2.11.5/dist/layui.js"></script>
  <link rel="stylesheet" href="//at.alicdn.com/t/c/font_4970780_pfyts3fzl6.css?time=<?php echo  microtime(true); ?>" />
  <link rel="stylesheet" href="https://stage.canvas.939666.xyz/wp-content/uploads/wpcodebox/203.css?time=<?php echo  microtime(true); ?>" />
  <link rel="stylesheet" href="https://stage.canvas.939666.xyz/wp-content/uploads/wpcodebox/240.css?time=<?php echo  microtime(true); ?>" />
  <link rel="stylesheet" href="<?php echo plugin_dir_url(__FILE__) . '../css/operation-panel.css?time=' . microtime(true); ?>" />

  <!-- 加载 Three.js -->
  <script src="https://unpkg.com/three@0.128.0/build/three.min.js"></script>
  <!-- 加载 OrbitControls -->
  <script src="https://unpkg.com/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
  <!-- 加载 GLTFLoader -->
  <script src="https://unpkg.com/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>

  <!-- 已移除 Vue 3 加载 -->
  <?php //wp_head(); 
  ?>
</head>

<body class="wpcanvas">
  <div id="app" class="container">
    <header class="header">
      <?php
      include dirname(__FILE__) . '/canvas-header.php';
      ?>
    </header>
    <div class="customization-area">
      <?php
      // 加载同目录 customization-area.php 文件 
      include dirname(__FILE__) . '/canvas-customization-area.php';
      ?>
    </div>
    <main class="main-content">
      <div class="operation-panel">
        <?php
        // 加载同目录 canvas-operation-panel.php 文件
        include dirname(__FILE__) . '/canvas-operation-panel.php';
        ?>
      </div>

      <div class="canvas-area">
        <div class="dongtai-area">
          <?php
          // 加载同目录 canvas-dongtai-area.php 文件
          include dirname(__FILE__) . '/canvas-dongtai-area.php';
          ?>
        </div>

        <div class="canvas-box">
          <div class="design_area">
            <?php
            // 加载同目录 canvas-design_area.php 文件
            include dirname(__FILE__) . '/canvas-design_area.php';
            ?>
          </div>
          <div class="preview_area">
            <?php
            // 加载同目录 canvas-preview_area.php 文件
            include dirname(__FILE__) . '/canvas-preview_area.php';
            ?>
          </div>
        </div>
      </div>
    </main>
    <footer class="footer" id="footer">
      <div class="product-card">
        <div class="product-card__info">
          <div class="product-card__detail">
            <span class="product-card__label">Minimum Order Quantity</span>
            <span class="product-card__value">100Pcs / Design<br>25Pcs / Color</span>

          </div>
          <div class="product-card__detail">
            <span class="product-card__label">Price</span>
            <span class="product-card__value">Base Price: $3.0<br>Customization Price: $3.0</span>

          </div>
          <div class="product-card__detail">
            <span class="product-card__label">Estimated delivery date:<br>Estimated arrival date:</span>
            <span class="product-card__value"><span id="estimatedDeliveryDate"></span><br><span id="estimatedArrivalDate"></span></span>

            <script>
              document.addEventListener('DOMContentLoaded', () => {
                syncPiniaToElement(
                  "estimatedDeliveryDate",
                  () => window.useCanvasStore(),
                  "estimatedDeliveryDate"
                );
              });
            </script>
          </div>
        </div>
        <div class="product-card__quantity">
          <button class="product-card__button product-card__button--minus">-</button>
          <input type="text" value="100" class="product-card__input">
          <button class="product-card__button product-card__button--plus">+</button>
        </div>
      </div>
      <!-- 添加画板缩放滑块 -->
      <div class="zoom-control" style="margin-top: 15px;">
        <label for="zoomSlider" style="display: block; margin-bottom: 5px;">Scale: <span id="zoomValue">100%</span></label>
        <input type="range" id="zoomSlider" min="50" max="200" value="100" style="width: 100%;">
      </div>
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          const zoomSlider = document.getElementById('zoomSlider');
          const zoomValue = document.getElementById('zoomValue');

          if (zoomSlider && zoomValue) {
            zoomSlider.addEventListener('input', function() {
              const zoomLevel = this.value / 100;
              zoomValue.innerText = this.value + '%';
              if (typeof canvas !== 'undefined') {
                canvas.setZoom(zoomLevel);
                // 调整画布视口以确保缩放效果可见
                canvas.viewportTransform[0] = zoomLevel;
                canvas.viewportTransform[3] = zoomLevel;
                canvas.renderAll();
                console.log('画布缩放比例更新为：', zoomLevel);
              } else {
                console.error('画布对象未定义');
              }
            });
          } else {
            console.error('缩放滑块或数值显示元素未找到');
          }
        });
      </script>
      <?php
      $pw_4_grid = get_post_meta($product_id, 'pw_4-grid', true);

      ?>
      <?php if (!empty($pw_4_grid)) : ?>
        <!-- 添加滑块 控制arc参数 初始在中间 0，可以-1000 到 1000调节  -->
        <div class="arc-control" style="margin-top: 15px;">
          <label for="arcSlider" style="display: block; margin-bottom: 5px;">Arc: <span id="arcValue">0</span></label>
          <input type="range" id="arcSlider" min="-200" max="200" value="0" style="width: 100%;">
        </div>
        <script>
          // 更新数值并应用到预览画布
          document.getElementById('arcSlider').addEventListener('input', function() {
            document.getElementById('arcValue').innerText = this.value;
            if (typeof updatePreviewCanvas !== 'undefined') {
              updatePreviewCanvas();
            }
          });
        </script>
      <?php endif; ?>
      <div class="product-card-btn">

        <button id="addToCartBtn" class="product-card__add-to-cart">Add to Cart</button>
      </div>
    </footer>
  </div>



  <!-- 加载 Pinia 同步工具 -->
  <script src="<?php echo 'https://stage.canvas.939666.xyz/wp-content/uploads/wpcodebox/246.js?time=' . microtime(true); ?>"></script>

  <?php if (defined('WP_DEBUG') && WP_DEBUG): ?>
    <!-- 开发环境：画布同步示例 -->
    <script src="<?php echo plugin_dir_url(dirname(__FILE__)) . 'js/utils/canvas-sync-examples.js?time=' . microtime(true); ?>"></script>
  <?php endif; ?>

  <script src="<?php echo plugin_dir_url(dirname(__FILE__)) . 'js/export.js?time=' . microtime(true); ?>"></script>
  <script src="<?php echo plugin_dir_url(dirname(__FILE__)) . 'js/toolbar.js?time=' . microtime(true); ?>"></script>
  <script src="<?php echo plugin_dir_url(dirname(__FILE__)) . 'js/boundary.js?time=' . microtime(true); ?>"></script>
  <script src="<?php echo plugin_dir_url(dirname(__FILE__)) . 'js/model-3d.js?time=' . microtime(true); ?>"></script>
  <script src="<?php echo plugin_dir_url(dirname(__FILE__)) . 'js/canvas-api-renderer.js?time=' . microtime(true); ?>"></script>
  <script src="<?php echo plugin_dir_url(dirname(__FILE__)) . 'js/canvas-manager.js?time=' . microtime(true); ?>"></script>
  <script src="<?php echo plugin_dir_url(dirname(__FILE__)) . 'js/canvas-init.js?time=' . microtime(true); ?>"></script>
  <script src="<?php echo plugin_dir_url(dirname(__FILE__)) . 'js/main.js?time=' . microtime(true); ?>"></script>


  <script>
    // 样式切换按钮点击事件
    document.querySelectorAll('.color-switch-btn').forEach(button => {
      button.addEventListener('click', function() {
        const imageUrl = this.getAttribute('data-image-url');
        const shadowLayer = document.getElementById('shadowLayer');
        if (shadowLayer) {
          shadowLayer.setAttribute('data-color-image', imageUrl);
          // 重新初始化画布
          initCanvas();
        }
      });
    });




    // 页面加载完成后的初始化功能
    document.addEventListener('DOMContentLoaded', async function() {
      // 获取产品数据
      const pwId = '<?php echo esc_js($pw_id); ?>';
      if (pwId && typeof window.useCanvasStore !== 'undefined') {
        try {
          const store = window.useCanvasStore();
          await store.fetchProductData(pwId);
          console.log('产品数据已加载到 Pinia store');

          // 尝试从API数据初始化画布
          if (typeof window.initCanvasFromAPI === 'function') {
            // 监听多视图画布初始化完成事件
            document.addEventListener('canvasInitializedFromAPI', function(event) {
              console.log('收到画布初始化完成事件:', event.detail);
            });

            // 监听视图特定的画布初始化完成事件
            document.addEventListener('viewCanvasInitialized', function(event) {
              console.log('视图画布初始化完成:', event.detail.viewData.name);
            });



            // 等待多视图系统初始化完成后再初始化API数据
            setTimeout(async () => {
              // 检查是否有多视图系统
              if (store.views && store.views.length > 0) {
                console.log('检测到多视图系统，为每个视图初始化API数据...');

                // 为每个视图初始化API数据
                for (const view of store.views) {
                  const canvasId = `mainCanvas-${view.id}`;
                  const canvasElement = document.getElementById(canvasId);

                  if (canvasElement) {
                    console.log(`正在为视图 ${view.name} 初始化API数据...`);
                    try {
                      // 使用视图特定的初始化函数
                      const canvas = await window.initCanvasForView(canvasId, view);
                      if (canvas) {
                        console.log(`视图 ${view.name} 的画布已从API数据成功初始化`);
                        // 使用 CanvasManager 管理 canvas 实例
                        if (window.CanvasManager) {
                          window.CanvasManager._canvasMap[view.id] = canvas;
                        }

                        // 如果是当前激活的视图，设置为全局canvas
                        if (view.id === store.activeViewId) {
                          window.canvas = canvas;
                          window.fabricCanvas = canvas;

                          // 如果存在全局的setGlobalCanvas函数，调用它
                          if (typeof window.setGlobalCanvas === 'function') {
                            window.setGlobalCanvas(canvas);
                          }
                        }
                      }
                    } catch (error) {
                      console.error(`视图 ${view.name} API初始化失败:`, error);
                    }
                  }
                }
              } else {
                // 单视图模式，查找主画布元素
                const mainCanvas = document.querySelector('#mainCanvas');
                if (mainCanvas) {
                  console.log('正在从API数据初始化单视图画布...');
                  // const canvas = await window.initCanvasFromAPI('mainCanvas', pwId);
                  if (canvas) {
                    console.log('单视图画布已从API数据成功初始化');
                  }
                } else {
                  console.log('未找到主画布元素，跳过API初始化');
                }
              }
            }, 1000); // 等待1秒让多视图系统完成初始化
          }
        } catch (error) {
          console.error('加载产品数据失败:', error);
        }
      } else {
        console.warn('pw_id 未找到或 Pinia store 未初始化:', {
          pwId,
          storeAvailable: typeof window.useCanvasStore !== 'undefined'
        });
      }

      // 加入购物车功能
      const addToCartBtn = document.getElementById('addToCartBtn');
      if (addToCartBtn) {
        addToCartBtn.addEventListener('click', async function() {
          console.log('加入购物车按钮被点击');
          // 获取产品ID
          const productId = <?php echo $product_id ?: 0; ?>;
          if (!productId) {
            alert('未指定产品，无法加入购物车');
            return;
          }
          // 检查是否存在预览容器
          const previewContainer = document.querySelector('.preview-canvas-container');
          // 根据是否存在预览容器选择不同的捕获函数
          const customImage = await (previewContainer ? capturePreviewCanvas() : captureCanvas());

          // 发送AJAX请求
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '<?php echo admin_url('admin-ajax.php'); ?>');
          xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
          xhr.onload = function() {
            if (xhr.status === 200) {
              try {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                  // 显示成功消息
                  const cartMessage = document.getElementById('cartMessage');
                  if (cartMessage) {
                    cartMessage.textContent = '已成功加入购物车！';
                    cartMessage.style.display = 'block';
                    // 3秒后隐藏消息
                    setTimeout(function() {
                      cartMessage.style.display = 'none';
                    }, 3000);
                  } else {
                    console.log('未找到购物车消息元素，使用 alert 显示成功消息');
                    alert('已成功加入购物车！');
                  }
                } else {
                  console.error('加入购物车失败: ', response.data);
                  alert('加入购物车失败: ' + (response.data || '未知错误'));
                }
              } catch (e) {
                console.error('处理响应时出错: ', e);
                alert('已成功加入购物车，但处理响应时出错');
              }
            } else {
              console.error('请求失败，状态码: ', xhr.status);
              alert('已成功加入购物车，但请求状态异常');
            }
          };
          // 准备数据
          const data = 'action=add_customized_product_to_cart' +
            '&product_id=' + encodeURIComponent(productId) +
            '&custom_image=' + encodeURIComponent(customImage) +
            '&color=' + encodeURIComponent(currentColor) +
            '&security=' + encodeURIComponent('<?php echo wp_create_nonce("custom-product-nonce"); ?>');
          xhr.send(data);
        });
      } else {
        console.error('未找到加入购物车按钮');
      }
    });
    // PDF生成功能
    document.getElementById('generatePdfBtn').addEventListener('click', async function() {
      // 获取产品名称
      const productName = '<?php echo esc_js($product_name); ?>';

      // 检查是否为多视图模式
      const store = window.useCanvasStore && window.useCanvasStore();
      const isMultiViewMode = store && store.views && store.views.length > 0;

      if (isMultiViewMode) {
        // 多视图模式：生成包含所有视图的PDF
        await generateMultiViewPDF(productName, store);
      } else {
        // 单视图模式：使用原有逻辑
        await generateSingleViewPDF(productName);
      }
    });

    // 单视图PDF生成函数
    async function generateSingleViewPDF(productName) {
      // 检查是否存在预览容器
      const previewContainer = document.querySelector('.preview-canvas-container');
      // 根据是否存在预览容器选择不同的捕获函数
      const imageData = await (previewContainer ? capturePreviewCanvas() : captureCanvas());

      // 创建PDF
      const {
        jsPDF
      } = window.jspdf;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        title: `${productName} - 定制预览`,
        subject: '在线定制预览',
        author: 'PW在线定制系统',
        creator: 'PW在线定制系统',
        format: 'a4'
      });

      // 添加标题
      doc.setFontSize(16);
      doc.text('Preview', 105, 20, {
        align: 'center'
      });
      if (productName) {
        doc.setFontSize(14);
        doc.text(`Product: ${productName}`, 105, 30, {
          align: 'center'
        });
      }

      // 计算图像尺寸，使其适应A4页面宽度（210mm x 297mm）
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);

      // 将base64图像添加到PDF
      doc.addImage(imageData, 'PNG', margin, 40, maxWidth, maxWidth);

      // 添加生成时间
      const currentTime = new Date();
      doc.setFontSize(10);
      doc.text(`Time: ${currentTime.toLocaleString()}`, 105, pageHeight - 10, {
        align: 'center'
      });

      // 保存PDF
      const timeStr = currentTime.toLocaleString().replace(/[:\/]/g, '-').replace(/,/g, '');
      const fileName = `${productName}_规格书_${timeStr}.pdf`;
      doc.save(fileName);
    }

    // 多视图PDF生成函数
    async function generateMultiViewPDF(productName, store) {
      if (!store || !store.views || store.views.length === 0) {
        console.error('没有找到视图数据');
        return;
      }

      const originalActiveViewId = store.activeViewId;
      const exportedImages = [];

      try {
        // 遍历所有视图并捕获图像
        for (const view of store.views) {
          console.log(`正在捕获视图用于PDF: ${view.name}`);

          // 切换到当前视图
          store.setActiveViewId(view.id);

          // 手动触发视图切换逻辑
          const viewContainer = document.getElementById(`view-container-${view.id}`);
          if (viewContainer) {
            document.querySelectorAll('.view-container').forEach(container => {
              container.style.display = 'none';
            });
            viewContainer.style.display = 'block';
          }

          // 更新全局 canvas 引用
          const canvas = window.CanvasManager ? window.CanvasManager.getCanvas(view.id) : null;
          if (canvas) {
            // 取消所有视图上所有元素的选中状态
            const allCanvasIds = window.CanvasManager ? window.CanvasManager.getAllCanvasIds() : [];
            allCanvasIds.forEach(canvasId => {
              const viewCanvas = window.CanvasManager ? window.CanvasManager.getCanvas(canvasId) : null;
              if (viewCanvas && typeof viewCanvas.discardActiveObject === 'function') {
                viewCanvas.discardActiveObject();
                viewCanvas.renderAll();
              }
            });

            if (window.setGlobalCanvas) {
              window.setGlobalCanvas(canvas);
            } else {
              window.canvas = canvas;
              window.fabricCanvas = canvas;
            }

            canvas.renderAll();
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
            console.log(`视图 ${view.name} 已捕获用于PDF`);
          }
        }

        // 创建包含所有视图的PDF
        if (exportedImages.length > 0) {
          const {
            jsPDF
          } = window.jspdf;
          const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            title: `${productName} - 多视图定制预览`,
            subject: '在线定制预览',
            author: 'PW在线定制系统',
            creator: 'PW在线定制系统',
            format: 'a4'
          });

          const pageWidth = 210;
          const pageHeight = 297;
          const margin = 20;
          const maxWidth = pageWidth - (margin * 2);
          const maxImageHeight = 120; // 限制每个图像的最大高度

          // 添加封面
          doc.setFontSize(18);
          doc.text('Multi-View Preview', 105, 30, {
            align: 'center'
          });
          if (productName) {
            doc.setFontSize(16);
            doc.text(`Product: ${productName}`, 105, 45, {
              align: 'center'
            });
          }
          doc.setFontSize(12);
          doc.text(`Total Views: ${exportedImages.length}`, 105, 60, {
            align: 'center'
          });

          // 为每个视图添加页面
          exportedImages.forEach((item, index) => {
            if (index > 0) {
              doc.addPage(); // 为每个视图添加新页面
            }

            // 添加视图标题
            doc.setFontSize(16);
            doc.text(`View: ${item.viewName}`, 105, 80, {
              align: 'center'
            });

            // 添加视图图像
            doc.addImage(
              item.imageData,
              'PNG',
              margin,
              90,
              maxWidth,
              maxImageHeight
            );

            // 添加页码
            doc.setFontSize(10);
            doc.text(
              `Page ${index + 1} of ${exportedImages.length}`,
              105,
              pageHeight - 20, {
                align: 'center'
              }
            );
          });

          // 添加生成时间到最后一页
          const currentTime = new Date();
          doc.setFontSize(10);
          doc.text(
            `Generated: ${currentTime.toLocaleString()}`,
            105,
            pageHeight - 10, {
              align: 'center'
            }
          );

          // 保存PDF
          const timeStr = currentTime.toLocaleString().replace(/[:\/]/g, '-').replace(/,/g, '');
          const fileName = `${productName}_多视图规格书_${timeStr}.pdf`;
          doc.save(fileName);

          console.log(`成功生成包含 ${exportedImages.length} 个视图的PDF`);
        } else {
          console.warn('没有成功捕获任何视图用于PDF生成');
        }

      } catch (error) {
        console.error('生成多视图PDF时发生错误:', error);
      } finally {
        // 恢复到原始激活视图
        if (originalActiveViewId) {
          console.log(`恢复到原始视图: ${originalActiveViewId}`);
          store.setActiveViewId(originalActiveViewId);

          const originalViewContainer = document.getElementById(`view-container-${originalActiveViewId}`);
          if (originalViewContainer) {
            document.querySelectorAll('.view-container').forEach(container => {
              container.style.display = 'none';
            });
            originalViewContainer.style.display = 'block';
          }

          const originalCanvas = window.CanvasManager ? window.CanvasManager.getCanvas(originalActiveViewId) : null;
          if (originalCanvas) {
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
  </script>
  <script src="<?php echo plugin_dir_url(__FILE__) . '../js/design/stores/index.js?time=' . microtime(true); ?>" type="module"></script>
  <script src="<?php echo plugin_dir_url(__FILE__) . '../js/design/main.js?time=' . microtime(true); ?>" type="module"></script>

  <!-- 初始化 Pinia 应用 -->
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // 确保 Vue 和 Pinia 已加载
      if (window.Vue && window.Pinia && window.useCanvasStore) {
        const {
          createApp
        } = window.Vue;
        const {
          createPinia
        } = window.Pinia;

        // 创建 Pinia 实例
        const pinia = createPinia();

        // 创建 Vue 应用（如果需要）
        const app = createApp({
          setup() {
            // 可以在这里添加全局的 Vue 逻辑
            return {};
          }
        });

        // 使用 Pinia
        app.use(pinia);

        // 如果有需要挂载的元素，可以挂载应用
        // app.mount('#app');

        console.log('[Canvas] Pinia 应用已初始化');

        // 触发自定义事件，通知其他脚本 Pinia 已准备就绪
        document.dispatchEvent(new CustomEvent('canvasPiniaReady', {
          detail: {
            pinia,
            useCanvasStore: window.useCanvasStore
          }
        }));
      } else {
        console.warn('[Canvas] Vue、Pinia 或 useCanvasStore 未正确加载');
      }
    });
  </script>


  <?php //wp_footer();
  ?>
</body>

</html>