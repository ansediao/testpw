// 图层与图层组的操作逻辑
// 负责：选择、显隐、锁定、复制、删除等操作，以及权限检查

export function createLayerOperations(options) {
    const {
        store,
        printMethodStore,
        currentViewLayers,
        layerGroups,
        activeGroupId,
        getGroupLayers,
        syncLayerSelectionToCanvas,
        syncLayerVisibilityToCanvas,
        syncLayerLockToCanvas,
        duplicateCanvasObject,
        deleteCanvasObject,
        controlMaskCanvasVisibility
    } = options;

    const isLayerCopyAllowed = (layerId) =>
        printMethodStore.isLayerCopyAllowed(layerId);

    const isLayerDeleteAllowed = (layerId) =>
        printMethodStore.isLayerDeleteAllowed(layerId);

    const isGroupCopyAllowed = (groupId) =>
        printMethodStore.isGroupCopyAllowed(groupId);

    const isGroupDeleteAllowed = (groupId) =>
        printMethodStore.isGroupDeleteAllowed(groupId);

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

    const selectLayer = (layerId) => {
        store.setActiveObjectId(layerId);
        window.pw_selectionFromLayerList = true;

        syncLayerSelectionToCanvas(layerId);
        controlMaskCanvasVisibility(layerId);
    };

    const toggleVisibility = (layer) => {
        const currentViewId = store.activeViewId;
        if (!currentViewId) {
            return;
        }

        const newVisible = !layer.visible;
        const viewLayers = store.getViewLayers(currentViewId);
        const updatedLayers = viewLayers.map((l) =>
            l.id === layer.id
                ? {
                      ...l,
                      visible: newVisible
                  }
                : l
        );
        store.setViewLayers(currentViewId, updatedLayers);

        syncLayerVisibilityToCanvas(layer.id, newVisible);
    };

    const toggleLock = (layer) => {
        const currentViewId = store.activeViewId;
        if (!currentViewId) {
            return;
        }

        const newLocked = !layer.locked;
        const viewLayers = store.getViewLayers(currentViewId);
        const updatedLayers = viewLayers.map((l) =>
            l.id === layer.id
                ? {
                      ...l,
                      locked: newLocked
                  }
                : l
        );
        store.setViewLayers(currentViewId, updatedLayers);

        syncLayerLockToCanvas(layer.id, newLocked);
    };

    const duplicateLayer = (layer, targetGroupId = null) => {
        if (!isLayerCopyAllowed(layer.id)) {
            return;
        }
        const currentViewId = store.activeViewId;
        if (!currentViewId) {
            return;
        }

        duplicateCanvasObject(layer.id, {
            name: layer.name + '_副本',
            type: layer.type,
            visible: layer.visible,
            locked: layer.locked,
            groupId: targetGroupId || layer.groupId,
            groupOrder: targetGroupId
                ? getGroupLayers(targetGroupId).length
                : layer.groupOrder
        });
    };

    const clearThumbnailCacheForLayer = (clearThumbnailCache, layerId) => {
        if (clearThumbnailCache) {
            clearThumbnailCache(layerId);
        }
    };

    const deleteLayer = (layer, clearThumbnailCache) => {
        if (!isLayerDeleteAllowed(layer.id)) {
            return;
        }

        if (!window.confirm(`确定要删除图层 "${layer.name}" 吗？`)) {
            return;
        }

        const currentViewId = store.activeViewId;
        if (!currentViewId) {
            return;
        }

        const parentGroupId = layer.groupId;

        deleteCanvasObject(layer.id);
        store.removeLayerFromView(currentViewId, layer.id);

        clearThumbnailCacheForLayer(clearThumbnailCache, layer.id);

        if (store.activeObjectId === layer.id) {
            store.setActiveObjectId(null);
            controlMaskCanvasVisibility(null);
        }

        if (parentGroupId) {
            const remaining = getGroupLayers(parentGroupId);
            if (!remaining || remaining.length === 0) {
                const currentViewGroups =
                    store.getViewLayerGroups(currentViewId) || [];
                const groupExists = currentViewGroups.some(
                    (g) => g.id === parentGroupId
                );
                if (groupExists) {
                    const updatedGroups = currentViewGroups.filter(
                        (g) => g.id !== parentGroupId
                    );
                    store.setViewLayerGroups(currentViewId, updatedGroups);
                }
                if (store.activeGroupId === parentGroupId) {
                    store.setActiveGroupId(null);
                }
            }
        }
    };

    const duplicateGroup = (group) => {
        if (!isGroupCopyAllowed(group.id)) {
            return;
        }

        const newGroup = {
            id: 'group_' + Date.now(),
            name: group.name + '_副本',
            visible: group.visible,
            locked: group.locked,
            expanded: true
        };

        const currentViewId = store.activeViewId;
        if (currentViewId) {
            const currentViewGroups =
                store.getViewLayerGroups(currentViewId) || [];
            const updatedViewGroups = [...currentViewGroups, newGroup];
            store.setViewLayerGroups(currentViewId, updatedViewGroups);
        } else {
            const updatedGroups = [...layerGroups.value, newGroup];
            store.setLayerGroups(updatedGroups);
        }

        const groupLayers = getGroupLayers(group.id);
        groupLayers.forEach((layer) => {
            duplicateLayer(layer, newGroup.id);
        });
    };

    const deleteGroup = (group) => {
        if (!isGroupDeleteAllowed(group.id)) {
            return;
        }

        if (
            !window.confirm(
                `确定要删除图层组 "${group.name}" 吗？组内的所有图层也将被删除。`
            )
        ) {
            return;
        }

        const currentViewId = store.activeViewId;
        if (!currentViewId) {
            return;
        }

        const groupLayers = getGroupLayers(group.id);
        groupLayers.forEach((layer) => {
            deleteCanvasObject(layer.id);
        });

        const viewLayers = store.getViewLayers(currentViewId);
        const updatedLayers = viewLayers.filter(
            (layer) => layer.groupId !== group.id
        );
        store.setViewLayers(currentViewId, updatedLayers);

        const currentViewGroups = store.getViewLayerGroups(currentViewId);
        const updatedGroups = currentViewGroups.filter(
            (g) => g.id !== group.id
        );
        store.setViewLayerGroups(currentViewId, updatedGroups);

        if (activeGroupId.value === group.id) {
            store.setActiveGroupId(null);
        }
    };

    return {
        addLayer,
        selectLayer,
        toggleVisibility,
        toggleLock,
        duplicateLayer,
        deleteLayer,
        duplicateGroup,
        deleteGroup,
        isLayerCopyAllowed,
        isLayerDeleteAllowed,
        isGroupCopyAllowed,
        isGroupDeleteAllowed
    };
}