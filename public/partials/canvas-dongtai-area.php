<div class="text_toolbar" style="display: none;">
    <button class="toolbar_button" id="text_input">Text</button>
    <button class="toolbar_button" id="text_font_style">Font</button>
    <button class="toolbar_button" id="text_rotate">Transform</button>
    <button class="toolbar_button" id="text_position">Position</button>
    <button class="toolbar_button" id="text_distort">Arc</button>
    <button class="toolbar_button" id="text_color">Color</button>    
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
    <button class="toolbar_button" id="img_input">Transform</button>
    <button class="toolbar_button" id="img_position">Position</button>
    <button class="toolbar_button" id="img_size">Crop</button>
    <button class="toolbar_button" id="img_color">Color</button>   
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
