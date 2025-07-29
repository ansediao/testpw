/**
 * Product Store - Shared state management
 * Using Pinia for state management
 */

const useProductStore = Pinia.defineStore('product', {
    state: () => ({
        // Product basic info
        productId: null,
        productData: null,
        loading: false,
        error: null,
        
        // Cart related
        quantity: 1,
        selectedOptions: {},
        
        // UI state
        showDetails: false,
        activeTab: 'description'
    }),

    getters: {
        // Computed properties
        isLoading: (state) => state.loading,
        hasError: (state) => state.error !== null,
        totalPrice: (state) => {
            if (!state.productData || !state.productData.price) return 0;
            return state.productData.price * state.quantity;
        },
        canAddToCart: (state) => {
            return state.productData && state.quantity > 0 && !state.loading;
        }
    },

    actions: {
        // Methods to modify state
        setProductId(id) {
            this.productId = id;
        },

        setProductData(data) {
            this.productData = data;
        },

        setLoading(status) {
            this.loading = status;
        },

        setError(error) {
            this.error = error;
        },

        updateQuantity(qty) {
            this.quantity = Math.max(1, qty);
        },

        setSelectedOption(key, value) {
            this.selectedOptions[key] = value;
        },

        toggleDetails() {
            this.showDetails = !this.showDetails;
        },

        setActiveTab(tab) {
            this.activeTab = tab;
        },

        // Async actions
        async fetchProductData() {
            if (!this.productId) return;
            
            this.setLoading(true);
            this.setError(null);
            
            try {
                // Mock API call - replace with actual API endpoint
                const response = await axios.get(`/api/product/${this.productId}`);
                this.setProductData(response.data);
            } catch (error) {
                this.setError(error.message);
                console.error('Failed to fetch product data:', error);
            } finally {
                this.setLoading(false);
            }
        },

        async addToCart() {
            if (!this.canAddToCart) return;
            
            this.setLoading(true);
            try {
                const cartData = {
                    productId: this.productId,
                    quantity: this.quantity,
                    options: this.selectedOptions
                };
                
                // Mock API call - replace with actual endpoint
                await axios.post('/api/cart/add', cartData);
                console.log('Added to cart:', cartData);
            } catch (error) {
                this.setError(error.message);
                console.error('Failed to add to cart:', error);
            } finally {
                this.setLoading(false);
            }
        }
    }
});

// Export for module usage
window.useProductStore = useProductStore;