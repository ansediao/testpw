# 项目结构与组织

## WordPress 插件架构

PW Canvas 插件遵循 WordPress 插件样板结构，具有清晰的关注点分离：

```
pw-admin/
├── pw-admin.php              # 主插件文件（引导程序）
├── uninstall.php            # 插件卸载清理
├── README.txt               # WordPress 插件说明
├── LICENSE.txt              # GPL 许可证
├── includes/                # 核心插件类
│   ├── class-pw-admin.php           # 主插件类
│   ├── class-pw-admin-loader.php    # 钩子加载器
│   ├── class-pw-admin-i18n.php     # 国际化
│   ├── class-pw-admin-activator.php # 插件激活
│   └── class-pw-admin-deactivator.php # 插件停用
├── admin/                   # 管理后台特定功能
│   ├── class-pw-admin-admin.php     # 管理类
│   ├── css/                 # 管理后台样式表
│   ├── js/                  # 管理后台 JavaScript
│   └── partials/            # 管理后台模板部分
├── public/                  # 前台功能
│   ├── class-pw-admin-public.php    # 前台类
│   ├── css/                 # 前台样式表
│   ├── js/                  # 前台 JavaScript（包括 Vue 应用）
│   └── partials/            # 前台模板部分
├── languages/               # 翻译文件
│   └── pw-admin.pot         # 翻译模板
└── assets/                  # 静态资源
    └── images/              # 插件图片和图标
```

## 核心架构模式

### 类结构
- **主类**: `Pw_Admin` - 核心插件协调器
- **管理类**: `Pw_Admin_Admin` - 处理管理功能和 AJAX
- **前台类**: `Pw_Admin_Public` - 管理前端功能和 WooCommerce 集成
- **加载器类**: `Pw_Admin_Loader` - 管理 WordPress 钩子和过滤器

### 钩子系统
- 所有 WordPress 钩子通过加载器类注册
- 管理钩子：`define_admin_hooks()`
- 前台钩子：`define_public_hooks()`
- 为已登录和未登录用户注册 AJAX 处理程序

### 自定义文章类型和分类法

#### pw_design 文章类型
- **注册位置**: `Pw_Admin::pw_design_post_type_and_taxonomies()`
- **钩子**: 通过 `init` 动作钩子注册
- **配置特性**:
  - `public` => true - 公开可访问
  - `show_ui` => true - 显示管理界面
  - `show_in_menu` => false - 不在主菜单显示
  - `has_archive` => true - 支持归档页面
  - `supports` => ['title', 'editor', 'thumbnail', 'excerpt', 'comments', 'custom-fields', 'revisions']
  - `rewrite` => ['slug' => 'pw-design'] - 自定义固定链接
  - `show_in_rest` => false - 不在 REST API 中显示

#### pw_design_category 分类法
- **类型**: 层级分类法 (hierarchical => true)
- **关联**: 绑定到 `pw_design` 文章类型
- **配置特性**:
  - `show_ui` => true - 显示管理界面
  - `show_admin_column` => true - 在文章列表显示
  - `show_in_rest` => true - REST API 支持
  - `rewrite` => ['slug' => 'pw-design-category']

#### pw_design_tag 分类法
- **类型**: 非层级分类法 (hierarchical => false)
- **关联**: 绑定到 `pw_design` 文章类型
- **配置特性**:
  - `show_ui` => true - 显示管理界面
  - `show_admin_column` => true - 在文章列表显示
  - `show_in_rest` => true - REST API 支持
  - `rewrite` => ['slug' => 'pw-design-tag']

### 文件命名约定
- 类：`class-[plugin-name]-[class-name].php`
- 函数：所有全局函数使用 `pw_` 前缀
- 常量：`PW_ADMIN_` 前缀（例如：`PW_ADMIN_VERSION`）
- CSS/JS：`[plugin-name]-[context].[ext]`（例如：`pw-admin-admin.css`）

### 安全与数据处理
- 所有 AJAX 端点包含随机数验证
- 敏感操作前进行用户权限检查
- 使用 WordPress 函数进行输入清理
- 所有动态内容进行输出转义

### WooCommerce 集成
- 使用 `pw_` 前缀的自定义产品元字段
- 通过钩子自定义购物车和结账
- 自定义产品类型和属性
- 与 WooCommerce REST API 集成

## 开发指南

### 添加新功能
1. 在管理或前台类中创建适当的类方法
2. 通过加载器系统注册钩子
3. 遵循 WordPress 编码标准
4. 包含适当的文档和安全措施

### 文件组织
- 保持管理和前台功能分离
- 使用 partials 作为可重用模板组件
- 按上下文（管理/前台）组织资源
- 保持一致的命名约定