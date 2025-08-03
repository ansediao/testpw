// src/components/layers.js

// 导入 Pinia 仓库和 pinia 实例
import { useCanvasStore, pinia } from '../stores/index.js';

// 创建图层管理 Vue 应用
const layersApp = Vue.createApp({
    template: `
        <div class="layers-panel">
          
            
   
            
            <div class="layers-list">
                <div class="layers-list-header">
                    <span>图层列表 ({{ layers.length }})</span>
                </div>
                
                <div v-if="layers.length === 0" class="no-layers">
                    暂无图层
                </div>
                
                <div v-else class="layer-items">
                    <div 
                        v-for="layer in layers" 
                        :key="layer.id"
                        :class="['layer-item', { active: layer.id === activeObjectId }]"
                        @click="selectLayer(layer.id)"
                    >
                        <div class="layer-controls">
                            <button @click.stop="toggleVisibility(layer)" class="layer-btn">
                                {{ layer.visible ? '👁️' : '🙈' }}
                            </button>
                            <button @click.stop="toggleLock(layer)" class="layer-btn">
                                {{ layer.locked ? '🔒' : '🔓' }}
                            </button>
                        </div>
                        <div class="layer-info">
                            <div class="layer-name">{{ layer.name || layer.id }}</div>
                            <div class="layer-type">{{ layer.type || 'unknown' }}</div>
                        </div>
                        <div class="layer-actions">
                            <button @click.stop="duplicateLayer(layer)" class="layer-btn">📋</button>
                            <button @click.stop="deleteLayer(layer)" class="layer-btn delete">🗑️</button>
                        </div>
                    </div>
                </div>
            </div>
            
          
        </div>
    `,
    
    setup() {
        const store = useCanvasStore();
        
        // 添加图层的方法
        const addLayer = () => {
            const newLayer = {
                id: `layer_${Date.now()}`,
                name: `图层 ${store.layers.length + 1}`,
                type: 'text',
                visible: true,
                locked: false
            };
            
            const updatedLayers = [...store.layers, newLayer];
            store.setLayers(updatedLayers);
        };
        
        // 选择图层
        const selectLayer = (layerId) => {
            store.setActiveObjectId(layerId);
            
            // 同步到画布选中状态
            syncLayerSelectionToCanvas(layerId);
        };
        
        // 切换可见性
        const toggleVisibility = (layer) => {
            const newVisible = !layer.visible;
            const updatedLayers = store.layers.map(l => 
                l.id === layer.id ? { ...l, visible: newVisible } : l
            );
            store.setLayers(updatedLayers);
            
            // 同步到画布对象
            syncLayerVisibilityToCanvas(layer.id, newVisible);
        };
        
        // 切换锁定状态
        const toggleLock = (layer) => {
            const newLocked = !layer.locked;
            const updatedLayers = store.layers.map(l => 
                l.id === layer.id ? { ...l, locked: newLocked } : l
            );
            store.setLayers(updatedLayers);
            
            // 同步到画布对象
            syncLayerLockToCanvas(layer.id, newLocked);
        };
        
        // 复制图层
        const duplicateLayer = (layer) => {
            // 先在画布中复制对象
            duplicateCanvasObject(layer.id);
        };
        
        // 删除图层
        const deleteLayer = (layer) => {
            if (confirm(`确定要删除图层 "${layer.name}" 吗？`)) {
                // 先从画布中删除对象
                deleteCanvasObject(layer.id);
                
                // 然后从 store 中删除（这会通过画布事件自动触发）
                const updatedLayers = store.layers.filter(l => l.id !== layer.id);
                store.setLayers(updatedLayers);
                
                // 如果删除的是当前选中的图层，清除选中状态
                if (store.activeObjectId === layer.id) {
                    store.setActiveObjectId(null);
                }
            }
        };
        
        // 同步图层选中状态到画布
        const syncLayerSelectionToCanvas = (layerId) => {
            if (typeof window.canvas !== 'undefined' && window.canvas) {
                const obj = window.canvas.getObjects().find(o => o.id === layerId);
                if (obj) {
                    window.canvas.setActiveObject(obj);
                    window.canvas.renderAll();
                }
            }
        };
        
        // 同步图层可见性到画布
        const syncLayerVisibilityToCanvas = (layerId, visible) => {
            if (typeof window.canvas !== 'undefined' && window.canvas) {
                const obj = window.canvas.getObjects().find(o => o.id === layerId);
                if (obj) {
                    obj.set('visible', visible);
                    window.canvas.renderAll();
                }
            }
        };
        
        // 同步图层锁定状态到画布
        const syncLayerLockToCanvas = (layerId, locked) => {
            if (typeof window.canvas !== 'undefined' && window.canvas) {
                const obj = window.canvas.getObjects().find(o => o.id === layerId);
                if (obj) {
                    obj.set('selectable', !locked);
                    obj.set('evented', !locked);
                    window.canvas.renderAll();
                }
            }
        };
        
        // 复制画布对象
        const duplicateCanvasObject = (layerId) => {
            if (typeof window.canvas !== 'undefined' && window.canvas) {
                const obj = window.canvas.getObjects().find(o => o.id === layerId);
                if (obj) {
                    obj.clone((cloned) => {
                        cloned.set({
                            left: cloned.left + 10,
                            top: cloned.top + 10,
                            id: `layer_${Date.now()}`
                        });
                        window.canvas.add(cloned);
                        window.canvas.setActiveObject(cloned);
                        window.canvas.renderAll();
                    });
                }
            }
        };
        
        // 删除画布对象
        const deleteCanvasObject = (layerId) => {
            if (typeof window.canvas !== 'undefined' && window.canvas) {
                const obj = window.canvas.getObjects().find(o => o.id === layerId);
                if (obj) {
                    window.canvas.remove(obj);
                    window.canvas.renderAll();
                }
            }
        };
        
        return {
            // 从 store 获取的数据
            canvasIds: Vue.computed(() => Object.keys(store.canvasStates)),
            activeCanvasId: Vue.computed(() => store.activeCanvasId),
            layers: Vue.computed(() => store.layers),
            activeObjectId: Vue.computed(() => store.activeObjectId),
            
            // 方法
            switchCanvas: (id) => store.setActiveCanvasId(id),
            addLayer,
            selectLayer,
            toggleVisibility,
            toggleLock,
            duplicateLayer,
            deleteLayer
        };
    }
});

// 挂载 Pinia 状态管理到 Vue 应用
layersApp.use(pinia);

// 等待 DOM 加载完成后挂载应用
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('layers-box');
    if (container) {
        try {
            layersApp.mount('#layers-box');
        } catch (error) {
            console.error('挂载图层管理应用失败:', error);
        }
    }
});

// 全局函数：添加图层到 store（供外部调用）
window.addLayerToStore = function(layerId, layerName, layerType) {
    if (typeof window.useCanvasStore === 'function') {
        try {
            const store = window.useCanvasStore();
            
            // 检查图层是否已存在
            const existingLayer = store.layers.find(layer => layer.id === layerId);
            if (existingLayer) {
                return; // 图层已存在，不重复添加
            }
            
            const newLayer = {
                id: layerId,
                name: layerName.length > 20 ? layerName.substring(0, 20) + '...' : layerName,
                type: layerType,
                visible: true,
                locked: false
            };
            
            const updatedLayers = [...store.layers, newLayer];
            store.setLayers(updatedLayers);
            store.setActiveObjectId(layerId);
            
        } catch (error) {
            console.error('添加图层到管理系统失败:', error);
        }
    }
};
