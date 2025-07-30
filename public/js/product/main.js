/**
 * Vue 3 + Pinia Application Initializer
 * Product page main entry file - initialization only
 */

// Wait for DOM and all scripts to load
document.addEventListener('DOMContentLoaded', function () {


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
        addToCart: !!window.AddToCart,
        colorVariants: !!window.ColorVariants,
        checkboxOptions: !!window.CheckboxOptions
    };



    // Initialize application
    if (modulesLoaded.store && modulesLoaded.productInfo && modulesLoaded.productQuantity && modulesLoaded.addToCart && modulesLoaded.colorVariants && modulesLoaded.checkboxOptions) {
        initializeModularApp(productId);
    } else {
        initializeBasicApp(productId, modulesLoaded);
    }
});

// Initialize modular application
function initializeModularApp(productId) {

    const { createApp } = Vue;
    const pinia = Pinia.createPinia();

    const App = {
        name: 'ProductApp',

        setup() {
            const store = useProductStore();

            Vue.onMounted(async () => {
                store.setProductId(productId);

                // 初始化时获取产品数据
                try {
                    await store.fetchProductData();
                } catch (error) {
                    console.error('App: 产品数据初始化失败:', error);
                }
            });

            return { store };
        },

        components: {
            ProductInfo: window.ProductInfo,
            ProductQuantity: window.ProductQuantity,
            AddToCart: window.AddToCart,
            ColorVariants: window.ColorVariants,
            CheckboxOptions: window.CheckboxOptions  // 添加这行
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
                    
                    <div class="color-variants-section">
                        <ColorVariants />
                    </div>
                    
                    <!-- 添加新模块 -->
                    <div class="checkbox-options-section">
                        <CheckboxOptions />
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
function initializeBasicApp(productId, modulesLoaded) {

    const { createApp } = Vue;
    const pinia = Pinia.createPinia();

    const components = {};
    if (modulesLoaded.checkboxOptions && window.CheckboxOptions) {
        components.CheckboxOptions = window.CheckboxOptions;
    }

    const app = createApp({
        data() {
            return {
                productId: productId,
                message: 'Basic Vue + Pinia app (modules not available)'
            };
        },
        mounted() {
        },
        components,
        template: `
            <div class="pw-vue-basic-app">
                <h2>Basic Product Page</h2>
                <p>{{ message }}</p>
                <p>Product ID: {{ productId }}</p>
                <div v-if="$options.components && $options.components.CheckboxOptions">
                    <h4>Checkbox Options (Basic):</h4>
                    <CheckboxOptions />
                </div>
            </div>
        `
    });

    app.use(pinia);
    app.mount('#vue-dynamic-product-area');
}