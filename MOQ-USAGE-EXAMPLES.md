# MOQ 使用示例

## 在Vue组件中使用MOQ数据

### 1. 基础用法 - 获取MOQ状态

```javascript
const MyComponent = {
    setup() {
        const store = useProductStore();
        const { toRefs } = Vue;
        const storeRefs = toRefs(store);
        
        return {
            // MOQ相关的响应式数据
            quantity: storeRefs.quantity,
            minQuantity: storeRefs.minQuantity,
            maxQuantity: storeRefs.maxQuantity,
            stepQuantity: storeRefs.stepQuantity,
            moqSettings: storeRefs.moqSettings,
            isValidQuantity: storeRefs.isValidQuantity
        };
    },
    
    template: `
        <div>
            <p>当前数量: {{ quantity }}</p>
            <p>最小数量: {{ minQuantity }}</p>
            <p v-if="moqSettings.sell_in_batch">
                批次销售，每批 {{ stepQuantity }} 个
            </p>
            <p v-if="!isValidQuantity" class="error">
                数量无效，请输入 {{ minQuantity }} - {{ maxQuantity }} 之间的值
            </p>
        </div>
    `
};
```

### 2. 价格计算组件中使用MOQ

```javascript
const PriceCalculator = {
    setup() {
        const store = useProductStore();
        const { toRefs, computed } = Vue;
        const storeRefs = toRefs(store);
        
        // 计算批量折扣
        const bulkDiscount = computed(() => {
            const qty = store.quantity;
            const minQty = store.minQuantity;
            
            if (qty >= minQty * 5) return 0.15; // 15% 折扣
            if (qty >= minQty * 3) return 0.10; // 10% 折扣
            if (qty >= minQty * 2) return 0.05; // 5% 折扣
            return 0;
        });
        
        const finalPrice = computed(() => {
            const basePrice = store.selectedVariantPrice || 0;
            const totalPrice = basePrice * store.quantity;
            const discount = totalPrice * bulkDiscount.value;
            return totalPrice - discount;
        });
        
        return {
            quantity: storeRefs.quantity,
            minQuantity: storeRefs.minQuantity,
            bulkDiscount,
            finalPrice
        };
    },
    
    template: `
        <div class="price-calculator">
            <div class="price-breakdown">
                <p>数量: {{ quantity }}</p>
                <p v-if="bulkDiscount > 0">
                    批量折扣: {{ (bulkDiscount * 100).toFixed(0) }}%
                </p>
                <p class="final-price">
                    总价: ${{ finalPrice.toFixed(2) }}
                </p>
            </div>
            <div v-if="quantity < minQuantity * 2" class="bulk-hint">
                购买 {{ minQuantity * 2 }} 个或更多可享受批量折扣！
            </div>
        </div>
    `
};
```

### 3. 库存检查组件

```javascript
const StockChecker = {
    setup() {
        const store = useProductStore();
        const { toRefs, computed } = Vue;
        const storeRefs = toRefs(store);
        
        const stockStatus = computed(() => {
            const qty = store.quantity;
            const minQty = store.minQuantity;
            const maxQty = store.maxQuantity;
            
            if (qty < minQty) {
                return {
                    status: 'below-minimum',
                    message: `最少需要订购 ${minQty} 个`,
                    class: 'warning'
                };
            }
            
            if (qty > maxQty) {
                return {
                    status: 'exceeds-maximum',
                    message: `超出最大库存 ${maxQty} 个`,
                    class: 'error'
                };
            }
            
            if (store.moqSettings.sell_in_batch) {
                const remainder = (qty - minQty) % store.stepQuantity;
                if (remainder !== 0) {
                    return {
                        status: 'batch-mismatch',
                        message: `请按 ${store.stepQuantity} 的倍数订购`,
                        class: 'info'
                    };
                }
            }
            
            return {
                status: 'valid',
                message: '数量有效',
                class: 'success'
            };
        });
        
        return {
            quantity: storeRefs.quantity,
            stockStatus
        };
    },
    
    template: `
        <div class="stock-checker">
            <div :class="['stock-message', stockStatus.class]">
                {{ stockStatus.message }}
            </div>
        </div>
    `
};
```

### 4. 快速数量选择器

```javascript
const QuickQuantitySelector = {
    setup() {
        const store = useProductStore();
        const { toRefs, computed } = Vue;
        const storeRefs = toRefs(store);
        
        // 生成快速选择选项
        const quickOptions = computed(() => {
            const minQty = store.minQuantity;
            const stepQty = store.stepQuantity;
            const options = [];
            
            // 生成基于MOQ的快速选项
            for (let i = 1; i <= 5; i++) {
                const qty = minQty + (stepQty * (i - 1));
                if (qty <= store.maxQuantity) {
                    options.push({
                        quantity: qty,
                        label: `${qty} 个`,
                        discount: qty >= minQty * 2 ? '5% OFF' : null
                    });
                }
            }
            
            return options;
        });
        
        const selectQuantity = (qty) => {
            store.updateQuantity(qty);
        };
        
        return {
            quantity: storeRefs.quantity,
            quickOptions,
            selectQuantity
        };
    },
    
    template: `
        <div class="quick-quantity-selector">
            <h4>快速选择数量</h4>
            <div class="quick-options">
                <button 
                    v-for="option in quickOptions"
                    :key="option.quantity"
                    @click="selectQuantity(option.quantity)"
                    :class="['quick-btn', { active: quantity === option.quantity }]"
                >
                    {{ option.label }}
                    <span v-if="option.discount" class="discount-badge">
                        {{ option.discount }}
                    </span>
                </button>
            </div>
        </div>
    `
};
```

### 5. MOQ信息显示组件

```javascript
const MOQInfo = {
    setup() {
        const store = useProductStore();
        const { toRefs, computed } = Vue;
        const storeRefs = toRefs(store);
        
        const moqDescription = computed(() => {
            const settings = store.moqSettings;
            const descriptions = [];
            
            descriptions.push(`最小订购量: ${settings.minimum_order_quantity} 个`);
            
            if (settings.sell_in_batch && settings.batch_quantity > 1) {
                descriptions.push(`批次销售: 每批 ${settings.batch_quantity} 个`);
            }
            
            return descriptions;
        });
        
        const estimatedDelivery = computed(() => {
            const qty = store.quantity;
            const minQty = store.minQuantity;
            
            // 根据数量估算交货时间
            if (qty >= minQty * 10) return '7-10 工作日';
            if (qty >= minQty * 5) return '5-7 工作日';
            if (qty >= minQty * 2) return '3-5 工作日';
            return '2-3 工作日';
        });
        
        return {
            moqSettings: storeRefs.moqSettings,
            moqDescription,
            estimatedDelivery
        };
    },
    
    template: `
        <div class="moq-info">
            <h4>订购信息</h4>
            <ul class="moq-details">
                <li v-for="desc in moqDescription" :key="desc">
                    {{ desc }}
                </li>
            </ul>
            <div class="delivery-estimate">
                <strong>预计交货时间:</strong> {{ estimatedDelivery }}
            </div>
        </div>
    `
};
```

## 在现有组件中集成MOQ

### 更新AddToCart组件

```javascript
// 在AddToCart组件中添加MOQ验证
const AddToCart = {
    setup() {
        const store = useProductStore();
        const { toRefs } = Vue;
        const storeRefs = toRefs(store);
        
        const canAddToCart = Vue.computed(() => {
            return store.productData && 
                   store.isValidQuantity && 
                   store.quantity >= store.minQuantity && 
                   !store.loading;
        });
        
        const addToCart = async () => {
            if (!canAddToCart.value) {
                alert(`请输入有效数量 (最少 ${store.minQuantity} 个)`);
                return;
            }
            
            // 执行添加到购物车逻辑
            await store.addToCart();
        };
        
        return {
            quantity: storeRefs.quantity,
            minQuantity: storeRefs.minQuantity,
            isValidQuantity: storeRefs.isValidQuantity,
            loading: storeRefs.loading,
            canAddToCart,
            addToCart
        };
    },
    
    template: `
        <div class="add-to-cart">
            <button 
                @click="addToCart"
                :disabled="!canAddToCart"
                :class="['add-to-cart-btn', { disabled: !canAddToCart }]"
            >
                <span v-if="loading">添加中...</span>
                <span v-else>添加到购物车 ({{ quantity }} 个)</span>
            </button>
            <p v-if="!isValidQuantity" class="error-message">
                最少需要 {{ minQuantity }} 个
            </p>
        </div>
    `
};
```

## 调试和测试

### 在浏览器控制台中测试

```javascript
// 获取当前MOQ状态
const store = useProductStore();
console.log('MOQ Settings:', store.moqSettings);
console.log('Current Quantity:', store.quantity);
console.log('Min Quantity:', store.minQuantity);

// 测试数量修正
console.log('Corrected 15:', store.correctedQuantity(15));

// 模拟MOQ更新
store.setMoqSettings({
    minimum_order_quantity: 20,
    batch_quantity: 10,
    sell_in_batch: true
});

// 使用调试工具
MOQDebugger.runFullTest();
```

### 监听状态变化

```javascript
// 监听MOQ相关状态变化
const store = useProductStore();

Vue.watch(() => store.quantity, (newQty, oldQty) => {
    console.log(`Quantity changed: ${oldQty} → ${newQty}`);
});

Vue.watch(() => store.moqSettings, (newSettings) => {
    console.log('MOQ Settings updated:', newSettings);
}, { deep: true });
```

这些示例展示了如何在不同场景下使用MOQ功能，确保所有组件都能正确响应MOQ设置的变化。