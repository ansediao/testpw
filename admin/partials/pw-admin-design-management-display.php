<?php
$selected_category = isset($_GET['category']) ? sanitize_text_field($_GET['category']) : '';
$search_query      = isset( $_GET['s'] ) ? sanitize_text_field( $_GET['s'] ) : '';
?>
<div class="wrap">
    <h1>Home Page for Design</h1>

    <div class="pw-design-controls">
        <div class="pw-design-actions">
            <button class="button button-primary" id="pw-add-design-btn">Add Design</button>
            <a href="<?php echo esc_url( admin_url( 'edit-tags.php?taxonomy=pw_design_category&post_type=pw_design' ) ); ?>" class="button">Add Category</a>
            <a href="<?php echo esc_url( admin_url( 'edit-tags.php?taxonomy=pw_design_category&post_type=pw_design' ) ); ?>" class="button">Manage Category</a>
        </div>
       
        <div class="pw-design-filters">
            按名搜索
            <form method="GET" action="">
                <input type="hidden" name="page" value="<?php echo esc_attr( $_REQUEST['page'] ); ?>">
                <input type="text" name="s" value="<?php echo esc_attr( $search_query ); ?>" placeholder="Search Designs">
                <button type="submit" class="button">Search</button>
            </form>
            <form method="GET" action="">
                <input type="hidden" name="page" value="<?php echo esc_attr( $_REQUEST['page'] ); ?>">
                <select name="category" onchange="this.form.submit()">
                    <option value="">Select a Category</option>
                    <?php
                    $categories = get_terms( array(
                        'taxonomy'   => 'pw_design_category',
                        'hide_empty' => false,
                    ) );
                    foreach ( $categories as $category ) {
                        printf(
                            '<option value="%s"%s>%s</option>',
                            esc_attr( $category->slug ),
                            selected( $selected_category, $category->slug, false ),
                            esc_html( $category->name )
                        );
                    }
                    ?>
                </select>
                <noscript><button type="submit" class="button">Filter</button></noscript>
            </form>
            <span class="dashicons dashicons-info"></span>
        </div>
    </div>

    <div class="pw-design-tabs">
        <a href="#" class="nav-tab nav-tab-active">All</a>
        <a href="#" class="nav-tab">Universal</a>
        <a href="#" class="nav-tab">Universal for Main View</a>
        <a href="#" class="nav-tab">Product Specific</a>
    </div>

    <div class="pw-design-bulk-actions">
        <button class="button" id="pw-open-filter-modal">Filter</button>
        <label><input type="checkbox" id="pw-select-all-designs"> Select All</label>
        <button id="pw-delete-selected-designs" class="button button-danger" style="display:none;">Delete Selected</button>
    </div>

    <div class="pw-design-grid">
        <?php
        $args = array(
            'post_type'      => 'pw_design',
            'posts_per_page' => -1, // Retrieve all posts
            'post_status'    => array('publish'), // Include all statuses
        );

        if ( ! empty( $search_query ) ) {
            $args['s'] = $search_query;
        }
        
        if ( ! empty( $selected_category ) ) {
            $args['tax_query'] = array(
                array(
                    'taxonomy' => 'pw_design_category',
                    'field'    => 'slug',
                    'terms'    => $selected_category,
                ),
            );
        }
        $designs_query = new WP_Query( $args );

        if ( $designs_query->have_posts() ) :
            while ( $designs_query->have_posts() ) : $designs_query->the_post();
                $design_id = get_the_ID();
                $design_title = get_the_title();
                $design_thumbnail = get_the_post_thumbnail( $design_id, 'medium', array( 'class' => 'pw-design-thumbnail-img' ) );
                $edit_link = get_edit_post_link( $design_id );
                $delete_link = get_delete_post_link( $design_id, true ); // Pass true to get link, not display it.
                $design_categories = get_the_terms( $design_id, 'pw_design_category' );
                $design_tags = get_the_terms( $design_id, 'pw_design_tag' );
        ?>
                <div class="pw-design-card" data-design-id="<?php echo esc_attr( $design_id ); ?>">
                    <input type="checkbox" class="pw-design-checkbox" value="<?php echo esc_attr( $design_id ); ?>">
                    <div class="pw-design-thumbnail">
                        <?php if ( $design_thumbnail ) : ?>
                            <?php echo $design_thumbnail; ?>
                        <?php else : ?>
                            Thumbnail Design
                        <?php endif; ?>
                    </div>
                    <div class="pw-design-name"><?php echo esc_html( $design_title ); ?></div>
                    <button class="button pw-add-tag-button" data-design-id="<?php echo esc_attr( $design_id ); ?>">Add Tag</button>
                    <div class="pw-design-actions-bottom">
                        <a href="<?php echo esc_url( $edit_link ); ?>" title="Edit Design"><span class="dashicons dashicons-edit"></span></a>
                        <a href="<?php echo esc_url( $delete_link ); ?>" title="Delete Design" class="pw-delete-design-link"><span class="dashicons dashicons-trash"></span></a>
                    </div>
                </div>
            <?php
            endwhile;
            wp_reset_postdata(); // Restore original Post Data
        else :
            ?>
            <p>没有找到任何设计。</p>
        <?php endif; ?>
    </div>

    <style>
        .pw-design-controls,
        .pw-design-filters,
        .pw-design-actions,
        .pw-design-tabs,
        .pw-design-bulk-actions,
        .pw-design-grid {
            margin-bottom: 20px;
        }

        .pw-design-actions a,
        .pw-design-filters button,
        .pw-design-bulk-actions button {
            margin-right: 10px;
        }

        .pw-design-filters input,
        .pw-design-filters select {
            margin-right: 10px;
            padding: 5px 8px;
            border: 1px solid #c3c4c7;
            box-shadow: 0 1px 1px rgba(0,0,0,.04);
            border-radius: 4px;
        }

        .pw-design-filters .dashicons {
            font-size: 20px;
            line-height: 30px;
            vertical-align: middle;
            color: #888;
        }

        .pw-design-tabs .nav-tab {
            margin-right: 5px;
        }

        .pw-design-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 20px;
        }

        .pw-design-card {
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 15px;
            text-align: center;
            background-color: #fff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        .pw-design-thumbnail {
            width: 100%;
            height: 150px;
            background-color: #f0f0f0;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 10px;
            border: 1px dashed #ccc;
            font-style: italic;
            color: #888;
            overflow: hidden; /* Ensure image doesn't overflow */
        }
        .pw-design-thumbnail img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain; /* Scale image down to fit container */
        }

        .pw-design-name {
            font-weight: bold;
            margin-bottom: 10px;
        }

        .pw-design-actions-bottom {
            margin-top: 15px;
            display: flex;
            justify-content: center;
            gap: 15px;
        }

        .pw-design-actions-bottom .dashicons {
            font-size: 20px;
            cursor: pointer;
            color: #555;
        }
        .pw-design-actions-bottom .dashicons:hover {
            color: #0073aa;
        }
    </style>
</div>

<!-- Filter Modal -->
<div id="pw-filter-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1010;">
    <div class="pw-modal-content" style="background:white; width:350px; margin:100px auto; padding:20px; border-radius:5px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
        <h4>Search the Field Name</h4>
        <div class="pw-filter-search-field">
            <span class="dashicons dashicons-search"></span>
            <input type="text" id="pw-filter-name-search" placeholder="Name">
            <span class="dashicons dashicons-no-alt"></span>
        </div>

        <div class="pw-filter-section">
            <h5 class="pw-filter-toggle">Selected Filter Field</h5>
            <div class="pw-filter-options">
                <label><input type="checkbox" name="filter_field" value="product_name" checked> Product Name</label>
                <div class="pw-filter-condition">
                    <select name="product_name_condition">
                        <option value="contains">contains</option>
                        <option value="not_contains">does not contain</option>
                    </select>
                    <input type="text" name="product_name_value" placeholder="t-shirt">
                </div>
            </div>
        </div>

        <div class="pw-filter-section">
            <h5 class="pw-filter-toggle">Not Selected Filter Field</h5>
            <div class="pw-filter-options" style="display:none;">
                <label><input type="checkbox" name="filter_field" value="category_name"> Category Name</label>
                 <div class="pw-filter-condition" style="display:none;">
                    <select name="category_name_condition">
                        <option value="is">is</option>
                        <option value="is_not">is not</option>
                    </select>
                     <select name="category_name_value">
                        <option value="">Select Category</option>
                        <?php
                        if ( ! empty( $categories ) ) {
                            foreach ( $categories as $category ) {
                                printf( '<option value="%s">%s</option>', esc_attr( $category->slug ), esc_html( $category->name ) );
                            }
                        }
                        ?>
                    </select>
                </div>
            </div>
        </div>

        <div class="pw-modal-footer" style="text-align: right; margin-top: 20px;">
            <button class="button" id="pw-filter-clear">Clear</button>
            <button class="button button-primary" id="pw-filter-confirm">Confirm</button>
        </div>
    </div>
</div>
<style>
.pw-modal-content h4, .pw-modal-content h5 {
    margin-top: 0;
    margin-bottom: 10px;
}
.pw-filter-search-field {
    position: relative;
    margin-bottom: 15px;
}
.pw-filter-search-field .dashicons {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    color: #888;
}
.pw-filter-search-field .dashicons-search {
    left: 8px;
}
.pw-filter-search-field .dashicons-no-alt {
    right: 8px;
    cursor: pointer;
}
.pw-filter-search-field input {
    width: 100%;
    padding-left: 30px;
    padding-right: 30px;
}
.pw-filter-section {
    margin-bottom: 15px;
}
.pw-filter-toggle {
    cursor: pointer;
    user-select: none;
}
.pw-filter-toggle::before {
    content: '▼';
    display: inline-block;
    margin-right: 5px;
    transition: transform 0.2s;
}
.pw-filter-toggle.collapsed::before {
    transform: rotate(-90deg);
}
.pw-filter-options {
    padding-left: 15px;
    border-left: 1px solid #ddd;
    margin-top: 10px;
}
.pw-filter-condition {
    margin-top: 5px;
    padding-left: 20px;
}
.pw-filter-condition select, .pw-filter-condition input {
    width: 100%;
    margin-top: 5px;
}
</style>

<!-- Tag Modal -->
<div id="pw-tag-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000;">
    <div class="pw-modal-content" style="background:white; width:500px; margin:100px auto; padding:20px; border-radius:5px;">
        <h2>Manage Tags</h2>
        <div id="pw-tag-modal-body" style="max-height: 300px; overflow-y: auto; margin-bottom: 20px; border: 1px solid #ddd; padding: 10px;">
            <!-- Tags will be loaded here -->
        </div>
        <div class="pw-modal-footer" style="text-align: right;">
            <input type="hidden" id="pw-tag-modal-design-id" value="">
            <button class="button" id="pw-tag-modal-close">Close</button>
            <button class="button button-primary" id="pw-tag-modal-save">Save Changes</button>
        </div>
    </div>
</div>

<!-- Add Design Modal -->
<div id="pw-add-design-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1001;">
    <div class="pw-modal-content" style="background:white; width:600px; margin:50px auto; padding:30px; border-radius:8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
        <h2 style="margin-top:0; margin-bottom:25px; color:#333;">添加新设计</h2>
        
        <form id="pw-add-design-form" enctype="multipart/form-data">
            <?php wp_nonce_field('pw_add_design_nonce', 'pw_add_design_nonce_field'); ?>
            
            <!-- 图片上传区域 -->
            <div class="pw-form-field" style="margin-bottom:25px;">
                <label style="display:block; margin-bottom:8px; font-weight:600; color:#333;">设计图片</label>
                <div id="pw-image-upload-area" style="border:2px dashed #ccc; border-radius:8px; padding:40px; text-align:center; background:#fafafa; cursor:pointer; transition:all 0.3s ease;">
                    <div id="pw-upload-placeholder">
                        <span class="dashicons dashicons-cloud-upload" style="font-size:48px; color:#999; display:block; margin-bottom:15px;"></span>
                        <p style="margin:0; color:#666; font-size:16px;">点击或拖拽图片到此区域上传</p>
                        <p style="margin:5px 0 0; color:#999; font-size:14px;">支持 JPG, PNG, GIF 格式</p>
                    </div>
                    <div id="pw-image-preview" style="display:none;">
                        <img id="pw-preview-img" style="max-width:100%; max-height:200px; border-radius:4px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                        <p style="margin:10px 0 0; color:#666;"><span id="pw-file-name"></span></p>
                        <button type="button" id="pw-remove-image" class="button" style="margin-top:10px;">移除图片</button>
                    </div>
                </div>
                <input type="file" id="pw-design-image" name="design_image" accept="image/*" style="display:none;">
            </div>
            
            <!-- 名称字段 -->
            <div class="pw-form-field" style="margin-bottom:25px;">
                <label for="pw-design-name" style="display:block; margin-bottom:8px; font-weight:600; color:#333;">设计名称</label>
                <input type="text" id="pw-design-name" name="design_name" required style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; font-size:14px;">
            </div>
            
            <!-- 分类选择 -->
            <div class="pw-form-field" style="margin-bottom:30px;">
                <label for="pw-design-category" style="display:block; margin-bottom:8px; font-weight:600; color:#333;">设计分类</label>
                <select id="pw-design-category" name="design_category" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; font-size:14px;">
                    <option value="">选择分类</option>
                    <?php
                    $categories = get_terms( array(
                        'taxonomy'   => 'pw_design_category',
                        'hide_empty' => false,
                    ) );
                    if ( ! empty( $categories ) && ! is_wp_error( $categories ) ) {
                        foreach ( $categories as $category ) {
                            printf(
                                '<option value="%s">%s</option>',
                                esc_attr( $category->term_id ),
                                esc_html( $category->name )
                            );
                        }
                    }
                    ?>
                </select>
            </div>
            
            <div class="pw-modal-footer" style="text-align: right; border-top:1px solid #eee; padding-top:20px; margin-top:30px;">
                <button type="button" class="button" id="pw-add-design-cancel">取消</button>
                <button type="submit" class="button button-primary" id="pw-add-design-submit">添加设计</button>
            </div>
        </form>
    </div>
</div>

<script type="text/javascript">
jQuery(document).ready(function($) {
    'use strict';

    // --- Add Design Modal ---
    
    // 打开添加设计模态框
    $('#pw-add-design-btn').on('click', function(e) {
        e.preventDefault();
        $('#pw-add-design-modal').show();
    });
    
    // 关闭添加设计模态框
    $('#pw-add-design-cancel').on('click', function(e) {
        e.preventDefault();
        $('#pw-add-design-modal').hide();
        resetAddDesignForm();
    });
    
    // 点击模态框外部关闭
    $('#pw-add-design-modal').on('click', function(e) {
        if (e.target === this) {
            $(this).hide();
            resetAddDesignForm();
        }
    });
    
    // 图片上传区域点击事件
    $('#pw-image-upload-area').on('click', function(e) {
        e.preventDefault();
        $('#pw-design-image').click();
    });
    
    // 文件选择事件
    $('#pw-design-image').on('change', function(e) {
        handleImageUpload(e.target.files[0]);
    });
    
    // 拖拽上传
    $('#pw-image-upload-area').on('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).css('border-color', '#007cba');
        $(this).css('background-color', '#f0f6fc');
    });
    
    $('#pw-image-upload-area').on('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).css('border-color', '#ccc');
        $(this).css('background-color', '#fafafa');
    });
    
    $('#pw-image-upload-area').on('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).css('border-color', '#ccc');
        $(this).css('background-color', '#fafafa');
        
        var files = e.originalEvent.dataTransfer.files;
        if (files.length > 0) {
            handleImageUpload(files[0]);
        }
    });
    
    // 移除图片
    $('#pw-remove-image').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $('#pw-design-image').val('');
        $('#pw-upload-placeholder').show();
        $('#pw-image-preview').hide();
    });
    
    // 处理图片上传预览
    function handleImageUpload(file) {
        if (!file) return;
        
        // 验证文件类型
        if (!file.type.match('image.*')) {
            alert('请选择图片文件！');
            return;
        }
        
        // 验证文件大小 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('图片文件不能超过 5MB！');
            return;
        }
        
        var reader = new FileReader();
        reader.onload = function(e) {
            $('#pw-preview-img').attr('src', e.target.result);
            $('#pw-file-name').text(file.name);
            $('#pw-upload-placeholder').hide();
            $('#pw-image-preview').show();
        };
        reader.readAsDataURL(file);
    }
    
    // 重置表单
    function resetAddDesignForm() {
        $('#pw-add-design-form')[0].reset();
        $('#pw-upload-placeholder').show();
        $('#pw-image-preview').hide();
        $('#pw-add-design-submit').prop('disabled', false).text('添加设计');
    }
    
    // 提交表单
    $('#pw-add-design-form').on('submit', function(e) {
        e.preventDefault();
        
        var formData = new FormData();
        var imageFile = $('#pw-design-image')[0].files[0];
        var designName = $('#pw-design-name').val().trim();
        var designCategory = $('#pw-design-category').val();
        
        // 验证
        if (!imageFile) {
            alert('请选择设计图片！');
            return;
        }
        
        if (!designName) {
            alert('请输入设计名称！');
            return;
        }
        
        // 准备数据
        formData.append('action', 'pw_add_design');
        formData.append('design_image', imageFile);
        formData.append('design_name', designName);
        formData.append('design_category', designCategory);
        formData.append('pw_add_design_nonce_field', $('#pw_add_design_nonce_field').val());
        
        // 提交
        $.ajax({
            url: "<?php echo admin_url('admin-ajax.php'); ?>",
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            beforeSend: function() {
                $('#pw-add-design-submit').prop('disabled', true).text('添加中...');
            },
            success: function(response) {
                if (response.success) {
                    alert('设计添加成功！');
                    $('#pw-add-design-modal').hide();
                    resetAddDesignForm();
                    // 刷新页面显示新添加的设计
                    location.reload();
                } else {
                    alert('添加失败：' + (response.data || '未知错误'));
                }
            },
            error: function(xhr, status, error) {
                alert('添加失败，请检查网络连接后重试。');
                console.error('AJAX Error:', error);
            },
            complete: function() {
                $('#pw-add-design-submit').prop('disabled', false).text('添加设计');
            }
        });
    });

    // --- Tag Management Modal ---

    // Open Modal and load tags
    $('.pw-design-grid').on('click', '.pw-add-tag-button', function(e) {
        e.preventDefault();
        console.log('Add Tag button clicked.'); // Debug log

        var designId = $(this).data('design-id');
        var modal = $('#pw-tag-modal');
        var modalBody = $('#pw-tag-modal-body');

        // Show modal immediately for better user feedback
        $('#pw-tag-modal-design-id').val(designId);
        modalBody.html('Loading...');
        modal.show();

        $.ajax({
            url: "<?php echo admin_url('admin-ajax.php'); ?>",
            type: 'POST',
            data: {
                action: 'pw_get_design_tags',
                design_id: designId,
                nonce: "<?php echo wp_create_nonce('pw_get_design_tags_nonce'); ?>"
            },
            success: function(response) {
                if (response.success) {
                    var tags = response.data.all_tags;
                    var selected_tags = response.data.selected_tags;
                    var html = '';
                    if (tags.length > 0) {
                        tags.forEach(function(tag) {
                            var is_checked = selected_tags.includes(tag.term_id);
                            html += '<p><label><input type="checkbox" name="pw_design_tags[]" value="' + tag.term_id + '" ' + (is_checked ? 'checked' : '') + '> ' + tag.name + '</label></p>';
                        });
                    } else {
                        html = 'No tags available.';
                    }
                    modalBody.html(html);
                } else {
                    modalBody.html('Error: ' + (response.data || 'Unknown error'));
                }
            },
            error: function() {
                modalBody.html('AJAX error. Check browser console for more details.');
            }
        });
    });

    // Close Modal
    $(document).on('click', '#pw-tag-modal-close', function(e) {
        e.preventDefault();
        $('#pw-tag-modal').hide();
    });

    // Save Tags
    $(document).on('click', '#pw-tag-modal-save', function(e) {
        e.preventDefault();
        var button = $(this);
        var designId = $('#pw-tag-modal-design-id').val();
        var selectedTags = [];
        $('#pw-tag-modal-body input[type="checkbox"]:checked').each(function() {
            selectedTags.push($(this).val());
        });

        $.ajax({
            url: "<?php echo admin_url('admin-ajax.php'); ?>",
            type: 'POST',
            data: {
                action: 'pw_save_design_tags',
                design_id: designId,
                tags: selectedTags,
                nonce: "<?php echo wp_create_nonce('pw_save_design_tags_nonce'); ?>"
            },
            beforeSend: function() {
                button.prop('disabled', true).text('Saving...');
            },
            success: function(response) {
                if (response.success) {
                    $('#pw-tag-modal').hide();
                    location.reload();
                } else {
                    alert('Error saving tags: ' + response.data);
                }
            },
            error: function() {
                alert('AJAX error while saving tags.');
            },
            complete: function() {
                button.prop('disabled', false).text('Save Changes');
            }
        });
    });

    // --- Bulk Delete Designs ---

    const selectAllCheckbox = $('#pw-select-all-designs');
    const deleteButton = $('#pw-delete-selected-designs');

    /**
     * Update the visibility of the "Delete Selected" button based on selections.
     */
    function updateDeleteButton() {
        const anyChecked = $('.pw-design-checkbox:checked').length > 0;
        deleteButton.toggle(anyChecked);
    }

    /**
     * Update the "Select All" checkbox based on individual checkbox states.
     */
    function updateSelectAllState() {
        const allCheckboxes = $('.pw-design-checkbox');
        if (allCheckboxes.length === 0) {
            selectAllCheckbox.prop('checked', false);
            return;
        }
        const allChecked = allCheckboxes.not(':checked').length === 0;
        selectAllCheckbox.prop('checked', allChecked);
    }

    // 1. Handle "Select All" checkbox change
    selectAllCheckbox.on('change', function() {
        $('.pw-design-checkbox').prop('checked', $(this).is(':checked'));
        updateDeleteButton();
    });

    // 2. Handle individual design checkbox change
    $('.pw-design-grid').on('change', '.pw-design-checkbox', function() {
        updateSelectAllState();
        updateDeleteButton();
    });

    // 3. Handle "Delete Selected" button click
    $('#pw-delete-selected-designs').on('click', function(e) {
        e.preventDefault();

        const selectedIds = $('.pw-design-checkbox:checked').map(function() {
            return $(this).val();
        }).get();

        if (selectedIds.length === 0) {
            alert('Please select at least one design to delete.');
            return;
        }

        if (!confirm('Are you sure you want to delete the selected designs? This action cannot be undone.')) {
            return;
        }

        $.ajax({
            url: "<?php echo admin_url('admin-ajax.php'); ?>",
            type: 'POST',
            data: {
                action: 'pw_delete_selected_designs',
                nonce: "<?php echo wp_create_nonce('pw_delete_designs_nonce'); ?>",
                design_ids: selectedIds
            },
            beforeSend: function() {
                $('#pw-delete-selected-designs').prop('disabled', true).text('Deleting...');
            },
            success: function(response) {
                if (response.success) {
                    alert(response.data);
                    // Remove deleted items from the DOM
                    selectedIds.forEach(function(id) {
                        $('.pw-design-card[data-design-id="' + id + '"]').remove();
                    });
                } else {
                    alert('Error: ' + response.data);
                }
            },
            error: function() {
                alert('An error occurred while trying to delete the designs. Please try again.');
            },
            complete: function() {
                 // Always update state after AJAX, regardless of success or error
                updateDeleteButton();
                updateSelectAllState();
                $('#pw-delete-selected-designs').prop('disabled', false).text('Delete Selected');
            }
        });
    });

    // Initial state check on page load
    updateDeleteButton();
    updateSelectAllState();

    // --- Filter Modal Logic ---
    const filterModal = $('#pw-filter-modal');
    const openFilterModalBtn = $('#pw-open-filter-modal');

    // Open modal
    openFilterModalBtn.on('click', function() {
        filterModal.show();
    });

    // Close modal if clicking outside of the content
    filterModal.on('click', function(e) {
        if ($(e.target).is(filterModal)) {
            filterModal.hide();
        }
    });
    
    // Toggle filter sections
    $('.pw-filter-toggle').on('click', function() {
        $(this).toggleClass('collapsed');
        $(this).next('.pw-filter-options').slideToggle(200);
    });

    // Toggle condition display based on checkbox
    $('input[name="filter_field"]').on('change', function() {
        $(this).parent().next('.pw-filter-condition').toggle($(this).is(':checked'));
    });

    // Clear search input
    $('.pw-filter-search-field .dashicons-no-alt').on('click', function() {
        $('#pw-filter-name-search').val('').trigger('keyup');
    });

    // Search filter fields
    $('#pw-filter-name-search').on('keyup', function() {
        const searchTerm = $(this).val().toLowerCase();
        $('.pw-filter-options label').each(function() {
            const labelText = $(this).text().toLowerCase();
            if (labelText.includes(searchTerm)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });

    // Clear button
    $('#pw-filter-clear').on('click', function() {
        $('#pw-filter-modal input[type="text"]').val('');
        $('#pw-filter-modal input[type="checkbox"]').prop('checked', false);
        $('#pw-filter-modal select').prop('selectedIndex', 0);
        $('.pw-filter-condition').hide();
        // Restore default state for Product Name
        $('input[value="product_name"]').prop('checked', true).trigger('change');
    });

    // Confirm button
    $('#pw-filter-confirm').on('click', function() {
        const baseUrl = window.location.href.split('?')[0];
        const params = new URLSearchParams(window.location.search);
        
        // Clear old filter params
        params.delete('s');
        params.delete('category');
        params.delete('product_name_condition');
        params.delete('product_name_value');
        params.delete('category_name_condition');
        params.delete('category_name_value');

        // Add new filter params
        $('input[name="filter_field"]:checked').each(function() {
            const field = $(this).val();
            const condition = $('[name="' + field + '_condition"]').val();
            const value = $('[name="' + field + '_value"]').val();

            if (value) {
                if (field === 'product_name') {
                    params.set('s', value); // Use 's' for general search
                    params.set('product_name_condition', condition);
                } else if (field === 'category_name') {
                     params.set('category', value); // Use 'category' for category filter
                     params.set('category_name_condition', condition);
                }
            }
        });

        window.location.href = baseUrl + '?' + params.toString();
    });
});
</script>