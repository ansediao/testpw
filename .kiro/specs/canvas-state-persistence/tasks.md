# 实现计划：画布状态持久化

## 概述

本实现计划将画布状态持久化功能分解为可执行的编码任务。实现将使用 JavaScript 和现有的 Vue 3 + Pinia 架构，利用 VueUse 的 useStorage API 进行本地存储。

## 当前状态

现有代码中 `header-controls.js` 已实现基础的画布 JSON 保存功能（保存到 `pwca-canvas-states-by-product-id`），但缺少：
- 完整的状态管理器模块
- 图层元数据、图层组、印刷方式映射的持久化
- 页面加载时的状态恢复
- 颜色选择的持久化

## 任务

- [x] 1. 创建 Canvas State Manager 核心模块
  - [x] 1.1 创建 `public/js/design/utils/canvas-state-manager.js` 文件
    - 实现 CanvasStateManager 类的基础结构
    - 实现 `init(productId)` 方法，从 URL 获取产品 ID
    - 实现 `getStorageKey(productId)` 方法
    - 使用 VueUse useStorage 初始化存储（键名格式：`pwca-canvas-state-{productId}`）
    - 定义数据版本号 `CURRENT_VERSION = '1.0.0'`
    - _需求: 1.2, 6.1_

- [x] 2. 实现状态保存功能
  - [x] 2.1 实现 `saveViewState(viewId)` 方法
    - 从 CanvasManager 获取画布实例
    - 调用 canvas.toJSON() 序列化画布对象
    - 从 Canvas Store 获取图层和图层组数据
    - 从 Print Method Store 获取 layerPrintMethodMap 和 groupPrintMethodMap
    - 组装完整的 ViewState 数据结构
    - _需求: 1.1, 2.1, 3.1, 4.1_
  - [x] 2.2 实现防抖保存机制
    - 使用 300ms 防抖避免频繁写入
    - 检查 `isRestoringState` 标记防止循环保存
    - _需求: 1.1_
  - [x] 2.3 实现 `saveAllViewStates()` 方法
    - 遍历所有视图并保存状态
    - 保存 selectedColorsByView 数据
    - _需求: 5.1, 8.1_

- [x] 3. 实现状态恢复功能
  - [x] 3.1 实现 `restoreViewState(viewId)` 方法
    - 从 LocalStorage 读取状态数据
    - 验证数据有效性（版本号、必需字段）
    - 使用 fabric.loadFromJSON 恢复画布对象
    - 使用 fabric.util.enlivenObjects 处理图片对象的异步加载
    - _需求: 1.3, 1.4_
  - [x] 3.2 实现图层数据恢复
    - 调用 Canvas Store 的 restoreViewData 方法
    - 恢复图层元数据（id、type、name、locked、groupId）
    - 保持图层顺序一致性
    - _需求: 2.2, 2.4_
  - [x] 3.3 实现图层组恢复
    - 恢复图层组数据（id、name、expanded、locked、selectOnly）
    - 正确关联图层的 groupId
    - _需求: 3.2, 3.4_
  - [x] 3.4 实现印刷方式映射恢复
    - 调用 Print Method Store 的 restorePrintMethodMappings 方法
    - 恢复 layerPrintMethodMap 和 groupPrintMethodMap
    - 调用 recomputeUsedPrintMethodsForView 重新计算已使用印刷方式
    - _需求: 4.2, 4.3_
  - [x] 3.5 实现颜色选择恢复
    - 恢复 selectedColorsByView 到 Canvas Store
    - _需求: 8.2_

- [x] 4. 扩展 Pinia Stores
  - [x] 4.1 扩展 Canvas Store（`public/js/design/stores/index.js`）
    - 添加 `isRestoringState: false` 状态
    - 添加 `setRestoringState(value)` 方法
    - 添加 `restoreViewData(viewId, { layers, layerGroups })` 方法
    - _需求: 2.2, 3.2_
  - [x] 4.2 扩展 Print Method Store（`public/js/design/stores/printMethodStore.js`）
    - 添加 `restorePrintMethodMappings(viewId, { layerMap, groupMap })` 方法
    - _需求: 4.2_

- [x] 5. 实现状态清除功能
  - [x] 5.1 实现 `clearProductState(productId)` 方法
    - 从 LocalStorage 删除指定产品的所有数据
    - _需求: 7.1_
  - [x] 5.2 实现 `clearViewState(viewId)` 方法
    - 从存储中删除指定视图的数据
    - _需求: 7.2, 7.3_

- [x] 6. 实现错误处理
  - [x] 6.1 实现数据验证函数
    - 验证 JSON 结构完整性
    - 验证必需字段存在
    - 验证数据类型正确
    - _需求: 1.5_
  - [x] 6.2 实现错误处理逻辑
    - 处理 JSON 解析错误
    - 处理 LocalStorage 不可用情况（降级为内存存储）
    - 处理存储配额超限
    - 实现数据版本迁移逻辑
    - 使用统一日志格式：`console.error('[CanvasStateManager] 错误类型:', errorType, '详情:', details)`
    - _需求: 1.5_

- [x] 7. 集成到现有系统
  - [x] 7.1 在页面初始化时初始化 CanvasStateManager
    - 在 multiViewInitComplete 事件后初始化
    - 自动恢复已保存的状态
    - 将 CanvasStateManager 实例挂载到 window 对象
    - _需求: 1.2, 1.3_
  - [x] 7.2 监听画布变更事件
    - 监听 object:added、object:modified、object:removed 事件
    - 触发防抖保存
    - _需求: 1.1, 2.3_
  - [x] 7.3 监听视图切换
    - 在 setActiveViewId 方法中集成状态保存/恢复
    - 切换前保存当前视图状态
    - 切换后恢复目标视图状态
    - _需求: 5.2, 5.3_
  - [x] 7.4 监听图层和图层组变更
    - 监听 Store 中 viewLayers 和 viewLayerGroups 的变化
    - 触发状态保存
    - _需求: 2.3, 3.3_
  - [x] 7.5 监听印刷方式变更
    - 监听 layerPrintMethodMap 和 groupPrintMethodMap 变化
    - 触发状态保存
    - _需求: 4.4_
  - [x] 7.6 监听颜色选择变更
    - 监听 selectedColorsByView 变化
    - 触发状态保存
    - _需求: 8.3_
  - [x] 7.7 移除 header-controls.js 中的重复保存逻辑
    - 删除 `updateHistory` 函数中的 localStorage 同步代码
    - 统一由 CanvasStateManager 管理状态持久化
    - _需求: 1.1_

- [ ] 8. 检查点 - 功能验证
  - 在浏览器中测试以下场景：
    1. 添加文字/图片后刷新页面，验证对象恢复
    2. 创建图层组后刷新页面，验证图层组恢复
    3. 绑定印刷方式后刷新页面，验证绑定恢复
    4. 切换视图后刷新页面，验证各视图状态独立
    5. 测试不同产品之间的数据隔离
    6. 测试颜色选择恢复
    7. 测试错误数据处理（手动破坏 localStorage 数据）
  - 如有问题请告知

## 注意事项

- 所有任务使用 JavaScript（非 TypeScript）
- 使用 VueUse 的 useStorage 进行本地存储
- 保持与现有代码风格一致
- 确保不破坏现有功能（特别是 header-controls.js 中的撤销/重做功能）
- 高内聚低耦合
- 存储键名格式：`pwca-canvas-state-{productId}`
