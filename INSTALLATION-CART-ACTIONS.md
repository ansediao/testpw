# 购物车管理员操作功能 - 安装说明

## 快速安装

### 1. 文件检查
确保以下文件已正确创建：

```
public/
├── modules/
│   └── class-pw-cart-admin-actions.php    ✓ 已创建
├── css/
│   └── pw-cart-admin-actions.css          ✓ 已创建
└── class-pw-admin-public.php              ✓ 已修改
```

### 2. 代码集成
主 public 类已自动集成新模块：

```php
// 在 class-pw-admin-public.php 中已添加：
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-cart-admin-actions.php';

// 在 initialize_modules() 方法中已添加：
new Pw_Cart_Admin_Actions();
```

### 3. 功能验证

#### 步骤 1：访问测试页面
1. 将 `test-cart-admin-actions.php` 文件放在 WordPress 根目录
2. 以管理员身份登录
3. 访问：`http://yoursite.com/test-cart-admin-actions.php`
4. 检查所有项目是否显示 ✓

#### 步骤 2：测试购物车功能
1. 添加一些产品到购物车
2. 访问购物车页面
3. 确认在每个商品名称下方看到"复制"和"编辑"按钮
4. 测试按钮功能

## 详细安装步骤

### 1. 备份现有文件
```bash
# 备份主要文件
cp public/class-pw-admin-public.php public/class-pw-admin-public.php.backup
```

### 2. 创建新模块文件

#### 创建主功能类
创建文件：`public/modules/class-pw-cart-admin-actions.php`
```php
<?php
// 复制提供的完整代码
```

#### 创建样式文件
创建文件：`public/css/pw-cart-admin-actions.css`
```css
/* 复制提供的完整样式 */
```

### 3. 修改主 public 类

#### 添加模块引用
在 `public/class-pw-admin-public.php` 文件中，在其他 require_once 语句后添加：
```php
require_once plugin_dir_path(__FILE__) . 'modules/class-pw-cart-admin-actions.php';
```

#### 初始化模块
在 `initialize_modules()` 方法中添加：
```php
new Pw_Cart_Admin_Actions();
```

### 4. 清除缓存
如果使用了缓存插件，请清除所有缓存：
- 页面缓存
- 对象缓存
- 插件缓存

## 功能测试

### 基本功能测试

#### 1. 权限测试
- ✅ 管理员用户：应该看到按钮
- ✅ 普通用户：不应该看到按钮
- ✅ 未登录用户：不应该看到按钮

#### 2. 复制功能测试
1. 点击"复制"按钮
2. 检查是否显示"复制中..."状态
3. 确认成功消息显示
4. 验证是否在新窗口中打开后台编辑页面
5. 检查后台产品列表中是否有新的复制产品
6. 验证新产品是否为草稿状态
7. 检查新产品是否保留了原产品的所有数据

#### 3. 编辑功能测试
1. 点击"编辑"按钮
2. 确认在新窗口中打开后台产品编辑页面
3. 验证是否为原产品的编辑页面

### 高级功能测试

#### 1. AJAX 错误处理
- 模拟网络错误
- 测试权限不足情况
- 验证无效数据处理

#### 2. 响应式设计
- 测试移动设备显示
- 检查平板设备兼容性
- 验证不同屏幕尺寸

#### 3. 浏览器兼容性
- Chrome
- Firefox
- Safari
- Edge

## 故障排除

### 常见问题

#### 1. 按钮不显示
**可能原因：**
- 用户权限不足
- 不在购物车页面
- CSS 文件未加载
- JavaScript 错误

**解决方案：**
```php
// 检查用户权限
if (current_user_can('manage_options')) {
    echo "用户有管理员权限";
} else {
    echo "用户权限不足";
}

// 检查页面类型
if (is_cart()) {
    echo "在购物车页面";
} else {
    echo "不在购物车页面";
}
```

#### 2. AJAX 请求失败
**检查步骤：**
1. 打开浏览器开发者工具
2. 查看 Network 标签
3. 检查 AJAX 请求状态
4. 查看错误消息

**常见错误：**
- 403 错误：权限问题
- 404 错误：端点不存在
- 500 错误：服务器错误

#### 3. 样式问题
**检查项目：**
- CSS 文件是否正确加载
- 主题是否覆盖了样式
- 是否有 CSS 冲突

**解决方案：**
```css
/* 增加样式优先级 */
.woocommerce .pw-cart-admin-actions .pw-cart-duplicate-btn {
    background: #0073aa !important;
}
```

### 调试工具

#### 1. 启用 WordPress 调试
在 `wp-config.php` 中添加：
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

#### 2. 检查错误日志
查看文件：`/wp-content/debug.log`

#### 3. 使用测试文件
运行 `test-cart-admin-actions.php` 进行系统检查

## 性能优化

### 1. 条件加载
功能已实现条件加载：
- 仅在购物车页面加载
- 仅对管理员用户加载
- 按需加载样式和脚本

### 2. 缓存优化
```php
// 添加版本号防止缓存问题
wp_enqueue_style(
    'pw-cart-admin-actions',
    plugin_dir_url(__FILE__) . '../css/pw-cart-admin-actions.css',
    array(),
    filemtime(plugin_dir_path(__FILE__) . '../css/pw-cart-admin-actions.css')
);
```

### 3. 脚本优化
- 使用事件委托减少内存使用
- 防抖处理防止重复请求
- 最小化 DOM 操作

## 安全检查

### 1. 权限验证
- 前端显示检查
- AJAX 处理双重验证
- nonce 令牌验证

### 2. 数据清理
- 输入数据清理
- 输出数据转义
- SQL 注入防护

### 3. CSRF 防护
- 使用 WordPress nonce
- 验证请求来源
- 限制请求频率

## 维护建议

### 1. 定期检查
- 每月检查功能是否正常
- 监控错误日志
- 收集用户反馈

### 2. 更新计划
- 跟随 WordPress 更新
- 跟随 WooCommerce 更新
- 定期安全检查

### 3. 备份策略
- 定期备份代码
- 测试恢复流程
- 文档更新

## 支持

如果遇到问题，请：
1. 查看错误日志
2. 运行测试文件
3. 检查系统要求
4. 联系技术支持

---

**安装完成后，请删除测试文件 `test-cart-admin-actions.php` 以确保安全。**