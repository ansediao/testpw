# 核心类与关键函数

## 1. 核心 PHP 类

### 1.1 `Pw_Admin`

- 文件: `includes/class-pw-admin.php`
- 角色: 插件总控类

#### 关键方法

| 方法 | 作用 |
| --- | --- |
| `__construct()` | 组织插件初始化顺序 |
| `load_dependencies()` | 加载核心类、模块加载器、Promowares API 类 |
| `set_locale()` | 注册国际化加载 |
| `register_custom_post_types()` | 注册 `pw_design` 及其 taxonomy |
| `init_api_class()` | 初始化 `Pw_Admin_Promowares_Api` 并注册接口 |
| `load_modules()` | 扫描并加载所有业务模块 |
| `run()` | 执行 `Pw_Admin_Loader` 中积累的 Hook |
| `pw_design_post_type_and_taxonomies()` | 真正注册 `pw_design`、分类、标签 |

#### 理解重点

- 它不负责承载全部业务，而是负责把系统“搭起来”
- 它定义了插件初始化顺序，是理解系统的第一入口

### 1.2 `Pw_Admin_Loader`

- 文件: `includes/class-pw-admin-loader.php`
- 角色: Hook 收集与统一注册器

#### 关键方法

| 方法 | 作用 |
| --- | --- |
| `add_action()` | 缓存 action 定义 |
| `add_filter()` | 缓存 filter 定义 |
| `run()` | 将缓存的 hooks 真正注册到 WordPress |

#### 理解重点

- 是插件“延迟注册 Hook”的底层工具
- 目前主要服务于 `Pw_Admin`，模块内部多数直接调用 `add_action()` / `add_filter()`

### 1.3 `Pwca_Module_Loader`

- 文件: `includes/class-pwca-module-loader.php`
- 角色: 一级模块扫描器

#### 关键方法

| 方法 | 作用 |
| --- | --- |
| `__construct($modules_path)` | 保存模块根路径 |
| `load()` | 扫描 `modules/*` 并 `include_once index.php` |

#### 理解重点

- 它只是文件装载器，不负责模块实例生命周期管理
- 模块自治逻辑由各模块 `bootstrap()` 自己承担

### 1.4 `Pw_Admin_Promowares_Api`

- 文件: `includes/class-pw-admin-promowares-api.php`
- 角色: 外部 API 代理与聚合中枢

#### 关键方法分类

##### 基础 API 调用

| 方法 | 作用 |
| --- | --- |
| `get_products_from_api()` | 拉取 Promowares 产品列表 |
| `get_composite_products_from_api()` | 拉取组合产品列表 |
| `get_container_info()` | 获取组合容器信息 |
| `get_product()` | 获取单个产品数据 |
| `sync_product()` | 同步单个产品 |
| `check_connection()` | 校验连接可用性 |

##### REST / AJAX 注册

| 方法 | 作用 |
| --- | --- |
| `register_ajax_hooks()` | 注册 AJAX 和 REST 相关入口 |
| `register_rest_routes()` | 注册 REST 路由 |
| `register_aggregation_endpoints()` | 注册聚合数据端点 |

##### 聚合接口

| 方法 | 作用 |
| --- | --- |
| `get_aggregated_product_data()` | 返回产品聚合数据，是产品页/设计页的数据主入口之一 |
| `get_store_customization_settings_data()` | 代理店铺定制设置 |
| `get_print_methods_data()` | 获取印刷方式信息 |
| `get_custom_colors_data()` | 获取自定义颜色信息 |
| `handle_image_upload()` | 接收图片上传 |

##### Shipping 与用户信息

| 方法 | 作用 |
| --- | --- |
| `calculate_shipping_options()` | 静态方法，计算运费选项 |
| `get_user_info()` | 获取用户信息 |
| `validate_token()` | 校验 token |

##### 缓存相关

| 方法 | 作用 |
| --- | --- |
| `get_cached_product_data()` | 读取聚合缓存 |
| `save_cached_product_data()` | 写入聚合缓存 |
| `clear_cached_product_data()` | 清理单个产品缓存 |
| `clear_all_cached_product_data()` | 清理全部缓存 |
| `check_product_data_changes()` | 对比远端与本地差异 |
| `update_product_if_changed()` | 远端变化后更新本地产品 |

#### 理解重点

- 这是后端数据总线
- 既承担 Promowares API 代理，又承担聚合、缓存和部分业务计算
- 项目规则要求新增外部接口优先通过它处理

## 2. 关键模块主类

### 2.1 `Pwca_Front_Product`

- 文件: `modules/front_product/includes/class-pwca-front-product.php`
- 角色: 商品页模块总入口

#### 关键方法

| 方法 | 作用 |
| --- | --- |
| `bootstrap()` | 创建实例并启动模块 |
| `load_dependencies()` | 加载上下文、资源、挂载点、Woo 调整、组合商品、询盘能力 |
| `register()` | 组装多个职责类并注册 Hook |

#### 理解重点

- 本类本身较轻，核心在于它把商品页能力拆成多个子类

### 2.2 `Pwca_Front_Product_Assets`

- 文件: `modules/front_product/includes/class-pwca-front-product-assets.php`
- 角色: 商品页资源装配器

#### 关键方法

| 方法 | 作用 |
| --- | --- |
| `enqueue_assets()` | 在商品上下文中按需装配资源 |
| `render_product_modals()` | 输出产品页弹窗模板 |
| `enqueue_vendor_assets()` | 加载 Vue、Fabric、VueUse、layui 等 CDN 依赖 |
| `enqueue_local_assets()` | 加载本地样式、组件脚本、主入口脚本 |
| `enqueue_core_scripts()` | 先装载 API、store、Canvas 等基础脚本 |
| `enqueue_main_script()` | 装载 `assets/js/product/main.js` |

#### 理解重点

- 是理解“产品页为什么能跑起来”的关键类
- 直接复用 `front_canvas/assets/js/canvas-manager.js`

### 2.3 `Pwca_Front_Product_Woo_Adjustments`

- 文件: `modules/front_product/includes/class-pwca-front-product-woo-adjustments.php`
- 角色: WooCommerce 商品展示行为调整器

#### 关键方法

| 方法 | 作用 |
| --- | --- |
| `filter_price_html()` | 隐藏同步商品默认价格 HTML |
| `maybe_remove_loop_add_to_cart()` | 移除商品列表默认加购按钮 |
| `maybe_remove_single_add_to_cart()` | 移除单品页默认加购按钮 |
| `exclude_composite_group_from_shop()` | 从商店/分类/标签页排除组合组商品 |
| `filter_block_product_image()` | 兼容 Woo Blocks 的图片样式调整 |

#### 理解重点

- 它决定了“同步商品为什么看起来不像普通 WooCommerce 商品”

### 2.4 `Pwca_Front_Canvas`

- 文件: `modules/front_canvas/includes/class-pwca-front-canvas.php`
- 角色: 画布模块总入口

#### 关键方法

| 方法 | 作用 |
| --- | --- |
| `bootstrap()` | 创建模块实例 |
| `load_dependencies()` | 加载上下文、Router、Assets、Inquiry REST |
| `register()` | 组装设计页能力 |

### 2.5 `Pwca_Front_Canvas_Router`

- 文件: `modules/front_canvas/includes/class-pwca-front-canvas-router.php`
- 角色: 设计器页面路由器

#### 关键方法

| 方法 | 作用 |
| --- | --- |
| `register_rewrite_rules()` | 注册 `/pwcanvas` 重写规则 |
| `register_query_vars()` | 注册 `pw_canvas` 查询变量 |
| `render_canvas_page()` | 识别画布请求并渲染 `canvas-page.php` |

#### 理解重点

- 它把设计器从商品页拆成一个独立页面
- 是“商品页跳到设计器页”的核心后端入口

### 2.6 `Pwca_Front_Canvas_Assets`

- 文件: `modules/front_canvas/includes/class-pwca-front-canvas-assets.php`
- 角色: 设计器运行时装配器

#### 关键方法

| 方法 | 作用 |
| --- | --- |
| `enqueue_assets()` | 仅在画布上下文中加载资源 |
| `filter_script_loader_tag()` | 将设计器关键脚本标记为 ES Module |
| `enqueue_vendor_assets()` | 加载 Vue、Pinia、Fabric、Three、jsPDF 等 |
| `enqueue_local_scripts()` | 装载设计器完整脚本依赖链 |
| `enqueue_design_modules()` | 装载 store、header、footer、design 主模块 |
| `enqueue_page_bootstrap()` | 装载页面启动脚本 |

#### 理解重点

- 这是设计器前端系统真正的“入口控制台”
- 文件较长，但非常适合作为前端依赖图的阅读入口

### 2.7 `Pwca_Front_Canvas_Inquiry_Rest`

- 文件: `modules/front_canvas/includes/class-pwca-front-canvas-inquiry-rest.php`
- 角色: 设计器询盘 REST 接口

#### 关键方法

| 方法 | 作用 |
| --- | --- |
| `register_routes()` | 注册 `/pwca/v1/inquiry` |
| `handle_submit()` | 校验请求、保存 Flamingo 记录、发送邮件 |
| `maybe_save_to_flamingo()` | 写入 `flamingo_inbound` |
| `send_notification_email()` | 通知后台邮箱 |

### 2.8 `Pwca_Front_Cart_Handler`

- 文件: `modules/front_cart/includes/class-pwca-front-cart-handler.php`
- 角色: 定制商品入车与购物车业务核心

#### 关键方法

| 方法 | 作用 |
| --- | --- |
| `register()` | 注册 cart 相关 hooks 与 AJAX |
| `validate_cart_products_before_add()` | 阻止定制商品与普通商品混合结账 |
| `append_post_data_to_cart_item_data()` | 将自定义数据写入 cart item |
| `add_customized_product_to_cart()` | 接收前端定制数据并执行加购 |
| `redirect_custom_cart_for_sync_products()` | 遇到同步商品时跳转自定义购物车 |
| `apply_discount_to_cart_items()` | 购物车价格调整入口 |

#### 理解重点

- 是“定制数据如何真正变成 WooCommerce 购物车项”的关键实现

### 2.9 `Pwca_Integration_Promowares`

- 文件: `modules/integration_promowares/includes/class-pwca-integration-promowares.php`
- 角色: Promowares 商品同步执行器

#### 关键方法

| 方法 | 作用 |
| --- | --- |
| `schedule_product_import()` | 对外暴露同步调度入口 |
| `schedule_product_import_internal()` | 创建 Action Scheduler 导入任务 |
| `import_single_product()` | 导入单个普通产品 |
| `import_composite_product_group()` | 导入组合商品组 |
| `process_container_rules()` | 应用容器规则 |
| `handle_save_token()` | 保存 API token |
| `handle_save_mock_mode()` | 保存 mock mode |

#### 理解重点

- 负责“批量同步商品到 WooCommerce”
- 业务复杂，涉及产品创建、图片下载、meta 存储、组合关系处理

### 2.10 `Pwca_Integration_Shipping_Shipping_Ajax`

- 文件: `modules/integration_shipping/includes/class-pwca-integration-shipping-shipping-ajax.php`
- 角色: Checkout 运费 AJAX 控制器

#### 关键方法

| 方法 | 作用 |
| --- | --- |
| `get_shipping_options()` | 计算并返回可选运费 |
| `update_shipping_cost()` | 把选中的运费写入 session |
| `clear_shipping_selection()` | 清空已选运费 |
| `recalculate_cart_totals()` | 触发 WooCommerce 重新计算总价 |

## 3. 关键前端入口脚本

### 3.1 `modules/front_product/assets/js/product/main.js`

#### 作用

- 商品页 Vue 应用入口
- 查找挂载点 `#vue-dynamic-product-area`
- 读取后端通过 DOM 注入的 `productId`、`pwId`、REST 信息
- 检查各组件是否已加载
- 启动完整应用或降级应用

#### 理解重点

- 这是产品页前端的真正启动点
- 负责把多个全局组件组装成商品页应用

### 3.2 `modules/front_canvas/assets/js/design/main.js`

#### 作用

- 设计器模块入口
- 当前版本主要导入图层模块和画布状态持久化集成模块

#### 理解重点

- 文件本身很轻，但它是 ES Module 体系的枢纽入口

### 3.3 `modules/front_canvas/assets/js/canvas-manager.js`

#### 作用

- 封装 Fabric.js Canvas 实例管理
- 暴露全局 `window.CanvasManager`
- 管理多视图 Canvas 的创建、切换、导出、销毁与状态恢复

#### 关键方法

| 方法 | 作用 |
| --- | --- |
| `createCanvas()` | 创建并登记 Fabric Canvas |
| `getCanvas()` | 获取指定视图 canvas |
| `setActiveCanvas()` | 设置当前活跃视图 |
| `destroyCanvas()` | 销毁单个 canvas |
| `destroyAllCanvases()` | 销毁全部 canvas |
| `exportCanvas()` | 导出图片 |
| `getCanvasState()` | 获取序列化状态 |
| `restoreCanvasState()` | 从状态恢复画布 |

#### 理解重点

- 这是整个画布系统的基础设施层
- 对理解前端状态隔离很重要

## 4. 推荐优先掌握的方法

如果需要最快建立全局认知，优先掌握下面这些方法：

1. `Pw_Admin::__construct()`
2. `Pw_Admin::load_modules()`
3. `Pw_Admin_Promowares_Api::register_rest_routes()`
4. `Pw_Admin_Promowares_Api::get_aggregated_product_data()`
5. `Pwca_Front_Product_Assets::enqueue_assets()`
6. `Pwca_Front_Product_Woo_Adjustments::maybe_remove_single_add_to_cart()`
7. `Pwca_Front_Canvas_Router::render_canvas_page()`
8. `Pwca_Front_Canvas_Assets::enqueue_local_scripts()`
9. `Pwca_Front_Cart_Handler::add_customized_product_to_cart()`
10. `Pwca_Integration_Promowares::schedule_product_import_internal()`
11. `Pwca_Integration_Shipping_Shipping_Ajax::get_shipping_options()`

## 5. 结构上的观察

### 5.1 偏“组装器”的类很多

很多模块主类并不写具体业务，而是负责：

- 加载依赖
- 创建上下文对象
- 组装多个职责类

这有利于保持模块入口清晰。

### 5.2 少数类承担业务较重

下列文件偏“胖类”：

- `class-pw-admin-promowares-api.php`
- `class-pwca-admin-design.php`
- `class-pwca-integration-promowares.php`
- `class-pwca-front-cart-handler.php`

这些文件通常是后续重构时最值得优先拆分的对象。
