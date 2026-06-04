# ES Modules + Import Maps 演示

## 快速开始

### 方法一：使用本地服务器（推荐）

由于 ES Modules 需要服务器环境，推荐使用以下任一方式启动本地服务器：

#### 使用 Python（推荐）
```bash
# Python 3
cd docs/demo
python -m http.server 8000

# 然后在浏览器中访问 http://localhost:8000
```

#### 使用 Node.js
```bash
# 安装 serve（如果还没有）
npm install -g serve

# 启动服务器
cd docs/demo
serve -p 8000

# 或者使用 npx
npx serve -p 8000
```

#### 使用 VS Code Live Server
1. 安装 VS Code 扩展 "Live Server"
2. 右键点击 `index.html`
3. 选择 "Open with Live Server"

### 方法二：使用 Chrome 启动参数（开发测试）

```bash
# Windows
chrome.exe --allow-file-access-from-files --disable-web-security index.html

# macOS
open -a "Google Chrome" --args --allow-file-access-from-files --disable-web-security index.html

# Linux
google-chrome --allow-file-access-from-files --disable-web-security index.html
```

**注意：** 方法二仅用于本地开发测试，不要在生产环境中使用。

## 演示内容

### 1. 🔒 作用域隔离验证
- 检查模块私有变量是否泄漏到全局作用域
- 验证 `window` 对象是否包含模块内部变量
- 验证导出的函数是否在全局作用域

### 2. 📦 模块功能调用
- **数学计算**: 调用 math 模块的各种函数
- **字符串处理**: 演示 string 模块的转换功能
- **计数器**: 展示带状态管理的模块

### 3. 🗺️ Import Map 别名
- 使用 `@utils/` 别名导入工具模块
- 使用 `@components/` 别名导入组件模块
- 验证别名映射是否正常工作

### 4. ⚡ 动态导入
- 演示 `import()` 动态加载模块
- 展示模块缓存机制
- 测量模块加载时间

## 文件结构

```
demo/
├── index.html              # 主页面（包含 Import Map）
├── README.md               # 本文件
└── modules/
    ├── main.js             # 入口模块
    ├── utils/
    │   ├── math.js         # 数学工具模块
    │   ├── string.js       # 字符串工具模块
    │   └── counter.js      # 计数器模块
    └── components/
        └── button.js       # 按钮组件模块
```

## 核心概念演示

### 作用域隔离

```javascript
// 在模块中定义的变量
const privateVar = '私有变量';
let internalState = 42;

// 这些变量在模块外部不可访问
console.log(window.privateVar);      // undefined
console.log(window.internalState);   // undefined

// 必须通过 export 显式导出
export function getPrivateVar() {
    return privateVar;
}
```

### Import Map 使用

```html
<script type="importmap">
{
    "imports": {
        "@utils/": "./modules/utils/",
        "@components/": "./modules/components/"
    }
}
</script>
```

```javascript
// 使用别名导入
import { add } from '@utils/math.js';
import { createButton } from '@components/button.js';
```

### 动态导入

```javascript
// 按需加载模块
const module = await import('./utils/math.js');
module.add(1, 2);
```

## 浏览器兼容性

| 浏览器 | ES Modules | Import Maps | 动态导入 |
|--------|-----------|-------------|---------|
| Chrome 89+ | ✅ | ✅ | ✅ |
| Edge 89+ | ✅ | ✅ | ✅ |
| Safari 16.4+ | ✅ | ✅ | ✅ |
| Firefox 108+ | ✅ | ✅ | ✅ |
| IE 11 | ❌ | ❌ | ❌ |

## 调试技巧

1. **Chrome DevTools Network 面板**
   - 勾选 "Import" 过滤器查看模块加载
   - 查看模块的加载顺序和依赖关系

2. **Console 面板**
   - 查看模块加载日志
   - 测试模块导出的函数

3. **Sources 面板**
   - 在模块文件中设置断点
   - 查看模块作用域中的变量

4. **检查全局变量**
   - 在 Console 中输入 `console.log(window)` 查看全局对象
   - 确认模块变量没有泄漏

## 常见问题

### Q: 为什么需要本地服务器？
A: ES Modules 使用 CORS 策略，直接通过 `file://` 协议访问会报错。必须通过 HTTP/HTTPS 服务器访问。

### Q: 可以在生产环境中使用吗？
A: 可以，但需要注意：
- Import Maps 在较旧的浏览器中不支持
- 可能需要使用 polyfill 或构建工具作为降级方案
- 建议使用 `<script type="module">` 特性检测

### Q: 如何处理不支持的浏览器？
A: 可以使用以下方案：
1. 使用 `<script nomodule>` 提供降级方案
2. 使用 es-module-shims polyfill
3. 使用构建工具生成兼容版本

## 学习资源

- [MDN: JavaScript Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [MDN: Import Maps](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap)
- [web.dev: JavaScript Modules](https://web.dev/articles/modules)
- [V8: Import Maps](https://v8.dev/features/import-maps)

## 许可证

MIT
