/**
 * 颜色变体模块
 * 基于 Vue 3 Composition API 实现的颜色选择器
 */

// 颜色变体组件
const ColorVariants = {
    template: `
        <div class="pwca-color-variants-module">
            <div class="pwca-color-variants-header">
                <h4>Select Color:</h4>
            </div>
            

            
            <div class="pw-color-variants-grid">
                <div v-if="store.loading" class="pw-loading-variants">
                    <div class="pw-loading-spinner"></div>
                </div>
                <div v-else-if="store.error" class="pw-loading-variants error">{{ store.error }}</div>
                <div v-else-if="!store.variants || store.variants.length === 0" class="pw-loading-variants">No color variants available for this product</div>
                <div v-else class="pw-variants-container">
                    <div 
                        v-for="(variant, index) in store.variants.filter(v => v.variant_color)" 
                        :key="variant.id"
                        class="pwca-color-variant-item"
                        :class="{ 
                            selected: store.selectedVariant?.id === variant.id,
                            disabled: !isVariantClickable
                        }"
                        @click="selectVariant(variant)"
                    >
                        <div 
                            class="pwca-color-swatch" 
                            :style="{ backgroundColor: variant.variant_color }"
                        ></div>
                    </div>
                </div>
            </div>    
           
        </div>
    `,

    setup() {
        const { computed, onMounted, watch } = Vue;
        const store = useProductStore();

        onMounted(() => {
        });

        // 直接使用 Store 中的响应式数据
        const showVariants = computed(() => {
            const hasVariants = !store.loading && store.variants.length > 0;
            // ColorVariants: showVariants 计算
            return hasVariants;
        });

        // 计算颜色变体是否可以点击
        const isVariantClickable = computed(() => {
            // 如果选择了买样品，但是不提供颜色样品服务，则不可点击
            if (store.buySampleChecked && !store.colorSampleService) {
                return false;
            }
            return true;
        });

        // 选择变体
        const selectVariant = (variant) => {
            // 检查是否可以点击
            if (!isVariantClickable.value) {
                // 颜色变体不可点击：买样品模式但不提供颜色样品服务
                return;
            }

            window.ProductColorSelectionBridge.applyVariantSelection(variant, store);
        };

        return {
            // 直接返回 store 而不是使用 toRefs
            store,
            showVariants,
            isVariantClickable,
            selectVariant
        };
    }
};

// 导出组件
window.ColorVariants = ColorVariants;
