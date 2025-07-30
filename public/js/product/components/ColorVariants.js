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
                <div v-if="loading" class="pw-loading-variants">
                    <img src="../assets/images/icons/spinner.gif" alt="Loading..." class="pw-loading-spinner">
                </div>
                <div v-else-if="error" class="pw-loading-variants error">{{ error }}</div>
                <div v-else-if="!variants || variants.length === 0" class="pw-loading-variants">该产品暂无颜色变体</div>
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
        const { computed, onMounted, toRefs, watch } = Vue;
        const productStore = useProductStore();

        // 使用 toRefs 确保响应式
        const storeRefs = toRefs(productStore);

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
            // 使用 toRefs 的响应式引用
            loading: storeRefs.loading,
            error: storeRefs.error,
            variants: storeRefs.variants,
            selectedVariant: storeRefs.selectedVariant,
            showVariants,
            selectVariant
        };
    }
};

// 导出组件
window.ColorVariants = ColorVariants;