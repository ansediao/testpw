/**
 * Vue 3 + Pinia Application Initializer
 * Product page main entry file - initialization only
 */

// CSS 加载器函数
function loadCSS(href, id) {
    if (document.getElementById(id)) {
        return; // CSS 已经加载
    }
    
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = href;
    document.head.appendChild(link);
}



// 加载产品图片Canvas功能脚本和样式
// 注意：Canvas功能资源现在通过CDN加载器统一加载，此函数已废弃
/*
function loadProductImageCanvasAssets() {
    // 获取当前脚本的基础路径
    const currentScript = document.currentScript || document.querySelector('script[src*="main.js"]');
    let basePath = '';
    
    if (currentScript && currentScript.src) {
        const scriptPath = currentScript.src;
        // 从 /js/product/main.js 回到根目录
        basePath = scriptPath.replace(/\/js\/product\/main\.js.*$/, '/');
    } else {
        // 备用方案：使用相对路径
        basePath = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/').replace(/\/product\/$/, '/');
    }
    
    // 首先加载Fabric.js库
    const fabricScript = document.createElement('script');
    fabricScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js';
    fabricScript.onload = function() {
        // Fabric.js库已加载
        
        // Fabric.js加载完成后，再加载Canvas功能脚本
        const canvasScript = document.createElement('script');
        canvasScript.src = basePath + 'js/product/product-image-canvas.js';
        canvasScript.onload = function() {
            // 产品图片Canvas功能已加载
        };
        canvasScript.onerror = function() {
            // 产品图片Canvas功能加载失败
        };
        document.head.appendChild(canvasScript);
    };
    fabricScript.onerror = function() {
        // Fabric.js库加载失败
    };
    document.head.appendChild(fabricScript);
}
*/

// Wait for DOM and all scripts to load
document.addEventListener('DOMContentLoaded', function () {
    // Canvas功能资源已通过CDN加载器加载，无需重复加载

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
        productQuantity: !!window.ProductQuantity,
        productPriceInfo: !!window.ProductPriceInfo,
        addToCart: !!window.AddToCart,
        colorVariants: !!window.ColorVariants,
        checkboxOptions: !!window.CheckboxOptions,
        quantityDiscountSlider: !!window.QuantityDiscountSlider,
        productAccessories: !!window.ProductAccessories,
        customColorsButton: !!window.CustomColorsButton
    };



    // Initialize application - make ProductAccessories optional
    if (modulesLoaded.store && modulesLoaded.productQuantity && modulesLoaded.productPriceInfo && modulesLoaded.addToCart && modulesLoaded.colorVariants && modulesLoaded.checkboxOptions && modulesLoaded.quantityDiscountSlider) {
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
                    console.error('App: Product data initialization failed:', error);
                }
            });

            return { store };
        },

        components: {
            ProductQuantity: window.ProductQuantity,
            ProductPriceInfo: window.ProductPriceInfo,
            AddToCart: window.AddToCart,
            ColorVariants: window.ColorVariants,
            CheckboxOptions: window.CheckboxOptions,
            QuantityDiscountSlider: window.QuantityDiscountSlider,
            ...(window.ProductAccessories && { ProductAccessories: window.ProductAccessories }),
            ...(window.CustomColorsButton && { CustomColorsButton: window.CustomColorsButton })
        },

        template: `
            <div class="pw-vue-modular-app">              
                
                <div class="app-content">
                    <div class="color-variants-section">
                        <ColorVariants />
                    </div>
                    
                    <!-- 自定义颜色按钮组 -->
                    <div class="custom-colors-section" v-if="$options.components.CustomColorsButton">
                        <CustomColorsButton />
                    </div>
                    
                    <!-- 添加新模块 -->
                    <div class="checkbox-options-section">
                        <CheckboxOptions />
                    </div>
                    
                    <div class="quantity-section">
                        <ProductQuantity />
                    </div>
                    
                    <!-- 添加配件组件到ProductQuantity下面 -->
                    <div class="accessories-section" v-if="$options.components.ProductAccessories">
                        <ProductAccessories />
                    </div>
                    
                    <div class="price-info-section">
                        <ProductPriceInfo />
                    </div>
                    
                    <div class="cart-section">
                        <AddToCart />
                    </div>
                </div>                
               
            </div>
        `
    };

    const app = createApp(App);
    app.use(pinia);
    
    // 全局注册QuantityDiscountSlider组件
    if (window.QuantityDiscountSlider) {
        app.component('QuantityDiscountSlider', window.QuantityDiscountSlider);
    }
    
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
    if (modulesLoaded.quantityDiscountSlider && window.QuantityDiscountSlider) {
        components.QuantityDiscountSlider = window.QuantityDiscountSlider;
    }
    if (modulesLoaded.productAccessories && window.ProductAccessories) {
        components.ProductAccessories = window.ProductAccessories;
    }
    if (modulesLoaded.customColorsButton && window.CustomColorsButton) {
        components.CustomColorsButton = window.CustomColorsButton;
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
                <div v-if="$options.components && $options.components.ProductAccessories">
                    <h4>Product Accessories (Basic):</h4>
                    <ProductAccessories />
                </div>
                <div v-if="$options.components && $options.components.CustomColorsButton">
                    <h4>Custom Colors (Basic):</h4>
                    <CustomColorsButton />
                </div>
            </div>
        `
    });

    app.use(pinia);
    app.mount('#vue-dynamic-product-area');
}