import { createApp, defineComponent, ref } from 'vue';
import Counter from './components/Counter.js';
import Greeter from './components/Greeter.js';
import APP_NAME, { double } from './modules/utils.js';

const App = defineComponent({
    components: { Counter, Greeter },
    setup() {
        const userName = ref('PWCA');
        const logs = ref([]);

        function onGreet(payload) {
            logs.value.unshift(`emit 收到: ${JSON.stringify(payload)}`);
        }

        return { userName, logs, onGreet, APP_NAME, double };
    },
    template: `
        <div class="container">
            <header>
                <h1>&lt;Vue 3 /&gt; ESM 模块化演示</h1>
                <p>浏览器原生 <code>&lt;script type="module"&gt;</code> + <code>importmap</code>，零打包</p>
            </header>

            <div class="info">
                <strong>核心原理：</strong>
                <code>import</code> ESM 模块 ·
                <code>defineComponent</code> 单文件组件 ·
                <code>ref</code> 响应式 ·
                <code>props / emit</code> 组件通信
            </div>

            <div class="section">文件结构</div>
            <pre class="tree">vueesm/
├── <span class="entry">index.html</span>     入口（importmap 指向 unpkg）
├── <span class="entry">app.js</span>         createApp + 注册组件
├── <span class="dir">modules/</span>
│   └── <span class="file">utils.js</span>     具名 + 默认导出
└── <span class="dir">components/</span>
    ├── <span class="file">Counter.js</span>   ref + 事件
    └── <span class="file">Greeter.js</span>   props + emit</pre>

            <div class="section">演示结果</div>
            <div class="grid">
                <counter />
                <greeter :name="userName" @greet="onGreet" />
            </div>

            <div class="section">父组件收到的事件</div>
            <div class="card">
                <p>当前传入子组件的 name = <code>{{ userName }}</code></p>
                <p>app.js 中 <code>APP_NAME</code>（默认导入） = <code>{{ APP_NAME }}</code></p>
                <p><code>double(21)</code> = <code>{{ double(21) }}</code></p>
                <ul class="logs">
                    <li v-for="(l, i) in logs" :key="i">{{ l }}</li>
                    <li v-if="logs.length === 0" class="empty">（点击子组件的「emit」按钮）</li>
                </ul>
            </div>
        </div>
    `
});

createApp(App).mount('#app');
console.log('[app.js] Vue 3 ESM 应用已挂载');
console.log('[app.js] 模块作用域验证: window.double =', typeof window.double);
