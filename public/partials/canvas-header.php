<div class="header_left">
    <div class="header_title">
        <!-- 通过产品ID 显示产品名 -->
        <?php echo get_the_title($product_id); ?>
    </div>
</div>
<div class="header_right">
    <div class="design-switch-btn-box">
        <!-- Tab Button 1: Principle -->
        <button class="design-switch-btn active" data-tab="viewDesign">Design</button>
        <!-- Tab Button 2: Logic -->
        <button class="design-switch-btn" id="renderBtn" data-tab="viewMockup">Mockups</button>
    </div>
    <button id="generatePdfBtn">PDF</button>
    <a href="<?php echo get_permalink($product_id); ?>" class="close-btn" title="返回产品页">
        X
    </a>
</div>
