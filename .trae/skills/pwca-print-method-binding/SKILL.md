---
name: "pwca-print-method-binding"
description: "PWCA 印刷方式绑定全流程指南。Invoke when adding/modifying print method binding triggers, check logic, modal UI, assignment service, or layer-group mapping for the online designer."
---

# PWCA Print Method Binding

用于规范 `modules/front_canvas/` 中与印刷方式（Print Method）绑定相关的触发、检查、弹窗交互、核心分配和 Store 状态管理的全流程，确保各入口的绑定检查逻辑一致、弹窗复用正确、分配后状态同步完整。

## 何时调用

当出现以下任一场景时应调用本 Skill：

- 用户要求新增或修改印刷方式绑定的触发入口（如画布事件、工具栏按钮、图层面板）
- 需要修改印刷方式绑定检查逻辑 `hasPrintMethodAssigned` / `pwcaObjectHasPrintMethod`
- 需要修改印刷方式分配弹窗 UI 或交互流程
- 需要修改 `assignLayerToPrintMethodWithGrouping` 或 `changeGroupPrintMethodWithGrouping` 分配/切换逻辑
- 需要修改 `printMethodStore` 的状态字段、getter 或 action
- 需要新增调用 `pwcaTriggerPrintMethodModal` 的场景
- 需要修复印刷方式与图层组的映射同步问题

## 适用文件

| 文件 | 职责 |
|------|------|
| `modules/front_canvas/assets/js/main/events.js` | 画布事件触发：拖拽/缩放/旋转时检查并弹出绑定弹窗 |
| `modules/front_canvas/assets/js/main/dongtai-toolbar.js` | 动态工具栏拦截：文字/图片按钮点击前检查印刷方式 |
| `modules/front_canvas/assets/js/design/utils/print-area-validator.js` | 打印区域验证：`hasPrintMethodAssigned`、打印区域边界、拖拽后重定位 |
| `modules/front_canvas/assets/js/design/stores/printMethodStore.js` | Pinia Store：印刷方式数据、图层/组映射、引用计数 |
| `modules/front_canvas/assets/js/design/stores/print-method-mapper.js` | API 数据格式转换 |
| `modules/front_canvas/assets/js/design/api/print-method-api.js` | 后端 REST API 调用 |
| `modules/front_canvas/assets/js/design/components/layers/print-methods.js` | 图层面板印刷方式 Helper：弹窗打开/关闭/分配 |
| `modules/front_canvas/assets/js/design/components/layers/print-method-assignment-service.js` | 核心分配服务：`assignLayerToPrintMethodWithGrouping`、`changeGroupPrintMethodWithGrouping` |
| `modules/front_canvas/assets/js/design/components/layer-modals.js` | 弹窗 HTML 模板（micromodal） |
| `modules/front_canvas/assets/js/design/components/layers.js` | 图层面板主入口：注册 `window.pwcaTriggerPrintMethodModal` |
| `modules/front_canvas/assets/js/main/ui-state-access.js` | UI 状态访问桥接：`pwcaGetPrintMethodStore`、`pwcaGetPrintMethodForObject` |
| `modules/front_canvas/assets/js/main/capture.js` | 截图导出：按印刷方式分层合成 |

## 核心架构

### 系统分层

```
事件触发层                验证层           UI 交互层              核心分配层            数据层
┌─────────────┐     ┌──────────────┐  ┌────────────────┐  ┌──────────────────────┐  ┌──────────────────┐
│ events.js   │     │ print-area-  │  │ layer-modals   │  │ print-method-        │  │ printMethodStore │
│ (拖拽触发)   │────▶│ validator.js │  │ (弹窗模板)      │  │ assignment-service   │  │ (Pinia Store)    │
│             │     │              │  │                │  │ (分配/切换逻辑)       │  │                  │
│ dongtai-    │     │ hasPrint-    │  │ print-methods  │──▶│                      │──▶│ layerPrintMethod-│
│ toolbar.js  │     │ Method-      │  │ (Helper)       │  │ assignLayer...       │  │ Map              │
│ (工具栏拦截) │     │ Assigned()   │  │                │  │ changeGroup...       │  │ groupPrintMethod-│
└─────────────┘     └──────────────┘  │ layers.js      │  └──────────────────────┘  │ Map              │
                                      │ (全局入口)      │                            │ viewPrintMethods │
                                      └────────────────┘                            └──────────────────┘
```

### 调用链路

```
用户操作
  │
  ├─ 画布拖拽/缩放/旋转
  │   └─ events.js: pwcaObjectHasPrintMethod() → 未绑定 → pwcaTriggerPrintMethodBindingModal()
  │       └─ layers.js: window.pwcaTriggerPrintMethodModal(layerId)
  │           └─ print-methods.js: showGroupAssignDialog(layer)
  │               └─ layer-modals.js: 显示 pwca-print-method-modal
  │                   └─ 用户选择印刷方式 → assignLayerToPrintMethod()
  │                       └─ print-method-assignment-service.js: assignLayerToPrintMethodWithGrouping()
  │                           ├─ printMethodStore.assignLayerPrintMethod()
  │                           ├─ printMethodStore.assignGroupPrintMethod()
  │                           ├─ printMethodStore.recomputeUsedPrintMethodsForView()
  │                           ├─ ensureGroupExists() → store.setViewLayerGroups()
  │                           └─ validateCanvasObjects() → PrintAreaValidator.validateAndRepositionObject()
  │
  ├─ 工具栏按钮点击
  │   └─ dongtai-toolbar.js: pwcaToolbarRequirePrintMethod()
  │       └─ PrintAreaValidator.hasPrintMethodAssigned() → 未绑定 → pwcaTriggerPrintMethodModal()
  │
  └─ 图层面板操作
      ├─ "Switch Printing Method" 按钮
      │   └─ print-methods.js: showGroupAssignDialog(layer) → 同上流程
      │
      ├─ 图层组印刷方式修改按钮
      │   └─ print-methods.js: showGroupPrintMethodDialog(group)
      │       └─ layer-modals.js: pwca-group-print-method-modal
      │           └─ confirmGroupPrintMethodChange()
      │               └─ print-method-assignment-service.js: changeGroupPrintMethodWithGrouping()
      │
      └─ 复制/删除图层或组
          └─ printMethodStore.isLayerCopyAllowed / isLayerDeleteAllowed / isGroupCopyAllowed / isGroupDeleteAllowed
```

## 核心规则

### 1. 印刷方式绑定检查：两个实现必须保持同步

项目中存在两个独立的检查函数，**逻辑必须始终保持一致**：

#### 1a. `PrintAreaValidator.hasPrintMethodAssigned(obj)` — 全局可用

位置：[print-area-validator.js](file:///d:/PW%20CANVAS/Main/modules/front_canvas/assets/js/design/utils/print-area-validator.js#L52-L73)

```js
function hasPrintMethodAssigned(obj) {
    if (!obj || !obj.id) return false;
    const printMethodStore = window.usePrintMethodStore ? window.usePrintMethodStore() : null;
    if (!printMethodStore) return false;
    // 检查图层直接分配的印刷方式
    const layerPrintMethod = printMethodStore.layerPrintMethodMap[obj.id];
    if (layerPrintMethod) return true;
    // 检查图层组分配的印刷方式
    if (obj.groupId) {
        const groupPrintMethod = printMethodStore.groupPrintMethodMap[obj.groupId];
        if (groupPrintMethod) return true;
        const match = String(obj.groupId).match(/^print-method-(.+)$/);
        if (match && match[1]) return true;
    }
    return false;
}
```

#### 1b. `pwcaObjectHasPrintMethod(obj)` — events.js 内部使用

位置：[events.js](file:///d:/PW%20CANVAS/Main/modules/front_canvas/assets/js/main/events.js#L93-L117)

```js
function pwcaObjectHasPrintMethod(obj) {
    if (!obj || !obj.id) return false;
    const stateAccess = window.pwcaUiStateAccess;
    if (!stateAccess) return false;
    const printMethodStore = typeof stateAccess.pwcaGetPrintMethodStore === 'function' 
        ? stateAccess.pwcaGetPrintMethodStore() : null;
    if (!printMethodStore) return false;
    const layerMethodId = printMethodStore.layerPrintMethodMap ? printMethodStore.layerPrintMethodMap[obj.id] : null;
    if (layerMethodId) return true;
    if (obj.groupId) {
        const groupMethodId = printMethodStore.groupPrintMethodMap ? printMethodStore.groupPrintMethodMap[obj.groupId] : null;
        if (groupMethodId) return true;
        const match = String(obj.groupId).match(/^print-method-(.+)$/);
        if (match && match[1]) return true;
    }
    return false;
}
```

**检查的三层逻辑（两函数一致）：**
1. 图层直接分配：`layerPrintMethodMap[obj.id]` 是否有值
2. 图层组分配：`groupPrintMethodMap[obj.groupId]` 是否有值
3. 组 ID 推断：`obj.groupId` 是否匹配 `print-method-<id>` 模式

**规则：** 任一检查返回 true 即表示已绑定印刷方式。修改任一检查函数时，必须同步更新另一个的实现。

### 2. 新增绑定触发入口的规范

当需要在新的交互点（如新工具栏、新面板）触发印刷方式绑定提示时：

#### 必须遵循的步骤：

1. **获取选中对象**：使用 `window.pwcaUiStateAccess.pwcaGetActiveObject()` 或画布 `getActiveObject()`
2. **检查绑定状态**：调用 `window.PrintAreaValidator.hasPrintMethodAssigned(obj)`
3. **触发弹窗**：若未绑定，调用 `window.pwcaTriggerPrintMethodModal(obj.id)`
4. **拦截操作**：若未绑定，return 阻止后续逻辑

#### 参考示例（dongtai-toolbar.js）：

```js
function pwcaToolbarRequirePrintMethod(activeObject) {
    if (!activeObject) return false;
    if (window.PrintAreaValidator &&
        typeof window.PrintAreaValidator.hasPrintMethodAssigned === 'function' &&
        !window.PrintAreaValidator.hasPrintMethodAssigned(activeObject)) {
        if (typeof window.pwcaTriggerPrintMethodModal === 'function') {
            window.pwcaTriggerPrintMethodModal(activeObject.id);
        }
        return true; // true = 已拦截
    }
    return false; // false = 未拦截，正常执行
}
```

### 3. 印刷方式分配弹窗系统

#### 弹窗类型

| 弹窗 ID | 用途 | 模板位置 |
|---------|------|----------|
| `pwca-print-method-modal` | 单个图层分配印刷方式 | [layer-modals.js](file:///d:/PW%20CANVAS/Main/modules/front_canvas/assets/js/design/components/layer-modals.js#L6-L100) |
| `pwca-group-print-method-modal` | 修改图层组印刷方式 | [layer-modals.js](file:///d:/PW%20CANVAS/Main/modules/front_canvas/assets/js/design/components/layer-modals.js#L103-L174) |

#### 弹窗挂载

- 弹窗模板通过 Teleport 挂载到 `#pwca-modal-root` 元素
- 使用 micromodal 库管理弹窗生命周期
- 全局入口 `window.pwcaTriggerPrintMethodModal(layerId)` 定义在 [layers.js](file:///d:/PW%20CANVAS/Main/modules/front_canvas/assets/js/design/components/layers.js#L374-L380)

#### 打开弹窗（showGroupAssignDialog）的条件

```js
// print-methods.js
const showGroupAssignDialog = (layer) => {
    if (printMethodStore.isSinglePrintMethod) {
        return; // 只有一种印刷方式时不弹窗，自动分配
    }
    selectedLayerForAssign.value = layer;
    const currentMethod = printMethodStore.getLayerPrintMethod(layer.id);
    selectedPrintMethodId.value = currentMethod
        ? currentMethod.id
        : printMethodStore.selectedPrintMethodId;
    activeTab.value = 'color';
    isPrintMethodModalOpen.value = true;
};
```

### 4. 核心分配服务（print-method-assignment-service.js）

#### `assignLayerToPrintMethodWithGrouping` — 单个图层分配

关键流程：
1. 验证印刷方式有效性
2. 调用 `validateLayerForPrintMethod` 检查图层类型兼容性
3. 通过 `ensureGroupExists` 创建/复用图层组
4. 更新图层的 `groupId` 和 `canvasObj.groupId`
5. 更新 PaintMethodStore 的 `layerPrintMethodMap`
6. 调用 `recomputeUsedPrintMethodsForView` 更新引用计数
7. 清理原空组
8. 触发打印区域验证 `validateCanvasObjects`

#### `changeGroupPrintMethodWithGrouping` — 图层组切换印刷方式

关键流程：
1. 验证新印刷方式
2. 逐层验证兼容性
3. 创建/迁移目标组
4. 批量更新所有图层映射
5. 派发 `pwcaGroupPrintMethodChanged` 自定义事件
6. 触发打印区域验证

### 5. printMethodStore 关键字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `viewPrintMethods` | `{viewId: [methods]}` | 按视图存储的印刷方式数据 |
| `currentViewPrintMethods` | `array` | 当前视图的印刷方式列表 |
| `selectedPrintMethodId` | `string\|null` | 当前选中的印刷方式 ID |
| `layerPrintMethodMap` | `{layerId: methodId}` | 图层→印刷方式直接映射 |
| `groupPrintMethodMap` | `{groupId: methodId}` | 图层组→印刷方式映射 |
| `usedPrintMethodsByView` | `{viewId: {methodId: methodObj}}` | 视图内已使用的印刷方式 |
| `usedPrintMethodCountsByView` | `{viewId: {methodId: count}}` | 引用计数 |

### 6. 图层组 ID 约定

图层组的 `groupId` 遵循命名约定：`print-method-<methodId>`

- `ensureGroupExists` 创建组时自动使用此格式
- `hasPrintMethodAssigned` 的第三步检查利用此约定推断印刷方式
- 当 `separate=true`（用户选择独立模式）时，额外添加时间戳后缀：`print-method-<methodId>-<timestamp>`

### 7. 单一印刷方式模式

当视图只有一种印刷方式时（`isSinglePrintMethod = true`）：
- `showGroupAssignDialog` 直接 return，不显示弹窗
- 自动使用唯一的印刷方式
- `isPrintMethodSwitchDisabled` 返回 true，禁用切换
- `isLayerPrintMethodSwitchDisabled` 也需要考虑此场景

### 8. 打印区域验证

`PrintAreaValidator` 在分配/切换印刷方式后自动触发：

```js
// 在 validateCanvasObjects 中调用
PrintAreaValidator.validateAndRepositionObject(canvasObj, viewId)
```

- 仅对**已绑定印刷方式**的对象进行打印区域检查
- 未绑定对象跳过验证（返回 isValid: true）
- 若对象在打印区域外，自动移至画布中心

## 新增触发点的检查清单

当需要为新的 UI 交互添加印刷方式绑定检查时：

- [ ] 检查逻辑使用 `window.PrintAreaValidator.hasPrintMethodAssigned(obj)` 或复用同逻辑
- [ ] 触发弹窗调用 `window.pwcaTriggerPrintMethodModal(obj.id)`
- [ ] 函数调用前做空值检查和类型检查（`typeof === 'function'`）
- [ ] 考虑单一印刷方式模式：`isSinglePrintMethod` 时不弹窗
- [ ] 考虑 `activeObject` 为 null 的情况（无选中对象时不拦截）
- [ ] 确认脚本加载顺序：`PrintAreaValidator` 在使用前已定义

## 相关 Skill

- `pwca-canvas-designer` — 画布设计器 JS 结构总览
- `pwca-layer-placement-guide` — 图层放置规则
- `pwca-module-architecture` — 模块架构指南
