/**
 * Product Store - Shared state management
 * Using Pinia for state management with Composition API
 */

const useProductStore = Pinia.defineStore('product', () => {
    // State
    const productId = Vue.ref(null);
    const productData = Vue.ref(null);
    const loading = Vue.ref(false);
    const error = Vue.ref(null);
    const selectedVariant = Vue.ref(null);
    const variants = Vue.ref([]);
    const quantity = Vue.ref(1);
    const selectedOptions = Vue.reactive({});
    const showDetails = Vue.ref(false);
    const activeTab = Vue.ref('description');

    // Getters (computed)
    const isLoading = Vue.computed(() => loading.value);
    const hasError = Vue.computed(() => error.value !== null);
    const totalPrice = Vue.computed(() => {
        // 如果有选中的变体，使用变体价格
        if (selectedVariant.value && selectedVariant.value.price) {
            return parseFloat(selectedVariant.value.price) * quantity.value;
        }
        // 否则使用产品默认价格
        if (!productData.value || !productData.value.price) return 0;
        return productData.value.price * quantity.value;
    });
    const canAddToCart = Vue.computed(() => {
        return productData.value && quantity.value > 0 && !loading.value;
    });
    const hasVariants = Vue.computed(() => variants.value.length > 0);
    const selectedVariantPrice = Vue.computed(() => {
        return selectedVariant.value ? parseFloat(selectedVariant.value.price) : 0;
    });

    // Actions (methods)
    const setProductId = (id) => {
        productId.value = id;
    };

    const setProductData = (data) => {
        productData.value = data;
    };

    const setLoading = (status) => {
        loading.value = status;
    };

    const setError = (err) => {
        error.value = err;
    };

    const updateQuantity = (qty) => {
        quantity.value = Math.max(1, qty);
    };

    const setSelectedOption = (key, value) => {
        selectedOptions[key] = value;
    };

    const toggleDetails = () => {
        showDetails.value = !showDetails.value;
    };

    const setActiveTab = (tab) => {
        activeTab.value = tab;
    };

    const setSelectedVariant = (variant) => {
        selectedVariant.value = variant;
        console.log('Store: 设置选中变体', variant);
    };

    const setVariants = (vars) => {
        variants.value = vars;
    };

    const fetchProductData = async () => {
        if (!productId.value) return;
        
        setLoading(true);
        setError(null);
        
        try {
            // Mock API call - replace with actual API endpoint
            const response = await axios.get(`/api/product/${productId.value}`);
            setProductData(response.data);
        } catch (err) {
            setError(err.message);
            console.error('Failed to fetch product data:', err);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async () => {
        if (!canAddToCart.value) return;
        
        setLoading(true);
        try {
            const cartData = {
                productId: productId.value,
                quantity: quantity.value,
                options: selectedOptions,
                variant: selectedVariant.value // 包含选中的变体信息
            };
            
            // Mock API call - replace with actual endpoint
            await axios.post('/api/cart/add', cartData);
            console.log('Added to cart:', cartData);
        } catch (err) {
            setError(err.message);
            console.error('Failed to add to cart:', err);
        } finally {
            setLoading(false);
        }
    };

    // Return state, getters, and actions
    return {
        // State
        productId,
        productData,
        loading,
        error,
        selectedVariant,
        variants,
        quantity,
        selectedOptions,
        showDetails,
        activeTab,
        
        // Getters
        isLoading,
        hasError,
        totalPrice,
        canAddToCart,
        hasVariants,
        selectedVariantPrice,
        
        // Actions
        setProductId,
        setProductData,
        setLoading,
        setError,
        updateQuantity,
        setSelectedOption,
        toggleDetails,
        setActiveTab,
        setSelectedVariant,
        setVariants,
        fetchProductData,
        addToCart
    };
});

// Export for module usage
window.useProductStore = useProductStore;