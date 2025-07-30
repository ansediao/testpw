/**
 * Component Validator
 * 验证所有组件是否正确加载和注册
 */

window.validateComponents = function() {
    console.log('=== PW Canvas 组件验证 ===');
    
    const requiredComponents = {
        'useProductStore': window.useProductStore,
        'ProductQuantity': window.ProductQuantity,
        'ProductPriceInfo': window.ProductPriceInfo,
        'AddToCart': window.AddToCart,
        'ColorVariants': window.ColorVariants,
        'CheckboxOptions': window.CheckboxOptions,
        'productDataAPI': window.productDataAPI
    };
    
    let allLoaded = true;
    
    Object.entries(requiredComponents).forEach(([name, component]) => {
        const isLoaded = !!component;
        const status = isLoaded ? '✅' : '❌';
        console.log(`${status} ${name}: ${isLoaded ? 'Loaded' : 'Missing'}`);
        
        if (!isLoaded) {
            allLoaded = false;
        }
    });
    
    console.log('\n=== Vue 和 Pinia 检查 ===');
    console.log(`✅ Vue: ${typeof Vue !== 'undefined' ? 'Available' : 'Missing'}`);
    console.log(`✅ Pinia: ${typeof Pinia !== 'undefined' ? 'Available' : 'Missing'}`);
    
    console.log('\n=== 挂载点检查 ===');
    const mountPoint = document.getElementById('vue-dynamic-product-area');
    console.log(`${mountPoint ? '✅' : '❌'} vue-dynamic-product-area: ${mountPoint ? 'Found' : 'Missing'}`);
    
    if (mountPoint) {
        const productId = mountPoint.dataset.productId;
        console.log(`📦 Product ID: ${productId || 'Not set'}`);
    }
    
    console.log('\n=== 总体状态 ===');
    if (allLoaded && typeof Vue !== 'undefined' && typeof Pinia !== 'undefined' && mountPoint) {
        console.log('🎉 所有组件已正确加载，可以初始化应用');
        return true;
    } else {
        console.log('⚠️ 存在缺失的组件或依赖，请检查加载顺序');
        return false;
    }
};

// 自动验证（延迟执行，确保所有脚本都已加载）
setTimeout(() => {
    if (typeof window.validateComponents === 'function') {
        window.validateComponents();
    }
}, 1000);