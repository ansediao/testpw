/**
 * Product Price Info Component
 * 显示产品单价、总价、预计发货时间和到货时间
 */

const PwcaProductPriceInfo = {
    name: 'PwcaProductPriceInfo',

    setup() {
        const { computed } = Vue;
        const store = window.pwcaUseProductStore();

        // 计算原始单价 - 包含产品价格和配件价格
        const originalUnitPrice = computed(() => {
            return store.baseUnitPrice;
        });

        // 计算折扣后单价
        const unitPrice = computed(() => {
            return store.discountedPrice;
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

        // 使用 store 中计算的预计发货时间
        const estimatedShipDate = computed(() => {
            return store.estimatedShipDate;
        });

        const estimatedDeliveryDate = computed(() => store.estimatedDeliveryDate);
        const shouldShowDeliveryDate = computed(() => store.shouldShowDeliveryDate);

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
            shouldShowDeliveryDate,

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
                        <span v-if="store.hasQuantityDiscounts && store.currentDiscount > 0" class="original-price">{{ formatPrice(originalUnitPrice) }}</span>
                        <span class="price-value unit-price" :class="{ 'discounted': store.hasQuantityDiscounts && store.currentDiscount > 0 }">{{ formatPrice(unitPrice) }}</span>
                        <span v-if="store.hasQuantityDiscounts && store.currentDiscount > 0" class="discount-badge">{{ store.discountText }}</span>
                    </div>
                </div>
                
                <div class="price-item">
                    <label class="price-label">Total Price:</label>
                    <div class="price-display">
                        <span v-if="store.hasQuantityDiscounts && store.currentDiscount > 0" class="original-price">{{ formatPrice(originalTotalPrice) }}</span>
                        <span class="price-value total-price" :class="{ 'discounted': store.hasQuantityDiscounts && store.currentDiscount > 0 }">{{ formatPrice(totalPrice) }}</span>
                    </div>
                </div>
                
                <div v-if="store.hasQuantityDiscounts && store.currentDiscount > 0" class="discount-summary">
                    <div class="price-item discount-item">
                        <label class="price-label">You Save:</label>
                        <span class="price-value savings-amount">{{ formatPrice(totalDiscountAmount) }}</span>
                    </div>
                </div>
            </div>
            
            <div class="shipping-section">
                <div v-if="store.rts_date" class="shipping-item">
                    <label class="shipping-label">Estimated Ship Date:</label>
                    <span class="shipping-value">{{ estimatedShipDate }}</span>
                </div>
                
                <div v-if="shouldShowDeliveryDate" class="shipping-item">
                    <label class="shipping-label">Estimated Delivery:</label>
                    <span class="shipping-value">{{ estimatedDeliveryDate }}</span>
                </div>
            </div>
        </div>
    `
};

// Register component globally
window.pwcaProductPriceInfo = PwcaProductPriceInfo;
