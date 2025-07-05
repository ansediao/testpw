export default {
    template: `<div class="operation-panel">
      <div class="controls">
        <label for="colorPicker">选择颜色：</label>
        <input type="color" id="colorPicker" value="#3498db" />
        <button id="resetBtn">重置</button>
      </div>
      <div class="controls">
        <button id="addTextBtn" style="margin-top: 10px;" onclick="addText()">
          <svg viewBox="0 0 24 24" width="16" height="16" style="vertical-align: middle;">
            <path fill="currentColor"
              d="M18.5,4L19.66,8.35L18.7,8.61C18.25,7.74 17.79,6.87 17.26,6.43C16.73,6 16.11,6 15.5,6H13V16.5C13,17 13,17.5 13.33,17.75C13.67,18 14.33,18 15,18V19H9V18C9.67,18 10.33,18 10.67,17.75C11,17.5 11,17 11,16.5V6H8.5C7.89,6 7.27,6 6.74,6.43C6.21,6.87 5.75,7.74 5.3,8.61L4.34,8.35L5.5,4H18.5Z" />
          </svg>
          添加文字
        </button>
        <button id="addImageBtn" style="margin-top: 10px;" onclick="document.getElementById('imageInput').click()">
          <svg viewBox="0 0 24 24" width="16" height="16" style="vertical-align: middle;">
            <path fill="currentColor"
              d="M21,19V5c0-1.1-0.9-2-2-2H5c-1.1,0-2,0.9-2,2v14c0,1.1,0.9,2,2,2h14C20.1,21,21,20.1,21,19z M8.5,13.5l2.5,3.01L14.5,12l4.5,6H5l3.5-4.5z" />
          </svg>
          添加图片
        </button>
        <input type="file" id="imageInput" accept="image/*" style="display: none;" onchange="addImage(event)" />
        <!-- 添加加入购物车按钮 -->
        <div class="cart-actions" style="margin-top: 20px; text-align: center;">
          <button id="addToCartBtn" class="add-to-cart-btn" style="background-color: #4CAF50; padding: 10px 20px; font-size: 16px;">
            <svg viewBox="0 0 24 24" width="16" height="16" style="vertical-align: middle; margin-right: 5px;">
              <path fill="currentColor" d="M17,18C15.89,18 15,18.89 15,20A2,2 0 0,0 17,22A2,2 0 0,0 19,20C19,18.89 18.1,18 17,18M1,2V4H3L6.6,11.59L5.24,14.04C5.09,14.32 5,14.65 5,15A2,2 0 0,0 7,17H19V15H7.42A0.25,0.25 0 0,1 7.17,14.75C7.17,14.7 7.18,14.66 7.2,14.63L8.1,13H15.55C16.3,13 16.96,12.58 17.3,11.97L20.88,5.5C20.95,5.34 21,5.17 21,5A1,1 0 0,0 20,4H5.21L4.27,2M7,18C5.89,18 5,18.89 5,20A2,2 0 0,0 7,22A2,2 0 0,0 9,20C9,18.89 8.1,18 7,18Z" />
            </svg>
            加入购物车
          </button>
          <div id="cartMessage" style="margin-top: 10px; color: green; display: none;">已成功加入购物车！</div>
        </div>

        <!-- 添加图库按钮 -->
        <button id="galleryBtn" style="margin-top: 20px;">打开图库</button>

        <!-- 图库图层 -->
        <div id="galleryLayer" style="display: none;">
          <div class="gallery">
            <!-- 图片将动态加载到这里 -->
          </div>
        </div>

        <script>
          // 打开图库按钮点击事件
          document.getElementById('galleryBtn').addEventListener('click', function() {
            const galleryLayer = document.getElementById('galleryLayer');
            galleryLayer.style.display = galleryLayer.style.display === 'none' ? 'block' : 'none';
          });

          // 动态加载图片
          function loadGalleryImages() {
            // 假设我们有一个API可以获取图片列表
            fetch('/wp-json/pw/v1/getPwDesignImages')
              .then(response => response.json())
              .then(result => {
                if (result.success && Array.isArray(result.data)) {
                  const images = result.data;
                  const gallery = document.querySelector('.gallery');
                  gallery.innerHTML = '';
                  images.forEach(image => {
                    const imgElement = document.createElement('img');
                    imgElement.src = image.url;
                    imgElement.classList.add('gallery-image');
                    imgElement.addEventListener('click', function() {
                      addToCanvas(image.url);
                    });
                    gallery.appendChild(imgElement);
                  });
                } else {
                  console.error('Failed to load images or data is not an array');
                }
              });
          }

          // 将图片添加到画布
          function addToCanvas(imageUrl) {
            fabric.Image.fromURL(imageUrl, function(img) {
              img.scaleToWidth(200);
              img.set({
                left: canvas.width / 2,
                top: canvas.height / 2,
                originX: 'center',
                originY: 'center',
                id: 'layer_' + layerCounter++
              });
              canvas.add(img);
              canvas.setActiveObject(img);
            });
          }

          // 初始化加载图片
          loadGalleryImages();
        </script>
        <style>
          /* 图库两列 grid布局 */
          .gallery {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }

          /* 图片样式 边框 和阴影*/
          .gallery-image {
            width: 100%;
            height: auto;
            cursor: pointer;
            border: 1px solid #ddd;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

          }
        </style>
        <!-- 生成PDF -->
        <button id="generatePdfBtn" style="margin-top: 20px; background-color: #ff9800;">
          <svg viewBox="0 0 24 24" width="16" height="16" style="vertical-align: middle; margin-right: 5px;">
            <path fill="currentColor" d="M19,3A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3H19M10.59,10.08C10.57,10.13 10.3,11.84 8.5,14.77C8.5,14.77 5,16.58 5.83,17.94C6.5,19 8.15,17.9 9.56,15.27C9.56,15.27 11.38,14.63 13.79,14.45C13.79,14.45 17.65,16.19 18.17,14.34C18.69,12.5 15.12,12.9 14.5,13.09C14.5,13.09 12.46,11.75 12,9.89C12,9.89 13.13,5.95 11.38,6C9.63,6.05 10.29,9.12 10.59,10.08M11.4,11.5C11.45,11.5 12.67,12.36 13.87,13.15C13.87,13.15 11.67,13.31 10.71,13.81C10.71,13.81 11.33,12.31 11.4,11.5M8.88,16.36C8.88,16.36 7.63,17.97 7.63,17.69C7.63,17.69 7.38,17.08 8.88,16.36M13.41,15.54C14.08,15.45 16.25,15.33 16.25,15.95C16.25,15.95 15.88,16.57 13.41,15.54M11.08,10.05C11.08,10.05 10.72,8.95 10.93,8.73C11.15,8.5 11.33,9.1 11.08,10.05Z" />
          </svg>
          生成PDF文件
        </button>
        <!-- 渲染 -->
        <button id="renderBtn" style="margin-top: 20px; background-color: #2196F3;">
          <svg viewBox="0 0 24 24" width="16" height="16" style="vertical-align: middle; margin-right: 5px;">
            <path fill="currentColor" d="M19,19H5V5H19M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M13.96,12.29L11.21,15.83L9.25,13.47L6.5,17H17.5L13.96,12.29Z" />
          </svg>
          渲染预览
        </button>
        <!-- 添加画板缩放滑块 -->
        <div class="zoom-control" style="margin-top: 15px;">
          <label for="zoomSlider" style="display: block; margin-bottom: 5px;">画板缩放: <span id="zoomValue">100%</span></label>
          <input type="range" id="zoomSlider" min="50" max="200" value="100" style="width: 100%;">
        </div>
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
            //更新数值
            document.getElementById('arcSlider').addEventListener('input', function() {
              document.getElementById('arcValue').innerText = this.value;
              // geng'xgengx
            });
          </script>
        <?php endif; ?>
      </div>
    </div>`,
  };
  