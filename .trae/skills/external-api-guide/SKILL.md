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
| 获取产品列表 | `PW_Admin_Promowares_API::get_products()` | [products.md](references/products.md) |
| 检查产品更新 | `PW_Admin_Promowares_API::check_product_update()` | [products.md](references/products.md) |
| 获取容器信息 | `PW_Admin_Promowares_API::get_container()` | [containers.md](references/containers.md) |
| 发送产品咨询 | `PW_Admin_Promowares_API::send_inquiry()` | [inquiry.md](references/inquiry.md) |
| 计算运费 | `PW_Admin_Promowares_API::calculate_shipping()` | [shipping.md](references/shipping.md) |
| 获取印刷方式 | `PW_Admin_Promowares_API::get_print_methods()` | [print-methods.md](references/print-methods.md) |
| 获取自定义颜色 | `PW_Admin_Promowares_API::get_custom_colors()` | [custom-colors.md](references/custom-colors.md) |
| 验证Token | `PW_Admin_Promowares_API::verify_token()` | [auth.md](references/auth.md) |

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
- [auth.md](references/auth.md) - 认证相关API
