/**
 * Product Price Info Component
 * 显示产品单价、总价、预计发货时间和到货时间
 */

const ProductPriceInfo = {
    name: 'ProductPriceInfo',

    setup() {
        const { computed } = Vue;
        const store = useProductStore();

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

        // 获取预计到货时间
        const estimatedDeliveryDate = computed(() => {
            // 检查是否有 API 数据
            if (store.productData && store.productData.apiData) {
                const apiData = store.productData.apiData;

                // 如果 API 直接提供了预计到货时间，优先使用
                if (apiData.product && apiData.product.data && apiData.product.data.estimated_delivery_date) {
                    return apiData.product.data.estimated_delivery_date;
                }

                // 否则根据公式计算
                if (apiData.product && apiData.product.data) {
                    const productData = apiData.product.data;

                    // 获取计算所需的参数
                    const avgShippingTime = parseInt(productData.avg_shipping_time) || 0;
                    const rtsDateStartsFrom = store.rts_date_starts_from || 3;

                    // 根据 blankProductChecked 状态选择不同的处理时间
                    let processingTime = 0;
                    if (store.blankProductChecked) {
                        // 样品订单：使用 rts_for_sample_order
                        processingTime = parseInt(productData.rts_for_sample_order) || store.rts_for_sample_order || 1;
                    } else {
                        // 批量订单：使用 rts_for_bulk_order
                        processingTime = parseInt(productData.rts_for_bulk_order) || store.rts_for_bulk_order || 2;
                    }

                    // 计算总天数
                    const totalDays = avgShippingTime + processingTime + rtsDateStartsFrom;

                    // 计算目标日期
                    const currentDate = new Date();
                    const deliveryDate = new Date(currentDate);
                    deliveryDate.setDate(currentDate.getDate() + totalDays);

                    // 格式化日期为 MM/DD/YYYY 格式
                    const month = String(deliveryDate.getMonth() + 1).padStart(2, '0');
                    const day = String(deliveryDate.getDate()).padStart(2, '0');
                    const year = deliveryDate.getFullYear();

                    return `${month}/${day}/${year}`;
                }
            }

            // 默认到货时间：7-10个工作日
            return '7-10 business days';
        });

        // 检查是否应该显示预计到货时间
        const shouldShowDeliveryDate = computed(() => {
            if (store.productData && store.productData.apiData) {
                const apiData = store.productData.apiData;
                if (apiData.product && apiData.product.data) {
                    return !!apiData.product.data.arrival_date;
                }
            }
            return false;
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
window.ProductPriceInfo = ProductPriceInfo;