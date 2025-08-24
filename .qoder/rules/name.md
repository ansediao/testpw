---
trigger: always_on
alwaysApply: true
---
# PW Canvas 防冲突命名规范

## 基础前缀规范

1. **统一前缀**: 使用 "pwca" (PW Canvas) 作为防冲突前缀
2. **CSS类名和ID**: 使用 "pwca-" 前缀，采用BEM命名法 (如：`.pwca-modal__header--active`)
3. **全局JavaScript函数**: 使用 "pwca" 前缀 (如：`pwcaInitCanvas()`, `pwcaSaveDesign()`)
4. **全局变量和对象**: 挂载到 `window.pwca*` (如：`window.pwcaCanvasManager`)
5. **自定义事件**: 使用 "pwca" 前缀 (如：`pwcaCanvasReady`, `pwcaDesignSaved`)
6. **WordPress钩子**: 使用 "pwca_" 前缀 (如：`pwca_after_canvas_init`)
7. **Ajax动作**: 使用 "pwca_" 前缀 (如：`pwca_save_design`)
8. **REST API端点**: 使用 "pwca/" 或 "pwca-canvas/" 前缀 (如：`pwca/designs`, `pwca-canvas/products`)
9. **SCSS变量**: 使用 "$pwca-" 前缀系统 (如：`$pwca-primary-color`, `$pwca-border-radius`)
10. **PHP类名**: 使用 "Pwca_" 前缀 (如：`Pwca_Canvas_Manager`, `Pwca_Design_Handler`)

## BEM命名法规范

- 采用 `pwca-module__element--modifier` 格式
- **模块级**: `.pwca-modal`、`.pwca-toolbar`、`.pwca-canvas`
- **元素级**: `.pwca-modal__header`、`.pwca-modal__content`、`.pwca-modal__footer`
- **修饰符**: `.pwca-modal--active`、`.pwca-button--primary`、`.pwca-layer--selected`

## 冲突预防机制

1. 创建项目级类名注册表（JSON/数据库）
2. 开发时自动校验新类名唯一性
3. 高频基础类名添加二级前缀（如"pwca-core-button"）

## 工程化实现

采用Sass/Less嵌套语法实现命名空间隔离：

```scss
.pwca-module {
  &__header { ... }
  &__content { ... }
  &--active { ... }
  &--disabled { ... }
}
```

## 组件内部作用域

组件内部可保持现有命名无需前缀，但对外暴露的接口必须遵循上述规范。

---