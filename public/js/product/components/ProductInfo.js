/**
 * Product Info Component
 * Shows basic product information using shared store
 */

const ProductInfo = {
    name: 'ProductInfo',
    
    setup() {
        const store = useProductStore();
        
        // Mock product data for demo
        const { onMounted } = Vue;
        
        onMounted(() => {
            // Set mock product data
            store.setProductData({
                name: 'Sample Product',
                price: 29.99,
                description: 'This is a sample product description.',
                sku: 'SKU-123'
            });
        });
        
        const toggleDetails = () => {
            store.toggleDetails();
        };
        
        return {
            store,
            toggleDetails
        };
    },
    
    template: `
        <div class="product-info">
            <div v-if="store.loading" class="loading">
                Loading product information...
            </div>
            
            <div v-else-if="store.error" class="error">
                Error: {{ store.error }}
            </div>
            
            <div v-else-if="store.productData" class="product-details">
                <h3>{{ store.productData.name }}</h3>
                <p class="price">\${{ store.productData.price }}</p>
                <p class="sku">SKU: {{ store.productData.sku }}</p>
                
                <button @click="toggleDetails" class="toggle-btn">
                    {{ store.showDetails ? 'Hide' : 'Show' }} Details
                </button>
                
                <div v-if="store.showDetails" class="description">
                    <p>{{ store.productData.description }}</p>
                </div>
            </div>
            
            <div v-else class="no-data">
                No product data available
            </div>
        </div>
    `
};

// Register component globally
window.ProductInfo = ProductInfo;