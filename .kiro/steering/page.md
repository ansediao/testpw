---
inclusion: always
---

# 页面结构和路由指南

本文档概述了 PW Canvas WordPress 插件中的关键页面和路由模式。

## 核心页面类型

### 自定义购物车页面 (`/custom-cart/`)
- **用途**: 增强的 WooCommerce 购物车，集成画布设计功能
- **模板位置**: `/woocommerce/checkout/` 目录
- **主要功能**: 
  - 通过 `pwca-cart-quantity-controls.js` 实现自定义数量控制
  - 设计预览集成
  - 通过 `class-pw-cart-handler.php` 增强购物车功能
- **样式**: 使用 `pwca-custom-cart.scss` 和相关购物车样式表
- **组件**: 与购物车数量处理器和自定义结账流程集成

### 在线设计页面 (`/pwcanvas/`)
- **用途**: 产品定制的主要画布设计界面
- **模板**: `/public/partials/` 中的 `template-canvas-display.php`
- **关键组件**:
  - 画布区域: `canvas-design_area.php`
  - 操作面板: `canvas-operation-panel.php`
  - 头部控制: `canvas-header.php`
  - 定制区域: `canvas-customization-area.php`
- **JavaScript 入口**: `/public/js/design/main.js`
- **状态管理**: 使用 `/public/js/design/stores/` 中的 Pinia stores
- **样式**: 主要样式在 `pw-canvas.scss` 和相关设计样式表中

### WooCommerce 产品页面（原生）
- **用途**: 标准 WooCommerce 产品页面，增强 PW Canvas 功能
- **增强位置**: `/public/js/product/main.js`
- **主要功能**:
  - 通过 `product-image-canvas.js` 集成产品画布
  - 颜色变体和定制选项
  - 通过 `productDataAPI.js` 增强产品数据 API
- **组件**: `/public/js/product/components/` 中的产品特定组件
- **样式**: 产品相关样式如 `pw-product-canvas.scss`

## 开发指南

### 页面模板模式
- 使用 WordPress 模板层次结构进行页面路由
- 画布相关页面应扩展主画布模板结构
- 保持管理后台和公共页面功能的分离

### JavaScript 架构
- 每种页面类型在 `/public/js/` 中都有自己的主入口点
- 在页面特定目录中使用模块化组件结构
- 利用 `/public/js/utils/` 和 `/public/js/stores/` 中的共享工具

### 样式约定
- 页面特定的 SCSS 文件应与页面功能匹配
- 对全局页面元素使用 `pwca-` 前缀
- 在所有页面类型中保持响应式设计模式

### 集成点
- 所有页面都与 WooCommerce hooks 和 filters 集成
- 画布功能应在相关页面类型中可用
- 使用内部 API 结构保持一致的 API 通信模式