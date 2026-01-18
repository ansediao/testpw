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

                </div>
            </div>
            </div>

        <div class="color-section">
            <h3>Trim color</h3>
            <div class="color-swatches-box" id="color-swatches-container">
                <!-- 颜色样本将通过 JavaScript 动态生成 -->
            </div>
        </div>

        <div class="action-buttons">
            <button class="btn btn-custom">Gradient</button>
            <button class="btn btn-custom">Custom Colors</button>
        </div>
        
        <div class="color-status-display" id="colorStatusDisplay" style="margin-top: 10px; font-size: 14px; color: #666; min-height: 20px; display: none;">
            <!-- 颜色状态将在这里显示 -->
        </div>

        <?php
        // 复用前台产品模块的渐变色弹窗视图
        $gradient_modal_path = dirname( dirname( dirname( __DIR__ ) ) ) . '/front_product/views/partials/pwca-gradient-modal.php';
        if ( is_readable( $gradient_modal_path ) ) {
            include_once $gradient_modal_path;
        }
        ?>

        <div id="custom-color-modal" style="display:none; position:fixed; left:0; top:0; width:100vw; height:100vh; background:rgba(0,0,0,0.3); z-index:9999; align-items:center; justify-content:center;">
            <div style="background:#fff; border-radius:8px; max-width:300px; width:90vw; padding:1rem; position:relative;">
                <button id="close-custom-color-modal" style="position:absolute; right:0.5rem; top:0.5rem; background:none; border:none; font-size:1.5rem; cursor:pointer;">&times;</button>
                <h3 style="margin-top:0;">选择自定义颜色</h3>
                <input type="color" id="customColorPicker" value="#000000" style="width:100%; height:100px; margin-bottom:1rem;" />
                <button id="applyCustomColor" class="btn btn-inquiry" style="width:100%;">应用颜色</button>
            </div>
        </div>

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

        
        
        </div>

    <?php include __DIR__ . '/canvas-operation-panel-tab-layers.php'; ?>

    <?php include __DIR__ . '/canvas-operation-panel-tab-image.php'; ?>

    <?php include __DIR__ . '/canvas-operation-panel-tab-text.php'; ?>

    <?php include __DIR__ . '/canvas-operation-panel-tab-design.php'; ?>

    <?php include __DIR__ . '/canvas-operation-panel-footer.php'; ?>
</div>

<?php include __DIR__ . '/canvas-operation-panel-inquiry-modal.php'; ?>