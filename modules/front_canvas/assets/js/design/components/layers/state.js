// 图层状态和视图相关的响应式绑定
// 只负责从 Pinia store 派生出图层 / 视图 / 分组相关的计算属性和基础方法

export function useLayerState(store) {
    const layers = Vue.computed(() => store.layers);
    const activeObjectId = Vue.computed(() => store.activeObjectId);
    const layerGroups = Vue.computed(() => store.layerGroups);
    const activeGroupId = Vue.computed(() => store.activeGroupId);
    const views = Vue.computed(() => store.views);
    const activeViewId = Vue.computed(() => store.activeViewId);
    const activeView = Vue.computed(() => store.activeView);

    // 当前视图下的图层
    const currentViewLayers = Vue.computed(() => {
        if (!activeViewId.value) {
            return [];
        }
        return store.getViewLayers(activeViewId.value);
    });

    // 当前视图下的图层组（过滤掉只有一个图层的组）
    const currentViewLayerGroups = Vue.computed(() => {
        if (!activeViewId.value) {
            return [];
        }
        const allGroups = store.getViewLayerGroups(activeViewId.value);
        return allGroups.filter((group) => {
            const groupLayers = currentViewLayers.value.filter(
                (layer) => layer.groupId === group.id
            );
            return groupLayers.length > 1;
        });
    });

    // 当前视图下“未分组”的图层：真正未分组 + 组内只有一个图层的情况
    const currentViewUngroupedLayers = Vue.computed(() => {
        return currentViewLayers.value.filter((layer) => {
            if (!layer.groupId) {
                return true;
            }
            const groupLayers = currentViewLayers.value.filter(
                (l) => l.groupId === layer.groupId
            );
            return groupLayers.length === 1;
        });
    });

    // 兼容旧逻辑：仅仅是 groupId 为空的图层
    const ungroupedLayers = Vue.computed(() => {
        return currentViewLayers.value.filter((layer) => !layer.groupId);
    });

    const switchToView = (viewId) => {
        window.pwcaViewSwitchFacade.switchToView(viewId, {
            source: 'layers-state',
            forceDomSync: true
        });
    };

    const getCurrentViewName = () => {
        if (!activeViewId.value) {
            return 'No View';
        }
        const currentView = views.value.find((view) => view.id === activeViewId.value);
        return currentView ? currentView.name : 'Unknown View';
    };

    // 监听视图切换，确保相关计算属性刷新
    Vue.watch(
        () => store.activeViewId,
        (newViewId) => {
            if (newViewId) {
                Vue.nextTick(() => {
                    // 占位：依赖 currentViewLayers/currentViewLayerGroups 的计算属性会自动更新
                });
            }
        },
        { immediate: true }
    );

    return {
        layers,
        activeObjectId,
        layerGroups,
        activeGroupId,
        views,
        activeViewId,
        activeView,
        currentViewLayers,
        currentViewLayerGroups,
        currentViewUngroupedLayers,
        ungroupedLayers,
        switchToView,
        getCurrentViewName
    };
}
