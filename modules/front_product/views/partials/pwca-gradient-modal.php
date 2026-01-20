<?php
/**
 * 渐变色选择弹窗组件
 * 
 * 这是一个可重用的渐变色选择弹窗组件，提供颜色选择和方向设置功能
 * 
 * @package PW_Admin
 * @subpackage Public/Partials
 * @since 1.0.0
 */
 
// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}
?>
 
<div id="gradient-color-modal" class="modal pwca-gradient-modal" aria-hidden="true">
    <div class="modal__overlay" tabindex="-1">
        <div class="modal__container pwca-gradient-modal-content" role="dialog" aria-modal="true" aria-labelledby="pwca-gradient-modal-title">
            <header>
                <h3 id="pwca-gradient-modal-title" class="modal__title pwca-gradient-modal-title">选择渐变色</h3>
                <button id="close-gradient-color-modal" class="modal__close pwca-gradient-modal-close" aria-label="关闭">&times;</button>
            </header>

            <div class="modal__content">
                <div class="gradient-section">
                    <div class="gradient-colors-container color-groups-container">
                        <div class="gradient-colors-column color-group">
                            <label class="gradient-colors-label">颜色 1:</label>
                            <div class="color-options color-swatches">
                                <div class="color-option color-swatch" data-color="#ff0000"></div>
                                <div class="color-option color-swatch" data-color="#00ff00"></div>
                                <div class="color-option color-swatch" data-color="#0000ff"></div>
                                <div class="color-option color-swatch" data-color="#ffff00"></div>
                                <div class="color-option color-swatch" data-color="#ff00ff"></div>
                                <div class="color-option color-swatch" data-color="#00ffff"></div>
                                <div class="color-option color-swatch" data-color="#ffffff"></div>
                                <div class="color-option color-swatch" data-color="#000000"></div>
                            </div>
                            <input type="hidden" id="gradientColor1" value="#ff0000" />
                        </div>

                        <div class="gradient-colors-column color-group">
                            <label class="gradient-colors-label">颜色 2:</label>
                            <div class="color-options color-swatches">
                                <div class="color-option color-swatch" data-color="#ff0000"></div>
                                <div class="color-option color-swatch" data-color="#00ff00"></div>
                                <div class="color-option color-swatch" data-color="#0000ff"></div>
                                <div class="color-option color-swatch" data-color="#ffff00"></div>
                                <div class="color-option color-swatch" data-color="#ff00ff"></div>
                                <div class="color-option color-swatch" data-color="#00ffff"></div>
                                <div class="color-option color-swatch" data-color="#ffffff"></div>
                                <div class="color-option color-swatch" data-color="#000000"></div>
                            </div>
                            <input type="hidden" id="gradientColor2" value="#ffff00" />
                        </div>
                    </div>

                    <div class="gradient-direction-row">
                        <label for="gradientDirection" class="gradient-direction-label">方向:</label>
                        <select id="gradientDirection" class="gradient-direction-select">
                            <option value="to right">从左到右</option>
                            <option value="to bottom">从上到下</option>
                            <option value="to bottom right">从左上到右下</option>
                            <option value="to bottom left">从右上到左下</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="modal__footer">
                <button id="applyGradientColor" class="btn btn-primary btn-inquiry pwca-gradient-apply-btn">应用渐变色</button>
            </div>
        </div>
    </div>
</div>
 


