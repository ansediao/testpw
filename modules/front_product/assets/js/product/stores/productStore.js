/**
 * Product Store - Shared state management
 */

(() => {
    const proxyRefs = Vue.proxyRefs || ((objectWithRefs) => {
        return new Proxy(objectWithRefs, {
            get(target, key, receiver) {
                const value = Reflect.get(target, key, receiver);
                if (value && value.__v_isRef) {
                    return value.value;
                }
                return value;
            },
            set(target, key, newValue, receiver) {
                const existingValue = Reflect.get(target, key, receiver);
                if (existingValue && existingValue.__v_isRef && !(newValue && newValue.__v_isRef)) {
                    existingValue.value = newValue;
                    return true;
                }
                return Reflect.set(target, key, newValue, receiver);
            }
        });
    });

    const createProductStore = () => {
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

    // 暂时没找到的字段    
    // 数量折扣是否开启
    const quantityDiscountEnabled = Vue.ref(true);
    // 颜色是否提供样品服务
    const colorSampleService = Vue.ref(true);
    // RTS Date
    const rts_date = Vue.ref(true);
    // 预计发货时间 数值
    const rts_date_starts_from = Vue.ref(3);
    // 批量订单额外处理时间
    const rts_for_bulk_order = Vue.ref(2);
    // 样品订单额外处理时间
    const rts_for_sample_order = Vue.ref(1);


    // Buy Sample checkbox state
    const buySampleChecked = Vue.ref(false);
    const blankProductChecked = Vue.ref(false);

    // Gradient color button state
    const gradientColorApplied = Vue.ref(false);

    // Custom color / Gradient color feature toggles (from API raw data)
    const enableCustomColor = Vue.ref(true);
    const enableGradientColor = Vue.ref(true);

    // Accessories price state
    const accessoriesPrice = Vue.ref(0);
    const selectedAccessoriesNames = Vue.ref([]);



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

    // Getters (computed)
    const isLoading = Vue.computed(() => loading.value);
    const hasError = Vue.computed(() => error.value !== null);
    const totalPrice = Vue.computed(() => {
        return discountedPrice.value * quantity.value;
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

    // Base unit price including accessories
    const baseUnitPrice = Vue.computed(() => {
        const productPrice = selectedVariantPrice.value || (productData.value ? productData.value.price : 0);
        return productPrice + accessoriesPrice.value;
    });

    // MOQ related computed properties
    const correctedQuantity = Vue.computed(() => {
        return (inputQuantity) => {
            const minQty = minQuantity.value;
            const batchQty = stepQuantity.value;
            const sellInBatch = moqSettings.value.sell_in_batch;

            if (inputQuantity < minQty) {
                return minQty;
            }

            if (buySampleChecked.value) {
                return inputQuantity;
            }

            if (sellInBatch === true) {
                if (batchQty > 1) {
                    const excessQuantity = inputQuantity - minQty;
                    const remainder = excessQuantity % batchQty;
                    if (remainder !== 0) {
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
        return quantityDiscountEnabled.value && !buySampleChecked.value && quantityDiscounts.value.length > 0;
    });

    const currentDiscount = Vue.computed(() => {
        if (!quantityDiscountEnabled.value || buySampleChecked.value || !hasQuantityDiscounts.value) return 0;

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

    const getCurrentDiscount = Vue.computed(() => currentDiscount.value);

    const discountText = Vue.computed(() => {
        if (!quantityDiscountEnabled.value || buySampleChecked.value) return '';

        const discount = currentDiscount.value;
        if (discount === 0) return '';

        const percentage = Math.round((1 - discount) * 100);
        return `${percentage}% OFF`;
    });

    const getDiscountText = Vue.computed(() => discountText.value);

    const discountedPrice = Vue.computed(() => {
        if (!quantityDiscountEnabled.value || buySampleChecked.value) {
            return baseUnitPrice.value;
        }

        const discount = currentDiscount.value;
        return discount > 0 ? baseUnitPrice.value * discount : baseUnitPrice.value;
    });

    // 计算预计发货日期
    const estimatedShipDate = Vue.computed(() => {
        // 获取当前日期
        const currentDate = new Date();

        // 基础天数：rts_date_starts_from
        let totalDays = rts_date_starts_from.value;

        // 根据是否为样品订单选择额外处理时间
        if (buySampleChecked.value) {
            totalDays += rts_for_sample_order.value;
        } else {
            totalDays += rts_for_bulk_order.value;
        }

        // 计算目标日期
        const shipDate = new Date(currentDate);
        shipDate.setDate(currentDate.getDate() + totalDays);

        // 格式化日期为 MM/DD/YYYY 格式
        const month = String(shipDate.getMonth() + 1).padStart(2, '0');
        const day = String(shipDate.getDate()).padStart(2, '0');
        const year = shipDate.getFullYear();

        return `${month}/${day}/${year}`;
    });

    // Button visibility getters
    const shouldShowAddToCart = Vue.computed(() => {
        // 当渐变颜色被应用时隐藏按钮
        // 当勾选Blank Product时显示，未勾选时隐藏
        return productData.value && !loading.value && !gradientColorApplied.value && blankProductChecked.value;
    });

    const showAddToCartButton = Vue.computed(() => shouldShowAddToCart.value);

    const shouldShowCustomize = Vue.computed(() => {
        // 当勾选Blank Product时隐藏，未勾选时显示
        return productData.value && !loading.value && !blankProductChecked.value;
    });

    const showCustomizeButton = Vue.computed(() => shouldShowCustomize.value);

    // Checkbox visibility getters
    const showBuySampleCheckbox = Vue.computed(() => {
        // 默认显示，可以根据业务逻辑调整
        return productData.value && !loading.value;
    });

    const showBlankProductCheckbox = Vue.computed(() => {
        // 当渐变颜色被应用时隐藏复选框
        return productData.value && !loading.value && !gradientColorApplied.value;
    });

    // Button visibility getters - based on API feature toggles
    // 预留叠加其他逻辑的空间（如视图配置、店铺设置等）
    const showGradientButton = Vue.computed(() => {
        if (!enableGradientColor.value) return false;
        // TODO: 后续可叠加其他条件，例如视图配置、店铺定制设置等
        return true;
    });

    const showCustomColorButton = Vue.computed(() => {
        if (!enableCustomColor.value) return false;
        // TODO: 后续可叠加其他条件，例如视图配置、店铺定制设置等
        return true;
    });

    const estimatedDeliveryDate = Vue.computed(() => {
        const productApiData = productData.value && productData.value.apiData && productData.value.apiData.product
            ? productData.value.apiData.product.data
            : null;

        if (productApiData && productApiData.estimated_delivery_date) {
            return productApiData.estimated_delivery_date;
        }

        if (productApiData) {
            const avgShippingTime = parseInt(productApiData.avg_shipping_time) || 0;
            const rtsDateStartsFrom = rts_date_starts_from.value || 3;
            const processingTime = blankProductChecked.value
                ? (parseInt(productApiData.rts_for_sample_order) || rts_for_sample_order.value || 1)
                : (parseInt(productApiData.rts_for_bulk_order) || rts_for_bulk_order.value || 2);

            const totalDays = avgShippingTime + processingTime + rtsDateStartsFrom;
            const currentDate = new Date();
            const deliveryDate = new Date(currentDate);
            deliveryDate.setDate(currentDate.getDate() + totalDays);

            const month = String(deliveryDate.getMonth() + 1).padStart(2, '0');
            const day = String(deliveryDate.getDate()).padStart(2, '0');
            const year = deliveryDate.getFullYear();

            return `${month}/${day}/${year}`;
        }

        return '7-10 business days';
    });

    const shouldShowDeliveryDate = Vue.computed(() => {
        const productApiData = productData.value && productData.value.apiData && productData.value.apiData.product
            ? productData.value.apiData.product.data
            : null;

        return !!(productApiData && productApiData.arrival_date);
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

    const handleProductUpdatedMeta = (meta) => {
        if (!meta || meta.productUpdated !== true) {
            return;
        }

        const reloadGuardKey = meta.reloadGuardKey || `pw_product_reload_guard_${productId.value || 'current'}`;
        const now = Date.now();
        let shouldReload = true;

        try {
            const lastReloadAt = Number(sessionStorage.getItem(reloadGuardKey) || 0);
            if (lastReloadAt && now - lastReloadAt < 30000) {
                shouldReload = false;
            }
        } catch (e) {
        }

        if (!shouldReload) {
            // eslint-disable-next-line no-console
            console.warn('[PW Product] 已阻止短时间内重复自动刷新', { productId: productId.value });
            return;
        }

        try {
            sessionStorage.setItem(reloadGuardKey, String(now));
        } catch (e) {
        }

        // eslint-disable-next-line no-console
        console.info('[PW Product] 产品数据已更新，即将刷新页面', { productId: productId.value });
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    };

    const setGradientColorApplied = (applied) => {
        gradientColorApplied.value = applied;
    };

    const setEnableCustomColor = (enabled) => {
        enableCustomColor.value = !!enabled;
    };

    const setEnableGradientColor = (enabled) => {
        enableGradientColor.value = !!enabled;
    };

    const resetSelectedVariant = () => {
        selectedVariant.value = null;
    };

    const resetCustomColorState = () => {
        resetSelectedVariant();
        setGradientColorApplied(false);
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

    Vue.watch(buySampleChecked, (isSample) => {
        if (isSample) {
            minQuantity.value = 1;
            quantity.value = 1;
        } else {
            minQuantity.value = moqSettings.value.minimum_order_quantity || 1;
            if (quantity.value < minQuantity.value) {
                quantity.value = minQuantity.value;
            }
            if (moqSettings.value.sell_in_batch === true) {
                const corrected = correctedQuantity.value(quantity.value);
                if (corrected !== quantity.value) {
                    quantity.value = corrected;
                }
            }
        }
    });

    const setQuantityDiscounts = (discounts) => {
        if (!Array.isArray(discounts)) {
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

    const setQuantityDiscountEnabled = (enabled) => {
        quantityDiscountEnabled.value = !!enabled;
    };

    const setColorSampleService = (enabled) => {
        colorSampleService.value = !!enabled;
    };

    const setRtsDate = (enabled) => {
        rts_date.value = !!enabled;
    };

    const setRtsDateStartsFrom = (days) => {
        rts_date_starts_from.value = parseInt(days) || 3;
    };

    const setRtsForBulkOrder = (days) => {
        rts_for_bulk_order.value = parseInt(days) || 2;
    };

    const setRtsForSampleOrder = (days) => {
        rts_for_sample_order.value = parseInt(days) || 1;
    };

    const setBuySampleChecked = (checked) => {
        buySampleChecked.value = !!checked;
    };

    const setBlankProductChecked = (checked) => {
        blankProductChecked.value = !!checked;
    };

    const setAccessoriesPrice = (price) => {
        accessoriesPrice.value = parseFloat(price) || 0;
    };
    const setSelectedAccessoriesNames = (names) => {
        selectedAccessoriesNames.value = Array.isArray(names) ? names : [];
    };

    const applyMappedProductData = (mappedData) => {
        if (!mappedData) {
            return;
        }

        if (mappedData.product) {
            setProductData(mappedData.product);
        }

        if (mappedData.moqSettings && Object.keys(mappedData.moqSettings).length > 0) {
            setMoqSettings(mappedData.moqSettings);
        }

        if (mappedData.quantityDiscounts) {
            setQuantityDiscounts(mappedData.quantityDiscounts);
        }

        if (mappedData.quantityDiscountEnabled !== undefined) {
            setQuantityDiscountEnabled(mappedData.quantityDiscountEnabled);
        }

        if (mappedData.colorSampleService !== undefined) {
            setColorSampleService(mappedData.colorSampleService);
        }

        if (mappedData.rtsDate !== undefined) {
            setRtsDate(mappedData.rtsDate);
        }

        if (mappedData.shippingInfo) {
            if (mappedData.shippingInfo.rts_date_starts_from !== undefined) {
                setRtsDateStartsFrom(mappedData.shippingInfo.rts_date_starts_from);
            }

            if (mappedData.shippingInfo.rts_for_bulk_order !== undefined) {
                setRtsForBulkOrder(mappedData.shippingInfo.rts_for_bulk_order);
            }

            if (mappedData.shippingInfo.rts_for_sample_order !== undefined) {
                setRtsForSampleOrder(mappedData.shippingInfo.rts_for_sample_order);
            }
        }

        if (mappedData.buySampleChecked !== undefined) {
            setBuySampleChecked(mappedData.buySampleChecked);
        }

        if (mappedData.blankProductChecked !== undefined) {
            setBlankProductChecked(mappedData.blankProductChecked);
        } else if (mappedData.blankItem !== undefined) {
            setBlankProductChecked(mappedData.blankItem);
        }

        if (Array.isArray(mappedData.accessories) && productData.value) {
            productData.value.accessories = mappedData.accessories;
        }

        if (Array.isArray(mappedData.variants)) {
            setVariants(mappedData.variants);
        }

        if (mappedData.enableCustomColor !== undefined) {
            setEnableCustomColor(mappedData.enableCustomColor);
        }

        if (mappedData.enableGradientColor !== undefined) {
            setEnableGradientColor(mappedData.enableGradientColor);
        }
    };

    // 处理产品数据的核心逻辑
    const processProductData = (apiData) => {
        const mapper = window.ProductResponseMapper;
        const mappedData = mapper && typeof mapper.mapProductResponse === 'function'
            ? mapper.mapProductResponse(apiData)
            : null;

        applyMappedProductData(mappedData);
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
                // 优先使用直接注入的缓存数据，避免API调用延迟
                if (window.pwProductData) {
                    const apiData = window.pwProductData;
                    
                    // 处理数据并更新状态
                    processProductData(apiData);
                    
                    // 标记数据已获取
                    isDataFetched.value = true;
                    return productData.value;
                }

                // 如果没有缓存数据，回退到API调用
                if (typeof window.productDataAPI === 'undefined') {
                    throw new Error('ProductDataAPI not loaded');
                }

                const responsePayload = await window.productDataAPI.fetchCurrentProductData();
                const apiData = responsePayload && responsePayload.data ? responsePayload.data : responsePayload;

                // 处理数据并更新状态
                processProductData(apiData);
                handleProductUpdatedMeta(responsePayload && responsePayload.meta ? responsePayload.meta : null);

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

    const addToCart = async (customQuantity = null) => {
        if (!canAddToCart.value) return;

        setLoading(true);
        try {
            // 使用传入的数量参数，如果没有则使用 store 中的数量
            const finalQuantity = customQuantity !== null ? customQuantity : quantity.value;
            await window.ProductCartSubmitService.checkCartBlankState(blankProductChecked.value);

            const canvasPayload = await window.ProductCanvasPayloadBuilder.buildCanvasPayload();
            const variant = selectedVariant.value || (Array.isArray(variants.value) && variants.value.length > 0 ? variants.value[0] : null);
            const colorInfo = variant ? {
                color_name: (variant.isCustom ? 'Custom Color' : (variant.variant_name || variant.name || '')),
                color_value: variant.variant_color || variant.color || '',
                variant_id: variant.id || ''
            } : {
                color_name: '',
                color_value: '',
                variant_id: ''
            };

            const formData = window.ProductCartSubmitService.buildAddToCartFormData({
                productId: productId.value,
                quantity: finalQuantity,
                variant,
                colorInfo,
                minQuantity: minQuantity.value,
                stepQuantity: stepQuantity.value,
                sellInBatch: !!moqSettings.value.sell_in_batch,
                isSample: buySampleChecked.value,
                isBlank: blankProductChecked.value,
                discountEnabled: quantityDiscountEnabled.value,
                currentDiscount: currentDiscount.value,
                discountText: discountText.value,
                quantityDiscounts: quantityDiscounts.value,
                selectedAccessoriesNames: selectedAccessoriesNames.value
            }, canvasPayload);

            await window.ProductCartSubmitService.submitAddToCart(formData);
            window.ProductCartSubmitService.notifyAddToCartSuccess(finalQuantity);
            
        } catch (err) {
            setError(err.message);
            window.ProductCartSubmitService.notifyAddToCartError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return proxyRefs({
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
        quantityDiscountEnabled,
        colorSampleService,
        rts_date,
        rts_date_starts_from,
        rts_for_bulk_order,
        rts_for_sample_order,
        buySampleChecked,
        blankProductChecked,
        gradientColorApplied,
        enableCustomColor,
        enableGradientColor,
        accessoriesPrice,
        selectedAccessoriesNames,
        moqSettings,
        minQuantity,
        maxQuantity,
        stepQuantity,
        quantityDiscounts,
        // Getters
        isLoading,
        hasError,
        totalPrice,
        canAddToCart,
        hasVariants,
        selectedVariantPrice,
        baseUnitPrice,
        correctedQuantity,
        isValidQuantity,
        hasQuantityDiscounts,
        currentDiscount,
        getCurrentDiscount,
        discountText,
        getDiscountText,
        discountedPrice,
        estimatedShipDate,
        estimatedDeliveryDate,
        shouldShowDeliveryDate,
        shouldShowAddToCart,
        showAddToCartButton,
        shouldShowCustomize,
        showCustomizeButton,
        showBuySampleCheckbox,
        showBlankProductCheckbox,
        showGradientButton,
        showCustomColorButton,

        // Actions
        setProductId,
        setProductData,
        setLoading,
        setError,
        setGradientColorApplied,
        setEnableCustomColor,
        setEnableGradientColor,
        resetCustomColorState,
        updateQuantity,
        setQuantityDirect,
        getNextValidQuantity,
        getPreviousValidQuantity,
        setSelectedOption,
        toggleDetails,
        setActiveTab,
        resetSelectedVariant,
        setSelectedVariant,
        setVariants,
        setQuantityDiscountEnabled,
        setColorSampleService,
        setRtsDate,
        setRtsDateStartsFrom,
        setRtsForBulkOrder,
        setRtsForSampleOrder,
        setBuySampleChecked,
        setBlankProductChecked,
        setAccessoriesPrice,
        setSelectedAccessoriesNames,
        setMoqSettings,
        setQuantityDiscounts,
        fetchProductData,
        addToCart
    });
    };

    let storeInstance = null;
    const useProductStore = () => {
        if (!storeInstance) {
            storeInstance = createProductStore();
        }
        return storeInstance;
    };

    window.useProductStore = useProductStore;
})();
