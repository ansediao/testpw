/**
 * 颜色变体模块
 * 基于 Vue 3 Composition API 实现的颜色选择器
 */

// 颜色变体组件
const ColorVariants = {
    template: `
        <div v-if="showVariants" class="pw-color-variants-module">
            <div class="pw-color-variants-header">
                <h4>Select Color:</h4>
            </div>
            
            <div class="pw-color-variants-grid">
                <div v-if="loading" class="pw-loading-variants">加载颜色选项中...</div>
                <div v-else-if="error" class="pw-loading-variants error">{{ error }}</div>
                <div v-else-if="variants.length === 0" class="pw-loading-variants">该产品暂无颜色变体</div>
                <div v-else class="pw-variants-container">
                    <div 
                        v-for="(variant, index) in variants" 
                        :key="variant.id"
                        class="pw-color-variant-item"
                        :class="{ selected: selectedVariant?.id === variant.id }"
                        @click="selectVariant(variant)"
                    >
                        <div 
                            class="pw-color-swatch" 
                            :style="{ backgroundColor: variant.variant_color }"
                        ></div>
                    </div>
                </div>
            </div>    
           
        </div>
    `,
    
    setup() {
        const { ref, onMounted, computed } = Vue;
        const productStore = useProductStore();
        
        // 响应式数据
        const loading = ref(true);
        const error = ref('');
        const variants = ref([]);
        const selectedVariant = ref(null);
        
        // 计算属性
        const showVariants = computed(() => {
            return !loading.value && variants.value.length > 0;
        });
        
        // 选择变体
        const selectVariant = (variant) => {
            selectedVariant.value = variant;
            console.log('选择了颜色变体:', variant);
            
            // 通知 Pinia store
            if (productStore.setSelectedVariant) {
                productStore.setSelectedVariant(variant);
            }
        };
        
        // 加载变体数据
        const loadVariants = async () => {
            try {
                loading.value = true;
                error.value = '';
                
                console.log('颜色变体模块：开始加载数据');
                
                // 等待 productDataAPI 可用
                if (typeof window.productDataAPI === 'undefined') {
                    throw new Error('productDataAPI 未加载');
                }
                
                const productData = await window.productDataAPI.fetchCurrentProductData();
                console.log('颜色变体模块：获取到产品数据', productData);
                
                if (!productData.has_variants || !productData.variants || !productData.variants.data) {
                    variants.value = [];
                    return;
                }
                
                variants.value = productData.variants.data;
                console.log('颜色变体模块：解析到变体数据', variants.value);
                
                // 默认选择第一个变体
                if (variants.value.length > 0) {
                    selectedVariant.value = variants.value[0];
                    
                    // 通知 store
                    if (productStore.setSelectedVariant) {
                        productStore.setSelectedVariant(variants.value[0]);
                    }
                }
                
            } catch (err) {
                console.error('颜色变体模块：加载失败', err);
                error.value = '加载颜色选项失败: ' + err.message;
            } finally {
                loading.value = false;
            }
        };
        
        // 生命周期
        onMounted(() => {
            // 延迟加载确保其他依赖已准备好
            setTimeout(loadVariants, 1000);
        });
        
        return {
            loading,
            error,
            variants,
            selectedVariant,
            showVariants,
            selectVariant
        };
    }
};

// 导出组件
window.ColorVariants = ColorVariants;