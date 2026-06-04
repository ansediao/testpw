import { defineComponent, ref, computed } from 'vue';
import { formatMessage } from '../modules/utils.js';

export default defineComponent({
    name: 'Greeter',
    props: {
        name: { type: String, default: 'World' }
    },
    emits: ['greet'],
    setup(props, { emit }) {
        const lang = ref('zh');
        const greeting = computed(() => formatMessage(props.name, lang.value));

        function say() {
            emit('greet', { name: props.name, msg: greeting.value });
        }

        return { lang, greeting, say };
    },
    template: `
        <div class="card">
            <h3>2. 问候 <span class="tag">props + emit</span></h3>
            <p class="desc">演示：父组件传值、子组件触发事件</p>
            <p>收到 name prop: <code>{{ name }}</code></p>
            <div class="display">{{ greeting }}</div>
            <button class="btn" :class="{ secondary: lang==='zh' }" @click="lang='zh'">中文</button>
            <button class="btn" :class="{ secondary: lang==='en' }" @click="lang='en'">English</button>
            <button class="btn" :class="{ secondary: lang==='ja' }" @click="lang='ja'">日本語</button>
            <div style="margin-top:8px">
                <button class="btn primary" @click="say">向父组件 emit</button>
            </div>
        </div>
    `
});
