/**
 * Product Price Info Component
 * 显示产品单价、总价、预计发货时间和到货时间
 */

const ProductPriceInfo = {
    name: 'ProductPriceInfo',
    
    setup() {
        const { computed, toRefs } = Vue;
        const store = useProductStore();
        
        // 计算原始单价 - 优先使用选中变体的 anchor_price，否则使用产品默认价格
        const originalUnitPrice = computed(() => {
            if (store.selectedVariant && store.selectedVariant.anchor_price) {
                return parseFloat(store.selectedVariant.anchor_price);
            }
            if (store.productData && store.productData.price) {
                return parseFloat(store.productData.price);
            }
            return 0;
        });
        
        // 计算折扣后单价
        const unitPrice = computed(() => {
            if (!store.quantityDiscountEnabled || store.buySampleChecked) {
                return originalUnitPrice.value;
            }
            const discount = store.getCurrentDiscount;
            return discount > 0 ? originalUnitPrice.value * discount : originalUnitPrice.value;
        });
        
        // 计算原始总价
        const originalTotalPrice = computed(() => {
            return originalUnitPrice.value * store.quantity;
        });
        
        // 计算折扣后总价
        const totalPrice = computed(() => {
            return unitPrice.value * store.quantity;
        });
        
        // 计算总折扣金额
        const totalDiscountAmount = computed(() => {
            if (!store.quantityDiscountEnabled || store.buySampleChecked) {
                return 0;
            }
            return originalTotalPrice.value - totalPrice.value;
        });
        
        // 格式化价格显示
        const formatPrice = (price) => {
            return '$' + (price || 0).toFixed(2);
        };
        
        // 获取预计发货时间
        const estimatedShipDate = computed(() => {
            // 从 API 数据中获取发货时间，如果没有则使用默认值
            if (store.productData && store.productData.apiData) {
                const apiData = store.productData.apiData;
                if (apiData.product && apiData.product.data && apiData.product.data.estimated_ship_date) {
                    return apiData.product.data.estimated_ship_date;
                }
            }
            // 默认发货时间：3-5个工作日
            return '3-5 business days';
        });
        
        // 获取预计到货时间
        const estimatedDeliveryDate = computed(() => {
            // 从 API 数据中获取到货时间，如果没有则使用默认值
            if (store.productData && store.productData.apiData) {
                const apiData = store.productData.apiData;
                if (apiData.product && apiData.product.data && apiData.product.data.estimated_delivery_date) {
                    return apiData.product.data.estimated_delivery_date;
                }
            }
            // 默认到货时间：7-10个工作日
            return '7-10 business days';
        });
        
        return {
            // 直接返回 store 而不是使用 toRefs
            store,
            
            // 计算属性
            originalUnitPrice,
            unitPrice,
            originalTotalPrice,
            totalPrice,
            totalDiscountAmount,
            estimatedShipDate,
            estimatedDeliveryDate,
            
            // 方法
            formatPrice
        };
    },
    
    template: `
        <div class="product-price-info">
            <div class="price-section">
                <div class="price-item">
                    <label class="price-label">Unit Price:</label>
                    <div class="price-display">
                        <span v-if="store.hasQuantityDiscounts && store.getCurrentDiscount > 0" class="original-price">{{ formatPrice(originalUnitPrice) }}</span>
                        <span class="price-value unit-price" :class="{ 'discounted': store.hasQuantityDiscounts && store.getCurrentDiscount > 0 }">{{ formatPrice(unitPrice) }}</span>
                        <span v-if="store.hasQuantityDiscounts && store.getCurrentDiscount > 0" class="discount-badge">{{ store.getDiscountText }}</span>
                    </div>
                </div>
                
                <div class="price-item">
                    <label class="price-label">Total Price:</label>
                    <div class="price-display">
                        <span v-if="store.hasQuantityDiscounts && store.getCurrentDiscount > 0" class="original-price">{{ formatPrice(originalTotalPrice) }}</span>
                        <span class="price-value total-price" :class="{ 'discounted': store.hasQuantityDiscounts && store.getCurrentDiscount > 0 }">{{ formatPrice(totalPrice) }}</span>
                    </div>
                </div>
                
                <div v-if="store.hasQuantityDiscounts && store.getCurrentDiscount > 0" class="discount-summary">
                    <div class="price-item discount-item">
                        <label class="price-label">You Save:</label>
                        <span class="price-value savings-amount">{{ formatPrice(totalDiscountAmount) }}</span>
                    </div>
                </div>
            </div>
            
            <div class="shipping-section">
                <div class="shipping-item">
                    <label class="shipping-label">Estimated Ship Date:</label>
                    <span class="shipping-value">{{ estimatedShipDate }}</span>
                </div>
                
                <div class="shipping-item">
                    <label class="shipping-label">Estimated Delivery:</label>
                    <span class="shipping-value">{{ estimatedDeliveryDate }}</span>
                </div>
            </div>
        </div>
    `
};

// Register component globally
window.ProductPriceInfo = ProductPriceInfo;