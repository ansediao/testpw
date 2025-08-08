# PWCanvas 页面数据流架构说明

## 概述

PWCanvas 页面采用现代化的 Vue 3 + Pinia 架构，通过统一的 API 聚合端点获取后台数据，并使用 Pinia 进行状态管理。本文档详细说明了数据获取、存储和使用的完整流程。

## 数据获取流程

### 1. 页面初始化

当用户访问 `/pwcanvas/` 页面时，系统会执行以下初始化流程：

```javascript
// public/js/main.js - 应用入口
document.addEventListener('pwCdnLoaded', function(event) {
    const { vue: Vue, pinia, axios } = event.detail;
    
    // 创建 Vue 应用实例
    const app = Vue.createApp({
        setup() {
            const store = useProductStore();
            
            // 页面加载时自动获取产品数据
            Vue.onMounted(async () => {
                const productId = getProductIdFromUrl();
                if (productId) {
                    await store.fetchProductData(productId);
                }
            });
            
            return { store };
        }
    });
    
    // 使用 Pinia
    app.use(pinia);
    app.mount('#vue-dynamic-product-area');
});
```

### 2. 产品ID获取

系统通过多种方式获取当前产品ID：

```javascript
// 从URL参数获取产品ID
function getProductIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product_id');
    
    // 也可以从全局配置获取
    if (!productId && window.pwProductConfig) {
        return window.pwProductConfig.productId;
    }
    
    return productId;
}
```

### 3. API聚合端点调用

通过统一的API聚合端点获取所有相关数据：

```javascript
// public/js/product/api/productDataAPI.js
const productDataAPI = {
    // 获取聚合产品数据
    async fetchCurrentProductData(productId) {
        try {
            const response = await axios.get(
                `/wp-json/pw/v1/product-data/${productId}`,
                {
                    timeout: 30000,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            return response.data;
        } catch (error) {
            console.error('获取产品数据失败:', error);
            throw new Error(`API调用失败: ${error.message}`);
        }
    },
    
    // 批量获取多个产品数据
    async fetchBatchProductData(productIds) {
        const promises = productIds.map(id => 
            this.fetchCurrentProductData(id)
        );
        
        try {
            const results = await Promise.allSettled(promises);
            return results.map((result, index) => ({
                productId: productIds[index],
                success: result.status === 'fulfilled',
                data: result.status === 'fulfilled' ? result.value : null,
                error: result.status === 'rejected' ? result.reason : null
            }));
        } catch (error) {
            console.error('批量获取产品数据失败:', error);
            throw error;
        }
    }
};

// 全局暴露API
window.productDataAPI = productDataAPI;
```

## Pinia 状态管理

### 1. Store 定义

```javascript
// public/js/product/stores/productStore.js
const useProductStore = Pinia.defineStore('product', () => {
    // 基础状态
    const productData = Vue.ref(null);
    const loading = Vue.ref(false);
    const error = Vue.ref(null);
    const isDataFetched = Vue.ref(false);
    const fetchPromise = Vue.ref(null);
    
    // 产品基础信息
    const productId = Vue.ref(null);
    const productName = Vue.ref('');
    const basePrice = Vue.ref(0);
    const stockStatus = Vue.ref('instock');
    
    // 产品变体和选项
    const variants = Vue.ref([]);
    const selectedVariant = Vue.ref(null);
    const availableColors = Vue.ref([]);
    const selectedColor = Vue.ref(null);
    
    // 定制选项
    const quantity = Vue.ref(1);
    const selectedAccessories = Vue.ref([]);
    const customizationOptions = Vue.ref({});
    
    // 计算属性
    const isCustomizable = Vue.computed(() => {
        return productData.value?.computed?.is_customizable || false;
    });
    
    const hasColorVariants = Vue.computed(() => {
        return productData.value?.computed?.has_color_variants || false;
    });
    
    const totalPrice = Vue.computed(() => {
        if (!productData.value) return 0;
        
        let total = basePrice.value * quantity.value;
        
        // 添加配件价格
        const accessoriesTotal = selectedAccessories.value.reduce(
            (sum, accessory) => sum + parseFloat(accessory.price || 0), 0
        );
        
        // 应用数量折扣
        const discountRate = getDiscountForQuantity(quantity.value);
        total = total * (1 - discountRate);
        
        return total + accessoriesTotal;
    });
    
    // 获取产品数据的主要方法
    const fetchProductData = async (id) => {
        // 防重复调用机制
        if (isDataFetched.value && productData.value && productId.value === id) {
            return productData.value;
        }
        
        // 防并发调用
        if (fetchPromise.value) {
            return fetchPromise.value;
        }
        
        fetchPromise.value = (async () => {
            loading.value = true;
            error.value = null;
            
            try {
                const apiData = await window.productDataAPI.fetchCurrentProductData(id);
                
                // 存储原始数据
                productData.value = apiData;
                productId.value = id;
                
                // 解析并存储具体数据
                parseProductData(apiData);
                
                isDataFetched.value = true;
                
                console.log('产品数据获取成功:', apiData);
                return apiData;
                
            } catch (err) {
                error.value = err.message;
                console.error('获取产品数据失败:', err);
                throw err;
            } finally {
                loading.value = false;
                fetchPromise.value = null;
            }
        })();
        
        return fetchPromise.value;
    };
    
    // 解析API数据到具体状态
    const parseProductData = (apiData) => {
        if (!apiData) return;
        
        // 解析WooCommerce数据
        if (apiData.woocommerce) {
            productName.value = apiData.woocommerce.name || '';
            basePrice.value = parseFloat(apiData.woocommerce.price) || 0;
            stockStatus.value = apiData.woocommerce.stock_status || 'instock';
        }
        
        // 解析变体数据
        if (apiData.variants && apiData.variants.data) {
            variants.value = apiData.variants.data;
            
            // 提取颜色选项
            if (apiData.computed && apiData.computed.available_colors) {
                availableColors.value = apiData.computed.available_colors;
                
                // 设置默认选中颜色
                if (availableColors.value.length > 0 && !selectedColor.value) {
                    selectedColor.value = availableColors.value[0];
                }
            }
        }
        
        // 解析模板数据
        if (apiData.templates && apiData.templates.data) {
            // 处理产品模板信息
            const templates = apiData.templates.data;
            // 存储模板相关配置
        }
        
        // 解析Mock增强数据
        if (apiData.mock_data && apiData.computed.mock_features) {
            const mockFeatures = apiData.computed.mock_features;
            
            // 处理推荐配件
            if (mockFeatures.recommendations) {
                // 设置推荐配件
            }
            
            // 处理特殊设置
            if (mockFeatures.settings) {
                // 应用特殊配置
            }
        }
    };
    
    // 数量折扣计算
    const getDiscountForQuantity = (qty) => {
        if (!productData.value?.mock_data?.data?.quantity_discounts) {
            // 默认折扣梯度
            if (qty >= 100) return 0.15;
            if (qty >= 50) return 0.10;
            if (qty >= 25) return 0.05;
            return 0;
        }
        
        // 使用API返回的折扣数据
        const discounts = productData.value.mock_data.data.quantity_discounts;
        for (const discount of discounts) {
            if (qty >= discount.min_quantity) {
                return discount.discount_rate;
            }
        }
        return 0;
    };
    
    // 更新选中变体
    const updateSelectedVariant = (variant) => {
        selectedVariant.value = variant;
        
        // 更新相关状态
        if (variant.color) {
            selectedColor.value = variant.color;
        }
        
        if (variant.price) {
            basePrice.value = parseFloat(variant.price);
        }
    };
    
    // 添加配件
    const addAccessory = (accessory) => {
        const exists = selectedAccessories.value.find(
            item => item.id === accessory.id
        );
        
        if (!exists) {
            selectedAccessories.value.push(accessory);
        }
    };
    
    // 移除配件
    const removeAccessory = (accessoryId) => {
        selectedAccessories.value = selectedAccessories.value.filter(
            item => item.id !== accessoryId
        );
    };
    
    // 重置状态
    const resetState = () => {
        productData.value = null;
        loading.value = false;
        error.value = null;
        isDataFetched.value = false;
        fetchPromise.value = null;
        
        productId.value = null;
        productName.value = '';
        basePrice.value = 0;
        stockStatus.value = 'instock';
        
        variants.value = [];
        selectedVariant.value = null;
        availableColors.value = [];
        selectedColor.value = null;
        
        quantity.value = 1;
        selectedAccessories.value = [];
        customizationOptions.value = {};
    };
    
    return {
        // 状态
        productData,
        loading,
        error,
        isDataFetched,
        
        // 产品信息
        productId,
        productName,
        basePrice,
        stockStatus,
        
        // 变体和选项
        variants,
        selectedVariant,
        availableColors,
        selectedColor,
        
        // 定制选项
        quantity,
        selectedAccessories,
        customizationOptions,
        
        // 计算属性
        isCustomizable,
        hasColorVariants,
        totalPrice,
        
        // 方法
        fetchProductData,
        updateSelectedVariant,
        addAccessory,
        removeAccessory,
        getDiscountForQuantity,
        resetState
    };
});

// 全局暴露Store
window.useProductStore = useProductStore;
```

## 组件中使用数据

### 1. 响应式数据绑定

```javascript
// public/js/product/components/ColorVariants.js
const ColorVariants = {
    name: 'ColorVariants',
    template: `
        <div class="color-variants" v-if="hasColorVariants">
            <h4>选择颜色</h4>
            <div class="color-options">
                <div 
                    v-for="color in availableColors" 
                    :key="color"
                    class="color-option"
                    :class="{ active: selectedColor === color }"
                    @click="selectColor(color)"
                >
                    <div class="color-swatch" :style="{ backgroundColor: color }"></div>
                    <span class="color-name">{{ color }}</span>
                </div>
            </div>
        </div>
    `,
    setup() {
        const { toRefs } = Vue;
        const store = useProductStore();
        
        // 使用 toRefs 保持响应式
        const storeRefs = toRefs(store);
        
        const selectColor = (color) => {
            store.selectedColor = color;
            
            // 查找对应的变体
            const variant = store.variants.find(v => v.color === color);
            if (variant) {
                store.updateSelectedVariant(variant);
            }
        };
        
        return {
            // 响应式数据
            hasColorVariants: storeRefs.hasColorVariants,
            availableColors: storeRefs.availableColors,
            selectedColor: storeRefs.selectedColor,
            
            // 方法
            selectColor
        };
    }
};
```

### 2. 价格信息显示

```javascript
// public/js/product/components/ProductPriceInfo.js
const ProductPriceInfo = {
    name: 'ProductPriceInfo',
    template: `
        <div class="price-info">
            <div class="price-breakdown">
                <div class="base-price">
                    单价: {{ formatPrice(basePrice) }} × {{ quantity }}
                    <span class="subtotal">= {{ formatPrice(basePrice * quantity) }}</span>
                </div>
                
                <div v-if="discountAmount > 0" class="discount">
                    数量折扣: -{{ formatPrice(discountAmount) }}
                    <span class="discount-rate">({{ discountRate }}% OFF)</span>
                </div>
                
                <div v-if="accessoriesTotal > 0" class="accessories">
                    配件费用: +{{ formatPrice(accessoriesTotal) }}
                </div>
                
                <div class="total-price">
                    <strong>总计: {{ formatPrice(totalPrice) }}</strong>
                </div>
            </div>
            
            <div v-if="loading" class="loading">
                正在计算价格...
            </div>
        </div>
    `,
    setup() {
        const { toRefs, computed } = Vue;
        const store = useProductStore();
        const storeRefs = toRefs(store);
        
        // 计算折扣金额
        const discountAmount = computed(() => {
            const subtotal = store.basePrice * store.quantity;
            const rate = store.getDiscountForQuantity(store.quantity);
            return subtotal * rate;
        });
        
        // 计算折扣率
        const discountRate = computed(() => {
            const rate = store.getDiscountForQuantity(store.quantity);
            return Math.round(rate * 100);
        });
        
        // 计算配件总价
        const accessoriesTotal = computed(() => {
            return store.selectedAccessories.reduce(
                (total, accessory) => total + parseFloat(accessory.price || 0), 0
            );
        });
        
        // 格式化价格
        const formatPrice = (price) => {
            return new Intl.NumberFormat('zh-CN', {
                style: 'currency',
                currency: 'CNY'
            }).format(price);
        };
        
        return {
            // 响应式数据
            basePrice: storeRefs.basePrice,
            quantity: storeRefs.quantity,
            totalPrice: storeRefs.totalPrice,
            loading: storeRefs.loading,
            
            // 计算属性
            discountAmount,
            discountRate,
            accessoriesTotal,
            
            // 方法
            formatPrice
        };
    }
};
```

### 3. 数量选择器

```javascript
// public/js/product/components/ProductQuantity.js
const ProductQuantity = {
    name: 'ProductQuantity',
    template: `
        <div class="quantity-selector">
            <label for="quantity">数量:</label>
            <div class="quantity-controls">
                <button 
                    type="button" 
                    @click="decreaseQuantity"
                    :disabled="quantity <= 1"
                    class="qty-btn minus"
                >-</button>
                
                <input 
                    id="quantity"
                    type="number" 
                    v-model.number="quantity"
                    @input="validateQuantity"
                    :min="1"
                    :max="maxQuantity"
                    class="qty-input"
                />
                
                <button 
                    type="button" 
                    @click="increaseQuantity"
                    :disabled="quantity >= maxQuantity"
                    class="qty-btn plus"
                >+</button>
            </div>
            
            <div v-if="discountInfo" class="discount-info">
                {{ discountInfo }}
            </div>
        </div>
    `,
    setup() {
        const { toRefs, computed, watch } = Vue;
        const store = useProductStore();
        const storeRefs = toRefs(store);
        
        const maxQuantity = Vue.ref(999);
        
        // 计算折扣信息
        const discountInfo = computed(() => {
            const currentDiscount = store.getDiscountForQuantity(store.quantity);
            const nextTier = getNextDiscountTier(store.quantity);
            
            if (currentDiscount > 0) {
                return `当前享受 ${Math.round(currentDiscount * 100)}% 折扣`;
            } else if (nextTier) {
                return `购买 ${nextTier.minQty} 件可享受 ${Math.round(nextTier.discount * 100)}% 折扣`;
            }
            
            return null;
        });
        
        // 获取下一个折扣档位
        const getNextDiscountTier = (currentQty) => {
            const tiers = [
                { minQty: 25, discount: 0.05 },
                { minQty: 50, discount: 0.10 },
                { minQty: 100, discount: 0.15 }
            ];
            
            return tiers.find(tier => currentQty < tier.minQty);
        };
        
        const increaseQuantity = () => {
            if (store.quantity < maxQuantity.value) {
                store.quantity++;
            }
        };
        
        const decreaseQuantity = () => {
            if (store.quantity > 1) {
                store.quantity--;
            }
        };
        
        const validateQuantity = (event) => {
            let value = parseInt(event.target.value);
            
            if (isNaN(value) || value < 1) {
                value = 1;
            } else if (value > maxQuantity.value) {
                value = maxQuantity.value;
            }
            
            store.quantity = value;
        };
        
        // 监听数量变化，触发价格重新计算
        watch(() => store.quantity, (newQty, oldQty) => {
            console.log(`数量从 ${oldQty} 变更为 ${newQty}`);
            // 价格会通过计算属性自动更新
        });
        
        return {
            // 响应式数据
            quantity: storeRefs.quantity,
            
            // 计算属性
            discountInfo,
            maxQuantity,
            
            // 方法
            increaseQuantity,
            decreaseQuantity,
            validateQuantity
        };
    }
};
```

## 数据监听和响应

### 1. 组件级数据监听

```javascript
// 在组件中监听数据变化
setup() {
    const { watch, onMounted } = Vue;
    const store = useProductStore();
    
    // 组件挂载时检查数据
    onMounted(() => {
        if (store.isDataFetched && store.productData) {
            updateComponentState();
        }
    });
    
    // 监听数据获取状态
    watch(() => store.isDataFetched, (newValue) => {
        if (newValue && store.productData) {
            updateComponentState();
        }
    });
    
    // 监听具体数据变化
    watch(() => store.productData, (newData) => {
        if (newData && newData.computed) {
            processNewData(newData);
        }
    }, { deep: true });
    
    // 监听选中颜色变化
    watch(() => store.selectedColor, (newColor, oldColor) => {
        console.log(`颜色从 ${oldColor} 变更为 ${newColor}`);
        updateProductImages(newColor);
    });
    
    const updateComponentState = () => {
        // 根据最新数据更新组件状态
    };
    
    const processNewData = (data) => {
        // 处理新的数据
    };
    
    const updateProductImages = (color) => {
        // 更新产品图片
    };
}
```

### 2. 全局数据监听

```javascript
// 在应用级别监听关键数据变化
const app = Vue.createApp({
    setup() {
        const store = useProductStore();
        
        // 监听加载状态
        Vue.watch(() => store.loading, (isLoading) => {
            if (isLoading) {
                showLoadingIndicator();
            } else {
                hideLoadingIndicator();
            }
        });
        
        // 监听错误状态
        Vue.watch(() => store.error, (error) => {
            if (error) {
                showErrorMessage(error);
            }
        });
        
        // 监听产品数据变化
        Vue.watch(() => store.productData, (newData) => {
            if (newData) {
                // 触发全局事件
                document.dispatchEvent(new CustomEvent('productDataLoaded', {
                    detail: newData
                }));
            }
        });
        
        return { store };
    }
});
```

## 错误处理和调试

### 1. 错误处理机制

```javascript
// 在Store中实现完善的错误处理
const fetchProductData = async (id) => {
    try {
        loading.value = true;
        error.value = null;
        
        const apiData = await window.productDataAPI.fetchCurrentProductData(id);
        
        // 验证数据完整性
        if (!apiData || typeof apiData !== 'object') {
            throw new Error('API返回的数据格式无效');
        }
        
        // 检查必要字段
        if (!apiData.has_product_data && !apiData.has_woocommerce_product) {
            throw new Error('未找到有效的产品数据');
        }
        
        productData.value = apiData;
        parseProductData(apiData);
        isDataFetched.value = true;
        
        return apiData;
        
    } catch (err) {
        error.value = err.message;
        
        // 记录详细错误信息
        console.error('获取产品数据失败:', {
            productId: id,
            error: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString()
        });
        
        // 触发错误事件
        document.dispatchEvent(new CustomEvent('productDataError', {
            detail: { productId: id, error: err.message }
        }));
        
        throw err;
    } finally {
        loading.value = false;
        fetchPromise.value = null;
    }
};
```

### 2. 调试工具

```javascript
// 开发环境调试工具
if (window.WP_DEBUG || localStorage.getItem('pw_debug') === 'true') {
    // 暴露Store到全局用于调试
    window.debugProductStore = useProductStore;
    
    // 添加调试方法
    const store = useProductStore();
    
    store.debug = {
        // 打印当前状态
        printState() {
            console.log('当前Store状态:', {
                productData: store.productData,
                loading: store.loading,
                error: store.error,
                isDataFetched: store.isDataFetched,
                productId: store.productId,
                selectedColor: store.selectedColor,
                quantity: store.quantity,
                totalPrice: store.totalPrice
            });
        },
        
        // 模拟数据加载
        async mockDataLoad(productId) {
            console.log('模拟加载产品数据:', productId);
            await store.fetchProductData(productId);
        },
        
        // 重置状态
        reset() {
            console.log('重置Store状态');
            store.resetState();
        }
    };
    
    console.log('调试工具已加载，使用 window.debugProductStore().debug 访问');
}
```

## 性能优化

### 1. 数据缓存

```javascript
// 实现客户端缓存
const dataCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟

const fetchProductData = async (id) => {
    // 检查缓存
    const cacheKey = `product_${id}`;
    const cached = dataCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('使用缓存数据:', id);
        productData.value = cached.data;
        parseProductData(cached.data);
        isDataFetched.value = true;
        return cached.data;
    }
    
    // 获取新数据
    const apiData = await window.productDataAPI.fetchCurrentProductData(id);
    
    // 存入缓存
    dataCache.set(cacheKey, {
        data: apiData,
        timestamp: Date.now()
    });
    
    return apiData;
};
```

### 2. 懒加载和按需更新

```javascript
// 只在需要时更新特定数据
const updateColorVariants = async () => {
    if (!hasColorVariants.value) return;
    
    // 只更新颜色相关数据
    const colorData = await fetchColorVariantsOnly(productId.value);
    availableColors.value = colorData.colors;
    variants.value = colorData.variants;
};

// 防抖处理频繁更新
const debouncedUpdatePrice = Vue.debounce(() => {
    // 重新计算价格
    totalPrice.value = calculateTotalPrice();
}, 300);
```

## 总结

PWCanvas 页面的数据流架构采用了现代化的设计模式：

1. **统一数据源**: 通过API聚合端点获取所有相关数据
2. **集中状态管理**: 使用Pinia管理所有应用状态
3. **响应式更新**: Vue 3的响应式系统确保数据变化时UI自动更新
4. **组件化设计**: 每个功能模块都是独立的Vue组件
5. **错误处理**: 完善的错误处理和调试机制
6. **性能优化**: 缓存、防重复请求、懒加载等优化策略

这种架构确保了数据的一致性、组件的可复用性和应用的可维护性，为用户提供了流畅的产品定制体验。