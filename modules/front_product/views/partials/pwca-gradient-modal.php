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
 
<div id="gradient-color-modal" class="pwca-gradient-modal">
    <div class="pwca-gradient-modal-content">
        <button id="close-gradient-color-modal" class="pwca-gradient-modal-close">&times;</button>
        <h3 class="pwca-gradient-modal-title">选择渐变色</h3>
        
        <div class="gradient-colors-container">
            <div class="gradient-colors-column">
                <label class="gradient-colors-label">颜色 1:</label>
                <div class="color-options">
                    <div class="color-option" data-color="#ff0000"></div>
                    <div class="color-option" data-color="#00ff00"></div>
                    <div class="color-option" data-color="#0000ff"></div>
                    <div class="color-option" data-color="#ffff00"></div>
                    <div class="color-option" data-color="#ff00ff"></div>
                    <div class="color-option" data-color="#00ffff"></div>
                    <div class="color-option" data-color="#ffffff"></div>
                    <div class="color-option" data-color="#000000"></div>
                </div>
                <input type="hidden" id="gradientColor1" value="#ff0000" />
            </div>
            
            <div class="gradient-colors-column">
                <label class="gradient-colors-label">颜色 2:</label>
                <div class="color-options">
                    <div class="color-option" data-color="#ff0000"></div>
                    <div class="color-option" data-color="#00ff00"></div>
                    <div class="color-option" data-color="#0000ff"></div>
                    <div class="color-option" data-color="#ffff00"></div>
                    <div class="color-option" data-color="#ff00ff"></div>
                    <div class="color-option" data-color="#00ffff"></div>
                    <div class="color-option" data-color="#ffffff"></div>
                    <div class="color-option" data-color="#000000"></div>
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
        
        <button id="applyGradientColor" class="btn btn-inquiry pwca-gradient-apply-btn">应用渐变色</button>
    </div>
</div>
 


