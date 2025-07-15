# 项目编码与开发规范 (V1.0)

## 1. 概述 (Overview)

本规范旨在为 `pw-canvas` 项目提供一套统一的编码、文件组织和工作流程标准。所有项目成员**必须**严格遵守本规范，以确保代码的一致性、可维护性和高质量。

---

## 2. 文件与目录结构 (File and Directory Structure)

项目遵循关注点分离的原则，将后台管理 (`admin`)、前台展示 (`public`) 和核心逻辑 (`includes`) 严格区分。

```bash
.
├── admin/                  # 后台管理模块
│   ├── css/                # 后台专用样式
│   ├── js/                 # 后台专用脚本
│   └── partials/           # 后台PHP视图模板 (不含JS/CSS)
├── includes/               # 核心逻辑与功能类 (不含任何前端代码)
├── languages/              # 国际化语言文件
├── public/                 # 前台展示模块
│   ├── css/                # 前台样式 (包含SCSS源文件)
│   ├── js/                 # 前台脚本
│   └── partials/           # 前台PHP视图模板和Vue组件源文件
├── pw-admin.php            # 插件主入口文件
└── uninstall.php           # 卸载脚本
```

---

## 3. 命名规范 (Naming Conventions)

清晰、一致的命名是代码可读性的基石。

- **PHP 类 (Classes):**
  - 采用大驼峰命名法 (PascalCase)。
  - **必须**以项目前缀 `PwAdmin` 开始（或根据功能模块细分，如 `Pw_Admin`）。
  - **示例:** `class PwAdmin`, `class PwAdminLoader`, `class PwAdminPublic`

- **函数与方法 (Functions & Methods):**
  - 采用小驼峰命名法 (camelCase)。
  - **必须**具有描述性，以动词或动宾短语开头。
  - **示例:** `defineAdminHooks()`, `loadDependencies()`, `getUserData()`

- **变量 (Variables):**
  - 采用小驼峰命名法 (camelCase)。
  - **必须**为名词或描述性词语。
  - **示例:** `$pluginName`, `let layerManager`, `const canvasElement`

- **文件 (Files):**
  - PHP 类文件**建议**采用 `class-` 前缀，并用小写连字符 (`-`) 分隔。
  - CSS/JS 文件名应与关联的模块/组件名保持一致。
  - **示例:** `class-pw-admin.php`, `pw-admin-public.css`, `layer-manager.js`

- **通用原则:**
  - **禁止**使用无意义的缩写（如 `btn` 应写为 `button`）。
  - 命名**必须**语义化，清晰表达其用途。

---

## 4. PHP 开发规范 (PHP Development Standards)

- **版本兼容:** 代码**必须**兼容 PHP 5.6 及以上版本。
- **代码注释:**
  - 所有类、方法和函数**必须**遵循 [PHPDoc](https://docs.phpdoc.org/) 规范进行注释，清晰说明其功能、参数和返回值。
  - **示例:**
    ```php
    /**
     * 加载插件所依赖的文件。
     *
     * @since    1.0.0
     * @access   private
     */
    private function loadDependencies() {
        // ...
    }
    ```
- **代码分离:**
  - PHP 文件**只负责**后端逻辑、数据处理和模板渲染。
  - **严禁**在 PHP 文件中使用 `echo` 或 heredoc 大段输出 HTML、CSS 或 JavaScript 代码。
  - 数据传递给前端时，**建议**使用 `wp_localize_script` (如果是WordPress) 或通过 HTML `data-*` 属性。

---

## 5. JavaScript 开发规范 (JavaScript Development Standards)

- **代码注释:**
  - 所有公开的函数、类和复杂的逻辑块**必须**遵循 [JSDoc](https://jsdoc.app/) 规范进行注释。
  - **示例:**
    ```javascript
    /**
     * 初始化3D模型并将其添加到场景中。
     * @param {string} modelUrl - 模型的URL路径。
     * @param {THREE.Scene} scene - 要添加模型的Three.js场景对象。
     * @returns {THREE.Object3D} 加载后的模型对象。
     */
    function initializeModel(modelUrl, scene) {
        // ...
    }
    ```
- **代码分离 (核心规则):**
  - **严禁**将 JavaScript 代码与 PHP/HTML 文件混合。
  - **禁止**在 `.php` 或 `.html` 文件中直接使用 `<script>...</script>` 标签嵌入代码。
  - **禁止**在 HTML 标签中使用行内事件处理器 (如 `onclick`, `onmouseover`)。
  - 所有 JavaScript 代码**必须**存放在独立的 `.js` 文件中（如 `public/js/main.js`），并通过 `<script src="..."></script>` 引入。

---

## 6. Vue.js 组件规范 (Vue.js Component Standards)

- **引入方式:** 项目采用 CDN 方式在运行时加载 Vue.js 库。
- **代码组织:**
  - **必须**以单文件组件 (`.vue` 文件) 的形式组织代码，如 `product-card.vue`。这便于开发和维护，即使最终不通过构建工具编译。
  - 每个 `.vue` 文件**必须**包含 `<template>`, `<script>`, `<style scoped>` 三个部分。`scoped` 属性可以防止组件样式污染全局。
- **示例 (`public/partials/product-card.vue`):**
  ```vue
  <template>
    <div class="product-card">
      <img :src="product.imageUrl" :alt="product.name" class="product-card__image">
      <h3 class="product-card__name">{{ product.name }}</h3>
      <button @click="addToCart" class="product-card__button">Add to Cart</button>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ProductCard',
    props: {
      product: {
        type: Object,
        required: true
      }
    },
    methods: {
      addToCart() {
        this.$emit('add-to-cart', this.product.id);
      }
    }
  };
  </script>
  
  <style scoped>
  .product-card {
    border: 1px solid #eee;
    padding: 16px;
    text-align: center;
  }
  .product-card__image {
    max-width: 100%;
    height: auto;
  }
  .product-card__name {
    margin: 10px 0;
  }
  </style>
  ```

---

## 7. CSS/SCSS 开发规范 (CSS/SCSS Development Standards)

- **方法论:** **推荐**采用 BEM (Block, Element, Modifier) 命名约定，与组件化思想保持一致。
  - **示例:** `.product-card` (Block), `.product-card__image` (Element), `.product-card--featured` (Modifier)。

- **前缀:** 为防止样式冲突，所有非局部的 CSS 类名**建议**添加项目前缀。
  - **示例:** `.pw-button`, `.pw-modal`

- **SCSS:** **鼓励**使用 SCSS 提升样式的可维护性，如使用变量、嵌套和 mixin。`public/css/template-canvas-display.scss` 是一个很好的例子。

- **文件分离:** 通用样式、后台样式和前台样式**必须**分离在不同的文件中。