/**
 * 购物车数量调整按钮功能模块
 * 为 /custom-cart/ 页面提供数量控制功能
 * 
 * @version 1.0.0
 * @author PW Canvas Team
 */

(function($) {
    'use strict';

    // 数量控制配置
    const QUANTITY_CONFIG = {
        // 商品配置：步长和最小值
        products: [
            { step: 2, min: 9 },   // 第一项商品
            { step: 5, min: 29 },  // 第二项商品
            { step: 3, min: 19 },  // 第三项商品
        ],
        // 默认配置（其他商品）
        default: { step: 2, min: 5 },
        
        // 防抖延迟（毫秒）
        debounceDelay: 500,
        
        // 动画持续时间
        animationDuration: 300
    };

    /**
     * 购物车数量控制器类
     */
    class PwcaCartQuantityController {
        constructor() {
            this.isUpdating = false;
            this.updateQueue = new Map();
            this.debounceTimers = new Map();
            
            this.init();
        }

        /**
         * 初始化控制器
         */
        init() {
            this.bindEvents();
            this.replaceQuantityInputs();
            this.setupCartUpdateHandlers();
        }

        /**
         * 绑定事件监听器
         */
        bindEvents() {
            // 页面加载完成后初始化
            $(document).ready(() => {
                this.replaceQuantityInputs();
            });

            // WooCommerce 购物车更新后重新初始化
            $(document.body).on('updated_wc_div', () => {
                setTimeout(() => {
                    this.replaceQuantityInputs();
                }, 100);
            });

            // 处理数量按钮点击
            $(document).on('click', '.pwca-qty-btn', (e) => {
                e.preventDefault();
                this.handleQuantityButtonClick(e);
            });

            // 处理数量输入框变化
            $(document).on('input change', '.pwca-quantity-controls .quantity-input', (e) => {
                this.handleQuantityInputChange(e);
            });

            // 防止表单提交时的默认行为
            $(document).on('submit', '.woocommerce-cart-form', (e) => {
                if (this.isUpdating) {
                    e.preventDefault();
                    return false;
                }
            });
        }

        /**
         * 替换原有的数量输入框为带按钮的控件
         */
        replaceQuantityInputs() {
            const $quantityInputs = $('.woocommerce-cart-form .qty');
            
            $quantityInputs.each((index, input) => {
                const $input = $(input);
                
                // 避免重复处理
                if ($input.closest('.pwca-quantity-controls').length > 0) {
                    return;
                }

                const cartItemKey = this.getCartItemKey($input);
                const config = this.getQuantityConfig(index);
                const currentValue = parseInt($input.val()) || config.min;

                // 创建新的控件结构
                const $controls = this.createQuantityControls(cartItemKey, currentValue, config, index);
                
                // 替换原有输入框
                $input.replaceWith($controls);
            });
        }

        /**
         * 获取购物车项目键
         */
        getCartItemKey($input) {
            // 从 name 属性中提取 cart item key
            const name = $input.attr('name');
            if (name) {
                const match = name.match(/cart\[([^\]]+)\]\[qty\]/);
                return match ? match[1] : '';
            }
            
            // 备用方法：从最近的表单行中查找
            const $row = $input.closest('tr.cart_item');
            return $row.find('[name*="cart["][name*="][qty]"]').attr('name')?.match(/cart\[([^\]]+)\]/)?.[1] || '';
        }

        /**
         * 获取商品的数量配置
         */
        getQuantityConfig(index) {
            return QUANTITY_CONFIG.products[index] || QUANTITY_CONFIG.default;
        }

        /**
         * 创建数量控制组件
         */
        createQuantityControls(cartItemKey, currentValue, config, index) {
            const isMinValue = currentValue <= config.min;
            
            return $(`
                <div class="pwca-quantity-controls" data-cart-key="${cartItemKey}" data-product-index="${index}">
                    <button type="button" class="pwca-qty-btn minus" ${isMinValue ? 'disabled' : ''}>
                        <span>−</span>
                    </button>
                    <input type="number" 
                           class="quantity-input" 
                           name="cart[${cartItemKey}][qty]"
                           value="${currentValue}" 
                           min="${config.min}" 
                           step="${config.step}"
                           data-min="${config.min}"
                           data-step="${config.step}">
                    <button type="button" class="pwca-qty-btn plus">
                        <span>+</span>
                    </button>
                </div>
            `);
        }

        /**
         * 处理数量按钮点击
         */
        handleQuantityButtonClick(e) {
            const $button = $(e.currentTarget);
            const $controls = $button.closest('.pwca-quantity-controls');
            const $input = $controls.find('.quantity-input');
            const isPlus = $button.hasClass('plus');
            
            if ($button.prop('disabled') || this.isUpdating) {
                return;
            }

            const currentValue = parseInt($input.val()) || 0;
            const step = parseInt($input.data('step')) || 2;
            const min = parseInt($input.data('min')) || 5;
            
            let newValue;
            if (isPlus) {
                newValue = currentValue + step;
            } else {
                newValue = Math.max(currentValue - step, min);
            }

            this.updateQuantity($controls, newValue);
        }

        /**
         * 处理数量输入框变化
         */
        handleQuantityInputChange(e) {
            const $input = $(e.target);
            const $controls = $input.closest('.pwca-quantity-controls');
            const value = parseInt($input.val()) || 0;
            const min = parseInt($input.data('min')) || 5;
            
            // 验证并修正输入值
            const correctedValue = Math.max(value, min);
            if (correctedValue !== value) {
                $input.val(correctedValue);
            }

            this.updateQuantity($controls, correctedValue, true);
        }

        /**
         * 更新数量
         */
        updateQuantity($controls, newValue, fromInput = false) {
            const $input = $controls.find('.quantity-input');
            const cartKey = $controls.data('cart-key');
            const min = parseInt($input.data('min')) || 5;
            
            // 确保值不小于最小值
            newValue = Math.max(newValue, min);
            
            // 更新输入框值
            if (!fromInput) {
                $input.val(newValue);
            }
            
            // 更新按钮状态
            this.updateButtonStates($controls, newValue, min);
            
            // 防抖处理购物车更新
            this.debounceCartUpdate(cartKey, newValue);
        }

        /**
         * 更新按钮状态
         */
        updateButtonStates($controls, value, min) {
            const $minusBtn = $controls.find('.minus');
            const $plusBtn = $controls.find('.plus');
            
            // 更新减号按钮状态
            if (value <= min) {
                $minusBtn.prop('disabled', true);
                $controls.addClass('at-minimum');
            } else {
                $minusBtn.prop('disabled', false);
                $controls.removeClass('at-minimum');
            }
            
            // 加号按钮通常不需要禁用，除非有最大值限制
            $plusBtn.prop('disabled', false);
        }

        /**
         * 防抖处理购物车更新
         */
        debounceCartUpdate(cartKey, quantity) {
            // 清除之前的定时器
            if (this.debounceTimers.has(cartKey)) {
                clearTimeout(this.debounceTimers.get(cartKey));
            }
            
            // 设置新的定时器
            const timer = setTimeout(() => {
                this.updateCart(cartKey, quantity);
                this.debounceTimers.delete(cartKey);
            }, QUANTITY_CONFIG.debounceDelay);
            
            this.debounceTimers.set(cartKey, timer);
        }

        /**
         * 更新购物车
         */
        async updateCart(cartKey, quantity) {
            if (this.isUpdating) {
                this.updateQueue.set(cartKey, quantity);
                return;
            }

            this.isUpdating = true;
            const $controls = $(`.pwca-quantity-controls[data-cart-key="${cartKey}"]`);
            
            try {
                // 显示加载状态
                this.showLoadingState($controls);
                
                // 发送 AJAX 请求
                const response = await this.sendCartUpdateRequest(cartKey, quantity);
                
                if (response.success) {
                    // 更新成功，刷新购物车显示
                    this.handleUpdateSuccess($controls, response.data);
                } else {
                    // 更新失败，恢复原值
                    this.handleUpdateError($controls, response.data);
                }
                
            } catch (error) {
                console.error('购物车更新失败:', error);
                this.handleUpdateError($controls, { message: '网络错误，请重试' });
            } finally {
                this.hideLoadingState($controls);
                this.isUpdating = false;
                
                // 处理队列中的更新
                this.processUpdateQueue();
            }
        }

        /**
         * 发送购物车更新请求
         */
        sendCartUpdateRequest(cartKey, quantity) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: pwca_cart_ajax.ajax_url,
                    type: 'POST',
                    data: {
                        action: 'pwca_update_cart_quantity',
                        cart_key: cartKey,
                        quantity: quantity,
                        nonce: pwca_cart_ajax.nonce
                    },
                    success: resolve,
                    error: reject
                });
            });
        }

        /**
         * 显示加载状态
         */
        showLoadingState($controls) {
            $controls.find('.pwca-qty-btn').addClass('loading').prop('disabled', true);
            $controls.find('.quantity-input').prop('disabled', true);
        }

        /**
         * 隐藏加载状态
         */
        hideLoadingState($controls) {
            $controls.find('.pwca-qty-btn').removeClass('loading');
            $controls.find('.quantity-input').prop('disabled', false);
            
            // 重新计算按钮状态
            const value = parseInt($controls.find('.quantity-input').val()) || 0;
            const min = parseInt($controls.find('.quantity-input').data('min')) || 5;
            this.updateButtonStates($controls, value, min);
        }

        /**
         * 处理更新成功
         */
        handleUpdateSuccess($controls, data) {
            // 更新价格显示
            if (data.fragments) {
                this.updateCartFragments(data.fragments);
            }
            
            // 显示成功状态
            $controls.addClass('success');
            setTimeout(() => {
                $controls.removeClass('success');
            }, QUANTITY_CONFIG.animationDuration);
            
            // 触发自定义事件
            $(document.body).trigger('pwca_cart_quantity_updated', [data]);
        }

        /**
         * 处理更新错误
         */
        handleUpdateError($controls, data) {
            // 显示错误状态
            $controls.addClass('error');
            setTimeout(() => {
                $controls.removeClass('error');
            }, QUANTITY_CONFIG.animationDuration * 2);
            
            // 显示错误消息
            if (data.message) {
                this.showErrorMessage(data.message);
            }
            
            // 触发自定义事件
            $(document.body).trigger('pwca_cart_quantity_error', [data]);
        }

        /**
         * 更新购物车片段
         */
        updateCartFragments(fragments) {
            if (fragments && typeof fragments === 'object') {
                // 更新每个片段
                $.each(fragments, function(selector, content) {
                    const $elements = $(selector);
                    if ($elements.length > 0) {
                        // 如果是完整的HTML内容，替换整个元素
                        if (typeof content === 'string' && content.includes('<')) {
                            $elements.replaceWith(content);
                        } else {
                            // 如果是简单文本，更新内容
                            $elements.html(content);
                        }
                    }
                });
                
                // 触发 WooCommerce 标准事件
                $(document.body).trigger('wc_fragments_refreshed');
                $(document.body).trigger('updated_wc_div');
                $(document.body).trigger('updated_cart_totals');
                
                // 重新初始化数量控件（如果购物车表格被完全替换）
                setTimeout(() => {
                    this.replaceQuantityInputs();
                }, 100);
            }
        }

        /**
         * 显示错误消息
         */
        showErrorMessage(message) {
            // 可以集成现有的通知系统
            if (typeof wc_add_to_cart_params !== 'undefined') {
                // 使用 WooCommerce 通知
                $('.woocommerce-notices-wrapper').html(
                    `<div class="pwca-woocommerce-error">${message}</div>`
                );
            } else {
                // 简单的 alert 作为备用
                alert(message);
            }
        }

        /**
         * 处理更新队列
         */
        processUpdateQueue() {
            if (this.updateQueue.size > 0) {
                const [cartKey, quantity] = this.updateQueue.entries().next().value;
                this.updateQueue.delete(cartKey);
                
                // 延迟处理下一个更新
                setTimeout(() => {
                    this.updateCart(cartKey, quantity);
                }, 100);
            }
        }

        /**
         * 设置购物车更新处理器
         */
        setupCartUpdateHandlers() {
            // 监听 WooCommerce 购物车更新事件
            $(document.body).on('updated_wc_div', () => {
                // 重新初始化控件
                setTimeout(() => {
                    this.replaceQuantityInputs();
                }, 100);
            });
            
            // 监听购物车片段刷新事件
            $(document.body).on('wc_fragments_refreshed', () => {
                setTimeout(() => {
                    this.replaceQuantityInputs();
                }, 100);
            });
        }
    }

    // 全局初始化
    window.PwcaCartQuantityController = PwcaCartQuantityController;
    
    // 页面加载完成后自动初始化
    $(document).ready(function() {
        if (typeof pwca_cart_ajax !== 'undefined') {
            window.pwcaCartController = new PwcaCartQuantityController();
        }
    });

})(jQuery);