---
name: "store-customization-settings-guide"
description: "规范店铺级 /store/customization-settings 对接、字段使用与视图覆盖规则。Invoke when adding this API, mapping store settings, or merging with custom_views."
---

# 店铺定制设置对接指南

## 用途

用于实现或排查客户新提供的店铺级定制设置接口：

- 外部接口：`GET /api/v1/store/customization-settings`
- 认证方式：店铺 Token
- 主要用途：
  - 提供店铺级默认配置
  - 作为设计器、产品页、下单前校验的默认行为来源
  - 与产品定制接口里的 `custom_views` 一起参与最终配置合并

## 何时调用

- 需要新增或改造店铺级定制设置接口接入时
- 需要区分 `/customization-settings` 与 `/store/customization-settings` 时
- 需要实现设计器默认配置与视图配置合并逻辑时
- 需要梳理字段用途、显示开关、缓存策略时

## 关键边界

- `/customization-settings` 与 `/store/customization-settings` 不是同一个接口
- 不要用旧接口替代新接口
- 新接口是店铺级默认配置
- 产品/视图级配置仍来自产品定制接口中的 `custom_views`
- 最终优先级始终是：
  - `custom_view` 视图配置（`selected_modules`）
  - `store/customization-settings`（`active_modules`）
  - 插件内置默认值（`TEXT`, `UPLOAD`, `DESIGN`）

## 推荐接入顺序

进入定制页时，建议按以下顺序处理：

1. 请求 `GET /store/customization-settings`
2. 请求产品定制数据：
   - `GET /products/{id}/customization`
3. 合并当前视图配置与店铺默认配置
4. 如果视图中有 `printing_method_list_id`，再请求：
   - `GET /print-methods?ids={逗号拼接}`
5. 渲染设计器、价格区、提交前校验

## 缓存建议

- 按 `store_id` 缓存店铺定制设置
- 推荐使用 WordPress transient 或现有聚合缓存
- 换店、重新绑定、后台运营修改店铺设置后主动失效

## PRD 补充

### 后台入口

根据 PRD，`Customization Setting` 选项卡位于：

- 管理中台
- 店铺
- 产品推送设置

它承载的是大量"前台交互控制项"，不是单纯的数据展示配置。

### 字段业务语义

以下字段含义应优先按 PRD 业务语义理解，并与接口字段说明一起使用：

| PRD 字段名称 | 接口字段 | 主要用途 / 功能描述 |
|------|------|------|
| Image Format | `image_format` | 控制支持上传的图片格式。通常用于上传组件 `accept` 或文件类型校验。 |
| Size Unit | `size_unit` | 设置在线定制页面的长度单位，如 `inch`、`cm`。影响产品尺寸、设计器标尺、印刷区域尺寸展示。 |
| Auto-Select | `auto_select` | 控制添加或上传的图片图层进入画板后是否默认被选中。 |
| Stay On Top | `stay_on_top` | 控制上传的图片图层是否强制保持在画板最顶层。 |
| MOVABLE | `moveable` | 控制上传的图片图层是否允许在画板中移动。 |
| ROTATABLE | `rotatable` | 控制上传的图片图层是否允许在画板中旋转。 |
| SCALABLE | `scalable` | 控制上传的图片图层是否允许在画板中缩放。关闭后需同步限制相关缩放 UI。 |
| ALLOW UNPROPORTIONAL SCALING | `allow_unproportional_scaling` | 控制上传的图片图层是否允许非等比缩放。 |
| REMOVABLE | `removable` | 控制上传的图片图层是否允许被最终用户删除。 |
| Bitmap Image Consent | `bitmap_image_consent` | 位图颜色验证开关。开启后，当用户上传位图且印刷方式颜色受限时，需要用户确认。 |
| Vector Image Color Compliance | `vector_image_color_compliance` | 矢量图颜色合规性开关。开启后，要校验矢量图颜色是否与印刷方式允许颜色匹配。 |
| Item/Design | `fields_visibility.moq_fields[] -> items_design` | 控制底栏"只 / 设计"字段显示。 |
| Item/Color | `fields_visibility.moq_fields[] -> items_color` | 控制底栏"只 / 颜色"字段显示。 |
| RTS Date | `fields_visibility.delivery_time_fields[] -> rts_date` | 控制底栏"发货日期"字段显示。 |
| Arrival Date | `fields_visibility.delivery_time_fields[] -> arrival_date` | 控制底栏"到货日期"字段显示。 |
| Sample Order | `fields_visibility.moq_fields[] -> sample_order` | 控制整个前端"样品单"勾选框显示，包括产品页和定制页。 |
| Blank Item | `fields_visibility.cost_breakdown_fields[] -> blank_item` | 控制"基础价格"字段的显示与计算。若 PRD 中配置值为 `Blank Only`，还需隐藏相关按钮。 |
| Custom Fee | `fields_visibility.cost_breakdown_fields[] -> custom_fee` | 控制定制费用字段显示。 |
| Layer Depth | `layer_depth` | 控制上传图片图层在图层列表中的初始深度顺序。 |
| Scale Mode | `scale_mode` | 控制上传图片图层的缩放模式，例如平铺、覆盖、原始尺寸。 |

### 上传图片三项落地细则（实现口径）

#### 1) `image_format` → 上传 accept 与前端校验

- 推荐用法：同时用于
  - `<input type="file">` 的 `accept` 限制
  - 拖拽/选择文件时的前端格式校验（避免无效文件进上传接口）
- 兼容点：`JPG,PNG` 需要兼容 `.jpg/.jpeg/.png`（大小写不敏感，允许带点号）。

#### 2) `layer_depth` → 入画布初始层级

- `-1`：入画布后默认置顶（最上层）。
- `>= 0`：按 Fabric 对象索引尝试移动到对应层级；无法移动时可退化为默认添加顺序。

#### 3) `scale_mode` → 入画布初始缩放基准

- 常规视图：相对于当前舞台（canvas）的宽高计算
  - `fit`：等比完整放入（类似 CSS contain）
  - `cover`：等比铺满（类似 CSS cover）
  - `original`：保持原始尺寸（scale=1）
- **4-Grid Flow 特殊规则**：当画布上已存在"产品底图/轮廓"时，缩放与落点应相对于"产品边缘"而不是整张舞台
  - 查找顺序（仅用于确定产品边缘基准）：`FlexiCurve Layer` → `Base Layer`
  - 基准尺寸来源：优先取这两个层对应图片的 `dimensions.contentArea` / `dimensions.layerSize` 的宽高；若同名 Fabric 对象存在，可取对象渲染后的边界。

## 字段分层

### 一、直接读取店铺接口的字段

这些字段默认不依赖视图覆盖，可直接作为全局默认使用：

- `size_unit`
- `google_font`
- `font_size`
- `image_format`
- `layer_depth`
- `scale_mode`
- `stay_on_top`
- `auto_select`
- `rotatable`
- `removable`
- `moveable`
- `scalable`
- `allow_unproportional_scaling`
- `min_scale_limit`
- `scale_by`
- `bitmap_image_consent`
- `vector_image_color_compliance`
- `fields_visibility`
- `printing_method_restrictions`
- `print_method_helper_link`
- `file_dpi`
- `background_image`
- `sent_print_file_to_customer`

### 二、必须参与视图覆盖的字段

#### 1. 可用模块（控制 Operation Panel Tab 显隐）

- 店铺字段：`active_modules`
- 视图字段：`selected_modules`
- 最终优先级（已在 `pwcaBuildMergedViewCustomizationSettings` 中实现）：
  1. `selected_modules` 非空 → 用视图值
  2. 否则 `active_modules` 非空 → 用店铺值
  3. 否则 → 插件默认值 `['TEXT', 'UPLOAD', 'DESIGN']`
- 模块名归一化：所有模块值统一转为大写后参与比较和判断（`pwcaNormalizeModuleName`）
- **Tab 映射**（已在前端 `core-init.js` 中实现）：
  | 接口模块值 | Operation Panel Tab |
  |-----------|---------------------|
  | `UPLOAD`  | `tab-pianquan`（Image） |
  | `TEXT`    | `tab-wenzi`（Text） |
  | `DESIGN`  | `tab-sheji`（Designs） |
- 模块禁用时：Tab 导航和对应内容面板直接 `display:none`，对应初始化入口（`pwcaInitImageTab`、`pwcaInitTextTab`、`ListJS`）也会被守卫跳过。

#### 2. 单一印刷方式限制

- 店铺字段：`single_printing_method_only`
- 视图字段：`single_printing_method_only`
- 规则：
  - 如果视图上存在布尔值配置，优先使用视图值
  - 否则将店铺值按字符串处理：
    - `enable` -> `true`
    - `disable` -> `false`

#### 3. 可选印刷方式列表

- 只使用视图字段：`printing_method_list_id`
- 店铺接口不提供替代值
- 该字段用于后续调用 `GET /print-methods`

### 三、图层控制属性（#11-19）店铺默认值与图层自有定义合并

店铺设置对所有图层有默认的交互属性（#11-19），但图层可以有自己的定义。如果图层有自己的定义，就用图层自己的；否则用店铺设置的默认值。

#### 店铺设置字段 → 图层控制属性映射

| 店铺设置字段 | 对应图层控制属性 | 说明 |
|------------|----------------|------|
| `moveable` | `movable` | 是否可移动 |
| `scalable` | `scalable` | 是否可缩放 |
| `rotatable` | `rotatable` | 是否可旋转 |
| `removable` | `deletable` | 是否可删除 |
| `allow_unproportional_scaling` | `allowUnproportionalScaling` | 是否允许非等比缩放 |
| `min_scale_limit` | `minScaleLimit` | 最小缩放限制 |
| `scale_by` | `scaleBy` | 缩放方式：`factor` 或 `dimension` |

#### 合并规则

图层控制属性合并优先级：

1. **图层自有定义**（`layer.layer_data.controls`）> **店铺设置默认值** > **插件内置默认值**

#### 实现落点

核心实现在 `design/stores/index.js`：

- `PWCA_DEFAULT_LAYER_CONTROLS`：插件内置默认值常量
- `pwcaNormalizeLayerControlBoolean`：布尔值归一化函数（支持 `true/false/1/0/enable/disable` 等）
- `pwcaBuildMergedLayerControls`：图层控制属性合并函数

调用链：

1. `multi-view-init.js` 的 `createFabricObjectFromLayer` 函数
2. 获取店铺设置：`window.useCanvasStore().getStoreCustomizationSettings()`
3. 调用 `window.pwcaBuildMergedLayerControls(rawControls, storeSettings)`
4. 应用合并后的控制属性到 Fabric 对象

#### 应用到 Fabric 对象的属性

| 合并后属性 | Fabric 对象属性 | 说明 |
|-----------|----------------|------|
| `movable` | `selectable`, `evented`, `hasBorders` | 可移动则可选择和显示边框 |
| `scalable` | `lockScalingX`, `lockScalingY`, `hasControls` | 可缩放则解锁缩放并显示控制点 |
| `rotatable` | `lockRotation` | 可旋转则解锁旋转 |
| `allowUnproportionalScaling` | `lockUniScaling` | 非等比缩放时解锁等比锁定 |
| - | `layerControls` | 保存完整控制属性供后续参考 |

#### 示例

```javascript
// 店铺设置：moveable=true, scalable=false
// 图层定义：movable=false
// 合并结果：movable=false（图层定义优先）

// 店铺设置：moveable=true
// 图层定义：无（controls 为空）
// 合并结果：movable=true（使用店铺默认值）
```

## `fields_visibility` 使用规则

`fields_visibility` 下的数组采用"包含即显示，不包含即隐藏"的规则。

### `moq_fields`

常见值：

- `items_design`
- `items_color`
- `sample_order`

控制内容：

- 按设计 MOQ
- 按颜色 MOQ
- 样品单入口/样品单逻辑

### `cost_breakdown_fields`

常见值：

- `blank_item`
- `custom_fee`

控制内容：

- 基础价
- 定制费

### `delivery_time_fields`

常见值：

- `rts_date`
- `arrival_date`

控制内容：

- 发货日期
- 到货日期

## 前台字段落地提示

- `Sample Order` 不是只影响底栏文案，而是影响整个前端样品单勾选框是否显示，范围包括产品页和定制页。
- `Blank Item` 不只是显示控制，也影响基础价格区域和部分按钮显隐；如果业务值出现 `Blank Only`，要额外处理按钮隐藏，不要只做字段显示。
- `SCALABLE` 关闭后，除了禁用缩放，还应同步隐藏或禁用 `scale_by`、`min_scale_limit`、非等比缩放相关交互。
- `Layer Depth` 和 `Scale Mode` 是上传图片进入画布时的初始化策略，建议在上传入画布入口统一处理，不要在多个图层组件分散处理。
- `google_font`、`font_size` 建议作为"新增文字默认值"的唯一来源：新增文字时默认 `fontFamily=google_font[0]`、`fontSize=font_size`，并将字体下拉 `#fontFamily` 的可选项限制为 `google_font` 列表（避免硬编码全量字体）。
- `google_font` 兼容两种输入：字符串 `Arial,Helvetica`（按逗号分割、trim、去重）或数组 `["Arial","Helvetica"]`（trim、去重）。为空时回退插件内置默认字体列表。

## 前端联动规则

### 可用模块 → Operation Panel Tab 显隐（已实现）

核心实现在 `core-init.js`：

- `pwcaOptionalTabModuleMap`：tabId → 模块名映射
- `pwcaGetEnabledOperationModules()`：从 `currentViewEnabledModules` 获取最终启用模块列表；若 store 还未加载任何产品上下文则返回空（保守策略，避免提前初始化）
- `pwcaIsOperationPanelTabAvailable(tabId)`：给定 tab 是否在当前启用模块中
- `pwcaApplyOperationPanelModuleVisibility()`：对三个可选 tab 实际应用 `display` 显隐；如当前激活 tab 被禁用则自动回退到第一个可用 tab
- `switchOperationPanelTab(tabId)`：增加了模块可用性守卫，被禁用 tab 会自动回退，不会切换到空功能

监听策略：

- `canvasPiniaReady` 事件触发时执行首次同步（store 已 ready）
- `store.$subscribe` 监听视图切换/产品数据变化，自动重新应用模块显隐

### 其他前台联动

- 当 `scalable === false`：
  - 禁用缩放能力
  - 同时隐藏 `scale_by`、`min_scale_limit`
- 当店铺 `single_printing_method_only === "enable"` 且视图未覆盖时：
  - 当前视图按单一印刷方式处理

## 项目内建议落点

- 外部 API 统一走：`includes/class-pw-admin-promowares-api.php`
- 若需暴露给前端，优先通过 WordPress REST API 代理，不要前端直连外部接口
- 若需要聚合到产品数据，可新增独立字段，例如：
  - `store_customization_settings`
- 不要覆盖现有旧字段：
  - `customization_settings`
- 模块名归一化、合并逻辑集中在 `design/stores/index.js` 的 `pwcaNormalizeModuleName` / `pwcaNormalizeModuleList` / `pwcaBuildMergedViewCustomizationSettings`
- Tab 显隐控制集中在 `main/core-init.js` 的 `pwcaApplyOperationPanelModuleVisibility`
- 各模块初始化入口（图片/文字/设计搜索）自行守卫模块可用性，不要在 DOMContentLoaded 里无条件初始化

## 实施原则

- 将新店铺接口视为独立数据源
- 保留旧 `/customization-settings` 兼容链路，除非明确要求迁移
- 合并逻辑尽量集中在单一数据入口，不要在多个组件零散判断
- 用户友好提示必须保留，尤其是 token 缺失、接口失败、返回结构异常
- 模块名统一大写归一化后再比较，确保接口返回的大小写变体都能正确匹配

## 验收清单

- [x] 已新增独立的店铺定制设置代理接口
- [x] 未误改或替换旧 `/customization-settings`
- [x] 前端或聚合层能拿到独立的 `store_customization_settings`
- [x] `active_modules`、`selected_modules`、`single_printing_method_only`、`printing_method_list_id` 的优先级实现正确
- [x] 模块名归一化（大写）后参与比较
- [x] `fields_visibility` 按"数组包含即显示"使用
- [x] 店铺设置支持按 `store_id` 缓存和失效
- [x] `tab-pianquan`/`tab-wenzi`/`tab-sheji` 显隐受 `active_modules` 控制
- [x] 切换到已禁用 tab 时自动回退，不出现空功能面板
- [x] 对应模块禁用时初始化入口被守卫跳过
- [x] 图层控制属性（#11-19）实现店铺默认值与图层自有定义的合并逻辑
- [x] 图层控制属性合并优先级：图层定义 > 店铺设置 > 插件默认值
- [x] `pwcaBuildMergedLayerControls` 正确处理布尔值归一化

## 常见错误

- 把 `/store/customization-settings` 当成旧 `/customization-settings`
- 在前端直接请求外部接口并暴露 token
- 把店铺默认配置写死进单个组件，而不是统一合并
- 忽略 `custom_views` 的更高优先级
- 模块名大小写不一致导致匹配失败（未归一化）
- 图层控制属性直接使用图层定义而忽略店铺默认值（图层应有更高优先级）
- 布尔值未正确归一化（只检查 `=== true` 而忽略 `1`、`'true'`、`'enable'` 等变体）
