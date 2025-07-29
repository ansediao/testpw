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
            store.updateQuantity(store.quantity + 1);
        };
        
        const decreaseQuantity = () => {
            if (store.quantity > 1) {
                store.updateQuantity(store.quantity - 1);
            }
        };
        
        const handleInput = (event) => {
            const value = parseInt(event.target.value) || 1;
            store.updateQuantity(value);
        };
        
        const formatPrice = (price) => {
            return (price || 0).toFixed(2);
        };
        
        return {
            store,
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
                    :disabled="store.quantity <= 1"
                    class="qty-btn"
                >-</button>
                
                <input 
                    type="number" 
                    :value="store.quantity"
                    @input="handleInput"
                    min="1"
                    class="qty-input"
                />
                
                <button 
                    @click="increaseQuantity"
                    class="qty-btn"
                >+</button>
            </div>
            <p class="total-price">
              
            </p>
        </div>
    `
};

// Register component globally
window.ProductQuantity = ProductQuantity;