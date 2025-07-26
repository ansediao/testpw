# 购物车管理员操作功能

## 功能概述

购物车管理员操作功能为 WooCommerce 购物车中的每个商品添加了"复制"和"编辑"按钮，仅对具有管理员权限的用户可见。这个功能特别适用于需要快速复制和编辑自定义产品的场景。

## 主要特性

### 1. 权限控制
- 仅对具有 `manage_options` 权限的用户（通常是管理员）显示
- 非管理员用户看不到这些按钮，不影响正常购物体验

### 2. 复制功能
- 一键复制购物车中的商品为新产品
- 创建同名新产品（标题后加"(复制)"）
- 保留原商品的所有元数据、分类、标签和特色图片
- 保存购物车中的自定义数据到新产品
- 复制后在新窗口中打开新产品的后台编辑页面
- 新产品默认为草稿状态，便于进一步编辑

### 3. 编辑功能
- 直接在新窗口中打开原产品的后台编辑页面
- 无需额外的数据处理，直接编辑原产品
- 适合快速修改产品信息和设置

### 4. 用户体验
- 现代化的按钮设计和交互效果
- 加载状态指示器
- 成功/错误消息提示
- 响应式设计，适配移动设备
- 键盘导航支持
- 工具提示说明

## 技术实现

### 文件结构
```
public/
├── modules/
│   └── class-pw-cart-admin-actions.php    # 主要功能类
├── css/
│   └── pw-cart-admin-actions.css          # 样式文件
└── class-pw-admin-public.php              # 集成到主类
```

### 核心类：`Pw_Cart_Admin_Actions`

#### 主要方法

1. **`add_admin_action_buttons()`**
   - 钩子：`woocommerce_cart_item_name`
   - 功能：在购物车商品名称后添加操作按钮
   - 权限检查：仅管理员可见

2. **`handle_duplicate_cart_item()`**
   - AJAX 端点：`pw_duplicate_cart_item`
   - 功能：创建新产品并返回后台编辑URL
   - 安全：nonce 验证和权限检查

3. **`duplicate_product()`**
   - 功能：复制产品的完整数据
   - 包括：文章数据、元数据、分类、标签、特色图片

4. **`get_product_admin_edit_url()`**
   - 功能：生成产品后台编辑URL
   - 返回：WordPress 后台的产品编辑页面链接

5. **`copy_product_meta()`**
   - 功能：复制产品的所有元数据
   - 过滤：跳过编辑锁定等临时数据

6. **`copy_product_taxonomies()`**
   - 功能：复制产品的分类和标签
   - 支持：所有产品相关的分类法

7. **`save_cart_custom_data()`**
   - 功能：将购物车自定义数据保存到新产品
   - 支持：画布数据、自定义数据、数量等

5. **`enqueue_scripts()`**
   - 功能：加载必要的样式和脚本
   - 条件：仅在购物车页面且用户是管理员时加载

### 数据处理

#### 支持的自定义数据类型
- `pw_canvas_data`: 画布设计数据
- `pw_custom_data`: 其他自定义配置
- `quantity`: 商品数量
- 其他购物车项目数据

#### URL 参数编码
```php
// 编辑模式参数
$edit_params = array(
    'edit_mode' => '1',
    'canvas_data' => base64_encode(json_encode($canvas_data)),
    'custom_data' => base64_encode(json_encode($custom_data)),
    'quantity' => $quantity
);
```

### 前端交互

#### JavaScript 功能
- AJAX 请求处理
- 加载状态管理
- 消息提示系统
- 键盘导航支持
- 错误处理和重试机制

#### CSS 特性
- 响应式设计
- 悬停和焦点效果
- 加载动画
- 高对比度模式支持
- 减少动画偏好支持

## 使用方法

### 1. 基本使用
1. 以管理员身份登录
2. 在购物车中添加一些商品
3. 访问购物车页面
4. 在每个商品名称下方看到"复制"和"编辑"按钮

### 2. 复制商品
1. 点击"复制"按钮
2. 系统创建一个新的同名产品（标题后加"(复制)"）
3. 复制所有产品数据和购物车自定义数据
4. 在新窗口中打开新产品的后台编辑页面
5. 新产品为草稿状态，可以进一步编辑后发布

### 3. 编辑商品
1. 点击"编辑"按钮
2. 在新窗口中打开原产品的后台编辑页面
3. 直接编辑原产品的所有设置
4. 修改后保存即可更新产品

## 安全考虑

### 权限验证
- 前端显示：`current_user_can('manage_options')`
- AJAX 处理：双重权限检查
- nonce 验证：防止 CSRF 攻击

### 数据清理
- 所有输入数据使用 `sanitize_text_field()`
- 输出数据使用 `esc_attr()` 和 `esc_url()`
- JSON 数据使用 `base64_encode()` 编码

### 错误处理
- 完善的错误消息
- 优雅的降级处理
- 日志记录（可扩展）

## 扩展性

### 添加新的操作按钮
```php
// 在 add_admin_action_buttons() 方法中添加
$buttons_html .= sprintf(
    '<button type="button" class="pw-cart-custom-btn" data-cart-key="%s">
        <i class="dashicons dashicons-admin-tools"></i> 自定义操作
    </button>',
    esc_attr($cart_item_key)
);
```

### 自定义数据处理
```php
// 在 get_product_edit_url() 方法中添加
if (isset($cart_item['my_custom_data'])) {
    $edit_params['my_data'] = base64_encode(json_encode($cart_item['my_custom_data']));
}
```

### 样式自定义
```css
/* 在 pw-cart-admin-actions.css 中添加 */
.pw-cart-custom-btn {
    background: #ff6b35;
    color: white;
    /* 其他样式... */
}
```

## 测试

### 测试文件
- `test-cart-admin-actions.php`: 功能测试页面

### 测试步骤
1. 运行测试文件检查系统状态
2. 添加商品到购物车
3. 测试复制功能
4. 测试编辑功能
5. 验证权限控制
6. 测试错误处理

### 常见问题
1. **按钮不显示**: 检查用户权限和页面类型
2. **AJAX 失败**: 检查 nonce 和权限验证
3. **样式问题**: 检查 CSS 文件加载和主题兼容性
4. **跳转失败**: 检查 URL 生成和产品状态

## 兼容性

### WordPress 版本
- 最低要求：WordPress 5.0+
- 推荐版本：WordPress 6.0+

### WooCommerce 版本
- 最低要求：WooCommerce 5.0+
- 推荐版本：WooCommerce 7.0+

### 浏览器支持
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

### 主题兼容性
- 标准 WooCommerce 主题
- 自定义主题（可能需要样式调整）

## 性能考虑

### 优化措施
- 条件性脚本加载（仅购物车页面 + 管理员）
- CSS 压缩和缓存
- AJAX 请求防抖
- 最小化 DOM 操作

### 监控指标
- 页面加载时间影响：< 50ms
- AJAX 响应时间：< 500ms
- 内存使用：最小化

## 未来改进

### 计划功能
1. 批量操作支持
2. 操作历史记录
3. 自定义按钮配置
4. 更多数据类型支持
5. 国际化支持

### 性能优化
1. 懒加载脚本
2. 缓存机制
3. 数据库查询优化
4. CDN 支持

## 维护

### 定期检查
- WordPress 和 WooCommerce 更新兼容性
- 安全漏洞扫描
- 性能监控
- 用户反馈收集

### 更新流程
1. 备份现有代码
2. 测试新版本兼容性
3. 更新代码和文档
4. 部署和验证
5. 监控和反馈收集