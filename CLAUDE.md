# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 项目概述

PW Canvas 是一个 WordPress 插件，为产品提供在线定制平台。它与 WooCommerce 集成，允许客户在购买前设计和定制产品。该插件包含完整的基于画布的设计界面、3D 预览功能以及用于管理设计和产品的管理工具。

## WordPress 插件架构

这是一个遵循 WordPress 插件样板结构的标准 WordPress 插件：

### 核心结构
- **主插件文件**: `pw-admin.php` - 插件引导和初始化
- **核心类**: `includes/class-pw-admin.php` - 主插件编排器
- **管理类**: `admin/class-pw-admin-admin.php` - 后端功能
- **公共类**: `public/class-pw-admin-public.php` - 前端功能
- **加载器**: `includes/class-pw-admin-loader.php` - 钩子编排

### 关键组件

#### 画布定制系统 (`/public/partials/`)
- **template-canvas-display.php** - 主画布界面模板
- **canvas-*.php** 文件 - 模块化画布组件（头部、操作、预览区域）

#### 前端 JavaScript (`/public/js/`)
- **app.js** - Vue.js 3 应用入口点，带组件注册
- **canvas-init.js** - Fabric.js 画布初始化
- **main.js** - 核心画布功能
- **model-3d.js** - Three.js 3D 模型渲染
- **toolbar.js** - 设计工具和控件
- **layer-manager.js** - 图层管理系统
- **boundary.js** - 设计边界约束
- **export.js** - 导出功能（PDF、图像）

#### Vue.js 组件 (`/public/js/components/`)
- 使用 Vue.js 3 的基于组件的前端架构
- 为不同 UI 区域提供单独组件的模块化设计

## 开发命令

### WordPress 开发
由于这是一个 WordPress 插件，没有传统的构建命令。开发涉及：

```bash
# 插件激活（通过 WordPress 管理后台）
# 导航到 WordPress 管理后台 → 插件 → 激活 "PW Canvas"

# 文件权限（如果需要）
chmod -R 755 /path/to/plugin/

# WordPress 调试（添加到 wp-config.php）
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

### 前端资源
前端 JavaScript 和 CSS 文件直接加载，无需构建过程：
- CSS: 通过 WordPress `wp_enqueue_style()` 加载
- JavaScript: 通过 WordPress `wp_enqueue_script()` 加载
- Vue.js 3: 在画布界面中从 CDN 加载

## 技术栈

### 后端
- **PHP 7.4+** - WordPress 插件开发
- **WordPress 6.0+** - CMS 框架
- **WooCommerce** - 电子商务集成
- **MySQL** - 数据库（WordPress 标准）

### 前端
- **Vue.js 3** - 组件框架（CDN）
- **Fabric.js 5.3.1** - 画布操作库
- **Three.js 0.128.0** - 3D 渲染引擎
- **jsPDF** - PDF 生成

### 画布功能
- **设计画布**: 基于 Fabric.js 的设计界面
- **3D 预览**: Three.js 集成的 3D 产品可视化
- **图层管理**: 多图层设计系统
- **导出系统**: PDF 和图像导出功能
- **颜色定制**: 实时颜色叠加系统

## WooCommerce 集成

### 产品类型
- **同步产品**: 标记有 `pw_isSyncProduct` 元字段的产品
- **自定义产品数据**: 通过 WooCommerce 元字段存储
- **购物车验证**: 防止混合定制和常规产品

### 自定义字段
- `pw_isSyncProduct` - 识别可定制产品
- `pw_mainIMG_color` - 颜色叠加图像 URL
- `pw_3d_file` - 3D 模型文件 URL
- `pw_container` - 容器图层图像
- `pw_4-grid` - 网格模板图像
- `pw_bg` - 背景图像
- `pw_productType` - 产品类型分类

### 购物车和结账流程
- 自定义产品数据从购物车保存到订单
- 可视化定制数据存储为订单元数据
- 为生产文件生成 PDF

## 数据库架构

使用带有自定义元字段的标准 WordPress 表：
- `wp_postmeta` - 产品自定义字段
- `wp_posts` - 产品和自定义文章类型
- `wp_terms` - 设计分类和标签

## 画布 URL 结构

插件创建自定义路由：
- `/pwcanvas/?product_id={id}` - 特定产品的画布界面

## 管理界面

### 自定义菜单结构
- **Promoware** - 主菜单（位置 55）
  - Dashboard - 统计和概览
  - Design Library - 设计管理
  - Manage Designs - PW Design 文章类型管理
  - Add New Design - 创建新设计
  - Design Categories - 分类管理
  - Design Tags - 标签管理

### 设计管理
- 自定义文章类型: `pw_design`
- 分类法: `pw_design_category`, `pw_design_tag`
- AJAX 驱动的设计操作

## 安全考虑

- 所有 AJAX 请求使用 WordPress nonces
- 通过 WordPress 函数进行输入清理
- 自定义图像的文件上传验证
- 管理功能的用户权限检查

## 性能注意事项

- 画布资源仅在画布页面加载
- 3D 模型按需加载
- 自定义上传的图像优化
- 设计资源的缓存考虑

## 自定义路由

插件使用 WordPress template_redirect 处理自定义 URL：
- 画布界面: `/pwcanvas/` → `template-canvas-display.php`