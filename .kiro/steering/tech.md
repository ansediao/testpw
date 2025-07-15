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

- 外部 API: `https://dev.promowares.com/api/v1/`
- 认证方式: JWT 令牌
- 自定义 REST 端点: `/wp-json/pw/v1/`