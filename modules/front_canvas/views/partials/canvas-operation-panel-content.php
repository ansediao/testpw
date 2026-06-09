<?php
// 获取插件目录的URL
$plugin_url = plugin_dir_url(__FILE__);
?>

<?php include __DIR__ . '/canvas-operation-panel-nav.php'; ?>

<!-- 右侧内容区域 -->
<div class="pwca-content-area">
    <!-- 收缩按钮 -->
    <div class="pwca-panel-collapse-btn" id="panelCollapseBtn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    </div>
    <!-- 品名内容 -->
    <div id="content-pinming" class="pwca-content-pane active">
        <div class="pwca-tab-header">
            <div class="pwca-tab-header-title"><?php echo get_the_title($product_id); ?></div>
        </div>
        <div class="pwca-rating">
            <?php
            $rating = get_post_meta($product_id, 'rating', true);
            $rating = is_numeric($rating) ? floatval($rating) : 0;
            ?>
            <?php
            $product = wc_get_product($product_id); // 通过产品 ID 获取产品对象
            if ($product) {
                $average_rating = $product->get_average_rating(); // 获取综合评分
                $rating_count   = $product->get_rating_count();   // 获取评分数量

                // if ($average_rating > 0) {
                //     // 以星星形式显示平均评分
                //     for ($i = 1; $i <= 5; $i++) {
                //         if ($i <= floor($average_rating)) {
                //             echo '<span style="color: #fbbf24;">★</span>';
                //         } elseif ($i - $average_rating < 1) {
                //             echo '<span style="color: #fbbf24;">☆</span>';
                //         } else {
                //             echo '<span style="color: #d1d5db;">★</span>';
                //         }
                //     }
                // }
                echo '<span style="color: #fbbf24;">★</span>';
            }
            ?>
            <span style="margin-left: 5px;"><?php echo number_format($average_rating, 1); ?></span>
            <!-- 显示多少评价 -->
            <a href="#" id="show-reviews-link">
                <span style="margin-left: 5px;"><?php echo $rating_count; ?> Reviews</span>
            </a>
            <a href="#" id="show-cuzInfo-link">Customization Instructions</a>

            <!-- 评价弹窗 -->
            <div id="reviews-modal" class="pwca-popup-modal">
                <div class="pwca-modal-box">
                    <button id="close-reviews-modal">&times;</button>
                    <!-- 产品标题 -->
                    <div class="pwca-popup-header">
                        <p><?php echo get_the_title($product_id); ?></p>
                    </div>

                    <div class="pwca-popup-body">
                        <!-- 评价/描述/定制说明 Tab 切换 -->
                        <div id="review-tabs">
                            <div class="pwca-review-tab active" data-tab="desc">Info</div>
                            <div class="pwca-review-tab" data-tab="reviews">Reviews</div>
                            <div class="pwca-review-tab" data-tab="custom">Customization Instructions</div>
                        </div>
                        <div id="review-tab-content">
                            <div class="pwca-review-tab-pane active" data-content="desc">
                                <div>
                                    <div class="product-price-section">
                                        <div class="section-title">Price</div>
                                        <div class="product-price">
                                            <?php
                                            $product = wc_get_product($product_id);
                                            if ($product) {
                                                echo $product->get_price_html();
                                            } else {
                                                echo 'N/A';
                                            }
                                            ?>
                                        </div>
                                    </div>

                                    <div class="product-description-section">
                                        <div class="section-title">Description</div>
                                        <div class="product-description">
                                            <?php
                                            if ($product) {
                                                echo apply_filters('the_content', $product->get_description());
                                                // 可选：显示简短描述
                                                // echo apply_filters('the_content', $product->get_short_description());
                                            }
                                            ?>
                                            <?php
                                            // 产品属性（如材质、重量等）
                                            if ($product) {
                                                $attributes = $product->get_attributes();
                                                if (!empty($attributes)) {
                                                    echo '<ul class="product-features">';
                                                    foreach ($attributes as $attribute) {
                                                        if ($attribute->is_taxonomy()) {
                                                            $values = wc_get_product_terms(
                                                                $product->get_id(),
                                                                $attribute->get_name(),
                                                                array('fields' => 'names')
                                                            );
                                                            echo '<li>' . wc_attribute_label($attribute->get_name()) . ': ' . implode(', ', $values) . '</li>';
                                                        } else {
                                                            echo '<li>' . wc_attribute_label($attribute->get_name()) . ': ' . esc_html($attribute->get_options()[0]) . '</li>';
                                                        }
                                                    }
                                                    echo '</ul>';
                                                }
                                            }
                                            ?>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="review-tab-pane" data-content="reviews" style="display:none;">
                                <div id="reviews-list">
                                    <?php
                                    // 获取该产品的所有评价（WooCommerce 评论/WordPress 评论）
                                    $comments = get_comments(
                                        array(
                                            'post_id' => $product_id,
                                        )
                                    );
                                    if ($comments) {
                                        foreach ($comments as $comment) {
                                            echo '<div style="border-bottom:1px solid #eee; margin-bottom:1rem; padding-bottom:1rem;">';
                                            echo '<strong>' . esc_html($comment->comment_author) . '</strong> ';
                                            echo '<span style="color:#888; font-size:0.9em;">' . esc_html(get_comment_date('', $comment)) . '</span><br>';
                                            echo '<div style="margin:0.5em 0;">' . esc_html($comment->comment_content) . '</div>';
                                            // 显示评分（如果有）
                                            $rating = intval(get_comment_meta($comment->comment_ID, 'rating', true));
                                            if ($rating) {
                                                echo '<div style="color:#fbbf24;">';
                                                for ($i = 1; $i <= 5; $i++) {
                                                    echo $i <= $rating ? '★' : '☆';
                                                }
                                                echo '</div>';
                                            }
                                            echo '</div>';
                                        }
                                    } else {
                                        echo '<div style="color:#888;">暂无评价</div>';
                                    }
                                    ?>
                                </div>
                            </div>

                            <div class="pwca-review-tab-pane" data-content="custom" style="display:none;">
                                <div>
                                    <?php
                                    // 你可以自定义定制说明字段，或用自定义字段
                                    $custom_note = get_post_meta($product_id, 'custom_note', true);
                                    if ($custom_note) {
                                        echo wpautop(esc_html($custom_note));
                                    } else {
                                        echo '<div style="color:#888;">No customization instructions available.</div>';
                                    }
                                    ?>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <div class="pwca-color-section">
            <h3>Trim color</h3>
            <div class="pwca-color-swatches-box" id="color-swatches-container">
                <!-- 颜色样本将通过 JavaScript 动态生成 -->
            </div>
        </div>

        <div class="pwca-action-buttons">
            <button class="pwca-btn pwca-btn-custom">Gradient</button>
            <button class="pwca-btn pwca-btn-custom">Custom Colors</button>
        </div>

        <div
            class="pwca-color-status-display"
            id="colorStatusDisplay"
            style="margin-top: 10px; font-size: 14px; color: #666; min-height: 20px; display: none;"
        >
            <!-- 颜色状态将在这里显示 -->
        </div>

        <?php
        // 复用前台产品模块的渐变色弹窗视图
        $gradient_modal_path = dirname( dirname( dirname( __DIR__ ) ) ) . '/front_product/views/partials/pwca-gradient-modal.php';
        if ( is_readable( $gradient_modal_path ) ) {
            include_once $gradient_modal_path;
        }
        ?>

        <div
            id="custom-color-modal"
            style="display:none; position:fixed; left:0; top:0; width:100vw; height:100vh; background:rgba(0,0,0,0.3); z-index:9999; align-items:center; justify-content:center;"
        >
            <div
                style="background:#fff; border-radius:8px; max-width:300px; width:90vw; padding:1rem; position:relative;"
            >
                <button
                    id="close-custom-color-modal"
                    style="position:absolute; right:0.5rem; top:0.5rem; background:none; border:none; font-size:1.5rem; cursor:pointer;"
                >
                    &times;
                </button>
                <h3 style="margin-top:0;">选择自定义颜色</h3>
                <input
                    type="color"
                    id="customColorPicker"
                    value="#000000"
                    style="width:100%; height:100px; margin-bottom:1rem;"
                />
                <button id="applyCustomColor" class="pwca-btn pwca-btn-inquiry" style="width:100%;">应用颜色</button>
            </div>
        </div>

        </div>

    <?php include __DIR__ . '/canvas-operation-panel-tab-layers.php'; ?>

    <?php include __DIR__ . '/canvas-operation-panel-tab-image.php'; ?>

    <?php include __DIR__ . '/canvas-operation-panel-tab-text.php'; ?>

    <?php include __DIR__ . '/canvas-operation-panel-tab-design.php'; ?>

    <?php include __DIR__ . '/canvas-operation-panel-footer.php'; ?>
</div>

<?php include __DIR__ . '/canvas-operation-panel-inquiry-modal.php'; ?>