---
name: "external-api-guide"
description: "项目外部Promowares API使用指南与常见返回数据兼容规范。Invoke when user needs to call Promowares API, map internal interfaces, or troubleshoot API response issues."
---

# 外部API使用指南

## 概述

项目通过内部封装接口调用外部 **Promowares API** (`https://dev.promowares.com/api/v1/`)。

## 使用场景对照表

| 当需要... | 使用内部接口 | 对应外部API |
|-----------|-------------|-------------|
| 获取产品数据 | `PW_Admin_Promowares_API::get_product()` | [products.md](references/products.md) |
| 获取产品列表 | `PW_Admin_Promowares_API::get_products()` | [product/get_products.md](references/product/get_products.md) |
| 获取单个产品定制数据 | `PW_Admin_Promowares_API::get_single_product_customization()` | [product/get_single_product_customization.md](references/product/get_single_product_customization.md) |
| 检查产品更新 | `PW_Admin_Promowares_API::check_product_update()` | [product/check_product_update.md](references/product/check_product_update.md) |
| 获取容器信息 | `PW_Admin_Promowares_API::get_container()` | [containers.md](references/containers.md) |
| 发送产品咨询 | `PW_Admin_Promowares_API::send_inquiry()` | [inquiry.md](references/inquiry.md) |
| 计算运费 | `PW_Admin_Promowares_API::calculate_shipping()` | [shipping.md](references/shipping.md) |
| 获取印刷方式 | `PW_Admin_Promowares_API::get_print_methods()` | [print-methods.md](references/print-methods.md) |
| 获取自定义颜色 | `PW_Admin_Promowares_API::get_custom_colors($color_list_id)` | [get_print-method_colorlist_info.md](references/get_print-method_colorlist_info.md) |
| 获取用户信息 | `PW_Admin_Promowares_API::get_user_info()` | [user-info.md](references/auth/user-info.md) |
| 验证Token有效性 | `PW_Admin_Promowares_API::validate_token()` | [validate.md](references/auth/validate.md) |
| 获取用户定制化设置 | `PW_Admin_Promowares_API::call_promowares_api('customization-settings', $token)` | [get-user-customization-settings.md](references/auth/get-user-customization-settings.md) |
| 获取用户积分信息 | `PW_Admin_Promowares_API::call_promowares_api('points/info', $token)` | [get_user_points_info.md](references/auth/get_user_points_info.md) |


## 内部接口位置

```
includes/class-pw-admin-promowares-api.php
```

## 认证方式

所有外部API调用使用 **Bearer Token** 认证：

```php
$headers = [
    'Authorization' => 'Bearer ' . $token,
    'Accept' => 'application/json'
];
```

## 详细端点文档

见 [references/](references/) 文件夹：
- [products.md](references/products.md) - 产品相关API
- [containers.md](references/containers.md) - 容器相关API
- [inquiry.md](references/inquiry.md) - 咨询相关API
- [shipping.md](references/shipping.md) - 运费相关API
- [print-methods.md](references/print-methods.md) - 印刷方式API
- [custom-colors.md](references/custom-colors.md) - 自定义颜色API
- [auth/](references/auth/) - 认证相关API
  - [user-info.md](references/auth/user-info.md) - 获取用户信息
  - [validate.md](references/auth/validate.md) - 验证Token
  - [get-user-customization-settings.md](references/auth/get-user-customization-settings.md) - 获取用户定制化设置
  - [get_user_points_info.md](references/auth/get_user_points_info.md) - 获取用户积分信息

## 常见兼容问题

### `custom_views.view_name` 中文乱码

- 现象：
  - 在线设计界面视图切换按钮显示 `u4e3bu5b9a...`、`u6b21u7ea7...`
  - DOM 中 `button.viewer-switch-btn` 文本不是中文，而是 Unicode 转义串
- 典型来源：
  - Promowares `GET /api/v1/products/{product_id}/customization` 的 `custom_views[*].view_name`
  - 返回值可能不是正常中文，而是以下任一格式：
    - `u4e3bu5b9au5236u89c6u56fe`
    - `\u4e3b\u5b9a\u5236\u89c6\u56fe`
    - `主u5b9a制u89c6图`、`次u7ea7视u56fe` 这类半解码残留串
- 项目内推荐修复点：
  - 优先在前端产品数据入口统一标准化，再进入视图按钮、多视图导出、画布状态等后续链路
  - 当前项目已在 `modules/front_canvas/assets/js/design/stores/index.js` 的 `fetchProductData()` 中对 `templates.views` 与 `templates.data.custom_view` 的 `view_name/name` 做统一解码
- 排查结论：
  - 若页面出现半解码残留串，优先检查前端解码器是否只处理了部分连续片段
  - 不要先把问题归因到产品缓存；当前项目缓存命中与未命中都会继续走前端 `fetchProductData()` 的标准化逻辑
- 解码范围建议：
  - `templates.views[*].view_name`
  - `templates.views[*].name`
  - `templates.data.custom_view.main_custom_view.view_name`
  - `templates.data.custom_view.sub_custom_view[*].view_name`
- 修复原则：
  - 不改前端按钮渲染组件的职责，只在数据入口做一次标准化
  - 兼容普通字符串、`uXXXX`、`\uXXXX`、半解码残留串四种输入
  - 解码顺序建议：先解 `\uXXXX`，再解整串连续 `uXXXX`，最后补解混在中文中的残留 `uXXXX`
  - 解码失败时回退原值，避免破坏已有英文或数字视图名

### 店铺定制设置 `google_font` / `font_size` 字段落地

- 背景：
  - 新增接口 `GET /api/v1/store/customization-settings` 返回店铺级默认配置，其中包含字体相关字段 `google_font`、`font_size`。
  - 该配置应作为在线设计器“新增文字”的默认值来源，并用于限制字体下拉的可选项。
- 推荐前端使用方式：
  - 新增文字默认值：
    - `fontFamily` 取 `google_font` 的首个字体
    - `fontSize` 取 `font_size`
  - 字体下拉 `#fontFamily`：
    - 只展示 `google_font` 列表中的字体（不要硬编码全量字体）
- 兼容点：
  - `google_font` 可能是字符串 `Arial,Helvetica` 或数组 `["Arial","Helvetica"]`，都需要 `trim` + 去重
  - 当 `google_font` / `font_size` 缺失或无效时，应回退到插件内置默认值
  - 合并优先级仍遵循：`custom_view` 视图配置 > `store/customization-settings` 店铺默认配置 > 插件内置默认值（字体字段通常直接使用店铺默认即可）

### `4-Grid Flow` 图层渲染规则

- 现象：
  - Promowares customization 返回 `layers` 里包含 `Background Layer`，但 4-Grid Flow 的舞台不应加载该图层
- 项目内规则：
  - `view_flow === "4-Grid Flow"` 时，前端渲染会跳过 `Background Layer`
  - 其余图层按名称分发到多画布：`Base Layer/4-Grid Layer -> baseCanvas`，`Overlay Layer -> overlayCanvas`，其他图层（含文本/自定义图片/Mapping/FlexiCurve）-> `mainCanvas`
  - 相关逻辑集中在 `modules/front_canvas/assets/js/canvas/multi-view-init.js`
