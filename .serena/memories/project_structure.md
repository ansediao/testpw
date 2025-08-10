# PW Canvas 项目结构

## 根目录文件
- `pw-admin.php` - 插件主入口文件，定义插件信息和启动逻辑
- `uninstall.php` - 插件卸载脚本
- `index.php` - 安全防护文件
- `.gitignore` - Git 忽略文件配置

## 核心目录结构

### `/admin/` - 后台管理模块
```
admin/
├── class-pw-admin-admin.php     # 后台管理主类
├── css/
│   └── pw-admin-admin.css       # 后台样式
├── js/
│   ├── pw-admin-admin.js        # 后台主脚本
│   └── pw-admin-category-management.js  # 分类管理脚本
└── partials/
    ├── pw-admin-admin-display.php           # 后台主显示模板
    └── pw-admin-design-management-display.php  # 设计管理显示模板
```

### `/includes/` - 核心逻辑模块
```
includes/
├── class-pw-admin.php                    # 核心插件类
├── class-pw-admin-loader.php             # Hook 加载器
├── class-pw-admin-i18n.php               # 国际化处理
├── class-pw-admin-activator.php          # 插件激活处理
├── class-pw-admin-deactivator.php        # 插件停用处理
└── class-pw-admin-promowares-api.php     # Promowares API 集成
```

### `/public/` - 前台展示模块
```
public/
├── class-pw-admin-public.php    # 前台主类
├── css/                         # 前台样式目录（当前为空）
├── js/                          # 前台脚本目录
│   ├── main.js                  # 主脚本文件
│   ├── canvas-init.js           # 画布初始化
│   ├── canvas-api-renderer.js   # 画布API渲染器
│   ├── model-3d.js              # 3D模型处理
│   ├── toolbar.js               # 工具栏功能
│   ├── export.js                # 导出功能
│   ├── boundary.js              # 边界处理
│   ├── pw-admin-public.js       # 前台公共脚本
│   ├── design/                  # 设计模块
│   │   ├── main.js
│   │   ├── components/
│   │   │   └── layers.js
│   │   └── stores/
│   │       ├── index.js
│   │       └── printMethodStore.js
│   ├── product/                 # 产品模块
│   │   ├── main.js
│   │   ├── api/
│   │   │   └── productDataAPI.js
│   │   ├── components/          # Vue 组件
│   │   │   ├── AddToCart.js
│   │   │   ├── ColorVariants.js
│   │   │   ├── ProductAccessories.js
│   │   │   ├── ProductPriceInfo.js
│   │   │   ├── ProductQuantity.js
│   │   │   ├── QuantityDiscountSlider.js
│   │   │   └── component-validator.js
│   │   ├── debug/
│   │   │   └── moq-debugger.js
│   │   └── stores/
│   │       └── productStore.js
│   └── utils/                   # 工具函数目录
├── modules/                     # 功能模块类
│   ├── class-pw-auxiliary-functions.php
│   ├── class-pw-cart-admin-actions.php
│   ├── class-pw-cart-handler.php
│   ├── class-pw-cdn-loader.php
│   ├── class-pw-product-inquiry.php
│   └── class-pw-template-handler.php
└── partials/                    # 前台模板文件
    ├── template-canvas-display.php      # 主画布显示模板
    ├── canvas-header.php               # 画布头部
    ├── canvas-customization-area.php   # 定制区域
    ├── canvas-operation-panel.php      # 操作面板
    ├── canvas-design_area.php          # 设计区域
    ├── canvas-preview_area.php         # 预览区域
    ├── canvas-dongtai-area.php         # 动态区域
    ├── pw-admin-public-display.php     # 前台公共显示
    └── pw-product-cart-handler.php     # 产品购物车处理
```

### `/assets/` - 静态资源
```
assets/
└── images/
    └── icons/    # 图标资源
```

### `/languages/` - 国际化
```
languages/
└── pw-admin.pot    # 翻译模板文件
```

## 架构特点

1. **模块化设计**: 按功能模块组织代码，便于维护和扩展
2. **前后端分离**: admin 和 public 目录明确分离
3. **组件化前端**: JavaScript 按功能组织成组件和存储
4. **WordPress 标准**: 遵循 WordPress 插件开发最佳实践
5. **可扩展性**: 通过 Hook 系统支持功能扩展

## 关键入口点

- **插件启动**: `pw-admin.php` → `includes/class-pw-admin.php`
- **前台画布**: `public/partials/template-canvas-display.php`
- **后台管理**: `admin/class-pw-admin-admin.php`
- **API 集成**: `includes/class-pw-admin-promowares-api.php`