/**
 * Product Quantity Component
 * Simple component showing how to use shared store
 */

const ProductQuantity = {
    name: 'ProductQuantity',
    
    setup() {
        // Access shared store
        const store = useProductStore();
        
        
        // Methods
        const increaseQuantity = () => {
            const nextQuantity = store.getNextValidQuantity(store.quantity);
            if (nextQuantity <= store.maxQuantity) {
                store.setQuantityDirect(nextQuantity);
            }
        };
        
        const decreaseQuantity = () => {
            const previousQuantity = store.getPreviousValidQuantity(store.quantity);
            if (previousQuantity >= store.minQuantity) {
                store.setQuantityDirect(previousQuantity);
            }
        };
        
        const handleInput = (event) => {
            const value = parseInt(event.target.value) || 1;
            // 直接设置用户输入的值，不进行批次修正
            store.setQuantityDirect(value);
        };
        
        const formatPrice = (price) => {
            return (price || 0).toFixed(2);
        };
        
        // 计算是否可以减少数量
        const canDecrease = Vue.computed(() => {
            return store.quantity > store.minQuantity;
        });
        
        // 计算是否可以增加数量
        const canIncrease = Vue.computed(() => {
            return store.quantity < store.maxQuantity;
        });
        
        // 显示MOQ信息
        const moqInfo = Vue.computed(() => {
            const settings = store.moqSettings;
            if (settings.sell_in_batch === true) {
                if (settings.batch_quantity > 1) {
                    return `Minimum: ${store.minQuantity}, Step: ${store.stepQuantity}`;
                } else {
                    return `Minimum: ${store.minQuantity} (Batch sales enabled)`;
                }
            }
            return `Minimum: ${store.minQuantity}`;
        });
        
        // 检查QuantityDiscountSlider组件是否可用且启用
        const hasDiscountSlider = Vue.computed(() => {
            return typeof window.QuantityDiscountSlider !== 'undefined' && store.quantityDiscountEnabled;
        });

        // 检查当前数量是否符合批次要求
        const isQuantityValidForBatch = Vue.computed(() => {
            if (store.moqSettings.sell_in_batch !== true) {
                return true; // 不按批次销售时，任何数量都有效
            }
            
            const corrected = store.correctedQuantity(store.quantity);
            return corrected === store.quantity;
        });

        // 获取建议的修正数量
        const suggestedQuantity = Vue.computed(() => {
            if (isQuantityValidForBatch.value) {
                return null; // 当前数量已经有效
            }
            return store.correctedQuantity(store.quantity);
        });

        return {
            // Store 响应式数据
            // 直接返回 store 而不是使用 toRefs
            store,
            
            // 计算属性
            canDecrease,
            canIncrease,
            moqInfo,
            hasDiscountSlider,
            isQuantityValidForBatch,
            suggestedQuantity,
            
            // 方法
            increaseQuantity,
            decreaseQuantity,
            handleInput,
            formatPrice
        };
    },
    
    template: `
        <div class="quantity-selector">
            <h4>Quantity</h4>
            <div class="quantity-controls">
                <button 
                    @click="decreaseQuantity" 
                    :disabled="!canDecrease"
                    class="qty-btn"
                    :class="{ 'disabled': !canDecrease }"
                >-</button>
                
                <input 
                    type="number" 
                    :value="store.quantity"
                    @input="handleInput"
                    :min="store.minQuantity"
                    :max="store.maxQuantity"
                    :step="store.stepQuantity"
                    class="qty-input"
                    :class="{ 'invalid': !store.isValidQuantity }"
                />
                
                <button 
                    @click="increaseQuantity"
                    :disabled="!canIncrease"
                    class="qty-btn"
                    :class="{ 'disabled': !canIncrease }"
                >+</button>
            </div>
            
            <!-- 数量折扣滑块组件 -->
            <QuantityDiscountSlider v-if="hasDiscountSlider"></QuantityDiscountSlider>
            
            <div class="quantity-info">
                <p class="moq-info" v-if="store.minQuantity > 1">
                    {{ moqInfo }}
                </p>
                <p class="batch-info" v-if="store.moqSettings.sell_in_batch === true">
                    Sold in batches of {{ store.stepQuantity }}
                </p>
                <p class="validation-error" v-if="!store.isValidQuantity">
                    Please enter a valid quantity ({{ store.minQuantity }} - {{ store.maxQuantity }})
                </p>
                <p class="batch-warning" v-if="store.moqSettings.sell_in_batch === true && !isQuantityValidForBatch" 
                   style="color: #ff9800; font-size: 12px;">
                    Suggested quantity: {{ suggestedQuantity }} (Use +/- buttons to auto-correct)
                </p>
            </div>
        </div>
    `
};

// Register component globally
window.ProductQuantity = ProductQuantity;