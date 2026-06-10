
/**
 * Checkbox Options Component
 * 提供两个复选框：Buy Sample 和 Blank Product
 */

const PwcaCheckboxOptions = {
    name: 'PwcaCheckboxOptions',
    template: `
        <div class="pw-checkbox-options">
            <label v-show="store.showBuySampleCheckbox">
                <input
                    type="checkbox"
                    :checked="store.buySampleChecked"
                    @change="onBuySampleChange($event.target.checked)"
                > Buy Sample
            </label>
            <label v-show="store.showBlankProductCheckbox">
                <input
                    type="checkbox"
                    :checked="store.blankProductChecked"
                    @change="onBlankProductChange($event.target.checked)"
                > Blank Product
            </label>
        </div>
    `,
    setup() {
        const store = window.pwcaUseProductStore();

        const onBuySampleChange = (checked) => {
            store.setBuySampleChecked(checked);
        };

        const onBlankProductChange = (checked) => {
            store.setBlankProductChecked(checked);
        };

        return {
            store,
            onBuySampleChange,
            onBlankProductChange
        };
    }
};

// 7. 导出到全局
window.pwcaCheckboxOptions = PwcaCheckboxOptions;
