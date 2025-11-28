/**
 * 简化的模态框处理 - 专门解决上传区域点击问题
 */

(function($) {
    'use strict';

    $(document).ready(function() {
        
        // 初始化MicroModal（忽略警告）
        if (typeof MicroModal !== 'undefined') {
            try {
                MicroModal.init({
                    disableScroll: true,
                    awaitCloseAnimation: false,
                    awaitOpenAnimation: false
                });
            } catch (e) {
                // 忽略MicroModal的警告
            }
        }
        
        // 绑定模态框触发器
        $('#pw-add-design-btn').on('click', function(e) {
            e.preventDefault();
            MicroModal.show('pw-add-design-modal');
            
            // 模态框打开后立即设置上传处理
            setTimeout(function() {
                setupUploadHandler();
            }, 100);
        });
        
        // 其他模态框触发器
        $('#pw-add-category-btn').on('click', function(e) {
            e.preventDefault();
            MicroModal.show('pw-add-category-modal');
        });
        
        $('#pw-manage-category-btn').on('click', function(e) {
            e.preventDefault();
            MicroModal.show('pw-manage-category-modal');
        });
        
        // Edit Design 按钮处理
        $(document).on('click', '.pw-edit-design-btn', function(e) {
            e.preventDefault();
            const designId = $(this).data('design-id');
            openEditDesignModal(designId);
        });
        
        // Add Tag 按钮处理
        $(document).on('click', '.pw-add-tag-button', function(e) {
            e.preventDefault();
            const designId = $(this).data('design-id');
            openTagModal(designId);
        });
        
        // 设置上传处理器
        function setupUploadHandler() {
            const $fileInput = $('#pw-design-image');
            $('#pw-remove-image').off('click.upload');
            
            // 文件选择处理
            $fileInput.off('change.upload').on('change.upload', function(e) {
                e.stopPropagation();
                
                if (this.files && this.files.length > 0) {
                    const file = this.files[0];
                    
                    // // 验证文件类型
                    // const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
                    // if (!allowedTypes.includes(file.type)) {
                    //     alert('请选择图片文件 (JPG, PNG, GIF)');
                    //     this.value = '';
                    //     return;
                    // }
                    
                    // // 验证文件大小 (5MB)
                    // if (file.size > 5 * 1024 * 1024) {
                    //     alert('文件太大，请选择小于5MB的图片');
                    //     this.value = '';
                    //     return;
                    // }
                    
                    // 显示预览
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        $('#pw-preview-img').attr('src', e.target.result);
                        $('#pw-file-name').text(file.name);
                        $('#pw-upload-placeholder').hide();
                        $('#pw-image-preview').show();
                    };
                    reader.readAsDataURL(file);
                }
            });
            
            // 移除图片
            $('#pw-remove-image').off('click.upload').on('click.upload', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                $fileInput.val('');
                $('#pw-image-preview').hide();
                $('#pw-upload-placeholder').show();
            });
        }
        
        // 文件选择处理
        $(document).on('change', '#pw-design-image', function(e) {
            e.stopPropagation();
            
            if (this.files && this.files.length > 0) {
                const file = this.files[0];
                
                // 验证文件类型
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
                if (!allowedTypes.includes(file.type)) {
                    alert('Please select an image file (JPG, PNG, GIF)');
                    this.value = '';
                    return;
                }
                
                // 验证文件大小 (5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert('File too large, please select an image smaller than 5MB');
                    this.value = '';
                    return;
                }
                
                // 显示预览
                const reader = new FileReader();
                reader.onload = function(e) {
                    $('#pw-preview-img').attr('src', e.target.result);
                    $('#pw-file-name').text(file.name);
                    $('#pw-upload-placeholder').hide();
                    $('#pw-image-preview').show();
                };
                reader.readAsDataURL(file);
            }
        });
        
        // 移除图片
        $(document).on('click', '#pw-remove-image', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            $('#pw-design-image').val('');
            $('#pw-image-preview').hide();
            $('#pw-upload-placeholder').show();
        });
        
        // 分类设置按钮点击事件
        $(document).on('click', '.pw-category-settings-btn', function(e) {
            e.preventDefault();
            const categoryId = $(this).data('category-id');
            
            // 加载分类数据
            $.ajax({
                url: pw_admin_vars.ajaxurl,
                type: 'POST',
                data: {
                    action: 'pw_get_category_settings',
                    category_id: categoryId,
                    nonce: pw_admin_vars.nonce
                },
                success: function(response) {
                    if (response.success) {
                        $('#pw-settings-category-id').val(categoryId);
                        $('#pw-settings-category-name').val(response.data.name);
                        $('#pw-settings-category-type').val(response.data.type || 'general');
                        $('#pw-exclude-from-export').prop('checked', response.data.exclude_from_export || false);
                        $('#pw-layer-depth').val(response.data.layer_depth || -1);
                        $('#pw-scale-mode').val(response.data.scale_mode || 'fit');
                        
                        MicroModal.show('pw-category-settings-modal');
                    } else {
                        alert('Failed to load category settings: ' + response.data);
                    }
                },
                error: function() {
                    alert('An error occurred while loading category settings');
                }
            });
        });
        
        // 分类删除按钮点击事件
        $(document).on('click', '.pw-category-delete-btn', function(e) {
            e.preventDefault();
            const categoryId = $(this).data('category-id');
            const categoryName = $(this).closest('.pw-category-item').find('.pw-category-name-input').val();
            
            if (confirm('Are you sure you want to delete category "' + categoryName + '"? This action cannot be undone.')) {
                $.ajax({
                    url: pw_admin_vars.ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'pw_delete_category',
                        category_id: categoryId,
                        nonce: pw_admin_vars.nonce
                    },
                    success: function(response) {
                        if (response.success) {
                            alert('Category deleted successfully!');
                            location.reload();
                        } else {
                            alert('Delete failed: ' + response.data);
                        }
                    },
                    error: function() {
                        alert('An error occurred while deleting category');
                    }
                });
            }
        });
        
        // 设计表单提交处理
        $(document).on('submit', '#pw-add-design-form', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            formData.append('action', 'pw_add_design');
            
            // 检查nonce字段是否已经在FormData中（通过new FormData(this)自动添加）
            let nonceExists = false;
            for (let [key, value] of formData.entries()) {
                if (key === 'pw_add_design_nonce_field') {
                    nonceExists = true;
                    break;
                }
            }
            
            // 如果nonce不存在，手动添加
            if (!nonceExists) {
                const nonceField = this.querySelector('input[name="pw_add_design_nonce_field"]');
                if (nonceField) {
                    formData.append('pw_add_design_nonce_field', nonceField.value);
                }
            }
            
            const $submitBtn = $('#pw-add-design-submit');
            $submitBtn.prop('disabled', true).text('Adding...');
            

            
            $.ajax({
                url: pw_design_vars.ajaxurl,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    if (response.success) {
                        alert('Design added successfully!');
                        MicroModal.close('pw-add-design-modal');
                        location.reload();
                    } else {
                        alert('Add failed: ' + response.data);
                    }
                },
                error: function(xhr, status, error) {
                    alert('An error occurred while adding: ' + error);
                },
                complete: function() {
                    $submitBtn.prop('disabled', false).text('Add Design');
                }
            });
        });
        
        // 分类表单提交处理
        $(document).on('submit', '#pw-add-category-form', function(e) {
            
            e.preventDefault();
            
            if (typeof pw_admin_vars === 'undefined') {
                alert('Configuration error: pw_admin_vars is undefined');
                return;
            }
            
            const formData = $(this).serialize();
            const $submitBtn = $('#pw-add-category-submit');
            
            
            
            $submitBtn.prop('disabled', true).text('Adding...');
            
            $.ajax({
                url: pw_admin_vars.ajaxurl,
                type: 'POST',
                data: formData + '&action=pw_add_category&nonce=' + pw_admin_vars.nonce,
                success: function(response) {
                    
                    if (response.success) {
                        alert('Category added successfully!');
                        MicroModal.close('pw-add-category-modal');
                        location.reload();
                    } else {
                        alert('Add failed: ' + response.data);
                    }
                },
                error: function(xhr, status, error) {
                    alert('An error occurred while adding: ' + error);
                },
                complete: function() {
                    $submitBtn.prop('disabled', false).text('Add Category');
                }
            });
        });
        
        // 分类提交按钮点击处理（防止默认表单提交）
        $(document).on('click', '#pw-add-category-submit', function(e) {
            
            e.preventDefault();
            e.stopPropagation();
            $('#pw-add-category-form').trigger('submit');
            return false;
        });
        
        // 阻止模态框内的点击事件冒泡
        $(document).on('click', '.modal__container', function(e) {
            e.stopPropagation();
        });
        
        // 为所有带有 data-micromodal-close 属性的元素添加关闭事件
        $(document).on('click', '[data-micromodal-close]', function(e) {
            e.preventDefault();
            const modal = $(this).closest('.modal');
            const modalId = modal.attr('id');
            if (modalId) {
                MicroModal.close(modalId);
            }
        });
        
        // 只有点击遮罩层才关闭模态框
        $(document).on('click', '.modal__overlay', function(e) {
            if (e.target === this) {
                const modalId = $(this).closest('.modal').attr('id');
                if (modalId) {
                    MicroModal.close(modalId);
                }
            }
        });
        
        // Select All Designs functionality
        $(document).on('change', '#pw-select-all-designs', function() {
            const isChecked = $(this).is(':checked');
            $('.pw-design-checkbox').prop('checked', isChecked);
            toggleDeleteButton();
        });
        
        // Individual checkbox change handler
        $(document).on('change', '.pw-design-checkbox', function() {
            const totalCheckboxes = $('.pw-design-checkbox').length;
            const checkedCheckboxes = $('.pw-design-checkbox:checked').length;
            
            $('#pw-select-all-designs').prop('checked', totalCheckboxes === checkedCheckboxes);
            toggleDeleteButton();
        });
        
        // Toggle delete and bulk update button visibility based on selection
        function toggleDeleteButton() {
            const hasSelection = $('.pw-design-checkbox:checked').length > 0;
            $('#pw-delete-selected-designs').toggle(hasSelection);
            $('#pw-bulk-update-designs').toggle(hasSelection);
        }
        
        // Bulk delete functionality
        $(document).on('click', '#pw-delete-selected-designs', function() {
            const selectedDesigns = $('.pw-design-checkbox:checked').map(function() {
                return $(this).val();
            }).get();
            
            if (selectedDesigns.length === 0) {
                alert('Please select designs to delete');
                return;
            }
            
            if (confirm('Are you sure you want to delete the selected ' + selectedDesigns.length + ' designs? This action cannot be undone.')) {
                const $deleteBtn = $(this);
                $deleteBtn.prop('disabled', true).text('Deleting...');
                
                $.ajax({
                    url: pw_admin_vars.ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'pw_bulk_delete_designs',
                        design_ids: selectedDesigns,
                        nonce: pw_admin_vars.nonce
                    },
                    success: function(response) {
                        if (response.success) {
                            alert('Successfully deleted ' + response.data.deleted + ' designs');
                            location.reload();
                        } else {
                            alert('Delete failed: ' + response.data);
                        }
                    },
                    error: function() {
                        alert('An error occurred while deleting');
                    },
                    complete: function() {
                        $deleteBtn.prop('disabled', false).text('Delete Selected');
                    }
                });
            }
        });
        
        // Bulk update functionality
        $(document).on('click', '#pw-bulk-update-designs', function() {
            const selectedDesigns = $('.pw-design-checkbox:checked').map(function() {
                return $(this).val();
            }).get();
            
            if (selectedDesigns.length === 0) {
                alert('Please select designs to update');
                return;
            }
            
            // 更新选中数量显示
            $('#pw-selected-count').text(selectedDesigns.length);
            
            // 设置选中的设计ID到隐藏字段
            $('#pw-selected-design-ids').val(selectedDesigns.join(','));
            
            // 重置表单
            $('#pw-bulk-update-form')[0].reset();
            $('#pw-selected-design-ids').val(selectedDesigns.join(','));
            $('#pw-selected-count').text(selectedDesigns.length);
            
            // 显示弹窗
            if (typeof MicroModal !== 'undefined') {
                MicroModal.show('pw-bulk-update-modal');
            } else {
            }
        });
         
         // Bulk update form submission
         $(document).on('submit', '#pw-bulk-update-form', function(e) {
             e.preventDefault();
             
             const formData = new FormData(this);
             formData.append('action', 'pw_bulk_update_designs');
             formData.append('nonce', pwDesignManagement.bulkUpdateNonce);
             
             // 显示加载状态
             const submitButton = $(this).find('input[type="submit"]');
             const originalText = submitButton.val();
             submitButton.val('Updating...').prop('disabled', true);
             
             $.ajax({
                 url: pwDesignManagement.ajaxUrl,
                 type: 'POST',
                 data: formData,
                 processData: false,
                 contentType: false,
                 success: function(response) {
                     if (response.success) {
                         alert('Bulk update successful!');
                         // 关闭弹窗
                         if (typeof MicroModal !== 'undefined') {
                             MicroModal.close('pw-bulk-update-modal');
                         }
                         // 刷新页面以显示更新后的数据
                         location.reload();
                     } else {
                         alert('Update failed: ' + (response.data || 'Unknown error'));
                     }
                 },
                 error: function(xhr, status, error) {
                     alert('Request failed, please try again later');
                 },
                 complete: function() {
                     // 恢复按钮状态
                     submitButton.val(originalText).prop('disabled', false);
                 }
             });
         });
         
         // Initialize checkbox states on page load
         toggleDeleteButton();
        
        
    });
    
    /**
     * 打开标签管理模态框
     */
    function openTagModal(designId) {
        $('#pw-tag-modal-design-id').val(designId);
        
        // 加载标签数据
        $.ajax({
            url: pw_design_vars.ajaxurl,
            type: 'POST',
            data: {
                action: 'pw_get_design_tags',
                design_id: designId,
                nonce: pw_design_vars.nonce
            },
            beforeSend: function() {
                $('#pw-tag-modal-body').html('<div class="loading">Loading...</div>');
            },
            success: function(response) {
                if (response.success) {
                    $('#pw-tag-modal-body').html(response.data);
                    MicroModal.show('pw-tag-modal');
                } else {
                    alert('Failed to load tags: ' + response.data);
                }
            },
            error: function() {
                alert('An error occurred while loading tags');
            }
        });
    }
    
    /**
     * 更新设计标签显示
     */
    function updateDesignTagsDisplay(designId) {
        $.ajax({
            url: pw_design_vars.ajaxurl,
            type: 'POST',
            data: {
                action: 'pw_get_design_tags',
                design_id: designId,
                nonce: pw_design_vars.nonce
            },
            success: function(response) {
                if (response.success) {
                    // 解析返回的HTML，提取标签名称
                    const $html = $(response.data);
                    const tagNames = [];
                    $html.find('input[type="checkbox"]:checked').each(function() {
                        const label = $(this).parent().text().trim();
                        tagNames.push(label);
                    });
                    
                    // 更新界面显示
                    const $tagContainer = $('.pw-design-tags[data-design-id="' + designId + '"]');
                    if (tagNames.length > 0) {
                        $tagContainer.html('<span class="pw-tags-label">Tags: </span>' + tagNames.join(' '));
                    } else {
                        $tagContainer.html('');
                    }
                }
            }
        });
    }

    /**
     * 保存设计标签
     */
    function saveDesignTags() {
        const designId = $('#pw-tag-modal-design-id').val();
        const selectedTags = [];
        
        $('#pw-tag-modal-body input[type="checkbox"]:checked').each(function() {
            selectedTags.push($(this).val());
        });

        $.ajax({
            url: pw_design_vars.ajaxurl,
            type: 'POST',
            data: {
                action: 'pw_save_design_tags',
                design_id: designId,
                tags: selectedTags,
                nonce: pw_design_vars.nonce
            },
            beforeSend: function() {
                $('#pw-tag-modal-save').prop('disabled', true).text('Saving...');
            },
            success: function(response) {
                if (response.success) {
                    MicroModal.close('pw-tag-modal');
                    alert('Tags saved successfully!');
                    // 更新界面上的标签显示
                    updateDesignTagsDisplay(designId);
                } else {
                    alert('Save failed: ' + response.data);
                }
            },
            error: function() {
                alert('An error occurred while saving');
            },
            complete: function() {
                $('#pw-tag-modal-save').prop('disabled', false).text('Save Changes');
            }
        });
    }
    
    // 绑定标签保存按钮事件
    $(document).on('click', '#pw-tag-modal-save', function(e) {
        e.preventDefault();
        saveDesignTags();
    });

    /**
     * 打开编辑设计模态框
     */
    function openEditDesignModal(designId) {
        
        
        // 获取设计数据
        $.ajax({
            url: pw_admin_ajax.ajaxurl,
            type: 'POST',
            data: {
                action: 'pw_get_design_data',
                design_id: designId,
                nonce: pw_admin_ajax.nonce
            },
            beforeSend: function() {
                // 显示加载状态
                $('#pw-edit-design-modal .modal__content').html('<div style="text-align:center; padding:40px;"><span class="spinner is-active"></span><p>Loading design data...</p></div>');
                MicroModal.show('pw-edit-design-modal');
            },
            success: function(response) {
                
                if (response.success) {
                    populateEditForm(response.data);
                } else {
                    alert('Error loading design data: ' + response.data);
                    MicroModal.close('pw-edit-design-modal');
                }
            },
            error: function(xhr, status, error) {
                alert('Failed to load design data');
                MicroModal.close('pw-edit-design-modal');
            }
        });
    }

    /**
     * 填充编辑表单
     */
    function populateEditForm(designData) {
        
        
        // 恢复原始表单内容
        $('#pw-edit-design-modal .modal__content').html(`
            <form id="pw-edit-design-form">
                <input type="hidden" name="pw_edit_design_nonce_field" value="${pw_admin_ajax.nonce}">
                <input type="hidden" id="pw-edit-design-id" name="design_id" value="${designData.id}">
                
                <!-- 分类选择 -->
                <div class="pw-form-field" style="margin-bottom:20px;">
                    <label for="pw-edit-design-category" style="display:block; margin-bottom:8px; font-weight:600; color:#333;">Design Category</label>
                    <select id="pw-edit-design-category" name="design_category" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; font-size:14px;">
                        <option value="">Select Category</option>
                        ${designData.categories.map(cat => `<option value="${cat.id}" ${cat.id == designData.current_category ? 'selected' : ''}>${cat.name}</option>`).join('')}
                    </select>
                </div>
                
                <!-- 启用设置 -->
                <div class="pw-form-field" style="margin-bottom:20px;">
                    <label style="display:block; margin-bottom:8px; font-weight:600; color:#333;">Enable Setting</label>
                    <div class="pw-toggle-container" style="display:flex; align-items:center; margin-bottom:10px;">
                        <input type="checkbox" id="pw-edit-design-enabled" name="design_enabled" value="1" style="display:none;" ${designData.enabled ? 'checked' : ''}>
                        <label for="pw-edit-design-enabled" class="pw-toggle-switch" style="position:relative; display:inline-block; width:50px; height:24px; background-color:#ccc; border-radius:24px; cursor:pointer; transition:background-color 0.3s;">
                            <span class="pw-toggle-slider" style="position:absolute; top:2px; left:2px; width:20px; height:20px; background-color:white; border-radius:50%; transition:transform 0.3s;"></span>
                        </label>
                        <span class="pw-toggle-text" style="margin-left:10px; font-weight:600; color:#333;">${designData.enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <small style="color:#666; font-size:12px; display:block;">Toggle to enable/disable this design setting</small>
                    
                    <!-- 高级设置 -->
                    <div id="advanced-settings" style="margin-top:20px; padding:15px; border:1px solid #e0e0e0; border-radius:4px; background-color:#f9f9f9; ${designData.enabled ? 'display:block;' : 'display:none;'}">
                        <h4 style="margin:0 0 15px 0; color:#333; font-size:14px;">Advanced Settings</h4>
                        
                        <!-- Tab Navigation -->
                        <div class="pw-tabs-nav" style="display:flex; border-bottom:2px solid #f0f0f0; margin-bottom:15px; background:#f9f9f9; border-radius:4px 4px 0 0;">
                            <button type="button" class="pw-tab-btn active" data-tab="initial-state" style="flex:1; padding:8px 15px; border:none; background:#fff; cursor:pointer; border-bottom:3px solid #007cba; color:#007cba; font-weight:600; border-radius:4px 0 0 0; font-size:12px;">Initial State</button>
                            <button type="button" class="pw-tab-btn" data-tab="operation-config" style="flex:1; padding:8px 15px; border:none; background:#f9f9f9; cursor:pointer; border-bottom:3px solid transparent; color:#666; font-weight:500; font-size:12px;">Operation Config</button>
                            <button type="button" class="pw-tab-btn" data-tab="price" style="flex:1; padding:8px 15px; border:none; background:#f9f9f9; cursor:pointer; border-bottom:3px solid transparent; color:#666; font-weight:500; border-radius:0 4px 0 0; font-size:12px;">Price</button>
                        </div>
                        
                        <!-- Tab Content -->
                        <div class="pw-tab-content" style="min-height:200px; padding:15px; border:1px solid #f0f0f0; border-radius:0 0 4px 4px; background:#fff;">
                            <!-- Initial State Tab -->
                            <div id="tab-initial-state" class="pw-tab-panel active" style="display:block;">
                                <div class="pw-form-field" style="margin-bottom:15px;">
                                    <label style="display:flex; align-items:center; cursor:pointer; margin-bottom:10px;">
                                        <input type="checkbox" id="edit-design-exclude-export" name="design_exclude_export" value="1" style="margin-right:8px;" ${designData.exclude_export ? 'checked' : ''}>
                                        <span style="font-weight:600; color:#333; font-size:13px;">Exclude From Export</span>
                                    </label>
                                </div>
                                
                                <div class="pw-form-field" style="margin-bottom:15px;">
                                    <label for="edit-design-layer-depth" style="display:block; margin-bottom:5px; font-weight:600; color:#333; font-size:13px;">Layer Depth</label>
                                    <input type="number" id="edit-design-layer-depth" name="design_layer_depth" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px; font-size:13px;" value="${designData.layer_depth || 1}" min="1">
                                </div>
                                
                                <div class="pw-form-field">
                                    <label for="edit-design-scale-mode" style="display:block; margin-bottom:5px; font-weight:600; color:#333; font-size:13px;">Scale Mode</label>
                                    <select id="edit-design-scale-mode" name="design_scale_mode" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px; font-size:13px;">
                                        <option value="fit" ${(designData.scale_mode || 'fit') === 'fit' ? 'selected' : ''}>Fit</option>
                                        <option value="fill" ${designData.scale_mode === 'fill' ? 'selected' : ''}>Fill</option>
                                        <option value="stretch" ${designData.scale_mode === 'stretch' ? 'selected' : ''}>Stretch</option>
                                        <option value="none" ${designData.scale_mode === 'none' ? 'selected' : ''}>None</option>
                                    </select>
                                </div>
                            </div>
                            
                            <!-- Operation Config Tab -->
                            <div id="tab-operation-config" class="pw-tab-panel" style="display:none;">
                                <div class="pw-form-field" style="margin-bottom:15px;">
                                    <label style="display:flex; align-items:center; cursor:pointer; margin-bottom:10px;">
                                        <input type="checkbox" id="edit-design-stay-on-top" name="design_stay_on_top" value="1" style="margin-right:8px;" ${designData.stay_on_top ? 'checked' : ''}>
                                        <span style="font-weight:600; color:#333; font-size:13px;">Stay On Top</span>
                                    </label>
                                </div>
                                
                                <div class="pw-form-field" style="margin-bottom:15px;">
                                    <div style="display:flex; align-items:center; justify-content:space-between;">
                                        <span style="font-weight:600; color:#333; font-size:13px;">Auto-Select</span>
                                        <div class="pw-toggle-container" style="display:flex; align-items:center;">
                                            <input type="checkbox" id="edit-design-auto-select" name="design_auto_select" value="1" style="display:none;" ${designData.auto_select ? 'checked' : ''}>
                                            <label for="edit-design-auto-select" class="pw-toggle-switch-small" style="position:relative; display:inline-block; width:30px; height:16px; background-color:${designData.auto_select ? '#007cba' : '#ccc'}; border-radius:16px; cursor:pointer; transition:background-color 0.3s;">
                                                <span class="pw-toggle-slider-small" style="position:absolute; top:2px; left:2px; width:12px; height:12px; background-color:white; border-radius:50%; transition:transform 0.3s; transform:${designData.auto_select ? 'translateX(14px)' : 'translateX(0)'}"></span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="pw-form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:15px;">
                                    <div class="pw-form-field">
                                        <label style="display:flex; align-items:center; cursor:pointer;">
                                            <input type="checkbox" id="edit-design-rotatable" name="design_rotatable" value="1" style="margin-right:8px;" ${designData.rotatable ? 'checked' : ''}>
                                            <span style="font-weight:600; color:#333; font-size:11px;">ROTATABLE</span>
                                        </label>
                                    </div>
                                    <div class="pw-form-field">
                                        <label style="display:flex; align-items:center; cursor:pointer;">
                                            <input type="checkbox" id="edit-design-removable" name="design_removable" value="1" style="margin-right:8px;" ${designData.removable ? 'checked' : ''}>
                                            <span style="font-weight:600; color:#333; font-size:11px;">REMOVABLE</span>
                                        </label>
                                    </div>
                                </div>
                                
                                <div class="pw-form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:15px;">
                                    <div class="pw-form-field">
                                        <label style="display:flex; align-items:center; cursor:pointer;">
                                            <input type="checkbox" id="edit-design-movable" name="design_movable" value="1" style="margin-right:8px;" ${designData.movable ? 'checked' : ''}>
                                            <span style="font-weight:600; color:#333; font-size:11px;">MOVABLE</span>
                                        </label>
                                    </div>
                                    <div class="pw-form-field">
                                        <label style="display:flex; align-items:center; cursor:pointer;">
                                            <input type="checkbox" id="edit-design-scalable" name="design_scalable" value="1" style="margin-right:8px;" ${designData.scalable ? 'checked' : ''}>
                                            <span style="font-weight:600; color:#333; font-size:11px;">SCALABLE</span>
                                        </label>
                                    </div>
                                </div>
                                
                                <div class="pw-form-field" style="margin-bottom:15px;">
                                    <label style="display:flex; align-items:center; cursor:pointer;">
                                        <input type="checkbox" id="edit-design-proportional-scaling" name="design_proportional_scaling" value="1" style="margin-right:8px;" ${designData.proportional_scaling ? 'checked' : ''}>
                                        <span style="font-weight:600; color:#333; font-size:11px;">ALLOW UNPROPORTIONAL SCALING</span>
                                    </label>
                                </div>
                                
                                <div class="pw-form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                                    <div class="pw-form-field">
                                        <label for="edit-design-scale-by" style="display:block; margin-bottom:5px; font-weight:600; color:#333; font-size:11px;">SCALE BY</label>
                                        <select id="edit-design-scale-by" name="design_scale_by" style="width:100%; padding:6px; border:1px solid #ddd; border-radius:4px; font-size:11px;">
                                            <option value="factor" ${(designData.scale_by || 'factor') === 'factor' ? 'selected' : ''}>Factor</option>
                                            <option value="percentage" ${designData.scale_by === 'percentage' ? 'selected' : ''}>Percentage</option>
                                            <option value="pixels" ${designData.scale_by === 'pixels' ? 'selected' : ''}>Pixels</option>
                                        </select>
                                    </div>
                                    <div class="pw-form-field">
                                        <label for="edit-design-min-scale-limit" style="display:block; margin-bottom:5px; font-weight:600; color:#333; font-size:11px;">Min Scale Limit</label>
                                        <input type="number" id="edit-design-min-scale-limit" name="design_min_scale_limit" style="width:100%; padding:6px; border:1px solid #ddd; border-radius:4px; font-size:11px;" value="${designData.min_scale_limit || 0.2}" min="0" max="10" step="0.1">
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Price Tab -->
                            <div id="tab-price" class="pw-tab-panel" style="display:none;">
                                <div class="pw-form-field" style="margin-bottom:15px;">
                                    <label for="edit-design-price" style="display:block; margin-bottom:5px; font-weight:600; color:#333; font-size:13px;">Price</label>
                                    <input type="number" id="edit-design-price" name="design_price" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px; font-size:13px;" value="${designData.price || 0}" min="0" step="0.01">
                                </div>
                                
                                <div class="pw-form-field">
                                    <label for="edit-design-sku" style="display:block; margin-bottom:5px; font-weight:600; color:#333; font-size:13px;">SKU</label>
                                    <input type="text" id="edit-design-sku" name="design_sku" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px; font-size:13px;" placeholder="Enter SKU" value="${designData.sku || ''}">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        `);
        
        // 初始化主切换开关
        initToggleSwitch();
        
        // 初始化小型切换开关
        initToggleSwitches();
        
        // 初始化选项卡功能
        initTabSwitching();
        
        // 绑定表单提交事件
        bindEditFormSubmit();
    }
    
    /**
     * 初始化切换开关功能
     */
    function initToggleSwitch() {
        const toggleInput = $('#pw-edit-design-enabled');
        const toggleSwitch = $('.pw-toggle-switch');
        const toggleSlider = $('.pw-toggle-slider');
        const toggleText = $('.pw-toggle-text');
        const advancedSettings = $('#advanced-settings');
        
        // 设置初始状态
        updateToggleState();
        
        // 绑定点击事件
        toggleSwitch.off('click').on('click', function(e) {
            e.preventDefault();
            toggleInput.prop('checked', !toggleInput.prop('checked'));
            updateToggleState();
        });
        
        // 更新切换开关状态
        function updateToggleState() {
            const isChecked = toggleInput.prop('checked');
            
            // 更新开关样式
            if (isChecked) {
                toggleSwitch.css('background-color', '#4CAF50');
                toggleSlider.css('transform', 'translateX(26px)');
                toggleText.text('Enabled');
                advancedSettings.slideDown(300);
            } else {
                toggleSwitch.css('background-color', '#ccc');
                toggleSlider.css('transform', 'translateX(0)');
                toggleText.text('Disabled');
                advancedSettings.slideUp(300);
            }
        }
    }

    /**
     * 绑定编辑表单提交事件
     */
    function bindEditFormSubmit() {
        $('#pw-edit-design-submit').off('click').on('click', function(e) {
            e.preventDefault();
            
            
            const formData = new FormData($('#pw-edit-design-form')[0]);
            formData.append('action', 'pw_update_design_meta');
            formData.append('nonce', pw_admin_ajax.nonce);
            
            $.ajax({
                url: pw_admin_ajax.ajaxurl,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                beforeSend: function() {
                    $('#pw-edit-design-submit').prop('disabled', true).text('Updating...');
                },
                success: function(response) {
                    
                    if (response.success) {
                        alert('Design updated successfully!');
                        MicroModal.close('pw-edit-design-modal');
                        // 刷新页面或更新显示
                        location.reload();
                    } else {
                        alert('Error: ' + response.data);
                    }
                },
                error: function(xhr, status, error) {
                    alert('Failed to update design');
                },
                complete: function() {
                    $('#pw-edit-design-submit').prop('disabled', false).text('Update Design');
                }
            });
        });
    }

    /**
     * 初始化选项卡切换功能
     */
    function initTabSwitching() {
        $(document).on('click', '.pw-tab-btn', function() {
            const targetTab = $(this).data('tab');
            
            // Update tab buttons
            $('.pw-tab-btn').removeClass('active').css({
                'background': '#f9f9f9',
                'border-bottom': '3px solid transparent',
                'color': '#666',
                'font-weight': '500'
            });
            
            $(this).addClass('active').css({
                'background': '#fff',
                'border-bottom': '3px solid #007cba',
                'color': '#007cba',
                'font-weight': '600'
            });
            
            // Update tab panels
            $('.pw-tab-panel').removeClass('active').hide();
            $('#tab-' + targetTab).addClass('active').show();
        });
    }

    /**
     * 初始化小型切换开关功能
     */
    function initToggleSwitches() {
        $(document).on('change', 'input[type="checkbox"]', function() {
            const $toggle = $(this).siblings('.pw-toggle-switch-small');
            const $slider = $toggle.find('.pw-toggle-slider-small');
            
            if ($(this).is(':checked')) {
                $toggle.css('background-color', '#007cba');
                $slider.css('transform', 'translateX(14px)');
            } else {
                $toggle.css('background-color', '#ccc');
                $slider.css('transform', 'translateX(0)');
            }
        });
    }

    // Initialize all functionality when document is ready
    $(document).ready(function() {
        initTabSwitching();
        initToggleSwitches();
    });

})(jQuery);
