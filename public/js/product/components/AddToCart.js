/**
 * Add to Cart Component
 * Handles cart functionality using shared store
 */

const AddToCart = {
    name: 'AddToCart',
    
    setup() {
        const store = useProductStore();
        
        const addToCart = async () => {
            await store.addToCart();
        };
        
        return {
            store,
            addToCart
        };
    },
    
    template: `
        <div class="add-to-cart">
            <button 
                @click="addToCart"
                :disabled="!store.canAddToCart"
                :class="['cart-btn', { 'loading': store.loading }]"
            >
                {{ store.loading ? 'Adding...' : 'Add to Cart' }}
            </button>
            
            <div v-if="store.error" class="error-message">
                {{ store.error }}
            </div>
        </div>
    `
};

// Register component globally
window.AddToCart = AddToCart;