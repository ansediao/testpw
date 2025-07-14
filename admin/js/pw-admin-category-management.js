/**
 * Category Management JavaScript
 * Handles category management modals and interactions
 */

(function($) {
    'use strict';

    $(document).ready(function() {
        
        // 打开分类管理弹窗
        $('#pw-manage-category-btn').on('click', function(e) {
            e.preventDefault();
            $('#pw-manage-category-modal').show();
        });

        // 关闭分类管理弹窗
        $('.pw-modal-close').on('click', function(e) {
            e.preventDefault();
            $('#pw-manage-category-modal').hide();
            $('#pw-category-settings-modal').hide();
        });
        
        // 点击模态框外部关闭
        $('.pw-modal-overlay').on('click', function(e) {
            if (e.target === this) {
                $('#pw-manage-category-modal').hide();
                $('#pw-category-settings-modal').hide();
            }
        });
        
        // Cancel按钮关闭弹窗
        $('#pw-settings-cancel').on('click', function(e) {
            e.preventDefault();
            $('#pw-category-settings-modal').hide();
        });

        // 分类名称输入字符计数
        $(document).on('input keyup paste', '.pw-category-name-input', function() {
            var $input = $(this);
            var length = $input.val().length;
            var $charCount = $input.parent().find('.pw-category-char-count');
            $charCount.text('(' + length + ')');
            
            // 如果超过限制，添加警告样式
            if (length > 60) {
                $charCount.css('color', '#dc3232');
                $input.css('border-color', '#dc3232');
            } else {
                $charCount.css('color', '#666');
                $input.css('border-color', '#ddd');
            }
        });
        
        // 页面加载时初始化字符计数
        $('.pw-category-name-input').each(function() {
            var length = $(this).val().length;
            $(this).parent().find('.pw-category-char-count').text('(' + length + ')');
        });
        
        // 打开分类设置弹窗
        $(document).on('click', '.pw-category-settings-btn', function(e) {
            e.preventDefault();
            var categoryId = $(this).data('category-id');
            var categoryName = $(this).closest('.pw-category-item').find('.pw-category-name-input').val();
            
            // 填充表单数据
            $('#pw-category-settings-modal input[name="category_name"]').val(categoryName);
            $('#pw-category-settings-modal').data('category-id', categoryId).show();
        });

        // 分类设置标签页切换
        $('.pw-settings-tab').on('click', function() {
            var target = $(this).data('tab');
            
            // 更新标签页状态
            $('.pw-settings-tab').removeClass('active');
            $(this).addClass('active');
            
            // 显示对应内容
            $('.pw-tab-content').hide();
            $('#' + target).show();
        });

        // 保存分类设置
        $('#pw-settings-save').on('click', function() {
            var $button = $(this);
            var categoryId = $('#pw-category-settings-modal').data('category-id');
            var categoryName = $('#pw-settings-category-name').val();
            var categoryType = $('#pw-settings-category-type').val();
            var excludeFromExport = $('#pw-exclude-from-export').is(':checked');
            var layerDepth = $('#pw-layer-depth').val();
            var scaleMode = $('#pw-scale-mode').val();

            $button.prop('disabled', true).text('Saving...');

            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'pw_update_category_settings',
                    category_id: categoryId,
                    category_name: categoryName,
                    category_type: categoryType,
                    exclude_from_export: excludeFromExport ? 1 : 0,
                    layer_depth: layerDepth,
                    scale_mode: scaleMode,
                    nonce: pw_admin_vars.nonce
                },
                success: function(response) {
                    if (response.success) {
                        alert('Category settings saved successfully!');
                        // 更新列表中的分类名称
                        $('.pw-category-item[data-category-id="' + categoryId + '"] .pw-category-name-input').val(categoryName);
                        $('#pw-category-settings-modal').hide();
                    } else {
                        alert('Error: ' + response.data);
                    }
                },
                error: function() {
                    alert('An error occurred while saving category settings.');
                },
                complete: function() {
                    $button.prop('disabled', false).text('Save');
                }
            });
        });

        // 删除分类
        $(document).on('click', '.pw-category-delete-btn', function() {
            var categoryId = $(this).data('category-id');
            var categoryName = $(this).closest('.pw-category-item').find('.pw-category-name-input').val();
            
            if (confirm('Are you sure you want to delete the category "' + categoryName + '"?')) {
                $.ajax({
                    url: ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'pw_delete_category',
                        category_id: categoryId,
                        nonce: pw_admin_vars.nonce
                    },
                    success: function(response) {
                        if (response.success) {
                            // 从列表中移除该项
                            $('.pw-category-item[data-category-id="' + categoryId + '"]').remove();
                            
                            // 如果没有分类了，显示提示信息
                            if ($('.pw-category-item').length === 0) {
                                $('.pw-category-items').html('<p style="text-align:center; color:#666; padding:20px;">No categories found.</p>');
                            }
                            
                            alert('Category deleted successfully!');
                        } else {
                            alert('Error: ' + response.data);
                        }
                    },
                    error: function() {
                        alert('An error occurred while deleting the category.');
                    }
                });
            }
        });

    });

})(jQuery);