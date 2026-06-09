<div class="pwca-header-left">
    <div class="pwca-header-title">
        <!-- 通过产品ID 显示产品名 -->
        <?php echo get_the_title($product_id); ?>
    </div>
</div>
<div class="pwca-header-right" id="header-controls-app" data-product-link="<?php echo get_permalink($product_id); ?>">
    <!-- Vue App Mount Point -->
</div>