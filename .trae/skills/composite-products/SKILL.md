---
name: "composite-products"
description: "PWCA组合产品导入、显示/隐藏逻辑及相关元数据。Invoke当需要理解或修改组合产品显示逻辑、导入流程或相关元数据时。"
---

# PWCA 组合产品逻辑

## 概述

Promowares API 导入组合产品时，会创建三类产品 Post，通过不同的 meta 标识区分显示/隐藏行为。

## 三类 Post

| 类型 | Meta 标识 | 显示位置 | 后台列表 | 前台商城 |
|------|-----------|----------|----------|----------|
| 主产品 (Main) | `pw_is_composite_main=true` | 前台产品页 | 显示 | 显示 |
| 子产品 (Child) | `pw_composite_main_id` 关联 | 前台组件列表 | 显示 | 显示 |
| 分组产品 (Group) | `pw_is_composite_group=true` | 不适用 | **隐藏** | **隐藏** |

## 关键元数据

### 主产品
```php
pw_is_composite_main = true
pw_composite_main_id = <main_product_id>
pw_composite_related_products = [<related_ids>]
pw_composite_all_product_ids = [<all_product_ids>]
```

### 子产品
```php
pw_id = <product_id>
pw_composite_main_id = <main_product_id>
pw_composite_main_post_id = <main_post_id>
pw_container_id = <container_id>
pw_container_value = <显示名称>
pw_container_name = <容器名称>
pw_container_label = <容器标签>
pw_container_is_default = <是否默认>
```

### 分组产品
```php
pw_is_composite_group = true
pw_composite_main_post_id = <main_post_id>
_children = [<child_product_ids>]
```

## 显示控制

### 前台组件列表显示条件

在 `class-pwca-front-product-composite.php` 中：

```php
$label = get_post_meta( $target_product_id, 'pw_container_value', true );
if ( $label === '' ) {
    return;  // 无 pw_container_value 则不显示
}
```

### 后台产品列表隐藏

在 `class-pwca-admin-woocommerce.php` 中通过 `pre_get_posts` 排除 `pw_is_composite_group=true` 的产品。

### 前台商城隐藏

在 `class-pwca-front-product-woo-adjustments.php` 中通过 `pre_get_posts` 排除 `pw_is_composite_group=true` 的产品。

## 导入流程

1. `import_composite_product_group()` 接收组合数据
2. `create_composite_products()` 创建主产品和所有子产品
3. `link_composite_products()` 建立关联关系
4. `maybe_create_grouped_product()` 创建分组产品（隐藏）
5. `maybe_schedule_container_rules_processing()` 调度容器规则处理
6. `apply_container_rules()` 为子产品设置容器元数据

## 相关文件

- 导入逻辑：`modules/integration_promowares/includes/class-pwca-integration-promowares.php`
- 后台隐藏：`modules/admin_woocommerce/includes/class-pwca-admin-woocommerce.php`
- 前台隐藏：`modules/front_product/includes/class-pwca-front-product-woo-adjustments.php`
- 前台组件列表：`modules/front_product/includes/class-pwca-front-product-composite.php`
