/**
 * MOQ Debugger Tool
 * 用于调试和测试MOQ功能的工具
 */

window.MOQDebugger = {
    
    /**
     * 获取当前store状态
     */
    getStoreState() {
        if (typeof useProductStore === 'undefined') {
            console.error('ProductStore not available');
            return null;
        }
        
        const store = useProductStore();
        return {
            quantity: store.quantity,
            minQuantity: store.minQuantity,
            maxQuantity: store.maxQuantity,
            stepQuantity: store.stepQuantity,
            moqSettings: store.moqSettings,
            isValidQuantity: store.isValidQuantity,
            productData: store.productData
        };
    },
    
    /**
     * 打印当前状态
     */
    printState() {
        const state = this.getStoreState();
        if (state) {
            console.group('🔍 MOQ Debugger - Current State');
            console.log('Current Quantity:', state.quantity);
            console.log('Min Quantity:', state.minQuantity);
            console.log('Max Quantity:', state.maxQuantity);
            console.log('Step Quantity:', state.stepQuantity);
            console.log('Is Valid:', state.isValidQuantity);
            console.log('MOQ Settings:', state.moqSettings);
            console.groupEnd();
        }
    },
    
    /**
     * 测试数量修正功能
     */
    testQuantityCorrection(testQuantities = [1, 5, 15, 25, 100]) {
        if (typeof useProductStore === 'undefined') {
            console.error('ProductStore not available');
            return;
        }
        
        const store = useProductStore();
        console.group('🧪 Testing Quantity Correction');
        
        testQuantities.forEach(qty => {
            const corrected = store.correctedQuantity(qty);
            console.log(`Input: ${qty} → Corrected: ${corrected}`);
        });
        
        console.groupEnd();
    },
    
    /**
     * 模拟MOQ设置更新
     */
    simulateMOQUpdate(settings) {
        if (typeof useProductStore === 'undefined') {
            console.error('ProductStore not available');
            return;
        }
        
        const defaultSettings = {
            minimum_order_quantity: 10,
            batch_quantity: 5,
            sell_in_batch: true
        };
        
        const newSettings = { ...defaultSettings, ...settings };
        
        console.group('🔄 Simulating MOQ Update');
        console.log('New Settings:', newSettings);
        
        const store = useProductStore();
        store.setMoqSettings(newSettings);
        
        console.log('Updated State:');
        this.printState();
        console.groupEnd();
    },
    
    /**
     * 检查API数据
     */
    checkAPIData() {
        if (typeof useProductStore === 'undefined') {
            console.error('ProductStore not available');
            return;
        }
        
        const store = useProductStore();
        const apiData = store.productData?.apiData;
        
        console.group('📡 API Data Analysis');
        
        if (!apiData) {
            console.warn('No API data available');
            console.groupEnd();
            return;
        }
        
        console.log('Has Product Data:', apiData.has_product_data);
        
        if (apiData.has_product_data && apiData.product?.data) {
            const productData = apiData.product.data;
            console.log('MOQ Setting:', productData.moq_setting);
            console.log('Direct MOQ Fields:', {
                minimum_order_quantity: productData.minimum_order_quantity,
                batch_quantity: productData.batch_quantity,
                sell_in_batch: productData.sell_in_batch
            });
        }
        
        console.groupEnd();
    },
    
    /**
     * 运行完整的MOQ测试套件
     */
    runFullTest() {
        console.group('🚀 MOQ Full Test Suite');
        
        console.log('1. Current State:');
        this.printState();
        
        console.log('\n2. API Data:');
        this.checkAPIData();
        
        console.log('\n3. Quantity Correction Test:');
        this.testQuantityCorrection();
        
        console.log('\n4. MOQ Update Simulation:');
        this.simulateMOQUpdate({
            minimum_order_quantity: 20,
            batch_quantity: 10,
            sell_in_batch: true
        });
        
        console.log('\n5. Final State:');
        this.printState();
        
        console.groupEnd();
    },
    
    /**
     * 重置MOQ设置为默认值
     */
    resetMOQ() {
        if (typeof useProductStore === 'undefined') {
            console.error('ProductStore not available');
            return;
        }
        
        const store = useProductStore();
        store.setMoqSettings({
            minimum_order_quantity: 1,
            batch_quantity: 1,
            sell_in_batch: false
        });
        
        console.log('✅ MOQ settings reset to default');
        this.printState();
    },
    
    /**
     * 获取帮助信息
     */
    help() {
        console.group('📖 MOQ Debugger Help');
        console.log('Available methods:');
        console.log('• MOQDebugger.printState() - 打印当前状态');
        console.log('• MOQDebugger.testQuantityCorrection([1,5,15]) - 测试数量修正');
        console.log('• MOQDebugger.simulateMOQUpdate({minimum_order_quantity: 10}) - 模拟MOQ更新');
        console.log('• MOQDebugger.checkAPIData() - 检查API数据');
        console.log('• MOQDebugger.runFullTest() - 运行完整测试');
        console.log('• MOQDebugger.resetMOQ() - 重置MOQ设置');
        console.log('• MOQDebugger.help() - 显示帮助');
        console.groupEnd();
    }
};

// 自动运行初始检查（仅在开发环境）
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            if (typeof useProductStore !== 'undefined') {
                console.log('🔧 MOQ Debugger loaded. Type MOQDebugger.help() for usage.');
            }
        }, 2000);
    });
}