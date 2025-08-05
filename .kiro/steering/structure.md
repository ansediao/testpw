# 项目结构与组织

## WordPress 插件架构

PW Canvas 插件遵循 WordPress 插件样板结构，具有清晰的关注点分离：

```
pw-admin/
├── pw-admin.php              # 主插件文件（引导程序）
├── uninstall.php            # 插件卸载清理
├── index.php                # 目录访问保护
├── .gitignore               # Git 忽略文件
├── includes/                # 核心插件类
│   ├── class-pw-admin.php                  # 主插件类
│   ├── class-pw-admin-loader.php           # 钩子加载器
│   ├── class-pw-admin-i18n.php            # 国际化
│   ├── class-pw-admin-activator.php       # 插件激活
│   ├── class-pw-admin-deactivator.php     # 插件停用
│   ├── class-pw-admin-promowares-api.php  # API聚合系统
│   └── index.php                          # 目录访问保护
├── admin/                   # 管理后台特定功能
│   ├── class-pw-admin-admin.php     # 管理类（包含AJAX处理）
│   ├── css/                 # 管理后台样式表
│   │   └── pw-admin-admin.css
│   ├── js/                  # 管理后台 JavaScript
│   │   ├── pw-admin-admin.js
│   │   └── pw-admin-category-management.js
│   ├── partials/            # 管理后台模板部分
│   │   ├── pw-admin-admin-display.php
│   │   └── pw-admin-design-management-display.php
│   └── index.php            # 目录访问保护
├── public/                  # 前台功能
│   ├── class-pw-admin-public.php    # 前台类（模块化架构）
│   ├── css/                 # 前台样式表
│   │   ├── pw-admin-public.css
│   │   └── pw-view-switcher.css
│   ├── js/                  # 前台 JavaScript
│   │   ├── product/         # Vue 3 产品页面应用
│   │   │   ├── main.js                    # 应用入口
│   │   │   ├── api/
│   │   │   │   └── productDataAPI.js      # API调用模块
│   │   │   ├── stores/
│   │   │   │   └── productStore.js        # Pinia状态管理
│   │   │   ├── components/                # Vue组件
│   │   │   │   ├── ColorVariants.js
│   │   │   │   ├── CheckboxOptions.js
│   │   │   │   ├── ProductQuantity.js
│   │   │   │   ├── ProductPriceInfo.js
│   │   │   │   ├── AddToCart.js
│   │   │   │   ├── ProductAccessories.js
│   │   │   │   ├── QuantityDiscountSlider.js
│   │   │   │   └── component-validator.js
│   │   │   ├── debug/
│   │   │   │   └── moq-debugger.js
│   │   │   └── demo/
│   │   │       └── batch-quantity-demo.html
│   │   ├── design/          # 设计相关脚本
│   │   ├── boundary.js      # 边界检测
│   │   ├── canvas-init.js   # 画布初始化
│   │   ├── export.js        # 导出功能
│   │   ├── main.js          # 主脚本
│   │   ├── model-3d.js      # 3D模型处理
│   │   ├── pw-admin-public.js
│   │   ├── pw-view-switcher.js
│   │   └── toolbar.js       # 工具栏
│   ├── modules/             # 模块化组件
│   │   ├── class-pw-cdn-loader.php         # CDN脚本加载器
│   │   ├── class-pw-cart-handler.php       # 购物车处理
│   │   ├── class-pw-product-inquiry.php    # 产品询价
│   │   ├── class-pw-auxiliary-functions.php # 辅助功能
│   │   ├── class-pw-template-handler.php   # 模板处理
│   │   └── class-pw-cart-admin-actions.php # 购物车管理操作
│   ├── partials/            # 前台模板部分
│   │   ├── canvas-customization-area.php
│   │   ├── canvas-design_area.php
│   │   ├── canvas-dongtai-area.php
│   │   ├── canvas-header.php
│   │   ├── canvas-operation-panel.php
│   │   ├── canvas-preview_area.php
│   │   ├── pw-admin-public-display.php
│   │   ├── pw-product-cart-handler.php
│   │   └── template-canvas-display.php
│   └── index.php            # 目录访问保护
├── languages/               # 翻译文件
│   └── pw-admin.pot         # 翻译模板
└── assets/                  # 静态资源
    └── images/              # 插件图片和图标
        └── icons/           # 图标文件
```

## 核心架构模式

### 类结构
- **主类**: `Pw_Admin` - 核心插件协调器，管理所有组件初始化
- **管理类**: `Pw_Admin_Admin` - 处理管理功能、AJAX和分类管理
- **前台类**: `Pw_Admin_Public` - 管理前端功能、WooCommerce集成和模块化组件
- **加载器类**: `Pw_Admin_Loader` - 管理 WordPress 钩子和过滤器
- **API类**: `Pw_Admin_Promowares_Api` - API聚合系统，处理多数据源集成

### 钩子系统
- 所有 WordPress 钩子通过加载器类注册
- 管理钩子：`define_admin_hooks()` - 包含分类管理和产品请求处理
- 前台钩子：`define_public_hooks()` - 包含画布模板处理和购物车重定向
- 为已登录和未登录用户注册 AJAX 处理程序
- REST API 端点自动注册：`/wp-json/pw/v1/product-data/{id}`

### 模块化架构
前台采用模块化设计，每个模块独立管理特定功能：
- **CDN加载器**: 管理Vue 3、Pinia、Axios的CDN加载
- **购物车处理器**: 处理自定义产品添加到购物车
- **产品询价**: 管理产品询价功能
- **辅助功能**: 提供通用辅助方法
- **模板处理器**: 管理画布模板显示
- **购物车管理**: 处理购物车管理操作

### 自定义文章类型和分类法

#### pw_design 文章类型
- **注册位置**: `Pw_Admin::pw_design_post_type_and_taxonomies()`
- **钩子**: 通过 `init` 动作钩子注册
- **配置特性**:
  - `public` => true - 公开可访问
  - `show_ui` => true - 显示管理界面
  - `show_in_menu` => false - 不在主菜单显示（通过自定义菜单管理）
  - `has_archive` => true - 支持归档页面
  - `supports` => ['title', 'editor', 'thumbnail', 'excerpt', 'comments', 'custom-fields', 'revisions']
  - `rewrite` => ['slug' => 'pw-design'] - 自定义固定链接
  - `show_in_rest` => false - 不在 REST API 中显示
- **管理界面**: 通过自定义 Promoware 菜单访问

#### pw_design_category 分类法
- **类型**: 层级分类法 (hierarchical => true)
- **关联**: 绑定到 `pw_design` 文章类型
- **配置特性**:
  - `show_ui` => true - 显示管理界面
  - `show_admin_column` => true - 在文章列表显示
  - `show_in_rest` => true - REST API 支持
  - `rewrite` => ['slug' => 'pw-design-category']
- **自定义元数据**: 支持分类类型、导出排除、图层深度、缩放模式等设置
- **AJAX管理**: 支持添加、更新、删除分类的AJAX操作

#### pw_design_tag 分类法
- **类型**: 非层级分类法 (hierarchical => false)
- **关联**: 绑定到 `pw_design` 文章类型
- **配置特性**:
  - `show_ui` => true - 显示管理界面
  - `show_admin_column` => true - 在文章列表显示
  - `show_in_rest` => true - REST API 支持
  - `rewrite` => ['slug' => 'pw-design-tag']
- **功能**: 支持热门标签、逗号分隔输入、标签建议

### 文件命名约定
- 类：`class-[plugin-name]-[class-name].php`
- 函数：所有全局函数使用 `pw_` 前缀
- 常量：`PW_ADMIN_` 前缀（例如：`PW_ADMIN_VERSION`）
- CSS/JS：`[plugin-name]-[context].[ext]`（例如：`pw-admin-admin.css`）
- Vue组件：驼峰命名（例如：`ColorVariants.js`）
- 模块：`class-pw-[module-name].php`

### 安全与数据处理
- 所有 AJAX 端点包含随机数验证
- 敏感操作前进行用户权限检查（`current_user_can()`）
- 使用 WordPress 函数进行输入清理（`sanitize_text_field()`, `esc_url_raw()`）
- 所有动态内容进行输出转义（`esc_attr()`, `esc_js()`）
- API调用包含超时限制和错误处理
- 缓存数据使用JSON编码存储

### WooCommerce 集成
- 使用 `pw_` 前缀的自定义产品元字段（`pw_id`, `pw_isSyncProduct`等）
- 通过钩子自定义购物车和结账流程
- 自定义购物车和结账页面重定向
- 支持自定义产品数据添加到购物车
- 产品图片在购物车中的特殊处理
- 与 WooCommerce REST API 集成

## 开发指南

### 添加新功能
1. **后端功能**: 在管理或前台类中创建适当的类方法
2. **前端模块**: 在 `public/modules/` 目录创建新的模块类
3. **Vue组件**: 在 `public/js/product/components/` 目录添加新组件
4. **钩子注册**: 通过加载器系统注册钩子
5. **遵循标准**: WordPress 编码标准和插件安全最佳实践
6. **文档**: 包含适当的PHPDoc和内联注释

### 模块开发规范
1. **继承模式**: 新模块应继承基础模块结构
2. **钩子优先级**: 使用适当的优先级确保加载顺序
3. **条件加载**: 仅在需要的页面加载相关功能
4. **错误处理**: 包含适当的错误处理和回退机制

### Vue组件开发
1. **CDN依赖**: 监听 `pwCdnLoaded` 事件确保依赖加载
2. **响应式**: 使用 `toRefs()` 保持Pinia store响应式
3. **API调用**: 通过统一的API聚合端点获取数据
4. **组件验证**: 使用组件验证器确保功能正常

### 文件组织
- 保持管理和前台功能分离
- 使用 partials 作为可重用模板组件
- 按功能模块组织代码（modules/, components/）
- 按上下文（管理/前台）组织资源
- 保持一致的命名约定
- Vue应用按功能分层（api/, stores/, components/）