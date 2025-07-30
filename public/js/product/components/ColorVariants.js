/**
 * 颜色变体模块
 * 基于 Vue 3 Composition API 实现的颜色选择器
 */

// 颜色变体组件
const ColorVariants = {
    template: `
        <div class="pw-color-variants-module">
            <div class="pw-color-variants-header">
                <h4>Select Color:</h4>
            </div>
            

            
            <div class="pw-color-variants-grid">
                <div v-if="store.loading" class="pw-loading-variants">
                    <img src="../assets/images/icons/spinner.gif" alt="Loading..." class="pw-loading-spinner">
                </div>
                <div v-else-if="store.error" class="pw-loading-variants error">{{ store.error }}</div>
                <div v-else-if="!store.variants || store.variants.length === 0" class="pw-loading-variants">该产品暂无颜色变体</div>
                <div v-else class="pw-variants-container">
                    <div 
                        v-for="(variant, index) in store.variants" 
                        :key="variant.id"
                        class="pw-color-variant-item"
                        :class="{ selected: store.selectedVariant?.id === variant.id }"
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
        const { computed, onMounted, watch } = Vue;
        const productStore = useProductStore();

        onMounted(() => {
        });

        // 直接使用 Store 中的响应式数据
        const showVariants = computed(() => {
            const hasVariants = !productStore.loading && productStore.variants.length > 0;
            console.log('ColorVariants: showVariants 计算', {
                loading: productStore.loading,
                variantsLength: productStore.variants.length,
                variants: productStore.variants,
                hasVariants
            });
            return hasVariants;
        });

        // 选择变体
        const selectVariant = (variant) => {
            console.log('选择了颜色变体:', variant);
            productStore.setSelectedVariant(variant);
        };

        return {
            // 直接返回 store 而不是使用 toRefs
            store: productStore,
            showVariants,
            selectVariant
        };
    }
};

// 导出组件
window.ColorVariants = ColorVariants;