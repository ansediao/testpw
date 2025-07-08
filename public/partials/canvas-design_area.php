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
    // 获取图片尺寸
    $first_image_width = 0;
    $first_image_height = 0;
    if ($first_image_url) {
        // 如果 $first_image_url 是以 / 开头的相对路径，补全为绝对路径
        if (strpos($first_image_url, '/') === 0) {
            $first_image_url_full = $_SERVER['DOCUMENT_ROOT'] . $first_image_url;
        } else {
            $first_image_url_full = $first_image_url;
        }
        $img_size = getimagesize($first_image_url_full);
        if ($img_size) {
            $first_image_width = $img_size[0];
            $first_image_height = $img_size[1];
        }
    }
    ?>
    <canvas id="shadowLayer"
        data-color-image="<?php echo esc_attr($first_image_url); ?>"
        data-img-width="<?php echo esc_attr($first_image_width); ?>"
        data-img-height="<?php echo esc_attr($first_image_height); ?>"
        style="display:block;height:100%;"></canvas>

    <canvas id="colorLayer"
        data-img-width="<?php echo esc_attr($first_image_width); ?>"
        data-img-height="<?php echo esc_attr($first_image_height); ?>"
        data-product-image="<?php echo esc_attr($image_url); ?>"
        style="display:block;"></canvas>
    <canvas id="mainCanvas"
        data-img-width="<?php echo esc_attr($first_image_width); ?>"
        data-img-height="<?php echo esc_attr($first_image_height); ?>"
        style="display:block;height:100%;"></canvas>

    <!-- 添加边缘限制层 -->
    <canvas id="boundaryLayer"
        data-img-width="<?php echo esc_attr($first_image_width); ?>"
        data-img-height="<?php echo esc_attr($first_image_height); ?>"
        <?php if ($pw_4_grid) {
            echo 'style="display:none;"';
        } else {
            echo 'style="height:100%;width:auto;display:block;"';
        } ?>></canvas>
<?php endif; ?>



<script>
    // 让所有canvas高度100%，宽度根据图片比例自适应
    document.addEventListener('DOMContentLoaded', function() {
                    //获取 shadowLayer元素 高度
                    var shadowLayer = document.getElementById('shadowLayer');
                    var shadowLayer_height = shadowLayer.offsetHeight;


                    var first_image_width = shadowLayer.getAttribute('data-img-width');
                    var first_image_height = shadowLayer.getAttribute('data-img-height');
                    // 计算 canvas的宽度
                    var canvas_height = shadowLayer_height;
                    var canvas_width = (first_image_width / first_image_height) * canvas_height;
                    
                    // 输出日志
                    console.log('shadowLayer height:', shadowLayer_height);
                    console.log('first_image_width:', first_image_width);
                    console.log('first_image_height:', first_image_height);
                    console.log('canvas width:', canvas_width); 
                    console.log('canvas height:', canvas_height);

                    canvas.setHeight(canvas_height);
                    canvas.setWidth(canvas_width);

            // 设置 shadowLayer colorLayer  boundaryLayer 的宽高
            var shadowLayer = document.getElementById('shadowLayer');
            shadowLayer.style.height = canvas_height + 'px';
            shadowLayer.style.width = canvas_width + 'px';  
            var colorLayer = document.getElementById('colorLayer');
            colorLayer.style.height = canvas_height + 'px';
            colorLayer.style.width = canvas_width + 'px';
            var boundaryLayer = document.getElementById('boundaryLayer');
            boundaryLayer.style.height = canvas_height + 'px';
            boundaryLayer.style.width = canvas_width + 'px';





    });
</script>