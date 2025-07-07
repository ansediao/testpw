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

<!-- 右侧内容区域 -->
<div class="content-area">
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
            <span style="margin-left: 5px; color: #888;"><?php echo $rating_count; ?> Reviews</span>
            <a href="#" id="show-reviews-link">Customization Instructions</a>
            <a href="#" id="show-reviews-link">Customization Instructions</a>
            <script>
                document.addEventListener('DOMContentLoaded', function() {
                    const showReviewsLink = document.getElementById('show-reviews-link');
                    if (showReviewsLink) {
                        showReviewsLink.addEventListener('click', function(e) {
                            e.preventDefault();
                            switchReviewTab(1); // 切换到第二个tab（产品描述）
                        });
                    }

                    function switchReviewTab(tabIndex) {
                        const reviewTabs = document.querySelectorAll('#review-tabs .review-tab');
                        const reviewTabPanes = document.querySelectorAll('#review-tab-content .review-tab-pane');
                        reviewTabs.forEach(t => {
                            t.classList.remove('active');
                            t.style.background = '#f3f4f6';
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
                            <div class="review-tab active" data-tab="reviews">产品评价</div>
                            <div class="review-tab" data-tab="desc">产品描述</div>
                            <div class="review-tab" data-tab="custom">定制说明</div>
                        </div>
                        <div id="review-tab-content">
                            <div class="review-tab-pane active" data-content="reviews">
                                <h3 style="margin-top:0;">产品评价</h3>
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
                            <div class="review-tab-pane" data-content="desc" style="display:none;">
                                <h3 style="margin-top:0;">产品描述</h3>
                                <div>
                                    <?php
                                    $product = wc_get_product($product_id);
                                    if ($product) {
                                        echo $product->get_description();
                                    } else {
                                        echo '<div style="color:#888;">暂无产品描述</div>';
                                    }
                                    ?>
                                </div>
                            </div>
                            <div class="review-tab-pane" data-content="custom" style="display:none;">
                                <h3 style="margin-top:0;">定制说明</h3>
                                <div>
                                    <?php
                                    // 你可以自定义定制说明字段，或用自定义字段
                                    $custom_note = get_post_meta($product_id, 'custom_note', true);
                                    if ($custom_note) {
                                        echo wpautop(esc_html($custom_note));
                                    } else {
                                        echo '<div style="color:#888;">暂无定制说明</div>';
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
                                        t.style.background = '#f3f4f6';
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
                    <style>
                        #review-tabs .review-tab.active {
                            background: #fff !important;
                            border-bottom: 2px solid #3b82f6;
                            color: #1d4ed8;
                            font-weight: 600;
                        }

                        #review-tabs .review-tab {
                            transition: background 0.2s;
                        }
                    </style>
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
            <div class="color-swatches-box">
                <div class="color-swatch selected" style="background-color: #000;" data-color="#000000"></div>
                <div class="color-swatch" style="background-color: #ef4444;" data-color="#ef4444"></div>
                <div class="color-swatch" style="background-color: #14b8a6;" data-color="#14b8a6"></div>
                <div class="color-swatch" style="background-color: #ec4899;" data-color="#ec4899"></div>
                <div class="color-swatch" style="background-color: #fff; border: 1px solid #9ca3af;" data-color="#ffffff"></div>
                <div class="color-swatch" style="background-color: #22d3ee;" data-color="#22d3ee"></div>
                <div class="color-swatch" style="background-color: #2563eb;" data-color="#2563eb"></div>
                <div class="color-swatch" style="background-color: #fde047;" data-color="#fde047"></div>
            </div>
        </div>
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                const colorSwatches = document.querySelectorAll('.color-swatch');
                colorSwatches.forEach(swatch => {
                    swatch.addEventListener('click', function() {
                        colorSwatches.forEach(s => s.classList.remove('selected'));
                        swatch.classList.add('selected');
                        const color = swatch.getAttribute('data-color');

                    });
                });
            });
        </script>

        <div class="action-buttons">
            <button class="btn btn-gradient">Gradient</button>
            <button class="btn btn-custom">Custom Colors</button>
        </div>
        <div id="gradient-color-modal" style="display:none; position:fixed; left:0; top:0; width:100vw; height:100vh; background:rgba(0,0,0,0.3); z-index:9999; align-items:center; justify-content:center;">
            <div style="background:#fff; border-radius:8px; max-width:400px; width:90vw; padding:1rem; position:relative;">
                <button id="close-gradient-color-modal" style="position:absolute; right:0.5rem; top:0.5rem; background:none; border:none; font-size:1.5rem; cursor:pointer;">&times;</button>
                <h3 style="margin-top:0;">选择渐变色</h3>
                <div style="margin-bottom:1rem;">
                    <label for="gradientColor1" style="display:block; margin-bottom:0.5rem;">颜色 1:</label>
                    <input type="color" id="gradientColor1" value="#ff0000" style="width:100%; height:50px;" />
                </div>
                <div style="margin-bottom:1rem;">
                    <label for="gradientColor2" style="display:block; margin-bottom:0.5rem;">颜色 2:</label>
                    <input type="color" id="gradientColor2" value="#0000ff" style="width:100%; height:50px;" />
                </div>
                <div style="margin-bottom:1rem;">
                    <label for="gradientDirection" style="display:block; margin-bottom:0.5rem;">方向:</label>
                    <select id="gradientDirection" style="width:100%; padding:0.5rem;">
                        <option value="to right">从左到右</option>
                        <option value="to bottom">从上到下</option>
                        <option value="to bottom right">从左上到右下</option>
                        <option value="to bottom left">从右上到左下</option>
                    </select>
                </div>
                <button id="applyGradientColor" class="btn btn-inquiry" style="width:100%;">应用渐变色</button>
            </div>
        </div>
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                const gradientColorBtn = document.querySelector('.btn-gradient');
                const gradientColorModal = document.getElementById('gradient-color-modal');
                const closeGradientColorModal = document.getElementById('close-gradient-color-modal');
                const applyGradientColorBtn = document.getElementById('applyGradientColor');
                const gradientColor1 = document.getElementById('gradientColor1');
                const gradientColor2 = document.getElementById('gradientColor2');
                const gradientDirection = document.getElementById('gradientDirection');

                if (gradientColorBtn && gradientColorModal && closeGradientColorModal && applyGradientColorBtn && gradientColor1 && gradientColor2 && gradientDirection) {
                    gradientColorBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        gradientColorModal.style.display = 'flex';
                    });
                    closeGradientColorModal.addEventListener('click', function() {
                        gradientColorModal.style.display = 'none';
                    });
                    gradientColorModal.addEventListener('click', function(e) {
                        if (e.target === gradientColorModal) {
                            gradientColorModal.style.display = 'none';
                        }
                    });
                    applyGradientColorBtn.addEventListener('click', function() {
                        const color1 = gradientColor1.value;
                        const color2 = gradientColor2.value;
                        const direction = gradientDirection.value;
                        const shadowCanvas = document.getElementById('shadowLayer');
                        if (shadowCanvas) {
                            const ctx = shadowCanvas.getContext('2d');
                            if (ctx) {
                                const width = shadowCanvas.width;
                                const height = shadowCanvas.height;
                                let gradient;
                                if (direction === 'to right') {
                                    gradient = ctx.createLinearGradient(0, 0, width, 0);
                                } else if (direction === 'to bottom') {
                                    gradient = ctx.createLinearGradient(0, 0, 0, height);
                                } else if (direction === 'to bottom right') {
                                    gradient = ctx.createLinearGradient(0, 0, width, height);
                                } else if (direction === 'to bottom left') {
                                    gradient = ctx.createLinearGradient(width, 0, 0, height);
                                }
                                gradient.addColorStop(0, color1);
                                gradient.addColorStop(1, color2);
                                ctx.globalCompositeOperation = 'source-in';
                                ctx.fillStyle = gradient;
                                ctx.fillRect(0, 0, width, height);
                                ctx.globalCompositeOperation = 'source-over';
                            }
                        }
                        // 更新颜色样本中的选中状态
                        const colorSwatches = document.querySelectorAll('.color-swatch');
                        colorSwatches.forEach(s => s.classList.remove('selected'));
                        gradientColorModal.style.display = 'none';
                    });
                }
            });
        </script>
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
                const customColorBtn = document.querySelector('.btn-custom');
                const customColorModal = document.getElementById('custom-color-modal');
                const closeCustomColorModal = document.getElementById('close-custom-color-modal');
                const applyCustomColorBtn = document.getElementById('applyCustomColor');
                const customColorPicker = document.getElementById('customColorPicker');

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
                        const shadowCanvas = document.getElementById('shadowLayer');
                        if (shadowCanvas && typeof loadColorImage === 'function') {
                            const colorImageUrl = shadowCanvas.getAttribute('data-color-image');
                            if (colorImageUrl) {
                                loadColorImage(colorImageUrl, color);
                            }
                        }
                        // 更新颜色样本中的选中状态
                        const colorSwatches = document.querySelectorAll('.color-swatch');
                        colorSwatches.forEach(s => s.classList.remove('selected'));
                        customColorModal.style.display = 'none';
                    });
                }
            });
        </script>

        <div class="footer">
            <div class="sample-check">
                <input type="checkbox" id="sample">
                <label for="sample">Sample Order</label>
            </div>
            <button class="btn btn-inquiry">Inquiry</button>
        </div>
    </div>

    <!-- 图层 -->
    <div id="content-tuan" class="content-pane">
        <div class="layers-panel">
            <div class="layers-header">
                <span class="layer-column layer-visibility">显示</span>
                <span class="layer-column layer-lock">锁定</span>
                <span class="layer-column layer-name">名称</span>
            </div>
            <div id="layers-container" class="layers-container">
                <!-- 图层将在这里动态添加 -->
            </div>
        </div>
    </div>

    <!-- 图片 -->
    <div id="content-pianquan" class="content-pane">
        <div id="img_origin_controls">
            <div id="dropZone" style="border: 2px dashed #ccc; padding: 20px; text-align: center; margin-bottom: 10px;">
                将图片拖放到此处或点击上传
            </div>
            <input type="file" id="imageInput" accept="image/*" style="display: none;" onchange="addImage(event)" />
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
                    // 计算宽高比
                    const aspectRatio = imgElement.width / imgElement.height;

                    // 设定目标宽度为200px
                    const targetWidth = 200;
                    // 根据宽高比计算目标高度
                    const targetHeight = targetWidth / aspectRatio;

                    const fabricImage = new fabric.Image(imgElement, {
                        left: canvas.width / 2,
                        top: canvas.height / 2,
                        scaleX: targetWidth / imgElement.width,
                        scaleY: targetHeight / imgElement.height,
                        originX: 'center',
                        originY: 'center',
                        id: 'layer_' + layerCounter++
                    });

                    // 检查画布上是否已存在相同来源的图片
                    let imageExists = false;
                    canvas.getObjects().forEach(obj => {
                        if (obj.type === 'image' && obj.getElement().src === imgElement.src) {
                            imageExists = true;
                        }
                    });
                    if (!imageExists) {
                        canvas.add(fabricImage);
                        canvas.setActiveObject(fabricImage);
                        canvas.renderAll();
                    }

                    // 添加到上传列表（只存base64和文件名）
                    if (imgElement.src && !uploadedImages.some(img => img.src === imgElement.src)) {
                        addImageToUploadedList({
                            src: imgElement.src,
                            fileName: fileName
                        });
                    }
                }
            </script>

            <button id="addImageBtn" style="margin-top: 10px;" onclick="document.getElementById('imageInput').click()">
                <svg viewBox="0 0 24 24" width="16" height="16" style="vertical-align: middle;">
                    <path fill="currentColor"
                        d="M21,19V5c0-1.1-0.9-2-2-2H5c-1.1,0-2,0.9-2,2v14c0,1.1,0.9,2,2,2h14C20.1,21,21,20.1,21,19z M8.5,13.5l2.5,3.01L14.5,12l4.5,6H5l3.5-4.5z" />
                </svg>
                添加图片
            </button>

            <!-- 已上传过的图片 列表显示在这 -->
            <div id="uploaded-images-list" style="margin-top: 20px;">
                <h3 style="font-size: 1rem; margin-bottom: 10px;">已上传图片</h3>
                <div id="uploaded-images-container" style="display: flex; flex-wrap: wrap; gap: 10px;">
                    <!-- 图片缩略图将通过JS动态插入 -->
                </div>
            </div>
            <script>
                // 存储已上传图片的数组（对象：{src, fileName}）
                let uploadedImages = [];

                // 添加图片到上传列表
                function addImageToUploadedList(imgObj) {
                    // 检查图片是否已存在于列表中
                    if (!uploadedImages.some(img => img.src === imgObj.src)) {
                        uploadedImages.push(imgObj);
                        renderUploadedImages();
                    }
                }

                // 渲染已上传图片缩略图
                function renderUploadedImages() {
                    const container = document.getElementById('uploaded-images-container');
                    container.innerHTML = '';
                    if (uploadedImages.length === 0) {
                        container.innerHTML = '<div style="color:#888;">暂无已上传图片</div>';
                        return;
                    }
                    uploadedImages.forEach((imgObj, idx) => {
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
                            uploadedImages.splice(idx, 1);
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
        <textarea id="customText" rows="4" style="width: 100%; margin-bottom: 10px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="请输入要添加的文字..."></textarea>
        <button id="addTextBtn" style="margin-top: 10px;" onclick="addText()">
            <svg viewBox="0 0 24 24" width="16" height="16" style="vertical-align: middle;">
                <path fill="currentColor"
                    d="M18.5,4L19.66,8.35L18.7,8.61C18.25,7.74 17.79,6.87 17.26,6.43C16.73,6 16.11,6 15.5,6H13V16.5C13,17 13,17.5 13.33,17.75C13.67,18 14.33,18 15,18V19H9V18C9.67,18 10.33,18 10.67,17.75C11,17.5 11,17 11,16.5V6H8.5C7.89,6 7.27,6 6.74,6.43C6.21,6.87 5.75,7.74 5.3,8.61L4.34,8.35L5.5,4H18.5Z" />
            </svg>
            添加文字
        </button>
        <hr>
        <div id="content-wenzi-control"></div>
    </div>

    <script>
        // 修改添加文字函数，确保添加到图层面板
        function addText() {
            const text = document.getElementById('customText').value.trim();
            if (!text) return;
            // 清空文本输入框
            document.getElementById('customText').value = '';
            // 创建Fabric文本对象
            const fabricText = new fabric.Text(text, {
                left: canvas.width / 2,
                top: canvas.height / 2,
                fontSize: 30,
                fill: '#000000',
                fontFamily: 'Arial',
                originX: 'center',
                originY: 'center',
                id: 'layer_' + layerCounter++
            });
            // 添加到画布并设为活动对象
            canvas.add(fabricText);
            canvas.setActiveObject(fabricText);
            canvas.renderAll();
        }
    </script>

    <!-- 设计内容 (隐藏) -->
    <div id="content-sheji" class="content-pane">
        <div class="search-filter-container">
            <input type="text" id="design-search-input" placeholder="搜索设计..." class="search-input">
            <button id="filter-designs-btn" class="filter-button">
                <svg viewBox="0 0 24 24" width="16" height="16" style="vertical-align: middle;">
                    <path fill="currentColor" d="M10,18c1.846,0,3.543-0.635,4.897-1.688l4.396,4.396l1.414-1.414l-4.396-4.396C17.365,13.543,18,11.846,18,10 c0-4.411-3.589-8-8-8s-8,3.589-8,8S5.589,18,10,18z M10,4c3.309,0,6,2.691,6,6s-2.691,6-6,6s-6-2.691-6-6S6.691,4,10,4z" />
                </svg>
            </button>
        </div>
        <hr>
        <?php
        // 获取所有自定义分类数据
        $categories = get_terms(array(
            'taxonomy'   => 'pw_design_category',
            'hide_empty' => false,
        ));

        if (!is_wp_error($categories) && !empty($categories)) {
            echo '<div class="content-sheji">';
            foreach ($categories as $category) {
                echo '<div class="category-item">';
                echo '<div class="category-item-header">';
                // 统一显示图片在标题上面
                echo '<div class="category_name">' . '<img src="' . MY_PLUGIN_URL . 'assets/images/icons/design.svg" alt="Designs ICON" style="display:block;margin:0 auto 8px;max-width:40px;">' . esc_html($category->name) . '</div>';
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
        }
        ?>
    </div>
</div>

<script>
    // 分类项点击功能
    document.addEventListener('DOMContentLoaded', () => {
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



    document.addEventListener('DOMContentLoaded', () => {
        const tabs = document.querySelectorAll('.tab');
        const contentPanes = document.querySelectorAll('.content-pane');
        const colorSwatches = document.querySelectorAll('.color-swatch');

        // 选项卡切换功能
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
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
            });
        });

        // 颜色选择功能
        colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                colorSwatches.forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');
            });
        });
    });
</script>