<div class="text_toolbar" style="display: none;">
    <button class="toolbar_button" id="text_input"><i class="iconfont icon-wenbenshuru"></i>Text</button>
    <button class="toolbar_button" id="text_font_style"><i class="iconfont icon-wenzi"></i>Font</button>
    <button class="toolbar_button" id="text_rotate"><i class="iconfont icon-bianxing"></i>Transform</button>
    <button class="toolbar_button" id="text_position"><i class="iconfont icon-yidongweizhi"></i>Position</button>
    <button class="toolbar_button" id="text_distort"><i class="iconfont icon-wenzibianxing"></i>Arc</button>
    <button class="toolbar_button" id="text_color"><i class="iconfont icon-yanse"></i>Color</button>    
</div>
<script>
document.querySelectorAll('.toolbar_button').forEach(button => {
    button.addEventListener('click', function() {
        // 移除所有按钮的激活样式
        document.querySelectorAll('.toolbar_button').forEach(btn => {
            btn.classList.remove('active');
        });
        // 为当前点击的按钮添加激活样式
        this.classList.add('active');
        // 更新工具栏显示
        if (canvas.getActiveObject()) {
            updateDynamicToolbar(canvas.getActiveObject());
        }
    });
});
</script>
<div class="img_toolbar" style="display:none">
    <button class="toolbar_button" id="img_input"><i class="iconfont icon-bianxing"></i>
    Transform</button>
    <button class="toolbar_button" id="img_position"><i class="iconfont icon-yidongweizhi"></i>
    Position</button>
    <button class="toolbar_button" id="img_size"><i class="iconfont icon-caijian"></i>
    Crop</button>
    <button class="toolbar_button" id="img_color"><i class="iconfont icon-yanse"></i>
    Color</button>   
</div>
<script>
document.querySelectorAll('.img_toolbar .toolbar_button').forEach(button => {
    button.addEventListener('click', function() {
        // 移除所有按钮的激活样式
        document.querySelectorAll('.toolbar_button').forEach(btn => {
            btn.classList.remove('active');
        });
        // 为当前点击的按钮添加激活样式
        this.classList.add('active');
        // 更新工具栏显示
        if (canvas.getActiveObject()) {
            updateDynamicToolbar(canvas.getActiveObject());
        }
    });
});
</script>
