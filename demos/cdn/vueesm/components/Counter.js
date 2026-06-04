import { defineComponent, ref } from 'vue';
import { double } from '../modules/utils.js';

export default defineComponent({
    name: 'Counter',
    setup() {
        const count = ref(0);
        const inc = () => count.value++;
        const dec = () => count.value--;
        return { count, inc, dec, double };
    },
    template: `
        <div class="card">
            <h3>1. 计数器 <span class="tag">ref + 事件</span></h3>
            <p class="desc">演示：单文件组件 + ref 响应式</p>
            <div class="display">
                count = <span class="hl">{{ count }}</span>
                · double(count) = <span class="hl">{{ double(count) }}</span>
            </div>
            <button class="btn" @click="inc">+1</button>
            <button class="btn secondary" @click="dec">-1</button>
        </div>
    `
});
