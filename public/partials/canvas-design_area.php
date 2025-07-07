<?php
// 获取产品图片URL
$image_url = '';
$color_image_url = '';
$model_3d_url = ''; // 新增：获取3D模型URL变量
if ($product_id > 0 && $product) {
    $image_id = $product->get_image_id();
    if ($image_id) {
        $image_url = wp_get_attachment_image_url($image_id, 'full');
    }
    // 获取base 图层
    $color_image_url = get_post_meta($product_id, 'pw_mainIMG_color', true);

    // 获取3D模型文件
    $model_3d_url = get_post_meta($product_id, 'pw_3d_file', true);


    // 获取容器图层
    $pw_container  = get_post_meta($product_id, 'pw_container', true);
    // 获取 4格图层
    $pw_4_grid = get_post_meta($product_id, 'pw_4-grid', true);

    $pw_bg = get_post_meta($product_id, 'pw_bg', true);

    // print_r($pw_container);

    // 如果 pw_3d_file 存在 ，则 $image_url 和 $color_image_url 值就为空
    if ($model_3d_url) {
        $image_url = '';
        $color_image_url = '';
    }

    // 如果 $pw_4_grid 存在且不为空 那么 
    if ($pw_4_grid) {
        $image_url = $pw_4_grid;
        // $color_image_url = '';
        // 获取图片尺寸
        $image_size = getimagesize($pw_4_grid);
        $image_width = $image_size[0];
        $image_height = $image_size[1];
        // 计算等比例高度（基于500px宽度）
        $canvas_width = 500;
        $canvas_height = round(($canvas_width / $image_width) * $image_height);
    }
}
?>



<?php if (empty($pw_4_grid)) : ?>
    <?php
    // 如果$color_image_url包含逗号，说明有多张图片，只取第一张
    $first_image_url = $color_image_url;
    if (strpos($color_image_url, ',') !== false) {
        $image_urls = explode(',', $color_image_url);
        $first_image_url = trim($image_urls[0]);
    }
    ?>
    <canvas id="shadowLayer" data-color-image="<?php echo esc_attr($first_image_url); ?>"></canvas>
<?php endif; ?>

<canvas id="colorLayer" data-product-image="<?php echo esc_attr($image_url); ?>"></canvas>
<canvas id="mainCanvas"></canvas>

<!-- 添加边缘限制层 -->
<canvas id="boundaryLayer" <?php if ($pw_4_grid) {
                                echo 'style="display:none;"';
                            } ?>></canvas>