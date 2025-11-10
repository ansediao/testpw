<?php
// 获取插件目录的URL
$plugin_url = plugin_dir_url(__FILE__);
?>

<!-- 左侧选项卡导航 -->
<div class="tabs-nav">
    <div id="tab-pinming" class="tab active">
        <img src="<?php echo MY_PLUGIN_URL  . 'assets/images/icons/product.svg'; ?>"
            alt="Product ICON">
        <div class="tab_title">Product</div>
    </div>
    <div id="tab-tuan" class="tab">
        <img src="<?php echo MY_PLUGIN_URL  . 'assets/images/icons/layers.svg'; ?>"
            alt="Layers ICON">
        <div class="tab_title">Layers</div>
    </div>
    <div id="tab-pianquan" class="tab">
        <img src="<?php echo MY_PLUGIN_URL  . 'assets/images/icons/image.svg'; ?>"
            alt="Image ICON">
        <div class="tab_title">Image</div>
    </div>
    <div id="tab-wenzi" class="tab">
        <img src="<?php echo MY_PLUGIN_URL  . 'assets/images/icons/text.svg'; ?>"
            alt="Text ICON">
        <div class="tab_title">Text</div>
    </div>
    <div id="tab-sheji" class="tab">
        <img src="<?php echo MY_PLUGIN_URL  . 'assets/images/icons/design.svg'; ?>"
            alt="Designs ICON">
        <div class="tab_title">Designs</div>
    </div>
</div>

<script>
// Inquiry Modal JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // 初始化 MicroModal
    if (typeof MicroModal !== 'undefined') {
        MicroModal.init({
            disableScroll: true,
            disableFocus: false,
            awaitCloseAnimation: false,
            debugMode: false
        });
    }
    
    // Inquiry 按钮点击事件
    const inquiryBtn = document.getElementById('pwca-inquiry-btn');
    if (inquiryBtn) {
        inquiryBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 获取当前产品ID
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('product_id');
            
            if (!productId) {
                console.error('Product ID not found in URL');
                return;
            }
            
            // 打开弹窗
            if (typeof MicroModal !== 'undefined') {
                MicroModal.show('pwca-inquiry-modal');
            } else {
                console.error('MicroModal not loaded');
            }
        });
    }
    
    // 表单提交处理
    const inquiryForm = document.getElementById('pwca-inquiry-form');
    if (inquiryForm) {
        inquiryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 清除之前的消息
            const messageDiv = document.getElementById('pwca-form-message');
            messageDiv.innerHTML = '';
            messageDiv.className = 'pwca-form-message';
            
            // 获取表单数据
            const formData = new FormData(inquiryForm);
            
            // 获取产品ID
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('product_id');
            
            if (!productId) {
                showMessage('Product ID not found', 'error');
                return;
            }
            
            // 构建请求数据对象
            const requestData = {
                product_id: productId,
                inquiry_first_name: formData.get('inquiry_first_name'),
                inquiry_last_name: formData.get('inquiry_last_name'),
                inquiry_email: formData.get('inquiry_email'),
                inquiry_phone: formData.get('inquiry_phone'),
                inquiry_message: formData.get('inquiry_message')
            };
            
            // 禁用提交按钮
            const submitBtn = document.querySelector('.pwca-inquiry-modal__btn--submit');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            
            // 发送REST API请求
            fetch('/wp-json/pwca/v1/inquiry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showMessage(data.message || 'Your inquiry has been sent successfully!', 'success');
                    inquiryForm.reset();
                    
                    // 延迟关闭弹窗
                    setTimeout(() => {
                        if (typeof MicroModal !== 'undefined') {
                            MicroModal.close('pwca-inquiry-modal');
                        }
                    }, 2000);
                } else {
                    showMessage(data.message || 'An error occurred. Please try again.', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('Network error. Please try again.', 'error');
            })
            .finally(() => {
                // 恢复提交按钮
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            });
        });
    }
    
    // 显示消息函数
    function showMessage(message, type) {
        const messageDiv = document.getElementById('pwca-form-message');
        messageDiv.innerHTML = message;
        messageDiv.className = `pwca-form-message pwca-form-message--${type}`;
    }
    
    // 表单验证
    function validateForm() {
        const requiredFields = inquiryForm.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('pwca-form-input--error');
                isValid = false;
            } else {
                field.classList.remove('pwca-form-input--error');
            }
        });
        
        // 验证邮箱格式
        const emailField = document.getElementById('inquiry_email');
        if (emailField.value && !isValidEmail(emailField.value)) {
            emailField.classList.add('pwca-form-input--error');
            isValid = false;
        }
        
        return isValid;
    }
    
    // 邮箱格式验证
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // 实时验证
    const formInputs = inquiryForm.querySelectorAll('.pwca-form-input, .pwca-form-textarea');
    formInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.hasAttribute('required') && !this.value.trim()) {
                this.classList.add('pwca-form-input--error');
            } else {
                this.classList.remove('pwca-form-input--error');
            }
            
            // 特殊处理邮箱验证
            if (this.type === 'email' && this.value && !isValidEmail(this.value)) {
                this.classList.add('pwca-form-input--error');
            }
        });
        
        input.addEventListener('input', function() {
            this.classList.remove('pwca-form-input--error');
        });
    });
});
</script>

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
                    console.log('颜色样本点击，更新 window.currentColor:', color);
                    
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
                                            
                                            console.log(`设计页面颜色选择：已更新 selectedVariant 到 Product Store:`, completeVariantData);
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
                                            
                                            console.log(`设计页面颜色选择：已创建并更新基本 selectedVariant:`, basicVariant);
                                        } catch (error) {
                                            console.warn('创建基本 selectedVariant 失败:', error);
                                        }
                                    }
                                    
                                    console.log(`完整颜色数据已存储到视图 ${activeViewId}:`, colorData);
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
                            console.log(`颜色选择后，各视图 rts_for_bulk_order 最大值相加: ${totalRts}`);
                            
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
                                    
                                    console.log(`已将颜色 ${color} 应用到当前视图的 base_layer`);
                                } else {
                                    console.warn('当前视图没有 base_layer 或视图不存在');
                                }
                            } else {
                                console.warn('没有激活的视图或 store 不可用');
                            }
                        } else {
                            console.warn('applyTintFilter 函数或 useCanvasStore 不可用');
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
                            console.warn('全局方法 applyColorToAllViews 不可用，使用原逻辑');
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
        console.log(`跳过四格视图 ${view.name || view.id} 的纯色应用`);
        return;
    }

    if (!view.base_layer) {
        console.warn(`视图 ${view.name || view.id} 没有 base_layer`);
        return;
    }

    const effectiveTint = tintFunction || (typeof applyTintFilter === 'function' ? applyTintFilter : window.applyTintFilter);
    if (typeof effectiveTint !== 'function') {
        console.warn('applyTintFilter 函数不可用');
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
        console.log(`已将颜色 ${color} 应用到视图 ${view.name || view.id}`);
    } else {
        console.warn(`视图 ${view.name || view.id} 的 canvas 未找到`);
    }
};

// ===== 新增：全局方法 - 应用颜色到所有视图 =====
window.applyColorToAllViews = function(color) {
    if (!window.useCanvasStore) {
        console.warn('useCanvasStore 不可用');
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
        console.log(`检测到四格视图，已将 window.currentColor 同步为 ${color}`);
    }

    if (typeof window.__pwcaUpdatePriceDisplay === 'function') {
        window.__pwcaUpdatePriceDisplay();
    }

    console.log(`全局颜色 ${color} 已应用到所有 ${store.views.length} 个视图（四格视图通过 window.currentColor）`);
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
                console.log(`视图 ${view.name || view.id} 为四格视图，切换时跳过直接着色`);
                return;
            }

            if (!view.base_layer) {
                // 等待 base_layer 准备好再应用色值
                attempts++;
                if (attempts < 30) {
                    setTimeout(tryApply, 100);
                } else {
                    console.warn(`视图 ${view.name || view.id} 的 base_layer 未就绪，无法在切换时应用颜色`);
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
        console.warn('无法应用渐变：视图数据无效');
        return;
    }

    if (isFourGridView(view)) {
        console.log(`跳过四格视图 ${view.name || view.id} 的渐变应用`);
        return;
    }

    if (typeof fabric === 'undefined') {
        console.warn('fabric 未加载，无法应用渐变');
        return;
    }

    const baseLayerObject = view.base_layer;
    if (!baseLayerObject) {
        console.warn(`视图 ${view.name || view.id} 没有 base_layer`);
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

    console.log(`已为视图 ${view.name || view.id} 应用渐变色: ${startColor} 到 ${endColor}, 方向: ${direction}`);
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
                    console.log('已重置 window.currentColor 为默认值:', window.currentColor);
                    
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
                    
                    console.log('已清除所有颜色效果并重置画布');
                }
                
                // 将清除函数暴露到全局，供链接使用
                window.clearAllColorEffects = clearAllColorEffects;

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
                        console.log('已清除显式颜色选择状态，重置 window.currentColor 与选择样本');
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
                        console.log('自定义颜色已应用，更新 window.currentColor:', color);
                        
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
                                            console.log(`当前视图为四格视图，仅通过 window.currentColor 同步颜色 ${color}`);
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
                                                console.log('已保存原始图像元素用于重置');
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

                                        console.log(`已将颜色 ${color} 应用到当前视图的 base_layer`);

                                        // 无条件同步其他视图（四格视图通过 window.currentColor）
                                        if (typeof window.applyColorToAllViews === 'function') {
                                            window.applyColorToAllViews(color);
                                        } else {
                                            console.warn('applyColorToAllViews 函数不可用，无法同步其他视图的纯色');
                                        }
                                    } else {
                                        console.warn('当前视图没有 base_layer 或视图不存在');
                                    }
                                } else {
                                    console.warn('没有激活的视图或 store 不可用');
                                }
                            } else {
                                console.warn('applyTintFilter 函数或 useCanvasStore 不可用');
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
                                console.warn('applyTintFilter function not available after timeout');
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
                                    console.log('已更新产品页面渐变色应用状态为 true');
                                }
                            } catch (error) {
                                console.warn('无法更新产品页面渐变色状态:', error);
                            }
                        }
                        
                        // 如果在产品页面，先切换到Canvas模式显示画布
                        if (typeof window.ProductImageCanvas !== 'undefined' && window.ProductImageCanvas.switchToCanvas) {
                            // 使用第一个颜色作为背景色来初始化画布
                            window.ProductImageCanvas.switchToCanvas(color1);
                            console.log('已切换到Canvas模式，背景色:', color1);
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
                                                console.log(`跳过四格视图 ${currentView.name || currentView.id} 的渐变应用`);
                                            }

                                            const isMainView = store.views.length > 0 && store.views[0].id === activeViewId;
                                            if (isMainView) {
                                                store.views.forEach(view => {
                                                    if (view.id !== currentView.id) {
                                                        if (isFourGridView(view)) {
                                                            console.log(`跳过四格视图 ${view.name || view.id} 的渐变同步`);
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
                                console.log('在产品页面环境中应用渐变色');
                                
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
                                            
                                            console.log(`产品页面已应用渐变色: ${color1} 到 ${color2}, 方向: ${direction}`);
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
                        console.log('样品订单复选框已取消勾选');
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
                console.log(`样品订单勾选后，各视图 rts_for_sample_order 最大值相加: ${totalRts}`);
                
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

    <!-- 图层 -->
    <div id="content-tuan" class="content-pane">
        <div id="layers-box" class="layers-box">

        </div>
        <!-- <div class="layers-panel">
            <div class="layers-header">
                <span class="layer-column layer-visibility">显示</span>
                <span class="layer-column layer-lock">锁定</span>
                <span class="layer-column layer-name">名称</span>
            </div>
            <div id="layers-container" class="layers-container">
                
            </div>
        </div> -->
    </div>

    <!-- 图片 -->
    <div id="content-pianquan" class="content-pane">
        <div id="img_origin_controls">
            <div id="dropZone" style="border: 2px dashed #ccc; padding: 20px; text-align: center; margin-bottom: 10px;">
                Drag and drop your image here or click to upload
            </div>
            <input type="file" id="imageInput" accept="image/*" style="display: none;" />
            <script>
                // 拖放事件处理
                const dropZone = document.getElementById('dropZone');
                dropZone.addEventListener('dragover', (event) => {
                    event.preventDefault();
                    dropZone.style.backgroundColor = '#f0f0f0';
                });
                dropZone.addEventListener('dragleave', () => {
                    dropZone.style.backgroundColor = '#fff';
                });
                dropZone.addEventListener('drop', (event) => {
                    event.preventDefault();
                    dropZone.style.backgroundColor = '#fff';
                    const files = event.dataTransfer.files;
                    if (files.length > 0) {
                        const file = files[0];
                        if (file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = function(e) {
                                const imgElement = new Image();
                                imgElement.src = e.target.result;
                                imgElement.onload = function() {
                                    addImageToCanvas(imgElement, file.name);
                                };
                            };
                            reader.readAsDataURL(file);
                        } else {
                            alert('请上传有效的图片文件。');
                        }
                    }
                });
                // 添加图片到画布的函数
                function addImageToCanvas(imgElement, fileName = '') {
                    // 获取当前激活的画布
                    const activeCanvas = getActiveCanvas();
                    if (!activeCanvas) {
                        console.warn('No active canvas found');
                        return;
                    }

                    // 计算宽高比
                    const aspectRatio = imgElement.width / imgElement.height;

                    // 设定目标宽度为200px
                    const targetWidth = 200;
                    // 根据宽高比计算目标高度
                    const targetHeight = targetWidth / aspectRatio;

                    // 生成唯一的图层ID
                    const layerId = 'layer_' + Date.now();

                    // 保存现有图片对象的引用，防止它们的属性被修改
                    const existingImageObjects = activeCanvas.getObjects().filter(obj => obj.type === 'image');
                    const existingImageSources = existingImageObjects.map(obj => ({
                        id: obj.id,
                        src: obj._element ? obj._element.src : (obj.src || ''),
                        element: obj._element,
                        originalElement: obj._originalElement
                    }));

                    const fabricImage = new fabric.Image(imgElement, {
                        left: activeCanvas.width / 2,
                        top: activeCanvas.height / 2,
                        scaleX: targetWidth / imgElement.width,
                        scaleY: targetHeight / imgElement.height,
                        originX: 'center',
                        originY: 'center',
                        id: layerId,
                        // ===== 核心修复：添加用户操作标记 =====
                        userInitiated: true,  // 标记为用户操作
                        fromButton: true,     // 标记来源为按钮操作
                        fromToolbar: true     // 标记来源为工具栏
                    });

                    // 检查画布上是否已存在相同来源的图片
                    let imageExists = false;
                    existingImageSources.forEach(imgInfo => {
                        if (imgInfo.src === imgElement.src) {
                            imageExists = true;
                        }
                    });

                    if (!imageExists) {
                        activeCanvas.add(fabricImage);
                        activeCanvas.setActiveObject(fabricImage);
                        
                        // 确保现有图片对象的属性不被修改
                        existingImageObjects.forEach((obj, index) => {
                            const originalInfo = existingImageSources[index];
                            if (originalInfo.element && !obj._element) {
                                obj._element = originalInfo.element;
                            }
                            if (originalInfo.originalElement && !obj._originalElement) {
                                obj._originalElement = originalInfo.originalElement;
                            }
                            if (originalInfo.src && !obj.src) {
                                obj.src = originalInfo.src;
                            }
                        });
                        
                        activeCanvas.renderAll();

                        // 不再强制更新全局canvas引用，让CanvasManager管理画布实例
                        // 这样可以确保每个视图的画布独立工作

                        // 延迟再次渲染以确保显示
                         setTimeout(() => {
                             // 再次确保现有图片对象的属性完整
                             existingImageObjects.forEach((obj, index) => {
                                 const originalInfo = existingImageSources[index];
                                 if (originalInfo.element && !obj._element) {
                                     obj._element = originalInfo.element;
                                 }
                                 if (originalInfo.src && (!obj.src || obj.src === '')) {
                                     obj.src = originalInfo.src;
                                 }
                             });
                             
                             activeCanvas.renderAll();
                             
                             // 强制刷新当前视图显示
                             const store = window.useCanvasStore && window.useCanvasStore();
                             if (store && store.activeViewId) {
                                 const viewContainer = document.getElementById(`view-container-${store.activeViewId}`);
                                 if (viewContainer) {
                                     // 隐藏所有视图容器
                                     document.querySelectorAll('.view-container').forEach(container => {
                                         container.style.display = 'none';
                                     });
                                     // 重新显示当前视图容器
                                     viewContainer.style.display = 'block';
                                 }
                             }
                             
                             if (typeof window.updatePreviewCanvas === 'function') {
                                 window.updatePreviewCanvas();
                             }
                         }, 50);

                        // 同时添加到图层管理系统
                        const layerName = fileName || '图片';
                        if (typeof window.addLayerToStore === 'function') {
                            window.addLayerToStore(layerId, layerName, 'image');
                            
                            // 延迟触发图层面板刷新，确保缩略图正确显示
                            setTimeout(() => {
                                // 触发Vue组件的强制更新
                                const layersApp = document.querySelector('#layers-box').__vue_app__;
                                if (layersApp && layersApp._instance) {
                                    layersApp._instance.proxy.$forceUpdate();
                                }
                                
                                // 或者通过事件通知图层组件刷新
                                const refreshEvent = new CustomEvent('layerThumbnailRefresh', {
                                    detail: { layerId: layerId }
                                });
                                document.dispatchEvent(refreshEvent);
                            }, 100);
                        } else {
                            console.warn('图层管理系统未初始化');
                        }
                    }

                    // 添加到上传列表（只存base64和文件名）
                    if (imgElement.src && !window.uploadedImages.some(img => img.src === imgElement.src)) {
                        addImageToUploadedList({
                            src: imgElement.src,
                            fileName: fileName
                        });
                    }
                }

                // 获取当前激活的画布实例
                function getActiveCanvas() {
                    // 优先使用 CanvasManager 获取当前激活视图的画布
                    if (window.CanvasManager) {
                        const canvas = window.CanvasManager.getActiveCanvas();
                        if (canvas) {
                            return canvas;
                        }
                    }
                    
                    // 回退方案：通过 store 和 DOM 获取画布实例
                    const store = window.useCanvasStore && window.useCanvasStore();
                    if (store && store.activeViewId) {
                        // 从 DOM 获取对应视图的画布元素
                        const canvasElement = document.getElementById(`mainCanvas-${store.activeViewId}`);
                        if (canvasElement && canvasElement.__fabricCanvas) {
                            return canvasElement.__fabricCanvas;
                        }
                    }
                    
                    // 最后的回退方案
                    return window.canvas || window.fabricCanvas;
                }
            </script>

            <button id="addImageBtn" class="btn btn-custom" style="margin-top: 10px;" onclick="document.getElementById('imageInput').click()">
                <svg viewBox="0 0 24 24" width="16" height="16" style="vertical-align: middle;">
                    <path fill="currentColor"
                        d="M21,19V5c0-1.1-0.9-2-2-2H5c-1.1,0-2,0.9-2,2v14c0,1.1,0.9,2,2,2h14C20.1,21,21,20.1,21,19z M8.5,13.5l2.5,3.01L14.5,12l4.5,6H5l3.5-4.5z" />
                </svg>
                Add Image
            </button>

            <!-- 已上传过的图片 列表显示在这 -->
            <div id="uploaded-images-list" style="margin-top: 20px;">
                <h3 style="font-size: 1rem; margin-bottom: 10px;">Uploaded Images</h3>
                <div id="uploaded-images-container" style="display: flex; flex-wrap: wrap; gap: 10px;">
                    <!-- 图片缩略图将通过JS动态插入 -->
                </div>
            </div>
            <script>
                // 存储已上传图片的数组（对象：{src, fileName}）
                window.uploadedImages = [];

                // 添加图片到上传列表
                function addImageToUploadedList(imgObj) {
                    // 检查图片是否已存在于列表中
                    if (!window.uploadedImages.some(img => img.src === imgObj.src)) {
                        window.uploadedImages.push(imgObj);
                        renderUploadedImages();
                    }
                }

                // 渲染已上传图片缩略图
                function renderUploadedImages() {
                    const container = document.getElementById('uploaded-images-container');
                    container.innerHTML = '';
                    if (window.uploadedImages.length === 0) {
                        container.innerHTML = '<div style="color:#888;">No uploaded images</div>';

                        return;
                    }
                    window.uploadedImages.forEach((imgObj, idx) => {
                        const src = imgObj.src;
                        const fileName = imgObj.fileName || '未知';
                        const wrapper = document.createElement('div');
                        wrapper.style.position = 'relative';
                        wrapper.style.width = '70px';
                        wrapper.style.height = '110px'; // 增高以容纳更多信息
                        wrapper.style.border = '1px solid #eee';
                        wrapper.style.borderRadius = '6px';
                        wrapper.style.overflow = 'hidden';
                        wrapper.style.background = '#fafafa';
                        wrapper.style.display = 'flex';
                        wrapper.style.flexDirection = 'column';
                        wrapper.style.alignItems = 'center';

                        const img = document.createElement('img');
                        img.src = src;
                        img.style.width = '60px';
                        img.style.height = '60px';
                        img.style.objectFit = 'cover';
                        img.title = '点击添加到画布';
                        img.style.cursor = 'pointer';
                        img.onclick = function() {
                            // 重新添加到画布
                            const imgElement = new Image();
                            imgElement.src = src;
                            imgElement.onload = function() {
                                addImageToCanvas(imgElement, fileName);
                            };
                        };

                        // 信息div
                        const infoDiv = document.createElement('div');
                        infoDiv.style.fontSize = '11px';
                        infoDiv.style.color = '#666';
                        infoDiv.style.textAlign = 'center';
                        infoDiv.style.marginTop = '2px';
                        infoDiv.innerText = '加载中...';

                        // 解析文件类型
                        let fileType = '';
                        if (src.startsWith('data:image/')) {
                            const match = src.match(/^data:(image\/[a-zA-Z0-9.+-]+);/);
                            if (match) {
                                fileType = match[1];
                            }
                        }

                        // 计算图片尺寸和大小
                        const tempImg = new Image();
                        tempImg.src = src;
                        tempImg.onload = function() {
                            // base64图片大小
                            let size = 0;
                            if (src.startsWith('data:image/')) {
                                const base64Str = src.split(',')[1] || '';
                                size = Math.floor((base64Str.length * 3) / 4);
                            }
                            let sizeStr = '';
                            if (size > 1024 * 1024) {
                                sizeStr = (size / (1024 * 1024)).toFixed(2) + 'MB';
                            } else if (size > 1024) {
                                sizeStr = (size / 1024).toFixed(1) + 'KB';
                            } else {
                                sizeStr = size + 'B';
                            }

                            // 尝试获取DPI（仅部分图片格式支持，base64无法直接获取，通常为72）
                            let dpi = 72;

                            // 展示信息
                            infoDiv.innerHTML = `
                        <div style="word-break:break-all;">${fileName}</div>
                        <div>${fileType ? fileType : ''}</div>
                        <div>${tempImg.width}×${tempImg.height} ${sizeStr}</div>
                        <div>DPI: ${dpi}</div>
                    `;
                        };

                        // 删除按钮
                        const delBtn = document.createElement('button');
                        delBtn.innerHTML = '&times;';
                        delBtn.style.position = 'absolute';
                        delBtn.style.top = '2px';
                        delBtn.style.right = '2px';
                        delBtn.style.background = 'rgba(0,0,0,0.5)';
                        delBtn.style.color = '#fff';
                        delBtn.style.border = 'none';
                        delBtn.style.borderRadius = '50%';
                        delBtn.style.width = '18px';
                        delBtn.style.height = '18px';
                        delBtn.style.cursor = 'pointer';
                        delBtn.title = '删除图片';
                        delBtn.onclick = function(e) {
                            e.stopPropagation();
                            window.uploadedImages.splice(idx, 1);
                            renderUploadedImages();
                        };

                        wrapper.appendChild(img);
                        wrapper.appendChild(delBtn);
                        wrapper.appendChild(infoDiv);
                        container.appendChild(wrapper);
                    });
                }

                // 修改addImageToCanvas和拖拽上传，添加到上传列表
                // 已在上面实现

                // 监听文件上传input
                document.getElementById('imageInput').addEventListener('change', function(event) {
                    const file = event.target.files[0];
                    if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            const imgElement = new Image();
                            imgElement.src = e.target.result;
                            imgElement.onload = function() {
                                addImageToCanvas(imgElement, file.name);
                            };
                        };
                        reader.readAsDataURL(file);
                    }
                    // 清空input值，允许重复上传同一文件
                    event.target.value = '';
                });

                // 已移除重复的拖拽上传事件监听器，以防止图片重复添加

                // 初始化
                renderUploadedImages();
            </script>
        </div>
        <div id="img_add_controls">

        </div>


    </div>

    <!-- 文字内容 (隐藏) -->
    <div id="content-wenzi" class="content-pane">
        <div id="addTextBtn_box">
            <textarea id="customText" rows="4" style="width: 100%; margin-bottom: 10px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Input Text..."></textarea>
            <button id="addTextBtn" class="btn btn-custom" style="margin-top: 10px;" onclick="addText()">
                <svg viewBox="0 0 24 24" width="16" height="16" style="vertical-align: middle;">
                    <path fill="currentColor"
                        d="M18.5,4L19.66,8.35L18.7,8.61C18.25,7.74 17.79,6.87 17.26,6.43C16.73,6 16.11,6 15.5,6H13V16.5C13,17 13,17.5 13.33,17.75C13.67,18 14.33,18 15,18V19H9V18C9.67,18 10.33,18 10.67,17.75C11,17.5 11,17 11,16.5V6H8.5C7.89,6 7.27,6 6.74,6.43C6.21,6.87 5.75,7.74 5.3,8.61L4.34,8.35L5.5,4H18.5Z" />
                </svg>
                Add Text
            </button>
        </div>
        
        <div id="content-wenzi-control"></div>
        <script>
        (function() {
            const addTextBox = document.getElementById('addTextBtn_box');
            const controlArea = document.getElementById('content-wenzi-control');
            if (!addTextBox || !controlArea) return;

            function setAddTextBoxVisible(visible) {
                addTextBox.style.display = visible ? 'block' : 'none';
            }

            
        })();
        </script>
    </div>
    
    <script>
        // 修改添加文字函数，确保添加到图层面板
        function addText() {
            const text = document.getElementById('customText').value.trim();
            if (!text) return;

            // 获取当前激活的画布
            const activeCanvas = getActiveCanvas();
            if (!activeCanvas) {
                console.warn('未找到激活的画布');
                return;
            }

            // 清空文本输入框
            document.getElementById('customText').value = '';

            // 生成唯一的图层ID
            const layerId = 'layer_' + Date.now();

            // 创建Fabric文本对象
            const fabricText = new fabric.Text(text, {
                left: activeCanvas.width / 2,
                top: activeCanvas.height / 2,
                fontSize: 30,
                fill: '#000000',
                fontFamily: 'Arial',
                originX: 'center',
                originY: 'center',
                id: layerId,
                cornerSize: 10,
                transparentCorners: false,
                lockUniScaling: false,
                lockMovementX: false,
                lockMovementY: false,
                angle: 0,
                hasControls: true,
                selectable: true,
                // ===== 核心修复：添加用户操作标记 =====
                userInitiated: true,  // 标记为用户操作
                fromButton: true,     // 标记来源为按钮操作
                fromToolbar: true     // 标记来源为工具栏
            });

            // 添加到画布并设为活动对象
            activeCanvas.add(fabricText);
            activeCanvas.setActiveObject(fabricText);
            activeCanvas.renderAll();

            // 不再强制更新全局canvas引用，让CanvasManager管理画布实例
            // 这样可以确保每个视图的画布独立工作

            // // 延迟再次渲染以确保显示
            // setTimeout(() => {
            //     activeCanvas.renderAll();
                
            //     // 强制刷新当前视图显示
            //     const store = window.useCanvasStore && window.useCanvasStore();
            //     if (store && store.activeViewId) {
            //         const viewContainer = document.getElementById(`view-container-${store.activeViewId}`);
            //         if (viewContainer) {
            //             // 隐藏所有视图容器
            //             document.querySelectorAll('.view-container').forEach(container => {
            //                 container.style.display = 'none';
            //             });
            //             // 重新显示当前视图容器
            //             viewContainer.style.display = 'block';
            //         }
            //     }
                
            //     if (typeof window.updatePreviewCanvas === 'function') {
            //         window.updatePreviewCanvas();
            //     }
            // }, 50);

            // 同时添加到图层管理系统
            if (typeof window.addLayerToStore === 'function') {
                window.addLayerToStore(layerId, text, 'text');
            } else {
                console.warn('图层管理系统未初始化');
            }
        }
    </script>

    <!-- 设计内容 (隐藏) -->
    <div id="content-sheji" class="content-pane">
        <!-- List.js CDN -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/list.js/2.3.1/list.min.js"></script>

        <div class="search-filter-container">
            <!-- 快速搜索输入框 -->
            <div class="quick-search-row">
                <div class="search-input-wrapper">
                    <svg class="search-icon" viewBox="0 0 24 24" width="20" height="20">
                        <path fill="#9ca3af" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                    </svg>
                    <input type="text" class="search" placeholder="Search Design Folders" id="quick-search-input">
                </div>
                <button id="filter-toggle-btn" class="filter-toggle-btn">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="white" d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
                    </svg>
                    Filter
                </button>
            </div>

            <!-- 高级搜索行 (默认隐藏) -->
            <div class="advanced-search-row" id="advanced-search-row" style="display: none;">
                <div class="advanced-search-field">
                    <label>Folder</label>
                    <select id="filter-operator" class="filter-operator">
                        <option value="is">is</option>
                        <option value="isnot">is not</option>
                        <option value="contains">contains</option>
                        <option value="notcontains">not contains</option>
                    </select>
                    <input type="text" id="advanced-search-input" class="advanced-search-input" placeholder="">
                </div>
            </div>
        </div>

        <style>
            .search-filter-container {
                padding: 16px;
                background: #f8f9fa;
                border-radius: 8px;
                margin-bottom: 16px;
            }

            .quick-search-row {
                display: flex;
                gap: 12px;
                align-items: center;
            }

            .search-input-wrapper {
                flex: 1;
                position: relative;
            }

            .search-icon {
                position: absolute;
                left: 12px;
                top: 50%;
                transform: translateY(-50%);
                pointer-events: none;
            }

            .search,
            .advanced-search-input {
                width: 100%;
                padding: 12px 12px 12px 44px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 16px;
                background: white;
                box-sizing: border-box;
            }

            .search:focus,
            .advanced-search-input:focus {
                outline: none;
                border-color: #3b82f6;
            }

            .filter-toggle-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 20px;
                background: #22d3ee;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
            }

            .filter-toggle-btn:hover {
                background: #0891b2;
            }

            .advanced-search-row {
                margin-top: 16px;
                padding-top: 16px;
                border-top: 1px solid #e5e7eb;
            }

            .advanced-search-field {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .advanced-search-field label {
                font-weight: 500;
                color: #374151;
                min-width: 100px;
            }

            .filter-operator {
                padding: 8px 12px;
                border: 2px solid #e5e7eb;
                border-radius: 6px;
                background: white;
                font-size: 14px;
                min-width: 120px;
            }

            .filter-operator:focus {
                outline: none;
                border-color: #3b82f6;
            }

            .advanced-search-input {
                flex: 1;
                padding: 8px 12px;
                margin: 0;
            }

           


           
        </style>

        <hr>
        <?php
        // 获取所有自定义分类数据
        $categories = get_terms(array(
            'taxonomy'   => 'pw_design_category',
            'hide_empty' => false,
        ));

        if (!is_wp_error($categories) && !empty($categories)) {
            echo '<div id="design-categories-list" class="content-sheji">';
            echo '<div class="list">';
            foreach ($categories as $category) {
                echo '<div class="category-item">';
                echo '<div class="category-item-header">';
                // 统一显示图片在标题上面
                echo '<div class="category_name name">' . '<img src="' . MY_PLUGIN_URL . 'assets/images/icons/design.svg" alt="Designs ICON">' . esc_html($category->name) . '</div>';
                echo '<button class="back-button" >Back to Design Folders</button>';
                echo '</div>';
                echo '<div class="designs-grid">';
                $designs = get_posts(array(
                    'post_type'      => 'pw_design',
                    'posts_per_page' => -1,
                    'tax_query'      => array(
                        array(
                            'taxonomy' => 'pw_design_category',
                            'field'    => 'term_id',
                            'terms'    => $category->term_id,
                        ),
                    ),
                ));

                if (!empty($designs)) {
                    foreach ($designs as $design) {
                        echo '<div class="design-item">';
                        if (has_post_thumbnail($design->ID)) {
                            echo '<img src="' . get_the_post_thumbnail_url($design->ID, 'thumbnail') . '" alt="' . esc_attr($design->post_title) . '" onclick="addDesignToCanvas(' . $design->ID . ')" style="cursor: pointer;">';
                        }
                        echo '</div>';
                    }
                }
                echo '</div>';
                echo '</div>';
            }
            echo '</div>';
            echo '</div>';
        }
        ?>
    </div>

    <!-- 页脚 始终在底部             -->
     <div class="content-area-footer">
                <div class="tab_footer">
            <div class="sample-check">
                <input type="checkbox" id="sample">
                <label for="sample">Sample Order</label>
            </div>
            <button class="btn btn-custom" id="pwca-inquiry-btn">Inquiry</button>
        </div>
     </div>
</div>

<script>
    // List.js 和过滤功能
    document.addEventListener('DOMContentLoaded', () => {
        // 初始化 List.js
        let designCategoriesList = null;

        // 等待 List.js 库加载完成
        function initializeListJS() {
            if (typeof List !== 'undefined') {
                const options = {
                    valueNames: ['name'],
                    searchClass: 'search'
                };

                designCategoriesList = new List('design-categories-list', options);

                // 设置初始搜索功能
                setupSearchFunctionality();
            } else {
                // 如果 List.js 还没加载完成，等待一下再试
                setTimeout(initializeListJS, 100);
            }
        }

        initializeListJS();

        function setupSearchFunctionality() {
            const filterToggleBtn = document.getElementById('filter-toggle-btn');
            const advancedSearchRow = document.getElementById('advanced-search-row');
            const quickSearchInput = document.getElementById('quick-search-input');
            const advancedSearchInput = document.getElementById('advanced-search-input');
            const filterOperator = document.getElementById('filter-operator');

            // 切换高级搜索显示/隐藏
            filterToggleBtn.addEventListener('click', () => {
                const isVisible = advancedSearchRow.style.display !== 'none';
                advancedSearchRow.style.display = isVisible ? 'none' : 'block';

                // 如果隐藏高级搜索，清空高级搜索输入
                if (isVisible) {
                    advancedSearchInput.value = '';
                    applyAdvancedFilter();
                }
            });

            // 快速搜索功能 (自定义搜索以处理纯文本)
            quickSearchInput.addEventListener('input', (e) => {
                if (designCategoriesList) {
                    const searchTerm = e.target.value.toLowerCase().trim();

                    if (searchTerm === '') {
                        designCategoriesList.filter();
                        return;
                    }

                    designCategoriesList.filter((item) => {
                        const nameElement = item.elm.querySelector('.name');
                        const categoryName = nameElement ? nameElement.textContent.toLowerCase().trim() : '';
                        return categoryName.includes(searchTerm);
                    });
                }
            });

            // 高级搜索功能
            function applyAdvancedFilter() {
                const searchTerm = advancedSearchInput.value.toLowerCase();
                const operator = filterOperator.value;

                if (!designCategoriesList) return;

                if (searchTerm === '') {
                    // 如果搜索词为空，显示所有项目
                    designCategoriesList.filter();
                    return;
                }

                designCategoriesList.filter((item) => {
                    // 获取纯文本内容，去除HTML标签
                    const nameElement = item.elm.querySelector('.name');
                    const categoryName = nameElement ? nameElement.textContent.toLowerCase().trim() : '';

                    switch (operator) {
                        case 'is':
                            return categoryName === searchTerm;
                        case 'isnot':
                            return categoryName !== searchTerm;
                        case 'contains':
                            return categoryName.includes(searchTerm);
                        case 'notcontains':
                            return !categoryName.includes(searchTerm);
                        default:
                            return true;
                    }
                });
            }

            // 高级搜索输入事件
            advancedSearchInput.addEventListener('input', applyAdvancedFilter);
            filterOperator.addEventListener('change', applyAdvancedFilter);
        }

        // 分类项点击功能
        const categoryItems = document.querySelectorAll('.category-item');
        const contentSheji = document.querySelector('.content-sheji');

        if (categoryItems && contentSheji) {
            categoryItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    // 移除所有分类项的active类
                    categoryItems.forEach(i => i.classList.remove('active'));
                    // 给当前点击的分类项添加active类
                    item.classList.add('active');
                    // 给.content-sheji添加active类
                    contentSheji.classList.add('active');
                });
            });
        }

        // 返回按钮功能
        const backButtons = document.querySelectorAll('.back-button');
        backButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡，避免触发父元素的
                const categoryItem = button.closest('.category-item');
                if (categoryItem) {
                    // 移除当前分类项的active类
                    categoryItem.classList.remove('active');
                    // 隐藏.content-sheji的active类
                    contentSheji.classList.remove('active');
                }
            });
        });
    });


    // 主选项卡 tabs-nav 切换逻辑
    document.addEventListener('DOMContentLoaded', () => {
        // 全局：文字界面初始化函数（遵循前缀约定）
        window.canvasInitTextUI = function() {
            try {
                const textInputBtn = document.getElementById('text_input');
                if (textInputBtn) {
                    // 触发文本工具栏的“Text”按钮点击，负责显示输入区域和更新控制
                    textInputBtn.click();
                } else {
                    console.warn('#text_input 按钮未找到');
                }
            } catch (err) {
                console.warn('初始化文字界面失败:', err);
            }
        };

        const tabs = document.querySelectorAll('.tab');
        const contentPanes = document.querySelectorAll('.content-pane');
        const colorSwatches = document.querySelectorAll('.color-swatch');

        // 选项卡切换功能
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // 移除 .main-content 上 .panel-collapsed
                const mainContent = document.querySelector('.main-content');
                if (mainContent) {
                    mainContent.classList.remove('panel-collapsed');
                }

                // 移除 .operation-panel 上 .panel-collapsed
                const operationPanel = document.querySelector('.operation-panel');
                if (operationPanel) {
                    operationPanel.classList.remove('collapsed');
                }

    



                // 1. 移除所有选项卡的 'active' 类
                tabs.forEach(t => t.classList.remove('active'));
                // 2. 为被点击的选项卡添加 'active' 类
                tab.classList.add('active');

                // 3. 隐藏所有内容面板
                contentPanes.forEach(pane => pane.classList.remove('active'));

                // 4. 显示对应的内容面板
                const contentId = 'content-' + tab.id.split('-')[1];
                const activePane = document.getElementById(contentId);
                if (activePane) {
                    activePane.classList.add('active');
                }

                // 点击图片选项卡时，执行重置逻辑
                if (tab.id === 'tab-pianquan') {
                    try {
                        // 1) 清空所有视图画布的选中状态
                        if (window.CanvasManager && typeof window.CanvasManager.getViewIds === 'function') {
                            const viewIds = window.CanvasManager.getViewIds();
                            viewIds.forEach(viewId => {
                                const canvas = window.CanvasManager.getCanvas(viewId);
                                if (canvas && typeof canvas.discardActiveObject === 'function') {
                                    canvas.discardActiveObject();
                                    if (typeof canvas.requestRenderAll === 'function') {
                                        canvas.requestRenderAll();
                                    } else if (typeof canvas.renderAll === 'function') {
                                        canvas.renderAll();
                                    }
                                }
                            });
                        }

                        // 2) 显示 #img_origin_controls
                        const imgOriginControls = document.getElementById('img_origin_controls');
                        if (imgOriginControls) {
                            imgOriginControls.style.display = 'block';
                        }

                        // 3) 清空 #img_add_controls 中内容
                        const imgAddControls = document.getElementById('img_add_controls');
                        if (imgAddControls) {
                            imgAddControls.innerHTML = '';
                        }
                    } catch (err) {
                        console.warn('点击图片选项卡时重置失败:', err);
                    }
                }

                // 特殊处理：点击文字选项卡时，如当前视图选中了文字对象，则初始化文字界面
                if (tab.id === 'tab-wenzi') {
                    // 显示添加文字输入区域
                    try {
                        const addTextBox = document.getElementById('addTextBtn_box');
                        if (addTextBox) {
                            addTextBox.style.display = 'block';
                        }
                    } catch (e) {
                        console.warn('点击文字选项卡时显示 addTextBtn_box 失败:', e);
                    }

                    // 先清空所有视图的选中状态
                    try {
                        if (window.CanvasManager && typeof window.CanvasManager.getViewIds === 'function') {
                            const viewIds = window.CanvasManager.getViewIds();
                            viewIds.forEach(viewId => {
                                const canvas = window.CanvasManager.getCanvas(viewId);
                                if (canvas && typeof canvas.discardActiveObject === 'function') {
                                    canvas.discardActiveObject();
                                    if (typeof canvas.requestRenderAll === 'function') {
                                        canvas.requestRenderAll();
                                    } else if (typeof canvas.renderAll === 'function') {
                                        canvas.renderAll();
                                    }
                                }
                            });
                        }
                    } catch (err) {
                        console.warn('点击文字选项卡时清空选区失败:', err);
                    }

                    const activeCanvas = window.CanvasManager ? window.CanvasManager.getActiveCanvas() : (window.canvas || window.fabricCanvas);
                    const activeObject = activeCanvas && typeof activeCanvas.getActiveObject === 'function' ? activeCanvas.getActiveObject() : null;
                    if (activeObject && (activeObject.type === 'text' || activeObject.type === 'i-text' || activeObject.type === 'textbox')) {
                        if (typeof window.canvasInitTextUI === 'function') {
                            window.canvasInitTextUI();
                        }
                    }
                }
            });
        });

        // 颜色选择功能
        colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                colorSwatches.forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');
            });
        });

        // 操作面板收缩功能
        const collapseBtn = document.getElementById('panelCollapseBtn');
        const operationPanel = document.querySelector('.operation-panel');
        const mainContent = document.querySelector('.main-content');
        
        if (collapseBtn && operationPanel && mainContent) {
            collapseBtn.addEventListener('click', () => {
                operationPanel.classList.toggle('collapsed');
                mainContent.classList.toggle('panel-collapsed');

                // 清除 tabs-nav 中tab   active  class
                const tabsNav = document.querySelector('.tabs-nav');
                if (tabsNav) {
                    tabsNav.querySelectorAll('.tab').forEach(tab => {
                        tab.classList.remove('active');
                    });
                }

                
                // 切换箭头方向
                const arrow = collapseBtn.querySelector('svg path');
                if (operationPanel.classList.contains('collapsed')) {
                    arrow.setAttribute('d', 'M9 18L15 12L9 6'); // 向右箭头
                } else {
                    arrow.setAttribute('d', 'M15 18L9 12L15 6'); // 向左箭头
                }
            });
        }
    });
</script>

<!-- Inquiry Modal - MicroModal Structure -->
<div class="pwca-inquiry-modal modal micromodal-slide" id="pwca-inquiry-modal" aria-hidden="true">
    <div class="pwca-inquiry-modal__overlay modal__overlay" tabindex="-1" data-micromodal-close>
        <div class="pwca-inquiry-modal__container modal__container" role="dialog" aria-modal="true" aria-labelledby="pwca-inquiry-modal-title">
            <header class="pwca-inquiry-modal__header modal__header">
                <h2 class="pwca-inquiry-modal__title modal__title" id="pwca-inquiry-modal-title">
                    Product Inquiry
                </h2>
                <button class="pwca-inquiry-modal__close modal__close" aria-label="Close modal" data-micromodal-close></button>
            </header>
            
            <main class="pwca-inquiry-modal__content modal__content" id="pwca-inquiry-modal-content">
                <form id="pwca-inquiry-form" class="pwca-inquiry-form">
                    <div class="pwca-form-row">
                        <label for="inquiry_first_name" class="pwca-form-label">
                            First Name <span class="pwca-form-required">*</span>
                        </label>
                        <input type="text" id="inquiry_first_name" name="inquiry_first_name" class="pwca-form-input" required>
                    </div>
                    
                    <div class="pwca-form-row">
                        <label for="inquiry_last_name" class="pwca-form-label">
                            Last Name <span class="pwca-form-required">*</span>
                        </label>
                        <input type="text" id="inquiry_last_name" name="inquiry_last_name" class="pwca-form-input" required>
                    </div>
                    
                    <div class="pwca-form-row">
                        <label for="inquiry_email" class="pwca-form-label">
                            Email <span class="pwca-form-required">*</span>
                        </label>
                        <input type="email" id="inquiry_email" name="inquiry_email" class="pwca-form-input" required>
                    </div>
                    
                    <div class="pwca-form-row">
                        <label for="inquiry_phone" class="pwca-form-label">
                            Tel
                        </label>
                        <input type="tel" id="inquiry_phone" name="inquiry_phone" class="pwca-form-input">
                    </div>
                    
                    <div class="pwca-form-row pwca-form-row--textarea">
                        <label for="inquiry_message" class="pwca-form-label">
                            Message <span class="pwca-form-required">*</span>
                        </label>
                        <textarea id="inquiry_message" name="inquiry_message" class="pwca-form-textarea" rows="5" required></textarea>
                    </div>
                    
                    <div class="pwca-form-message" id="pwca-form-message"></div>
                </form>
            </main>
            
            <footer class="pwca-inquiry-modal__footer modal__footer">
                <button class="pwca-inquiry-modal__btn pwca-inquiry-modal__btn--cancel modal__btn" data-micromodal-close>
                    Cancel
                </button>
                <button class="pwca-inquiry-modal__btn pwca-inquiry-modal__btn--submit modal__btn" type="submit" form="pwca-inquiry-form">
                    Submit
                </button>
            </footer>
        </div>
    </div>
</div>