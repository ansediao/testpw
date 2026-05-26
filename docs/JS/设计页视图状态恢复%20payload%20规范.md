# 设计页视图状态恢复 payload 规范

## 适用范围

- `modules/front_canvas/assets/js/design/stores/view-restore-helper.js`
- `modules/front_canvas/assets/js/design/stores/index.js`
- `modules/front_canvas/assets/js/design/utils/canvas-state-manager.js`

## 职责边界

- `view-restore-helper.js` 负责：
  - 标准化恢复时写入 store 的 `layers / layerGroups` payload
  - 统一恢复前的数组兜底、对象过滤、浅拷贝
- `useCanvasStore.restoreViewData()` 负责：
  - 接收标准化后的 payload
  - 更新 `viewLayers / viewLayerGroups`
  - 在当前激活视图下同步 `layers / layerGroups`
- `canvas-state-manager.js` 负责：
  - 从存储和画布对象重建恢复数据
  - 在真正写入 store 前调用 payload 标准化 helper

## 设计原则

- store 不直接假设恢复入参一定合法
- 恢复链路中的 `layers` 与 `layerGroups` 在写入前统一标准化
- `canvas-state-manager` 与 `useCanvasStore` 不重复手写同一套兜底逻辑
- 降级恢复路径也必须复用同一套 payload 规则

## payload 规范

- `layers`
  - 非数组时转为空数组
  - 过滤 `null`、数组、非对象项
  - 保留对象原字段，执行浅拷贝
- `layerGroups`
  - 非数组时转为空数组
  - 过滤 `null`、数组、非对象项
  - 保留对象原字段，执行浅拷贝

## 兼容要求

- 不改变现有 layer / group 字段名
- 不改变恢复算法本身，只统一“写入 store 前”的 payload 规范
- 保留 `window.pwcaNormalizeViewRestorePayload` 给非模块脚本复用
