const { createApp, ref, computed, reactive, watch, onMounted } = Vue;

const DesignApp = {
    setup() {
        // Data from PHP
        const designs = ref(window.pw_designs_data || []);
        const categories = ref(window.pw_categories_data || []);
        
        // Filter Modal State
        const isFilterModalOpen = ref(false);
        const fieldSearch = ref('');
        
        // Available Filter Fields Definition
        const availableFieldsDef = [
            { key: 'name', label: 'Product Name', type: 'text' },
            { key: 'category', label: 'Category Name', type: 'select', options: [] }, // Options populated from categories
            { key: 'price', label: 'Price', type: 'number' },
            // { key: 'tags', label: 'Tags', type: 'text' }
        ];

        // Active Filters (Array of objects: { field: 'name', operator: 'contains', value: '' })
        const activeFilters = ref([]);
        
        // Temporary Filters for Modal (applied only on Confirm)
        const tempFilters = ref([]);

        // Pagination State
        const currentPage = ref(1);
        const pageSize = ref(20);

        // Sorting
        const sortBy = ref('date_desc'); // date_desc, date_asc, name_asc, name_desc

        // Initialize Category Options
        availableFieldsDef.find(f => f.key === 'category').options = categories.value.map(c => ({
            value: c.slug,
            label: c.name
        }));

        // Open Filter Modal
        const openFilterModal = () => {
            // Clone active filters to temp
            tempFilters.value = JSON.parse(JSON.stringify(activeFilters.value));
            fieldSearch.value = '';
            isFilterModalOpen.value = true;
        };

        const closeFilterModal = () => {
            isFilterModalOpen.value = false;
        };

        const applyFilters = () => {
            activeFilters.value = JSON.parse(JSON.stringify(tempFilters.value));
            currentPage.value = 1; // Reset to page 1
            closeFilterModal();
        };

        const clearFilters = () => {
            tempFilters.value = [];
        };

        // Modal Logic: Search Fields
        const filteredFieldDefs = computed(() => {
            if (!fieldSearch.value) return availableFieldsDef;
            return availableFieldsDef.filter(f => 
                f.label.toLowerCase().includes(fieldSearch.value.toLowerCase())
            );
        });

        const selectedFieldKeys = computed(() => tempFilters.value.map(f => f.key));

        const notSelectedFields = computed(() => {
            return filteredFieldDefs.value.filter(f => !selectedFieldKeys.value.includes(f.key));
        });

        const addFilterField = (fieldDef) => {
            tempFilters.value.push({
                key: fieldDef.key,
                label: fieldDef.label,
                type: fieldDef.type,
                operator: fieldDef.type === 'text' ? 'contains' : (fieldDef.type === 'select' ? 'is' : 'eq'),
                value: ''
            });
        };

        const removeFilterField = (index) => {
            tempFilters.value.splice(index, 1);
        };

        // Main Filtering Logic
        const filteredDesigns = computed(() => {
            let result = designs.value;

            // Apply Active Filters
            if (activeFilters.value.length > 0) {
                result = result.filter(design => {
                    return activeFilters.value.every(filter => {
                        const designValue = design[filter.key];
                        const filterValue = filter.value;
                        
                        if (filterValue === '' || filterValue === null) return true; // Ignore empty filters

                        switch (filter.operator) {
                            case 'contains':
                                return String(designValue).toLowerCase().includes(String(filterValue).toLowerCase());
                            case 'not_contains':
                                return !String(designValue).toLowerCase().includes(String(filterValue).toLowerCase());
                            case 'is':
                            case 'eq':
                                return String(designValue) == String(filterValue);
                            case 'is_not':
                            case 'neq':
                                return String(designValue) != String(filterValue);
                            case 'gt':
                                return Number(designValue) > Number(filterValue);
                            case 'lt':
                                return Number(designValue) < Number(filterValue);
                            default:
                                return true;
                        }
                    });
                });
            }

            // Sorting
            result = [...result].sort((a, b) => {
                if (sortBy.value === 'name_asc') return a.name.localeCompare(b.name);
                if (sortBy.value === 'name_desc') return b.name.localeCompare(a.name);
                if (sortBy.value === 'date_asc') return new Date(a.date) - new Date(b.date);
                if (sortBy.value === 'date_desc') return new Date(b.date) - new Date(a.date);
                return 0;
            });

            return result;
        });

        // Pagination
        const totalPages = computed(() => Math.ceil(filteredDesigns.value.length / pageSize.value));
        
        const paginatedDesigns = computed(() => {
            const start = (currentPage.value - 1) * pageSize.value;
            const end = start + pageSize.value;
            return filteredDesigns.value.slice(start, end);
        });

        const changePage = (page) => {
            if (page >= 1 && page <= totalPages.value) {
                currentPage.value = page;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };

        // Bulk Actions
        const selectedDesignIds = ref([]);
        const allSelected = computed({
            get: () => paginatedDesigns.value.length > 0 && selectedDesignIds.value.length === paginatedDesigns.value.length,
            set: (val) => {
                if (val) {
                    selectedDesignIds.value = paginatedDesigns.value.map(d => d.id);
                } else {
                    selectedDesignIds.value = [];
                }
            }
        });

        const toggleSelection = (id) => {
            const idx = selectedDesignIds.value.indexOf(id);
            if (idx === -1) selectedDesignIds.value.push(id);
            else selectedDesignIds.value.splice(idx, 1);
        };

        // Helper to trigger existing jQuery modals
        const triggerEdit = (id) => {
            // Dispatch event for existing jQuery listeners
             // Use timeout to let Vue event finish
            setTimeout(() => {
                const btn = document.querySelector(`.pw-edit-design-btn[data-design-id="${id}"]`);
                if(btn) btn.click(); // Trigger the jQuery listener
            }, 0);
        };
        
        const triggerDelete = (id, link) => {
             // Let standard link behavior work or intercept if needed
             // The existing link is <a href="..."> so we can just let it be.
        };

        const triggerAddTag = (id) => {
             setTimeout(() => {
                const btn = document.querySelector(`.pw-add-tag-button[data-design-id="${id}"]`);
                if(btn) btn.click();
            }, 0);
        };

        return {
            designs,
            categories,
            isFilterModalOpen,
            fieldSearch,
            availableFieldsDef,
            tempFilters,
            activeFilters,
            openFilterModal,
            closeFilterModal,
            applyFilters,
            clearFilters,
            addFilterField,
            removeFilterField,
            selectedFieldKeys,
            notSelectedFields,
            filteredDesigns,
            paginatedDesigns,
            currentPage,
            totalPages,
            changePage,
            selectedDesignIds,
            allSelected,
            toggleSelection,
            triggerEdit,
            triggerAddTag
        };
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('pw-design-app')) {
        createApp(DesignApp).mount('#pw-design-app');
    }
});
