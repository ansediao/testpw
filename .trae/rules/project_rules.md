# PWCA Canvas 项目规则

## 项目简介

这是一个WordPress插件项目，提供基于Web的产品定制画布功能。主要功能包括：
- 基于Fabric.js的交互式2D画布系统
- 多层次产品定制（颜色、阴影、文字、图片等）
- 多视图管理系统
- 产品组合和配件系统
- WooCommerce深度集成
- 与Promowares API的数据同步

---

## 核心架构

- **PHP**: WordPress插件后端，遵循WordPress标准插件结构
- **JavaScript**: 前端画布系统，模块化架构
- **Fabric.js**: 2D画布渲染和操作
- **Three.js**: 3D模型支持和纹理映射
- **Vue.js/Pinia/vueuse**: 前端状态管理（部分模块）

### 关键设计模式

- **CanvasManager**: 单例模式管理所有Fabric.js Canvas实例，避免Vue响应式系统干扰
- **模块化组件**: PHP和JS都采用模块化设计，便于维护和扩展
- **状态隔离**: Canvas实例存储在WeakMap中，与Vue响应式系统隔离
- **API代理**: 通过WordPress REST API代理Promowares API请求

---

## 项目目录结构

### 核心目录
- `pw-admin.php`: 插件入口
- `includes/`: 核心类库
  - `class-pw-admin.php`: 核心控制器
  - `class-pw-admin-promowares-api.php`: API 通信
  - `class-pw-admin-loader.php`: 钩子加载器
  - `class-pwca-module-loader.php`: 模块加载器
- `uninstall.php`: 卸载脚本
- `languages/`: 国际化文件 (.pot)

### 模块架构 (modules/)

项目采用模块化架构，每个模块独立管理自己的 assets、includes 和 views。

#### 后台管理模块 (admin_*)
- `admin_cache/`: 缓存管理
  - `assets/`: JS/SCSS 资源
  - `includes/`: PHP 类文件
  - `views/`: 页面模板
- `admin_dashboard/`: 仪表板
  - `views/tabs/`: 仪表板各标签页
- `admin_design/`: 设计库管理
- `admin_orders/`: 订单管理 (生产PDF)
- `admin_woocommerce/`: WooCommerce 后台集成

#### 前台模块 (front_*)
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

#### 集成模块 (integration_*)
- `integration_promowares/`: Promowares API 集成
- `integration_shipping/`: 物流/运费集成

### 资源与文档
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

### 开发工具配置
- `.trae/rules/`: Trae IDE 规则文件
- `.kiro/`: Kiro 配置
  - `specs/`: 功能规格
  - `steering/`: 项目导航
- `.vscode/`: VS Code 配置
- `.opencode/`: OpenCode 配置

---

## 命名约定

### 变量命名约定
- 全局变量使用`pwca_`或`PWCA_`前缀
- CSS类名使用`pwca-`前缀
- JavaScript函数使用`pwca`前缀
- PHP类使用`Pwca_Admin_` 或 `Pwca_Public_`前缀
- API端点使用`/pwca/v1/`命名空间

---

## API集成规范

- 新增API接口优先考虑使用WordPress REST API
- 所有外部API调用必须通过`class-pw-admin-promowares-api.php`处理
- API认证信息不得硬编码在前端代码中
- 错误处理必须提供用户友好的反馈信息

---

## 样式开发规范

1. 只生成和修改SCSS文件，不生成CSS文件
2. CSS文件由用户自己编译生成
3. SCSS文件结构必须完全符合对应模块的DOM结构
4. 嵌套层级与HTML元素层级保持一致
5. 必须在文件顶部导入变量和混合器文件
6. 文件导入顺序：`@import 'variables'` -> `@import 'mixins'` -> 组件样式定义

---

## Vue/Pinia 状态管理规范

1. 依赖于 Store 状态的计算逻辑，放在 getters 中
2. 依赖于 Store 状态的异步操作，放在 actions 中

---

## 弹窗功能规范

1. 无论前后台弹窗功能使用 micromodal
2. 前后台都已引入 micromodal 库

---

## 测试调试规范

1. 不要创建测试文件或者debug文件
2. 当需要测试功能时，可以告诉用户在控制台输入什么命令进行测试或在哪看调试信息
3. 提供控制台测试指令而不是创建额外的测试文件
4. 不要启动 php node Python 等服务进行测试
