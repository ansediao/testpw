<div class="header_left">
    <div class="header_title">
        <!-- 通过产品ID 显示产品名 -->
        <?php echo get_the_title($product_id); ?>
    </div>
</div>
<div class="header_right" id="header-controls-app" data-product-link="<?php echo get_permalink($product_id); ?>">
    <!-- Vue App Mount Point -->
</div>