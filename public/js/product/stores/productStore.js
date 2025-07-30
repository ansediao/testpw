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

    // MOQ (Minimum Order Quantity) related state
    const moqSettings = Vue.ref({
        minimum_order_quantity: 1,
        batch_quantity: 1,
        sell_in_batch: false
    });
    const minQuantity = Vue.ref(1);
    const maxQuantity = Vue.ref(9999);
    const stepQuantity = Vue.ref(1);

    // Getters (computed)
    const isLoading = Vue.computed(() => loading.value);
    const hasError = Vue.computed(() => error.value !== null);
    const totalPrice = Vue.computed(() => {
        // 如果有选中的变体，优先使用变体的 anchor_price
        if (selectedVariant.value && selectedVariant.value.anchor_price) {
            return parseFloat(selectedVariant.value.anchor_price) * quantity.value;
        }
        // 如果变体没有 anchor_price，使用变体的 price
        if (selectedVariant.value && selectedVariant.value.price) {
            return parseFloat(selectedVariant.value.price) * quantity.value;
        }
        // 否则使用产品默认价格
        if (!productData.value || !productData.value.price) return 0;
        return productData.value.price * quantity.value;
    });
    const canAddToCart = Vue.computed(() => {
        return productData.value && quantity.value >= minQuantity.value && !loading.value;
    });
    const hasVariants = Vue.computed(() => variants.value.length > 0);
    const selectedVariantPrice = Vue.computed(() => {
        if (selectedVariant.value && selectedVariant.value.anchor_price) {
            return parseFloat(selectedVariant.value.anchor_price);
        }
        return selectedVariant.value ? parseFloat(selectedVariant.value.price) : 0;
    });

    // MOQ related computed properties
    const correctedQuantity = Vue.computed(() => {
        return (inputQuantity) => {
            const minQty = minQuantity.value;
            const batchQty = stepQuantity.value;
            const sellInBatch = moqSettings.value.sell_in_batch;

            // 确保不低于最小数量
            if (inputQuantity < minQty) {
                return minQty;
            }

            // 如果需要按批次销售，调整到最近的批次数量
            if (sellInBatch && batchQty > 1) {
                const remainder = (inputQuantity - minQty) % batchQty;
                if (remainder !== 0) {
                    return inputQuantity - remainder + batchQty;
                }
            }

            return inputQuantity;
        };
    });

    const isValidQuantity = Vue.computed(() => {
        return quantity.value >= minQuantity.value && quantity.value <= maxQuantity.value;
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
        const corrected = correctedQuantity.value(qty);
        quantity.value = Math.max(minQuantity.value, Math.min(corrected, maxQuantity.value));
    };

    const setMoqSettings = (settings) => {
        if (settings) {
            moqSettings.value = {
                minimum_order_quantity: settings.minimum_order_quantity || 1,
                batch_quantity: settings.batch_quantity || 1,
                sell_in_batch: settings.sell_in_batch || false
            };

            // 更新相关的响应式状态
            minQuantity.value = moqSettings.value.minimum_order_quantity;
            stepQuantity.value = moqSettings.value.batch_quantity;

            // 如果当前数量小于最小数量，自动调整
            if (quantity.value < minQuantity.value) {
                quantity.value = minQuantity.value;
            }
        }
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

                // 处理 MOQ 设置数据
                if (apiData.has_product_data && apiData.product && apiData.product.data) {
                    const productApiData = apiData.product.data;

                    // 提取 MOQ 设置（仅支持嵌套结构）
                    if (productApiData.moq_setting) {
                        setMoqSettings(productApiData.moq_setting);
                    }
                }

                // 处理颜色变体数据
                if (apiData.has_variants && apiData.variants && apiData.variants.data) {
                    setVariants(apiData.variants.data);

                    // 默认选择第一个变体
                    // if (apiData.variants.data.length > 0) {
                    //     setSelectedVariant(apiData.variants.data[0]);
                    // }
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
        moqSettings,
        minQuantity,
        maxQuantity,
        stepQuantity,

        // Getters
        isLoading,
        hasError,
        totalPrice,
        canAddToCart,
        hasVariants,
        selectedVariantPrice,
        correctedQuantity,
        isValidQuantity,

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
        setMoqSettings,
        fetchProductData,
        addToCart
    };
});

// Export for module usage
window.useProductStore = useProductStore;