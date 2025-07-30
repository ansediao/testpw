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

    // Quantity Discount related state
    const quantityDiscounts = Vue.ref([]);
    const currentDiscount = Vue.ref(0);

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
            if (sellInBatch === true) {
                if (batchQty > 1) {
                    // 计算从最小数量开始的批次倍数
                    const excessQuantity = inputQuantity - minQty;
                    const remainder = excessQuantity % batchQty;

                    if (remainder !== 0) {
                        // 向上调整到下一个批次
                        return inputQuantity - remainder + batchQty;
                    }
                }
            }

            return inputQuantity;
        };
    });

    const isValidQuantity = Vue.computed(() => {
        return quantity.value >= minQuantity.value && quantity.value <= maxQuantity.value;
    });

    // Quantity Discount computed properties
    const hasQuantityDiscounts = Vue.computed(() => {
        return quantityDiscounts.value.length > 0;
    });

    const getCurrentDiscount = Vue.computed(() => {
        if (!hasQuantityDiscounts.value) return 0;

        let applicableDiscount = 0;
        // 找到适用的最高折扣梯度（数量大于等于range_from的最大梯度）
        for (const discount of quantityDiscounts.value) {
            if (quantity.value >= discount.range_from) {
                applicableDiscount = discount.discount;
                // 继续查找更高的梯度，因为数组已按range_from排序
            }
        }
        return applicableDiscount;
    });

    const getDiscountText = Vue.computed(() => {
        const discount = getCurrentDiscount.value;
        if (discount === 0) return '';

        const percentage = Math.round((1 - discount) * 100);
        return `${percentage}% OFF`;
    });

    const discountedPrice = Vue.computed(() => {
        const basePrice = selectedVariantPrice.value || (productData.value ? productData.value.price : 0);
        const discount = getCurrentDiscount.value;
        return discount > 0 ? basePrice * discount : basePrice;
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
        // 首先确保数量在有效范围内
        const clampedQty = Math.max(minQuantity.value, Math.min(qty, maxQuantity.value));

        // 然后根据批量销售要求进行修正
        const corrected = correctedQuantity.value(clampedQty);

        quantity.value = corrected;
    };

    // 直接设置数量，不进行批次修正（用于输入框）
    const setQuantityDirect = (qty) => {
        // 只进行基本的范围限制，不进行批次修正
        const clampedQty = Math.max(1, Math.min(qty, maxQuantity.value));
        quantity.value = clampedQty;
    };

    // 获取下一个有效的批次数量（增加方向）
    const getNextValidQuantity = (currentQty) => {
        const minQty = minQuantity.value;
        const batchQty = stepQuantity.value;
        const sellInBatch = moqSettings.value.sell_in_batch;

        if (sellInBatch !== true || batchQty <= 1) {
            return currentQty + 1;
        }

        // 如果当前数量已经是有效批次，返回下一个批次
        const corrected = correctedQuantity.value(currentQty);
        if (corrected === currentQty) {
            return currentQty + batchQty;
        }

        // 如果当前数量不是有效批次，返回修正后的数量
        return corrected;
    };

    // 获取上一个有效的批次数量（减少方向）
    const getPreviousValidQuantity = (currentQty) => {
        const minQty = minQuantity.value;
        const batchQty = stepQuantity.value;
        const sellInBatch = moqSettings.value.sell_in_batch;

        if (sellInBatch !== true || batchQty <= 1) {
            return Math.max(minQty, currentQty - 1);
        }

        // 如果当前数量已经是有效批次
        const corrected = correctedQuantity.value(currentQty);
        if (corrected === currentQty) {
            // 计算上一个批次
            const previousBatch = currentQty - batchQty;
            return Math.max(minQty, previousBatch);
        }

        // 如果当前数量不是有效批次，找到当前数量之下最近的有效批次
        if (currentQty <= minQty) {
            return minQty;
        }

        // 计算当前数量对应的批次索引，然后减1
        const excessQuantity = currentQty - minQty;
        const batchIndex = Math.floor(excessQuantity / batchQty);
        const previousBatchQuantity = minQty + (batchIndex * batchQty);
        
        return Math.max(minQty, previousBatchQuantity);
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

            // 根据 sell_in_batch 设置步进值
            if (moqSettings.value.sell_in_batch === true) {
                stepQuantity.value = moqSettings.value.batch_quantity;
            } else {
                stepQuantity.value = 1; // 不按批次销售时，步进值为1
            }

            // 如果当前数量小于最小数量，自动调整
            if (quantity.value < minQuantity.value) {
                quantity.value = minQuantity.value;
            }

            // 如果按批次销售，确保当前数量符合批次要求
            if (moqSettings.value.sell_in_batch === true) {
                const corrected = correctedQuantity.value(quantity.value);
                if (corrected !== quantity.value) {
                    quantity.value = corrected;
                }
            }
        }
    };

    const setQuantityDiscounts = (discounts) => {
        if (!Array.isArray(discounts)) {
            console.warn('Quantity discounts should be an array:', discounts);
            return;
        }

        quantityDiscounts.value = discounts.map(discount => ({
            type: discount.type || 'MOQ',
            range_from: parseInt(discount.range_from) || 0,
            range_to: parseInt(discount.range_to) || 0,
            discount: parseFloat(discount.discount) || 1,
            extra_processing_time: parseInt(discount.extra_processing_time) || 0
        })).sort((a, b) => a.range_from - b.range_from); // 按数量排序
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

                    // 构建 MOQ 设置对象
                    const moqSettingsData = {};

                    // 处理批量销售设置
                    if (productApiData.sell_in_batch !== undefined) {
                        moqSettingsData.sell_in_batch = productApiData.sell_in_batch;
                    }

                    // 处理批量销售信息
                    if (productApiData.sell_in_batch_info) {
                        if (productApiData.sell_in_batch_info.batch_quantity !== undefined) {
                            moqSettingsData.batch_quantity = productApiData.sell_in_batch_info.batch_quantity;
                        }
                        if (productApiData.sell_in_batch_info.moq_quantity !== undefined) {
                            moqSettingsData.minimum_order_quantity = productApiData.sell_in_batch_info.moq_quantity;
                        }
                    }

                    // 兼容旧的 moq_setting 结构
                    if (productApiData.moq_setting) {
                        Object.assign(moqSettingsData, productApiData.moq_setting);
                    }

                    // 设置 MOQ 配置
                    if (Object.keys(moqSettingsData).length > 0) {
                        setMoqSettings(moqSettingsData);
                    }

                    // 提取数量折扣数据
                    if (productApiData.quantity_discount) {
                        setQuantityDiscounts(productApiData.quantity_discount);
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
        quantityDiscounts,
        currentDiscount,

        // Getters
        isLoading,
        hasError,
        totalPrice,
        canAddToCart,
        hasVariants,
        selectedVariantPrice,
        correctedQuantity,
        isValidQuantity,
        hasQuantityDiscounts,
        getCurrentDiscount,
        getDiscountText,
        discountedPrice,

        // Actions
        setProductId,
        setProductData,
        setLoading,
        setError,
        updateQuantity,
        setQuantityDirect,
        getNextValidQuantity,
        getPreviousValidQuantity,
        setSelectedOption,
        toggleDetails,
        setActiveTab,
        setSelectedVariant,
        setVariants,
        setMoqSettings,
        setQuantityDiscounts,
        fetchProductData,
        addToCart
    };
});

// Export for module usage
window.useProductStore = useProductStore;