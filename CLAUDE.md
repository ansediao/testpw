# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个WordPress插件项目，提供基于Web的产品定制画布功能。主要功能包括：
- 基于Fabric.js的交互式2D画布系统
- 多层次产品定制（颜色、阴影、文字、图片等）
- 3D模型预览支持（Three.js）
- 多视图管理系统
- 产品组合和配件系统
- WooCommerce深度集成
- 与Promowares API的数据同步

## 技术架构

### 核心架构
- **PHP**: WordPress插件后端，遵循WordPress标准插件结构
- **JavaScript**: 前端画布系统，模块化架构
- **Fabric.js**: 2D画布渲染和操作
- **Three.js**: 3D模型支持和纹理映射
- **Vue.js/Pinia**: 前端状态管理（部分模块）

### 关键设计模式
- **CanvasManager**: 单例模式管理所有Fabric.js Canvas实例，避免Vue响应式系统干扰
- **模块化组件**: PHP和JS都采用模块化设计，便于维护和扩展
- **状态隔离**: Canvas实例存储在WeakMap中，与Vue响应式系统隔离
- **API代理**: 通过WordPress REST API代理Promowares API请求

### 目录结构
```
pw-admin.php                     # 主插件文件
├── admin/                       # 后台管理界面
├── public/                      # 前端功能模块
│   ├── js/                      # JavaScript模块
│   │   ├── canvas-manager.js    # Canvas管理器（核心）
│   │   ├── canvas-init.js       # Canvas初始化逻辑
│   │   ├── init.js              # 全局初始化入口
│   │   ├── design/              # 设计相关组件
│   │   │   ├── components/      # 设计组件（图层面板等）
│   │   │   └── stores/          # Pinia状态管理
│   │   ├── product/             # 产品相关组件
│   │   │   ├── components/      # 产品组件（价格、数量等）
│   │   │   ├── stores/          # 产品状态管理
│   │   │   └── api/             # 产品API接口
│   │   └── model-3d.js          # 3D模型支持
│   ├── modules/                 # PHP功能模块
│   └── partials/                # PHP页面模板
├── includes/                    # 核心PHP类文件
│   └── class-pw-admin-promowares-api.php  # API通信处理
└── docs/                        # 项目文档
```

## 常用命令

### 开发环境
```bash
# WordPress插件无需构建，直接开发
# 将项目目录复制到 wp-content/plugins/
# 在WordPress后台激活"PW Canvas"插件

# 检查PHP语法错误
php -l pw-admin.php

# 查看文件变更
git status

# 提交变更
git add .
git commit -m "描述变更"
```

### 调试和测试
```bash
# 在浏览器开发者工具中调试Canvas系统
# F12 -> Console 执行以下命令：

# 检查CanvasManager是否加载
window.CanvasManager

# 获取指定视图的Canvas实例
window.CanvasManager.getCanvas('view-id')

# 重新初始化Canvas系统
window.initCanvasSystem()

# 检查Pinia store状态
window.useCanvasStore()
```

## 核心组件说明

### Canvas系统架构
- **CanvasManager**: 全局单例，管理所有Fabric.js Canvas实例，使用WeakMap避免内存泄漏
- **初始化顺序**: Fabric.js加载 → CanvasManager定义 → Pinia store初始化 → Canvas实例创建
- **多视图支持**: 每个产品视图都有独立的Canvas实例，通过viewId进行管理

### 关键文件功能
- `public/js/canvas-manager.js:6` - Canvas管理器类，核心架构组件
- `public/js/canvas-init.js:2` - 画布初始化逻辑，处理多视图和传统模式
- `public/js/init.js:2` - 全局初始化入口函数
- `public/class-pw-admin-public.php:44` - 前端主类，加载所有模块
- `includes/class-pw-admin-promowares-api.php:30` - API通信处理类

### 数据流架构
1. WordPress加载插件并初始化PHP类
2. 前端页面加载时，init.js触发全局初始化
3. CanvasManager创建并管理Fabric.js实例
4. Pinia store管理产品状态和视图切换
5. Canvas内容变化时同步到3D模型纹理
6. 用户操作通过WordPress REST API与Promowares API通信

### 状态管理模式
- **Canvas状态**: 存储在CanvasManager的非响应式对象中
- **产品状态**: 通过Pinia store管理，支持响应式更新
- **视图切换**: 通过事件系统协调Canvas和UI状态同步
- **API数据**: 通过WordPress REST API代理，统一处理认证和错误

## 开发注意事项

### Canvas系统开发规范
- 所有Canvas操作必须通过CanvasManager进行
- Canvas实例不应直接存储在Vue响应式数据中
- 新增Canvas功能时需要考虑多视图模式兼容性
- 系统图片加载时必须添加`skipLayerSync: true`标记

### API集成规范
- 新增API接口优先考虑使用WordPress REST API
- 所有外部API调用必须通过`class-pw-admin-promowares-api.php`处理
- API认证信息不得硬编码在前端代码中
- 错误处理必须提供用户友好的反馈信息

### 调试检查清单
1. 验证`window.CanvasManager`是否正确加载
2. 检查Canvas DOM元素是否存在且ID正确
3. 确认Fabric.js库已完整加载
4. 验证Pinia store数据初始化正确性
5. 查看浏览器控制台是否有相关错误信息

### 扩展开发指导
- 设计相关功能添加到`public/js/design/components/`
- 产品相关功能添加到`public/js/product/components/`
- PHP后台功能添加到`public/modules/`
- API接口统一在`includes/class-pw-admin-promowares-api.php`中管理
- 前端弹窗统一使用micromodal库

## 防冲突命名规范

### 变量命名约定
- 全局变量使用`pw_`或`PW_`前缀
- CSS类名使用`pwca-`前缀
- JavaScript函数使用`pw`或`canvas`前缀
- PHP类使用`Pw_Admin_`前缀
- API端点使用`/pw/v1/`命名空间

### 文件命名规范
- PHP类文件：`class-pw-admin-{功能}.php`
- JavaScript模块：小写加连字符，如`canvas-manager.js`
- CSS文件：功能名加`.css`，如`layers-panel.css`
- 模板文件：描述性命名加`.php`，如`canvas-operation-panel.php`