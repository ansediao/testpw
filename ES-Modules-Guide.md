# 无构建工具的 ES 模块化方案

## 核心思路

使用原生 ES 模块（`import`/`export`）+ Import Maps，无需 Webpack/Vite 等构建工具。
Import Maps 是 WHATWG HTML 标准的一部分，Chrome 89+、Firefox 108+、Safari 16.4+ 均已原生支持。

## 关键要点

### 1. 使用相对路径导入（基础方案）

```javascript
// 正确：使用相对路径
import { helper } from './utils.js'
import { Component } from './components/Component.js'

// 裸模块标识符需要 import map（见下文）
import lodash from 'lodash'
```

### 2. Import Maps（推荐方案）

在 HTML 的 `<head>` 中声明 `<script type="importmap">`，让浏览器能解析裸模块标识符：

```html
<!DOCTYPE html>
<html>
<head>
  <script type="importmap">
  {
    "imports": {
      "@app/utils":    "./modules/utils.js",
      "@app/components": "./modules/components/index.js",
      "@app/state":    "./modules/state.js"
    }
  }
  </script>
</head>
<body>
  <!-- importmap 必须在所有 type="module" 脚本之前 -->
  <script type="module">
    // 裸标识符 → 由 import map 解析
    import { formatDate } from '@app/utils'
    import { Button }     from '@app/components'
  </script>
</body>
</html>
```

**Import Maps 规则：**
- 每个文档只能有一个 `<script type="importmap">`
- 必须放在所有 `<script type="module">` 之前（建议放 `<head>` 里）
- 映射的值必须是有效的 URL（相对路径相对于文档 URL）
- 不处理传递依赖和版本冲突（需手动管理）
- 不能通过 JavaScript 动态添加

### 3. 减少全局变量暴露

**ES 模块天然隔离作用域：**

```javascript
// 旧方式：污染全局
var MyLib = { ... }

// ES 模块：零全局变量
// 模块内的变量对外不可见，只有 export 的内容可见
export function doSomething() { ... }

// 内部实现完全隐藏
const PRIVATE_KEY = 'secret'  // 外部不可访问
```

**单一入口点模式：**

```javascript
// index.js — 汇总导出
export { App }       from './App.js'
export { useStore }  from './state.js'
export { formatDate } from './utils.js'

// 使用方只需一个 import 路径
import { App, useStore, formatDate } from './index.js'
```

**与全局变量共存（渐进迁移）：**

```javascript
// 如果必须暴露一个全局变量（兼容旧代码）
// 仅在入口模块中这样做，其他模块全部用 import/export
window.__APP_VERSION__ = '1.0.0'

// 更好的方式：用 import map + 模块，彻底消除全局变量
```

### 4. 项目结构示例

```
project/
├── index.html              ← 包含 importmap
├── modules/
│   ├── app.js              ← 入口模块
│   ├── utils.js            ← 工具函数（export）
│   ├── state.js            ← 状态管理
│   └── components/
│       ├── index.js        ← 汇总导出
│       ├── Header.js
│       └── Footer.js
└── styles/
    └── main.css
```

## 最简演示代码

见 `demo/` 目录，包含两个完整可运行示例：

- `demo/index.html` — 基础相对路径方案
- `demo/importmap-demo/index.html` — Import Maps 方案（推荐）

## 启动静态服务器

Import Maps 需要 HTTP 服务器（不能用 `file://` 协议）：

```bash
# 方案 A：servor（推荐，自动刷新）
npx servor . index.html 8080 --reload

# 方案 B：Python
python -m http.server 8080

# 方案 C：Node.js
npx serve .

# 方案 D：PHP（如果已在用）
php -S localhost:8080
```

## Import Maps vs 构建工具

| 特性           | Import Maps | 构建工具（Vite/Webpack） |
| -------------- | ----------- | ----------------------- |
| 零配置         | 是          | 需要配置文件            |
| 开发体验       | 即改即刷新  | HMR（更快）            |
| 代码分割       | 手动        | 自动                    |
| Tree Shaking   | 不支持      | 支持                    |
| 传递依赖       | 手动管理    | 自动解析                |
| 生产环境优化   | 无          | 压缩/混淆/分包          |
| 学习成本       | 极低        | 中等                    |

**适用场景：** 内部工具、原型、小项目、不想引入 Node.js 生态的场景。
