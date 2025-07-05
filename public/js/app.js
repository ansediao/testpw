// js/app.js

// 通过 window.wpData 访问从 WordPress 传递过来的数据
// console.log('app.js module loaded.');
// console.log(wpData); 
// console.log(window.wpData); 
// console.log(window.wpData.headerData);



// 1. 从全局 Vue 对象解构出 createApp
const { createApp } = Vue;

// 2. 导入所有组件




import HeaderComponent from './components/HeaderComponent.js?v=2';
import CollapsibleArea from './components/CollapsibleArea.js';
import MainOperationArea from './components/MainOperationArea.js';
import DiagramArea from './components/DiagramArea.js';
import FunctionalComponentBar from './components/FunctionalComponentBar.js?t=5';
import DiagramContentArea from './components/DiagramContentArea.js?v=26';
import FooterComponent from './components/FooterComponent.js?v=4';

// 3. 创建 Vue 应用实例
// 根组件的模板现在已移至 index.html
const app = createApp({});

// 4. 全局注册所有导入的组件
app.component('header-component', HeaderComponent);
app.component('collapsible-area', CollapsibleArea);
app.component('main-operation-area', MainOperationArea);
app.component('diagram-area', DiagramArea);
app.component('functional-component-bar', FunctionalComponentBar);
app.component('diagram-content-area', DiagramContentArea);
app.component('footer-component', FooterComponent);




// 5. 挂载应用
app.mount('#app');
