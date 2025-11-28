/**
 * Micromodal Integration for Design Management
 * Handles all modals using Micromodal.js
 */

(function($) {
    'use strict';

    // Micromodal配置
    const MODAL_CONFIG = {
        openClass: 'is-open',
        disableScroll: true,
        disableFocus: false,
        awaitOpenAnimation: false,
        awaitCloseAnimation: false,
        debugMode: false  // 关闭调试模式减少控制台输出
    };

    $(document).ready(function() {
        
        initMicromodal();
        bindModalTriggers();
        setupFormHandlers();
        setupImageUpload();
        
        // 添加调试事件监听器
        $(document).on('click', function(e) {
            if ($(e.target).closest('#pw-image-upload-area').length > 0) {
            }
            if ($(e.target).closest('.modal__overlay').length > 0) {
            }
        });
    });

    /**
     * 初始化Micromodal - 简化配置避免警告
     */
    function initMicromodal() {
        if (typeof MicroModal !== 'undefined') {
            
            // 使用最简配置，避免MicroModal警告
            try {
                MicroModal.init({
                    onShow: function(modal) {
                        
                        // 当模态框打开时，重新绑定上传事件
                        if (modal.id === 'pw-add-design-modal') {
                            setTimeout(() => {
                                setupImageUploadEvents();
                            }, 100);
                        }
                    },
                    onClose: function(modal) {
                    },
                    disableScroll: true,
                    awaitCloseAnimation: false,
                    awaitOpenAnimation: false
                });
            } catch (error) {
            }
            
            // 完全自定义点击处理逻辑
            document.querySelectorAll('.modal').forEach(modal => {
                const overlay = modal.querySelector('.modal__overlay');
                const container = modal.querySelector('.modal__container');
                
                if (overlay && container) {
                    // 移除默认的data-micromodal-close属性，防止自动关闭
                    overlay.removeAttribute('data-micromodal-close');
                    
                    // 阻止容器内所有点击事件冒泡到遮罩层
                    container.addEventListener('click', function(e) {
                        e.stopPropagation();
                    });
                    
                    // 只有直接点击遮罩层才关闭模态框
                    overlay.addEventListener('click', function(e) {
                        if (e.target === overlay) {
                            MicroModal.close(modal.id);
                        }
                    });
                }
                
                // 处理关闭按钮
                const closeButtons = modal.querySelectorAll('[data-micromodal-close]');
                closeButtons.forEach(button => {
                    button.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        MicroModal.close(modal.id);
                    });
                });
            });
        } else {
        }
    }

    /**
     * 绑定所有模态框触发器
     */
    function bindModalTriggers() {
        // Add Design 模态框
        $('#pw-add-design-btn').on('click', function(e) {
            e.preventDefault();
            MicroModal.show('pw-add-design-modal');
        });

        // Edit Design 模态框
        $(document).on('click', '.pw-edit-design-btn', function(e) {
            e.preventDefault();
            const designId = $(this).data('design-id');
            openEditDesignModal(designId);
        });

        // Add Category 模态框
        $('#pw-add-category-btn').on('click', function(e) {
            e.preventDefault();
            MicroModal.show('pw-add-category-modal');
        });

        // Manage Category 模态框
        $('#pw-manage-category-btn').on('click', function(e) {
            e.preventDefault();
            MicroModal.show('pw-manage-category-modal');
        });

        // Filter 模态框
        $('#pw-open-filter-modal').on('click', function(e) {
            e.preventDefault();
            MicroModal.show('pw-filter-modal');
        });

        // 标签管理模态框
        $(document).on('click', '.pw-add-tag-button', function(e) {
            e.preventDefault();
            const designId = $(this).data('design-id');
            openTagModal(designId);
        });

        // Category Settings 模态框
        $(document).on('click', '.pw-category-settings-btn', function(e) {
            e.preventDefault();
            const categoryId = $(this).data('category-id');
            openCategorySettingsModal(categoryId);
        });

        // 关闭按钮 - 使用更精确的选择器
        $(document).on('click', '.modal__close', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const modalId = $(this).closest('[id$="-modal"]').attr('id');
            MicroModal.close(modalId);
        });
        
        // 为设计模态框添加ESC键关闭功能
        $(document).on('keydown', function(e) {
            if (e.key === 'Escape' && $('#pw-add-design-modal').hasClass('is-open')) {
                MicroModal.close('pw-add-design-modal');
            }
        });
    }

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
     * 打开分类设置模态框
     */
    function openCategorySettingsModal(categoryId) {
        const categoryName = $(`.pw-category-item[data-category-id="${categoryId}"]`).find('.pw-category-name-input').val();
        
        // 填充表单数据
        $('#pw-settings-category-id').val(categoryId);
        $('#pw-settings-category-name').val(categoryName);
        
        // 加载其他设置
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
                    const settings = response.data;
                    $('#pw-settings-category-type').val(settings.category_type || 'general');
                    $('#pw-exclude-from-export').prop('checked', settings.exclude_from_export || false);
                    $('#pw-layer-depth').val(settings.layer_depth || -1);
                    $('#pw-scale-mode').val(settings.scale_mode || 'fit');
                    MicroModal.show('pw-category-settings-modal');
                }
            }
        });
    }

    /**
     * 设置表单处理器
     */
    function setupFormHandlers() {
        // Add Design 表单
        $('#pw-add-design-form').on('submit', function(e) {
            e.preventDefault();
            submitDesignForm();
        });

        // Add Category 表单
        $('#pw-add-category-form').on('submit', function(e) {
            e.preventDefault();
            submitCategoryForm();
        });

        // Category Settings 表单
        $('#pw-category-settings-form').on('submit', function(e) {
            e.preventDefault();
            submitCategorySettings();
        });

        // Tag Save 按钮
        $('#pw-tag-modal-save').on('click', saveDesignTags);
    }

    /**
     * 提交设计表单
     */
    function submitDesignForm() {
        const formData = new FormData($('#pw-add-design-form')[0]);
        formData.append('action', 'pw_add_design');
        
        // 注意：PHP期望的nonce字段名是pw_add_design_nonce_field，不是nonce
        // 但表单中已经有了这个字段，所以不需要额外添加

        $.ajax({
            url: pw_design_vars.ajaxurl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            beforeSend: function() {
                $('#pw-add-design-submit').prop('disabled', true).text('Adding...');
            },
            success: function(response) {
                if (response.success) {
                    MicroModal.close('pw-add-design-modal');
                    
                    showNotification('Design added successfully!', 'success');
                    
                    // 重置表单
                    $('#pw-add-design-form')[0].reset();
                    $('#pw-image-preview').hide();
                    $('#pw-upload-placeholder').show();
                    
                    // 刷新页面
                    setTimeout(() => location.reload(), 1000);
                } else {
                    showNotification('Add failed: ' + response.data, 'error');
                }
            },
            error: function(xhr, status, error) {
                let errorMessage = 'An error occurred while adding';
                
                try {
                    const errorResponse = JSON.parse(xhr.responseText);
                    if (errorResponse.data) {
                        errorMessage += ': ' + errorResponse.data;
                    }
                } catch (e) {
                    errorMessage += ': ' + error;
                }
                
                showNotification(errorMessage, 'error');
            },
            complete: function() {
                $('#pw-add-design-submit').prop('disabled', false).text('Add Design');
            }
        });
    }

    /**
     * 提交分类表单
     */
    function submitCategoryForm() {
        const formData = $('#pw-add-category-form').serialize();
        
        $.ajax({
            url: pw_admin_vars.ajaxurl,
            type: 'POST',
            data: formData + '&action=pw_add_category&nonce=' + pw_admin_vars.nonce,
            beforeSend: function() {
                $('#pw-add-category-submit').prop('disabled', true).text('Adding...');
            },
            success: function(response) {
                if (response.success) {
                    MicroModal.close('pw-add-category-modal');
                    alert('Category added successfully!');
                    location.reload();
                } else {
                    alert('Add failed: ' + response.data);
                }
            },
            error: function() {
                alert('An error occurred while adding');
            },
            complete: function() {
                $('#pw-add-category-submit').prop('disabled', false).text('Add Category');
            }
        });
    }

    /**
     * 保存分类设置
     */
    function submitCategorySettings() {
        const formData = $('#pw-category-settings-form').serialize();
        const categoryId = $('#pw-settings-category-id').val();
        
        $.ajax({
            url: pw_admin_vars.ajaxurl,
            type: 'POST',
            data: formData + '&action=pw_update_category_settings&category_id=' + categoryId + '&nonce=' + pw_admin_vars.nonce,
            beforeSend: function() {
                $('#pw-settings-save').prop('disabled', true).text('Saving...');
            },
            success: function(response) {
                if (response.success) {
                    MicroModal.close('pw-category-settings-modal');
                    alert('Settings saved successfully!');
                    location.reload();
                } else {
                    alert('Save failed: ' + response.data);
                }
            },
            error: function() {
                alert('An error occurred while saving');
            },
            complete: function() {
                $('#pw-settings-save').prop('disabled', false).text('Save');
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

    /**
     * 设置图片上传 - 初始化
     */
    function setupImageUpload() {
        setupImageUploadEvents();
    }

    /**
     * 绑定图片上传事件 - 可重复调用
     */
    function setupImageUploadEvents() {
        const $uploadArea = $('#pw-image-upload-area');
        const $fileInput = $('#pw-design-image');
        const $modalContainer = $('#pw-add-design-modal .modal__container');

        // 先解绑之前的事件，避免重复绑定
        $uploadArea.off('click.imageUpload dragover.imageUpload dragleave.imageUpload drop.imageUpload');
        $fileInput.off('change.imageUpload');
        $('#pw-remove-image').off('click.imageUpload');
        $modalContainer.off('click.modalProtection');
        
        // 在模态框容器级别阻止所有点击事件冒泡
        $modalContainer.on('click.modalProtection', function(e) {
            e.stopPropagation();
        });

        // 点击上传区域 - 完全阻止事件冒泡防止弹窗关闭
        $uploadArea.on('click.imageUpload', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation(); // 阻止所有其他事件处理器
            
            // 直接触发文件输入点击
            const fileInput = document.getElementById('pw-design-image');
            if (fileInput) {
                fileInput.click();
            }
            
            return false; // 确保事件完全停止
        });

        // 拖拽上传
        $uploadArea.on('dragover.imageUpload', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).addClass('dragover');
        });

        $uploadArea.on('dragleave.imageUpload', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).removeClass('dragover');
        });

        $uploadArea.on('drop.imageUpload', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).removeClass('dragover');
            
            const files = e.originalEvent.dataTransfer.files;
            if (files.length > 0) {
                handleFileUpload(files[0]);
            }
        });

        // 文件选择 - 阻止事件冒泡保持模态框打开
        $fileInput.on('change.imageUpload', function(e) {
            e.stopPropagation();
            if (this.files.length > 0) {
                handleFileUpload(this.files[0]);
            }
        });

        // 移除图片 - 阻止事件冒泡
        $('#pw-remove-image').on('click.imageUpload', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            $fileInput.val('');
            $('#pw-image-preview').hide();
            $('#pw-upload-placeholder').show();
            return false;
        });
        
        // 为上传区域内的所有子元素添加事件阻止
        $uploadArea.find('*').on('click.imageUpload', function(e) {
            e.stopPropagation();
            e.stopImmediatePropagation();
        });

        function handleFileUpload(file) {
            
            // 验证文件类型
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                showNotification('Please select an image file (JPG, PNG, GIF)', 'error');
                return;
            }
            
            // 验证文件大小 (5MB)
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                showNotification('File too large, please select an image smaller than 5MB', 'error');
                return;
            }

            // 显示加载状态
            $uploadArea.addClass('pw-loading');
            
            const reader = new FileReader();
            reader.onload = function(e) {
                $('#pw-preview-img').attr('src', e.target.result);
                $('#pw-file-name').text(file.name + ' (' + formatFileSize(file.size) + ')');
                $('#pw-upload-placeholder').hide();
                $('#pw-image-preview').show();
                $uploadArea.removeClass('pw-loading');
                
                showNotification('Image uploaded successfully', 'success');
            };
            
            reader.onerror = function() {
                showNotification('An error occurred while reading the file', 'error');
                $uploadArea.removeClass('pw-loading');
            };
            
            reader.readAsDataURL(file);
        }
        
        // 格式化文件大小
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
    }

    // 添加Micromodal样式
    const micromodalStyles = `
        <style>
        /* Micromodal基础样式 */
        .modal {
            display: none;
        }
        
        .modal.is-open {
            display: block;
        }
        
        .modal__overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 100000;
        }
        
        .modal__container {
            background-color: #fff;
            padding: 30px;
            max-width: 90vw;
            max-height: 90vh;
            border-radius: 8px;
            overflow-y: auto;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            position: relative;
            animation: fadeInScale 0.2s ease-out;
        }
        
        @keyframes fadeInScale {
            from {
                opacity: 0;
                transform: scale(0.9);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
        
        .modal__header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 1px solid #eee;
            padding-bottom: 15px;
        }
        
        .modal__title {
            margin: 0;
            font-size: 1.5em;
            color: #333;
        }
        
        .modal__close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .modal__close:hover {
            color: #000;
        }
        
        /* 防止body滚动 */
        .modal-open {
            overflow: hidden;
        }
        
        /* 响应式设计 */
        @media (max-width: 768px) {
            .modal__container {
                margin: 10px;
                padding: 20px;
                max-width: calc(100vw - 20px);
            }
        }
        
        /* 防止模态框意外关闭 */
        #pw-add-design-modal .modal__overlay {
            pointer-events: none;
        }
        
        #pw-add-design-modal .modal__container {
            pointer-events: auto;
        }
        
        #pw-add-design-modal .modal__close {
            pointer-events: auto;
        }
        </style>
    `;
    
    $('head').append(micromodalStyles);

    /**
     * 显示通知消息
     */
    function showNotification(message, type = 'info') {
        // 移除现有通知
        $('.pw-notification').remove();
        
        const notificationClass = type === 'success' ? 'notice-success' : 
                                 type === 'error' ? 'notice-error' : 'notice-info';
        
        const notification = $(`
            <div class="notice ${notificationClass} is-dismissible pw-notification" style="position: fixed; top: 32px; right: 20px; z-index: 100001; max-width: 400px;">
                <p>${message}</p>
                <button type="button" class="notice-dismiss">
                    <span class="screen-reader-text">Dismiss this notice.</span>
                </button>
            </div>
        `);
        
        $('body').append(notification);
        
        // 添加关闭按钮功能
        notification.find('.notice-dismiss').on('click', function() {
            notification.fadeOut(300, function() {
                $(this).remove();
            });
        });
        
        // 自动消失
        setTimeout(() => {
            notification.fadeOut(300, function() {
                $(this).remove();
            });
        }, 5000);
    }

    /**
     * 打开编辑设计模态框
     */
    function openEditDesignModal(designId) {
        // 获取设计数据
        $.ajax({
            url: ajaxurl,
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
                    showNotification('Error loading design data: ' + response.data, 'error');
                    MicroModal.close('pw-edit-design-modal');
                }
            },
            error: function() {
                showNotification('Failed to load design data', 'error');
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
                
                <!-- 设计名称 -->
                <div class="pw-form-field" style="margin-bottom:20px;">
                    <label for="pw-edit-design-name" style="display:block; margin-bottom:8px; font-weight:600; color:#333;">Design Name</label>
                    <input type="text" id="pw-edit-design-name" name="design_name" required style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; font-size:14px;" value="${designData.name}">
                </div>
                
                <!-- 设计描述 -->
                <div class="pw-form-field" style="margin-bottom:20px;">
                    <label for="pw-edit-design-description" style="display:block; margin-bottom:8px; font-weight:600; color:#333;">Description</label>
                    <textarea id="pw-edit-design-description" name="design_description" rows="4" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; font-size:14px; resize:vertical;" placeholder="Enter design description...">${designData.description || ''}</textarea>
                </div>
                
                <!-- 分类选择 -->
                <div class="pw-form-field" style="margin-bottom:20px;">
                    <label for="pw-edit-design-category" style="display:block; margin-bottom:8px; font-weight:600; color:#333;">Design Category</label>
                    <select id="pw-edit-design-category" name="design_category" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; font-size:14px;">
                        <option value="">Select Category</option>
                        ${designData.categories.map(cat => `<option value="${cat.id}" ${cat.id == designData.current_category ? 'selected' : ''}>${cat.name}</option>`).join('')}
                    </select>
                </div>
                
                <!-- 标签管理 -->
                <div class="pw-form-field" style="margin-bottom:20px;">
                    <label for="pw-edit-design-tags" style="display:block; margin-bottom:8px; font-weight:600; color:#333;">Tags</label>
                    <input type="text" id="pw-edit-design-tags" name="design_tags" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; font-size:14px;" placeholder="Enter tags separated by commas..." value="${designData.tags || ''}">
                    <small style="color:#666; font-size:12px; margin-top:5px; display:block;">Separate multiple tags with commas</small>
                </div>
                
                <!-- 启用设置 -->
                <div class="pw-form-field" style="margin-bottom:20px;">
                    <label style="display:flex; align-items:center; cursor:pointer;">
                        <input type="checkbox" id="pw-edit-design-enabled" name="design_enabled" value="1" style="margin-right:8px;" ${designData.enabled ? 'checked' : ''}>
                        <span style="font-weight:600; color:#333;">Enable Setting</span>
                    </label>
                    <small style="color:#666; font-size:12px; margin-top:5px; display:block;">Check to enable this design setting</small>
                </div>
            </form>
        `);
        
        // 绑定表单提交事件
        bindEditFormSubmit();
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
                url: ajaxurl,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                beforeSend: function() {
                    $('#pw-edit-design-submit').prop('disabled', true).text('Updating...');
                },
                success: function(response) {
                    if (response.success) {
                        showNotification('Design updated successfully!', 'success');
                        MicroModal.close('pw-edit-design-modal');
                        // 刷新页面或更新显示
                        location.reload();
                    } else {
                        showNotification('Error: ' + response.data, 'error');
                    }
                },
                error: function() {
                    showNotification('Failed to update design', 'error');
                },
                complete: function() {
                    $('#pw-edit-design-submit').prop('disabled', false).text('Update Design');
                }
            });
        });
    }

})(jQuery);
