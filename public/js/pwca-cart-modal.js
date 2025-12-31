/**
 * 购物车设计预览弹窗模块
 * 处理 .pwca-draft-link 点击事件，显示弹窗而非直接跳转
 * 
 * @version 1.0.0
 * @author PW Canvas Team
 */

(function($) {
    'use strict';

    /**
     * 购物车弹窗控制器类
     */
    class PwcaCartModal {
        constructor() {
            this.modalId = 'pwca-design-modal';
            this.isModalOpen = false;
            
            this.init();
        }

        /**
         * 初始化弹窗功能
         */
        init() {
            this.createModalHTML();
            this.bindEvents();
        }

        /**
         * 创建弹窗 HTML 结构
         */
        createModalHTML() {
            // 避免重复创建
            if ($('#' + this.modalId).length > 0) {
                return;
            }

            const modalHTML = `
                <div id="${this.modalId}" class="pwca-modal" role="dialog" aria-labelledby="pwca-modal-title" aria-hidden="true">
                    <div class="pwca-modal-overlay" aria-hidden="true"></div>
                    <div class="pwca-modal-container">
                        <div class="pwca-modal-header">
                            <h3 id="pwca-modal-title" class="pwca-modal-title">设计预览</h3>
                            <button type="button" class="pwca-modal-close" aria-label="关闭弹窗">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="pwca-modal-body">
                            <div class="pwca-modal-loading">
                                <div class="pwca-spinner"></div>
                                <p>加载中...</p>
                            </div>
                            <div class="pwca-modal-content">
                                <iframe id="pwca-modal-iframe" src="" frameborder="0" allowfullscreen></iframe>
                            </div>
                            <div class="pwca-modal-error" style="display: none;">
                                <p>加载失败，请重试</p>
                                <button type="button" class="pwca-retry-btn">重试</button>
                            </div>
                        </div>
                        <div class="pwca-modal-footer">
                            <button type="button" class="pwca-btn pwca-btn-secondary pwca-modal-close">关闭</button>
                            <a href="#" target="_blank" class="pwca-btn pwca-btn-primary" id="pwca-open-editor">在新窗口中编辑</a>
                        </div>
                    </div>
                </div>
            `;

            $('body').append(modalHTML);
        }

        /**
         * 绑定事件监听器
         */
        bindEvents() {
            // 拦截 .pwca-draft-link 的点击事件
            $(document).on('click', '.pwca-draft-link', (e) => {
                e.preventDefault();
                const targetUrl = $(e.currentTarget).attr('href');
                if (targetUrl) {
                    this.openModal(targetUrl);
                }
            });

            // 关闭弹窗事件 - 关闭按钮
            $(document).on('click', '.pwca-modal-close', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeModal();
            });
            
            // 关闭弹窗事件 - 遮罩层
            $(document).on('click', '.pwca-modal-overlay', (e) => {
                this.closeModal();
            });

            // ESC 键关闭弹窗
            $(document).on('keydown', (e) => {
                if (e.key === 'Escape' && this.isModalOpen) {
                    this.closeModal();
                }
            });

            // 重试按钮
            $(document).on('click', '.pwca-retry-btn', () => {
                this.retryLoad();
            });

            // 阻止弹窗内容区域的点击事件冒泡
            $(document).on('click', '.pwca-modal-container', (e) => {
                e.stopPropagation();
            });
        }

        /**
         * 打开弹窗
         */
        openModal(url) {
            const $modal = $('#' + this.modalId);
            const $iframe = $('#pwca-modal-iframe');
            const $openEditorBtn = $('#pwca-open-editor');
            
            // 显示弹窗
            $modal.addClass('pwca-modal-open').attr('aria-hidden', 'false');
            $('body').addClass('pwca-modal-body-lock');
            this.isModalOpen = true;
            
            // 显示加载状态
            this.showLoading();
            
            // 设置编辑按钮链接
            $openEditorBtn.attr('href', url);
            
            // 清除之前的事件监听
            $iframe.off('load error');
            
            // 绑定 iframe 加载事件
            $iframe.on('load', () => {
                this.handleIframeLoad();
            });
            
            $iframe.on('error', () => {
                this.handleIframeError();
            });
            
            // 设置加载超时
            this.loadTimeout = setTimeout(() => {
                // 超时后直接显示内容
                this.handleIframeLoad();
            }, 3000);
            
            // 设置 iframe 源
            $iframe.attr('src', url);
            
            // 焦点管理
            $modal.find('.pwca-modal-close').first().focus();
            
            // 额外的检查机制
            this.checkIframeStatus();
        }

        /**
         * 关闭弹窗
         */
        closeModal() {
            const $modal = $('#' + this.modalId);
            const $iframe = $('#pwca-modal-iframe');
            
            // 隐藏弹窗
            $modal.removeClass('pwca-modal-open').attr('aria-hidden', 'true');
            $('body').removeClass('pwca-modal-body-lock');
            
            // 清理 iframe
            setTimeout(() => {
                $iframe.attr('src', '');
            }, 300); // 等待动画完成
            
            this.isModalOpen = false;
            
            // 清理超时
            if (this.loadTimeout) {
                clearTimeout(this.loadTimeout);
                this.loadTimeout = null;
            }
        }

        /**
         * 显示加载状态
         */
        showLoading() {
            const $modal = $('#' + this.modalId);
            $modal.find('.pwca-modal-loading').show();
            $modal.find('.pwca-modal-content').hide();
            $modal.find('.pwca-modal-error').hide();
        }

        /**
         * 显示内容
         */
        showContent() {
            const $modal = $('#' + this.modalId);
            $modal.find('.pwca-modal-loading').hide();
            $modal.find('.pwca-modal-content').show();
            $modal.find('.pwca-modal-error').hide();
        }

        /**
         * 显示错误状态
         */
        showError() {
            const $modal = $('#' + this.modalId);
            $modal.find('.pwca-modal-loading').hide();
            $modal.find('.pwca-modal-content').hide();
            $modal.find('.pwca-modal-error').show();
        }

        /**
         * 处理 iframe 加载完成
         */
        handleIframeLoad() {
            if (this.loadTimeout) {
                clearTimeout(this.loadTimeout);
                this.loadTimeout = null;
            }
            
            this.showContent();
        }

        /**
         * 处理 iframe 加载错误
         */
        handleIframeError() {
            if (this.loadTimeout) {
                clearTimeout(this.loadTimeout);
                this.loadTimeout = null;
            }
            
            this.showError();
        }

        /**
         * 重试加载
         */
        retryLoad() {
            const $iframe = $('#pwca-modal-iframe');
            const currentSrc = $iframe.attr('src');
            
            if (currentSrc) {
                this.showLoading();
                
                // 重新绑定事件
                $iframe.off('load error');
                $iframe.on('load', () => {
                    this.handleIframeLoad();
                });
                $iframe.on('error', () => {
                    this.handleIframeError();
                });
                
                // 重新设置 src 触发重新加载
                $iframe.attr('src', '');
                setTimeout(() => {
                    $iframe.attr('src', currentSrc);
                }, 100);
                
                // 重新设置超时
                this.loadTimeout = setTimeout(() => {
                    this.handleIframeError();
                }, 10000);
            }
        }

        /**
         * 检查 iframe 状态的辅助方法
         */
        checkIframeStatus() {
            if (!this.isModalOpen || !this.loadTimeout) {
                return;
            }
            
            const $iframe = $('#pwca-modal-iframe');
            const iframe = $iframe[0];
            
            if (!iframe) {
                return;
            }
            
            // 检查 iframe 是否有内容
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                if (doc && doc.readyState === 'complete') {
                    this.handleIframeLoad();
                    return;
                }
            } catch (e) {
                // 跨域情况，延迟显示内容
                setTimeout(() => {
                    if (this.isModalOpen && this.loadTimeout) {
                        this.handleIframeLoad();
                    }
                }, 2000);
                return;
            }
            
            // 继续检查
            setTimeout(() => {
                this.checkIframeStatus();
            }, 500);
        }
    }

    // 全局初始化
    window.PwcaCartModal = PwcaCartModal;
    
    // 页面加载完成后自动初始化
    $(document).ready(function() {
        window.pwcaCartModal = new PwcaCartModal();
    });

})(jQuery);