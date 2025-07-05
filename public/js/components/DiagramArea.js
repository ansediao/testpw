// 这个组件自身不导出模板，因为它会在 main.js 中被用于注册
// 它只是一个逻辑上的父组件，它的模板在 main.js 中定义
// 或者，我们可以让它也包含自己的模板，并且引入子组件
// 为了保持结构清晰，我们在这里定义模板，并在 main.js 中注册子组件

export default {
    // 注意：模板中使用的组件标签 <functional-component-bar> 和 <diagram-content-area>
    // 必须在创建 Vue 应用时被全局注册。
    template: `
          <div class="diagram">
              <functional-component-bar></functional-component-bar>
              <diagram-content-area></diagram-content-area>
          </div>`,
  };
  