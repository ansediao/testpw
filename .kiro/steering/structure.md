# PW Canvas 项目结构

## 目录组织

### 根目录
- `pw-admin.php` - 主插件引导文件
- `index.php` - 安全保护文件
- `uninstall.php` - 插件卸载处理程序

### 核心目录

#### `/admin/` - 后台管理
- `class-pw-admin-admin.php` - 主要管理类
- `css/` - 管理后台专用样式表
- `js/` - 管理后台专用 JavaScript 文件
- `partials/` - 管理后台 PHP 视图模板

#### `/includes/` - 核心逻辑
- `class-pw-admin.php` - 主插件类
- `class-pw-admin-loader.php` - Hook 加载器系统
- `class-pw-admin-i18n.php` - 国际化
- `class-pw-admin-activator.php` - 插件激活
- `class-pw-admin-deactivator.php` - 插件停用
- `class-pw-admin-promowares-api.php` - 外部 API 集成

#### `/public/` - 前端功能
- `class-pw-admin-public.php` - 主要公共类
- `css/` - 前端样式表（SCSS 和编译后的 CSS）
- `js/` - 前端 JavaScript 模块
- `modules/` - PHP 功能模块
- `partials/` - 前端 PHP 视图模板

#### `/assets/` - 静态资源
- `images/icons/` - SVG 图标和图形

#### `/docs/` - 文档
- 项目文档和 API 规范
- 代码标准和约定
- 技术指南和架构文档

#### `/api_docs/` - API 文档
- `external/promowares/` - 外部 API 文档
- `internal/` - 内部 API 文档

## 文件命名约定

### PHP 文件
- **类文件**: `class-{名称}.php`（例如：`class-pw-admin.php`）
- **模块**: `/modules/` 中的 `class-{模块名}.php`
- **模板**: `/partials/` 中的描述性名称

### JavaScript 文件
- **主入口**: 各目录中的 `main.js`
- **组件**: `/components/` 中的描述性名称
- **工具**: `/utils/` 中的描述性名称
- **状态管理**: Pinia stores 使用 `{名称}Store.js`

### CSS/SCSS 文件
- **SCSS 源文件**: `{组件}.scss`
- **编译后的 CSS**: `{组件}.css`
- **变量**: `_variables.scss`
- **混合器**: `_mixins.scss`

## 架构原则

### 关注点分离
- **Admin** (`/admin/`) - 后台管理界面
- **Public** (`/public/`) - 前端用户界面
- **Includes** (`/includes/`) - 核心业务逻辑
- **Assets** (`/assets/`) - 静态资源

### 模块化设计
- PHP 功能拆分为专注的模块
- JavaScript 按功能区域组织
- CSS 组件匹配 DOM 结构

### 命名约定
- **全局元素**: CSS 使用 `pwca-` 前缀，JavaScript 使用 `pwca` 前缀
- **WordPress hooks**: 使用 `pwca_` 前缀
- **PHP 类**: 使用 `Pwca_Admin_` 前缀
- **内部作用域**: 无需前缀

## 关键文件位置

### 前端入口点
- `/public/js/main.js` - 兼容性入口
- `/public/js/design/main.js` - 设计界面
- `/public/js/product/main.js` - 产品页面功能

### 核心模板
- `/public/partials/template-canvas-display.php` - 主画布模板
- `/public/partials/canvas-operation-panel.php` - 操作面板
- `/public/partials/canvas-customization-area.php` - 定制界面

### 样式组织
- `/public/css/_variables.scss` - SCSS 变量（使用 `$canvas-` 前缀）
- `/public/css/_mixins.scss` - SCSS 混合器
- 各组件的 SCSS 文件及对应的 CSS 文件

### 模块结构
- `/public/modules/class-pw-*.php` - 功能模块
- `/admin/partials/pw-admin-*.php` - 管理后台模板
- `/public/partials/canvas-*.php` - 画布相关模板

## 开发指南

### 文件创建
1. 遵循既定的命名约定
2. 根据功能将文件放在适当的目录中
3. 为样式维护 SCSS 和 CSS 文件
4. 新功能使用模块化方法

### 代码组织
1. 分离管理后台和公共功能的关注点
2. 使用 WordPress hooks 系统实现扩展性
3. 遵循 PHP 类结构和适当的命名空间
4. 按功能模块组织 JavaScript