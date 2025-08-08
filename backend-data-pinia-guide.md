# 后台数据在Pinia中的存储与动态使用指南

本文档详细解释 `public/js/design/stores/index.js` 中后台数据如何存入Pinia，以及页面中其他模块如何动态使用这些数据。

## 1. 架构概览

### 1.1 核心组件
- **Pinia Store**: `useCanvasStore` - 全局状态管理中心
- **API层**: `productDataAPI.js` - 负责与后台通信
- **Vue组件**: 各模块通过计算属性访问Pinia数据

### 1.2 数据流向
```
后台API → ProductDataAPI → Pinia Store → Vue组件 → 动态UI更新
```

## 2. Pinia Store 数据结构

### 2.1 状态定义 (State)

在 `useCanvasStore` 中定义了以下核心状态：

```javascript
state: () => ({
    // 画布相关状态
    canvasStates: { canvas1: null, canvas2: null, canvas3: null },
    activeCanvasId: 'canvas1',
    
    // 图层管理状态
    layers: [],              // 当前视图的所有图层
    viewLayers: {},          // 按视图分组的图层管理 { viewId: [layers] }
    layerGroups: [],         // 图层组列表
    viewLayerGroups: {},     // 按视图分组的图层组管理
    activeObjectId: null,    // 当前选中的对象ID
    
    // 产品数据状态
    productData: null,       // 后台获取的产品完整数据
    isLoadingProductData: false,  // 加载状态
    productDataError: null,  // 错误信息
    
    // 视图管理状态
    views: [],               // 所有视图信息
    activeViewId: null,      // 当前激活的视图ID
    viewCanvases: {}         // 每个视图的canvas实例
})
```

### 2.2 数据分类

#### 2.2.1 产品数据 (Backend Data)
- `productData`: 存储从WordPress REST API获取的完整产品数据
- 包含模板、视图、定制选项等所有产品信息

#### 2.2.2 图层数据 (Layer Data)
- `layers`: 当前视图的所有图层对象
- `viewLayers`: 按视图ID存储的图层数据，支持多视图切换

#### 2.2.3 视图数据 (View Data)
- `views`: 从产品数据中提取的所有可用视图
- `activeViewId`: 当前激活的视图

## 3. 后台数据获取流程

### 3.1 API调用

```javascript
// 在Pinia Store中的异步方法
async fetchProductData(pwId) {
    this.setLoadingProductData(true);
    try {
        const response = await axios.get(`/wp-json/pw/v1/product-data/${pwId}`);
        this.setProductData(response.data);
        this.extractViewsFromProductData(response.data);
        return response.data;
    } catch (error) {
        this.setProductDataError(error.message);
        throw error;
    } finally {
        this.setLoadingProductData(false);
    }
}
```

### 3.2 数据提取与转换

产品数据获取后，通过 `extractViewsFromProductData` 方法提取视图信息：

```javascript
extractViewsFromProductData(productData) {
    const views = [];
    if (productData && productData.templates.data.custom_view) {
        const customView = productData.templates.data.custom_view;
        
        // 添加主视图
        if (customView.main_custom_view) {
            views.push({
                id: 'main_view',
                name: customView.main_custom_view.view_name || 'Main View',
                data: customView.main_custom_view
            });
        }
        
        // 添加子视图
        if (Array.isArray(customView.sub_custom_view)) {
            customView.sub_custom_view.forEach((subView, index) => {
                views.push({
                    id: `sub_view_${index}`,
                    name: subView.view_name || `Sub View ${index + 1}`,
                    data: subView
                });
            });
        }
    }
    
    this.setViews(views);
    if (views.length > 0) {
        this.setActiveViewId(views[0].id); // 默认激活第一个视图
    }
}
```

## 4. 动态数据使用方法

### 4.1 Vue组件中的使用模式

#### 4.1.1 引入Store
```javascript
// 在组件中引入Pinia store
import { useCanvasStore, pinia } from '../stores/index.js';

// 在setup函数中使用
const store = useCanvasStore();
```

#### 4.1.2 计算属性访问
```javascript
// 使用计算属性确保响应式更新
const layers = Vue.computed(() => store.layers);
const activeObjectId = Vue.computed(() => store.activeObjectId);
const layerGroups = Vue.computed(() => store.layerGroups);
```

#### 4.1.3 监听状态变化
```javascript
// 监听视图切换
Vue.watch(() => store.activeViewId, (newViewId) => {
    console.log('视图切换到:', newViewId, '图层数量:', store.layers.length);
}, { immediate: true });
```

### 4.2 跨模块数据共享

#### 4.2.1 图层管理模块 (`layers.js`)

**数据使用示例：**

```javascript
// 获取当前视图的所有图层
const currentViewLayers = store.getViewLayers(store.activeViewId);

// 添加新图层到当前视图
store.addLayerToView(currentViewId, newLayer);

// 更新图层属性
const updatedLayers = currentViewLayers.map(l => 
    l.id === layer.id ? { ...l, visible: newVisible } : l
);
store.setViewLayers(currentViewId, updatedLayers);
```

**图层数据结构：**
```javascript
{
    id: 'layer_123456789',
    name: '产品Logo',
    type: 'image',
    visible: true,
    locked: false,
    groupId: 'print-method-a',
    groupOrder: 0,
    printMethod: 'method-a'
}
```

#### 4.2.2 视图切换机制

**视图状态管理：**
```javascript
// 切换视图时的数据保存与恢复
setActiveViewId(viewId) {
    const previousViewId = this.activeViewId;
    
    // 保存当前视图数据
    if (previousViewId && this.layers.length > 0) {
        this.viewLayers[previousViewId] = [...this.layers];
    }
    
    // 切换到新视图
    this.activeViewId = viewId;
    
    // 加载新视图数据
    this.layers = this.viewLayers[viewId] || [];
    this.layerGroups = this.viewLayerGroups[viewId] || [];
}
```

### 4.3 全局访问方法

#### 4.3.1 非Vue组件访问
```javascript
// 全局函数供外部JavaScript调用
window.useCanvasStore = useCanvasStore;

// 使用示例
window.addLayerToStore = function(layerId, layerName, layerType) {
    const store = window.useCanvasStore();
    const currentViewId = store.activeViewId;
    
    if (currentViewId) {
        store.addLayerToView(currentViewId, {
            id: layerId,
            name: layerName,
            type: layerType,
            visible: true,
            locked: false,
            groupId: null,
            groupOrder: 0
        });
    }
};
```

## 5. 数据持久化与同步

### 5.1 视图间数据隔离

每个视图拥有独立的图层和图层组数据：
- `viewLayers`: `{ viewId: [layers...] }`
- `viewLayerGroups`: `{ viewId: [groups...] }`

### 5.2 实时同步机制

#### 5.2.1 画布与Store同步

```javascript
// 同步图层选择状态到画布
const syncLayerSelectionToCanvas = (layerId) => {
    const canvasInstance = getCanvasInstance();
    if (canvasInstance) {
        const obj = canvasInstance.getObjects().find(o => o.id === layerId);
        if (obj) {
            canvasInstance.setActiveObject(obj);
            canvasInstance.renderAll();
        }
    }
};
```

#### 5.2.2 属性同步
```javascript
// 同步可见性
const syncLayerVisibilityToCanvas = (layerId, visible) => {
    const obj = canvasInstance.getObjects().find(o => o.id === layerId);
    if (obj) {
        obj.set('visible', visible);
        canvasInstance.renderAll();
    }
};
```

## 6. 实际使用场景示例

### 6.1 产品页面初始化

```javascript
// 页面加载时获取产品数据
const store = useCanvasStore();
const config = window.pwProductConfig;

if (config && config.pwId) {
    store.fetchProductData(config.pwId)
        .then(productData => {
            console.log('产品数据加载完成:', productData);
            console.log('可用视图:', store.views);
            console.log('当前激活视图:', store.activeViewId);
        })
        .catch(error => {
            console.error('获取产品数据失败:', error);
        });
}
```

### 6.2 动态图层管理

```javascript
// 添加图片到画布并同步到图层管理
function addImageToCanvas(imageUrl, position) {
    const canvasInstance = getCanvasInstance();
    if (!canvasInstance) return;
    
    fabric.Image.fromURL(imageUrl, (img) => {
        const layerId = `layer_${Date.now()}`;
        img.set({
            id: layerId,
            left: position.x,
            top: position.y,
            layerName: '新图片',
            layerType: 'image'
        });
        
        canvasInstance.add(img);
        canvasInstance.renderAll();
        
        // 同步到Pinia store
        window.addLayerToStore(layerId, '新图片', 'image');
    });
}
```

### 6.3 视图切换处理

```javascript
// 监听视图切换以更新UI
Vue.watch(() => store.activeViewId, (newViewId, oldViewId) => {
    console.log(`从 ${oldViewId} 切换到 ${newViewId}`);
    
    // 更新图层列表
    updateLayersPanel();
    
    // 更新画布显示
    switchCanvasView(newViewId);
    
    // 重置选中状态
    store.setActiveObjectId(null);
});
```

## 7. 错误处理与状态管理

### 7.1 加载状态处理

```javascript
// 组件中显示加载状态
const isLoading = Vue.computed(() => store.isLoadingProductData);

// 模板中使用
<div v-if="isLoading" class="loading-spinner">
    正在加载产品数据...
</div>
<div v-else-if="productDataError" class="error-message">
    {{ productDataError }}
</div>
```

### 7.2 数据验证

```javascript
// 验证图层数据完整性
const validateLayerData = (layer) => {
    return layer && 
           layer.id && 
           layer.name && 
           layer.type &&
           typeof layer.visible === 'boolean' &&
           typeof layer.locked === 'boolean';
};
```

## 8. 性能优化建议

### 8.1 计算属性缓存
使用计算属性缓存复杂计算结果，避免重复计算。

### 8.2 批量更新
使用批量操作减少状态更新次数：

```javascript
// 批量更新多个图层
const updateMultipleLayers = (layerUpdates) => {
    const currentViewId = store.activeViewId;
    const currentLayers = store.getViewLayers(currentViewId);
    
    const updatedLayers = currentLayers.map(layer => {
        const update = layerUpdates.find(u => u.id === layer.id);
        return update ? { ...layer, ...update } : layer;
    });
    
    store.setViewLayers(currentViewId, updatedLayers);
};
```

### 8.3 按需加载
根据当前视图只加载必要的图层数据，避免加载所有视图的所有图层。

## 总结

本系统通过Pinia实现了高效的全局状态管理，支持：
- 后台产品数据的动态获取与转换
- 多视图间的数据隔离与同步
- 图层数据的实时管理与更新
- 跨组件的数据共享与通信
- 非Vue组件的全局访问支持

通过计算属性和监听机制，确保界面与数据状态的实时同步，为用户提供流畅的交互体验。