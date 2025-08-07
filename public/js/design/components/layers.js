// src/components/layers.js

// 导入 Pinia 仓库和 pinia 实例
import { useCanvasStore, pinia } from '../stores/index.js';

// 创建图层管理 Vue 应用
const layersApp = Vue.createApp({
    template: `
        <div class="layers-panel">
            <div class="layers-list">
              
                
                <!-- 未分组图层提示区域 -->
                <div v-if="ungroupedLayers.length > 0" class="ungrouped-warning">
                     <div class="ungrouped-layers">
                        <div v-for="layer in ungroupedLayers" :key="layer.id" 
                             class="layer-item ungrouped"
                             :class="{ active: layer.id === activeObjectId }"
                             @click="selectLayer(layer.id)">
                            <div class="layer-icon">
                                <div v-if="layer.type === 'image'" class="layer-thumbnail">
                                    <img :src="getLayerThumbnail(layer)" alt="缩略图" class="thumbnail-img" />
                                </div>
                                <div v-else-if="layer.type === 'text'" class="layer-text-icon">
                                    T
                                </div>
                                <div v-else class="layer-default-icon">
                                    📄
                                </div>
                            </div>
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
                                <button @click.stop="showGroupAssignDialog(layer)" class="assign-btn">分组</button>
                                <button @click.stop="duplicateLayer(layer)" class="layer-btn">📋</button>
                                <button @click.stop="deleteLayer(layer)" class="layer-btn delete">🗑️</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 图层组列表 -->
                <div v-for="group in layerGroups" :key="group.id" class="layer-group">
                    <!-- 图层组头部 -->
                    <div class="group-header" 
                         :class="{active: activeGroupId === group.id}"
                         @click="toggleGroup(group.id)">
                        <span class="expand-icon" @click.stop="toggleGroupExpand(group.id)">
                            {{group.expanded ? '▼' : '▶'}}
                        </span>
                        <span class="group-name">📁 {{group.name}}</span>
                        
                        <!-- 图层组操作按钮 -->
                        <div class="group-actions">
                            <button @click.stop="toggleGroupVisibility(group)" 
                                    :class="{hidden: !group.visible}" class="layer-btn">
                                {{group.visible ? '👁️' : '🙈'}}
                            </button>
                            <button @click.stop="toggleGroupLock(group)"
                                    :class="{locked: group.locked}" class="layer-btn">
                                {{group.locked ? '🔒' : '🔓'}}
                            </button>
                            <button @click.stop="duplicateGroup(group)" class="layer-btn">📋</button>
                            <button @click.stop="deleteGroup(group)" class="layer-btn delete">🗑️</button>
                        </div>
                    </div>
                    
                    <!-- 图层组内容（可折叠） -->
                    <div v-if="group.expanded" class="group-content">
                        <div v-for="layer in getGroupLayers(group.id)" 
                             :key="layer.id" 
                             class="layer-item grouped"
                             :class="{active: activeObjectId === layer.id}"
                             @click="selectLayer(layer.id)">
                            <div class="layer-icon">
                                <div v-if="layer.type === 'image'" class="layer-thumbnail">
                                    <img :src="getLayerThumbnail(layer)" alt="缩略图" class="thumbnail-img" />
                                </div>
                                <div v-else-if="layer.type === 'text'" class="layer-text-icon">
                                    T
                                </div>
                                <div v-else class="layer-default-icon">
                                    📄
                                </div>
                            </div>
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
                                <button @click.stop="removeFromGroup(layer)" class="ungroup-btn">移出</button>
                                <button @click.stop="duplicateLayer(layer)" class="layer-btn">📋</button>
                                <button @click.stop="deleteLayer(layer)" class="layer-btn delete">🗑️</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div v-if="layers.length === 0" class="no-layers">
                    暂无图层
                </div>
            </div>
            
            <!-- 创建图层组对话框 -->
            <div v-if="showGroupDialog" class="group-dialog-overlay" @click="showGroupDialog = false">
                <div class="group-dialog" @click.stop>
                    <h3>创建图层组</h3>
                    <input v-model="newGroupName" placeholder="输入图层组名称" @keyup.enter="createGroup" />
                    <div class="dialog-actions">
                        <button @click="createGroup">创建</button>
                        <button @click="showGroupDialog = false">取消</button>
                    </div>
                </div>
            </div>
            
            <!-- 分配图层到组对话框 -->
            <div v-if="showAssignDialog" class="assign-dialog-overlay" @click="showAssignDialog = false">
                <div class="assign-dialog" @click.stop>
                    <h3>分配图层到组</h3>
                    <p>图层: {{selectedLayerForAssign?.name}}</p>
                    <select v-model="selectedGroupForAssign">
                        <option value="">选择图层组</option>
                        <option v-for="group in layerGroups" :key="group.id" :value="group.id">
                            {{group.name}}
                        </option>
                    </select>
                    <div class="dialog-actions">
                        <button @click="assignLayerToGroup">分配</button>
                        <button @click="showAssignDialog = false">取消</button>
                    </div>
                </div>
            </div>
        </div>
    `,

    setup() {
        const store = useCanvasStore();
        const { layers, activeObjectId, layerGroups, activeGroupId } = Vue.toRefs(store);
        
        // 图层组相关响应式数据
        const showGroupDialog = Vue.ref(false);
        const showAssignDialog = Vue.ref(false);
        const newGroupName = Vue.ref('');
        const selectedLayerForAssign = Vue.ref(null);
        const selectedGroupForAssign = Vue.ref('');
        
        // 计算属性：未分组的图层
        const ungroupedLayers = Vue.computed(() => {
            return layers.value.filter(layer => !layer.groupId);
        });

        // 获取画布实例的统一函数
        const getCanvasInstance = () => {
            // 尝试多种方式获取画布实例
            let canvasInstance = window.canvas || window.fabricCanvas;

            if (!canvasInstance) {
                const canvasElement = document.querySelector('#mainCanvas');
                if (canvasElement && canvasElement.__fabric) {
                    canvasInstance = canvasElement.__fabric;
                }
            }

            // 如果还是没找到，尝试通过 fabric 全局对象查找
            if (!canvasInstance && window.fabric && window.fabric.Canvas) {
                const canvasElement = document.querySelector('#mainCanvas');
                if (canvasElement) {
                    // 尝试从 fabric 的内部实例列表中查找
                    canvasInstance = canvasElement.__fabric;
                }
            }

            return canvasInstance;
        };

        // 获取图层缩略图的方法
        const getLayerThumbnail = (layer) => {
            const canvasInstance = getCanvasInstance();
            if (!canvasInstance) return '';
            
            const obj = canvasInstance.getObjects().find(o => o.id === layer.id);
            if (!obj) return '';
            
            try {
                // 如果是图片对象，尝试获取其源图片
                if (obj.type === 'image' && obj._element) {
                    return obj._element.src || obj.src || '';
                }
                
                // 对于其他类型，生成小尺寸的canvas缩略图
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = 32;
                tempCanvas.height = 32;
                const tempCtx = tempCanvas.getContext('2d');
                
                // 创建临时fabric canvas
                const tempFabricCanvas = new fabric.Canvas(tempCanvas);
                
                // 克隆对象并缩放到缩略图尺寸
                obj.clone((cloned) => {
                    const scale = Math.min(30 / cloned.width, 30 / cloned.height);
                    cloned.set({
                        left: 16,
                        top: 16,
                        scaleX: scale,
                        scaleY: scale
                    });
                    tempFabricCanvas.add(cloned);
                    tempFabricCanvas.renderAll();
                });
                
                return tempCanvas.toDataURL('image/png');
            } catch (error) {
                console.warn('生成缩略图失败:', error);
                return '';
            }
        };

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
            const currentViewId = store.activeViewId;
            if (!currentViewId) return;
            
            const newVisible = !layer.visible;
            const currentViewLayers = store.getViewLayers(currentViewId);
            const updatedLayers = currentViewLayers.map(l =>
                l.id === layer.id ? { ...l, visible: newVisible } : l
            );
            store.setViewLayers(currentViewId, updatedLayers);

            // 同步到画布对象
            syncLayerVisibilityToCanvas(layer.id, newVisible);
        };

        // 切换锁定状态
        const toggleLock = (layer) => {
            const currentViewId = store.activeViewId;
            if (!currentViewId) return;
            
            const newLocked = !layer.locked;
            const currentViewLayers = store.getViewLayers(currentViewId);
            const updatedLayers = currentViewLayers.map(l =>
                l.id === layer.id ? { ...l, locked: newLocked } : l
            );
            store.setViewLayers(currentViewId, updatedLayers);

            // 同步到画布对象
            syncLayerLockToCanvas(layer.id, newLocked);
        };

        // 复制图层
        const duplicateLayer = (layer, targetGroupId = null) => {
            const currentViewId = store.activeViewId;
            if (!currentViewId) return;
            
            // 先在画布中复制对象
            duplicateCanvasObject(layer.id);
            
            // 创建新的图层数据
            const newLayer = {
                id: 'layer_' + Date.now(),
                name: layer.name + '_副本',
                type: layer.type,
                visible: layer.visible,
                locked: layer.locked,
                groupId: targetGroupId || layer.groupId,
                groupOrder: targetGroupId ? getGroupLayers(targetGroupId).length : layer.groupOrder
            };
            
            // 添加到当前视图
            store.addLayerToView(currentViewId, newLayer);
        };

        // 删除图层
        const deleteLayer = (layer) => {
            if (confirm(`确定要删除图层 "${layer.name}" 吗？`)) {
                const currentViewId = store.activeViewId;
                if (!currentViewId) return;
                
                // 先从画布中删除对象
                deleteCanvasObject(layer.id);

                // 然后从当前视图的store中删除
                store.removeLayerFromView(currentViewId, layer.id);

                // 如果删除的是当前选中的图层，清除选中状态
                if (store.activeObjectId === layer.id) {
                    store.setActiveObjectId(null);
                }
            }
        };

        // 同步图层选中状态到画布
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

        // 同步图层可见性到画布
        const syncLayerVisibilityToCanvas = (layerId, visible) => {
            const canvasInstance = getCanvasInstance();

            if (canvasInstance) {
                const obj = canvasInstance.getObjects().find(o => o.id === layerId);
                if (obj) {
                    obj.set('visible', visible);
                    canvasInstance.renderAll();
                }
            }
        };

        // 同步图层锁定状态到画布
        const syncLayerLockToCanvas = (layerId, locked) => {
            const canvasInstance = getCanvasInstance();

            if (canvasInstance) {
                const obj = canvasInstance.getObjects().find(o => o.id === layerId);
                if (obj) {
                    obj.set('selectable', !locked);
                    obj.set('evented', !locked);
                    canvasInstance.renderAll();
                }
            }
        };

        // 复制画布对象
        const duplicateCanvasObject = (layerId) => {
            const canvasInstance = getCanvasInstance();

            if (canvasInstance) {
                const obj = canvasInstance.getObjects().find(o => o.id === layerId);
                if (obj) {
                    obj.clone((cloned) => {
                        cloned.set({
                            left: cloned.left + 10,
                            top: cloned.top + 10,
                            id: `layer_${Date.now()}`
                        });
                        canvasInstance.add(cloned);
                        canvasInstance.setActiveObject(cloned);
                        canvasInstance.renderAll();
                    });
                }
            }
        };

        // 删除画布对象
        const deleteCanvasObject = (layerId) => {
            const canvasInstance = getCanvasInstance();

            if (canvasInstance) {
                const obj = canvasInstance.getObjects().find(o => o.id === layerId);
                if (obj) {
                    canvasInstance.remove(obj);
                    canvasInstance.renderAll();
                }
            }
        };

        // 图层组相关方法
        const getGroupLayers = (groupId) => {
            return layers.value.filter(layer => layer.groupId === groupId)
                .sort((a, b) => a.groupOrder - b.groupOrder);
        };
        
        const createGroup = () => {
            if (!newGroupName.value.trim()) return;
            
            const currentViewId = store.activeViewId;
            if (!currentViewId) return;
            
            const newGroup = {
                id: 'group_' + Date.now(),
                name: newGroupName.value.trim(),
                visible: true,
                locked: false,
                expanded: true
            };
            
            const currentViewGroups = store.getViewLayerGroups(currentViewId);
            const updatedGroups = [...currentViewGroups, newGroup];
            store.setViewLayerGroups(currentViewId, updatedGroups);
            
            newGroupName.value = '';
            showGroupDialog.value = false;
        };
        
        const showGroupAssignDialog = (layer) => {
            selectedLayerForAssign.value = layer;
            selectedGroupForAssign.value = '';
            showAssignDialog.value = true;
        };
        
        const assignLayerToGroup = () => {
            if (!selectedLayerForAssign.value || !selectedGroupForAssign.value) return;
            
            const currentViewId = store.activeViewId;
            if (!currentViewId) return;
            
            const currentViewLayers = store.getViewLayers(currentViewId);
            const layerIndex = currentViewLayers.findIndex(l => l.id === selectedLayerForAssign.value.id);
            if (layerIndex !== -1) {
                const updatedLayers = [...currentViewLayers];
                updatedLayers[layerIndex] = {
                    ...updatedLayers[layerIndex],
                    groupId: selectedGroupForAssign.value,
                    groupOrder: getGroupLayers(selectedGroupForAssign.value).length
                };
                store.setViewLayers(currentViewId, updatedLayers);
            }
            
            showAssignDialog.value = false;
        };
        
        const removeFromGroup = (layer) => {
            const currentViewId = store.activeViewId;
            if (!currentViewId) return;
            
            const currentViewLayers = store.getViewLayers(currentViewId);
            const layerIndex = currentViewLayers.findIndex(l => l.id === layer.id);
            if (layerIndex !== -1) {
                const updatedLayers = [...currentViewLayers];
                updatedLayers[layerIndex] = {
                    ...updatedLayers[layerIndex],
                    groupId: null,
                    groupOrder: 0
                };
                store.setViewLayers(currentViewId, updatedLayers);
            }
        };
        
        const toggleGroup = (groupId) => {
            store.setActiveGroupId(activeGroupId.value === groupId ? null : groupId);
        };
        
        const toggleGroupExpand = (groupId) => {
            const groupIndex = layerGroups.value.findIndex(g => g.id === groupId);
            if (groupIndex !== -1) {
                const updatedGroups = [...layerGroups.value];
                updatedGroups[groupIndex] = {
                    ...updatedGroups[groupIndex],
                    expanded: !updatedGroups[groupIndex].expanded
                };
                store.setLayerGroups(updatedGroups);
            }
        };
        
        const toggleGroupVisibility = (group) => {
            const newVisible = !group.visible;
            
            // 更新组状态
            const groupIndex = layerGroups.value.findIndex(g => g.id === group.id);
            if (groupIndex !== -1) {
                const updatedGroups = [...layerGroups.value];
                updatedGroups[groupIndex] = { ...updatedGroups[groupIndex], visible: newVisible };
                store.setLayerGroups(updatedGroups);
            }
            
            // 同步组内所有图层
            const groupLayers = getGroupLayers(group.id);
            groupLayers.forEach(layer => {
                const layerIndex = layers.value.findIndex(l => l.id === layer.id);
                if (layerIndex !== -1) {
                    const updatedLayers = [...layers.value];
                    updatedLayers[layerIndex] = { ...updatedLayers[layerIndex], visible: newVisible };
                    store.setLayers(updatedLayers);
                    syncLayerVisibilityToCanvas(layer.id, newVisible);
                }
            });
        };
        
        const toggleGroupLock = (group) => {
            const newLocked = !group.locked;
            
            // 更新组状态
            const groupIndex = layerGroups.value.findIndex(g => g.id === group.id);
            if (groupIndex !== -1) {
                const updatedGroups = [...layerGroups.value];
                updatedGroups[groupIndex] = { ...updatedGroups[groupIndex], locked: newLocked };
                store.setLayerGroups(updatedGroups);
            }
            
            // 同步组内所有图层
            const groupLayers = getGroupLayers(group.id);
            groupLayers.forEach(layer => {
                const layerIndex = layers.value.findIndex(l => l.id === layer.id);
                if (layerIndex !== -1) {
                    const updatedLayers = [...layers.value];
                    updatedLayers[layerIndex] = { ...updatedLayers[layerIndex], locked: newLocked };
                    store.setLayers(updatedLayers);
                    syncLayerLockToCanvas(layer.id, newLocked);
                }
            });
        };
        
        const duplicateGroup = (group) => {
            // 复制组
            const newGroup = {
                id: 'group_' + Date.now(),
                name: group.name + '_副本',
                visible: group.visible,
                locked: group.locked,
                expanded: true
            };
            
            const updatedGroups = [...layerGroups.value, newGroup];
            store.setLayerGroups(updatedGroups);
            
            // 复制组内图层
            const groupLayers = getGroupLayers(group.id);
            groupLayers.forEach(layer => {
                duplicateLayer(layer, newGroup.id);
            });
        };
        
        const deleteGroup = (group) => {
            if (confirm(`确定要删除图层组 "${group.name}" 吗？组内的所有图层也将被删除。`)) {
                // 获取组内所有图层并删除
                const groupLayers = getGroupLayers(group.id);
                groupLayers.forEach(layer => {
                    // 从画布中删除对象
                    deleteCanvasObject(layer.id);
                });
                
                // 从图层列表中删除组内所有图层
                const updatedLayers = layers.value.filter(layer => layer.groupId !== group.id);
                store.setLayers(updatedLayers);
                
                // 删除组
                const updatedGroups = layerGroups.value.filter(g => g.id !== group.id);
                store.setLayerGroups(updatedGroups);
                
                // 清除选中状态
                if (activeGroupId.value === group.id) {
                    store.setActiveGroupId(null);
                }
            }
        };

        return {
            // 从 store 获取的数据
            canvasIds: Vue.computed(() => Object.keys(store.canvasStates)),
            activeCanvasId: Vue.computed(() => store.activeCanvasId),
            layers: Vue.computed(() => store.layers),
            activeObjectId: Vue.computed(() => store.activeObjectId),
            layerGroups: Vue.computed(() => store.layerGroups),
            activeGroupId: Vue.computed(() => store.activeGroupId),
            
            // 计算属性
            ungroupedLayers,
            
            // 图层组相关数据
            showGroupDialog,
            showAssignDialog,
            newGroupName,
            selectedLayerForAssign,
            selectedGroupForAssign,

            // 方法
            switchCanvas: (id) => store.setActiveCanvasId(id),
            addLayer,
            selectLayer,
            toggleVisibility,
            toggleLock,
            duplicateLayer,
            deleteLayer,
            getLayerThumbnail,
            
            // 图层组方法
            getGroupLayers,
            createGroup,
            showGroupAssignDialog,
            assignLayerToGroup,
            removeFromGroup,
            toggleGroup,
            toggleGroupExpand,
            toggleGroupVisibility,
            toggleGroupLock,
            duplicateGroup,
            deleteGroup
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
window.addLayerToStore = function (layerId, layerName, layerType) {
    if (typeof window.useCanvasStore === 'function') {
        try {
            const store = window.useCanvasStore();
            const currentViewId = store.activeViewId;
            
            if (!currentViewId) {
                console.warn('没有激活的视图，无法添加图层');
                return;
            }

            // 检查当前视图的图层是否已存在
            const currentViewLayers = store.getViewLayers(currentViewId);
            const existingLayer = currentViewLayers.find(layer => layer.id === layerId);
            if (existingLayer) {
                return; // 图层已存在，不重复添加
            }

            const newLayer = {
                id: layerId,
                name: layerName.length > 20 ? layerName.substring(0, 20) + '...' : layerName,
                type: layerType,
                visible: true,
                locked: false,
                groupId: null,          // 新增：默认未分组
                groupOrder: 0           // 新增：组内排序
            };

            // 添加图层到当前视图
            store.addLayerToView(currentViewId, newLayer);
            store.setActiveObjectId(layerId);

        } catch (error) {
            console.error('添加图层到管理系统失败:', error);
        }
    }
};
