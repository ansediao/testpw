<div class="view-area">
    <?php if (!empty($model_3d_url)) : ?>
        <div id="model3dContainer" data-model-url="<?php echo esc_attr($model_3d_url); ?>"></div>
    <?php endif; ?>
    <?php if (!empty($pw_4_grid)) : ?>
        <div class="preview-canvas-container">
            <?php
            $image_url = wp_get_attachment_image_url($image_id, 'full');
            // 获取图片尺寸
            $preview_image_size = getimagesize($image_url);
            $preview_image_width = $preview_image_size[0];
            $preview_image_height = $preview_image_size[1];
            // 计算等比例高度（基于150px宽度）
            $preview_canvas_width = 150;
            $preview_canvas_height = round(($preview_canvas_width / $preview_image_width) * $preview_image_height);
            ?>
            <canvas id="bgLayer"
                width="<?php echo $preview_canvas_width; ?>"
                height="<?php echo $preview_canvas_height; ?>"
                data-bg-image="<?php echo get_post_meta($product_id, 'pw_bg', true); ?>">
            </canvas>
            <canvas id="shadowLayer"
                width="<?php echo $preview_canvas_width; ?>"
                height="<?php echo $preview_canvas_height; ?>"
                data-color-image="<?php echo get_post_meta($product_id, 'pw_mainIMG_color', true); ?>">
            </canvas>
            <canvas id="previewCanvas"
                width="<?php echo $preview_canvas_width; ?>"
                height="<?php echo $preview_canvas_height; ?>"
                data-product-image="<?php echo esc_attr($image_url); ?>">
            </canvas>
            <!-- 添加新的预览画布 -->
            <canvas id="designPreviewCanvas"
                width="<?php echo $preview_canvas_width; ?>"
                height="<?php echo $preview_canvas_height; ?>"
                style="position: absolute; top: 0; left: 0;">
            </canvas>
        </div>

        <script>
            // 初始化预览画布
            window.addEventListener('load', function() {
                const previewCanvas = document.getElementById('previewCanvas');
                const shadowLayer = document.getElementById('shadowLayer');
                const designPreviewCanvas = document.getElementById('designPreviewCanvas');
                const productImage = previewCanvas.getAttribute('data-product-image');
                const colorImage = shadowLayer.getAttribute('data-color-image');

                // 初始化 previewCanvas
                if (previewCanvas && productImage) {
                    const ctx = previewCanvas.getContext('2d');
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = function() {
                        ctx.drawImage(img, 0, 0, previewCanvas.width, previewCanvas.height);
                    };
                    img.src = productImage;
                }

                // 单独处理 designPreviewCanvas 的剪切区域
                if (shadowLayer && colorImage) {
                    const shadowCtx = shadowLayer.getContext('2d');
                    const img = new Image();
                    img.crossOrigin = 'anonymous';

                    img.onload = function() {
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = shadowLayer.width;
                        tempCanvas.height = shadowLayer.height;
                        const tempCtx = tempCanvas.getContext('2d');
                        tempCtx.drawImage(img, 0, 0, shadowLayer.width, shadowLayer.height);

                        const imageData = tempCtx.getImageData(0, 0, shadowLayer.width, shadowLayer.height);
                        const data = imageData.data;

                        const designCtx = designPreviewCanvas.getContext('2d');
                        designCtx.beginPath();

                        // 添加3像素的内边距
                        const padding = 3;
                        for (let y = padding; y < shadowLayer.height - padding; y++) {
                            for (let x = padding; x < shadowLayer.width - padding; x++) {
                                const index = (y * shadowLayer.width + x) * 4;
                                const alpha = data[index + 3];
                                // 检查当前像素及其周围的像素是否都不透明
                                if (alpha > 0) {
                                    // 检查是否在有效边界内（避免边缘像素）
                                    let isValid = true;
                                    for (let dy = -padding; dy <= padding && isValid; dy++) {
                                        for (let dx = -padding; dx <= padding && isValid; dx++) {
                                            const nx = x + dx;
                                            const ny = y + dy;
                                            if (nx >= 0 && nx < shadowLayer.width && ny >= 0 && ny < shadowLayer.height) {
                                                const nIndex = (ny * shadowLayer.width + nx) * 4;
                                                if (data[nIndex + 3] === 0) {
                                                    isValid = false;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    if (isValid) {
                                        designCtx.rect(x, y, 1, 1);
                                    }
                                }
                            }
                        }

                        designCtx.closePath();
                        designCtx.clip();
                    };

                    img.src = colorImage;
                }
            });
        </script>
    <?php endif; ?>

</div>