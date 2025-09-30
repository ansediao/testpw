# PW Canvas Development Guidelines

Auto-generated from all feature plans. Last updated: [DATE]

## Active Technologies
[EXTRACTED FROM ALL PLAN.MD FILES]

### Canvas System Technologies
- **Fabric.js**: 2D画布渲染和操作的核心库
- **Three.js**: 3D模型支持和纹理映射
- **Vue.js/Pinia**: 前端状态管理（部分模块）
- **WordPress**: PHP插件后端框架
- **WooCommerce**: 电商集成平台

## Project Structure
```
[ACTUAL STRUCTURE FROM PLANS]

### Canvas System Structure
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

## Commands
[ONLY COMMANDS FOR ACTIVE TECHNOLOGIES]

### WordPress/PHP Commands
```bash
# 检查PHP语法错误
php -l pw-admin.php

# WordPress插件激活
# 将项目目录复制到 wp-content/plugins/
# 在WordPress后台激活"PW Canvas"插件
```

### Canvas System Debug Commands
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

## Code Style
[LANGUAGE-SPECIFIC, ONLY FOR LANGUAGES IN USE]

### Naming Conventions (章程要求)
- **全局变量**: 使用`pwca_`或`PWCA_`前缀
- **CSS类名**: 使用`pwca-`前缀
- **JavaScript函数**: 使用`pw`或`canvas`前缀
- **PHP类**: 使用`Pw_Admin_`前缀
- **API端点**: 使用`/pw/v1/`命名空间

### File Naming Conventions
- **PHP类文件**: `class-pw-admin-{功能}.php`
- **JavaScript模块**: 小写加连字符，如`canvas-manager.js`
- **CSS文件**: 功能名加`.css`，如`layers-panel.css`
- **模板文件**: 描述性命名加`.php`，如`canvas-operation-panel.php`

### Canvas System Development Rules
- 所有Canvas操作必须通过CanvasManager进行
- Canvas实例不应直接存储在Vue响应式数据中
- 新增Canvas功能时需要考虑多视图模式兼容性
- 系统图片加载时必须添加`skipLayerSync: true`标记

### API Integration Rules
- 新增API接口优先考虑使用WordPress REST API
- 所有外部API调用必须通过`class-pw-admin-promowares-api.php`处理
- API认证信息不得硬编码在前端代码中
- 错误处理必须提供用户友好的反馈信息

## Recent Changes
[LAST 3 FEATURES AND WHAT THEY ADDED]

## Canvas System Debugging Checklist
1. 验证`window.CanvasManager`是否正确加载
2. 检查Canvas DOM元素是否存在且ID正确
3. 确认Fabric.js库已完整加载
4. 验证Pinia store数据初始化正确性
5. 查看浏览器控制台是否有相关错误信息

## Extension Development Guidelines
- 设计相关功能添加到`public/js/design/components/`
- 产品相关功能添加到`public/js/product/components/`
- PHP后台功能添加到`public/modules/`
- API接口统一在`includes/class-pw-admin-promowares-api.php`中管理
- 前端弹窗统一使用micromodal库

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->