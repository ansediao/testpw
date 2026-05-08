---
name: "composite-products"
description: "PWCA组合产品导入、显示/隐藏逻辑及相关元数据。Invoke当需要理解或修改组合产品显示逻辑、导入流程或相关元数据时。"
---

# PWCA 组合产品逻辑

## 概述

Promowares API 导入组合产品时，会创建三类产品 Post，通过不同的 meta 标识区分显示/隐藏行为。

## API 返回值结构

### `composite_products` 字段说明

Promowares API 返回的 `composite_products` 数组中，每个元素包含以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `main_product_id` | int | **该产品组合的主产品 ID**（在 Promowares 系统中的 store_product_id） |
| `container_name` | string | 容器名称（如 "test1"） |
| `container_label` | string | 容器标签（如 "size"），用于前台显示选项卡 |
| `products` | array | **该组合所有的产品信息数组**（包含主产品和所有子产品） |

### `products` 数组中产品的角色判断

在 `products` 数组中，通过 `main_product_id` 判断主产品和子产品：

- **主产品**：`product_id === main_product_id`
- **子产品**：其他所有产品均为子产品，它们的 `pw_composite_main_id` 会关联到主产品的 `product_id`

### 示例

```json
{
  "composite_products": [
    {
      "main_product_id": 50,
      "container_name": "test1",
      "container_label": "size",
      "products": [
        {
          "id": 50, // 这是主产品 (id === main_product_id)
          "product_id": 94,    
          "name": "test3",
          "label_value": "s"
        },
        {
          "id": 51, // 子产品
          "product_id": 95,    
          "name": "test4",
          "label_value": "l"
        },
        {
          "id": 52, // 子产品
          "product_id": 96,    
          "name": "test55",
          "label_value": "m"
        }
      ]
    }
  ]
}
```

> **注意**：`products` 数组中的 `id` 是 Promowares 系统中的产品 ID。主产品通过 `id === main_product_id` 来识别。

## 三类 Post

| 类型 | Meta 标识 | 显示位置 | 后台列表 | 前台商城 |
|------|-----------|----------|----------|----------|
| 主产品 (Main) | `pw_is_composite_main=true` | 前台产品页 | **隐藏** | 显示 |
| 子产品 (Child) | `pw_composite_main_id` 关联 | 前台组件列表 | **隐藏** | 显示 |
| 分组产品 (Group) | `pw_is_composite_group=true` | 不适用 | **显示** | **隐藏** |

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

### 后台产品列表

在 `class-pwca-admin-woocommerce.php` 中通过 `pre_get_posts` 排除主产品和子产品。

**仅在后台环境执行**：`is_admin()`
- 隐藏 `pw_is_composite_main=true` 的主产品
- 隐藏 `pw_composite_main_post_id` 关联的子产品
- **只显示** `pw_is_composite_group=true` 的分组产品

**组产品特殊处理**：
1. **封面图片**：通过 `posts_results` filter 拦截，将组产品的 `_thumbnail_id` 替换为主产品的封面图片
2. **产品列表 Tooltip**：在组产品标题下显示主产品和所有子产品列表（带 `icon-xiaji` 图标）

### 前台商城隐藏

在 `class-pwca-front-product-woo-adjustments.php` 的 `exclude_composite_group_from_shop()` 方法中通过 `pre_get_posts` 排除 `pw_is_composite_group=true` 的产品。

**仅在前台环境执行**：排除 `is_admin()` 检查，仅在 `is_shop()`、`is_product_category()`、`is_product_tag()` 等前台页面生效。

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
