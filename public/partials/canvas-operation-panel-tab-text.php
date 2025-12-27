<!-- 文字内容 (隐藏) -->
<div id="content-wenzi" class="content-pane">
    <div id="addTextBtn_box">
        <textarea id="customText" rows="4" style="width: 100%; margin-bottom: 10px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Input Text..."></textarea>
        <button id="addTextBtn" class="btn btn-custom" style="margin-top: 10px;" onclick="addText()">
            <svg viewBox="0 0 24 24" width="16" height="16" style="vertical-align: middle;">
                <path fill="currentColor"
                    d="M18.5,4L19.66,8.35L18.7,8.61C18.25,7.74 17.79,6.87 17.26,6.43C16.73,6 16.11,6 15.5,6H13V16.5C13,17 13,17.5 13.33,17.75C13.67,18 14.33,18 15,18V19H9V18C9.67,18 10.33,18 10.67,17.75C11,17.5 11,17 11,16.5V6H8.5C7.89,6 7.27,6 6.74,6.43C6.21,6.87 5.75,7.74 5.3,8.61L4.34,8.35L5.5,4H18.5Z" />
            </svg>
            Add Text
        </button>
    </div>
    
    <div id="content-wenzi-control"></div>
    <script>
    (function() {
        const addTextBox = document.getElementById('addTextBtn_box');
        const controlArea = document.getElementById('content-wenzi-control');
        if (!addTextBox || !controlArea) return;

        function setAddTextBoxVisible(visible) {
            addTextBox.style.display = visible ? 'block' : 'none';
        }

        
    })();
    </script>
</div>

<script>
    // 修改添加文字函数，确保添加到图层面板
    function addText() {
        const text = document.getElementById('customText').value.trim();
        if (!text) return;

        // 获取当前激活的画布
        const activeCanvas = getActiveCanvas();
        if (!activeCanvas) {
            console.warn('未找到激活的画布');
            return;
        }

        // 清空文本输入框
        document.getElementById('customText').value = '';

        // 生成唯一的图层ID
        const layerId = 'layer_' + Date.now();

        // 创建Fabric文本对象
        const fabricText = new fabric.Text(text, {
            left: activeCanvas.width / 2,
            top: activeCanvas.height / 2,
            fontSize: 30,
            fill: '#000000',
            fontFamily: 'Arial',
            originX: 'center',
            originY: 'center',
            id: layerId,
            cornerSize: 10,
            transparentCorners: false,
            lockUniScaling: false,
            lockMovementX: false,
            lockMovementY: false,
            angle: 0,
            hasControls: true,
            selectable: true,
            // ===== 核心修复：添加用户操作标记 =====
            userInitiated: true,  // 标记为用户操作
            fromButton: true,     // 标记来源为按钮操作
            fromToolbar: true     // 标记来源为工具栏
        });

        // 添加到画布并设为活动对象
        activeCanvas.add(fabricText);
        activeCanvas.setActiveObject(fabricText);
        activeCanvas.renderAll();

        // 同时添加到图层管理系统
        if (typeof window.addLayerToStore === 'function') {
            window.addLayerToStore(layerId, text, 'text');
        } else {
            console.warn('图层管理系统未初始化');
        }
    }
</script>