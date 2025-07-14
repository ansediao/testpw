## 文件结构
├── LICENSE.txt                       // 许可证信息
├── README.txt                        // 项目说明文档
├── admin\
│   ├── class-pw-admin-admin.php      // 管理员相关的PHP类
│   ├── css\
│   │   └── pw-admin-admin.css        // 管理员界面的CSS样式
│   ├── index.php                     // 管理员模块的入口文件
│   ├── js\
│   │   └── pw-admin-admin.js         // 管理员界面的JavaScript
│   └── partials\
│       └── pw-admin-admin-display.php // 管理员界面的部分显示逻辑
├── includes\
│   ├── class-pw-admin-activator.php  // 插件激活类
│   ├── class-pw-admin-deactivator.php // 插件停用类
│   ├── class-pw-admin-i18n.php       // 国际化相关类
│   ├── class-pw-admin-loader.php     // 加载器类
│   ├── class-pw-admin.php            // 主插件类
│   └── index.php                     // 包含模块的入口文件
├── index.php                         // 主入口文件
├── languages\
│   └── pw-admin.pot                  // 翻译模板文件
├── public\
│   ├── class-pw-admin-public.php     // 前端展示相关的PHP类
│   ├── css\
│   │   ├── pw-admin-public.css       // 前端展示的CSS样式
│   │   ├── template-canvas-display.css // 模板画布显示的CSS
│   │   ├── template-canvas-display.css.map // CSS映射文件
│   │   └── template-canvas-display.scss // 模板画布显示的SCSS
│   ├── index.php                     // 前端模块的入口文件
│   ├── js\
│   │   ├── boundary.js               // 边界处理的JavaScript
│   │   ├── canvas-init.js            // 画布初始化的JavaScript
│   │   ├── export.js                 // 导出功能的JavaScript
│   │   ├── layer-manager.js          // 图层管理的JavaScript
│   │   ├── main.js                   // 主JavaScript文件
│   │   ├── model-3d.js               // 3D模型处理的JavaScript
│   │   ├── pw-admin-public.js        // 前端展示的JavaScript
│   │   └── toolbar.js                // 工具栏的JavaScript
│   └── partials\
│       ├── footer-product-card.vue   // 页脚产品卡片的Vue组件
│       ├── our-recommendation.vue    // 推荐组件的Vue文件
│       ├── product-card.vue          // 产品卡片的Vue组件
│       ├── pw-admin-public-display.php // 前端展示的部分显示逻辑
│       └── template-canvas-display.php // 模板画布显示的PHP文件
├── pw-admin.php                      // 插件的主文件
└── uninstall.php                     // 插件卸载文件

## 命名规范
- 类名采用驼峰命名法，首字母大写
- 函数名采用驼峰命名法，首字母小写
- 变量名采用驼峰命名法，首字母小写
- 语义化命名
- 避免使用缩写

## Vue Rules
- 以CDN 的方式引入Vue
- 使用 Component 方式组织代码

## PHP
- 兼容PHP 5.6及以上版本
- 遵循 PHPDoc 注释规范

## JS Rules
- 遵循 JSDoc 注释规范