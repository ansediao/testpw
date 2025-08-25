/**
 * Category Management JavaScript
 * Handles category management modals and interactions
 */

(function($) {
    'use strict';

    $(document).ready(function() {
        
        // 这些功能现在由 micromodal 处理
        // 不再使用 jQuery 直接显示/隐藏模态框

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
        
        // 打开分类设置弹窗 - 现在由 micromodal 处理
        $(document).on('click', '.pw-category-settings-btn', function(e) {
            e.preventDefault();
            var categoryId = $(this).data('category-id');
            
            // 获取分类设置数据
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'pw_get_category_settings',
                    category_id: categoryId,
                    nonce: pw_admin_vars.nonce
                },
                success: function(response) {
                    if (response.success) {
                        var data = response.data;
                        
                        // 填充基本信息
                        $('#pw-settings-category-id').val(categoryId);
                        $('#pw-settings-category-name').val(data.name);
                        $('#pw-settings-category-description').val(data.description);
                        $('#pw-settings-category-type').val(data.type);
                        
                        // Initial State Tab
                        $('#pw-settings-exclude-from-export').prop('checked', data.exclude_from_export);
                        $('#pw-settings-layer-depth').val(data.layer_depth);
                        $('#pw-settings-scale-mode').val(data.scale_mode);
                        
                        // Operation Config Tab
                        $('#pw-settings-allow-resize').prop('checked', data.allow_resize);
                        $('#pw-settings-allow-rotate').prop('checked', data.allow_rotate);
                        $('#pw-settings-allow-delete').prop('checked', data.allow_delete);
                        
                        // Price Tab
                        $('#pw-settings-base-price').val(data.base_price);
                        $('#pw-settings-price-per-unit').val(data.price_per_unit);
                        $('#pw-settings-price-enabled').prop('checked', data.price_enabled);
                        
                        // 使用 micromodal 打开设置弹窗
                        MicroModal.show('pw-category-settings-modal');
                    } else {
                        alert('获取分类设置失败: ' + response.data);
                    }
                },
                error: function() {
                    alert('获取分类设置时发生错误');
                }
            });
        });

        // 分类设置标签页切换
        $(document).on('click', '.pw-tab-btn', function() {
            const targetTab = $(this).data('tab');
            
            // 更新标签页状态
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
            
            // 更新标签页内容
            $('.pw-tab-panel').removeClass('active').hide();
            $('#tab-' + targetTab).addClass('active').show();
        });

        // 保存分类设置
        $('#pw-settings-save').on('click', function() {
            var $button = $(this);
            var categoryId = $('#pw-settings-category-id').val();
            var categoryName = $('#pw-settings-category-name').val();
            var categoryDescription = $('#pw-settings-category-description').val();
            var categoryType = $('#pw-settings-category-type').val();
            
            // Initial State Tab
            var excludeFromExport = $('#pw-exclude-from-export').is(':checked');
            var layerDepth = $('#pw-layer-depth').val();
            var scaleMode = $('#pw-scale-mode').val();
            
            // Operation Config Tab
            var allowResize = $('#pw-allow-resize').is(':checked');
            var allowRotate = $('#pw-allow-rotate').is(':checked');
            var allowDelete = $('#pw-allow-delete').is(':checked');
            
            // Price Tab
            var basePrice = $('#pw-base-price').val();
            var pricePerUnit = $('#pw-price-per-unit').val();
            var priceEnabled = $('#pw-price-enabled').is(':checked');

            $button.prop('disabled', true).text('Saving...');

            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'pw_update_category_settings',
                    category_id: categoryId,
                    category_name: categoryName,
                    category_description: categoryDescription,
                    category_type: categoryType,
                    exclude_from_export: excludeFromExport ? 1 : 0,
                    layer_depth: layerDepth,
                    scale_mode: scaleMode,
                    allow_resize: allowResize ? 1 : 0,
                    allow_rotate: allowRotate ? 1 : 0,
                    allow_delete: allowDelete ? 1 : 0,
                    base_price: basePrice,
                    price_per_unit: pricePerUnit,
                    price_enabled: priceEnabled ? 1 : 0,
                    nonce: pw_admin_vars.nonce
                },
                success: function(response) {
                    if (response.success) {
                        alert('Category settings saved successfully!');
                        // 更新列表中的分类名称
                        $('.pw-category-item[data-category-id="' + categoryId + '"] .pw-category-name-input').val(categoryName);
                        MicroModal.close('pw-category-settings-modal');
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