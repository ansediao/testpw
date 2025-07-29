/**
 * Vue 3 + Pinia Application Initializer
 * Product page main entry file - initialization only
 */

// Wait for DOM and all scripts to load
document.addEventListener('DOMContentLoaded', function() {
    // Check if required dependencies are loaded
    if (typeof Vue === 'undefined' || typeof Pinia === 'undefined') {
        console.error('Vue or Pinia not loaded properly');
        return;
    }

    // Get mount point
    const mountPoint = document.getElementById('vue-dynamic-product-area');
    if (!mountPoint) {
        console.error('Vue mount point not found');
        return;
    }

    // Get product ID
    const productId = mountPoint.dataset.productId;

    // Check if all modules are loaded
    const modulesLoaded = {
        store: !!window.useProductStore,
        productInfo: !!window.ProductInfo,
        productQuantity: !!window.ProductQuantity,
        addToCart: !!window.AddToCart
    };

    console.log('Module loading status:', modulesLoaded);

    // Initialize application
    if (modulesLoaded.store && modulesLoaded.productInfo && modulesLoaded.productQuantity && modulesLoaded.addToCart) {
        initializeModularApp(productId);
    } else {
        console.warn('Some modules not loaded, initializing basic app');
        initializeBasicApp(productId);
    }
});

// Initialize modular application
function initializeModularApp(productId) {
    console.log('Initializing modular Vue app...');

    const { createApp } = Vue;
    const pinia = Pinia.createPinia();

    const App = {
        name: 'ProductApp',
        
        setup() {
            const store = useProductStore();
            
            Vue.onMounted(() => {
                store.setProductId(productId);
                console.log('Modular Vue app mounted, Product ID:', productId);
            });
            
            return { store };
        },
        
        components: {
            ProductInfo: window.ProductInfo,
            ProductQuantity: window.ProductQuantity,
            AddToCart: window.AddToCart
        },
        
        template: `
            <div class="pw-vue-modular-app">
                <div class="app-header">
                    <h2>Modular Product Page</h2>
                    <p>Product ID: {{ store.productId }}</p>
                </div>
                
                <div class="app-content">
                    <div class="product-section">
                        <ProductInfo />
                    </div>
                    
                    <div class="quantity-section">
                        <ProductQuantity />
                    </div>
                    
                    <div class="cart-section">
                        <AddToCart />
                    </div>
                </div>
                
                <div class="app-footer">
                    <p><small>Powered by Vue 3 + Pinia</small></p>
                </div>
            </div>
        `
    };

    const app = createApp(App);
    app.use(pinia);
    app.mount('#vue-dynamic-product-area');
}

// Fallback basic application
function initializeBasicApp(productId) {
    console.log('Initializing basic Vue app...');

    const { createApp } = Vue;
    const pinia = Pinia.createPinia();

    const app = createApp({
        data() {
            return {
                productId: productId,
                message: 'Basic Vue + Pinia app (modules not available)'
            };
        },
        mounted() {
            console.log('Basic Vue app mounted, Product ID:', this.productId);
        },
        template: `
            <div class="pw-vue-basic-app">
                <h2>Basic Product Page</h2>
                <p>{{ message }}</p>
                <p>Product ID: {{ productId }}</p>
            </div>
        `
    });

    app.use(pinia);
    app.mount('#vue-dynamic-product-area');
}