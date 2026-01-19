// 打印方式相关逻辑
// 负责：打印方式列表、按钮禁用状态、图层/图层组打印方式切换与弹窗交互

export function createPrintMethodHelpers(options) {
    const {
        store,
        printMethodStore,
        currentViewLayers,
        layerGroups,
        activeView,
        getGroupLayers,
        controlMaskCanvasVisibility
    } = options;

    const printMethods = Vue.computed(
        () => printMethodStore.currentViewPrintMethods
    );
    const selectedPrintMethod = Vue.computed(
        () => printMethodStore.selectedPrintMethod
    );

    const canSwitchPrintMethod = Vue.computed(
        () => printMethodStore.canSwitchPrintMethod
    );

    const isPrintMethodSwitchDisabled = Vue.computed(() => {
        if (
            activeView.value &&
            activeView.value.single_printing_method_only === true
        ) {
            return true;
        }
        return printMethodStore.isSinglePrintMethod;
    });

    const isLayerPrintMethodSwitchDisabled = (layer) => {
        if (isPrintMethodSwitchDisabled.value) {
            return true;
        }

        if (layer.groupId) {
            const groupLayers = getGroupLayers(layer.groupId);
            if (groupLayers.length === 1) {
                return true;
            }
        }

        return false;
    };

    const getLayerSwitchMethodTooltip = (layer) => {
        if (
            activeView.value &&
            activeView.value.single_printing_method_only === true
        ) {
            return '当前视图只有一种印刷方式，无法切换';
        }
        if (printMethodStore.isSinglePrintMethod) {
            return '当前视图只有一种印刷方式，无法切换';
        }
        if (layer.groupId) {
            const groupLayers = getGroupLayers(layer.groupId);
            if (groupLayers.length === 1) {
                return '图层组中只有一个图层，无法切换印刷方式';
            }
        }
        return '切换印刷方式';
    };

    const isGroupPrintMethodSwitchDisabled = Vue.computed(
        () => printMethodStore.isSinglePrintMethod
    );

    const getSwitchMethodTooltip = Vue.computed(() => {
        if (isPrintMethodSwitchDisabled.value) {
            return '当前视图只有一种印刷方式，无法切换';
        }
        return '切换印刷方式';
    });

    const getGroupPrintMethodTooltip = Vue.computed(() => {
        if (isGroupPrintMethodSwitchDisabled.value) {
            return '当前视图只有一种印刷方式，无法切换';
        }
        return '修改图层组印刷方式';
    });

    const selectedLayerForAssign = Vue.ref(null);
    const selectedPrintMethodId = Vue.ref(
        printMethodStore.selectedPrintMethodId
    );
    const activeTab = Vue.ref('color');

    const isPrintMethodModalOpen = Vue.ref(false);

    const selectedGroupForPrintMethod = Vue.ref(null);
    const selectedGroupPrintMethodId = Vue.ref(null);
    const isGroupPrintMethodModalOpen = Vue.ref(false);

    const isSelectedLayerInExistingGroup = Vue.computed(() => {
        if (!selectedPrintMethodId.value) {
            return false;
        }

        const expectedGroupId = `print-method-${selectedPrintMethodId.value}`;
        const allGroups = store.getViewLayerGroups(store.activeViewId);
        const existingGroup = allGroups.find(
            (group) => group.id === expectedGroupId
        );

        if (!existingGroup) {
            return false;
        }

        const groupLayers = currentViewLayers.value.filter(
            (layer) => layer.groupId === expectedGroupId
        );
        const groupLayerCount = groupLayers.length;

        return groupLayerCount >= 2;
    });

    const showGroupAssignDialog = (layer) => {
        if (printMethodStore.isSinglePrintMethod) {
            return;
        }

        selectedLayerForAssign.value = layer;
        const currentMethod = printMethodStore.getLayerPrintMethod(layer.id);
        selectedPrintMethodId.value = currentMethod
            ? currentMethod.id
            : printMethodStore.selectedPrintMethodId;
        activeTab.value = 'color';

        isPrintMethodModalOpen.value = true;
    };

    const closePrintMethodModal = () => {
        isPrintMethodModalOpen.value = false;
        selectedLayerForAssign.value = null;
    };

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

    const assignLayerToGroup = (groupId) => {
        const currentViewId = store.activeViewId;
        if (!currentViewId) {
            return;
        }

        const viewLayers = store.getViewLayers(currentViewId);
        const layerIndex = viewLayers.findIndex(
            (l) => l.id === selectedLayerForAssign.value.id
        );
        if (layerIndex !== -1) {
            const updatedLayers = [...viewLayers];
            updatedLayers[layerIndex] = {
                ...updatedLayers[layerIndex],
                groupId,
                printMethodId: selectedPrintMethodId.value,
                groupOrder: getGroupLayers(groupId).length
            };
            store.setViewLayers(currentViewId, updatedLayers);

            if (store.activeObjectId === selectedLayerForAssign.value.id) {
                controlMaskCanvasVisibility(selectedLayerForAssign.value.id);
            }
        }

        isPrintMethodModalOpen.value = false;
        selectedLayerForAssign.value = null;
    };

    const assignLayerToPrintMethod = () => {
        if (!selectedLayerForAssign.value || !selectedPrintMethodId.value) {
            window.alert('请选择一个打印方法');
            return;
        }

        const selectedMethod = printMethodStore.getPrintMethodById(
            selectedPrintMethodId.value
        );
        if (!selectedMethod) {
            window.alert('选择的打印方法无效');
            return;
        }

        const validation = printMethodStore.validateLayerForPrintMethod(
            selectedLayerForAssign.value,
            selectedPrintMethodId.value
        );
        if (!validation.valid) {
            window.alert(
                `图层不符合打印方式要求：\n${validation.errors.join('\n')}`
            );
            return;
        }

        printMethodStore.assignLayerPrintMethod(
            selectedLayerForAssign.value.id,
            selectedPrintMethodId.value
        );

        let printMethodOption = 'merge';
        if (isSelectedLayerInExistingGroup.value) {
            const selectedOption = document.querySelector(
                'input[name="printMethodOption"]:checked'
            );
            if (selectedOption) {
                printMethodOption = selectedOption.value;
            }
        }

        if (printMethodOption === 'separate') {
            const timestamp = Date.now();
            const groupId = `print-method-${selectedPrintMethodId.value}-${timestamp}`;

            const newGroup = {
                id: groupId,
                name: `${selectedMethod.name} (${timestamp})`,
                color: getPrintMethodColor(selectedPrintMethodId.value),
                visible: true,
                locked: false,
                expanded: true,
                printMethodId: selectedPrintMethodId.value
            };

            const updatedGroups = [...layerGroups.value, newGroup];
            const currentViewId = store.activeViewId;
            if (currentViewId) {
                store.setViewLayerGroups(currentViewId, updatedGroups);
            } else {
                store.setLayerGroups(updatedGroups);
            }

            assignLayerToGroup(groupId);
        } else {
            const groupId = `print-method-${selectedPrintMethodId.value}`;
            const currentViewId = store.activeViewId;

            let existingGroup = layerGroups.value.find(
                (g) => g.id === groupId
            );
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

                if (currentViewId) {
                    store.setViewLayerGroups(currentViewId, updatedGroups);
                } else {
                    store.setLayerGroups(updatedGroups);
                }

                existingGroup = newGroup;
            }

            assignLayerToGroup(groupId);
        }
    };

    const showGroupPrintMethodDialog = (group) => {
        if (printMethodStore.isSinglePrintMethod) {
            return;
        }

        selectedGroupForPrintMethod.value = group;

        const groupLayers = getGroupLayers(group.id);
        if (groupLayers.length > 0) {
            const firstLayerPrintMethod =
                printMethodStore.getLayerPrintMethod(groupLayers[0].id);
            selectedGroupPrintMethodId.value = firstLayerPrintMethod
                ? firstLayerPrintMethod.id
                : null;
        } else {
            selectedGroupPrintMethodId.value = null;
        }

        isGroupPrintMethodModalOpen.value = true;
    };

    const closeGroupPrintMethodModal = () => {
        isGroupPrintMethodModalOpen.value = false;
        selectedGroupForPrintMethod.value = null;
        selectedGroupPrintMethodId.value = null;
    };

    const confirmGroupPrintMethodChange = () => {
        if (
            !selectedGroupForPrintMethod.value ||
            !selectedGroupPrintMethodId.value
        ) {
            window.alert('请选择一个印刷方式');
            return;
        }

        const selectedMethod = printMethodStore.getPrintMethodById(
            selectedGroupPrintMethodId.value
        );
        if (!selectedMethod) {
            window.alert('选择的印刷方式无效');
            return;
        }

        const groupLayers = getGroupLayers(selectedGroupForPrintMethod.value.id);

        const invalidLayers = [];
        for (const layer of groupLayers) {
            const validation = printMethodStore.validateLayerForPrintMethod(
                layer,
                selectedGroupPrintMethodId.value
            );
            if (!validation.valid) {
                invalidLayers.push({
                    layer,
                    errors: validation.errors
                });
            }
        }

        if (invalidLayers.length > 0) {
            let errorMessage = '以下图层不符合新印刷方式要求：\n';
            invalidLayers.forEach((item) => {
                errorMessage += `\n- ${
                    item.layer.name || item.layer.type
                }: ${item.errors.join(', ')}`;
            });
            window.alert(errorMessage);
            return;
        }

        const currentViewId = store.activeViewId;
        if (!currentViewId) {
            return;
        }

        const newGroupId = `print-method-${selectedGroupPrintMethodId.value}`;
        let newGroup = layerGroups.value.find((g) => g.id === newGroupId);

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

        const viewLayers = store.getViewLayers(currentViewId);
        const updatedLayers = [...viewLayers];

        groupLayers.forEach((layer, index) => {
            const layerIndex = updatedLayers.findIndex(
                (l) => l.id === layer.id
            );
            if (layerIndex !== -1) {
                printMethodStore.assignLayerPrintMethod(
                    layer.id,
                    selectedGroupPrintMethodId.value
                );

                updatedLayers[layerIndex] = {
                    ...updatedLayers[layerIndex],
                    groupId: newGroupId,
                    printMethodId: selectedGroupPrintMethodId.value,
                    groupOrder: index
                };
            }
        });

        store.setViewLayers(currentViewId, updatedLayers);

        const oldGroupLayers = getGroupLayers(selectedGroupForPrintMethod.value.id);
        if (oldGroupLayers.length === 0) {
            const currentViewGroups = store.getViewLayerGroups(currentViewId);
            const filteredGroups = currentViewGroups.filter(
                (g) => g.id !== selectedGroupForPrintMethod.value.id
            );
            store.setViewLayerGroups(currentViewId, filteredGroups);
        }

        closeGroupPrintMethodModal();

        const event = new CustomEvent('pwcaGroupPrintMethodChanged', {
            detail: {
                groupId: selectedGroupForPrintMethod.value.id,
                newPrintMethodId: selectedGroupPrintMethodId.value,
                affectedLayers: groupLayers
            }
        });
        document.dispatchEvent(event);

        if (store.activeObjectId) {
            const affectedLayerIds = groupLayers.map((layer) => layer.id);
            if (affectedLayerIds.includes(store.activeObjectId)) {
                controlMaskCanvasVisibility(store.activeObjectId);
            }
        }
    };

    return {
        printMethods,
        selectedPrintMethod,
        canSwitchPrintMethod,
        isPrintMethodSwitchDisabled,
        isLayerPrintMethodSwitchDisabled,
        getLayerSwitchMethodTooltip,
        isGroupPrintMethodSwitchDisabled,
        getSwitchMethodTooltip,
        getGroupPrintMethodTooltip,
        selectedLayerForAssign,
        selectedPrintMethodId,
        activeTab,
        isPrintMethodModalOpen,
        selectedGroupForPrintMethod,
        selectedGroupPrintMethodId,
        isGroupPrintMethodModalOpen,
        isSelectedLayerInExistingGroup,
        showGroupAssignDialog,
        closePrintMethodModal,
        assignLayerToPrintMethod,
        showGroupPrintMethodDialog,
        closeGroupPrintMethodModal,
        confirmGroupPrintMethodChange,
        getPrintMethodColor
    };
}