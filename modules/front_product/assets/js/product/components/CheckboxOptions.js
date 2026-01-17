
/**
 * Checkbox Options Component
 * 提供两个复选框：Buy Sample 和 Blank Product
 */


// 修复 Pinia store 引入和 Vue 3 组件写法

// 1. 确保 Vue 和 Pinia API 正确获取
const { ref, onMounted, watch } = Vue;



const CheckboxOptions = {
    name: 'CheckboxOptions',
    template: `
        <div class="pw-checkbox-options">
            <label v-show="store.showBuySampleCheckbox">
                <input type="checkbox" v-model="store.buySampleChecked"> Buy Sample
            </label>
            <label v-show="store.showBlankProductCheckbox">
                <input type="checkbox" v-model="store.blankProductChecked"> Blank Product
            </label>
        </div>
    `,
    setup() {
        // 2. 访问 Pinia store
        const store = useProductStore();

        // 4. 方法
        const updateCheckboxStates = () => {
            // 从 Store 获取数据而不是直接调用 API
            if (store.productData && store.productData.apiData) {
                const apiData = store.productData.apiData;
                store.setBuySampleChecked(false); // 默认值或根据需要设置
                store.setBlankProductChecked(apiData?.product?.data?.blank_item || false);
            }
        };

        // 5. 生命周期和数据监听
        onMounted(() => {
            // 如果数据已经存在，立即更新
            if (store.isDataFetched && store.productData) {
                updateCheckboxStates();
            }
        });

        // 6. 监听 Store 数据变化
        watch(() => store.isDataFetched, (newValue) => {
            if (newValue && store.productData) {
                updateCheckboxStates();
            }
        });

        // 也监听 productData 的变化
        watch(() => store.productData, (newData) => {
            if (newData && newData.apiData) {
                updateCheckboxStates();
            }
        });

        // 7. 返回模板需要的数据和方法
        return {
            store
        };
    }
};

// 7. 导出到全局
window.CheckboxOptions = CheckboxOptions;