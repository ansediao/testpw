# iFlow 上下文文档 (IFLOW.md)

## 项目概述

**项目名称**: PW Canvas
**项目类型**: WordPress 插件
**主要功能**: 在线产品定制画布，基于 Fabric.js 的 2D 编辑器，与 WooCommerce 集成。

### 核心技术栈
- **后端**: PHP (WordPress 插件架构), MySQL (通过 WordPress)
- **前端**: Vue 3 (Composition API), Pinia (状态管理), Fabric.js (2D 画布), Three.js (3D 预览)
- **依赖**: WooCommerce, Flamingo
- **外部资源**: CDN 加载 Vue, Pinia, Fabric.js, Three.js; 阿里云字体图标

## 项目结构

```
D:\PW CANVAS\Main\
├── admin/                 # 后台管理界面相关文件
├── assets/                # 静态资源 (图片, 图标)
├── demos/                 # 示例文件
├── docs/                  # 项目文档
├── includes/              # 核心插件类和功能模块
├── languages/             # 语言包
├── public/                # 前台公共文件
│   ├── css/               # 样式文件
│   ├── js/                # JavaScript 文件
│   │   ├── main.js        # 主要前端逻辑
│   │   ├── canvas-init.js # 画布初始化
│   │   ├── canvas-manager.js # 画布管理器
│   │   └── ...            # 其他功能模块
│   ├── partials/          # 页面模板片段
│   └── templates/         # 页面模板
├── templates/             # 模板文件
└── tests/                 # 测试文件
```

## 核心功能模块

### 1. 画布系统 (Canvas System)
- **技术**: Fabric.js
- **文件**: `public/js/main.js`, `public/js/canvas-init.js`, `public/js/canvas-manager.js`
- **功能**:
  - 2D 图形编辑 (文本、图片、形状)
  - 多图层管理
  - 历史记录 (撤销/重做)
  - 导出功能 (图片、PDF)
  - 弧形文字效果
  - 预览功能

### 2. 多视图管理 (Multi-View Management)
- **技术**: Vue 3 + Pinia
- **文件**: `public/js/design/` 目录下的组件和 stores
- **功能**:
  - 支持多个产品视图 (正面、背面、侧面等)
  - 视图切换和独立编辑
  - 状态管理 (Pinia stores)

### 3. 3D 预览 (3D Preview)
- **技术**: Three.js
- **文件**: `public/js/model-3d.js`
- **功能**:
  - 3D 产品模型展示
  - 将 2D 画布内容映射到 3D 模型纹理

### 4. 产品集成 (Product Integration)
- **技术**: WooCommerce
- **文件**: `pw-admin.php`, `includes/` 目录下的类文件
- **功能**:
  - 产品数据获取和展示
  - 购物车集成
  - 定制图片添加到购物车
  - MOQ (Minimum Order Quantity) 管理

### 5. API 集成 (API Integration)
- **功能**:
  - 与 Promowares API 通信
  - 获取产品、模板、图层等数据
  - 获取运费信息

## 关键文件说明

### 主插件文件
- `pw-admin.php`: 插件入口文件，定义插件基本信息、激活/停用钩子、加载核心类。

### 前台主模板
- `public/partials/template-canvas-display.php`: 在线定制页面的主模板，整合所有 UI 组件。

### 核心前端逻辑
- `public/js/main.js`: 包含画布操作、事件监听、图层管理、预览、导出等核心功能。
- `public/js/canvas-init.js`: 负责画布的初始化，包括单视图和多视图模式。
- `public/js/canvas-manager.js`: 管理多个画布实例，提供统一的接口。

### 状态管理
- `public/js/design/stores/`: 包含 Pinia stores，管理产品数据、画布状态、视图信息、印刷方式等。

## 开发约定

### 命名规范
- JavaScript 变量和函数: camelCase
- CSS 类名: kebab-case
- PHP 类名: PascalCase (遵循 WordPress 命名规范)

### 事件系统
- 使用自定义事件进行模块间通信 (如 `canvasInitializedFromAPI`, `viewSwitched`)
- 使用 WordPress Hook 系统 (actions 和 filters)

### 状态管理
- 使用 Pinia 进行前端状态管理
- 画布状态和产品数据存储在对应的 store 中

## 构建和运行

### 环境要求
- WordPress 环境
- WooCommerce 插件
- Flamingo 插件
- PHP 5.6+

### 运行方式
1. 将插件文件夹放入 WordPress 的 `wp-content/plugins/` 目录。
2. 在 WordPress 后台激活插件。
3. 访问 `/pwcanvas/?product_id=XXX` 查看定制页面。

### 开发注意事项
- 前端资源通过 CDN 加载，无需本地构建。
- 样式文件位于 `public/css/` 目录下。
- JavaScript 逻辑主要在 `public/js/` 目录下处理。
- 模板文件遵循 PHP 与前端代码分离原则。