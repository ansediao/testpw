# ES Modules + Import Maps: 零构建工具的模块化方案

## 核心优势

✅ **作用域隔离** - 每个模块都有独立作用域，变量不会泄漏到全局
✅ **无需构建工具** - 浏览器原生支持，无需 webpack/vite
✅ **清晰的依赖关系** - import/export 明确声明依赖
✅ **Import Maps** - 简化模块路径，支持类似 Node.js 的导入语法

## 基础架构

### 1. 目录结构
```
project/
├── index.html
├── importmap.json      # 可选：外部 import map
├── src/
│   ├── main.js         # 入口模块
│   ├── utils.js        # 工具函数
│   ├── counter.js      # 示例模块
│   └── components/
│       └── button.js   # 组件模块
└── README.md
```

### 2. HTML 配置

```html
<!DOCTYPE html>
<html>
<head>
    <!-- Import Map 必须在任何 module script 之前 -->
    <script type="importmap">
    {
        "imports": {
            "lodash": "https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/lodash.js",
            "@utils/": "./src/utils/",
            "@components/": "./src/components/"
        }
    }
    </script>
</head>
<body>
    <!-- 入口模块 -->
    <script type="module" src="./src/main.js"></script>
</body>
</html>
```

## 作用域隔离演示

### ❌ 传统脚本的问题（全局污染）

```html
<!-- 传统脚本 - 全局作用域 -->
<script src="legacy.js"></script>
<script>
    // legacy.js 中的变量会泄漏到全局
    console.log(window.myVar); // 可能存在！
    console.log(myVar); // 直接访问！
</script>
```

### ✅ ES Modules 的解决方案

```javascript
// src/utils.js
// 这些变量被封装在模块作用域内
const privateHelper = () => '私有函数';
let internalState = 0;

// 只导出需要暴露的接口
export function publicHelper() {
    internalState++;
    return privateHelper();
}

export function getState() {
    return internalState;
}
```

```javascript
// src/main.js
import { publicHelper, getState } from './utils.js';

console.log(publicHelper()); // ✅ 可以访问
console.log(getState());     // ✅ 可以访问

// 以下都会失败 - 作用域隔离！
// console.log(privateHelper);  // ❌ ReferenceError
// console.log(internalState);  // ❌ ReferenceError
```

## Import Maps 使用技巧

### 1. 别名映射

```html
<script type="importmap">
{
    "imports": {
        "lodash": "https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/lodash.js",
        "@": "./src/",
        "@utils": "./src/utils.js",
        "@components": "./src/components/"
    }
}
</script>
```

```javascript
// 现在可以使用简洁的导入路径
import _ from 'lodash';
import { debounce } from '@utils';
import Button from '@components/button.js';
```

### 2. 多版本管理（Scoped Imports）

```html
<script type="importmap">
{
    "imports": {
        "lodash": "https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/lodash.js"
    },
    "scopes": {
        "/src/legacy/": {
            "lodash": "https://cdn.jsdelivr.net/npm/lodash-es@3.10.1/lodash.js"
        }
    }
}
</script>
```

### 3. 条件导入（开发/生产环境）

```javascript
// 根据环境动态选择
const isDev = location.hostname === 'localhost';

if (isDev) {
    const { logger } = await import('./dev-tools.js');
    logger.enable();
}
```

## 最佳实践

### 1. 最小化全局暴露

```javascript
// ✅ 推荐：使用 IIFE 封装初始化逻辑
(() => {
    // 应用初始化
    initApp();
})();

// ❌ 避免：直接暴露到全局
window.app = new App();
window.utils = utils;
```

### 2. 导出设计原则

```javascript
// utils.js - 命名导出（推荐）
export function formatDate() { /*...*/ }
export function validate() { /*...*/ }

// 或者默认导出（单个主要功能）
export default class Router { /*...*/ }
```

### 3. 错误边界处理

```javascript
// main.js
try {
    const { init } = await import('./app.js');
    init();
} catch (error) {
    console.error('模块加载失败:', error);
    // 优雅降级
}
```

## 完整示例

查看 [demo/](./demo/) 目录获取完整可运行的示例。

## 浏览器兼容性

- ✅ Chrome 89+
- ✅ Edge 89+
- ✅ Safari 16.4+
- ✅ Firefox 108+
- ❌ IE 11（需要 polyfill 或构建工具）

## 调试技巧

1. **查看模块依赖**：Chrome DevTools → Network → 勾选 "Import" 过滤器
2. **断点调试**：在 Sources 面板中可以直接调试 ES modules
3. **作用域检查**：在 Console 中尝试访问未导出的变量会报错

## 常见问题

### Q: Import Map 支持动态更新吗？
A: 不支持。Import Map 必须在任何模块加载之前定义，且只能有一个。

### Q: 可以在 Node.js 中使用 Import Maps 吗？
A: Node.js 18+ 支持实验性 import map（通过 `--experimental-import-map` 标志）。

### Q: 模块会自动缓存吗？
A: 是的。浏览器会缓存模块，同一 URL 的模块只加载一次。

## 参考资料

- [MDN: JavaScript Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [MDN: Import Maps](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap)
- [WICG Import Maps Spec](https://github.com/nicolo-ribaudo/import-maps-extension)
