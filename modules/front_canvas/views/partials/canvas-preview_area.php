<div class="view-area">
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
                height="<?php echo $preview_canvas_height; ?>">
            </canvas>
        </div>
    <?php endif; ?>

</div>
