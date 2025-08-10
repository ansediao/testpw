# PW Canvas 代码规范和约定

## PHP 开发规范

### 命名约定
- **类名**: 大驼峰命名法，以 `Pw_Admin` 前缀开始
  - 示例: `Pw_Admin`, `Pw_Admin_Loader`, `Pw_Admin_Public`
- **方法和函数**: 小驼峰命名法，具有描述性
  - 示例: `defineAdminHooks()`, `loadDependencies()`, `getUserData()`
- **变量**: 小驼峰命名法，使用描述性名词
  - 示例: `$pluginName`, `$productId`
- **文件**: 小写连字符分隔，类文件使用 `class-` 前缀
  - 示例: `class-pw-admin.php`, `pw-admin-public.css`

### 代码注释
- **必须**遵循 PHPDoc 规范
- 所有类、方法和函数都需要完整的文档注释
- 包含 `@since`, `@access`, `@param`, `@return` 等标签

### 代码分离原则
- PHP 文件**只负责**后端逻辑、数据处理和模板渲染
- **严禁**在 PHP 文件中使用 `echo` 输出大段 HTML/CSS/JavaScript
- 数据传递使用 `wp_localize_script` 或 HTML `data-*` 属性

## JavaScript 开发规范

### 命名约定
- **函数**: 小驼峰命名法，动词开头
  - 示例: `initializeModel()`, `saveState()`, `getActiveCanvas()`
- **变量**: 小驼峰命名法，描述性名词
  - 示例: `layerManager`, `canvasElement`, `productStore`
- **常量**: 大写下划线分隔
  - 示例: `MAX_HISTORY_STEPS`

### 代码注释
- **必须**遵循 JSDoc 规范
- 所有公开函数和复杂逻辑需要注释
- 包含参数类型、返回值类型说明

### 代码分离原则
- **严禁**将 JavaScript 代码与 PHP/HTML 文件混合
- **禁止**在 `.php` 文件中使用 `<script>` 标签嵌入代码
- **禁止**使用行内事件处理器 (`onclick`, `onmouseover`)
- 所有 JavaScript 代码必须存放在独立的 `.js` 文件中

## CSS/SCSS 开发规范

### 样式分离
- **严禁**使用内联 `style` 属性
- **严禁**在 HTML 中使用 `<style>` 标签
- **必须**使用 BEM 命名规范
- 样式文件独立管理，通过自动化流程编译

## 文件组织规范

### 目录结构
```
admin/          # 后台管理模块
├── css/        # 后台专用样式
├── js/         # 后台专用脚本
└── partials/   # 后台PHP视图模板

includes/       # 核心逻辑与功能类

public/         # 前台展示模块
├── css/        # 前台样式
├── js/         # 前台脚本
├── modules/    # 功能模块类
└── partials/   # 前台PHP视图模板
```

### 关注点分离
- 后台管理 (`admin`) 与前台展示 (`public`) 严格分离
- 核心逻辑 (`includes`) 不包含任何前端代码
- 视图模板 (`partials`) 不包含业务逻辑

## 版本兼容性
- PHP 代码必须兼容 PHP 5.6 及以上版本
- 前端代码使用现代浏览器支持的特性
- WordPress 插件标准兼容性