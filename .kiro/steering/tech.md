# 技术栈与构建系统

## 核心技术

- **PHP 7.4+**: WordPress 插件开发，遵循 WordPress 编码标准
- **WordPress 5.0+**: 核心 CMS 平台，支持自定义文章类型和分类法
- **WooCommerce**: 电商集成，用于产品管理和购物车功能
- **JavaScript/jQuery**: 前端交互和 AJAX 功能
- **Vue.js 3.3.4**: 画布应用的前端框架（通过 CDN 加载）
- **HTML5 Canvas**: 产品定制界面
- **CSS3**: 样式和响应式设计

## 主要依赖

- **Action Scheduler**: 产品导入的后台任务处理
- **jsPDF**: PDF 生成功能
- **PHPMailer**: 邮件功能
- **WordPress REST API**: 设计数据的自定义端点

## 开发规范

### PHP 标准
- 遵循 WordPress PHP 编码标准
- 使用适当的数据清理：`sanitize_text_field()`、`esc_url()`、`esc_attr()`
- 实现安全的随机数验证：`wp_verify_nonce()`
- 使用 WordPress 钩子和过滤器系统
- 所有函数和类使用 `pw_` 或 `Pw_Admin` 前缀

### JavaScript 标准
- 使用 jQuery 进行 DOM 操作和 AJAX 调用
- 使用 `addEventListener` 实现适当的事件处理
- 使用 `wp_localize_script()` 将 PHP 数据传递给 JavaScript
- 需要时为 ES6 模块添加 `type="module"`

### 安全实践
- 始终使用 `current_user_can()` 验证用户权限
- 清理所有输入数据
- 使用 WordPress nonces 确保表单安全
- 适当转义输出数据

## 常用命令

### WordPress 开发
```bash
# 激活插件（如果有 WP-CLI）
wp plugin activate pw-admin

# 检查插件状态
wp plugin status pw-admin

# 清除缓存（如果安装了缓存插件）
wp cache flush
```

### 文件结构命令
```bash
# 导航到插件目录
cd wp-content/plugins/pw-admin

# 检查文件权限
dir /q (Windows CMD)
Get-ChildItem -Force (PowerShell)
```

## API 集成

### 外部 Promowares API
- **基础地址**: `https://dev.promowares.com/api/v1/`
- **认证方式**: JWT 令牌
- **主要端点**:
  - `GET /products` - 获取产品列表
  - `GET /auth/user-info` - 验证用户令牌

### WordPress REST API 端点
- **命名空间**: `pw/v1`
- **基础地址**: `/wp-json/pw/v1/`
- **端点列表**:
  - `GET /getPwDesignImages` - 获取设计图片列表

### WordPress AJAX 端点
- **管理后台 AJAX**:
  - `pw_proxy_api_request` - API代理请求
  - `pw_save_token` - 保存API令牌
  - `pw_get_design_tags` - 获取设计标签
  - `pw_save_design_tags` - 保存设计标签
  - `pw_add_design` - 添加新设计
  - `check_import_progress` - 检查导入进度
  - `generate_production_pdf` - 生成生产单PDF
  - `pw_add_category` - 添加分类
  - `pw_update_category_settings` - 更新分类设置
  - `pw_delete_category` - 删除分类
  - `pw_submit_product_request` - 提交产品请求

- **前台 AJAX**:
  - `add_customized_product_to_cart` - 添加自定义产品到购物车（支持未登录用户）

## WordPress 选项配置

### 插件选项名称
- **pw_api_token**: API 认证令牌
- **pw_api_key**: API 密钥
- **pw_api_secret**: API 密钥
- **pw_disable_ssl**: SSL 禁用设置
- **pw_customize_text**: 自定义按钮文本
- **pw_customize_color**: 自定义按钮颜色

### 选项使用规范
- 使用 `get_option()` 获取选项值，提供合理的默认值
- 使用 `update_option()` 更新选项值
- 所有选项名称使用 `pw_` 前缀保持一致性
- 在表单中使用 `esc_attr()` 转义选项值

## 设计管理系统技术规范

### 自定义文章类型实现
- **注册方法**: 通过 `Pw_Admin_Loader` 系统在 `init` 钩子上注册
- **文本域**: 统一使用 `pw-admin` 文本域进行国际化
- **权限系统**: 使用标准 WordPress `post` 权限类型
- **URL 结构**: 
  - 设计: `/pw-design/{post-name}/`
  - 分类: `/pw-design-category/{category-slug}/`
  - 标签: `/pw-design-tag/{tag-slug}/`

### 数据库结构
- **文章表**: 使用标准 `wp_posts` 表，`post_type = 'pw_design'`
- **分类表**: 使用标准 `wp_terms` 和 `wp_term_taxonomy` 表
- **关系表**: 使用标准 `wp_term_relationships` 表
- **元数据**: 支持 `wp_postmeta` 表存储自定义字段

### REST API 支持
- **分类法 REST**: `pw_design_category` 和 `pw_design_tag` 启用 REST API
- **文章类型 REST**: `pw_design` 默认不启用 REST API (可根据需要启用)
- **端点访问**:
  - 分类: `/wp-json/wp/v2/pw_design_category`
  - 标签: `/wp-json/wp/v2/pw_design_tag`

### 性能优化
- **查询优化**: 使用 WordPress 标准查询缓存
- **分类法查询**: 支持 `WP_Query` 和 `get_terms()` 标准函数
- **归档页面**: 启用归档页面缓存支持