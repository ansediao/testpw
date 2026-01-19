// 图层组相关逻辑
// 负责：获取组内图层、创建组、从组中移除、折叠/展开、显示/隐藏、锁定/解锁

export function createGroupHelpers(options) {
    const {
        store,
        layerGroups,
        layers,
        currentViewLayers,
        activeGroupId,
        syncLayerVisibilityToCanvas,
        syncLayerLockToCanvas,
        controlMaskCanvasVisibility
    } = options;

    const showGroupDialog = Vue.ref(false);
    const newGroupName = Vue.ref('');

    const getGroupLayers = (groupId) => {
        return currentViewLayers.value
            .filter((layer) => layer.groupId === groupId)
            .sort((a, b) => a.groupOrder - b.groupOrder);
    };

    const createGroup = () => {
        if (!newGroupName.value.trim()) {
            return;
        }

        const currentViewId = store.activeViewId;
        if (!currentViewId) {
            return;
        }

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

    const removeFromGroup = (layer) => {
        const currentViewId = store.activeViewId;
        if (!currentViewId) {
            return;
        }

        const currentLayers = store.getViewLayers(currentViewId);
        const layerIndex = currentLayers.findIndex((l) => l.id === layer.id);
        if (layerIndex !== -1) {
            const updatedLayers = [...currentLayers];
            updatedLayers[layerIndex] = {
                ...updatedLayers[layerIndex],
                groupId: null,
                groupOrder: 0
            };
            store.setViewLayers(currentViewId, updatedLayers);

            if (store.activeObjectId === layer.id) {
                controlMaskCanvasVisibility(layer.id);
            }
        }
    };

    const toggleGroup = (groupId) => {
        store.setActiveGroupId(
            activeGroupId.value === groupId ? null : groupId
        );
    };

    const toggleGroupExpand = (groupId) => {
        const groupIndex = layerGroups.value.findIndex((g) => g.id === groupId);
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

        const groupIndex = layerGroups.value.findIndex((g) => g.id === group.id);
        if (groupIndex !== -1) {
            const updatedGroups = [...layerGroups.value];
            updatedGroups[groupIndex] = {
                ...updatedGroups[groupIndex],
                visible: newVisible
            };
            store.setLayerGroups(updatedGroups);
        }

        const groupLayers = getGroupLayers(group.id);
        groupLayers.forEach((layer) => {
            const layerIndex = layers.value.findIndex((l) => l.id === layer.id);
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

        const groupIndex = layerGroups.value.findIndex((g) => g.id === group.id);
        if (groupIndex !== -1) {
            const updatedGroups = [...layerGroups.value];
            updatedGroups[groupIndex] = {
                ...updatedGroups[groupIndex],
                locked: newLocked
            };
            store.setLayerGroups(updatedGroups);
        }

        const groupLayers = getGroupLayers(group.id);
        groupLayers.forEach((layer) => {
            const layerIndex = layers.value.findIndex((l) => l.id === layer.id);
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

    return {
        showGroupDialog,
        newGroupName,
        getGroupLayers,
        createGroup,
        removeFromGroup,
        toggleGroup,
        toggleGroupExpand,
        toggleGroupVisibility,
        toggleGroupLock
    };
}