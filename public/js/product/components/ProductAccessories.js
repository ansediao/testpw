/**
 * Product Accessories Component
 * Displays product accessories with dropdown selection and 1:1 quantity relationship
 */

const ProductAccessories = {
    name: 'ProductAccessories',

    setup() {
        // Access shared store
        const store = useProductStore();

        // Component state
        const isOpen = Vue.ref(false);
        const selectedAccessories = Vue.ref(new Set());

        // Computed properties
        const accessories = Vue.computed(() => {
            return store.productData?.accessories || [];
        });

        const hasAccessories = Vue.computed(() => {
            return accessories.value.length > 0;
        });

        const selectedAccessoriesArray = Vue.computed(() => {
            return accessories.value.filter(accessory =>
                selectedAccessories.value.has(accessory.id)
            );
        });

        // Methods
        const toggleDropdown = (event) => {
            event.stopPropagation();
            isOpen.value = !isOpen.value;
        };

        const closeDropdown = () => {
            isOpen.value = false;
        };

        const selectAccessory = (accessory) => {
            if (selectedAccessories.value.has(accessory.id)) {
                showCustomAlert('该配件已添加！');
                return;
            }

            selectedAccessories.value.add(accessory.id);
            closeDropdown();
        };

        const removeAccessory = (accessoryId) => {
            selectedAccessories.value.delete(accessoryId);
        };

        const showCustomAlert = (message) => {
            let alertBox = document.querySelector('.custom-alert');
            if (alertBox) {
                alertBox.remove();
            }

            alertBox = document.createElement('div');
            alertBox.textContent = message;
            alertBox.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background-color: #f8d7da;
                color: #721c24;
                padding: 10px 20px;
                border-radius: 5px;
                z-index: 2000;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            `;
            alertBox.className = 'custom-alert';
            document.body.appendChild(alertBox);

            setTimeout(() => {
                alertBox.remove();
            }, 3000);
        };

        // Calculate total quantity for accessories (1:1 with main product)
        const accessoryQuantity = Vue.computed(() => {
            return store.quantity;
        });

        // Calculate total accessories price per unit (for store integration)
        const totalAccessoriesPrice = Vue.computed(() => {
            return selectedAccessoriesArray.value.reduce((total, accessory) => {
                return total + (accessory.price || 0);
            }, 0);
        });

        // Update store with accessories price whenever selection changes
        Vue.watch([selectedAccessoriesArray], () => {
            store.setAccessoriesPrice(totalAccessoriesPrice.value);
        }, { deep: true });

        // Initialize accessories price on mount
        Vue.onMounted(() => {
            store.setAccessoriesPrice(totalAccessoriesPrice.value);
        });

        // Close dropdown when clicking outside
        Vue.onMounted(() => {
            document.addEventListener('click', closeDropdown);
        });

        Vue.onUnmounted(() => {
            document.removeEventListener('click', closeDropdown);
        });

        return {
            store,
            isOpen,
            accessories,
            hasAccessories,
            selectedAccessories,
            selectedAccessoriesArray,
            accessoryQuantity,
            totalAccessoriesPrice,
            toggleDropdown,
            selectAccessory,
            removeAccessory
        };
    },

    template: `
        <div class="product-accessories" v-if="hasAccessories">
            <div class="dropdown-wrapper">
                <label for="accessories-dropdown">Accessories:</label>
                <div class="dropdown-container">
                    <button 
                        id="accessories-dropdown" 
                        class="dropdown-button"
                        :class="{ 'open': isOpen }"
                        @click="toggleDropdown"
                    >
                        <span>Choose</span>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>
                    <div class="accessories-list" :class="{ 'hidden': !isOpen }">
                        <div 
                            v-for="accessory in accessories" 
                            :key="accessory.id"
                            class="accessory-item"
                            @click="selectAccessory(accessory)"
                        >
                            <img 
                                :src="accessory.product_image || 'https://placehold.co/100x100/cccccc/ffffff?text=No+Image'" 
                                :alt="accessory.testname"
                                class="accessory-image"
                            >
                            <div class="accessory-info">
                                <p class="accessory-name">{{ accessory.testname }}</p>
                                <p class="accessory-price">$ {{ (accessory.price || 0).toFixed(2) }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="selected-accessories-container">
                <div v-if="selectedAccessoriesArray.length === 0" class="empty-state">
                    
                </div>
                <div 
                    v-for="accessory in selectedAccessoriesArray" 
                    :key="accessory.id"
                    class="selected-accessory-item"
                >
                    <img 
                        :src="accessory.product_image || 'https://placehold.co/100x100/cccccc/ffffff?text=No+Image'" 
                        :alt="accessory.testname"
                        class="selected-accessory-image"
                    >
                    <div class="selected-accessory-info">
                        <p class="selected-accessory-name">{{ accessory.testname }}</p>
                        <p class="selected-accessory-price">$ {{ (accessory.price || 0).toFixed(2) }}</p>
                    </div>
                    <button 
                        class="remove-btn"
                        @click="removeAccessory(accessory.id)"
                    >
                        ×
                    </button>
                </div>
            </div>
            

        </div>
    `
};

// Register component globally
window.ProductAccessories = ProductAccessories;