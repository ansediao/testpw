# 项目目录结构

## 核心目录
- `pw-admin.php`: 插件入口
- `includes/`: 核心类库
  - `class-pw-admin.php`: 核心控制器
  - `class-pw-admin-promowares-api.php`: API 通信
  - `class-pw-admin-loader.php`: 钩子加载器
- `admin/`: 后台管理 (JS, CSS, PHP逻辑, 模板)
- `public/`: 前端交互与画布系统
  - `js/`: 核心脚本
    - `design/`: 设计器组件与逻辑
    - `product/`: 产品页交互与API
    - `stores/`: Pinia 状态管理
    - `canvas-manager.js`: Fabric.js 实例管理
  - `css/`: 样式文件 (SCSS源文件与编译结果)
  - `modules/`: 功能模块 (购物车, 组合产品处理)
  - `partials/`: 页面模板片段 (操作面板, 画布区域)

## 资源与文档
- `assets/`: 静态资源 (图标, 图片)
- `languages/`: 国际化文件 (.pot)
- `woocommerce/`: WC 模板覆盖
- `api_docs/`: API 接口文档 (Internal/External)
- `docs/`: 开发文档 (架构, 规范, 业务逻辑)
- `demos/`: 功能演示 HTML
