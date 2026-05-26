# PW Canvas Code Wiki

## 文档目标

这套 Code Wiki 用于帮助开发者快速理解 `PW Canvas` 插件仓库的整体结构、模块边界、关键类职责、接口入口、运行方式以及主要数据流。

本项目不是一个独立运行的 Node 或 Composer 应用，而是一个运行在 WordPress + WooCommerce 环境中的模块化插件。

## 阅读顺序

1. `01-project-architecture.md`
2. `02-modules-map.md`
3. `03-core-classes-and-key-functions.md`
4. `04-data-flow-and-interfaces.md`
5. `05-runtime-and-development.md`

## 文档索引

### 1. 项目架构

- 文件: `01-project-architecture.md`
- 关注点:
  - 插件启动链路
  - 核心加载器与模块扫描机制
  - 前后台分层
  - 目录结构与技术栈

### 2. 模块地图

- 文件: `02-modules-map.md`
- 关注点:
  - `admin_*`、`front_*`、`integration_*` 模块职责
  - 每个模块的关键入口类
  - 模块间依赖与耦合点

### 3. 核心类与关键函数

- 文件: `03-core-classes-and-key-functions.md`
- 关注点:
  - PHP 核心类
  - 前端关键入口脚本
  - 需要优先掌握的方法与作用

### 4. 数据流与接口

- 文件: `04-data-flow-and-interfaces.md`
- 关注点:
  - 产品页 -> 设计页 -> 购物车 -> 结账的主业务链路
  - REST API、AJAX、Action Scheduler 任务入口
  - 缓存与外部 API 代理策略

### 5. 运行与开发

- 文件: `05-runtime-and-development.md`
- 关注点:
  - 运行依赖
  - 安装与配置
  - SCSS 编译方式
  - 调试建议与开发注意事项

## 一句话总览

`PW Canvas` 的核心是一套“WordPress 插件主壳 + modules 目录自治模块 + WooCommerce 场景扩展 + Promowares API 代理 + Vue/Fabric/Three 前端设计器”的混合式模块化系统。
