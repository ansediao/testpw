// src/components/layers.js
// 图层面板主入口：负责创建并挂载 Vue 应用，本文件只做"组装"，具体逻辑拆分到子模块。

import { useCanvasStore, usePrintMethodStore, pinia } from '../stores/index.js';
import { layerModalsTemplate } from './layer-modals.js';
import { useLayerState } from './layers/state.js';
import { createCanvasHelpers } from './layers/canvas-helpers.js';
import { createThumbnailHelpers } from './layers/thumbnail.js';
import { createGroupHelpers } from './layers/groups.js';
import { createLayerOperations } from './layers/operations.js';
import { createPrintMethodHelpers } from './layers/print-methods.js';

const layersApp = Vue.createApp({
    template: `
        <div class="pwca-layers-panel">
            <div class="pwca-layers-list">
                <!-- 未分组图层区域（包括组内只有一个图层的情况）-->
                <div v-if="currentViewUngroupedLayers.length > 0">
                    <div
                        v-for="layer in currentViewUngroupedLayers"
                        :key="layer.id"
                        class="pwca-layer-item ungrouped"
                        :class="{ active: layer.id === activeObjectId }"
                        @click="selectLayer(layer.id)"
                    >
                        <div class="pwca-layer-icon">
                            <div v-if="layer.type === 'image'" class="pwca-layer-thumbnail">
                                <img
                                    :src="getLayerThumbnail(layer)"
                                    alt="缩略图"
                                    class="thumbnail-img"
                                />
                            </div>
                            <div v-else-if="layer.type === 'text'" class="pwca-layer-text-icon">
                                T
                            </div>
                            <div v-else class="pwca-layer-default-icon">
                                📄
                            </div>
                        </div>
                        <div class="pwca-layer-info">
                            <div class="pwca-layer-name">
                                <div class="pwca-layer-type">{{ layer.type || 'unknown' }}</div>
                                <div class="pwca-layer-controls">
                                    <button
                                        @click.stop="toggleLock(layer)"
                                        class="pwca-layer-btn"
                                    >
                                        <i
                                            :class="layer.locked ? 'iconfont icon-suoding' : 'iconfont icon-jiesuo'"
                                        ></i>
                                    </button>
                                    <button
                                        @click.stop="deleteLayer(layer)"
                                        class="pwca-layer-btn delete"
                                    >
                                        <i class="iconfont icon-shanchu"></i>
                                    </button>
                                    <button
                                        @click.stop="duplicateLayer(layer)"
                                        class="pwca-layer-btn layer-copy"
                                        :class="{ disabled: !isLayerCopyAllowed(layer) }"
                                        :disabled="!isLayerCopyAllowed(layer)"
                                        :title="
                                            isLayerCopyAllowed(layer)
                                                ? 'Copy layer'
                                                : 'Copy not allowed for this print method'
                                        "
                                    >
                                        <i class="iconfont icon-fuzhi"></i>
                                    </button>
                                </div>
                            </div>
                            <div v-if="layer.type === 'image'" class="pwca-layer-img-info">
                                    <div
                                        v-if="getImageLayerInfo(layer)"
                                        class="pwca-image-details"
                                    >
                                        <div class="pwca-image-meta">
                                        {{ getImageLayerInfo(layer).name }}
                                        <br />
                                        {{ getImageLayerInfo(layer).dpi }}
                                    </div>
                                </div>
                            </div>
                            <div class="pwca-layer-actions">
                                <button
                                    @click.stop="showGroupAssignDialog(layer)"
                                    class="pwca-assign-btn"
                                    :class="{
                                        disabled: isLayerPrintMethodSwitchDisabled(layer)
                                    }"
                                    :disabled="isLayerPrintMethodSwitchDisabled(layer)"
                                    :title="getLayerSwitchMethodTooltip(layer)"
                                >
                                    <i class="iconfont icon-dayin"></i>
                                    Switch Printing Method
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 图层组列表 -->
                <div
                    v-for="group in currentViewLayerGroups"
                    :key="group.id"
                    class="pwca-layer-group"
                >
                    <div
                        class="pwca-group-header"
                        :class="{ active: activeGroupId === group.id }"
                        @click="toggleGroup(group.id)"
                    >
                        <div class="pwca-group-name">{{ group.name }}</div>

                        <div class="pwca-group-actions">
                            <div class="pwca-selectOnlyLayer">
                                <input type="checkbox" v-model="group.selectOnly" />
                                <label>Select Only Layer</label>
                            </div>
                            <div class="pwca-group-actions-buttonBox">
                                <button
                                    @click.stop="showGroupPrintMethodDialog(group)"
                                    class="pwca-layer-btn pwca-group-print-modal__trigger"
                                    :class="{ disabled: isGroupPrintMethodSwitchDisabled }"
                                    :disabled="isGroupPrintMethodSwitchDisabled"
                                    :title="getGroupPrintMethodTooltip"
                                >
                                    <i class="iconfont icon-dayin"></i>
                                </button>
                                <button
                                    @click.stop="toggleGroupLock(group)"
                                    :class="{ locked: group.locked }"
                                    class="pwca-layer-btn"
                                >
                                    <i
                                        :class="group.locked ? 'iconfont icon-suoding' : 'iconfont icon-jiesuo'"
                                    ></i>
                                </button>
                                <button
                                    @click.stop="deleteGroup(group)"
                                    class="pwca-layer-btn delete"
                                    :class="{ disabled: !isGroupDeleteAllowed(group) }"
                                    :disabled="!isGroupDeleteAllowed(group)"
                                    :title="
                                        isGroupDeleteAllowed(group)
                                            ? 'Delete group'
                                            : 'Delete not allowed for this print method'
                                    "
                                >
                                    <i class="iconfont icon-shanchu"></i>
                                </button>
                                <button
                                    @click.stop="duplicateGroup(group)"
                                    class="pwca-layer-btn group-copy"
                                    :class="{ disabled: !isGroupCopyAllowed(group) }"
                                    :disabled="!isGroupCopyAllowed(group)"
                                    :title="
                                        isGroupCopyAllowed(group)
                                            ? 'Copy group'
                                            : 'Copy not allowed for this print method'
                                    "
                                >
                                    <i class="iconfont icon-fuzhi"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div v-if="group.expanded" class="pwca-group-content">
                        <div
                            v-for="layer in getGroupLayers(group.id)"
                            :key="layer.id"
                            class="pwca-layer-item grouped"
                            :class="{ active: activeObjectId === layer.id }"
                            @click="selectLayer(layer.id)"
                        >
                            <div class="pwca-layer-xiaji-icon">
                                <i class="iconfont icon-xiaji"></i>
                            </div>
                            <div class="pwca-layer-icon">
                                <div v-if="layer.type === 'image'" class="pwca-layer-thumbnail">
                                    <img
                                        :src="getLayerThumbnail(layer)"
                                        alt="缩略图"
                                        class="thumbnail-img"
                                    />
                                </div>
                                <div v-else-if="layer.type === 'text'" class="pwca-layer-text-icon">
                                    T
                                </div>
                            </div>
                            <div class="pwca-layer-info">
                                <div class="pwca-layer-name">
                                    <div class="pwca-layer-type">{{ layer.type || 'unknown' }}</div>
                                    <div class="pwca-layer-controls">
                                        <button
                                            @click.stop="toggleLock(layer)"
                                            class="pwca-layer-btn"
                                        >
                                            <i
                                                :class="layer.locked ? 'iconfont icon-suoding' : 'iconfont icon-jiesuo'"
                                            ></i>
                                        </button>
                                        <button
                                            @click.stop="deleteLayer(layer)"
                                            class="pwca-layer-btn delete"
                                        >
                                            <i class="iconfont icon-shanchu"></i>
                                        </button>
                                        <button
                                            @click.stop="duplicateLayer(layer)"
                                            class="pwca-layer-btn layer-copy"
                                            :class="{
                                                disabled: !isLayerCopyAllowed(layer)
                                            }"
                                            :disabled="!isLayerCopyAllowed(layer)"
                                            :title="
                                                isLayerCopyAllowed(layer)
                                                    ? 'Copy layer'
                                                    : 'Copy not allowed for this print method'
                                            "
                                        >
                                            <i class="iconfont icon-fuzhi"></i>
                                        </button>
                                    </div>
                                </div>
                                <div v-if="layer.type === 'image'" class="pwca-layer-img-info">
                                    <div
                                        v-if="getImageLayerInfo(layer)"
                                        class="pwca-image-details"
                                    >
                                        <div class="pwca-image-meta">
                                            {{ getImageLayerInfo(layer).name }}
                                            <br />
                                            {{ getImageLayerInfo(layer).dpi }}
                                        </div>
                                    </div>
                                </div>
                                <div class="pwca-layer-actions">
                                    <button
                                        @click.stop="showGroupAssignDialog(layer)"
                                        class="pwca-assign-btn"
                                        :class="{
                                            disabled: isLayerPrintMethodSwitchDisabled(layer)
                                        }"
                                        :disabled="isLayerPrintMethodSwitchDisabled(layer)"
                                        :title="getLayerSwitchMethodTooltip(layer)"
                                    >
                                        <i class="iconfont icon-dayin"></i>
                                        Switch Printing Method
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="layers.length === 0" class="pwca-no-layers">
                    No Layers
                </div>
            </div>

            <!-- 创建图层组对话框 -->
            <div
                v-if="showGroupDialog"
                class="pwca-group-dialog-overlay"
                @click="showGroupDialog = false"
            >
                <div class="pwca-group-dialog" @click.stop>
                    <h3>Create Layer Group</h3>
                    <input
                        v-model="newGroupName"
                        placeholder="Enter layer group name"
                        @keyup.enter="createGroup"
                    />
                    <div class="pwca-dialog-actions">
                        <button @click="createGroup">Create</button>
                        <button @click="showGroupDialog = false">Cancel</button>
                    </div>
                </div>
            </div>

            <!-- 弹窗模板通过 Teleport 全局挂载，避免受图层面板限制 -->
            <teleport to="#pwca-modal-root">
                ${layerModalsTemplate}
            </teleport>
        </div>
    `,

    setup() {
        let store;
        let printMethodStore;

        try {
            store = useCanvasStore();
            printMethodStore = usePrintMethodStore();
        } catch (error) {
            return {
                layers: Vue.ref([]),
                activeObjectId: Vue.ref(null),
                layerGroups: Vue.ref([]),
                printMethods: Vue.ref([]),
                currentViewUngroupedLayers: Vue.ref([]),
                currentViewLayerGroups: Vue.ref([]),
                showGroupDialog: Vue.ref(false),
                newGroupName: Vue.ref(''),
                selectLayer: () => {},
                duplicateLayer: () => {},
                deleteLayer: () => {},
                toggleLock: () => {},
                showGroupAssignDialog: () => {},
                assignLayerToPrintMethod: () => {},
                showGroupPrintMethodDialog: () => {},
                confirmGroupPrintMethodChange: () => {},
                getLayerThumbnail: () => '',
                getImageLayerInfo: () => null,
                isLayerCopyAllowed: () => true,
                isLayerDeleteAllowed: () => true,
                isGroupCopyAllowed: () => true,
                isGroupDeleteAllowed: () => true,
                isLayerPrintMethodSwitchDisabled: () => true,
                getLayerSwitchMethodTooltip: () => '',
                isGroupPrintMethodSwitchDisabled: true,
                getGroupPrintMethodTooltip: () => ''
            };
        }

        const state = useLayerState(store);
        const canvasHelpers = createCanvasHelpers(store);
        const thumbnailHelpers = createThumbnailHelpers(
            canvasHelpers.getCanvasInstance
        );
        const groupHelpers = createGroupHelpers({
            store,
            layerGroups: state.layerGroups,
            layers: state.layers,
            currentViewLayers: state.currentViewLayers,
            activeGroupId: state.activeGroupId,
            syncLayerVisibilityToCanvas: canvasHelpers.syncLayerVisibilityToCanvas,
            syncLayerLockToCanvas: canvasHelpers.syncLayerLockToCanvas,
            controlMaskCanvasVisibility:
                canvasHelpers.controlMaskCanvasVisibility
        });
        const operations = createLayerOperations({
            store,
            printMethodStore,
            currentViewLayers: state.currentViewLayers,
            layerGroups: state.layerGroups,
            activeGroupId: state.activeGroupId,
            getGroupLayers: groupHelpers.getGroupLayers,
            syncLayerSelectionToCanvas:
                canvasHelpers.syncLayerSelectionToCanvas,
            syncLayerVisibilityToCanvas:
                canvasHelpers.syncLayerVisibilityToCanvas,
            syncLayerLockToCanvas: canvasHelpers.syncLayerLockToCanvas,
            duplicateCanvasObject: canvasHelpers.duplicateCanvasObject,
            deleteCanvasObject: canvasHelpers.deleteCanvasObject,
            controlMaskCanvasVisibility:
                canvasHelpers.controlMaskCanvasVisibility
        });
        const printHelpers = createPrintMethodHelpers({
            store,
            printMethodStore,
            currentViewLayers: state.currentViewLayers,
            layerGroups: state.layerGroups,
            activeView: state.activeView,
            getGroupLayers: groupHelpers.getGroupLayers,
            controlMaskCanvasVisibility:
                canvasHelpers.controlMaskCanvasVisibility
        });

        window.pwcaTriggerPrintMethodModal = function (layerId) {
            if (!layerId) return;
            const layer = state.currentViewLayers.value?.find(l => l.id === layerId);
            if (layer) {
                printHelpers.showGroupAssignDialog(layer);
            }
        };

        return {
            store,

            canvasIds: Vue.computed(() => Object.keys(store.canvasStates)),
            activeCanvasId: Vue.computed(() => store.activeCanvasId),

            layers: state.layers,
            activeObjectId: state.activeObjectId,
            layerGroups: state.layerGroups,
            activeGroupId: state.activeGroupId,

            views: state.views,
            activeViewId: state.activeViewId,
            activeView: state.activeView,
            currentViewLayers: state.currentViewLayers,
            currentViewLayerGroups: state.currentViewLayerGroups,
            currentViewUngroupedLayers: state.currentViewUngroupedLayers,
            ungroupedLayers: state.ungroupedLayers,

            showGroupDialog: groupHelpers.showGroupDialog,
            newGroupName: groupHelpers.newGroupName,

            printMethods: printHelpers.printMethods,
            selectedPrintMethod: printHelpers.selectedPrintMethod,
            canSwitchPrintMethod: printHelpers.canSwitchPrintMethod,
            isPrintMethodSwitchDisabled:
                printHelpers.isPrintMethodSwitchDisabled,
            isLayerPrintMethodSwitchDisabled:
                printHelpers.isLayerPrintMethodSwitchDisabled,
            getLayerSwitchMethodTooltip:
                printHelpers.getLayerSwitchMethodTooltip,
            isGroupPrintMethodSwitchDisabled:
                printHelpers.isGroupPrintMethodSwitchDisabled,
            getSwitchMethodTooltip: printHelpers.getSwitchMethodTooltip,
            getGroupPrintMethodTooltip:
                printHelpers.getGroupPrintMethodTooltip,
            selectedLayerForAssign: printHelpers.selectedLayerForAssign,
            selectedPrintMethodId: printHelpers.selectedPrintMethodId,
            activeTab: printHelpers.activeTab,
            isPrintMethodModalOpen: printHelpers.isPrintMethodModalOpen,
            selectedGroupForPrintMethod:
                printHelpers.selectedGroupForPrintMethod,
            selectedGroupPrintMethodId:
                printHelpers.selectedGroupPrintMethodId,
            isGroupPrintMethodModalOpen:
                printHelpers.isGroupPrintMethodModalOpen,
            isSelectedLayerInExistingGroup:
                printHelpers.isSelectedLayerInExistingGroup,

            getLayerThumbnail: thumbnailHelpers.getLayerThumbnail,
            getImageLayerInfo: thumbnailHelpers.getImageLayerInfo,
            clearThumbnailCache: thumbnailHelpers.clearThumbnailCache,
            generateThumbnail: thumbnailHelpers.generateThumbnail,
            generateImageThumbnail: thumbnailHelpers.generateImageThumbnail,

            isLayerCopyAllowed: operations.isLayerCopyAllowed,
            isLayerDeleteAllowed: operations.isLayerDeleteAllowed,
            isGroupCopyAllowed: operations.isGroupCopyAllowed,
            isGroupDeleteAllowed: operations.isGroupDeleteAllowed,

            switchCanvas: (id) => store.setActiveCanvasId(id),
            switchToView: state.switchToView,
            getCurrentViewName: state.getCurrentViewName,
            addLayer: operations.addLayer,
            selectLayer: operations.selectLayer,
            toggleVisibility: operations.toggleVisibility,
            toggleLock: operations.toggleLock,
            duplicateLayer: operations.duplicateLayer,
            deleteLayer: (layer) =>
                operations.deleteLayer(layer, thumbnailHelpers.clearThumbnailCache),
            getPrintMethodColor: printHelpers.getPrintMethodColor,

            getGroupLayers: groupHelpers.getGroupLayers,
            createGroup: groupHelpers.createGroup,
            removeFromGroup: groupHelpers.removeFromGroup,
            toggleGroup: groupHelpers.toggleGroup,
            toggleGroupExpand: groupHelpers.toggleGroupExpand,
            toggleGroupVisibility: groupHelpers.toggleGroupVisibility,
            toggleGroupLock: groupHelpers.toggleGroupLock,
            duplicateGroup: operations.duplicateGroup,
            deleteGroup: operations.deleteGroup,

            showGroupAssignDialog: printHelpers.showGroupAssignDialog,
            assignLayerToPrintMethod: printHelpers.assignLayerToPrintMethod,
            closePrintMethodModal: printHelpers.closePrintMethodModal,
            showGroupPrintMethodDialog:
                printHelpers.showGroupPrintMethodDialog,
            closeGroupPrintMethodModal:
                printHelpers.closeGroupPrintMethodModal,
            confirmGroupPrintMethodChange:
                printHelpers.confirmGroupPrintMethodChange
        };
    }
});

layersApp.use(pinia);

let isAppMounted = false;

const mountApp = () => {
    if (isAppMounted) {
        return;
    }

    const container = document.getElementById('layers-box');
    if (container) {
        try {
            (function pwEnsureModalRoot() {
                let modalRoot = document.getElementById('pwca-modal-root');
                if (!modalRoot) {
                    modalRoot = document.createElement('div');
                    modalRoot.id = 'pwca-modal-root';
                    document.body.appendChild(modalRoot);
                }
            })();

            layersApp.mount('#layers-box');
            isAppMounted = true;
        } catch (error) {
        }
    }
};

document.addEventListener('canvasPiniaReady', () => {
    mountApp();
});

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (!isAppMounted) {
            mountApp();
        }
    }, 1000);
});

window.pwcaAddLayerToStore = function (layerId, layerName, layerType) {
    if (typeof window.pwcaUseCanvasStore === 'function') {
        try {
            const store = window.pwcaUseCanvasStore();
            const currentViewId = store.activeViewId;

            if (!currentViewId) {
                return;
            }

            const currentViewLayers = store.getViewLayers(currentViewId);
            const existingLayer = currentViewLayers.find(
                (layer) => layer.id === layerId
            );
            if (existingLayer) {
                return;
            }

            const newLayer = {
                id: layerId,
                name:
                    layerName.length > 20
                        ? layerName.substring(0, 20) + '...'
                        : layerName,
                type: layerType,
                visible: true,
                locked: false,
                groupId: null,
                groupOrder: 0
            };

            store.addLayerToView(currentViewId, newLayer);
            store.setActiveObjectId(layerId);
        } catch (error) {
        }
    }
};
