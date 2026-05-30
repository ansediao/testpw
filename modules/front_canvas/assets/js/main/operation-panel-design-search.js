/**
 * Design Search & Filter Module
 * Optimized with Vue/VueUse for better reactivity and maintainability.
 */

import { pinia, useCanvasStore } from '../design/stores/index.js';

const { createApp, reactive, computed, ref, watch } = window.Vue || {};
const { refDebounced } = window.VueUse || {};

const DesignSearchApp = {
    setup() {
        const canvasStore = useCanvasStore();
        
        // Search state
        const quickSearch = ref('');
        const advancedSearch = ref('');
        const debouncedQuickSearch = refDebounced ? refDebounced(quickSearch, 300) : quickSearch;
        const debouncedAdvancedSearch = refDebounced ? refDebounced(advancedSearch, 300) : advancedSearch;
        
        const state = reactive({
            filterOperator: 'contains',
            isAdvancedVisible: false,
            activeViewId: computed(() => canvasStore.activeViewId),
            activeCategoryId: null,
            isCategoryDetailOpen: false
        });

        const categories = window.pwcaDesignData?.categories || [];
        const designIconUrl = window.pwcaDesignData?.designIconUrl || '';

        /**
         * Computed property for filtered categories
         */
        const filteredCategories = computed(() => {
            const query = (state.isAdvancedVisible ? debouncedAdvancedSearch.value : debouncedQuickSearch.value).toLowerCase().trim();
            const activeViewId = state.activeViewId;

            return categories.filter(category => {
                const name = category.name.toLowerCase().trim();
                const type = category.type || 'universal';
                
                let matchesSearch = true;
                if (query) {
                    if (state.isAdvancedVisible) {
                        switch (state.filterOperator) {
                            case 'is': matchesSearch = (name === query); break;
                            case 'isnot': matchesSearch = (name !== query); break;
                            case 'contains': matchesSearch = name.includes(query); break;
                            case 'notcontains': matchesSearch = !name.includes(query); break;
                        }
                    } else {
                        matchesSearch = name.includes(query);
                    }
                }

                let matchesView = true;
                if (type === 'main_view') {
                    matchesView = (activeViewId === 'main_view' || !activeViewId);
                }

                return matchesSearch && matchesView;
            });
        });

        const toggleAdvanced = () => {
            state.isAdvancedVisible = !state.isAdvancedVisible;
            if (!state.isAdvancedVisible) {
                advancedSearch.value = '';
            }
        };

        const selectCategory = (id) => {
            state.activeCategoryId = id;
            state.isCategoryDetailOpen = true;
        };

        const deselectCategory = () => {
            state.activeCategoryId = null;
            state.isCategoryDetailOpen = false;
        };

        const addDesign = (designId) => {
            if (typeof window.addDesignToCanvas === 'function') {
                window.addDesignToCanvas(designId);
            }
        };

        // Watch for store view changes to reset category selection if needed
        watch(() => canvasStore.activeViewId, () => {
            deselectCategory();
        });

        return {
            state,
            quickSearch,
            advancedSearch,
            filteredCategories,
            designIconUrl,
            toggleAdvanced,
            selectCategory,
            deselectCategory,
            addDesign
        };
    },
    template: '#pwca-design-search-template'
};

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('pwca-design-search-app');
    if (container && createApp) {
        const app = createApp(DesignSearchApp);
        app.use(pinia);
        app.mount(container);
    }
});

