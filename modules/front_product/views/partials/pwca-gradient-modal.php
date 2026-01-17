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
 
<div id="gradient-color-modal" class="pwca-gradient-modal" style="display:none; position:fixed; left:0; top:0; width:100vw; height:100vh; background:rgba(0,0,0,0.3); z-index:9999; align-items:center; justify-content:center;">
    <div class="pwca-gradient-modal-content" style="background:#fff; border-radius:8px; max-width:400px; width:90vw; padding:1rem; position:relative;">
        <button id="close-gradient-color-modal" class="pwca-gradient-modal-close" style="position:absolute; right:0.5rem; top:0.5rem; background:none; border:none; font-size:1.5rem; cursor:pointer;">&times;</button>
        <h3 style="margin-top:0;">选择渐变色</h3>
        
        <div class="gradient-colors-container" style="display:flex; gap:1rem; margin-bottom:1rem;">
            <div style="flex:1;">
                <label style="display:block; margin-bottom:0.5rem;">颜色 1:</label>
                <div class="color-options" style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                    <div class="color-option" data-color="#ff0000" style="width:40px; height:40px; background:#ff0000; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#00ff00" style="width:40px; height:40px; background:#00ff00; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#0000ff" style="width:40px; height:40px; background:#0000ff; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#ffff00" style="width:40px; height:40px; background:#ffff00; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#ff00ff" style="width:40px; height:40px; background:#ff00ff; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#00ffff" style="width:40px; height:40px; background:#00ffff; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#ffffff" style="width:40px; height:40px; background:#ffffff; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#000000" style="width:40px; height:40px; background:#000000; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                </div>
                <input type="hidden" id="gradientColor1" value="#ff0000" />
            </div>
            
            <div style="flex:1;">
                <label style="display:block; margin-bottom:0.5rem;">颜色 2:</label>
                <div class="color-options" style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                    <div class="color-option" data-color="#ff0000" style="width:40px; height:40px; background:#ff0000; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#00ff00" style="width:40px; height:40px; background:#00ff00; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#0000ff" style="width:40px; height:40px; background:#0000ff; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#ffff00" style="width:40px; height:40px; background:#ffff00; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#ff00ff" style="width:40px; height:40px; background:#ff00ff; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#00ffff" style="width:40px; height:40px; background:#00ffff; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#ffffff" style="width:40px; height:40px; background:#ffffff; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                    <div class="color-option" data-color="#000000" style="width:40px; height:40px; background:#000000; border:2px solid #ddd; border-radius:4px; cursor:pointer; transition:border-color 0.2s;"></div>
                </div>
                <input type="hidden" id="gradientColor2" value="#ffff00" />
            </div>
        </div>
        
        <div style="margin-bottom:1rem;">
            <label for="gradientDirection" style="display:block; margin-bottom:0.5rem;">方向:</label>
            <select id="gradientDirection" style="width:100%; padding:0.5rem;">
                <option value="to right">从左到右</option>
                <option value="to bottom">从上到下</option>
                <option value="to bottom right">从左上到右下</option>
                <option value="to bottom left">从右上到左下</option>
            </select>
        </div>
        
        <button id="applyGradientColor" class="btn btn-inquiry" style="width:100%;">应用渐变色</button>
    </div>
</div>
 


