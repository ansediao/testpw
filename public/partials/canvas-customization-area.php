<?php
// 获取base 图层
$color_image_url = get_post_meta($product_id, 'pw_mainIMG_color', true);
if (!empty($color_image_url)) {
    // 将图片URL字符串按逗号分割成数组
    $image_urls = explode(',', $color_image_url);
    // 遍历数组生成按钮1112222
    foreach ($image_urls as $index => $url) {
        $url = trim($url); // 去除可能存在的空格
        if (!empty($url)) {
            // 定义按钮名称
            $names = ['Front', 'Back', 'Left', 'Right'];
            $btn_name = isset($names[$index]) ? $names[$index] : 'View ' . ($index + 1);
            echo '<button class="viewer-switch-btn" data-image-url="' . esc_attr($url) . '" style="margin: 5px;">' .
            $btn_name .
            '</button>';
        }
    }
}