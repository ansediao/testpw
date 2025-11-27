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
    const currentDiscount = Vue.ref(0);

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

    const getCurrentDiscount = Vue.computed(() => {
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

    const getDiscountText = Vue.computed(() => {
        if (!quantityDiscountEnabled.value || buySampleChecked.value) return '';

        const discount = getCurrentDiscount.value;
        if (discount === 0) return '';

        const percentage = Math.round((1 - discount) * 100);
        return `${percentage}% OFF`;
    });

    const discountedPrice = Vue.computed(() => {
        if (!quantityDiscountEnabled.value || buySampleChecked.value) {
            return baseUnitPrice.value;
        }

        const discount = getCurrentDiscount.value;
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
    const showAddToCartButton = Vue.computed(() => {
        // 当渐变颜色被应用时隐藏按钮
        // 当勾选Blank Product时显示，未勾选时隐藏
        return productData.value && !loading.value && !gradientColorApplied.value && blankProductChecked.value;
    });

    const showCustomizeButton = Vue.computed(() => {
        // 当勾选Blank Product时隐藏，未勾选时显示
        return productData.value && !loading.value && !blankProductChecked.value;
    });

    // Checkbox visibility getters
    const showBuySampleCheckbox = Vue.computed(() => {
        // 默认显示，可以根据业务逻辑调整
        return productData.value && !loading.value;
    });

    const showBlankProductCheckbox = Vue.computed(() => {
        // 当渐变颜色被应用时隐藏复选框
        return productData.value && !loading.value && !gradientColorApplied.value;
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

    const setGradientColorApplied = (applied) => {
        gradientColorApplied.value = applied;
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

    // 处理产品数据的核心逻辑
    const processProductData = (apiData) => {
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

            // 处理数量折扣启用状态
            if (productApiData.quantityDiscountEnabled !== undefined) {
                setQuantityDiscountEnabled(productApiData.quantityDiscountEnabled);
            }

            // 处理颜色样品服务状态
            if (productApiData.colorSampleService !== undefined) {
                setColorSampleService(productApiData.colorSampleService);
            }

            // 处理 RTS Date 显示状态
            if (productApiData.rts_date !== undefined) {
                setRtsDate(productApiData.rts_date);
            }

            // 处理发货时间相关数据 - 从 shipping_info 中获取
            if (productApiData.shipping_info) {
                const shippingInfo = productApiData.shipping_info;

                if (shippingInfo.rts_date_starts_from !== undefined) {
                    setRtsDateStartsFrom(shippingInfo.rts_date_starts_from);
                }

                if (shippingInfo.rts_for_bulk_order !== undefined) {
                    setRtsForBulkOrder(shippingInfo.rts_for_bulk_order);
                }

                if (shippingInfo.rts_for_sample_order !== undefined) {
                    setRtsForSampleOrder(shippingInfo.rts_for_sample_order);
                }
            }

            // 处理复选框状态
            if (productApiData.buySampleChecked !== undefined) {
                setBuySampleChecked(productApiData.buySampleChecked);
            }
            if (productApiData.blankProductChecked !== undefined) {
                setBlankProductChecked(productApiData.blankProductChecked);
            }

            // 处理配件数据
            if (productApiData.accessories && Array.isArray(productApiData.accessories)) {
                // 将配件数据存储到产品数据中
                if (productData.value) {
                    productData.value.accessories = productApiData.accessories.map(accessory => ({
                        id: accessory.id,
                        testname: accessory.testname || accessory.name || 'Unknown Accessory',
                        product_image: accessory.product_image || accessory.image || '',
                        price: parseFloat(accessory.price) || 0
                    }));
                }
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

                const apiData = await window.productDataAPI.fetchCurrentProductData();

                // 处理数据并更新状态
                processProductData(apiData);

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
            const precheckForm = new FormData();
            precheckForm.append('action', 'pw_cart_blank_state');
            precheckForm.append('security', window.pwAjax?.nonce || '');
            const precheckResp = await fetch(window.pwAjax?.ajaxurl || '/wp-admin/admin-ajax.php', { method: 'POST', body: precheckForm });
            const precheckResult = await precheckResp.json();
            if (precheckResult && precheckResult.success && precheckResult.data) {
                const state = precheckResult.data;
                if (blankProductChecked.value) {
                    if (state.non_blank_count > 0) {
                        throw new Error('购物车中有定制产品，不可以加入购物车');
                    }
                } else {
                    if (state.blank_count > 0) {
                        throw new Error('购物车中已存在空白件商品，无法加入');
                    }
                }
            }
            
            // 准备 WordPress AJAX 请求数据
            const formData = new FormData();
            formData.append('action', 'add_customized_product_to_cart');
            formData.append('product_id', productId.value);
            formData.append('quantity', finalQuantity);
            // 触发与 #renderBtn 相同的渲染逻辑，捕获当前各视图图片
            let firstImageDataUrl = '';
            try {
                // 1) 清除所有视图的选中状态，确保渲染干净
                if (window.CanvasManager && typeof window.CanvasManager.getAllCanvasIds === 'function') {
                    const allCanvasIds = window.CanvasManager.getAllCanvasIds();
                    allCanvasIds.forEach(viewId => {
                        const fc = window.CanvasManager.getCanvas(viewId);
                        if (fc) {
                            try {
                                const active = typeof fc.getActiveObject === 'function' ? fc.getActiveObject() : null;
                                if (active && active.isEditing && typeof active.exitEditing === 'function') {
                                    active.exitEditing();
                                }
                                if (typeof fc.discardActiveObject === 'function') {
                                    fc.discardActiveObject();
                                }
                                fc.renderAll();
                        } catch (e) {
                            }
                        }
                    });
                }

                // 2) 通过多视图渲染函数生成图片数据
                const canvasStore = (typeof window.useCanvasStore === 'function') ? window.useCanvasStore() : null;
                const views = canvasStore && Array.isArray(canvasStore.views) ? canvasStore.views : [];
                let viewImagesPayload = [];

                if (views.length > 0 && typeof window.generateUniversalViewImages === 'function') {
                    const images = await window.generateUniversalViewImages(views);
                    // 组装带视图名的 JSON 结构
                    viewImagesPayload = images.map((imgData, idx) => {
                        const v = views[idx] || {};
                        // 4-Grid Flow 视图返回数组，其它返回单张
                        const imageArray = Array.isArray(imgData) ? imgData : [imgData];
                        return {
                            id: v.id || v.view_id || `view-${idx+1}`,
                            name: v.name || v.view_name || `视图 ${idx+1}`,
                            images: imageArray
                        };
                    });
                } else {
                    // 单视图模式：尝试使用捕获函数
                    if (typeof window.captureCanvas === 'function') {
                        const single = await window.captureCanvas();
                        viewImagesPayload = [{ id: 'single', name: '视图', images: [single] }];
                    }
                }

                // 取第一张作为 custom_image（用于兼容现有展示）
                if (viewImagesPayload.length > 0 && Array.isArray(viewImagesPayload[0].images) && viewImagesPayload[0].images.length > 0) {
                    firstImageDataUrl = viewImagesPayload[0].images[0];
                }

                // 写入多视图 JSON
                try {
                    formData.append('pw_view_images', JSON.stringify(viewImagesPayload));
                } catch (e) {
                }
            } catch (e) {
            }

            // 兼容旧逻辑：custom_image 使用第一张图片，如果不可用则给占位
            formData.append('custom_image', firstImageDataUrl || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
            // 传递完整的颜色信息
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
            
            formData.append('color_name', colorInfo.color_name);
            formData.append('color_value', colorInfo.color_value);
            formData.append('variant_id', colorInfo.variant_id || '');
            formData.append('color', colorInfo.color_value); // 保持向后兼容
            if (variant && variant.isCustom && colorInfo.color_value) {
                formData.append('custom_color', colorInfo.color_value);
            }
            formData.append('security', window.pwAjax?.nonce || '');

            // 追加业务相关字段到 POST（起订量、批数量、样品/空白、折扣阶梯）
            // 起订量与批数量
            formData.append('pw_min_order_quantity', String(minQuantity.value));
            formData.append('pw_batch_quantity', String(stepQuantity.value));
            formData.append('pw_sell_in_batch', moqSettings.value.sell_in_batch ? '1' : '0');

            // 是否样品、是否空白件
            formData.append('pw_is_sample', buySampleChecked.value ? '1' : '0');
            formData.append('pw_is_blank', blankProductChecked.value ? '1' : '0');

            // 折扣阶梯信息
            formData.append('pw_discount_enabled', quantityDiscountEnabled.value ? '1' : '0');
            formData.append('pw_current_discount', String(getCurrentDiscount.value || 0));
            formData.append('pw_discount_text', getDiscountText.value || '');
            try {
                formData.append('pw_quantity_discounts', JSON.stringify(quantityDiscounts.value || []));
            } catch (e) {
                // JSON stringify 失败时传空数组字符串，避免后端报错
                formData.append('pw_quantity_discounts', '[]');
            }

            if (blankProductChecked.value && selectedAccessoriesNames.value && selectedAccessoriesNames.value.length > 0) {
                try {
                    formData.append('pw_accessories_names', JSON.stringify(selectedAccessoriesNames.value));
                } catch (e) {
                    formData.append('pw_accessories_names', selectedAccessoriesNames.value.join(','));
                }
            }

            try {
                if (typeof window.useDesignUsageStore === 'function') {
                    const ds = window.pinia ? window.useDesignUsageStore(window.pinia) : window.useDesignUsageStore();
                    const list = ds.list || [];
                    const payload = Array.isArray(list) ? list.map(it => ({ name: String(it.name || ''), image: String(it.image || ''), quantity: Number(it.quantity || 0) })) : [];
                    formData.append('pw_design_fee_total', String(Number(ds.totalFee || 0)));
                    formData.append('pw_designs', JSON.stringify(payload));
                }
            } catch (e) {}

             // 发送到 WordPress AJAX 端点
             const response = await fetch(window.pwAjax?.ajaxurl || '/wp-admin/admin-ajax.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.data || '添加到购物车失败');
            }
            
            // 成功添加到购物车
            
            // 显示成功提示
            showSuccessMessage(`已成功添加 ${finalQuantity} 件商品到购物车！`);
            
            // 可选：触发页面刷新购物车数量显示
            if (typeof jQuery !== 'undefined' && jQuery(document.body).trigger) {
                jQuery(document.body).trigger('added_to_cart');
            }
            
        } catch (err) {
            setError(err.message);
            // 显示错误提示
            if (typeof showErrorMessage === 'function') {
                showErrorMessage(err.message || '添加到购物车时发生错误');
            }
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
        quantityDiscountEnabled,
        colorSampleService,
        rts_date,
        rts_date_starts_from,
        rts_for_bulk_order,
        rts_for_sample_order,
        buySampleChecked,
        blankProductChecked,
        gradientColorApplied,
        accessoriesPrice,
        selectedAccessoriesNames,
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
        baseUnitPrice,
        correctedQuantity,
        isValidQuantity,
        hasQuantityDiscounts,
        getCurrentDiscount,
        getDiscountText,
        discountedPrice,
        estimatedShipDate,
        showAddToCartButton,
        showCustomizeButton,
        showBuySampleCheckbox,
        showBlankProductCheckbox,

        // Actions
        setProductId,
        setProductData,
        setLoading,
        setError,
        setGradientColorApplied,
        updateQuantity,
        setQuantityDirect,
        getNextValidQuantity,
        getPreviousValidQuantity,
        setSelectedOption,
        toggleDetails,
        setActiveTab,
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
    };
});

// Export for module usage
window.useProductStore = useProductStore;