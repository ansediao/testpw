<div class="text_toolbar" style="display: none;">
    <button class="toolbar_button" id="text_input"><i class="iconfont icon-wenbenshuru"></i>Text</button>
    <button class="toolbar_button" id="text_font_style"><i class="iconfont icon-wenzi"></i>Font</button>
    <button class="toolbar_button" id="text_rotate"><i class="iconfont icon-bianxing"></i>Transform</button>
    <button class="toolbar_button" id="text_position"><i class="iconfont icon-yidongweizhi"></i>Position</button>
    <button class="toolbar_button" id="text_distort"><i class="iconfont icon-wenzibianxing"></i>Arc</button>
    <button class="toolbar_button" id="text_color"><i class="iconfont icon-yanse"></i>Color</button>    
</div>
<script>
// 检查元素是否属于分组的函数
function checkElementGroupStatus(activeObject) {
    if (!activeObject) return false;
    
    // 检查是否有 groupId 属性
    if (activeObject.groupId) {
        return true;
    }
    
    // 检查是否通过 Pinia store 分配了打印方式
    if (window.usePrintMethodStore) {
        const printMethodStore = window.usePrintMethodStore();
        const layerPrintMethod = printMethodStore.getLayerPrintMethod(activeObject.id);
        if (layerPrintMethod) {
            return true;
        }
    }
    
    return false;
}

// 显示绑定印刷方式提示
function showPrintMethodBindingAlert() {
    alert('请先为此元素绑定印刷方式后再使用此工具。\n\n您可以在图层面板中点击"Switch Printing Method"按钮来绑定印刷方式。');
}

document.querySelectorAll('.text_toolbar .toolbar_button').forEach(button => {
    button.addEventListener('click', function() {
        // 获取当前激活的画布和对象
        const activeCanvas = window.CanvasManager ? window.CanvasManager.getActiveCanvas() : (window.canvas || window.fabricCanvas);
        const activeObject = activeCanvas ? activeCanvas.getActiveObject() : null;
        
        // 检查元素是否属于分组
        if (activeObject && !checkElementGroupStatus(activeObject)) {
            showPrintMethodBindingAlert();
            return; // 阻止工具的使用
        }
        
        // 调用面板切换方法 - 文本工具栏切换到文字面板
        if (typeof window.switchOperationPanelTab === 'function') {
            window.switchOperationPanelTab('tab-wenzi');
        }
        
        // 移除所有按钮的激活样式
        document.querySelectorAll('.toolbar_button').forEach(btn => {
            btn.classList.remove('active');
        });
        // 为当前点击的按钮添加激活样式
        this.classList.add('active');
        // 更新工具栏显示
        if (activeObject) {
            updateDynamicToolbar(activeObject);
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
        // 获取当前激活的画布和对象
        const activeCanvas = window.CanvasManager ? window.CanvasManager.getActiveCanvas() : (window.canvas || window.fabricCanvas);
        const activeObject = activeCanvas ? activeCanvas.getActiveObject() : null;
        
        // 检查元素是否属于分组
        if (activeObject && !checkElementGroupStatus(activeObject)) {
            showPrintMethodBindingAlert();
            return; // 阻止工具的使用
        }
        
        // 调用面板切换方法 - 图片工具栏切换到片圈面板
        if (typeof window.switchOperationPanelTab === 'function') {
            window.switchOperationPanelTab('tab-pianquan');
        }
        
        // 移除所有按钮的激活样式
        document.querySelectorAll('.toolbar_button').forEach(btn => {
            btn.classList.remove('active');
        });
        // 为当前点击的按钮添加激活样式
        this.classList.add('active');
        // 更新工具栏显示
        if (activeObject) {
            updateDynamicToolbar(activeObject);
        }
    });
});
</script>
