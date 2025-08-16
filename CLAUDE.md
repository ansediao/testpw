# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个WordPress插件项目，提供产品定制画布功能。主要功能包括：
- 基于Fabric.js的交互式画布系统
- 多层次产品定制（颜色、阴影、文字等）
- 3D模型支持
- 多视图管理
- 产品组合和配件系统
- WooCommerce集成

## 技术架构

### 核心架构
- **PHP**: WordPress插件后端
- **JavaScript**: 前端画布系统
- **Fabric.js**: 2D画布渲染
- **Three.js**: 3D模型支持
- **Vue.js/Pinia**: 状态管理（模块化架构）

### 目录结构
```
pw-admin.php                 # 主插件文件
├── admin/                   # 后台管理
├── public/                  # 前端功能
│   ├── js/                  # JavaScript模块
│   │   ├── canvas-manager.js    # Canvas管理器
│   │   ├── canvas-init.js       # Canvas初始化
│   │   ├── design/              # 设计相关组件
│   │   ├── product/             # 产品相关组件
│   │   └── model-3d.js          # 3D模型支持
│   ├── modules/             # PHP模块
│   └── partials/            # 页面模板
├── includes/                # 核心类文件
└── assets/                  # 静态资源
```

## 常用命令

### 开发环境
```bash
# 无需构建步骤，直接WordPress插件形式
# 将目录复制到 wp-content/plugins/ 目录下
# 在WordPress后台激活插件

# 查看文件变更
git status

# 提交变更
git add .
git commit -m "描述变更"
```

### 调试和测试
```bash
# 检查PHP语法
php -l pw-admin.php

# 检查JavaScript语法（使用浏览器开发者工具）
# F12 -> Console 查看错误日志

# 调试Canvas系统
# 浏览器控制台执行：
# window.CanvasManager.getCanvas('view-id')
# window.initCanvasSystem()
```

## 关键组件说明

### Canvas系统
- **CanvasManager**: 管理所有Fabric.js Canvas实例
- **CanvasInit**: 初始化传统Canvas和多视图Canvas
- **Pinia Store**: 管理视图状态和产品数据

### 核心文件
- `public/js/canvas-manager.js:6` - Canvas管理器类
- `public/js/canvas-init.js:1` - 画布初始化入口
- `public/js/init.js:2` - 全局初始化函数
- `public/class-pw-admin-public.php:44` - 前端主类

### 数据流
1. WordPress加载插件
2. 前端页面加载时初始化Canvas系统
3. CanvasManager创建Fabric.js实例
4. 通过Pinia store管理产品状态和视图切换
5. 3D模型通过canvas纹理更新

## 开发注意事项

### Canvas初始化顺序
1. Fabric.js库加载
2. CanvasManager类定义
3. Pinia store初始化
4. Canvas实例创建
5. 图片和模型加载

### 调试要点
- 检查`window.CanvasManager`是否存在
- 验证Canvas DOM元素是否正确加载
- 查看浏览器控制台Fabric.js相关错误
- 确认Pinia store数据是否正确初始化

### 扩展开发
- 新功能添加到`public/js/design/components/`目录
- 产品相关功能添加到`public/js/product/components/`目录
- 后端API接口在`includes/class-pw-admin-promowares-api.php`
- 插件后台弹窗使用 micromodal