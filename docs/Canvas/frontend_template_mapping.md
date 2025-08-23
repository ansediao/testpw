# 前台页面模板文件映射

## Canvas 产品页面
- **URL模式**: `/pwcanvas/?product_id=XXX`
- **模板文件**: `public/partials/template-canvas-display.php`
- **说明**: 这是前台Canvas产品定制页面的主模板文件，负责渲染产品定制界面

## 相关文件结构
```
public/
├── partials/
│   ├── template-canvas-display.php  # 主Canvas页面模板
│   ├── canvas-customization-area.php
│   ├── canvas-design_area.php
│   ├── canvas-dongtai-area.php
│   ├── canvas-header.php
│   ├── canvas-operation-panel.php
│   └── canvas-preview_area.php
├── js/
│   └── main.js  # 主要的前端逻辑文件
└── css/
    └── operation-panel.css
```

## 开发注意事项
- 模板文件遵循PHP与前端代码分离原则
- JavaScript逻辑主要在 `public/js/main.js` 中处理
- 样式文件位于 `public/css/` 目录下