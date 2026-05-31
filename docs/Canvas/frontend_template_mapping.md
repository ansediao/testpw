# 前台页面模板文件映射

## Canvas 产品页面
- **URL模式**: `/pwcanvas/?product_id=XXX`
- **模板文件**: `modules/front_canvas/views/canvas-page.php`
- **说明**: 这是前台 Canvas 产品定制页面的主模板文件，负责渲染产品定制界面

## 相关文件结构
```
modules/front_canvas/
├── views/
│   ├── canvas-page.php                 # 主 Canvas 页面模板
│   └── partials/
│       ├── canvas-customization-area.php
│       ├── canvas-design_area.php
│       ├── canvas-dongtai-area.php
│       ├── canvas-header.php
│       ├── canvas-operation-panel.php
│       └── canvas-templates.php
└── assets/
    ├── js/
    │   ├── main/                       # 主要的前端逻辑模块（已按功能拆分）
    │   │   ├── core-init.js            # 全局状态、Tab 切换、画布初始化入口
    │   │   ├── events.js               # Fabric 事件绑定
    │   │   ├── layers-sync.js          # 图层面板与 Pinia 同步、mask 控制
    │   │   ├── preview.js              # 预览与弧形文字逻辑
    │   │   ├── color-utils.js          # 颜色选择工具
    │   │   ├── capture.js              # 多层 Canvas 截图 & PDF 支持
    │   │   ├── image-analyze.js        # 位图分析工具
    │   │   ├── grid-preview.js         # 四视图/多视图预览图生成
    │   │   └── universal-preview.js    # 多视图预览弹窗
    │   └── …                           # 其他辅助脚本（canvas-init.js、toolbar.js 等）
    └── scss/
        └── operation-panel.css
```

## 开发注意事项
- 模板文件遵循PHP与前端代码分离原则
- JavaScript 逻辑主要拆分在 `modules/front_canvas/assets/js/main/*.js` 模块中处理（如 `core-init.js`、`events.js` 等）
- 样式文件位于各模块的 `modules/*/assets/scss/` 目录下（运行时加载的是同目录下编译后的 `.css` 文件）
