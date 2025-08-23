// src/components/layers.js

// 导入 Pinia 仓库和 pinia 实例
import { useCanvasStore, usePrintMethodStore, pinia } from '../stores/index.js';

// 创建图层管理 Vue 应用
const layersApp = Vue.createApp({
    template: `
        <div class="layers-panel">
            
            
            <div class="layers-list">
                <!-- 未分组图层提示区域 -->
                <div v-if="currentViewUngroupedLayers.length > 0">
                        <div v-for="layer in currentViewUngroupedLayers" :key="layer.id" 
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
                            <div class="layer-info">
                                <div class="layer-name">
                                    <div class="layer-type">{{ layer.type || 'unknown' }}</div>
                                    <div class="layer-controls">                               
                                        <button @click.stop="toggleLock(layer)" class="layer-btn">
                                            <i :class="layer.locked ? 'iconfont icon-suoding' : 'iconfont icon-jiesuo'"></i>
                                        </button>
                                        <button @click.stop="deleteLayer(layer)" class="layer-btn delete">
                                            <i class="iconfont icon-shanchu"></i>
                                        </button>
                                        <button 
                                            @click.stop="duplicateLayer(layer)" 
                                            class="layer-btn layer-copy"
                                            :class="{ 'disabled': !isLayerCopyAllowed(layer.id) }"
                                            :disabled="!isLayerCopyAllowed(layer.id)"
                                            :title="isLayerCopyAllowed(layer.id) ? 'Copy layer' : 'Copy not allowed for this print method'"
                                        >
                                            <i class="iconfont icon-fuzhi"></i>
                                        </button>                                       
                                    </div>
                                </div>
                                <div v-if="layer.type === 'image'" class="layer-img-info">
                                    <div v-if="getImageLayerInfo(layer)" class="image-details">
                                                                              <div class="image-meta">{{ getImageLayerInfo(layer).name }} <br> {{ getImageLayerInfo(layer).dpi }}</div>

                                    </div>
                                </div>
                                <div class="layer-actions">
                                    <button @click.stop="showGroupAssignDialog(layer)" class="assign-btn"><i class="iconfont icon-dayin"></i>Switch Printing Method</button>                               
                                </div>
                            </div>
                            
                           
                            
                        </div>
                </div>
                
                <!-- 图层组列表 -->
                <div v-for="group in currentViewLayerGroups" :key="group.id" class="layer-group">
                    <!-- 图层组头部 -->
                    <div class="group-header" 
                         :class="{active: activeGroupId === group.id}"
                         @click="toggleGroup(group.id)">
                   
                        <div class="group-name">{{group.name}}</div>
                        
                        <!-- 图层组操作按钮 -->
                        <div class="group-actions">
                            <div class="selectOnlyLayer">
                                <input type="checkbox" v-model="group.selectOnly" />
                                <label>Select Only Layer</label>
                            </div>
                            <div class="group-actions-buttonBox">
                                <!-- 修改图层组印刷方式按钮 -->
                                <button @click.stop="showGroupPrintMethodDialog(group)" class="layer-btn pwca-group-print-method"
                                        title="修改图层组印刷方式">
                                    <i class="iconfont icon-dayin"></i>
                                </button>  
                                <button @click.stop="toggleGroupLock(group)"
                                        :class="{locked: group.locked}" class="layer-btn">
                                    <i :class="group.locked ? 'iconfont icon-suoding' : 'iconfont icon-jiesuo'"></i>
                                </button>
                                <button 
                                    @click.stop="deleteGroup(group)" 
                                    class="layer-btn delete"
                                    :class="{ 'disabled': !isGroupDeleteAllowed(group.id) }"
                                    :disabled="!isGroupDeleteAllowed(group.id)"
                                    :title="isGroupDeleteAllowed(group.id) ? 'Delete group' : 'Delete not allowed for this print method'"
                                >
                                    <i class="iconfont icon-shanchu"></i>
                                </button>
                                <button 
                                    @click.stop="duplicateGroup(group)" 
                                    class="layer-btn group-copy"

                                    :class="{ 'disabled': !isGroupCopyAllowed(group.id) }"
                                    :disabled="!isGroupCopyAllowed(group.id)"
                                    :title="isGroupCopyAllowed(group.id) ? 'Copy group' : 'Copy not allowed for this print method'"
                                >
                                    <i class="iconfont icon-fuzhi"></i>
                                </button>  
                            </div>                                                                                                          
                        </div>
                    </div>
                    
                    <!-- 图层组内容（可折叠） -->
                    <div v-if="group.expanded" class="group-content">
                        <div v-for="layer in getGroupLayers(group.id)" 
                             :key="layer.id" 
                             class="layer-item grouped"
                             :class="{active: activeObjectId === layer.id}"
                             @click="selectLayer(layer.id)">
                            <div class="layer-xiaji-icon">
                                <i class="iconfont icon-xiaji"></i>                            
                            </div>
                            <div class="layer-icon">
                                
                                <div v-if="layer.type === 'image'" class="layer-thumbnail">
                                    <img :src="getLayerThumbnail(layer)" alt="缩略图" class="thumbnail-img" />
                                </div>
                                <div v-else-if="layer.type === 'text'" class="layer-text-icon">
                                    T
                                </div>                               
                            </div>
                            <div class="layer-info">
                                <div class="layer-name">
                                    <div class="layer-type">{{ layer.type || 'unknown' }}</div>
                                    <div class="layer-controls">                               
                                        <button @click.stop="toggleLock(layer)" class="layer-btn">
                                            <i :class="layer.locked ? 'iconfont icon-suoding' : 'iconfont icon-jiesuo'"></i>
                                        </button>
                                        <button @click.stop="deleteLayer(layer)" class="layer-btn delete">
                                            <i class="iconfont icon-shanchu"></i>
                                        </button>
                                        <button 
                                            @click.stop="duplicateLayer(layer)" 
                                            class="layer-btn layer-copy"
                                            :class="{ 'disabled': !isLayerCopyAllowed(layer.id) }"
                                            :disabled="!isLayerCopyAllowed(layer.id)"
                                            :title="isLayerCopyAllowed(layer.id) ? 'Copy layer' : 'Copy not allowed for this print method'"
                                        >
                                            <i class="iconfont icon-fuzhi"></i>
                                        </button>                                       
                                    </div>
                                </div>
                                <div v-if="layer.type === 'image'" class="layer-img-info">
                                    <div v-if="getImageLayerInfo(layer)" class="image-details">
                                                                              <div class="image-meta">{{ getImageLayerInfo(layer).name }} <br> {{ getImageLayerInfo(layer).dpi }}</div>

                                    </div>
                                </div>
                                <div class="layer-actions">
                                    <button @click.stop="showGroupAssignDialog(layer)" class="assign-btn"><i class="iconfont icon-dayin"></i>Switch Printing Method</button>                               
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div v-if="layers.length === 0" class="no-layers">
                    No Layers
                </div>
            </div>
            
            <!-- 创建图层组对话框 -->
            <div v-if="showGroupDialog" class="group-dialog-overlay" @click="showGroupDialog = false">
                <div class="group-dialog" @click.stop>
                    <h3>Create Layer Group</h3>
                    <input v-model="newGroupName" placeholder="Enter layer group name" @keyup.enter="createGroup" />
                    <div class="dialog-actions">
                        <button @click="createGroup">Create</button>
                        <button @click="showGroupDialog = false">Cancel</button>
                    </div>
                </div>
            </div>
            
            <!-- 打印方法选择对话框 -->
            <div v-if="showPrintMethodDialog" class="print-method-dialog-overlay" @click="showPrintMethodDialog = false">
                <div class="print-method-dialog" @click.stop>
                    <div class="dialog-header">
                        <h3>Print Method Setting</h3>
                        <button class="close-btn" @click="showPrintMethodDialog = false">×</button>
                    </div>
                    
                    <div class="print-methods">
                        <div class="method-grid">
                            <label v-for="method in printMethods" :key="method.id" class="method-option">
                                <input 
                                    type="radio" 
                                    v-model="selectedPrintMethodId" 
                                    :value="method.id" 
                                    name="printMethod" 
                                />
                                <span class="method-label">{{ method.label }}</span>                               
                            </label>
                        </div>
                    </div>
                    
                    <div class="method-tabs">
                        <div class="tab" :class="{active: activeTab === 'color'}" @click="activeTab = 'color'">Color</div>
                        <div class="tab" :class="{active: activeTab === 'moq'}" @click="activeTab = 'moq'">MOQ</div>
                        <div class="tab" :class="{active: activeTab === 'printarea'}" @click="activeTab = 'printarea'">Print Area</div>
                    </div>
                    
                    <div class="tab-content">
                        <div v-if="activeTab === 'color'" class="color-content">
                            <!-- Color 选项卡内容 -->
                            <p>Color settings will be displayed here</p>
                        </div>
                        <div v-if="activeTab === 'moq'" class="moq-content">
                            <!-- MOQ 选项卡内容 -->
                            <p>MOQ settings will be displayed here</p>
                        </div>
                        <div v-if="activeTab === 'printarea'" class="printarea-content">
                            <!-- Print Area 选项卡内容 -->
                            <p>Print Area settings will be displayed here</p>
                        </div>
                    </div>
                    
                    <div class="dialog-actions">
                        <button @click="assignLayerToPrintMethod" class="save-btn">Save</button>
                    </div>
                </div>
            </div>
            
            <!-- 图层组印刷方式修改弹窗 -->
            <div class="modal micromodal-slide" id="pwca-group-print-method-modal" aria-hidden="true">
                <div class="modal__overlay" tabindex="-1" data-micromodal-close>
                    <div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="pwca-group-print-method-title">
                        <header class="modal__header">
                            <h2 class="modal__title" id="pwca-group-print-method-title">修改图层组印刷方式</h2>
                            <button class="modal__close" aria-label="Close modal" data-micromodal-close></button>
                        </header>
                        <main class="modal__content">
                            <div class="pwca-group-info" v-if="selectedGroupForPrintMethod">
                                <h4>图层组信息</h4>
                                <p><strong>名称:</strong> {{ selectedGroupForPrintMethod.name }}</p>
                                <p><strong>图层数量:</strong> {{ getGroupLayers(selectedGroupForPrintMethod.id).length }}</p>
                            </div>
                            
                            <div class="pwca-print-method-selection">
                                <h4>选择新的印刷方式</h4>
                                <div class="method-grid">
                                    <label v-for="method in printMethods" :key="method.id" class="method-option">
                                        <input 
                                            type="radio" 
                                            v-model="selectedGroupPrintMethodId" 
                                            :value="method.id" 
                                            name="groupPrintMethod" 
                                        />
                                        <span class="method-label">{{ method.label }}</span>
                                        <div class="method-description" v-if="method.description">
                                            {{ method.description }}
                                        </div>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="pwca-affected-layers" v-if="selectedGroupForPrintMethod">
                                <h4>将要修改的图层</h4>
                                <div class="layer-list">
                                    <div v-for="layer in getGroupLayers(selectedGroupForPrintMethod.id)" :key="layer.id" class="layer-preview">
                                        <div class="layer-thumbnail">
                                            <img v-if="layer.type === 'image'" :src="getLayerThumbnail(layer)" alt="缩略图" />
                                            <div v-else-if="layer.type === 'text'" class="text-icon">T</div>
                                            <div v-else class="default-icon">📄</div>
                                        </div>
                                        <span class="layer-name">{{ layer.name || layer.type }}</span>
                                    </div>
                                </div>
                            </div>
                        </main>
                        <footer class="modal__footer">
                            <button class="modal__btn" data-micromodal-close>取消</button>
                            <button class="modal__btn modal__btn-primary" @click="confirmGroupPrintMethodChange">确认修改</button>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    `,

    setup() {
        // 确保store在Pinia初始化后才调用
        let store, printMethodStore;

        try {
            store = useCanvasStore();
            printMethodStore = usePrintMethodStore();
        } catch (error) {
            console.error('Failed to initialize stores:', error);
            // 返回空的响应式对象作为fallback
            return {
                layers: Vue.ref([]),
                activeObjectId: Vue.ref(null),
                layerGroups: Vue.ref([]),
                printMethods: Vue.ref([]),
                ungroupedLayers: Vue.computed(() => []),
                showGroupDialog: Vue.ref(false),
                showPrintMethodDialog: Vue.ref(false),
                isLayerCopyAllowed: () => true,
                selectLayer: () => { },
                duplicateLayer: () => { },
                deleteLayer: () => { },
                toggleLock: () => { },
                getLayerThumbnail: () => '',
                getImageLayerInfo: () => null,
                showGroupAssignDialog: () => { },
                assignLayerToPrintMethod: () => { }
            };
        }

        // 使用计算属性来确保响应式更新
        const layers = Vue.computed(() => store.layers);
        const activeObjectId = Vue.computed(() => store.activeObjectId);
        const layerGroups = Vue.computed(() => store.layerGroups);
        const activeGroupId = Vue.computed(() => store.activeGroupId);
        const views = Vue.computed(() => store.views);
        const activeViewId = Vue.computed(() => store.activeViewId);
        
        // 当前视图的图层和图层组
        const currentViewLayers = Vue.computed(() => {
            if (!activeViewId.value) return [];
            return store.getViewLayers(activeViewId.value);
        });
        
        const currentViewLayerGroups = Vue.computed(() => {
            if (!activeViewId.value) return [];
            return store.getViewLayerGroups(activeViewId.value);
        });

        // 打印方式相关的计算属性
        const printMethods = Vue.computed(() => printMethodStore.currentViewPrintMethods);
        const selectedPrintMethod = Vue.computed(() => printMethodStore.selectedPrintMethod);

        // 图层组相关响应式数据
        const showGroupDialog = Vue.ref(false);
        const showPrintMethodDialog = Vue.ref(false);
        const newGroupName = Vue.ref('');
        const selectedLayerForAssign = Vue.ref(null);
        const selectedPrintMethodId = Vue.ref(printMethodStore.selectedPrintMethodId);
        const activeTab = Vue.ref('color');
        
        // 图层组印刷方式修改相关数据
        const selectedGroupForPrintMethod = Vue.ref(null);
        const selectedGroupPrintMethodId = Vue.ref(null);

        // 计算属性：当前视图未分组的图层
        const currentViewUngroupedLayers = Vue.computed(() => {
            return currentViewLayers.value.filter(layer => !layer.groupId);
        });
        
        // 兼容性：保持原有的ungroupedLayers计算属性
        const ungroupedLayers = Vue.computed(() => {
            return layers.value.filter(layer => !layer.groupId);
        });

        // 视图切换方法
        const switchToView = (viewId) => {
            store.setActiveViewId(viewId);
            
            // 更新 CanvasManager 的激活画布
            if (window.CanvasManager) {
                window.CanvasManager.setActiveCanvas(viewId);
            }
            
            // 触发视图切换事件，让其他组件也能响应
            const event = new CustomEvent('layerPanelViewSwitch', {
                detail: { viewId: viewId }
            });
            document.dispatchEvent(event);
        };
        
        // 获取当前视图名称
        const getCurrentViewName = () => {
            if (!activeViewId.value) return 'No View';
            const currentView = views.value.find(view => view.id === activeViewId.value);
            return currentView ? currentView.name : 'Unknown View';
        };
        
        // 监听视图切换，确保图层数据正确更新
        Vue.watch(() => store.activeViewId, (newViewId) => {
            if (newViewId) {
                // 强制更新组件
                Vue.nextTick(() => {
                    // 图层数据已更新
                });
            }
        }, { immediate: true });

        // 监听图层缩略图刷新事件
        Vue.onMounted(() => {
            const handleThumbnailRefresh = (event) => {
                if (event.detail && event.detail.layerId) {
                    // 清除特定图层的缓存
                    clearThumbnailCache(event.detail.layerId);
                } else {
                    // 清除所有缓存
                    clearThumbnailCache();
                }
                // 强制重新渲染
                Vue.nextTick(() => {
                    // 触发响应式更新
                });
            };

            document.addEventListener('layerThumbnailRefresh', handleThumbnailRefresh);

            // 组件卸载时清除事件监听
            Vue.onUnmounted(() => {
                document.removeEventListener('layerThumbnailRefresh', handleThumbnailRefresh);
            });
        });

        // 获取画布实例的统一函数
        const getCanvasInstance = () => {
            // 使用 Canvas 管理器获取当前激活视图的画布实例
            if (window.CanvasManager) {
                return window.CanvasManager.getActiveCanvas();
            }
            
            // 尝试多种方式获取画布实例（向后兼容）
            let canvasInstance = window.canvas || window.fabricCanvas;

            if (!canvasInstance) {
                // 多视图模式：尝试获取当前激活视图的画布
                if (store.activeViewId) {
                    const canvasElement = document.querySelector(`#mainCanvas-${store.activeViewId}`);
                    if (canvasElement && canvasElement.__fabricCanvas) {
                        canvasInstance = canvasElement.__fabricCanvas;
                    }
                }
                
                // 单视图模式：尝试获取主画布
                if (!canvasInstance) {
                    const canvasElement = document.querySelector('#mainCanvas');
                    if (canvasElement && canvasElement.__fabricCanvas) {
                        canvasInstance = canvasElement.__fabricCanvas;
                    }
                }
            }

            return canvasInstance;
        };

        // 缩略图缓存
        const thumbnailCache = Vue.ref(new Map());

        // 获取图层缩略图的方法
        const getLayerThumbnail = (layer) => {
            // 首先检查缓存
            if (thumbnailCache.value.has(layer.id)) {
                const cached = thumbnailCache.value.get(layer.id);
                // 检查缓存是否仍然有效（缓存时间不超过5分钟）
                if (Date.now() - cached.timestamp < 300000) {
                    return cached.src;
                }
            }

            const canvasInstance = getCanvasInstance();
            if (!canvasInstance) {
                return '';
            }

            const obj = canvasInstance.getObjects().find(o => o.id === layer.id);
            if (!obj) {
                return '';
            }

            try {
                // 统一生成缩略图的方法，确保所有类型的图层都有合适的缩略图大小
                return generateThumbnail(obj, layer.id);

            } catch (error) {
                console.warn('生成缩略图失败:', error);
                return '';
            }
        };

        // 生成缩略图的统一方法
        const generateThumbnail = (obj, layerId) => {
            try {
                // 设置缩略图的固定尺寸
                const THUMBNAIL_SIZE = 32;
                const THUMBNAIL_PADDING = 2;
                const CONTENT_SIZE = THUMBNAIL_SIZE - (THUMBNAIL_PADDING * 2);

                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = THUMBNAIL_SIZE;
                tempCanvas.height = THUMBNAIL_SIZE;
                const tempCtx = tempCanvas.getContext('2d');

                // 清除画布并设置背景
                tempCtx.fillStyle = '#f5f5f5';
                tempCtx.fillRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);

                // 如果是图片对象，直接绘制图片
                if (obj.type === 'image') {
                    return generateImageThumbnail(obj, layerId, tempCanvas, tempCtx, CONTENT_SIZE, THUMBNAIL_PADDING);
                }

                // 对于其他类型，使用 Fabric.js 渲染
                const tempFabricCanvas = new fabric.Canvas(tempCanvas);

                obj.clone((cloned) => {
                    try {
                        // 计算缩放比例，确保对象适合缩略图
                        const objWidth = cloned.width * cloned.scaleX || cloned.width || 100;
                        const objHeight = cloned.height * cloned.scaleY || cloned.height || 100;
                        
                        const scale = Math.min(
                            CONTENT_SIZE / objWidth,
                            CONTENT_SIZE / objHeight
                        );

                        cloned.set({
                            left: THUMBNAIL_SIZE / 2,
                            top: THUMBNAIL_SIZE / 2,
                            scaleX: scale,
                            scaleY: scale,
                            originX: 'center',
                            originY: 'center'
                        });

                        tempFabricCanvas.add(cloned);
                        tempFabricCanvas.renderAll();
                    } catch (error) {
                        console.warn('生成克隆缩略图失败:', error);
                    }
                });

                const dataUrl = tempCanvas.toDataURL('image/png');
                tempFabricCanvas.dispose();

                // 缓存生成的缩略图
                if (dataUrl) {
                    thumbnailCache.value.set(layerId, {
                        src: dataUrl,
                        timestamp: Date.now()
                    });
                }

                return dataUrl;

            } catch (error) {
                console.warn('生成缩略图失败:', error);
                return '';
            }
        };

        // 专门为图片对象生成缩略图
        const generateImageThumbnail = (obj, layerId, canvas, ctx, contentSize, padding) => {
            try {
                // 获取图片源
                let imageElement = null;
                let imageSrc = '';

                // 尝试多种方式获取图片元素和源
                if (obj._element && obj._element.src) {
                    imageElement = obj._element;
                    imageSrc = obj._element.src;
                } else if (obj.src) {
                    imageSrc = obj.src;
                } else if (obj._originalElement && obj._originalElement.src) {
                    imageElement = obj._originalElement;
                    imageSrc = obj._originalElement.src;
                } else if (obj.getElement && obj.getElement()) {
                    const element = obj.getElement();
                    if (element && element.src) {
                        imageElement = element;
                        imageSrc = element.src;
                    }
                }

                // 如果没有找到图片源，从上传列表中查找
                if (!imageSrc && window.uploadedImages) {
                    const matchedImg = window.uploadedImages.find(img => {
                        return img.fileName === obj.layerName || 
                               (obj.id && img.layerId === obj.id);
                    });
                    if (matchedImg && matchedImg.src) {
                        imageSrc = matchedImg.src;
                    }
                }

                if (!imageSrc) {
                    console.warn('无法获取图片源，使用默认方法生成缩略图');
                    return generateThumbnail(obj, layerId);
                }

                // 如果有图片元素，直接绘制
                if (imageElement && imageElement.complete) {
                    drawImageThumbnail(ctx, imageElement, contentSize, padding);
                    const dataUrl = canvas.toDataURL('image/png');
                    
                    // 缓存缩略图
                    thumbnailCache.value.set(layerId, {
                        src: dataUrl,
                        timestamp: Date.now()
                    });
                    
                    return dataUrl;
                }

                // 如果没有图片元素或图片未加载完成，创建新的图片元素
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                // 使用 Promise 处理异步加载，但返回占位符
                img.onload = () => {
                    try {
                        drawImageThumbnail(ctx, img, contentSize, padding);
                        const dataUrl = canvas.toDataURL('image/png');
                        
                        // 更新缓存
                        thumbnailCache.value.set(layerId, {
                            src: dataUrl,
                            timestamp: Date.now()
                        });

                        // 触发重新渲染
                        const refreshEvent = new CustomEvent('layerThumbnailRefresh', {
                            detail: { layerId: layerId }
                        });
                        document.dispatchEvent(refreshEvent);
                        
                    } catch (error) {
                        console.warn('绘制图片缩略图失败:', error);
                    }
                };

                img.onerror = () => {
                    console.warn('图片加载失败:', imageSrc);
                };

                img.src = imageSrc;

                // 返回加载中的占位符
                ctx.fillStyle = '#e0e0e0';
                ctx.fillRect(padding, padding, contentSize, contentSize);
                ctx.fillStyle = '#999';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('...', canvas.width / 2, canvas.height / 2 + 3);

                return canvas.toDataURL('image/png');

            } catch (error) {
                console.warn('生成图片缩略图失败:', error);
                return '';
            }
        };

        // 绘制图片缩略图的辅助函数
        const drawImageThumbnail = (ctx, imageElement, contentSize, padding) => {
            const imgWidth = imageElement.naturalWidth || imageElement.width;
            const imgHeight = imageElement.naturalHeight || imageElement.height;

            if (imgWidth === 0 || imgHeight === 0) {
                console.warn('图片尺寸无效');
                return;
            }

            // 计算缩放比例，保持宽高比
            const scale = Math.min(contentSize / imgWidth, contentSize / imgHeight);
            const scaledWidth = imgWidth * scale;
            const scaledHeight = imgHeight * scale;

            // 计算居中位置
            const x = padding + (contentSize - scaledWidth) / 2;
            const y = padding + (contentSize - scaledHeight) / 2;

            // 绘制图片
            ctx.drawImage(imageElement, x, y, scaledWidth, scaledHeight);
        };

        // 获取图片图层信息的方法
        const getImageLayerInfo = (layer) => {
            const canvasInstance = getCanvasInstance();
            if (!canvasInstance) return null;

            const obj = canvasInstance.getObjects().find(o => o.id === layer.id);
            if (!obj || obj.type !== 'image') return null;

            try {
                let imageName = 'Unknown';
                let src = '';

                // 获取图片源
                if (obj._element && obj._element.src) {
                    src = obj._element.src;
                } else if (obj.src) {
                    src = obj.src;
                }

                // 从上传图片列表中查找匹配的文件名（参考用户提供的代码）
                if (src && window.uploadedImages) {
                    const matchedImg = window.uploadedImages.find(img => img.src === src);
                    if (matchedImg && matchedImg.fileName) {
                        imageName = matchedImg.fileName; // 直接使用原始文件名
                    }
                }

                // 如果没有找到匹配的文件名，尝试从URL提取
                if (imageName === 'Unknown' && src) {
                    if (src.startsWith('data:image/')) {
                        // base64图片，使用默认名称
                        imageName = 'image.jpg';
                    } else {
                        // URL图片，提取文件名
                        const urlParts = src.split('/');
                        imageName = urlParts[urlParts.length - 1];
                        // 移除查询参数
                        if (imageName.includes('?')) {
                            imageName = imageName.split('?')[0];
                        }
                    }
                }

                // 最后的回退方案
                if (imageName === 'Unknown' || imageName === '') {
                    if (layer.name && layer.name !== layer.id) {
                        imageName = layer.name;
                    } else {
                        imageName = `Image_${layer.id.replace('layer_', '')}.jpg`;
                    }
                }

                // 获取图片格式
                let format = 'Unknown';
                if (src && src.startsWith('data:image/')) {
                    const match = src.match(/^data:(image\/[a-zA-Z0-9.+-]+);/);
                    if (match) {
                        format = match[1].replace('image/', '').toUpperCase();
                    }
                } else if (imageName.includes('.')) {
                    const extension = imageName.split('.').pop().toLowerCase();
                    switch (extension) {
                        case 'jpg':
                        case 'jpeg':
                            format = 'JPEG';
                            break;
                        case 'png':
                            format = 'PNG';
                            break;
                        case 'gif':
                            format = 'GIF';
                            break;
                        case 'svg':
                            format = 'SVG';
                            break;
                        case 'webp':
                            format = 'WebP';
                            break;
                        default:
                            format = extension.toUpperCase();
                    }
                }

                // 获取DPI信息（参考用户提供的demo代码实现）
                let dpiText = 'Unknown DPI';

                // 尝试从图片元素获取DPI信息
                if (obj._element && obj._element.src && obj._element.src.startsWith('data:image/')) {
                    // 对于base64图片，尝试解析DPI
                    try {
                        const base64Data = obj._element.src.split(',')[1];
                        const binaryString = atob(base64Data);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }

                        let dpi = null;
                        // 根据图片格式选择相应的DPI解析函数
                        if (format === 'JPEG') {
                            dpi = getDpiFromJPEG(bytes.buffer);
                        } else if (format === 'PNG') {
                            dpi = getDpiFromPNG(bytes.buffer);
                        }

                        if (dpi && dpi.x > 0) {
                            if (dpi.x >= 300) {
                                dpiText = `Good ${dpi.x}DPI`;
                            } else if (dpi.x >= 150) {
                                dpiText = `${dpi.x}DPI`;
                            } else {
                                dpiText = `Low ${dpi.x}DPI`;
                            }
                        } else {
                            dpiText = 'Low 72DPI'; // 默认值
                        }
                    } catch (error) {
                        dpiText = 'Low 72DPI'; // 解析失败时的默认值
                    }
                } else {
                    dpiText = 'Low 72DPI'; // 非base64图片的默认值
                }

                return {
                    name: imageName,
                    format: format,
                    dpi: dpiText
                };
            } catch (error) {
                console.warn('获取图片信息失败:', error);
                return null;
            }
        };

        // DPI解析函数（根据用户提供的demo代码实现）
        const getDpiFromJPEG = (arrayBuffer) => {
            const view = new DataView(arrayBuffer);
            let offset = 0;

            // 检查文件是否为JPEG (SOI marker 0xFFD8)
            if (view.getUint16(offset, false) !== 0xFFD8) {
                return null;
            }
            offset += 2;

            // 遍历JPEG段来寻找APP0 (JFIF) 段
            while (offset < view.byteLength - 1) {
                const marker = view.getUint16(offset, false);
                offset += 2;

                // 如果是APP0 (JFIF) 段 (0xFFE0)
                if (marker === 0xFFE0) {
                    const length = view.getUint16(offset, false);
                    if (offset + length > view.byteLength) break;

                    const identifier = String.fromCharCode(
                        view.getUint8(offset + 2),
                        view.getUint8(offset + 3),
                        view.getUint8(offset + 4),
                        view.getUint8(offset + 5),
                        view.getUint8(offset + 6)
                    );

                    if (identifier === 'JFIF\0') {
                        const units = view.getUint8(offset + 9);
                        const xDensity = view.getUint16(offset + 10, false);
                        const yDensity = view.getUint16(offset + 12, false);

                        // units === 1 表示DPI, units === 2 表示DPCm
                        if (units === 1 && xDensity > 0 && yDensity > 0) {
                            return { x: xDensity, y: yDensity };
                        } else if (units === 2 && xDensity > 0 && yDensity > 0) {
                            // 转换DPCm到DPI (1 inch = 2.54 cm)
                            return { x: Math.round(xDensity * 2.54), y: Math.round(yDensity * 2.54) };
                        }
                    }
                    offset += length;
                } else {
                    // 移动到下一个段
                    if (offset >= view.byteLength - 1) break;
                    const segmentLength = view.getUint16(offset, false);
                    if (segmentLength === 0 || offset + segmentLength > view.byteLength) break;
                    offset += segmentLength;
                }
            }

            return null; // 没有找到DPI信息
        };

        // PNG DPI解析函数（根据用户提供的demo代码实现）
        const getDpiFromPNG = (arrayBuffer) => {
            const view = new DataView(arrayBuffer);
            let offset = 0;

            // 检查PNG文件头 (89 50 4E 47 0D 0A 1A 0A)
            const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
            for (let i = 0; i < pngSignature.length; i++) {
                if (view.getUint8(offset + i) !== pngSignature[i]) {
                    return null;
                }
            }
            offset += 8;

            // 遍历PNG块来寻找pHYs块
            while (offset < view.byteLength - 8) {
                const length = view.getUint32(offset, false);
                const type = String.fromCharCode(
                    view.getUint8(offset + 4),
                    view.getUint8(offset + 5),
                    view.getUint8(offset + 6),
                    view.getUint8(offset + 7)
                );

                if (type === 'pHYs') {
                    const pixelsPerUnitX = view.getUint32(offset + 8, false);
                    const pixelsPerUnitY = view.getUint32(offset + 12, false);
                    const unitSpecifier = view.getUint8(offset + 16);

                    // unitSpecifier === 1 表示每米像素数
                    if (unitSpecifier === 1 && pixelsPerUnitX > 0 && pixelsPerUnitY > 0) {
                        // 转换为DPI (1 meter = 39.3701 inches)
                        const dpiX = Math.round(pixelsPerUnitX / 39.3701);
                        const dpiY = Math.round(pixelsPerUnitY / 39.3701);
                        return { x: dpiX, y: dpiY };
                    }
                }

                // 移动到下一个块
                offset += 8 + length + 4; // 4 bytes length + 4 bytes type + data + 4 bytes CRC
            }

            return null; // 没有找到DPI信息
        };

        // 添加图层的方法
        const addLayer = () => {
            const newLayer = {
                id: `layer_${Date.now()
                    }`,
                name: `图层 ${store.layers.length + 1
                    }`,
                type: 'text',
                visible: true,
                locked: false
            };

            const updatedLayers = [
                ...store.layers,
                newLayer
            ];
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
            if (!currentViewId)
                return;


            const newVisible = !layer.visible;
            const currentViewLayers = store.getViewLayers(currentViewId);
            const updatedLayers = currentViewLayers.map(l => l.id === layer.id ? {
                ...l,
                visible: newVisible
            } : l);
            store.setViewLayers(currentViewId, updatedLayers);

            // 同步到画布对象
            syncLayerVisibilityToCanvas(layer.id, newVisible);
        };

        // 切换锁定状态
        const toggleLock = (layer) => {
            const currentViewId = store.activeViewId;
            if (!currentViewId)
                return;


            const newLocked = !layer.locked;
            const currentViewLayers = store.getViewLayers(currentViewId);
            const updatedLayers = currentViewLayers.map(l => l.id === layer.id ? {
                ...l,
                locked: newLocked
            } : l);
            store.setViewLayers(currentViewId, updatedLayers);

            // 同步到画布对象
            syncLayerLockToCanvas(layer.id, newLocked);
        };

        // 检查图层是否允许复制
        const isLayerCopyAllowed = (layerId) => {
            return printMethodStore.isLayerCopyAllowed(layerId);
        };

        // 检查图层是否允许删除
        const isLayerDeleteAllowed = (layerId) => {
            return printMethodStore.isLayerDeleteAllowed(layerId);
        };

        // 检查图层组是否允许复制
        const isGroupCopyAllowed = (groupId) => {
            return printMethodStore.isGroupCopyAllowed(groupId);
        };

        // 检查图层组是否允许删除
        const isGroupDeleteAllowed = (groupId) => {
            return printMethodStore.isGroupDeleteAllowed(groupId);
        };

        // 复制图层
        const duplicateLayer = (layer, targetGroupId = null) => {
            // 检查是否允许复制
            if (!isLayerCopyAllowed(layer.id)) {
                return;
            }
            const currentViewId = store.activeViewId;
            if (!currentViewId)
                return;


            // 在画布中复制对象，图层会通过 object:added 事件自动同步到 store
            duplicateCanvasObject(layer.id, {
                name: layer.name + '_副本',
                type: layer.type,
                visible: layer.visible,
                locked: layer.locked,
                groupId: targetGroupId || layer.groupId,
                groupOrder: targetGroupId ? getGroupLayers(targetGroupId).length : layer.groupOrder
            });
        };

        // 清除缩略图缓存的方法
        const clearThumbnailCache = (layerId = null) => {
            if (layerId) {
                thumbnailCache.value.delete(layerId);
            } else {
                thumbnailCache.value.clear();
            }
        };

        // 删除图层
        const deleteLayer = (layer) => {
            if (confirm(`确定要删除图层 "${layer.name}" 吗？`)) {
                const currentViewId = store.activeViewId;
                if (!currentViewId)
                    return;

                // 先从画布中删除对象
                deleteCanvasObject(layer.id);

                // 然后从当前视图的store中删除
                store.removeLayerFromView(currentViewId, layer.id);

                // 清除对应的缩略图缓存
                clearThumbnailCache(layer.id);

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
        const duplicateCanvasObject = (layerId, layerInfo = {}) => {
            const canvasInstance = getCanvasInstance();

            if (canvasInstance) {
                const obj = canvasInstance.getObjects().find(o => o.id === layerId);
                if (obj) {
                    obj.clone((cloned) => {
                        const newId = `layer_${Date.now()}`;
                        const newLayerName = layerInfo.name || (obj.layerName || obj.text || 'Layer') + '_副本';
                        const newLayerType = layerInfo.type || obj.layerType || obj.type;
                        
                        cloned.set({
                            left: cloned.left + 10,
                            top: cloned.top + 10,
                            id: newId,
                            // 设置图层信息，供 syncCanvasObjectToStore 使用
                            layerName: newLayerName,
                            layerType: newLayerType,
                            visible: layerInfo.visible !== undefined ? layerInfo.visible : (obj.visible !== false),
                            selectable: layerInfo.locked !== undefined ? !layerInfo.locked : obj.selectable,
                            groupId: layerInfo.groupId || null,
                            groupOrder: layerInfo.groupOrder || 0
                        });
                        
                        // 添加到画布
                        canvasInstance.add(cloned);
                        canvasInstance.setActiveObject(cloned);
                        canvasInstance.renderAll();
                        
                        // 手动同步到图层列表（确保图层显示在列表中）
                        const currentViewId = store.activeViewId;
                        if (currentViewId) {
                            const newLayer = {
                                id: newId,
                                name: newLayerName,
                                type: newLayerType,
                                visible: layerInfo.visible !== undefined ? layerInfo.visible : true,
                                locked: layerInfo.locked !== undefined ? layerInfo.locked : false,
                                groupId: layerInfo.groupId || null,
                                groupOrder: layerInfo.groupOrder || 0
                            };
                            
                            // 检查图层是否已存在，避免重复添加
                            const currentViewLayers = store.getViewLayers(currentViewId);
                            const existingLayer = currentViewLayers.find(layer => layer.id === newId);
                            if (!existingLayer) {
                                store.addLayerToView(currentViewId, newLayer);
                                console.log('图层已手动同步到列表:', newLayer);
                            }
                            
                            // 设置为当前选中的图层
                            store.setActiveObjectId(newId);
                            
                            // 触发缩略图刷新事件
                            setTimeout(() => {
                                const refreshEvent = new CustomEvent('layerThumbnailRefresh', {
                                    detail: { layerId: newId }
                                });
                                document.dispatchEvent(refreshEvent);
                            }, 100);
                        }
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
            return layers.value.filter(layer => layer.groupId === groupId).sort((a, b) => a.groupOrder - b.groupOrder);
        };

        const createGroup = () => {
            if (!newGroupName.value.trim())
                return;


            const currentViewId = store.activeViewId;
            if (!currentViewId)
                return;


            const newGroup = {
                id: 'group_' + Date.now(),
                name: newGroupName.value.trim(),
                visible: true,
                locked: false,
                expanded: true
            };

            const currentViewGroups = store.getViewLayerGroups(currentViewId);
            const updatedGroups = [
                ...currentViewGroups,
                newGroup
            ];
            store.setViewLayerGroups(currentViewId, updatedGroups);

            newGroupName.value = '';
            showGroupDialog.value = false;
        };

        const showGroupAssignDialog = (layer) => {
            selectedLayerForAssign.value = layer;
            // 获取图层当前的打印方式
            const currentMethod = printMethodStore.getLayerPrintMethod(layer.id);
            selectedPrintMethodId.value = currentMethod ? currentMethod.id : printMethodStore.selectedPrintMethodId;
            activeTab.value = 'color';
            showPrintMethodDialog.value = true;
        };

        const assignLayerToPrintMethod = () => {
            if (!selectedLayerForAssign.value || !selectedPrintMethodId.value) {
                alert('请选择一个打印方法');
                return;
            }

            const selectedMethod = printMethodStore.getPrintMethodById(selectedPrintMethodId.value);
            if (!selectedMethod) {
                alert('选择的打印方法无效');
                return;
            }

            // 验证图层是否符合打印方式要求
            const validation = printMethodStore.validateLayerForPrintMethod(selectedLayerForAssign.value, selectedPrintMethodId.value);
            if (!validation.valid) {
                alert(`图层不符合打印方式要求：\n${validation.errors.join('\n')}`);
                return;
            }

            // 为图层分配打印方式
            printMethodStore.assignLayerPrintMethod(selectedLayerForAssign.value.id, selectedPrintMethodId.value);

            // 创建或获取对应的打印方法分组
            const groupId = `print-method-${selectedPrintMethodId.value}`;
            let existingGroup = layerGroups.value.find(g => g.id === groupId);

            if (!existingGroup) {
                const newGroup = {
                    id: groupId,
                    name: selectedMethod.name,
                    color: getPrintMethodColor(selectedPrintMethodId.value),
                    visible: true,
                    locked: false,
                    expanded: true,
                    printMethodId: selectedPrintMethodId.value
                };
                const updatedGroups = [...layerGroups.value, newGroup];
                
                // 更新当前视图的图层组
                const currentViewId = store.activeViewId;
                if (currentViewId) {
                    store.setViewLayerGroups(currentViewId, updatedGroups);
                } else {
                    store.setLayerGroups(updatedGroups);
                }
                
                existingGroup = newGroup;
            }

            // 将图层分配到选定的打印方法分组
            const currentViewId = store.activeViewId;
            if (!currentViewId) return;

            const currentViewLayers = store.getViewLayers(currentViewId);
            const layerIndex = currentViewLayers.findIndex(l => l.id === selectedLayerForAssign.value.id);
            if (layerIndex !== -1) {
                const updatedLayers = [...currentViewLayers];
                updatedLayers[layerIndex] = {
                    ...updatedLayers[layerIndex],
                    groupId: groupId,
                    printMethodId: selectedPrintMethodId.value,
                    groupOrder: getGroupLayers(groupId).length
                };
                store.setViewLayers(currentViewId, updatedLayers);
            }

            showPrintMethodDialog.value = false;
        };

        // 获取打印方式对应的颜色
        const getPrintMethodColor = (methodId) => {
            const colors = {
                'method-a': '#FF6B6B',
                'method-b': '#4ECDC4',
                'method-c': '#45B7D1',
                'method-d': '#96CEB4',
                'method-e': '#FFEAA7',
                'method-f': '#DDA0DD'
            };
            return colors[methodId] || '#999999';
        };

        const removeFromGroup = (layer) => {
            const currentViewId = store.activeViewId;
            if (!currentViewId)
                return;


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
                updatedGroups[groupIndex] = {
                    ...updatedGroups[groupIndex],
                    visible: newVisible
                };
                store.setLayerGroups(updatedGroups);
            }

            // 同步组内所有图层
            const groupLayers = getGroupLayers(group.id);
            groupLayers.forEach(layer => {
                const layerIndex = layers.value.findIndex(l => l.id === layer.id);
                if (layerIndex !== -1) {
                    const updatedLayers = [...layers.value];
                    updatedLayers[layerIndex] = {
                        ...updatedLayers[layerIndex],
                        visible: newVisible
                    };
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
                updatedGroups[groupIndex] = {
                    ...updatedGroups[groupIndex],
                    locked: newLocked
                };
                store.setLayerGroups(updatedGroups);
            }

            // 同步组内所有图层
            const groupLayers = getGroupLayers(group.id);
            groupLayers.forEach(layer => {
                const layerIndex = layers.value.findIndex(l => l.id === layer.id);
                if (layerIndex !== -1) {
                    const updatedLayers = [...layers.value];
                    updatedLayers[layerIndex] = {
                        ...updatedLayers[layerIndex],
                        locked: newLocked
                    };
                    store.setLayers(updatedLayers);
                    syncLayerLockToCanvas(layer.id, newLocked);
                }
            });
        };

        const duplicateGroup = (group) => {
            // 检查是否允许复制
            if (!isGroupCopyAllowed(group.id)) {
                return;
            }

            // 复制组
            const newGroup = {
                id: 'group_' + Date.now(),
                name: group.name + '_副本',
                visible: group.visible,
                locked: group.locked,
                expanded: true
            };

            // 获取当前视图ID
            const currentViewId = store.activeViewId;
            if (currentViewId) {
                // 更新当前视图的图层组
                const currentViewGroups = store.getViewLayerGroups(currentViewId) || [];
                const updatedViewGroups = [...currentViewGroups, newGroup];
                store.setViewLayerGroups(currentViewId, updatedViewGroups);
            } else {
                // 如果没有当前视图，则更新全局图层组
                const updatedGroups = [
                    ...layerGroups.value,
                    newGroup
                ];
                store.setLayerGroups(updatedGroups);
            }

            // 复制组内图层
            const groupLayers = getGroupLayers(group.id);
            groupLayers.forEach(layer => {
                duplicateLayer(layer, newGroup.id);
            });
        };

        const deleteGroup = (group) => {
            // 检查是否允许删除
            if (!isGroupDeleteAllowed(group.id)) {
                return;
            }

            if (confirm(`确定要删除图层组 "${group.name}" 吗？组内的所有图层也将被删除。`)) {
                const currentViewId = store.activeViewId;
                if (!currentViewId) return;

                // 获取组内所有图层并删除
                const groupLayers = getGroupLayers(group.id);
                groupLayers.forEach(layer => {
                    // 从画布中删除对象
                    deleteCanvasObject(layer.id);
                });

                // 从当前视图的图层列表中删除组内所有图层
                const currentViewLayers = store.getViewLayers(currentViewId);
                const updatedLayers = currentViewLayers.filter(layer => layer.groupId !== group.id);
                store.setViewLayers(currentViewId, updatedLayers);

                // 从当前视图删除图层组
                const currentViewGroups = store.getViewLayerGroups(currentViewId);
                const updatedGroups = currentViewGroups.filter(g => g.id !== group.id);
                store.setViewLayerGroups(currentViewId, updatedGroups);

                // 清除选中状态
                if (activeGroupId.value === group.id) {
                    store.setActiveGroupId(null);
                }
            }
        };
        
        // 显示图层组印刷方式修改弹窗
        const showGroupPrintMethodDialog = (group) => {
            selectedGroupForPrintMethod.value = group;
            
            // 获取图层组当前的印刷方式
            const groupLayers = getGroupLayers(group.id);
            if (groupLayers.length > 0) {
                const firstLayerPrintMethod = printMethodStore.getLayerPrintMethod(groupLayers[0].id);
                selectedGroupPrintMethodId.value = firstLayerPrintMethod ? firstLayerPrintMethod.id : null;
            } else {
                selectedGroupPrintMethodId.value = null;
            }
            
            // 使用 MicroModal 显示弹窗
            if (typeof MicroModal !== 'undefined') {
                MicroModal.show('pwca-group-print-method-modal');
            } else {
                console.error('MicroModal 库未加载');
                // 备用方案：使用原有的弹窗方式
                alert('请选择新的印刷方式。');
            }
        };
        
        // 确认修改图层组印刷方式
        const confirmGroupPrintMethodChange = () => {
            if (!selectedGroupForPrintMethod.value || !selectedGroupPrintMethodId.value) {
                alert('请选择一个印刷方式');
                return;
            }
            
            const selectedMethod = printMethodStore.getPrintMethodById(selectedGroupPrintMethodId.value);
            if (!selectedMethod) {
                alert('选择的印刷方式无效');
                return;
            }
            
            const groupLayers = getGroupLayers(selectedGroupForPrintMethod.value.id);
            
            // 验证所有图层是否符合新的印刷方式要求
            const invalidLayers = [];
            for (const layer of groupLayers) {
                const validation = printMethodStore.validateLayerForPrintMethod(layer, selectedGroupPrintMethodId.value);
                if (!validation.valid) {
                    invalidLayers.push({
                        layer: layer,
                        errors: validation.errors
                    });
                }
            }
            
            if (invalidLayers.length > 0) {
                let errorMessage = '以下图层不符合新印刷方式要求：\n';
                invalidLayers.forEach(item => {
                    errorMessage += `\n- ${item.layer.name || item.layer.type}: ${item.errors.join(', ')}`;
                });
                alert(errorMessage);
                return;
            }
            
            // 更新所有图层的印刷方式
            const currentViewId = store.activeViewId;
            if (!currentViewId) return;
            
            // 创建或获取新的印刷方法分组
            const newGroupId = `print-method-${selectedGroupPrintMethodId.value}`;
            let newGroup = layerGroups.value.find(g => g.id === newGroupId);
            
            if (!newGroup) {
                newGroup = {
                    id: newGroupId,
                    name: selectedMethod.name,
                    color: getPrintMethodColor(selectedGroupPrintMethodId.value),
                    visible: true,
                    locked: false,
                    expanded: true,
                    printMethodId: selectedGroupPrintMethodId.value
                };
                
                const currentViewGroups = store.getViewLayerGroups(currentViewId);
                const updatedGroups = [...currentViewGroups, newGroup];
                store.setViewLayerGroups(currentViewId, updatedGroups);
            }
            
            // 更新所有图层的分组和印刷方式
            const currentViewLayers = store.getViewLayers(currentViewId);
            let updatedLayers = [...currentViewLayers];
            
            groupLayers.forEach((layer, index) => {
                const layerIndex = updatedLayers.findIndex(l => l.id === layer.id);
                if (layerIndex !== -1) {
                    // 为图层分配印刷方式
                    printMethodStore.assignLayerPrintMethod(layer.id, selectedGroupPrintMethodId.value);
                    
                    // 更新图层信息
                    updatedLayers[layerIndex] = {
                        ...updatedLayers[layerIndex],
                        groupId: newGroupId,
                        printMethodId: selectedGroupPrintMethodId.value,
                        groupOrder: index
                    };
                }
            });
            
            store.setViewLayers(currentViewId, updatedLayers);
            
            // 删除原图层组（如果为空）
            const oldGroupLayers = getGroupLayers(selectedGroupForPrintMethod.value.id);
            if (oldGroupLayers.length === 0) {
                const currentViewGroups = store.getViewLayerGroups(currentViewId);
                const filteredGroups = currentViewGroups.filter(g => g.id !== selectedGroupForPrintMethod.value.id);
                store.setViewLayerGroups(currentViewId, filteredGroups);
            }
            
            // 关闭弹窗
            if (typeof MicroModal !== 'undefined') {
                MicroModal.close('pwca-group-print-method-modal');
            }
            
            // 触发自定义事件通知其他组件
            const event = new CustomEvent('pwcaGroupPrintMethodChanged', {
                detail: {
                    groupId: selectedGroupForPrintMethod.value.id,
                    newPrintMethodId: selectedGroupPrintMethodId.value,
                    affectedLayers: groupLayers
                }
            });
            document.dispatchEvent(event);
            
            // 显示成功消息
            console.log(`图层组 "${selectedGroupForPrintMethod.value.name}" 的印刷方式已更改为 "${selectedMethod.name}"`);
            
            // 清理状态
            selectedGroupForPrintMethod.value = null;
            selectedGroupPrintMethodId.value = null;
        };

        return {
            // Store 引用
            store,

            // 从 store 获取的数据
            canvasIds: Vue.computed(() => Object.keys(store.canvasStates)),
            activeCanvasId: Vue.computed(() => store.activeCanvasId),
            layers: Vue.computed(() => store.layers),
            activeObjectId: Vue.computed(() => store.activeObjectId),
            layerGroups: Vue.computed(() => store.layerGroups),
            activeGroupId: Vue.computed(() => store.activeGroupId),
            
            // 多视图相关数据
            views,
            activeViewId,
            currentViewLayers,
            currentViewLayerGroups,
            currentViewUngroupedLayers,

            // 计算属性
            ungroupedLayers,

            // 图层组相关数据
            showGroupDialog,
            showPrintMethodDialog,
            newGroupName,
            selectedLayerForAssign,
            selectedPrintMethodId,
            activeTab,
            
            // 图层组印刷方式修改相关数据
            selectedGroupForPrintMethod,
            selectedGroupPrintMethodId,

            // 打印方式相关数据
            printMethods,
            selectedPrintMethod,

            // 方法
            switchCanvas: (id) => store.setActiveCanvasId(id),
            switchToView,
            getCurrentViewName,
            addLayer,
            selectLayer,
            toggleVisibility,
            toggleLock,
            duplicateLayer,
            deleteLayer,
            getLayerThumbnail,
            getImageLayerInfo,
            clearThumbnailCache,
            generateThumbnail,
            generateImageThumbnail,

            // 打印方式权限检查方法
            isLayerCopyAllowed,
            isLayerDeleteAllowed,
            isGroupCopyAllowed,
            isGroupDeleteAllowed,
            getPrintMethodColor,

            // 图层组方法
            getGroupLayers,
            createGroup,
            showGroupAssignDialog,
            assignLayerToPrintMethod,
            removeFromGroup,
            toggleGroup,
            toggleGroupExpand,
            toggleGroupVisibility,
            toggleGroupLock,
            duplicateGroup,
            deleteGroup,
            
            // 图层组印刷方式修改方法
            showGroupPrintMethodDialog,
            confirmGroupPrintMethodChange
        };
    }
});

// 挂载 Pinia 状态管理到 Vue 应用
layersApp.use(pinia);

// 防止重复挂载的标志
let isAppMounted = false;

// 挂载应用的函数
const mountApp = () => {
    if (isAppMounted) {
        return;
    }

    const container = document.getElementById('layers-box');
    if (container) {
        try {
            layersApp.mount('#layers-box');
            isAppMounted = true;
            
            // 初始化 MicroModal
            if (typeof MicroModal !== 'undefined') {
                MicroModal.init();
                console.log('MicroModal 已初始化');
            } else {
                console.warn('MicroModal 库未加载');
            }
        } catch (error) {
            // 挂载失败
        }
    }
};

// 监听Pinia准备就绪事件
document.addEventListener('canvasPiniaReady', (event) => {
    mountApp();
});

// 备用方案：如果事件没有触发，使用DOM加载完成事件
document.addEventListener('DOMContentLoaded', () => {
    // 延迟检查，如果应用还没有挂载，则尝试挂载
    setTimeout(() => {
        if (!isAppMounted) {
            mountApp();
        }
    }, 1000);
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
                groupId: null, // 新增：默认未分组
                groupOrder: 0 // 新增：组内排序
            };

            // 添加图层到当前视图
            store.addLayerToView(currentViewId, newLayer);
            store.setActiveObjectId(layerId);

        } catch (error) {
            console.error('添加图层到管理系统失败:', error);
        }
    }
};
