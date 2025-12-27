<?php
// 获取插件目录的URL
$plugin_url = plugin_dir_url(__FILE__);
?>

<?php include __DIR__ . '/canvas-operation-panel-nav.php'; ?>

<!-- 右侧内容区域 -->
<div class="content-area">
    <!-- 收缩按钮 -->
    <div class="panel-collapse-btn" id="panelCollapseBtn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    </div>
    <!-- 品名内容 -->
    <div id="content-pinming" class="content-pane active">
        <div class="tab_header">
            <div class="tab_header_title"><?php echo get_the_title($product_id); ?></div>
        </div>
        <div class="rating">
            <?php
            $rating = get_post_meta($product_id, 'rating', true);
            $rating = is_numeric($rating) ? floatval($rating) : 0;
            ?>
            <?php
            $product = wc_get_product($product_id); // 通过产品 ID 获取产品对象
            if ($product) {
                $average_rating = $product->get_average_rating(); // 获取综合评分
                $rating_count = $product->get_rating_count(); // 获取评分数量

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
            <a href="#" id="show-reviews-link"> <span style="margin-left: 5px;"><?php echo $rating_count; ?> Reviews</span></a>
            <a href="#" id="show-cuzInfo-link">Customization Instructions</a>

            <script>
                document.addEventListener('DOMContentLoaded', function() {
                    const showReviewsLink = document.getElementById('show-reviews-link');
                    if (showReviewsLink) {
                        showReviewsLink.addEventListener('click', function(e) {
                            e.preventDefault();
                            switchReviewTab(1); // 切换到第二个tab（产品描述）
                        });
                    }

                    const showCuzInfoLink = document.getElementById('show-cuzInfo-link');
                    if (showCuzInfoLink) {
                        showCuzInfoLink.addEventListener('click', function(e) {
                            e.preventDefault();
                            // 切换到第三个tab（定制说明）
                            switchReviewTab(2);
                        });
                    }

                    function switchReviewTab(tabIndex) {
                        const reviewTabs = document.querySelectorAll('#review-tabs .review-tab');
                        const reviewTabPanes = document.querySelectorAll('#review-tab-content .review-tab-pane');
                        reviewTabs.forEach(t => {
                            t.classList.remove('active');
                            // t.style.background = '#f3f4f6';
                        });
                        reviewTabPanes.forEach(pane => {
                            pane.style.display = 'none';
                            pane.classList.remove('active');
                        });
                        if (reviewTabs[tabIndex] && reviewTabPanes[tabIndex]) {
                            reviewTabs[tabIndex].classList.add('active');
                            reviewTabs[tabIndex].style.background = '#fff';
                            reviewTabPanes[tabIndex].style.display = '';
                            reviewTabPanes[tabIndex].classList.add('active');
                        }
                        // 打开弹窗
                        const reviewsModal = document.getElementById('reviews-modal');
                        if (reviewsModal) {
                            reviewsModal.style.display = 'flex';
                        }
                    }

                    function showReviewsAndSwitchTab() {
                        // 切换到第三个tab（定制说明）
                        switchReviewTab(2);
                    }
                });
            </script>

            <!-- 评价弹窗 -->
            <div id="reviews-modal" class="popup-modal">

                <div class="modal-box">
                    <button id="close-reviews-modal">&times;</button>
                    <!-- 产品标题 -->
                    <div class="popup_header">
                        <p><?php echo get_the_title($product_id); ?></p>
                    </div>

                    <div class="popup_body">
                        <!-- 评价/描述/定制说明 Tab 切换 -->
                        <div id="review-tabs">
                            <div class="review-tab active" data-tab="desc">Info</div>
                            <div class="review-tab" data-tab="reviews">Reviews</div>
                            <div class="review-tab" data-tab="custom">Customization Instructions</div>
                        </div>
                        <div id="review-tab-content">
                            <div class="review-tab-pane active" data-content="desc">
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
                                                            $values = wc_get_product_terms($product->get_id(), $attribute->get_name(), array('fields' => 'names'));
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
                                    $comments = get_comments(array(
                                        'post_id' => $product_id,
                                    ));
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

                            <div class="review-tab-pane" data-content="custom" style="display:none;">

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

                    <script>
                        document.addEventListener('DOMContentLoaded', function() {
                            const reviewTabs = document.querySelectorAll('#review-tabs .review-tab');
                            const reviewTabPanes = document.querySelectorAll('#review-tab-content .review-tab-pane');
                            reviewTabs.forEach(tab => {
                                tab.addEventListener('click', function() {
                                    reviewTabs.forEach(t => {
                                        t.classList.remove('active');

                                    });
                                    tab.classList.add('active');
                                    tab.style.background = '#fff';
                                    const tabKey = tab.getAttribute('data-tab');
                                    reviewTabPanes.forEach(pane => {
                                        if (pane.getAttribute('data-content') === tabKey) {
                                            pane.style.display = '';
                                            pane.classList.add('active');
                                        } else {
                                            pane.style.display = 'none';
                                            pane.classList.remove('active');
                                        }
                                    });
                                });
                            });
                        });
                    </script>

                </div>
            </div>
            <script>
                document.addEventListener('DOMContentLoaded', function() {
                    const showReviewsLink = document.getElementById('show-reviews-link');
                    const reviewsModal = document.getElementById('reviews-modal');
                    const closeReviewsModal = document.getElementById('close-reviews-modal');

                    if (showReviewsLink && reviewsModal) {
                        showReviewsLink.addEventListener('click', function(e) {
                            e.preventDefault();
                            reviewsModal.style.display = 'flex';
                        });
                    }

                    if (closeReviewsModal && reviewsModal) {
                        closeReviewsModal.addEventListener('click', function() {
                            reviewsModal.style.display = 'none';
                        });
                    }

                    if (reviewsModal) {
                        reviewsModal.addEventListener('click', function(e) {
                            if (e.target === reviewsModal) {
                                reviewsModal.style.display = 'none';
                            }
                        });
                    }
                });
            </script>
            <script>
                document.addEventListener('DOMContentLoaded', function() {
                    const colorSwatches = document.querySelectorAll('.color-swatch');
                    colorSwatches.forEach(swatch => {
                        swatch.addEventListener('click', function() {
                            colorSwatches.forEach(s => s.classList.remove('selected'));
                            swatch.classList.add('selected');
                            const color = swatch.getAttribute('data-color');
                            const shadowCanvas = document.getElementById('shadowLayer');
                            if (shadowCanvas && typeof loadColorImage === 'function') {
                                const colorImageUrl = shadowCanvas.getAttribute('data-color-image');
                                if (colorImageUrl) {
                                    loadColorImage(colorImageUrl, color);
                                }
                            }
                        });
                    });
                });
            </script>
        </div>

        <div class="color-section">
            <h3>Trim color</h3>
            <div class="color-swatches-box" id="color-swatches-container">
                <!-- 颜色样本将通过 JavaScript 动态生成 -->
            </div>
        </div>
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                // 动态生成颜色样本
                function generateColorSwatches() {
                    const container = document.getElementById('color-swatches-container');
                    if (!container) return;

                    // 保存当前选中的颜色
                    const currentSelected = container.querySelector('.color-swatch.selected');
                    const selectedColor = currentSelected ? currentSelected.getAttribute('data-color') : null;

                    // 检查 canvasStore 是否可用
                    if (typeof window.useCanvasStore === 'undefined') {
                        console.warn('CanvasStore 未加载，使用默认颜色');
                        generateDefaultColors(container, selectedColor);
                        return;
                    }

                    const store = window.useCanvasStore();
                    
                    // 检查产品数据是否存在
                    if (!store.productData || !store.productData.variants || !store.productData.variants.data) {
                        console.warn('产品变体数据未加载，使用默认颜色');
                        generateDefaultColors(container, selectedColor);
                        return;
                    }

                    const variants = store.productData.variants.data;
                    if (!variants || variants.length === 0) {
                        console.warn('没有找到产品变体，使用默认颜色');
                        generateDefaultColors(container, selectedColor);
                        return;
                    }

                    // 过滤出 type 为 'normal' 且有 variant_color 值的变体
                    const normalVariants = variants.filter(variant => 
                        variant.type === 'normal' && 
                        variant.variant_color && 
                        variant.variant_color.trim() !== ''
                    );

                    if (normalVariants.length === 0) {
                        console.warn('没有找到有效的颜色变体，使用默认颜色');
                        generateDefaultColors(container, selectedColor);
                        return;
                    }

                    // 清空容器
                    container.innerHTML = '';

                    // 生成颜色样本
                    normalVariants.forEach((variant, index) => {
                        const colorSwatch = document.createElement('div');
                        // 如果有指定的选中颜色，则使用它；否则默认不选中任何颜色
                        const isSelected = selectedColor ? (variant.variant_color === selectedColor) : false;
                        colorSwatch.className = 'color-swatch' + (isSelected ? ' selected' : '');
                        colorSwatch.style.backgroundColor = variant.variant_color;
                        colorSwatch.setAttribute('data-color', variant.variant_color);
                        colorSwatch.setAttribute('data-variant-id', variant.id);
                        colorSwatch.setAttribute('data-variant-name', variant.variant_name);
                        colorSwatch.title = variant.variant_name || variant.variant_color;
                        
                        // 如果是白色或浅色，添加边框
                        if (isLightColor(variant.variant_color)) {
                            colorSwatch.style.border = '1px solid #9ca3af';
                        }
                        
                        container.appendChild(colorSwatch);
                    });

                    // 重新绑定事件监听器
                    bindColorSwatchEvents();
                }

                // 生成默认颜色
                function generateDefaultColors(container, selectedColor = null) {
                    const defaultColors = [
                        // { color: '#000000', name: '黑色' },
                        // { color: '#ef4444', name: '红色' },
                        // { color: '#14b8a6', name: '青色' },
                        // { color: '#ec4899', name: '粉色' },
                        // { color: '#ffffff', name: '白色' },
                        // { color: '#22d3ee', name: '天蓝色' },
                        // { color: '#2563eb', name: '蓝色' },
                        // { color: '#fde047', name: '黄色' }
                    ];

                    container.innerHTML = '';
                    defaultColors.forEach((colorData, index) => {
                        const colorSwatch = document.createElement('div');
                        // 如果有指定的选中颜色，则使用它；否则默认选中第一个
                        const isSelected = selectedColor ? (colorData.color === selectedColor) : (index === 0);
                        colorSwatch.className = 'color-swatch' + (isSelected ? ' selected' : '');
                        colorSwatch.style.backgroundColor = colorData.color;
                        colorSwatch.setAttribute('data-color', colorData.color);
                        colorSwatch.title = colorData.name;
                        
                        if (isLightColor(colorData.color)) {
                            colorSwatch.style.border = '1px solid #9ca3af';
                        }
                        
                        container.appendChild(colorSwatch);
                    });

                    bindColorSwatchEvents();
                }

                // 判断是否为浅色
                function isLightColor(color) {
                    const hex = color.replace('#', '');
                    const r = parseInt(hex.substr(0, 2), 16);
                    const g = parseInt(hex.substr(2, 2), 16);
                    const b = parseInt(hex.substr(4, 2), 16);
                    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                    return brightness > 200;
                }

                // 绑定颜色样本事件
                function bindColorSwatchEvents() {
                    const colorSwatches = document.querySelectorAll('.color-swatch');
                    colorSwatches.forEach(swatch => {
                        // 移除已有的事件监听器，避免重复绑定
                        swatch.removeEventListener('click', swatch._colorSwatchHandler);
                        
                        // 创建新的事件处理函数
                        swatch._colorSwatchHandler = function() {
                            colorSwatches.forEach(s => s.classList.remove('selected'));
                            swatch.classList.add('selected');
                            const color = swatch.getAttribute('data-color');
                            
                            // 调用颜色应用逻辑
                            handleColorSwatchClick(color);
                        };
                        
                        // 绑定新的事件监听器
                        swatch.addEventListener('click', swatch._colorSwatchHandler);
                    });
                }
                
                // 处理颜色样本点击的逻辑
                function handleColorSwatchClick(color) {
                    // 更新全局颜色变量，确保与 Custom Colors 保持一致
                    window.currentColor = color;
                    
                    // 先清除所有渐变色对象
                    if (window.clearAllGradientRects) {
                        window.clearAllGradientRects();
                    }
                    
                    // ===== 新增：将颜色数据存储到 Pinia store =====
                    function saveColorToStore(selectedColor) {
                        if (window.useCanvasStore) {
                            const store = window.useCanvasStore();
                            const activeViewId = store.activeViewId;
                            
                            if (activeViewId) {
                                // 从当前选中的颜色样本获取变体ID
                                const selectedSwatch = document.querySelector('.color-swatch.selected');
                                if (selectedSwatch) {
                                    const variantId = selectedSwatch.getAttribute('data-variant-id');
                                    
                                    // 从store中获取完整的变体数据
                                    let completeVariantData = null;
                                    if (variantId && store.productData && store.productData.variants && store.productData.variants.data) {
                                        const variants = store.productData.variants.data;
                                        completeVariantData = variants.find(variant => variant.id == variantId);
                                    }
                                    
                                    // 如果找到完整的变体数据，存储整个对象；否则使用基本信息
                                    let colorData;
                                    if (completeVariantData) {
                                        // 存储完整的变体对象
                                        colorData = {
                                            ...completeVariantData,
                                            // 确保包含当前选中的颜色
                                            selectedColor: selectedColor
                                        };
                                    } else {
                                        // 回退到基本信息
                                        const variantName = selectedSwatch.getAttribute('data-variant-name');
                                        const color = selectedSwatch.getAttribute('data-color');
                                        colorData = {
                                            variantId: variantId || null,
                                            variantName: variantName || null,
                                            color: color || selectedColor,
                                            selectedColor: selectedColor
                                        };
                                    }
                                    
                                    // 存储到 Canvas store
                                    store.setSelectedColorByView(activeViewId, colorData);
                                    
                                    // ===== 新增：参考产品页面逻辑，更新 selectedVariant 到 Product Store =====
                                    if (window.useProductStore && completeVariantData) {
                                        try {
                                            const productStore = window.useProductStore();
                                            // 参考 ColorVariants.js 中的 selectVariant 方法
                                            productStore.setSelectedVariant(completeVariantData);
                                            
                                            // 发送自定义事件，与产品页面保持一致
                                            const event = new CustomEvent('pw-color-variant-selected', {
                                                detail: { variant: completeVariantData }
                                            });
                                            document.dispatchEvent(event);
                                        } catch (error) {
                                            console.warn('更新 Product Store selectedVariant 失败:', error);
                                        }
                                    } else if (window.useProductStore && !completeVariantData) {
                                        // 如果没有完整的变体数据，创建一个基本的变体对象
                                        try {
                                            const productStore = window.useProductStore();
                                            const basicVariant = {
                                                id: variantId || 'design-' + Date.now(),
                                                variant_color: selectedColor,
                                                variant_name: selectedSwatch.getAttribute('data-variant-name') || '自定义颜色',
                                                type: 'design-selected',
                                                isDesignSelected: true
                                            };
                                            productStore.setSelectedVariant(basicVariant);
                                            
                                            // 发送自定义事件
                                            const event = new CustomEvent('pw-color-variant-selected', {
                                                detail: { variant: basicVariant }
                                            });
                                            document.dispatchEvent(event);
                                        } catch (error) {
                                            console.warn('创建基本 selectedVariant 失败:', error);
                                        }
                                    }
                                    
                                } else {
                                    console.warn('未找到选中的颜色样本元素');
                                }
                            } else {
                                console.warn('没有激活的视图ID');
                            }
                        } else {
                            console.warn('CanvasStore 不可用');
                        }
                    }
                    
                    // 先保存颜色数据到 store
                    saveColorToStore(color);
                    
                    // ===== 新增：计算各视图 rts_for_bulk_order 最大值相加 =====
                    function calculateBulkOrderRts() {
                        if (window.useCanvasStore) {
                            const store = window.useCanvasStore();
                            const totalRts = store.getTotalMaxRtsForBulkOrder;
                            
                            // 触发自定义事件，供其他组件监听
                            document.dispatchEvent(new CustomEvent('pw-bulk-order-rts-calculated', {
                                detail: { totalRts: totalRts }
                            }));
                            
                            return totalRts;
                        }
                        return 0;
                    }
                    
                    // 执行计算
                    calculateBulkOrderRts();
                    
                    // 获取当前视图的 base_layer 并应用 tint 滤镜
                    function applyColorTint() {
                        if (window.useCanvasStore && (typeof applyTintFilter === 'function' || typeof window.applyTintFilter === 'function')) {
                            const store = window.useCanvasStore();
                            const activeViewId = store.activeViewId;
                            
                            if (activeViewId && store.views) {
                                const currentView = store.views.find(v => v.id === activeViewId);
                                if (currentView && currentView.base_layer) {
                                    // 应用色调滤镜到 base_layer
                                    const tintFunction = typeof applyTintFilter === 'function' ? applyTintFilter : window.applyTintFilter;
                                    tintFunction(currentView.base_layer, color, 1);
                                    
                                    // 强制重新应用滤镜并渲染
                                    if (currentView.base_layer.applyFilters) {
                                        currentView.base_layer.applyFilters();
                                    }
                                    
                                    // 获取当前激活的画布并重新渲染
                                    if (window.CanvasManager) {
                                        const activeCanvas = window.CanvasManager.getActiveCanvas();
                                        if (activeCanvas) {
                                            // 强制重新渲染base_layer对象
                                            if (currentView.base_layer.canvas) {
                                                currentView.base_layer.canvas.renderAll();
                                            }
                                            // 强制整个画布重新渲染
                                            activeCanvas.renderAll();
                                            // 使用requestAnimationFrame确保渲染在下一帧完成
                                            requestAnimationFrame(() => {
                                                activeCanvas.renderAll();
                                            });
                                        }
                                    }
                                    
                                    
                                } else {
                                    console.warn('当前视图没有 base_layer 或视图不存在');
                                }
                            } else {
                                console.warn('没有激活的视图或 store 不可用');
                            }
                        } else {
                        }
                    }
                    
                    // 判断是否为第一个视图
                    function isFirstView() {
                        if (window.useCanvasStore) {
                            const store = window.useCanvasStore();
                            if (store.views && store.views.length > 0) {
                                return store.activeViewId === store.views[0].id;
                            }
                        }
                        return false;
                    }
                    
                    // 如果是第一个视图，使用全局方法；否则使用原逻辑
                    if (isFirstView()) {
                        if (typeof window.applyColorToAllViews === 'function') {
                            window.applyColorToAllViews(color);
                        } else {
                            applyColorTint();
                        }
                    } else {
                        // 原逻辑：应用到当前视图
                        if (typeof applyTintFilter === 'function' || typeof window.applyTintFilter === 'function') {
                            applyColorTint();
                        } else {
                            // 否则等待函数可用
                            const checkInterval = setInterval(() => {
                                if (typeof applyTintFilter === 'function' || typeof window.applyTintFilter === 'function') {
                                    clearInterval(checkInterval);
                                    applyColorTint();
                                }
                            }, 100);
                            
                            // 设置超时，避免无限等待
                            setTimeout(() => {
                                clearInterval(checkInterval);
                                console.warn('applyTintFilter function not available after timeout');
                            }, 5000);
                        }
                    }
                }
// ===== 新增：工具函数 =====
window.isFourGridView = window.isFourGridView || function(view) {
    return view && view.view_flow === '4-Grid Flow';
};

const isFourGridView = window.isFourGridView;

window.applyColorToView = function(view, color, tintFunction) {
    if (!view) {
        console.warn('无法应用颜色：视图数据无效');
        return;
    }

    if (isFourGridView(view)) {
        return;
    }

    if (!view.base_layer) {
        return;
    }

    const effectiveTint = tintFunction || (typeof applyTintFilter === 'function' ? applyTintFilter : window.applyTintFilter);
    if (typeof effectiveTint !== 'function') {
        return;
    }

    effectiveTint(view.base_layer, color, 1);

    if (view.base_layer.applyFilters) {
        view.base_layer.applyFilters();
    }

    const canvas = (view.base_layer.canvas) || (window.CanvasManager ? window.CanvasManager.getCanvas(view.id) : null);
    if (canvas) {
        if (view.base_layer.canvas && view.base_layer.canvas !== canvas) {
            view.base_layer.canvas.renderAll();
        }
        canvas.renderAll();
        requestAnimationFrame(() => {
            canvas.renderAll();
        });
    } else {
    }
};

// ===== 新增：全局方法 - 应用颜色到所有视图 =====
window.applyColorToAllViews = function(color) {
    if (!window.useCanvasStore) {
        return;
    }

    const store = window.useCanvasStore();
    if (!store.views || store.views.length === 0) {
        console.warn('没有视图数据');
        return;
    }

    const tintFunction = typeof applyTintFilter === 'function' ? applyTintFilter : window.applyTintFilter;
    if (typeof tintFunction !== 'function') {
        console.warn('applyTintFilter 函数不可用');
        return;
    }

    let hasFourGrid = false;

    store.views.forEach(view => {
        if (isFourGridView(view)) {
            hasFourGrid = true;
            return;
        }
        window.applyColorToView(view, color, tintFunction);
    });

    if (hasFourGrid) {
        window.currentColor = color;
    }

    if (typeof window.__pwcaUpdatePriceDisplay === 'function') {
        window.__pwcaUpdatePriceDisplay();
    }

    
};

// 新增：视图切换自动应用当前纯色到新视图（遇到四格视图跳过）
document.addEventListener('layerPanelViewSwitch', function(ev) {
    try {
        const viewId = ev && ev.detail ? ev.detail.viewId : null;
        const color = window.currentColor;
        if (!viewId) return;
        if (!color || color === '#000000') {
            // 没有显式颜色，不做同步
            return;
        }
        if (!window.useCanvasStore) return;
        const store = window.useCanvasStore();
        let attempts = 0;

        const tryApply = () => {
            const view = store.views ? store.views.find(v => v.id === viewId) : null;
            if (!view) return;

            // 四格视图跳过直接着色，依赖 window.currentColor
            if (typeof isFourGridView === 'function' && isFourGridView(view)) {
                return;
            }

            if (!view.base_layer) {
                // 等待 base_layer 准备好再应用色值
                attempts++;
                if (attempts < 30) {
                    setTimeout(tryApply, 100);
                } else {
                }
                return;
            }

            const tintFunction = typeof applyTintFilter === 'function' ? applyTintFilter : window.applyTintFilter;
            if (typeof tintFunction !== 'function') {
                console.warn('applyTintFilter 函数不可用，无法在视图切换时应用颜色');
                return;
            }

            window.applyColorToView(view, color, tintFunction);
        };

        // 有些视图切换后图层异步加载，延迟应用更稳妥
        requestAnimationFrame(tryApply);
    } catch (err) {
        console.warn('视图切换颜色同步时出现错误:', err);
    }
});

const getGradientCoords = (direction, width, height) => {
    switch (direction) {
        case 'to right':
            return { x1: 0, y1: 0, x2: width, y2: 0 };
        case 'to bottom':
            return { x1: 0, y1: 0, x2: 0, y2: height };
        case 'to bottom right':
            return { x1: 0, y1: 0, x2: width, y2: height };
        case 'to bottom left':
            return { x1: width, y1: 0, x2: 0, y2: height };
        default:
            return { x1: 0, y1: 0, x2: width, y2: 0 };
    }
};

window.applyGradientToView = function(view, startColor, endColor, direction) {
    if (!view) {
        return;
    }

    if (isFourGridView(view)) {
        return;
    }

    if (typeof fabric === 'undefined') {
        return;
    }

    const baseLayerObject = view.base_layer;
    if (!baseLayerObject) {
        return;
    }

    const baseCanvasId = `baseCanvas-${view.id}`;
    let baseCanvas = null;

    if (window.CanvasManager && typeof window.CanvasManager.getCanvas === 'function') {
        baseCanvas = window.CanvasManager.getCanvas(baseCanvasId) || window.CanvasManager.getCanvas(view.id);
    }

    if (!baseCanvas) {
        const baseCanvasElement = document.getElementById(baseCanvasId);
        if (baseCanvasElement && baseCanvasElement.__fabricCanvas) {
            baseCanvas = baseCanvasElement.__fabricCanvas;
        }
    }

    if (!baseCanvas && baseLayerObject.canvas) {
        baseCanvas = baseLayerObject.canvas;
    }

    if (!baseCanvas) {
        console.warn(`无法获取视图 ${view.name || view.id} 的 baseCanvas`);
        return;
    }

    const element = typeof baseLayerObject.getElement === 'function'
        ? baseLayerObject.getElement()
        : (baseLayerObject._originalElement || baseLayerObject._element || null);

    if (!element) {
        console.warn('无法获取Base图层的图像元素');
        return;
    }

    const fallbackWidth = typeof baseLayerObject.getScaledWidth === 'function'
        ? baseLayerObject.getScaledWidth()
        : baseLayerObject.width;
    const fallbackHeight = typeof baseLayerObject.getScaledHeight === 'function'
        ? baseLayerObject.getScaledHeight()
        : baseLayerObject.height;

    const imageWidth = element.width || element.naturalWidth || fallbackWidth;
    const imageHeight = element.height || element.naturalHeight || fallbackHeight;

    if (!imageWidth || !imageHeight) {
        console.warn('无法确定渐变覆盖层的尺寸');
        return;
    }

    const overlaysToRemove = [];
    if (typeof baseCanvas.getObjects === 'function') {
        baseCanvas.getObjects().forEach(obj => {
            if ((obj.id && obj.id.startsWith('gradient-rect-')) || (obj.name && obj.name === 'Base Gradient Overlay')) {
                overlaysToRemove.push(obj);
            }
        });
    }

    overlaysToRemove.forEach(obj => baseCanvas.remove(obj));

    const gradientCoords = getGradientCoords(direction, imageWidth, imageHeight);

    const gradient = new fabric.Gradient({
        type: 'linear',
        gradientUnits: 'pixels',
        coords: gradientCoords,
        colorStops: [
            { offset: 0, color: startColor },
            { offset: 1, color: endColor }
        ]
    });

    const overlayRect = new fabric.Rect({
        left: baseLayerObject.left,
        top: baseLayerObject.top,
        width: imageWidth,
        height: imageHeight,
        originX: baseLayerObject.originX,
        originY: baseLayerObject.originY,
        scaleX: baseLayerObject.scaleX,
        scaleY: baseLayerObject.scaleY,
        angle: baseLayerObject.angle,
        fill: gradient,
        selectable: false,
        evented: false,
        opacity: baseLayerObject.opacity,
        globalCompositeOperation: 'source-in',
        name: 'Base Gradient Overlay',
        id: `gradient-rect-${view.id}-${Date.now()}`
    });

    baseCanvas.add(overlayRect);
    if (typeof baseCanvas.sendToBack === 'function') {
        baseCanvas.sendToBack(baseLayerObject);
    }
    if (typeof baseCanvas.bringForward === 'function') {
        baseCanvas.bringForward(overlayRect);
    }

    const overlayLayerObject = typeof baseCanvas.getObjects === 'function'
        ? baseCanvas.getObjects().find(obj => obj.name === 'Overlay Layer')
        : null;
    if (overlayLayerObject && typeof baseCanvas.bringToFront === 'function') {
        baseCanvas.bringToFront(overlayLayerObject);
    }

    if (typeof baseCanvas.renderAll === 'function') {
        baseCanvas.renderAll();
    }

    
};

                // 监听 canvasStore 数据变化
                function waitForCanvasData() {
                    if (typeof window.useCanvasStore !== 'undefined') {
                        const store = window.useCanvasStore();
                        
                        // 如果数据已经加载，立即生成颜色样本
                        if (store.productData && store.productData.variants && store.productData.variants.data) {
                            generateColorSwatches();
                            return;
                        }
                        
                        // 监听数据变化
                        if (store.$subscribe) {
                            store.$subscribe((mutation, state) => {
                                if (state.productData && state.productData.variants && state.productData.variants.data) {
                                    generateColorSwatches();
                                }
                            });
                        }
                    }
                    
                    // 如果 store 还没有加载，使用默认颜色
                    setTimeout(() => {
                        if (typeof window.useCanvasStore === 'undefined') {
                            const container = document.getElementById('color-swatches-container');
                            if (container && container.children.length === 0) {
                                // generateDefaultColors(container);
                            }
                        }
                    }, 2000);
                }

                // 初始化
                waitForCanvasData();
            });
        </script>

        <div class="action-buttons">
            <button class="btn btn-custom">Gradient</button>
            <button class="btn btn-custom">Custom Colors</button>
        </div>
        
        <div class="color-status-display" id="colorStatusDisplay" style="margin-top: 10px; font-size: 14px; color: #666; min-height: 20px; display: none;">
            <!-- 颜色状态将在这里显示 -->
        </div>

        <?php include_once plugin_dir_path(__FILE__) . 'pwca-gradient-modal.php'; ?>

        <div id="custom-color-modal" style="display:none; position:fixed; left:0; top:0; width:100vw; height:100vh; background:rgba(0,0,0,0.3); z-index:9999; align-items:center; justify-content:center;">
            <div style="background:#fff; border-radius:8px; max-width:300px; width:90vw; padding:1rem; position:relative;">
                <button id="close-custom-color-modal" style="position:absolute; right:0.5rem; top:0.5rem; background:none; border:none; font-size:1.5rem; cursor:pointer;">&times;</button>
                <h3 style="margin-top:0;">选择自定义颜色</h3>
                <input type="color" id="customColorPicker" value="#000000" style="width:100%; height:100px; margin-bottom:1rem;" />
                <button id="applyCustomColor" class="btn btn-inquiry" style="width:100%;">应用颜色</button>
            </div>
        </div>
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                // 获取颜色状态显示元素
                const colorStatusDisplay = document.getElementById('colorStatusDisplay');
                
                // 清除所有颜色效果的函数
                function clearAllColorEffects() {
                    // 清除所有渐变色对象
                    if (window.clearAllGradientRects) {
                        window.clearAllGradientRects();
                    }
                    
                    // 重置全局颜色变量
                    window.currentColor = '#000000';
                    
                    // 清除所有颜色样本的选中状态
                    const colorSwatches = document.querySelectorAll('.color-swatch');
                    colorSwatches.forEach(s => s.classList.remove('selected'));
                    
                    // 清除所有色调滤镜并重置base_layer
                    if (window.useCanvasStore) {
                        const store = window.useCanvasStore();
                        if (store.views && store.views.length > 0) {
                            store.views.forEach(view => {
                                if (view.base_layer) {
                                    // 完全清除所有滤镜
                                    view.base_layer.filters = [];
                                    
                                    // 重置base_layer的原始图像
                                    if (view.base_layer._element && view.base_layer._originalElement) {
                                        // 恢复原始图像元素
                                        view.base_layer.setElement(view.base_layer._originalElement);
                                    } else if (view.base_layer._element) {
                                        // 如果没有原始元素备份，尝试重新加载图像
                                        const originalSrc = view.base_layer._element.src;
                                        if (originalSrc) {
                                            const img = new Image();
                                            img.crossOrigin = 'anonymous';
                                            img.onload = () => {
                                                view.base_layer.setElement(img);
                                                view.base_layer._originalElement = img; // 保存为原始元素备份
                                                
                                                // 应用滤镜更改
                                                view.base_layer.applyFilters();
                                                
                                                // 重新渲染画布
                                                if (window.CanvasManager) {
                                                    const canvas = window.CanvasManager.getCanvas(view.id);
                                                    if (canvas) {
                                                        canvas.renderAll();
                                                    }
                                                    
                                                    const baseCanvasId = `baseCanvas-${view.id}`;
                                                    const baseCanvas = window.CanvasManager.getCanvas(baseCanvasId) ||
                                                                      (document.getElementById(baseCanvasId) && document.getElementById(baseCanvasId).__fabricCanvas);
                                                    if (baseCanvas) {
                                                        baseCanvas.renderAll();
                                                    }
                                                }
                                            };
                                            img.src = originalSrc;
                                        }
                                    }
                                    
                                    // 应用滤镜更改
                                    view.base_layer.applyFilters();
                                    
                                    // 获取对应视图的画布并重新渲染
                                    if (window.CanvasManager) {
                                        const canvas = window.CanvasManager.getCanvas(view.id);
                                        if (canvas) {
                                            canvas.renderAll();
                                            
                                            // 如果是baseCanvas，也需要重新渲染
                                            const baseCanvasId = `baseCanvas-${view.id}`;
                                            const baseCanvas = window.CanvasManager.getCanvas(baseCanvasId) ||
                                                              (document.getElementById(baseCanvasId) && document.getElementById(baseCanvasId).__fabricCanvas);
                                            if (baseCanvas) {
                                                baseCanvas.renderAll();
                                            }
                                        }
                                    }
                                }
                            });
                        }
                    }
                    
                    // 隐藏颜色状态显示
                    if (colorStatusDisplay) {
                        colorStatusDisplay.style.display = 'none';
                    }
                }
                
                // 将清除函数暴露到全局，供链接使用
                window.clearAllColorEffects = clearAllColorEffects;

                // 新增：更新颜色状态UI并设置全局颜色
                window.updateColorStatusUI = function(color) {
                     // 更新全局颜色变量
                    window.currentColor = color;

                    if (!colorStatusDisplay) return;

                    colorStatusDisplay.innerHTML = `Selected: ${color}  <a href="#" id="clearColorLink" style="margin-left: 10px; color: #dc3545; text-decoration: none; font-size: 16px; font-weight: bold;">✕</a>  <a href="#" id="changeColorLink" style="margin-left: 10px; color: #007cba; text-decoration: none;">切换颜色</a>`;
                    colorStatusDisplay.style.display = 'block';

                    // 添加清除颜色链接的事件监听器
                    const clearColorLink = document.getElementById('clearColorLink');
                    if (clearColorLink) {
                        clearColorLink.addEventListener('click', function(e) {
                            e.preventDefault();
                            if (window.clearAllColorEffects) window.clearAllColorEffects();
                        });
                    }

                    // 添加切换颜色链接的事件监听器
                    const changeColorLink = document.getElementById('changeColorLink');
                    if (changeColorLink) {
                        changeColorLink.addEventListener('click', function(e) {
                            e.preventDefault();
                            const customColorModal = document.getElementById('custom-color-modal');
                            if (customColorModal) {
                                customColorModal.style.display = 'flex';
                            }
                        });
                    }
                };

                // 新增：清除显式颜色选择状态（影响 getExplicitSelectedColor）
                window.clearExplicitColorSelection = function() {
                    try {
                        const swatches = document.querySelectorAll('.color-swatch');
                        swatches.forEach(s => s.classList.remove('selected'));
                        const customSwatch = document.querySelector('.color-swatch[data-custom-color="true"]');
                        if (customSwatch) {
                            customSwatch.remove();
                        }
                        const picker = document.getElementById('customColorPicker');
                        if (picker) {
                            picker.value = '#000000';
                        }
                        window.currentColor = '#000000';
                    } catch (e) {
                        console.warn('清除显式颜色选择状态时发生错误:', e);
                    }
                };
                
                // 获取第二个按钮（自定义颜色）
                const customColorBtn = document.querySelector('.action-buttons .btn:nth-child(2)');
                const customColorModal = document.getElementById('custom-color-modal');
                const closeCustomColorModal = document.getElementById('close-custom-color-modal');
                const applyCustomColorBtn = document.getElementById('applyCustomColor');
                const customColorPicker = document.getElementById('customColorPicker');

                // 保存上次选择的渐变色
                let lastGradientColors = {
                    color1: '#ff0000',
                    color2: '#ffff00',
                    direction: 'to right'
                };

                if (customColorBtn && customColorModal && closeCustomColorModal && applyCustomColorBtn && customColorPicker) {
                    customColorBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        customColorModal.style.display = 'flex';
                    });
                    closeCustomColorModal.addEventListener('click', function() {
                        customColorModal.style.display = 'none';
                    });
                    customColorModal.addEventListener('click', function(e) {
                        if (e.target === customColorModal) {
                            customColorModal.style.display = 'none';
                        }
                    });
                    applyCustomColorBtn.addEventListener('click', function() {
                        const color = customColorPicker.value;
                        
                        // 先清理显式选择状态，避免旧状态影响 getExplicitSelectedColor
                        if (typeof window.clearExplicitColorSelection === 'function') {
                            window.clearExplicitColorSelection();
                        }
                        
                        // 更新全局颜色变量，确保 getExplicitSelectedColor 能检测到
                        window.currentColor = color;
                        
                        
                        // 先清除所有渐变色对象
                        if (window.clearAllGradientRects) {
                            window.clearAllGradientRects();
                        }
                        
                        // 应用自定义颜色到当前视图的 base_layer
                        function applyCustomColorToBaseLayer() {
                            if (window.useCanvasStore && (typeof applyTintFilter === 'function' || typeof window.applyTintFilter === 'function')) {
                                const store = window.useCanvasStore();
                                const activeViewId = store.activeViewId;
                                
                                if (activeViewId && store.views) {
                                    const currentView = store.views.find(v => v.id === activeViewId);
                                    if (currentView && currentView.base_layer) {
                                        // 若为四格视图，跳过对 base_layer 的直接上色，仅通过 window.currentColor 同步
                                        if (typeof isFourGridView === 'function' && isFourGridView(currentView)) {
                                            if (typeof window.applyColorToAllViews === 'function') {
                                                window.applyColorToAllViews(color);
                                            }
                                            return;
                                        }

                                        // 保存原始图像元素（如果尚未保存）
                                        if (!currentView.base_layer._originalElement && currentView.base_layer._element) {
                                            const originalImg = new Image();
                                            originalImg.crossOrigin = 'anonymous';
                                            originalImg.src = currentView.base_layer._element.src;
                                            originalImg.onload = () => {
                                                currentView.base_layer._originalElement = originalImg;
                                            };
                                        }
                                        
                                        // 应用色调滤镜到 base_layer
                                        const tintFunction = typeof applyTintFilter === 'function' ? applyTintFilter : window.applyTintFilter;
                                        tintFunction(currentView.base_layer, color, 1);
                                        
                                        // 强制重新应用滤镜并渲染
                                        if (currentView.base_layer.applyFilters) {
                                            currentView.base_layer.applyFilters();
                                        }
                                        
                                        // 获取当前激活的画布并重新渲染
                                        if (window.CanvasManager) {
                                            const activeCanvas = window.CanvasManager.getActiveCanvas();
                                            if (activeCanvas) {
                                                // 强制重新渲染base_layer对象
                                                if (currentView.base_layer.canvas) {
                                                    currentView.base_layer.canvas.renderAll();
                                                }
                                                // 强制整个画布重新渲染
                                                activeCanvas.renderAll();
                                                // 使用requestAnimationFrame确保渲染在下一帧完成
                                                requestAnimationFrame(() => {
                                                    activeCanvas.renderAll();
                                                });
                                            }
                                        }

                                        

                                        // 无条件同步其他视图（四格视图通过 window.currentColor）
                                        if (typeof window.applyColorToAllViews === 'function') {
                                            window.applyColorToAllViews(color);
                                        } else {
                                        }
                                    } else {
                                    }
                                } else {
                                }
                            } else {
                            }
                        }
                        
                        // 如果 applyTintFilter 函数已经可用，立即执行
                        if (typeof applyTintFilter === 'function' || typeof window.applyTintFilter === 'function') {
                            applyCustomColorToBaseLayer();
                        } else {
                            // 否则等待函数可用
                            const checkInterval = setInterval(() => {
                                if (typeof applyTintFilter === 'function' || typeof window.applyTintFilter === 'function') {
                                    clearInterval(checkInterval);
                                    applyCustomColorToBaseLayer();
                                }
                            }, 100);
                            
                            // 设置超时，避免无限等待
                            setTimeout(() => {
                                clearInterval(checkInterval);
                            }, 5000);
                        }
                        
                        // 更新颜色状态显示
                        if (colorStatusDisplay) {
                            colorStatusDisplay.innerHTML = `Selected: ${color}  <a href=\"#\" id=\"clearColorLink\" style=\"margin-left: 10px; color: #dc3545; text-decoration: none; font-size: 16px; font-weight: bold;\">✕</a>  <a href=\"#\" id=\"changeColorLink\" style=\"margin-left: 10px; color: #007cba; text-decoration: none;\">切换颜色</a>`;
                            colorStatusDisplay.style.display = 'block';
                            
                            // 添加清除颜色链接的事件监听器
                            const clearColorLink = document.getElementById('clearColorLink');
                            if (clearColorLink) {
                                clearColorLink.addEventListener('click', function(e) {
                                    e.preventDefault();
                                    clearAllColorEffects();
                                });
                            }
                            
                            // 添加切换颜色链接的事件监听器
                            const changeColorLink = document.getElementById('changeColorLink');
                            if (changeColorLink) {
                                changeColorLink.addEventListener('click', function(e) {
                                    e.preventDefault();
                                    const customColorModal = document.getElementById('custom-color-modal');
                                    if (customColorModal) {
                                        customColorModal.style.display = 'flex';
                                    }
                                });
                            }
                        }
                        
                        // 不再创建虚拟自定义颜色样本，保持显式选择状态清空，依赖 window.currentColor
                        customColorModal.style.display = 'none';
                    });
                }
                
                // 重写渐变色模态框的显示函数，以恢复上次选择的颜色
                if (typeof window.showGradientModal === 'function') {
                    const originalShowGradientModal = window.showGradientModal;
                    window.showGradientModal = function() {
                        // 调用原始函数
                        originalShowGradientModal();
                        
                        // 恢复上次选择的颜色
                        setTimeout(() => {
                            // 恢复颜色1
                            const color1Option = document.querySelector(`.gradient-colors-container > div:first-child .color-option[data-color="${lastGradientColors.color1}"]`);
                            if (color1Option) {
                                // 清除其他选中状态
                                const color1Options = document.querySelectorAll('.gradient-colors-container > div:first-child .color-option');
                                color1Options.forEach(opt => opt.classList.remove('selected'));
                                color1Option.classList.add('selected');
                                document.getElementById('gradientColor1').value = lastGradientColors.color1;
                            }
                            
                            // 恢复颜色2
                            const color2Option = document.querySelector(`.gradient-colors-container > div:last-child .color-option[data-color="${lastGradientColors.color2}"]`);
                            if (color2Option) {
                                // 清除其他选中状态
                                const color2Options = document.querySelectorAll('.gradient-colors-container > div:last-child .color-option');
                                color2Options.forEach(opt => opt.classList.remove('selected'));
                                color2Option.classList.add('selected');
                                document.getElementById('gradientColor2').value = lastGradientColors.color2;
                            }
                            
                            // 恢复方向
                            const gradientDirection = document.getElementById('gradientDirection');
                            if (gradientDirection) {
                                gradientDirection.value = lastGradientColors.direction;
                            }
                        }, 100);
                    };
                }
                
                // 重写应用渐变色按钮的事件，保存选择的颜色并更新状态显示
                const applyGradientColorBtn = document.getElementById('applyGradientColor');
                if (applyGradientColorBtn) {
                    // 移除原有的事件监听器
                    const newApplyGradientBtn = applyGradientColorBtn.cloneNode(true);
                    applyGradientColorBtn.parentNode.replaceChild(newApplyGradientBtn, applyGradientColorBtn);
                    
                    // 添加新的事件监听器
                    newApplyGradientBtn.addEventListener('click', function() {
                        const color1 = document.getElementById('gradientColor1').value;
                        const color2 = document.getElementById('gradientColor2').value;
                        const direction = document.getElementById('gradientDirection').value;
                        
                        // 保存当前选择的渐变色
                        lastGradientColors = {
                            color1: color1,
                            color2: color2,
                            direction: direction
                        };
                        
                        // 更新产品页面的Pinia状态
                        if (typeof window.useProductStore !== 'undefined') {
                            try {
                                const productStore = window.useProductStore();
                                if (productStore && typeof productStore.setGradientColorApplied === 'function') {
                                    productStore.setGradientColorApplied(true);
                                }
                            } catch (error) {
                                console.warn('无法更新产品页面渐变色状态:', error);
                            }
                        }
                        
                        // 如果在产品页面，先切换到Canvas模式显示画布
                        if (typeof window.ProductImageCanvas !== 'undefined' && window.ProductImageCanvas.switchToCanvas) {
                            // 使用第一个颜色作为背景色来初始化画布
                            window.ProductImageCanvas.switchToCanvas(color1);
                        }
                        
                        // 应用渐变色到Base图层（使用剪切方案）
                        function applyGradientToBaseLayer() {
                            if (window.useCanvasStore) {
                                const store = window.useCanvasStore();
                                const activeViewId = store.activeViewId;

                                if (activeViewId && store.views) {
                                    const currentView = store.views.find(v => v.id === activeViewId);
                                    if (currentView && currentView.base_layer) {
                                        if (window.clearAllGradientRects) {
                                            window.clearAllGradientRects();
                                        }

                                        if (typeof window.applyGradientToView === 'function') {
                                            if (!isFourGridView(currentView)) {
                                                window.applyGradientToView(currentView, color1, color2, direction);
                                            } else {
                                            }

                                            const isMainView = store.views.length > 0 && store.views[0].id === activeViewId;
                                            if (isMainView) {
                                                store.views.forEach(view => {
                                                    if (view.id !== currentView.id) {
                                                        if (isFourGridView(view)) {
                                                            return;
                                                        }
                                                        window.applyGradientToView(view, color1, color2, direction);
                                                    }
                                                });
                                            }
                                        } else {
                                            console.warn('applyGradientToView 函数不可用');
                                        }
                                    } else {
                                        console.warn('当前视图没有 base_layer 或视图不存在');
                                    }
                                } else {
                                    console.warn('没有激活的视图或 store 不可用');
                                }
                            } else if (typeof window.ProductImageCanvas !== 'undefined' && window.CanvasManager) {
                                // 产品页面环境：使用ProductImageCanvas的画布
                                
                                const productCanvas = window.CanvasManager.getCanvas('product-view');
                                if (productCanvas) {
                                    // 查找Base图层对象
                                    const baseLayerObject = productCanvas.getObjects().find(obj =>
                                        obj.name === 'Base Layer' || obj.type === 'image'
                                    );
                                    
                                    if (baseLayerObject) {
                                        // 先清除旧的渐变覆盖层
                                        const existingOverlay = productCanvas.getObjects().find(obj => obj.name === 'Base Gradient Overlay');
                                        if (existingOverlay) {
                                            productCanvas.remove(existingOverlay);
                                        }
                                        
                                        // 获取Base图层的图像元素
                                        const imageElement = baseLayerObject.getElement();
                                        if (imageElement) {
                                            const imageWidth = imageElement.width || imageElement.naturalWidth;
                                            const imageHeight = imageElement.height || imageElement.naturalHeight;
                                            
                                            let gradientCoords;
                                            
                                            // 根据方向设置渐变坐标
                                            switch (direction) {
                                                case 'to right':
                                                    gradientCoords = { x1: 0, y1: 0, x2: imageWidth, y2: 0 };
                                                    break;
                                                case 'to bottom':
                                                    gradientCoords = { x1: 0, y1: 0, x2: 0, y2: imageHeight };
                                                    break;
                                                case 'to bottom right':
                                                    gradientCoords = { x1: 0, y1: 0, x2: imageWidth, y2: imageHeight };
                                                    break;
                                                case 'to bottom left':
                                                    gradientCoords = { x1: imageWidth, y1: 0, x2: 0, y2: imageHeight };
                                                    break;
                                                default:
                                                    gradientCoords = { x1: 0, y1: 0, x2: imageWidth, y2: 0 };
                                            }
                                            
                                            const gradient = new fabric.Gradient({
                                                type: 'linear',
                                                gradientUnits: 'pixels',
                                                coords: gradientCoords,
                                                colorStops: [
                                                    { offset: 0, color: color1 },
                                                    { offset: 1, color: color2 }
                                                ]
                                            });
                                            
                                            // 创建渐变覆盖层
                                            const overlayRect = new fabric.Rect({
                                                left: baseLayerObject.left,
                                                top: baseLayerObject.top,
                                                width: imageWidth,
                                                height: imageHeight,
                                                originX: baseLayerObject.originX,
                                                originY: baseLayerObject.originY,
                                                scaleX: baseLayerObject.scaleX,
                                                scaleY: baseLayerObject.scaleY,
                                                angle: baseLayerObject.angle,
                                                fill: gradient,
                                                selectable: false,
                                                evented: false,
                                                opacity: baseLayerObject.opacity,
                                                globalCompositeOperation: 'source-in',
                                                name: 'Base Gradient Overlay',
                                                id: 'gradient-rect-' + Date.now()
                                            });
                                            
                                            // 添加渐变覆盖层
                                            productCanvas.add(overlayRect);
                                            
                                            // 确保图层顺序正确
                                            productCanvas.sendToBack(baseLayerObject);
                                            productCanvas.bringForward(overlayRect);
                                            
                                            // 如果有Overlay Layer，确保它在最上层
                                            const overlayLayerObject = productCanvas.getObjects().find(obj => obj.name === 'Overlay Layer');
                                            if (overlayLayerObject) {
                                                productCanvas.bringToFront(overlayLayerObject);
                                            }
                                            
                                            productCanvas.renderAll();
                                        } else {
                                            console.warn('无法获取Base图层的图像元素');
                                        }
                                    } else {
                                        console.warn('在产品画布中未找到Base图层');
                                    }
                                } else {
                                    console.warn('无法获取产品画布实例');
                                }
                            } else {
                                console.warn('useCanvasStore 和 ProductImageCanvas 都不可用');
                            }
                        }
                        
                        applyGradientToBaseLayer();
                        
                        // 更新颜色状态显示
                        if (colorStatusDisplay) {
                            colorStatusDisplay.innerHTML = `渐变色: ${color1} <a href=\"#\" id=\"clearColorLink\" style=\"margin-left: 10px; color: #dc3545; text-decoration: none; font-size: 16px; font-weight: bold;\">✕</a> <a href="#" id=\"switchColorLink\" style="margin-left: 10px; color: #007cba; text-decoration: none;">切换颜色</a>`;
                            colorStatusDisplay.style.display = 'block';
                            
                            // 添加清除颜色链接的事件监听器
                            const clearColorLink = document.getElementById('clearColorLink');
                            if (clearColorLink) {
                                clearColorLink.addEventListener('click', function(e) {
                                    e.preventDefault();
                                    clearAllColorEffects();
                                });
                            }
                            
                            // 添加切换颜色链接的事件监听器
                            const switchColorLink = document.getElementById('switchColorLink');
                            if (switchColorLink) {
                                switchColorLink.addEventListener('click', function(e) {
                                    e.preventDefault();
                                    // 调用渐变色弹窗显示函数，与Gradient按钮效果一样
                                    if (typeof window.showGradientModal === 'function') {
                                        window.showGradientModal();
                                    }
                                });
                            }
                        }
                        
                        // 更新颜色样本中的选中状态
                        const colorSwatches = document.querySelectorAll('.color-swatch');
                        colorSwatches.forEach(s => s.classList.remove('selected'));
                        window.hideGradientModal();
                    });
                }
            });
        </script>

        
        
        <script>
        // ===== 新增：样品订单复选框事件监听 =====
        document.addEventListener('DOMContentLoaded', function() {
            const sampleCheckbox = document.querySelector('.sample-check input#sample');
            if (sampleCheckbox) {
                sampleCheckbox.addEventListener('change', function() {
                    if (this.checked) {
                        // 当勾选样品订单时，计算各视图 rts_for_sample_order 最大值相加
                        calculateSampleOrderRts();
                    } else {
                        // 可以在这里添加取消勾选时的逻辑
                    }
                });
            }
        });
        
        // ===== 新增：计算各视图 rts_for_sample_order 最大值相加 =====
        function calculateSampleOrderRts() {
            if (window.useCanvasStore) {
                const store = window.useCanvasStore();
                const totalRts = store.getTotalMaxRtsForSampleOrder;
                
                // 触发自定义事件，供其他组件监听
                document.dispatchEvent(new CustomEvent('pw-sample-order-rts-calculated', {
                    detail: { totalRts: totalRts }
                }));
                
                return totalRts;
            }
            return 0;
        }
        </script>
    </div>

    <?php include __DIR__ . '/canvas-operation-panel-tab-layers.php'; ?>

    <?php include __DIR__ . '/canvas-operation-panel-tab-image.php'; ?>

    <?php include __DIR__ . '/canvas-operation-panel-tab-text.php'; ?>

    <?php include __DIR__ . '/canvas-operation-panel-tab-design.php'; ?>

    <?php include __DIR__ . '/canvas-operation-panel-footer.php'; ?>
</div>

<?php include __DIR__ . '/canvas-operation-panel-scripts.php'; ?>
<?php include __DIR__ . '/canvas-operation-panel-inquiry-modal.php'; ?>