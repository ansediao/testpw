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
    };

    const setVariants = (vars) => {
        variants.value = vars;
    };

    // 添加请求状态跟踪
    const isDataFetched = Vue.ref(false);
    const fetchPromise = Vue.ref(null);

    const fetchProductData = async () => {
        if (!productId.value) return;

        // 如果数据已经获取过，直接返回
        if (isDataFetched.value && productData.value) {
            return productData.value;
        }

        // 如果正在请求中，返回同一个 Promise
        if (fetchPromise.value) {
            return fetchPromise.value;
        }

        // 创建新的请求 Promise
        fetchPromise.value = (async () => {
            setLoading(true);
            setError(null);

            try {
                // 使用统一的 API 模块获取数据
                if (typeof window.productDataAPI === 'undefined') {
                    throw new Error('ProductDataAPI 未加载');
                }

                const apiData = await window.productDataAPI.fetchCurrentProductData();

                // 处理 WooCommerce 产品数据
                if (apiData.has_woocommerce_product && apiData.woocommerce) {
                    const wooData = apiData.woocommerce;
                    setProductData({
                        id: wooData.id,
                        name: wooData.name,
                        price: parseFloat(wooData.price) || 0,
                        price_html: wooData.price_html,
                        description: wooData.description || '',
                        sku: wooData.sku || '',
                        stock_status: wooData.stock_status,
                        in_stock: wooData.in_stock,
                        permalink: wooData.permalink,
                        apiData: apiData // 存储完整的 API 数据
                    });
                }

                // 处理颜色变体数据
                if (apiData.has_variants && apiData.variants && apiData.variants.data) {
                    setVariants(apiData.variants.data);

                    // 默认选择第一个变体
                    if (apiData.variants.data.length > 0) {
                        setSelectedVariant(apiData.variants.data[0]);
                    }
                }

                // 标记数据已获取
                isDataFetched.value = true;
                return productData.value;

            } catch (err) {
                setError(err.message);
                throw err;
            } finally {
                setLoading(false);
                fetchPromise.value = null; // 清除请求状态
            }
        })();

        return fetchPromise.value;
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
        } catch (err) {
            setError(err.message);
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
        isDataFetched,

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