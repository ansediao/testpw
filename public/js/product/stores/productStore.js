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
        
        // Variants
        selectedVariant: null,
        variants: [],
        
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
            // 如果有选中的变体，使用变体价格
            if (state.selectedVariant && state.selectedVariant.price) {
                return parseFloat(state.selectedVariant.price) * state.quantity;
            }
            // 否则使用产品默认价格
            if (!state.productData || !state.productData.price) return 0;
            return state.productData.price * state.quantity;
        },
        canAddToCart: (state) => {
            return state.productData && state.quantity > 0 && !state.loading;
        },
        // 变体相关的 getters
        hasVariants: (state) => state.variants.length > 0,
        selectedVariantPrice: (state) => {
            return state.selectedVariant ? parseFloat(state.selectedVariant.price) : 0;
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

        // 变体相关的 actions
        setSelectedVariant(variant) {
            this.selectedVariant = variant;
            console.log('Store: 设置选中变体', variant);
        },

        setVariants(variants) {
            this.variants = variants;
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
                    options: this.selectedOptions,
                    variant: this.selectedVariant // 包含选中的变体信息
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