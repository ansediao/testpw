# 画布图层系统

## 系统架构

PW Canvas 插件的图层系统基于 Fabric.js 画布库实现，提供完整的图层管理功能。

### 核心组件

- **图层容器**: `#layers-container` - HTML容器，显示图层列表
- **图层管理器**: `public/js/layer-manager.js` - 核心逻辑处理
- **画布实例**: Fabric.js Canvas 对象 - 管理所有图形对象
- **事件系统**: 自动同步画布对象和图层面板状态

### 技术实现

#### 图层对象结构
```javascript
// 每个图层对象包含以下属性
{
  id: 'layer_' + layerCounter++,  // 唯一标识符
  type: 'text|image|other',       // 对象类型
  visible: true|false,            // 显示状态
  locked: true|false,             // 锁定状态
  selectable: true|false          // 可选择状态
}
```

#### 图层计数器
- **全局变量**: `layerCounter` 用于生成唯一ID
- **命名规则**: `layer_` + 递增数字
- **作用域**: 跨文件共享，确保ID唯一性

## 图层操作功能

### 自动添加机制
```javascript
// 监听画布对象添加事件
canvas.on('object:added', function (e) {
  const obj = e.target;
  addLayerItem(obj); // 自动创建图层项
});
```

### 图层控制功能
- **显示/隐藏**: 切换对象的 `visible` 属性
- **锁定/解锁**: 控制对象的 `selectable` 属性
- **删除**: 从画布和图层面板同时移除
- **复制**: 创建对象副本并偏移位置
- **拖拽排序**: 使用 Sortable.js 实现图层重排

### 图层命名规则
- **文字图层**: `文字: [前10个字符]...`
- **图片图层**: `图片 [计数器]`
- **其他图层**: `图层 [计数器]`

## 文件关联关系

### 核心文件
- **`public/js/layer-manager.js`**: 图层管理核心逻辑
- **`public/js/main.js`**: 画布初始化和事件监听
- **`public/partials/canvas-operation-panel.php`**: 图层面板HTML结构

### 样式文件
- **`public/css/template-canvas-display.scss`**: 图层样式定义
- **`public/css/template-canvas-display.css`**: 编译后的CSS

### 依赖库
- **Fabric.js**: 画布核心库
- **Sortable.js**: 图层拖拽排序 (CDN加载)
- **Font Awesome**: 图层控制图标 (CDN加载)

## 开发规范

### 添加新图层类型
1. 在 `addLayerItem()` 函数中添加类型判断
2. 定义相应的图层名称和图标
3. 确保对象包含必要的属性 (id, type等)

### 图层事件处理
- 使用事件委托避免内存泄漏
- 阻止事件冒泡 (`e.stopPropagation()`)
- 同步更新画布和图层面板状态

### 性能优化
- 图层项使用 `prepend()` 添加到顶部
- 避免重复创建相同ID的图层项
- 使用 `dataset` 属性标记操作状态

## 常见问题处理

### 图层同步问题
- 确保画布事件监听器正确绑定
- 检查 `layerCounter` 是否正确递增
- 验证对象ID的唯一性

### 拖拽排序问题
- 确保 Sortable.js 库正确加载
- 检查 `reorderCanvasObjects()` 函数逻辑
- 注意图层顺序与画布对象索引的对应关系

### 图标显示问题
- 确认 Font Awesome 库正确加载
- 检查图标类名是否正确
- 验证CSS样式是否冲突