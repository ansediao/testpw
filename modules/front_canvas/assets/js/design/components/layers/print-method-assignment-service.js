export function getPrintMethodColor(methodId) {
    const colors = {
        'method-a': '#FF6B6B',
        'method-b': '#4ECDC4',
        'method-c': '#45B7D1',
        'method-d': '#96CEB4',
        'method-e': '#FFEAA7',
        'method-f': '#DDA0DD'
    };

    return colors[methodId] || '#999999';
}

function ensureGroupExists({
    store,
    layerGroups,
    currentViewId,
    selectedMethod,
    methodId,
    separate
}) {
    const groupId = separate
        ? `print-method-${methodId}-${Date.now()}`
        : `print-method-${methodId}`;

    let group = layerGroups.value.find((item) => item.id === groupId);
    if (group) {
        return group;
    }

    group = {
        id: groupId,
        name: separate ? `${selectedMethod.name} (${Date.now()})` : selectedMethod.name,
        color: getPrintMethodColor(methodId),
        visible: true,
        locked: false,
        expanded: true,
        printMethodId: methodId
    };

    const currentViewGroups = store.getViewLayerGroups(currentViewId) || [];
    store.setViewLayerGroups(currentViewId, [...currentViewGroups, group]);

    return group;
}

function cleanupEmptyGroup(store, currentViewId, groupId) {
    if (!groupId) {
        return;
    }

    const remainingLayers = (store.getViewLayers(currentViewId) || []).filter(
        (layer) => String(layer.groupId) === String(groupId)
    );

    if (remainingLayers.length > 0) {
        return;
    }

    const currentViewGroups = store.getViewLayerGroups(currentViewId) || [];
    const nextGroups = currentViewGroups.filter((group) => group.id !== groupId);
    store.setViewLayerGroups(currentViewId, nextGroups);
}

function validateCanvasObjects(viewId, layers) {
    if (
        !viewId ||
        !Array.isArray(layers) ||
        !window.pwcaCanvasManager ||
        typeof window.pwcaCanvasManager.getCanvas !== 'function' ||
        !window.PrintAreaValidator ||
        typeof window.PrintAreaValidator.validateAndRepositionObject !== 'function'
    ) {
        return;
    }

    const canvas = window.pwcaCanvasManager.getCanvas(viewId);
    if (!canvas || typeof canvas.getObjects !== 'function') {
        return;
    }

    const objects = canvas.getObjects();
    layers.forEach((layer) => {
        const targetObject = objects.find((obj) => String(obj.id) === String(layer.id));
        if (!targetObject) {
            return;
        }

        try {
            window.PrintAreaValidator.validateAndRepositionObject(targetObject, viewId);
        } catch (error) {
        }
    });
}

export function assignLayerToPrintMethodWithGrouping({
    store,
    printMethodStore,
    layerGroups,
    selectedLayer,
    methodId,
    getGroupLayers,
    controlMaskCanvasVisibility,
    printMethodOption
}) {
    const currentViewId = store.activeViewId;
    if (!currentViewId || !selectedLayer || !methodId) {
        return { success: false, error: '请选择一个打印方法' };
    }

    const selectedMethod = printMethodStore.getPrintMethodById(methodId);
    if (!selectedMethod) {
        return { success: false, error: '选择的打印方法无效' };
    }

    const validation = printMethodStore.validateLayerForPrintMethod(
        selectedLayer,
        methodId
    );
    if (!validation.valid) {
        return {
            success: false,
            error: `图层不符合打印方式要求：\n${validation.errors.join('\n')}`
        };
    }

    const targetGroup = ensureGroupExists({
        store,
        layerGroups,
        currentViewId,
        selectedMethod,
        methodId,
        separate: printMethodOption === 'separate'
    });

    const viewLayers = store.getViewLayers(currentViewId) || [];
    const nextLayers = viewLayers.map((layer) => {
        if (layer.id !== selectedLayer.id) {
            return layer;
        }

        return {
            ...layer,
            groupId: targetGroup.id,
            printMethodId: methodId,
            groupOrder: getGroupLayers(targetGroup.id).length
        };
    });

    store.setViewLayers(currentViewId, nextLayers);
    printMethodStore.assignLayerPrintMethod(selectedLayer.id, methodId);
    printMethodStore.assignGroupPrintMethod(targetGroup.id, methodId);
    printMethodStore.recomputeUsedPrintMethodsForView(currentViewId, nextLayers);

    cleanupEmptyGroup(store, currentViewId, selectedLayer.groupId);

    if (store.activeObjectId === selectedLayer.id) {
        controlMaskCanvasVisibility(selectedLayer.id);
    }

    const updatedLayer = nextLayers.find((layer) => layer.id === selectedLayer.id);
    if (updatedLayer) {
        validateCanvasObjects(currentViewId, [updatedLayer]);
    }

    return { success: true, groupId: targetGroup.id };
}

export function changeGroupPrintMethodWithGrouping({
    store,
    printMethodStore,
    layerGroups,
    group,
    methodId,
    getGroupLayers,
    controlMaskCanvasVisibility
}) {
    const currentViewId = store.activeViewId;
    if (!currentViewId || !group || !methodId) {
        return { success: false, error: '请选择一个印刷方式' };
    }

    const selectedMethod = printMethodStore.getPrintMethodById(methodId);
    if (!selectedMethod) {
        return { success: false, error: '选择的印刷方式无效' };
    }

    const groupLayers = getGroupLayers(group.id);
    const invalidLayers = [];

    groupLayers.forEach((layer) => {
        const validation = printMethodStore.validateLayerForPrintMethod(layer, methodId);
        if (!validation.valid) {
            invalidLayers.push({
                layer,
                errors: validation.errors
            });
        }
    });

    if (invalidLayers.length > 0) {
        let errorMessage = '以下图层不符合新印刷方式要求：\n';
        invalidLayers.forEach((item) => {
            errorMessage += `\n- ${item.layer.name || item.layer.type}: ${item.errors.join(', ')}`;
        });

        return { success: false, error: errorMessage };
    }

    const targetGroup = ensureGroupExists({
        store,
        layerGroups,
        currentViewId,
        selectedMethod,
        methodId,
        separate: false
    });

    const viewLayers = store.getViewLayers(currentViewId) || [];
    const nextLayers = viewLayers.map((layer) => {
        const matchedIndex = groupLayers.findIndex(
            (groupLayer) => groupLayer.id === layer.id
        );

        if (matchedIndex === -1) {
            return layer;
        }

        printMethodStore.assignLayerPrintMethod(layer.id, methodId);

        return {
            ...layer,
            groupId: targetGroup.id,
            printMethodId: methodId,
            groupOrder: matchedIndex
        };
    });

    store.setViewLayers(currentViewId, nextLayers);
    printMethodStore.assignGroupPrintMethod(targetGroup.id, methodId);
    if (group.id !== targetGroup.id) {
        printMethodStore.unassignGroupPrintMethod(group.id);
    }
    printMethodStore.recomputeUsedPrintMethodsForView(currentViewId, nextLayers);

    cleanupEmptyGroup(store, currentViewId, group.id);

    const affectedLayers = nextLayers.filter((layer) =>
        groupLayers.some((item) => item.id === layer.id)
    );
    validateCanvasObjects(currentViewId, affectedLayers);

    document.dispatchEvent(new CustomEvent('pwcaGroupPrintMethodChanged', {
        detail: {
            groupId: group.id,
            newPrintMethodId: methodId,
            affectedLayers
        }
    }));

    if (store.activeObjectId) {
        const affectedLayerIds = affectedLayers.map((layer) => layer.id);
        if (affectedLayerIds.includes(store.activeObjectId)) {
            controlMaskCanvasVisibility(store.activeObjectId);
        }
    }

    return { success: true };
}
