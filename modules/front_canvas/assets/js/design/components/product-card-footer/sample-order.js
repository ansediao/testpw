/*
 * 样品订单状态与 Getter 模块（Product Card Footer）
 * 暴露：getIsSampleOrder、quantityDisabled、setIsSampleOrder
 * 说明：在模块内管理样品订单的 UI 状态，并与页面复选框进行同步。
 */
const { ref, computed, onMounted, onBeforeUnmount } = window.Vue;

export function useSampleOrder() {
  const isSampleOrder = ref(false);
  const setIsSampleOrder = (value) => {
    isSampleOrder.value = Boolean(value);
  };

  const getIsSampleOrder = computed(() => isSampleOrder.value);
  const quantityDisabled = computed(() => isSampleOrder.value);

  let removeSampleCheckboxListener = null;
  const handleSampleCheckboxChange = (event) => {
    setIsSampleOrder(event?.target?.checked);
  };

  onMounted(() => {
    const sampleCheckbox = document.querySelector('.sample-check input#sample');
    if (sampleCheckbox) {
      setIsSampleOrder(sampleCheckbox.checked);
      sampleCheckbox.addEventListener('change', handleSampleCheckboxChange);
      removeSampleCheckboxListener = () => {
        sampleCheckbox.removeEventListener('change', handleSampleCheckboxChange);
      };
    }
  });

  onBeforeUnmount(() => {
    if (typeof removeSampleCheckboxListener === 'function') {
      removeSampleCheckboxListener();
    }
  });

  return { getIsSampleOrder, quantityDisabled, setIsSampleOrder };
}