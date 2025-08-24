/**
 * 简化的模态框处理 - 专门解决上传区域点击问题
 */

(function($) {
    'use strict';

    $(document).ready(function() {
        console.log('Simple Modal Handler initializing...');
        console.log('pw_design_vars available:', typeof pw_design_vars !== 'undefined');
        console.log('pw_admin_vars available:', typeof pw_admin_vars !== 'undefined');
        
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
                    alert('请选择图片文件 (JPG, PNG, GIF)');
                    this.value = '';
                    return;
                }
                
                // 验证文件大小 (5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert('文件太大，请选择小于5MB的图片');
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
                        alert('加载分类设置失败: ' + response.data);
                    }
                },
                error: function() {
                    alert('加载分类设置时发生错误');
                }
            });
        });
        
        // 分类删除按钮点击事件
        $(document).on('click', '.pw-category-delete-btn', function(e) {
            e.preventDefault();
            const categoryId = $(this).data('category-id');
            const categoryName = $(this).closest('.pw-category-item').find('.pw-category-name-input').val();
            
            if (confirm('确定要删除分类 "' + categoryName + '" 吗？此操作不可恢复。')) {
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
                            alert('分类删除成功！');
                            location.reload();
                        } else {
                            alert('删除失败: ' + response.data);
                        }
                    },
                    error: function() {
                        alert('删除分类时发生错误');
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
            $submitBtn.prop('disabled', true).text('添加中...');
            

            
            $.ajax({
                url: pw_design_vars.ajaxurl,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    if (response.success) {
                        alert('设计添加成功！');
                        MicroModal.close('pw-add-design-modal');
                        location.reload();
                    } else {
                        alert('添加失败: ' + response.data);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('AJAX Error:', xhr.responseText);
                    alert('添加时发生错误: ' + error);
                },
                complete: function() {
                    $submitBtn.prop('disabled', false).text('Add Design');
                }
            });
        });
        
        // 分类表单提交处理
        $(document).on('submit', '#pw-add-category-form', function(e) {
            console.log('Category form submit triggered');
            e.preventDefault();
            
            if (typeof pw_admin_vars === 'undefined') {
                console.error('pw_admin_vars not available');
                alert('配置错误：pw_admin_vars 未定义');
                return;
            }
            
            const formData = $(this).serialize();
            const $submitBtn = $('#pw-add-category-submit');
            
            console.log('Form data:', formData);
            console.log('AJAX URL:', pw_admin_vars.ajaxurl);
            
            $submitBtn.prop('disabled', true).text('添加中...');
            
            $.ajax({
                url: pw_admin_vars.ajaxurl,
                type: 'POST',
                data: formData + '&action=pw_add_category&nonce=' + pw_admin_vars.nonce,
                success: function(response) {
                    console.log('Category AJAX response:', response);
                    if (response.success) {
                        alert('分类添加成功！');
                        MicroModal.close('pw-add-category-modal');
                        location.reload();
                    } else {
                        alert('添加失败: ' + response.data);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Category AJAX Error:', xhr.responseText);
                    alert('添加时发生错误: ' + error);
                },
                complete: function() {
                    $submitBtn.prop('disabled', false).text('Add Category');
                }
            });
        });
        
        // 分类提交按钮点击处理（防止默认表单提交）
        $(document).on('click', '#pw-add-category-submit', function(e) {
            console.log('Category submit button clicked');
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
        
        // Toggle delete button visibility based on selection
        function toggleDeleteButton() {
            const hasSelection = $('.pw-design-checkbox:checked').length > 0;
            $('#pw-delete-selected-designs').toggle(hasSelection);
        }
        
        // Bulk delete functionality
        $(document).on('click', '#pw-delete-selected-designs', function() {
            const selectedDesigns = $('.pw-design-checkbox:checked').map(function() {
                return $(this).val();
            }).get();
            
            if (selectedDesigns.length === 0) {
                alert('请选择要删除的设计');
                return;
            }
            
            if (confirm('确定要删除选中的 ' + selectedDesigns.length + ' 个设计吗？此操作不可恢复。')) {
                const $deleteBtn = $(this);
                $deleteBtn.prop('disabled', true).text('删除中...');
                
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
                            alert('成功删除 ' + response.data.deleted + ' 个设计');
                            location.reload();
                        } else {
                            alert('删除失败: ' + response.data);
                        }
                    },
                    error: function() {
                        alert('删除时发生错误');
                    },
                    complete: function() {
                        $deleteBtn.prop('disabled', false).text('Delete Selected');
                    }
                });
            }
        });
        
        // Initialize checkbox states on page load
        toggleDeleteButton();
        
        console.log('Simple Modal Handler initialized');
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
                $('#pw-tag-modal-body').html('<div class="loading">加载中...</div>');
            },
            success: function(response) {
                if (response.success) {
                    $('#pw-tag-modal-body').html(response.data);
                    MicroModal.show('pw-tag-modal');
                } else {
                    alert('加载标签失败: ' + response.data);
                }
            },
            error: function() {
                alert('加载标签时发生错误');
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
                $('#pw-tag-modal-save').prop('disabled', true).text('保存中...');
            },
            success: function(response) {
                if (response.success) {
                    MicroModal.close('pw-tag-modal');
                    alert('标签保存成功！');
                    // 更新界面上的标签显示
                    updateDesignTagsDisplay(designId);
                } else {
                    alert('保存失败: ' + response.data);
                }
            },
            error: function() {
                alert('保存时发生错误');
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

})(jQuery);