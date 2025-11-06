# 设计页面 Stores 概述

本目录记录设计画布页（Fabric.js/Three.js相关）使用的 Pinia Stores，主要负责视图与图层、打印方式、产品数据片段等的状态管理。

- 页面源码根：`public/js/design/`
- 相关 Stores：
  - `useCanvasStore`（ID: `canvas`，路径：`public/js/design/stores/index.js`）
  - `usePrintMethodStore`（ID: `printMethod`，路径：`public/js/design/stores/printMethodStore.js`）
- 全局访问器：`window.useCanvasStore()`、`window.usePrintMethodStore()`

注意：遵循 CanvasManager 设计规范，Store 中不应直接持有 Fabric Canvas 实例；Canvas 状态以非响应式对象在 CanvasManager 中管理，Store 仅保存必要的序列化状态（如图层列表、分组ID、当前视图ID等）。