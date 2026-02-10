---
name: "external-api-guide"
description: "项目外部Promowares API使用指南。Invoke when user needs to call external Promowares API or understand which internal interface to use."
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
