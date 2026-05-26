// 打印方式相关逻辑
// 负责：打印方式列表、按钮禁用状态、图层/图层组打印方式切换与弹窗交互

import {
    assignLayerToPrintMethodWithGrouping,
    changeGroupPrintMethodWithGrouping,
    getPrintMethodColor
} from './print-method-assignment-service.js';

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

    const assignLayerToPrintMethod = () => {
        if (!selectedLayerForAssign.value || !selectedPrintMethodId.value) {
            window.alert('请选择一个打印方法');
            return;
        }

        let printMethodOption = 'merge';
        if (isSelectedLayerInExistingGroup.value) {
            const selectedOption = document.querySelector(
                'input[name="printMethodOption"]:checked'
            );
            if (selectedOption) {
                printMethodOption = selectedOption.value;
            }
        }

        const result = assignLayerToPrintMethodWithGrouping({
            store,
            printMethodStore,
            layerGroups,
            selectedLayer: selectedLayerForAssign.value,
            methodId: selectedPrintMethodId.value,
            getGroupLayers,
            controlMaskCanvasVisibility,
            printMethodOption
        });

        if (!result.success) {
            window.alert(result.error || '分配印刷方式失败');
            return;
        }

        closePrintMethodModal();
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

        const result = changeGroupPrintMethodWithGrouping({
            store,
            printMethodStore,
            layerGroups,
            group: selectedGroupForPrintMethod.value,
            methodId: selectedGroupPrintMethodId.value,
            getGroupLayers,
            controlMaskCanvasVisibility
        });

        if (!result.success) {
            window.alert(result.error || '修改印刷方式失败');
            return;
        }

        closeGroupPrintMethodModal();
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
