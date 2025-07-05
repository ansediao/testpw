<div class="text_toolbar" style="display: none;">
    <button class="toolbar_button" id="text_input">输入</button>
    <button class="toolbar_button" id="text_font_style">字体</button>
    <button class="toolbar_button" id="text_rotate">旋转</button>
    <button class="toolbar_button" id="text_position">位置</button>
    <button class="toolbar_button" id="text_color">颜色</button>
    <button class="toolbar_button" id="text_distort">扭曲</button>
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
    <button class="toolbar_button" id="img_input">变形</button>
    <button class="toolbar_button" id="img_position">位置</button>
    <button class="toolbar_button" id="img_size">裁剪</button>
    <button class="toolbar_button" id="img_color">颜色</button>   
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
