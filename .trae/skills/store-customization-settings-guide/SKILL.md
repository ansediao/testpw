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
  - `custom_view` 视图配置
  - `store/customization-settings`
  - 插件内置默认值

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

#### 1. 可用模块

- 店铺字段：`active_modules`
- 视图字段：`selected_modules`
- 规则：
  - 如果 `selected_modules` 为非空数组，则用视图值
  - 否则回退到店铺 `active_modules`

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

## `fields_visibility` 使用规则

`fields_visibility` 下的数组采用“包含即显示，不包含即隐藏”的规则。

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

## 前端联动规则

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

## 实施原则

- 将新店铺接口视为独立数据源
- 保留旧 `/customization-settings` 兼容链路，除非明确要求迁移
- 合并逻辑尽量集中在单一数据入口，不要在多个组件零散判断
- 用户友好提示必须保留，尤其是 token 缺失、接口失败、返回结构异常

## 验收清单

- 已新增独立的店铺定制设置代理接口
- 未误改或替换旧 `/customization-settings`
- 前端或聚合层能拿到独立的 `store_customization_settings`
- `active_modules`、`single_printing_method_only`、`printing_method_list_id` 的优先级实现正确
- `fields_visibility` 按“数组包含即显示”使用
- 店铺设置支持按 `store_id` 缓存和失效

## 常见错误

- 把 `/store/customization-settings` 当成旧 `/customization-settings`
- 在前端直接请求外部接口并暴露 token
- 把店铺默认配置写死进单个组件，而不是统一合并
- 忽略 `custom_views` 的更高优先级
