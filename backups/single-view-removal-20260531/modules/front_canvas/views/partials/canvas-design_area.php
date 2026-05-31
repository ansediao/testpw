<?php
// 获取产品图片URL
$image_url = '';
$color_image_url = '';
if ($product_id > 0 && $product) {
    $image_id = $product->get_image_id();
    if ($image_id) {
        $image_url = wp_get_attachment_image_url($image_id, 'full');
    }
    // 获取base 图层
    $color_image_url = get_post_meta($product_id, 'pw_mainIMG_color', true) ?: 'https://pwfiles.939666.xyz/t-shirt/color.png';

    // 获取容器图层
    $pw_container  = get_post_meta($product_id, 'pw_container', true);
    // 获取 4格图层
    $pw_4_grid = get_post_meta($product_id, 'pw_4-grid', true);

    $pw_bg = get_post_meta($product_id, 'pw_bg', true);

    // 如果 $pw_4_grid 存在且不为空 那么 
    if ($pw_4_grid) {
        $image_url = $pw_4_grid;
        // 获取图片尺寸
        $image_size = getimagesize($pw_4_grid);
        $image_width = $image_size[0];
        $image_height = $image_size[1];
        // 计算等比例高度（基于500px宽度）
        $canvas_width = 500;
        $canvas_height = round(($canvas_width / $image_width) * $image_height);
    }
}

// 准备图片数据
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

<!-- 多视图容器 -->
<div id="multi-view-container">
    <!-- 视图容器将通过 JavaScript 动态生成 -->
</div>
