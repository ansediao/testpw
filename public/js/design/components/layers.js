// src/components/layers.js

// 导入 Pinia 仓库和 pinia 实例
import { useCanvasStore, pinia } from '../stores/index.js';

// 创建图层管理 Vue 应用
const layersApp = Vue.createApp({
    template: `
        <div class="layers-panel">
            <div class="layers-header">
                <h3>图层管理</h3>
                <button @click="addLayer" class="add-layer-btn">添加图层</button>
            </div>
            
            <div class="canvas-tabs">
                <div class="tab-header">当前画板:</div>
                <div class="canvas-buttons">
                    <button 
                        v-for="canvasId in canvasIds" 
                        :key="canvasId"
                        @click="switchCanvas(canvasId)"
                        :class="['canvas-btn', { active: canvasId === activeCanvasId }]"
                    >
                        {{ canvasId }}
                    </button>
                </div>
            </div>
            
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
            
            <div class="layers-footer">
                <div class="status-info">
                    <div>活动画板: {{ activeCanvasId }}</div>
                    <div>选中对象: {{ activeObjectId || '无' }}</div>
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
        };
        
        // 切换可见性
        const toggleVisibility = (layer) => {
            const updatedLayers = store.layers.map(l => 
                l.id === layer.id ? { ...l, visible: !l.visible } : l
            );
            store.setLayers(updatedLayers);
        };
        
        // 切换锁定状态
        const toggleLock = (layer) => {
            const updatedLayers = store.layers.map(l => 
                l.id === layer.id ? { ...l, locked: !l.locked } : l
            );
            store.setLayers(updatedLayers);
        };
        
        // 复制图层
        const duplicateLayer = (layer) => {
            const newLayer = {
                ...layer,
                id: `layer_${Date.now()}`,
                name: `${layer.name} 副本`
            };
            const updatedLayers = [...store.layers, newLayer];
            store.setLayers(updatedLayers);
        };
        
        // 删除图层
        const deleteLayer = (layer) => {
            if (confirm(`确定要删除图层 "${layer.name}" 吗？`)) {
                const updatedLayers = store.layers.filter(l => l.id !== layer.id);
                store.setLayers(updatedLayers);
                
                // 如果删除的是当前选中的图层，清除选中状态
                if (store.activeObjectId === layer.id) {
                    store.setActiveObjectId(null);
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
    const container = document.getElementById('layers-container');
    if (container) {
        try {
            layersApp.mount('#layers-container');
        } catch (error) {
            console.error('挂载图层管理应用失败:', error);
        }
    }
});
