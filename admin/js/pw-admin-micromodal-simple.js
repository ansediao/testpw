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
        
        // 设置上传处理器
        function setupUploadHandler() {
            const $fileInput = $('#pw-design-image');
            $('#pw-remove-image').off('click.upload');
            
            // 文件选择处理
            $fileInput.off('change.upload').on('change.upload', function(e) {
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
        
        // 设计表单提交处理
        $(document).on('submit', '#pw-add-design-form', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            formData.append('action', 'pw_add_design');
            
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
        
        // 只有点击遮罩层才关闭模态框
        $(document).on('click', '.modal__overlay', function(e) {
            if (e.target === this) {
                const modalId = $(this).closest('.modal').attr('id');
                if (modalId) {
                    MicroModal.close(modalId);
                }
            }
        });
        
        console.log('Simple Modal Handler initialized');
    });

})(jQuery);