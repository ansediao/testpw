<!--
同步影响报告
版本变更: 0.0.0 → 1.0.0 (新章程创建)

修改的原则:
- 无 (新创建章程)

新增的章节:
- Core Principles: 模块化设计原则、防冲突命名规范、高质量开发原则、安全API集成、状态隔离原则、持续优化原则
- WordPress插件开发约束: WordPress标准遵循、WooCommerce集成规范、Canvas系统开发规范
- 开发工作流程: 代码审查要求、测试门禁、部署审批流程

删除的章节:
- 无

需要更新的模板:
✅ plan-template.md - 已检查，章程检查部分将自动基于新章程更新
✅ spec-template.md - 已检查，与章程原则一致
✅ tasks-template.md - 已检查，任务分类反映了新的原则驱动任务类型
✅ agent-file-template.md - 已更新，添加了Canvas特定指导

待办事项:
- 无占位符被有意延迟
-->

# PW Canvas Constitution

## Core Principles

### 模块化设计原则
构建模块化、可扩展的系统，支持多层次定制功能。每个组件必须独立可测试、文档化，具有明确职责。不允许创建仅用于组织结构的模块。

### 防冲突命名规范
所有代码必须严格遵循防冲突命名规范：全局变量使用`pwca_`或`PWCA_`前缀，CSS类名使用`pwca-`前缀，JavaScript函数使用`pw`或`canvas`前缀，PHP类使用`Pw_Admin_`前缀，API端点使用`/pw/v1/`命名空间。

### 高质量开发原则
致力于高质量开发和用户友好界面。所有功能必须提供用户友好的反馈信息，错误处理必须清晰明确。代码必须遵循最佳实践，确保系统在Promowares API数据同步下稳定运行。

### 安全API集成
安全的API集成和数据同步。所有外部API调用必须通过WordPress REST API代理，API认证信息不得硬编码在前端代码中。必须统一处理认证和错误，确保数据传输安全。

### 状态隔离原则
Canvas实例存储在WeakMap中，与Vue响应式系统隔离。所有Canvas操作必须通过CanvasManager进行，Canvas实例不应直接存储在Vue响应式数据中。系统图片加载时必须添加`skipLayerSync: true`标记。

### 持续优化原则
推动创意产品定制的数字化转型。新增功能时需要考虑多视图模式兼容性，遵循TDD开发流程，确保代码质量和系统稳定性。必须在满足现有功能稳定的基础上进行优化扩展。

## WordPress插件开发约束

### WordPress标准遵循
作为WordPress插件，必须严格遵循WordPress标准插件结构。新增API接口优先考虑使用WordPress REST API，所有PHP类必须使用`Pw_Admin_`前缀，文件命名遵循`class-pw-admin-{功能}.php`格式。

### WooCommerce深度集成
与WooCommerce深度集成时，必须确保产品定制功能与电商系统的无缝对接。产品状态通过Pinia store管理，支持响应式更新，视图切换通过事件系统协调Canvas和UI状态同步。

### Canvas系统开发规范
Canvas系统基于Fabric.js，必须遵循特定的开发规范。初始化顺序为：Fabric.js加载 → CanvasManager定义 → Pinia store初始化 → Canvas实例创建。每个产品视图都有独立的Canvas实例，通过viewId进行管理。

## 开发工作流程

### 代码审查要求
所有PR和审查必须验证对章程的合规性。复杂性必须有合理解释，使用CLAUDE.md文件进行运行时开发指导。代码必须通过PHP语法检查，确保没有语法错误。

### 测试门禁
在浏览器开发者工具中调试Canvas系统，验证`window.CanvasManager`是否正确加载，检查Canvas DOM元素是否存在且ID正确，确认Fabric.js库已完整加载，验证Pinia store数据初始化正确性。

### 部署审批流程
WordPress插件无需构建，直接开发。将项目目录复制到wp-content/plugins/，在WordPress后台激活"PW Canvas"插件。提交变更时必须遵循git工作流程，确保代码变更的可追溯性。

## Governance

本章程凌驾于所有其他实践之上。修订需要文档化、批准和迁移计划。所有PR和审查必须验证合规性。复杂性必须有合理解释。使用CLAUDE.md文件进行运行时开发指导。

**版本**: 1.0.0 | **制定日期**: 2025-10-01 | **最后修订**: 2025-10-01