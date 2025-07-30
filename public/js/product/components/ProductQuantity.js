/**
 * Product Quantity Component
 * Simple component showing how to use shared store
 */

const ProductQuantity = {
    name: 'ProductQuantity',
    
    setup() {
        // Access shared store
        const store = useProductStore();
        
        // 使用 toRefs 保持响应式
        const { toRefs } = Vue;
        const storeRefs = toRefs(store);
        
        // Methods
        const increaseQuantity = () => {
            const newQuantity = store.quantity + store.stepQuantity;
            store.updateQuantity(newQuantity);
        };
        
        const decreaseQuantity = () => {
            const newQuantity = store.quantity - store.stepQuantity;
            if (newQuantity >= store.minQuantity) {
                store.updateQuantity(newQuantity);
            }
        };
        
        const handleInput = (event) => {
            const value = parseInt(event.target.value) || store.minQuantity;
            store.updateQuantity(value);
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
            if (settings.sell_in_batch && settings.batch_quantity > 1) {
                return `Minimum: ${store.minQuantity}, Step: ${store.stepQuantity}`;
            }
            return `Minimum: ${store.minQuantity}`;
        });
        
        return {
            // Store 响应式数据
            quantity: storeRefs.quantity,
            minQuantity: storeRefs.minQuantity,
            maxQuantity: storeRefs.maxQuantity,
            stepQuantity: storeRefs.stepQuantity,
            moqSettings: storeRefs.moqSettings,
            isValidQuantity: storeRefs.isValidQuantity,
            
            // 计算属性
            canDecrease,
            canIncrease,
            moqInfo,
            
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
                    :value="quantity"
                    @input="handleInput"
                    :min="minQuantity"
                    :max="maxQuantity"
                    :step="stepQuantity"
                    class="qty-input"
                    :class="{ 'invalid': !isValidQuantity }"
                />
                
                <button 
                    @click="increaseQuantity"
                    :disabled="!canIncrease"
                    class="qty-btn"
                    :class="{ 'disabled': !canIncrease }"
                >+</button>
            </div>
            
            <div class="quantity-info">
                <p class="moq-info" v-if="moqSettings.minimum_order_quantity > 1">
                    {{ moqInfo }}
                </p>
                <p class="batch-info" v-if="moqSettings.sell_in_batch">
                    Sold in batches of {{ stepQuantity }}
                </p>
                <p class="validation-error" v-if="!isValidQuantity">
                    Please enter a valid quantity ({{ minQuantity }} - {{ maxQuantity }})
                </p>
            </div>
        </div>
    `
};

// Register component globally
window.ProductQuantity = ProductQuantity;