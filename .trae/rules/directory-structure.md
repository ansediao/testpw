# 项目目录结构

## 核心目录
- `pw-admin.php`: 插件入口
- `includes/`: 核心类库
  - `class-pw-admin.php`: 核心控制器
  - `class-pw-admin-promowares-api.php`: API 通信
  - `class-pw-admin-loader.php`: 钩子加载器
  - `class-pwca-module-loader.php`: 模块加载器
- `uninstall.php`: 卸载脚本
- `languages/`: 国际化文件 (.pot)

## 模块架构 (modules/)
项目采用模块化架构，每个模块独立管理自己的 assets、includes 和 views。

### 后台管理模块 (admin_*)
- `admin_cache/`: 缓存管理
  - `assets/`: JS/SCSS 资源
  - `includes/`: PHP 类文件
  - `views/`: 页面模板
- `admin_dashboard/`: 仪表板
  - `views/tabs/`: 仪表板各标签页
- `admin_design/`: 设计库管理
- `admin_orders/`: 订单管理 (生产PDF)
- `admin_woocommerce/`: WooCommerce 后台集成

### 前台模块 (front_*)
- `front_canvas/`: 画布设计器 (核心功能)
  - `assets/js/`: JavaScript 文件
    - `canvas/`: 画布初始化与多视图
    - `design/`: 设计器组件
      - `components/`: UI 组件
        - `layers/`: 图层相关组件
        - `product-card-footer/`: 产品卡片底部组件
      - `stores/`: Vue/Pinia 状态管理
      - `utils/`: 工具函数
    - `main/`: 主功能模块
  - `assets/scss/`: SCSS 样式文件
  - `includes/`: PHP 类文件
  - `views/`: 页面模板
    - `partials/`: 模板片段
- `front_cart/`: 购物车
- `front_checkout/`: 结账流程
- `front_product/`: 产品页面
  - `assets/js/product/`: 产品页 JS
    - `api/`: API 接口
    - `components/`: Vue 组件
    - `stores/`: 状态管理

### 集成模块 (integration_*)
- `integration_promowares/`: Promowares API 集成
- `integration_shipping/`: 物流/运费集成

## 资源与文档
- `assets/`: 静态资源 (图标, 图片)
  - `images/icons/`: SVG 图标
- `woocommerce/`: WC 模板覆盖
  - `checkout/`: 结账模板
- `api_docs/`: API 接口文档
  - `external/promowares/`: Promowares 外部 API
  - `internal/`: 内部 AJAX API
- `docs/`: 开发文档
  - `API/`: API 文档
  - `Canvas/`: 画布相关文档
  - `JS/`: JS 使用文档
- `demos/`: 功能演示 HTML

## 开发工具配置
- `.trae/rules/`: Trae IDE 规则文件
- `.kiro/`: Kiro 配置
  - `specs/`: 功能规格
  - `steering/`: 项目导航
- `.vscode/`: VS Code 配置
- `.opencode/`: OpenCode 配置
