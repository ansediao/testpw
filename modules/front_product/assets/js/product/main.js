/**
 * Vue 3 Application Initializer
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
    if (typeof Vue === 'undefined') {
        return;
    }

    // Get mount point
    const mountPoint = document.getElementById('vue-dynamic-product-area');
    if (!mountPoint) {
        return;
    }

    // Get product ID
    const productId = mountPoint.dataset.productId;
    const pwId = mountPoint.dataset.pwId;
    const restApiUrl = mountPoint.dataset.restApiUrl;
    const nonce = mountPoint.dataset.restNonce;

    if (pwId && restApiUrl && nonce) {
        window.pwcaProductConfig = {
            pwId,
            productId: Number(productId) || 0,
            restApiUrl,
            nonce
        };
        window.pwcaProductData = null;
    }

    // Check if all modules are loaded
    const modulesLoaded = {
        store: !!window.pwcaUseProductStore,
        productQuantity: !!window.pwcaProductQuantity,
        productPriceInfo: !!window.pwcaProductPriceInfo,
        addToCart: !!window.pwcaAddToCart,
        colorVariants: !!window.pwcaColorVariants,
        checkboxOptions: !!window.pwcaCheckboxOptions,
        quantityDiscountSlider: !!window.pwcaQuantityDiscountSlider,
        productAccessories: !!window.pwcaProductAccessories,
        customColorsButton: !!window.pwcaCustomColorsButton
    };



    // Initialize application - make PwcaProductAccessories optional
    if (modulesLoaded.store && modulesLoaded.productQuantity && modulesLoaded.productPriceInfo && modulesLoaded.addToCart && modulesLoaded.colorVariants && modulesLoaded.checkboxOptions && modulesLoaded.quantityDiscountSlider) {
        initializeModularApp(productId);
    } else {
        initializeBasicApp(productId, modulesLoaded);
    }
});

// Initialize modular application
function initializeModularApp(productId) {

    const { createApp } = Vue;

    const App = {
        name: 'ProductApp',

        setup() {
            const store = window.pwcaUseProductStore();

            Vue.onMounted(async () => {
                store.setProductId(productId);

                // 初始化时获取产品数据
                try {
                    await store.fetchProductData();
                } catch (error) {
                }
            });

            return { store };
        },

        components: {
            PwcaProductQuantity: window.pwcaProductQuantity,
            PwcaProductPriceInfo: window.pwcaProductPriceInfo,
            PwcaAddToCart: window.pwcaAddToCart,
            PwcaColorVariants: window.pwcaColorVariants,
            PwcaCheckboxOptions: window.pwcaCheckboxOptions,
            QuantityDiscountSlider: window.pwcaQuantityDiscountSlider,
            ...(window.pwcaProductAccessories && { PwcaProductAccessories: window.pwcaProductAccessories }),
            ...(window.pwcaCustomColorsButton && { CustomColorsButton: window.pwcaCustomColorsButton })
        },

        template: `
            <div class="pw-vue-modular-app">              
                
                <div class="app-content">
                    <div class="color-variants-section">
                        <PwcaColorVariants />
                    </div>
                    
                    <!-- 自定义颜色按钮组 -->
                    <div class="custom-colors-section" v-if="$options.components.CustomColorsButton">
                        <CustomColorsButton />
                    </div>
                    
                    <!-- 添加新模块 -->
                    <div class="checkbox-options-section">
                        <PwcaCheckboxOptions />
                    </div>
                    
                    <div class="quantity-section">
                        <PwcaProductQuantity />
                    </div>
                    
                    <!-- 添加配件组件到ProductQuantity下面 -->
                    <div class="accessories-section" v-if="$options.components.PwcaProductAccessories">
                        <PwcaProductAccessories />
                    </div>
                    
                    <div class="price-info-section">
                        <PwcaProductPriceInfo />
                    </div>
                    
                    <div class="pwca-cart-section">
                        <PwcaAddToCart />
                    </div>
                </div>                
               
            </div>
        `
    };

    const app = createApp(App);
    
    // 全局注册QuantityDiscountSlider组件
    if (window.pwcaQuantityDiscountSlider) {
        app.component('PwcaQuantityDiscountSlider', window.pwcaQuantityDiscountSlider);
    }
    
    app.mount('#vue-dynamic-product-area');
}

// Fallback basic application
function initializeBasicApp(productId, modulesLoaded) {

    const { createApp } = Vue;

    const components = {};
    if (modulesLoaded.checkboxOptions && window.pwcaCheckboxOptions) {
        components.PwcaCheckboxOptions = window.pwcaCheckboxOptions;
    }
    if (modulesLoaded.quantityDiscountSlider && window.pwcaQuantityDiscountSlider) {
        components.QuantityDiscountSlider = window.pwcaQuantityDiscountSlider;
    }
    if (modulesLoaded.productAccessories && window.pwcaProductAccessories) {
        components.PwcaProductAccessories = window.pwcaProductAccessories;
    }
    if (modulesLoaded.customColorsButton && window.pwcaCustomColorsButton) {
        components.CustomColorsButton = window.pwcaCustomColorsButton;
    }

    const app = createApp({
        data() {
            return {
                productId: productId,
                message: 'Basic Vue app (modules not available)'
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
                <div v-if="$options.components && $options.components.PwcaCheckboxOptions">
                    <h4>Checkbox Options (Basic):</h4>
                    <PwcaCheckboxOptions />
                </div>
                <div v-if="$options.components && $options.components.PwcaProductAccessories">
                    <h4>Product Accessories (Basic):</h4>
                    <PwcaProductAccessories />
                </div>
                <div v-if="$options.components && $options.components.CustomColorsButton">
                    <h4>Custom Colors (Basic):</h4>
                    <CustomColorsButton />
                </div>
            </div>
        `
    });

    app.mount('#vue-dynamic-product-area');
}
