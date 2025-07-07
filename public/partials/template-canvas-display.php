<?php
// 获取产品ID参数
$product_id = isset($_GET['product_id']) ? intval($_GET['product_id']) : 0;

// 获取产品名称
$product_name = '';
if ($product_id > 0) {
  $product = wc_get_product($product_id);
  if ($product) {
    $product_name = $product->get_name();
  }
}

?>

<!DOCTYPE html>
<html lang="zh">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>在线定制<?php echo $product_name ? ' - ' . esc_html($product_name) : ''; ?></title>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

  <link rel="stylesheet" href="/wp-content/uploads/wpcodebox/203.css?time=<?php echo  microtime(true); ?>" />

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

        <div class="canvas-container">
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
            <span class="product-card__label">起订量</span>
            <span class="product-card__value">100只/设计<br>25只/颜色</span>

          </div>
          <div class="product-card__detail">
            <span class="product-card__label">价格</span>
            <span class="product-card__value">基础价格: $3.0<br>定制费用: $1.0</span>

          </div>
          <div class="product-card__detail">
            <span class="product-card__label">发货日期:<br>到货日期:</span>
            <span class="product-card__value">YYYY-MM-DD<br>YYYY-MM-DD</span>

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
        <label for="zoomSlider" style="display: block; margin-bottom: 5px;">画板缩放: <span id="zoomValue">100%</span></label>
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
          <label for="arcSlider" style="display: block; margin-bottom: 5px;">圆弧参数: <span id="arcValue">0</span></label>
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
        
        <button id="addToCartBtn" class="product-card__add-to-cart">加购物车</button>
      </div>
    </footer>
  </div>



  <script src="<?php echo plugin_dir_url(dirname(__FILE__)) . 'js/export.js?time=' . microtime(true); ?>"></script>
  <script src="<?php echo plugin_dir_url(dirname(__FILE__)) . 'js/toolbar.js?time=' . microtime(true); ?>"></script>
  <script src="<?php echo plugin_dir_url(dirname(__FILE__)) . 'js/boundary.js?time=' . microtime(true); ?>"></script>
  <script src="<?php echo plugin_dir_url(dirname(__FILE__)) . 'js/model-3d.js?time=' . microtime(true); ?>"></script>
  <script src="<?php echo plugin_dir_url(dirname(__FILE__)) . 'js/layer-manager.js?time=' . microtime(true); ?>"></script>
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




    // 加入购物车功能
    document.addEventListener('DOMContentLoaded', function() {
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
      // // 设置中文字体
      // doc.addFont('Noto-Sans-SC-normal.ttf', 'Noto-Sans-SC', 'normal');
      // doc.setFont('Noto-Sans-SC');
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
      // 添加canvas图像
      // 计算图像尺寸，使其适应A4页面宽度（210mm x 297mm）
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      // 将base64图像添加到PDF
      doc.addImage(
        imageData,
        'PNG',
        margin,
        40,
        maxWidth,
        maxWidth // 保持宽高比
      );
      // 添加生成时间
      const currentTime = new Date();
      doc.setFontSize(10);
      doc.text(
        `Time: ${currentTime.toLocaleString()}`,
        105,
        pageHeight - 10, {
          align: 'center'
        }
      );
      // 打开PDF预览
      // doc.output('dataurlnewwindow');
      // doc.output('dataurinewwindow');
      // 使用产品名+规格书+时间作为文件名
      const timeStr = currentTime.toLocaleString().replace(/[:\/]/g, '-').replace(/,/g, '');
      const fileName = `${productName}_规格书_${timeStr}.pdf`;
      doc.save(fileName);
    });
  </script>


  <!-- 已移除 Vue 相关代码，保留添加购物车功能 -->

  <?php //wp_footer();
  ?>
</body>

</html>