# 运行方式与开发说明

## 1. 运行前提

本项目是 WordPress 插件，运行前提不是“执行本仓库根目录命令”，而是具备完整的 WordPress 环境。

### 必要依赖

- WordPress
- WooCommerce
- Flamingo
- PHP 5.6+
- MySQL

插件头部已经声明：

- `Requires Plugins: woocommerce, flamingo`

## 2. 项目运行方式

### 2.1 安装方式

将仓库放入：

```text
wp-content/plugins/pw-canvas
```

然后在 WordPress 后台启用插件。

### 2.2 插件启动后会发生什么

1. WordPress 读取 `pw-admin.php`
2. 加载 `Pw_Admin`
3. 注册 `pw_design` 等数据结构
4. 初始化 Promowares API 代理类
5. 扫描并加载 `modules/*/index.php`
6. 各模块注册自己的 Hook / AJAX / REST / 资源

### 2.3 页面运行入口

主要业务页面入口有两类：

| 页面 | 来源 |
| --- | --- |
| WooCommerce 商品页 | `front_product` 注入定制前端应用 |
| `/pwcanvas` | `front_canvas` 独立设计器页 |

## 3. 构建方式

## 3.1 没有统一的前端打包流程

仓库根目录没有主项目级别的：

- `package.json`
- `composer.json`
- `vite.config.*`
- `webpack.config.*`

因此本项目不是靠统一构建链运行，而是：

- PHP 直接 enqueue 本地 JS/CSS 文件
- 前端核心库通过 CDN 加载

## 3.2 需要人工处理的构建内容

主要是 SCSS -> CSS。

仓库规则也明确指出：

- 平时只修改 SCSS
- CSS 由开发者自行编译生成

### 常见命令

```bash
npm install -g sass
sass modules/front_canvas/assets/scss/:modules/front_canvas/assets/scss/ --no-source-map
sass --watch modules/front_canvas/assets/scss/pwca-front-canvas.scss:modules/front_canvas/assets/scss/pwca-front-canvas.css
```

同样的命令模式适用于：

- `modules/front_product/assets/scss/`
- `modules/front_cart/assets/scss/`
- `modules/front_checkout/assets/scss/`
- 其他带 `scss/` 目录的模块

## 4. 配置项来源

## 4.1 文件配置很少

项目中几乎没有 `.env` 或独立配置文件，运行期配置主要来自 WordPress options。

## 4.2 重要配置项

| 配置项 | 来源 | 作用 |
| --- | --- | --- |
| `pw_api_token` | 后台保存 | Promowares API token |
| `pw_api_mock_mode` | 后台保存 | 是否启用 mock 模式 |
| `pw_disable_ssl` | 后台设置页 | 是否禁用 SSL 校验 |
| `pw_api_key` | 后台设置页 | API 相关参数 |
| `pw_api_secret` | 后台设置页 | API 相关参数 |
| `pw_customize_text` | 后台设置页 | 自定义按钮文案等 |
| `pw_customize_color` | 后台设置页 | 自定义颜色配置 |

## 4.3 外部 API 地址

Promowares API 基础地址当前位于：

- `includes/class-pw-admin-promowares-api.php`

说明：

- 基础地址在后端集中维护
- 前端不应硬编码外部地址或 token

## 5. 前端依赖加载方式

前端依赖不是本地 npm 安装，而是由 PHP 运行时装配：

### 5.1 产品页

`Pwca_Front_Product_Assets` 会加载：

- Vue 3
- Vue Demi
- Axios
- VueUse
- Fabric.js
- layui

### 5.2 设计页

`Pwca_Front_Canvas_Assets` 会加载：

- Vue 3
- Pinia
- VueUse
- Fabric.js
- Three.js
- jsPDF
- List.js
- layui

## 6. 推荐本地验证方式

由于项目规则不建议在当前环境内额外启动 PHP/Node/Python 服务，推荐采用“已有 WordPress 环境 + 浏览器控制台”的方式验证。

### 6.1 后台验证

- 检查 Promoware 后台页面是否正常显示
- 检查设置保存是否成功
- 检查商品同步按钮是否能创建同步任务
- 检查缓存页是否能显示缓存状态

### 6.2 前台验证

- 打开同步商品详情页
- 检查 Vue 定制区域是否挂载
- 进入 `/pwcanvas`
- 尝试设计并加入购物车
- 检查购物车是否跳到 `/custom-cart/`
- 检查结账页运费是否能正确计算

### 6.3 REST 验证示例

```javascript
fetch('/wp-json/pw/v1/product-data/123')
  .then((r) => r.json())
  .then(console.log);
```

```javascript
fetch('/wp-json/pw-canvas/v1/print-methods', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ printing_method_ids: [1, 2, 3] })
}).then((r) => r.json()).then(console.log);
```

## 7. 调试重点

### 7.1 如果产品页没显示定制 UI

优先检查：

- 当前页面是否是 WooCommerce 商品页
- 当前产品是否带有 `pw_isSyncProduct=1`
- `front_product` 资源是否成功加载
- `#vue-dynamic-product-area` 是否被插入页面

### 7.2 如果 `/pwcanvas` 打不开

优先检查：

- 重写规则是否已刷新
- `Pwca_Front_Canvas_Router::register_rewrite_rules()` 是否执行
- 查询变量 `pw_canvas` 是否正确识别
- `canvas-page.php` 是否可读

### 7.3 如果定制商品无法入车

优先检查：

- `custom-product-nonce` 是否有效
- 前端是否提交了图片数据
- 购物车里是否混入了普通商品或 blank item
- 上传目录权限是否正常
- `WC()->cart` 是否可用

### 7.4 如果运费异常

优先检查：

- `pwca_shipping_nonce`
- WooCommerce session
- 用户国家代码
- 购物车重量
- `Pw_Admin_Promowares_Api::calculate_shipping_options()` 返回值

## 8. 开发约束与注意事项

### 8.1 API 约束

- 新增外部 API 优先走 WordPress REST API
- 所有外部 API 调用统一通过 `class-pw-admin-promowares-api.php`
- 不得在前端硬编码认证信息
- 错误处理必须给用户友好提示

### 8.2 样式约束

- 修改 SCSS，不直接手写最终 CSS 逻辑
- SCSS 顶部要先引入变量和混合器
- 嵌套层级应与 DOM 结构一致

### 8.3 前端状态约束

- 依赖 Store 状态的计算放在 getters
- 依赖 Store 状态的异步放在 actions
- Canvas 实例不要进入 Vue 响应式系统

## 9. 推荐二次维护路径

如果后续要长期维护这个项目，建议优先建立以下习惯：

1. 先读模块入口类和 assets 类，再深入子类
2. 修改接口前先看 `Pw_Admin_Promowares_Api`
3. 修改商品页前先判断是否影响同步商品逻辑
4. 修改设计器前先判断是否影响多视图和 CanvasManager
5. 修改购物车前先验证 blank / customized 互斥规则
6. 修改样式后及时编译对应 CSS

## 10. 运行结论

本项目的“运行”本质上是：

```text
WordPress 插件激活
  + WooCommerce 商品页面上下文
  + 自定义 /pwcanvas 路由
  + 后台菜单与 AJAX
  + 聚合 REST API
  + CDN 前端依赖
```

理解这一点后，很多“为什么仓库里没有统一启动命令”的疑问就会自然消失。
