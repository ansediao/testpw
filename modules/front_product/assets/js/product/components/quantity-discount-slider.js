/**
 * Quantity Discount Slider Component
 * Displays quantity discount tiers with visual slider
 */

const PwcaQuantityDiscountSlider = {
    name: 'PwcaQuantityDiscountSlider',
    
    setup() {
        // Access shared store
        const store = window.pwcaUseProductStore();
        
        // 计算滑块的刻度点
        const discountTiers = Vue.computed(() => {
            if (!store.hasQuantityDiscounts) return [];
            
            return store.moq.discounts.map(discount => ({
                quantity: discount.range_from,
                discount: discount.discount,
                discountText: Math.round((1 - discount.discount) * 100) + '% OFF',
                isActive: store.quantity.current >= discount.range_from && 
                         (store.currentDiscount === discount.discount)
            }));
        });
        
        // 计算当前数量在滑块上的位置
        const currentPosition = Vue.computed(() => {
            if (!store.hasQuantityDiscounts || discountTiers.value.length === 0) return 0;
            
            const minQty = discountTiers.value[0].quantity;
            const maxQty = discountTiers.value[discountTiers.value.length - 1].quantity;
            const currentQty = Math.max(minQty, Math.min(store.quantity, maxQty));
            
            // 防止除零错误
            if (maxQty === minQty) return 0;
            
            // 计算百分比位置 (0-100)
            const position = ((currentQty - minQty) / (maxQty - minQty)) * 100;
            return Math.max(0, Math.min(100, position));
        });
        
        // 点击刻度点设置数量
        const setQuantityToTier = (tierQuantity) => {
            store.updateQuantity(tierQuantity);
        };
        
        // 格式化折扣文本
        const formatDiscountText = (discount) => {
            const percentage = Math.round((1 - discount) * 100);
            return percentage > 0 ? `${percentage}% OFF` : '';
        };
        
        // 计算刻度点位置
        const getTierPosition = (tier, index) => {
            if (discountTiers.value.length === 0) return 0;
            if (discountTiers.value.length === 1) return 50; // 单个刻度点居中
            
            const minQty = discountTiers.value[0].quantity;
            const maxQty = discountTiers.value[discountTiers.value.length - 1].quantity;
            
            if (maxQty === minQty) return index * (100 / (discountTiers.value.length - 1));
            
            return ((tier.quantity - minQty) / (maxQty - minQty)) * 100;
        };
        
        return {
            // 直接返回 store
            store,
            
            // 计算属性
            discountTiers,
            currentPosition,
            
            // 方法
            setQuantityToTier,
            formatDiscountText,
            getTierPosition
        };
    },
    
    template: `
        <div v-if="store.hasQuantityDiscounts" class="quantity-discount-slider">
            <div class="slider-container">
                <!-- 滑块轨道 -->
                <div class="slider-track">
                    <!-- 当前位置指示器 -->
                    <div 
                        class="current-position-indicator"
                        :style="{ left: currentPosition + '%' }"
                    >
                        <div class="quantity-bubble">
                            {{ store.quantity.current }}
                        </div>
                    </div>
                    
                    <!-- 折扣刻度点 -->
                    <div 
                        v-for="(tier, index) in discountTiers" 
                        :key="index"
                        class="discount-tier"
                        :class="{ 'active': tier.isActive }"
                        :style="{ left: getTierPosition(tier, index) + '%' }"
                        @click="setQuantityToTier(tier.quantity)"
                    >
                        <div class="tier-dot"></div>
                        <div class="tier-quantity">{{ tier.quantity }}</div>
                    </div>
                </div>
            </div>
            
            <!-- 当前折扣显示 -->
            <div v-if="store.discountText" class="current-discount">
                <span class="discount-label">Discount: </span>
                <span class="discount-value">{{ store.discountText }}</span>
            </div>
        </div>
    `
};

// Register component globally
window.pwcaQuantityDiscountSlider = PwcaQuantityDiscountSlider;
