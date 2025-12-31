# 需求文档

## 简介

本功能为 PW Canvas 在线设计页面 (`/pwcanvas/`) 提供画布状态持久化能力。当用户在设计页面进行编辑操作（如添加文字、图片、调整设置、设置图层、绑定印刷方式等）后，页面刷新时能够自动恢复画布状态，包括图层、图层组和绑定的印刷方式。

## 术语表

- **Canvas_State_Manager**: 负责管理画布状态持久化的核心模块，处理状态的保存、加载和恢复
- **Canvas_Store**: Pinia 状态管理仓库，存储画布相关的响应式数据
- **Print_Method_Store**: Pinia 状态管理仓库，存储印刷方式相关的数据
- **View**: 产品的视图（如正面、背面等），每个视图有独立的画布
- **Layer**: 画布上的图层对象（文字、图片等）
- **Layer_Group**: 图层组，将多个图层组织在一起并关联印刷方式
- **Print_Method**: 印刷方式，定义图层的打印参数和限制
- **Product_ID**: 产品唯一标识符，用于区分不同产品的画布状态
- **Local_Storage**: 浏览器本地存储，用于持久化画布状态数据

## 需求

### 需求 1: 画布对象状态持久化

**用户故事:** 作为设计师，我希望页面刷新后画布对象（文字、图片）能够保留，这样我就不会丢失设计工作。

#### 验收标准

1. 当用户在画布上添加或修改对象时，Canvas_State_Manager 应在 500ms 内将画布状态序列化并保存到 Local_Storage
2. 当设计页面加载时，Canvas_State_Manager 应检查 Local_Storage 中是否存在当前 Product_ID 的画布状态数据
3. 当 Local_Storage 中存在有效的画布状态数据时，Canvas_State_Manager 应将所有画布对象恢复到其保存的位置、大小和属性
4. 恢复画布状态时，Canvas_State_Manager 应保留对象属性，包括位置、缩放、旋转、颜色和文本内容
5. 如果 Local_Storage 中的画布状态数据损坏或无效，Canvas_State_Manager 应记录错误并初始化空画布

### 需求 2: 图层数据持久化

**用户故事:** 作为设计师，我希望页面刷新后图层组织结构能够保留，这样我可以继续使用我的图层结构。

#### 验收标准

1. 保存画布状态时，Canvas_State_Manager 应在保存的数据中包含图层元数据（id、类型、名称、锁定状态）
2. 恢复画布状态时，Canvas_State_Manager 应使用正确的元数据恢复 Canvas_Store 中的图层列表
3. 当图层被添加、删除或修改时，Canvas_State_Manager 应更新持久化的图层数据
4. Canvas_State_Manager 应保持保存和恢复状态之间的图层顺序一致性

### 需求 3: 图层组持久化

**用户故事:** 作为设计师，我希望页面刷新后图层组能够保留，这样我可以保持有组织的设计结构。

#### 验收标准

1. 保存画布状态时，Canvas_State_Manager 应在保存的数据中包含图层组数据（id、名称、成员图层、展开状态）
2. 恢复画布状态时，Canvas_State_Manager 应恢复所有图层组，并正确关联其成员图层
3. 当图层组被创建、修改或删除时，Canvas_State_Manager 应更新持久化的图层组数据
4. Canvas_State_Manager 应在保存和恢复期间保留每个图层对象上的 groupId 属性

### 需求 4: 印刷方式绑定持久化

**用户故事:** 作为设计师，我希望页面刷新后印刷方式分配能够保留，这样我就不需要重新为图层和图层组分配印刷方式。

#### 验收标准

1. 保存画布状态时，Canvas_State_Manager 应在保存的数据中包含印刷方式映射（layerPrintMethodMap、groupPrintMethodMap）
2. 恢复画布状态时，Canvas_State_Manager 应将印刷方式分配恢复到 Print_Method_Store
3. 恢复画布状态时，Canvas_State_Manager 应重新计算每个视图的已使用印刷方式
4. 当印刷方式被分配或取消分配时，Canvas_State_Manager 应更新持久化的印刷方式映射数据

### 需求 5: 多视图状态管理

**用户故事:** 作为设计师，我希望每个产品视图的画布状态能够独立保存，这样我可以在不同视图上工作而不会丢失进度。

#### 验收标准

1. Canvas_State_Manager 应使用视图 ID 作为键，为每个视图单独存储画布状态
2. 在视图之间切换时，Canvas_State_Manager 应在切换前保存当前视图的状态
3. 切换到某个视图时，如果该视图有保存的状态，Canvas_State_Manager 应恢复该视图的保存状态
4. Canvas_State_Manager 应使用包含 Product_ID 和视图 ID 的存储键格式，以防止数据冲突

### 需求 6: 产品隔离

**用户故事:** 作为设计师，我希望每个产品的画布状态相互隔离，这样在一个产品上工作不会影响另一个产品的保存状态。

#### 验收标准

1. Canvas_State_Manager 应使用 URL 参数中的 Product_ID 来命名所有存储的数据
2. 加载画布状态时，Canvas_State_Manager 应只加载与当前 Product_ID 匹配的数据
3. Canvas_State_Manager 不应覆盖或访问属于其他产品的画布状态数据

### 需求 7: 状态清除功能

**用户故事:** 作为设计师，我希望能够清除保存的画布状态，这样我可以在需要时重新开始。

#### 验收标准

1. Canvas_State_Manager 应提供清除当前产品保存状态的方法
2. Canvas_State_Manager 应提供清除特定视图保存状态的方法
3. 当状态被清除时，Canvas_State_Manager 应立即从 Local_Storage 中删除相应的数据

### 需求 8: 颜色选择持久化

**用户故事:** 作为设计师，我希望每个视图的颜色选择在页面刷新后能够保留，这样我就不需要重新选择颜色。

#### 验收标准

1. 保存画布状态时，Canvas_State_Manager 应在保存的状态中包含 selectedColorsByView 数据
2. 恢复画布状态时，Canvas_State_Manager 应将颜色选择恢复到 Canvas_Store
3. 当为某个视图选择颜色时，Canvas_State_Manager 应更新持久化的颜色选择数据
