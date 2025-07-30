
/**
 * Checkbox Options Component
 * 提供两个复选框：Buy Sample 和 Blank Product
 */


// 修复 Pinia store 引入和 Vue 3 组件写法

// 1. 确保 Vue 和 Pinia API 正确获取
const { ref, onMounted } = Vue;



const CheckboxOptions = {
    name: 'CheckboxOptions',
    template: `
        <div class="pw-checkbox-options">
            <label>
                <input type="checkbox" v-model="buySampleChecked"> Buy Sample
            </label>
            <label>
                <input type="checkbox" v-model="blankProductChecked"> Blank Product
            </label>
        </div>
    `,
    setup() {
        // 2. 访问 Pinia store（如未用可移除）
        const productStore = typeof window.useProductStore === 'function' ? window.useProductStore() : {};

        // 3. 响应式数据
        const buySampleChecked = ref(false);
        const blankProductChecked = ref(false);

        // 4. 方法
        const updateCheckboxStates = async () => {
            try {
                // 获取产品数据
                const productData = await window.productDataAPI?.fetchCurrentProductData?.();
                // 更新复选框状态
                buySampleChecked.value = false; // 默认值或根据需要设置
                blankProductChecked.value = productData?.product?.data?.blank_item || false;
            } catch (err) {
                console.error('CheckboxOptions加载失败:', err);
            }
        };

        // 5. 生命周期
        onMounted(() => {
            updateCheckboxStates();
        });

        // 6. 返回模板需要的数据和方法
        return {
            buySampleChecked,
            blankProductChecked
        };
    }
};

// 7. 导出到全局
window.CheckboxOptions = CheckboxOptions;