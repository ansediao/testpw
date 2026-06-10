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

    const pwcaCreateProductStore = () => {
    // ===== State (按领域分组) =====
    // 核心数据
    const productId = Vue.ref('');
    const productData = Vue.ref(null);
    const loading = Vue.ref(false);
    const error = Vue.ref(null);
    const isDataFetched = Vue.ref(false);
    const fetchPromise = Vue.ref(null);

    // 变体选择
    const variant = Vue.reactive({
        selected: null,
        list: [],
        options: {},
    });

    // 数量相关
    const quantity = Vue.reactive({
        current: 1,
        max: 9999,
        step: 1,
    });

    // 功能开关
    const features = Vue.reactive({
        quantityDiscount: true,
        colorSample: true,
        customColor: true,
        gradientColor: true,
    });

    // RTS (Ready to Ship) 相关
    const rts = Vue.reactive({
        enabled: true,
        startsFrom: 3,
        bulkOrder: 2,
        sampleOrder: 1,
    });

    // UI 状态
    const ui = Vue.reactive({
        buySampleChecked: false,
        blankProductChecked: false,
        gradientColorApplied: false,
        showDetails: false,
        activeTab: 'description',
    });

    // MOQ 设置
    const moq = Vue.reactive({
        settings: { minimum_order_quantity: 1, batch_quantity: 1, sell_in_batch: false },
        discounts: [],
    });

    // minQuantity 为 computed，根据 buySampleChecked 和 moqSettings 自动派生
    const minQuantity = Vue.computed(() => {
        return ui.buySampleChecked ? 1 : (moq.settings.minimum_order_quantity || 1);
    });

    // 配件
    const accessories = Vue.reactive({
        price: 0,
        selectedNames: [],
    });

    // Getters (computed)
    const hasError = Vue.computed(() => error.value !== null);
    const totalPrice = Vue.computed(() => {
        return discountedPrice.value * quantity.current;
    });
    const canAddToCart = Vue.computed(() => {
        return productData.value && quantity.current >= minQuantity.value && !loading.value;
    });
    const hasVariants = Vue.computed(() => variant.list.length > 0);
    const selectedVariantPrice = Vue.computed(() => {
        if (variant.selected && variant.selected.anchor_price) {
            return parseFloat(variant.selected.anchor_price);
        }
        return variant.selected ? parseFloat(variant.selected.price) : 0;
    });

    // Base unit price including accessories
    const baseUnitPrice = Vue.computed(() => {
        const productPrice = selectedVariantPrice.value || (productData.value ? productData.value.price : 0);
        return productPrice + accessories.price;
    });

    // MOQ related computed properties
    const correctedQuantity = Vue.computed(() => {
        return (inputQuantity) => {
            const minQty = minQuantity.value;
            const batchQty = quantity.step;
            const sellInBatch = moq.settings.sell_in_batch;

            if (inputQuantity < minQty) {
                return minQty;
            }

            if (ui.buySampleChecked) {
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
        return quantity.current >= minQuantity.value && quantity.current <= quantity.max;
    });

    // Quantity Discount computed properties
    const shouldApplyDiscount = Vue.computed(() => features.quantityDiscount && !ui.buySampleChecked);

    const hasQuantityDiscounts = Vue.computed(() => {
        return shouldApplyDiscount.value && moq.discounts.length > 0;
    });

    const currentDiscount = Vue.computed(() => {
        if (!shouldApplyDiscount.value || !hasQuantityDiscounts.value) return 0;

        let applicableDiscount = 0;
        // 找到适用的最高折扣梯度（数量大于等于range_from的最大梯度）
        for (const discount of moq.discounts) {
            if (quantity.current >= discount.range_from) {
                applicableDiscount = discount.discount;
                // 继续查找更高的梯度，因为数组已按range_from排序
            }
        }
        return applicableDiscount;
    });

    const discountText = Vue.computed(() => {
        if (!shouldApplyDiscount.value) return '';

        const discount = currentDiscount.value;
        if (discount === 0) return '';

        const percentage = Math.round((1 - discount) * 100);
        return `${percentage}% OFF`;
    });

    const discountedPrice = Vue.computed(() => {
        if (!shouldApplyDiscount.value) {
            return baseUnitPrice.value;
        }

        const discount = currentDiscount.value;
        return discount > 0 ? baseUnitPrice.value * discount : baseUnitPrice.value;
    });

    // 计算预计发货日期
    const estimatedShipDate = Vue.computed(() => {
        // 获取当前日期
        const currentDate = new Date();

        // 基础天数：rts.startsFrom
        let totalDays = rts.startsFrom;

        // 根据是否为样品订单选择额外处理时间
        if (ui.buySampleChecked) {
            totalDays += rts.sampleOrder;
        } else {
            totalDays += rts.bulkOrder;
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
        return productData.value && !loading.value && !ui.gradientColorApplied && ui.blankProductChecked;
    });

    const shouldShowCustomize = Vue.computed(() => {
        // 当勾选Blank Product时隐藏，未勾选时显示
        return productData.value && !loading.value && !ui.blankProductChecked;
    });

    // Checkbox visibility getters
    const showBuySampleCheckbox = Vue.computed(() => {
        // 默认显示，可以根据业务逻辑调整
        return productData.value && !loading.value;
    });

    const showBlankProductCheckbox = Vue.computed(() => {
        // 当渐变颜色被应用时隐藏复选框
        return productData.value && !loading.value && !ui.gradientColorApplied;
    });

    // Button visibility getters - based on API feature toggles
    // 预留叠加其他逻辑的空间（如视图配置、店铺设置等）
    const showGradientButton = Vue.computed(() => {
        if (!features.gradientColor) return false;
        // TODO: 后续可叠加其他条件，例如视图配置、店铺定制设置等
        return true;
    });

    const showCustomColorButton = Vue.computed(() => {
        if (!features.customColor) return false;
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
            const rtsDateStartsFrom = rts.startsFrom || 3;
            const processingTime = ui.blankProductChecked
                ? (parseInt(productApiData.rts_for_sample_order) || rts.sampleOrder || 1)
                : (parseInt(productApiData.rts_for_bulk_order) || rts.bulkOrder || 2);

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
        ui.gradientColorApplied = applied;
    };

    const setEnableCustomColor = (enabled) => {
        features.customColor = !!enabled;
    };

    const setEnableGradientColor = (enabled) => {
        features.gradientColor = !!enabled;
    };

    const resetSelectedVariant = () => {
        variant.selected = null;
    };

    const resetCustomColorState = () => {
        resetSelectedVariant();
        setGradientColorApplied(false);
    };

    const updateQuantity = (qty) => {
        // 首先确保数量在有效范围内
        const clampedQty = Math.max(minQuantity.value, Math.min(qty, quantity.max));

        // 然后根据批量销售要求进行修正
        const corrected = correctedQuantity.value(clampedQty);

        quantity.current = corrected;
    };

    // 直接设置数量，不进行批次修正（用于输入框）
    const setQuantityDirect = (qty) => {
        // 只进行基本的范围限制，不进行批次修正
        const clampedQty = Math.max(1, Math.min(qty, quantity.max));
        quantity.current = clampedQty;
    };

    // 获取下一个有效的批次数量（增加方向）
    const getNextValidQuantity = (currentQty) => {
        const minQty = minQuantity.value;
        const batchQty = quantity.step;
        const sellInBatch = moq.settings.sell_in_batch;

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
        const batchQty = quantity.step;
        const sellInBatch = moq.settings.sell_in_batch;

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
            moq.settings = {
                minimum_order_quantity: settings.minimum_order_quantity || 1,
                batch_quantity: settings.batch_quantity || 1,
                sell_in_batch: settings.sell_in_batch || false
            };

            // 更新相关的响应式状态
            // minQuantity 由 computed 自动派生，不再需要手动赋值

            // 根据 sell_in_batch 设置步进值
            if (moq.settings.sell_in_batch === true) {
                quantity.step = moq.settings.batch_quantity;
            } else {
                quantity.step = 1; // 不按批次销售时，步进值为1
            }

            // 如果当前数量小于最小数量，自动调整
            if (quantity.current < minQuantity.value) {
                quantity.current = minQuantity.value;
            }

            // 如果按批次销售，确保当前数量符合批次要求
            if (moq.settings.sell_in_batch === true) {
                const corrected = correctedQuantity.value(quantity.current);
                if (corrected !== quantity.current) {
                    quantity.current = corrected;
                }
            }
        }
    };

    const setQuantityDiscounts = (discounts) => {
        if (!Array.isArray(discounts)) {
            return;
        }

        moq.discounts = discounts.map(discount => ({
            type: discount.type || 'MOQ',
            range_from: parseInt(discount.range_from) || 0,
            range_to: parseInt(discount.range_to) || 0,
            discount: parseFloat(discount.discount) || 1,
            extra_processing_time: parseInt(discount.extra_processing_time) || 0
        })).sort((a, b) => a.range_from - b.range_from); // 按数量排序
    };

    const setSelectedOption = (key, value) => {
        variant.options[key] = value;
    };

    const toggleDetails = () => {
        ui.showDetails = !ui.showDetails;
    };

    const setActiveTab = (tab) => {
        ui.activeTab = tab;
    };

    const setSelectedVariant = (variantData) => {
        variant.selected = variantData;
    };

    const setVariants = (vars) => {
        variant.list = vars;
    };

    const setQuantityDiscountEnabled = (enabled) => {
        features.quantityDiscount = !!enabled;
    };

    const setColorSampleService = (enabled) => {
        features.colorSample = !!enabled;
    };

    const setRtsDate = (enabled) => {
        rts.enabled = !!enabled;
    };

    const setRtsDateStartsFrom = (days) => {
        rts.startsFrom = parseInt(days) || 3;
    };

    const setRtsForBulkOrder = (days) => {
        rts.bulkOrder = parseInt(days) || 2;
    };

    const setRtsForSampleOrder = (days) => {
        rts.sampleOrder = parseInt(days) || 1;
    };

    const setBuySampleChecked = (checked) => {
        ui.buySampleChecked = !!checked;
    };

    const setBlankProductChecked = (checked) => {
        ui.blankProductChecked = !!checked;
    };

    const setAccessoriesPrice = (price) => {
        accessories.price = parseFloat(price) || 0;
    };
    const setSelectedAccessoriesNames = (names) => {
        accessories.selectedNames = Array.isArray(names) ? names : [];
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
        const mapper = window.pwcaProductResponseMapper;
        const mappedData = mapper && typeof mapper.mapProductResponse === 'function'
            ? mapper.mapProductResponse(apiData)
            : null;

        applyMappedProductData(mappedData);
    };

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
                if (window.pwcaProductData) {
                    const apiData = window.pwcaProductData;
                    
                    // 处理数据并更新状态
                    processProductData(apiData);
                    
                    // 标记数据已获取
                    isDataFetched.value = true;
                    return productData.value;
                }

                // 如果没有缓存数据，回退到API调用
                if (typeof window.pwcaProductDataAPI === 'undefined') {
                    throw new Error('ProductDataAPI not loaded');
                }

                const responsePayload = await window.pwcaProductDataAPI.fetchCurrentProductData();
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
            const finalQuantity = customQuantity !== null ? customQuantity : quantity.current;
            await window.pwcaProductCartSubmitService.checkCartBlankState(ui.blankProductChecked);

            const canvasPayload = await window.pwcaProductCanvasPayloadBuilder.buildCanvasPayload();
            const selectedVariantData = variant.selected || (Array.isArray(variant.list) && variant.list.length > 0 ? variant.list[0] : null);
            const colorInfo = selectedVariantData ? {
                color_name: (selectedVariantData.isCustom ? 'Custom Color' : (selectedVariantData.variant_name || selectedVariantData.name || '')),
                color_value: selectedVariantData.variant_color || selectedVariantData.color || '',
                variant_id: selectedVariantData.id || ''
            } : {
                color_name: '',
                color_value: '',
                variant_id: ''
            };

            const formData = window.pwcaProductCartSubmitService.buildAddToCartFormData({
                productId: productId.value,
                quantity: finalQuantity,
                variant: selectedVariantData,
                colorInfo,
                minQuantity: minQuantity.value,
                stepQuantity: quantity.step,
                sellInBatch: !!moq.settings.sell_in_batch,
                isSample: ui.buySampleChecked,
                isBlank: ui.blankProductChecked,
                discountEnabled: features.quantityDiscount,
                currentDiscount: currentDiscount.value,
                discountText: discountText.value,
                quantityDiscounts: moq.discounts,
                selectedAccessoriesNames: accessories.selectedNames
            }, canvasPayload);

            await window.pwcaProductCartSubmitService.submitAddToCart(formData);
            window.pwcaProductCartSubmitService.notifyAddToCartSuccess(finalQuantity);
            
        } catch (err) {
            setError(err.message);
            window.pwcaProductCartSubmitService.notifyAddToCartError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return proxyRefs({
        // ===== State (按领域分组) =====
        productId,
        productData,
        loading,
        error,
        isDataFetched,
        // 变体选择
        variant,        // { selected, list, options }
        // 数量相关
        quantity,       // { current, max, step }
        minQuantity,    // computed
        // 功能开关
        features,       // { quantityDiscount, colorSample, customColor, gradientColor }
        // RTS
        rts,            // { enabled, startsFrom, bulkOrder, sampleOrder }
        // UI 状态
        ui,             // { buySampleChecked, blankProductChecked, gradientColorApplied, showDetails, activeTab }
        // MOQ
        moq,            // { settings, discounts }
        // 配件
        accessories,    // { price, selectedNames }

        // ===== Getters =====
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
        discountText,
        discountedPrice,
        estimatedShipDate,
        estimatedDeliveryDate,
        shouldShowDeliveryDate,
        shouldShowAddToCart,
        shouldShowCustomize,
        showBuySampleCheckbox,
        showBlankProductCheckbox,
        showGradientButton,
        showCustomColorButton,

        // ===== Actions =====
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
            storeInstance = pwcaCreateProductStore();
        }
        return storeInstance;
    };

    window.pwcaUseProductStore = useProductStore;
})();
