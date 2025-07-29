# JavaScript 代码重构说明

## 概述

本次重构将 `public/modules/class-pw-product-customization.php` 文件中的内联 JavaScript 代码分离到独立的 JavaScript 文件中，提高了代码的可维护性和组织性。

## 文件结构变更

### 新增文件

1. **`public/js/product-customization.js`**
   - 主要的产品定制功能 JavaScript 代码
   - 包含颜色选择、渐变、自定义颜色等功能
   - 模态框事件处理
   - 全局函数定义

2. **`public/js/color-canvas.js`**
   - 颜色画布相关功能
   - Canvas 元素创建和管理
   - 响应式处理

3. **`public/css/product-customization.css`**
   - 产品定制相关样式
   - 颜色选择器样式
   - 模态框样式
   - 响应式设计

4. **`public/js/test-product-customization.js`**
   - 开发测试文件
   - 用于验证模块加载和功能正常性

### 修改文件

1. **`public/modules/class-pw-product-customization.php`**
   - 移除了大量内联 JavaScript 代码
   - 添加了脚本和样式入队功能
   - 保留了必要的 PHP 变量传递给 JavaScript
   - 简化了 HTML 结构，使用 CSS 类替代内联样式

## 功能模块

### 1. 产品定制核心功能 (`product-customization.js`)

- **初始化函数**: `initProductCustomization()`
- **渐变模态框**: `initGradientModal()`
- **自定义颜色模态框**: `initCustomColorModal()`
- **颜色框事件**: `initColorBoxEvents()`
- **全局函数设置**: `setupGlobalFunctions()`

### 2. 颜色画布功能 (`color-canvas.js`)

- **画布初始化**: `initColorCanvas()`
- **响应式处理**: 窗口大小变化时重新调整画布
- **图片加载和渲染**: 处理颜色叠加效果

### 3. 样式系统 (`product-customization.css`)

- **颜色选择器样式**: `.color-box` 及相关状态
- **模态框样式**: `.pw-modal` 系列类
- **响应式设计**: 适配不同屏幕尺寸
- **WooCommerce 集成样式**: 产品图片叠加效果

## 脚本加载机制

### PHP 端入队

```php
public function enqueue_scripts() {
    // 仅在产品页面且为同步产品时加载
    if (!is_product() || $pw_isSyncProduct != '1') {
        return;
    }
    
    // 入队样式文件
    wp_enqueue_style('pw-product-customization', ...);
    
    // 入队 JavaScript 文件
    wp_enqueue_script('pw-product-customization', ...);
    wp_enqueue_script('pw-color-canvas', ...);
}
```

### JavaScript 端初始化

```javascript
// 主模块自动初始化
document.addEventListener('DOMContentLoaded', function() {
    initProductCustomization();
});

// 颜色画布模块按需初始化
document.addEventListener('DOMContentLoaded', function() {
    if (typeof initColorCanvas === 'function') {
        initColorCanvas();
    }
});
```

## 依赖关系

```
jQuery (WordPress 核心)
├── product-customization.js (主模块)
│   ├── 颜色选择功能
│   ├── 模态框管理
│   └── 全局函数定义
└── color-canvas.js (画布模块)
    ├── 依赖 product-customization.js
    └── 画布渲染功能
```

## 优势

1. **代码分离**: JavaScript 代码从 PHP 文件中分离，提高可维护性
2. **模块化**: 功能按模块组织，便于扩展和修改
3. **缓存友好**: 独立的 JS/CSS 文件可以被浏览器缓存
4. **调试便利**: 独立文件便于调试和错误定位
5. **版本控制**: 更好的版本控制和代码审查体验
6. **性能优化**: 按需加载，仅在产品页面加载相关脚本

## 兼容性

- 保持与现有 Vue.js CDN 集成的兼容性
- 保持与 WordPress 钩子系统的兼容性
- 保持与 WooCommerce 的集成
- 向后兼容现有的全局函数调用

## 测试

使用 `test-product-customization.js` 文件可以在开发环境中测试：

1. 模块加载状态
2. 全局函数可用性
3. 颜色转换功能
4. 事件绑定状态

## 未来扩展

1. **TypeScript 支持**: 可以将 JavaScript 文件转换为 TypeScript
2. **模块打包**: 使用 Webpack 或其他打包工具优化
3. **单元测试**: 添加 Jest 或其他测试框架
4. **代码分割**: 按功能进一步分割代码模块
5. **ES6 模块**: 升级到现代 JavaScript 模块系统

## 注意事项

1. 确保在 WordPress 环境中正确加载脚本
2. 注意 PHP 变量到 JavaScript 的传递
3. 保持与现有 Vue.js 应用的兼容性
4. 测试在不同浏览器中的兼容性
5. 确保在生产环境中的性能表现