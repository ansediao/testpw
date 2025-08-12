/**
 * Add to Cart Component
 * Handles cart functionality using shared store
 */

const AddToCart = {
    name: 'AddToCart',
    
    setup() {
        const store = useProductStore();
        
        const addToCart = async () => {
            // 获取页面上数量输入框的值
            const qtyInput = document.querySelector('.qty-input');
            let quantity = 100; // 默认值
            
            if (qtyInput) {
                quantity = parseInt(qtyInput.value) || 100;
            }
            
            // 将数量传递给 store 的 addToCart 方法
            await store.addToCart(quantity);
        };
        
        const customizeNow = () => {
            const productId = window.pwProductConfig?.productId || store.productId;
            const customizeUrl = `https://woo-cuz-cart-checkout.local/pwcanvas/?product_id=${productId}`;
            window.location.href = customizeUrl;
        };
        
        return {
            store,
            addToCart,
            customizeNow
        };
    },
    
    template: `
            <div class="button-group">
                <button 
                    @click="addToCart"
                    :disabled="!store.canAddToCart"
                    :class="['cart-btn', { 'loading': store.loading }]"
                >
                    {{ store.loading ? 'Adding...' : 'Add to Cart' }}
                </button>
                
                <button 
                    @click="customizeNow"
                    class="customize-btn"
                >
                    Customizing Now
                </button>
            </div>
            
            <div v-if="store.error" class="error-message">
                {{ store.error }}
            </div>
       
    `
};

// Register component globally
window.AddToCart = AddToCart;