/**
 * Add to Cart Component
 * Handles cart functionality using shared store
 */

const PwcaAddToCart = {
    name: 'PwcaAddToCart',
    
    setup() {
        const store = window.pwcaUseProductStore();
        
        const addToCart = async () => {
            await store.addToCart(store.quantity.current);
        };
        
        const customizeNow = () => {
            const productId = window.pwcaProductConfig?.productId || store.productId;
            const customizeUrl = `/pwcanvas/?product_id=${productId}`;
            window.location.href = customizeUrl;
        };
        
        return {
            store,
            addToCart,
            customizeNow
        };
    },
    
    template: `
            <div class="pwca-button-group">
                <button 
                    v-show="store.shouldShowAddToCart"
                    @click="addToCart"
                    :disabled="!store.canAddToCart"
                    :class="['pwca-cart-btn', { 'loading': store.loading }]"
                >
                    {{ store.loading ? 'Adding...' : 'Add to Cart' }}
                </button>
                
                <button 
                    v-show="store.shouldShowCustomize"
                    @click="customizeNow"
                    class="pwca-customize-btn"
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
window.pwcaAddToCart = PwcaAddToCart;
