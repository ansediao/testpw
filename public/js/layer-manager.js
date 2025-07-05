// 图层管理功能
let layerCounter = 0;
const layersContainer = document.getElementById('layers-container');
// 初始化拖拽排序功能
function initSortable() {
    new Sortable(layersContainer, {
        animation: 150,
        ghostClass: 'layer-drag-placeholder',
        onEnd: function (evt) { // 获取所有图层ID
            const layerIds = Array.from(layersContainer.querySelectorAll('.layer-item')).map(item => item.getAttribute('data-id'));
            // 重新排序canvas对象
            reorderCanvasObjects(layerIds);
        }
    });
}

// 添加图层项
function addLayerItem(obj) { // 为对象分配唯一ID
    if (! obj.id) {
        obj.id = 'layer_' + layerCounter++;
    }
    // 确定图层名称
    let layerName = '图层 ' + layerCounter;
    if (obj.type === 'text') {
        layerName = '文字: ' + (
        obj.text.length > 10 ? obj.text.substring(0, 10) + '...' : obj.text
    );
    } else if (obj.type === 'image') {
        layerName = '图片 ' + layerCounter;
    }
    // 创建图层项元素
    const layerItem = document.createElement('div');
    layerItem.className = 'layer-item';
    layerItem.setAttribute('data-id', obj.id);
    layerItem.innerHTML = `
      <span class="layer-column layer-type">
        ${obj.type === 'text' ? 'T' : (obj.type === 'image' ? '<img src="' + (obj.getSrc ? obj.getSrc() : '') + '" style="width: 20px; height: 20px;" alt="缩略图">' : '其他')}
      </span>
      <span class="layer-column layer-visibility">
        <i class="fa ${
        obj.visible !== false ? 'fa-eye' : 'fa-eye-slash'
    }" title="显示/隐藏"></i>
      </span>
      <span class="layer-column layer-lock">
        <i class="fa ${
        obj.locked ? 'fa-lock' : 'fa-unlock'
    }" title="锁定/解锁"></i>
      </span>
      <span class="layer-column layer-name">${layerName}</span>
      <span class="layer-column layer-actions">
        <i class="fa fa-trash" title="删除"></i>
        <i class="fa fa-copy" title="复制"></i>
      </span>
    `;
    // 添加到图层容器
    layersContainer.prepend(layerItem);
    // 添加事件监听
    const visibilityIcon = layerItem.querySelector('.layer-visibility i');
    visibilityIcon.addEventListener('click', function () {
        const isVisible = this.classList.contains('fa-eye');
        if (isVisible) {
            this.classList.replace('fa-eye', 'fa-eye-slash');
            obj.set('visible', false);
        } else {
            this.classList.replace('fa-eye-slash', 'fa-eye');
            obj.set('visible', true);
        }
        canvas.renderAll();
    });
    const lockIcon = layerItem.querySelector('.layer-lock i');
    lockIcon.addEventListener('click', function () {
        const isLocked = this.classList.contains('fa-lock');
        if (isLocked) {
            this.classList.replace('fa-lock', 'fa-unlock');
            obj.set('selectable', true);
            obj.set('locked', false);
        } else {
            this.classList.replace('fa-unlock', 'fa-lock');
            obj.set('selectable', false);
            obj.set('locked', true);
        }
        canvas.renderAll();
    });
    // 点击图层项选中对应的对象
    layerItem.addEventListener('click', function (e) { // 如果点击的是图标，不处理
        if (e.target.tagName === 'I') 
            return;
        

        // 选中对应的canvas对象
        canvas.setActiveObject(obj);
        canvas.renderAll();
        // 更新图层项的选中状态
        document.querySelectorAll('.layer-item').forEach(item => {
            item.classList.remove('selected');
        });
        this.classList.add('selected');
    });

    // 为删除和复制按钮添加事件监听
    const deleteIcon = layerItem.querySelector('.layer-actions .fa-trash');
    deleteIcon.addEventListener('click', function (e) {
        e.stopPropagation(); // 阻止事件冒泡，避免触发图层选中
        // 从画布中移除对象
        canvas.remove(obj);
        // 从图层列表中移除对应的图层项
        layerItem.remove();
        canvas.renderAll();
    });

    const copyIcon = layerItem.querySelector('.layer-actions .fa-copy');
    copyIcon.addEventListener('click', function (e) {
        e.stopPropagation(); // 阻止事件冒泡，避免触发图层选中
        // 检查是否已经在处理复制操作
        if (copyIcon.dataset.copying === 'true') return;
        copyIcon.dataset.copying = 'true';
        // 复制对象
        obj.clone(function(cloned) {
            // 稍微偏移复制的对象位置
            cloned.set({
                left: cloned.left + 10,
                top: cloned.top + 10,
                id: 'layer_' + layerCounter++
            });
            canvas.add(cloned);
            // 检查图层项是否已存在，避免重复添加
            const existingLayerItem = layersContainer.querySelector(`.layer-item[data-id="${cloned.id}"]`);
            if (!existingLayerItem) {
                addLayerItem(cloned);
            }
            canvas.setActiveObject(cloned);
            canvas.renderAll();
            // 重置复制标志
            copyIcon.dataset.copying = 'false';
        });
    });
    return layerItem;
}
// 更新图层面板中的选中状态
function updateLayerSelection(obj) {
    if (! obj) 
        return;
    

    document.querySelectorAll('.layer-item').forEach(item => {
        item.classList.remove('selected');
        if (item.getAttribute('data-id') === obj.id) {
            item.classList.add('selected');
        }
    });
}

// 重新排序canvas对象
function reorderCanvasObjects(layerIds) { // 反转顺序，因为Fabric.js中索引越大的对象显示在越上层
    layerIds.reverse();
    // 创建一个新的对象数组，按照图层面板的顺序排列
    const objects = [];
    layerIds.forEach(id => {
        const obj = canvas.getObjects().find(o => o.id === id);
        if (obj) 
            objects.push(obj);
        

    });
    // 清除画布并重新添加对象
    canvas.clear();
    objects.forEach(obj => canvas.add(obj));
    canvas.renderAll();
}
// 初始化拖拽排序
document.addEventListener('DOMContentLoaded', function () { // 加载Font Awesome图标
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    document.head.appendChild(fontAwesome);
    // 加载Sortable.js
    const sortableScript = document.createElement('script');
    sortableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.14.0/Sortable.min.js';
    sortableScript.onload = initSortable;
    document.body.appendChild(sortableScript);
});
