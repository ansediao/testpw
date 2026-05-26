# PWCA Canvas 项目缓存逻辑文档

## 1. 概述

本项目采用多层缓存机制来优化产品数据加载性能，减少对外部 Promowares API 的频繁调用。缓存系统主要分为三个层次：

| 缓存层级 | 存储位置 | 数据类型 | 缓存策略 |
|---------|---------|---------|---------|
| **产品聚合数据缓存** | WordPress `postmeta` 表 | 产品完整聚合数据 | 远程时间戳对比 + 本地TTL |
| **打印方法缓存** | WordPress `options` 表 | 打印方法列表 | 远程时间戳对比 |
| **自定义颜色缓存** | WordPress `options` 表 | 自定义颜色列表 | 远程时间戳对比 |
| **临时缓存** | WordPress Transients | 变更信息、更新标记 | 固定TTL |

---

## 2. 缓存数据类型详解

### 2.1 产品聚合数据缓存

**缓存内容**: 从多个 Promowares API 端点聚合的产品数据，包括：
- 基础产品信息 (`products/{product_id}`)
- 自定义模板数据 (`custom-templates/product/{product_id}`)
- 变体产品数据 (`plugin/variant_product/{product_id}`)
- 自定义设置 (`customization-settings`)
- 店铺级自定义设置 (`store/customization-settings`)
- 用户积分信息 (`points/info`)
- WooCommerce 产品同步数据

**缓存键**: `_pw_aggregated_data_cache`（存储在对应 WooCommerce 产品的 postmeta 中）

**时间戳键**: `_pw_aggregated_data_cache_time`

**代码位置**: [`class-pw-admin-promowares-api.php`](file:///workspace/includes/class-pw-admin-promowares-api.php#L1137-L1190)

---

### 2.2 打印方法缓存

**缓存内容**: 打印方法列表数据

**缓存键格式**: `pw_print_methods_{MD5(ids_string)}_data`

**时间戳键格式**: `pw_print_methods_{MD5(ids_string)}_time`

**存储位置**: WordPress `options` 表

**代码位置**: [`class-pw-admin-promowares-api.php`](file:///workspace/includes/class-pw-admin-promowares-api.php#L2032-L2092)

---

### 2.3 自定义颜色缓存

**缓存内容**: 自定义颜色列表数据

**缓存键格式**: `pw_custom_colors_{color_list_id}_data`

**时间戳键格式**: `pw_custom_colors_{color_list_id}_time`

**存储位置**: WordPress `options` 表

**代码位置**: [`class-pw-admin-promowares-api.php`](file:///workspace/includes/class-pw-admin-promowares-api.php#L2183-L2246)

---

### 2.4 临时缓存（Transients）

| 缓存键模式 | 数据内容 | TTL | 用途 |
|-----------|---------|-----|-----|
| `pw_product_changes_{product_id}` | 产品变更详情 | 1小时 | 临时存储检测到的产品变更 |
| `pw_product_updated_flag_{product_id}` | 更新标记时间戳 | 5分钟 | 通知前端刷新产品数据 |

**代码位置**: 
- 变更缓存: [`class-pw-admin-promowares-api.php`](file:///workspace/includes/class-pw-admin-promowares-api.php#L1577-L1592)
- 更新标记: [`class-pw-admin-promowares-api.php`](file:///workspace/includes/class-pw-admin-promowares-api.php#L1735-L1758)

---

## 3. 缓存存储位置

### 3.1 WordPress `postmeta` 表

用于存储与特定 WooCommerce 产品关联的缓存数据：

| Meta Key | 数据类型 | 说明 |
|----------|---------|------|
| `_pw_aggregated_data_cache` | JSON 字符串 | 产品聚合数据 |
| `_pw_aggregated_data_cache_time` | 整数时间戳 | 缓存创建时间 |

### 3.2 WordPress `options` 表

用于存储全局共享的缓存数据：

| Option Name 模式 | 说明 |
|-----------------|------|
| `pw_print_methods_{MD5}_data` | 打印方法缓存数据 |
| `pw_print_methods_{MD5}_time` | 打印方法缓存时间戳 |
| `pw_custom_colors_{id}_data` | 自定义颜色缓存数据 |
| `pw_custom_colors_{id}_time` | 自定义颜色缓存时间戳 |

### 3.3 WordPress Transients

用于存储短期临时数据，会自动过期清理：

| Transient Key | TTL |
|--------------|-----|
| `pw_product_changes_{product_id}` | 1小时 (`HOUR_IN_SECONDS`) |
| `pw_product_updated_flag_{product_id}` | 5分钟 (`5 * MINUTE_IN_SECONDS`) |

---

## 4. 缓存失效机制

### 4.1 产品聚合数据失效策略

**双验证机制**:

1. **远程时间戳对比**（主要）：
   - 调用 `products/{product_id}/updated-at` 端点获取远程更新时间
   - 对比本地缓存时间戳与远程更新时间
   - 如果远程更新时间 > 本地时间戳，则缓存失效

2. **数据变化检测**（辅助）：
   - 当远程时间戳显示有更新时，进一步对比实际数据字段
   - 比较字段包括：`name`, `description`, `short_description`, `sku`, `price`, `regular_price`, `sale_price`, `stock_status`, `stock_quantity`
   - 如果无实际变化，更新本地时间戳避免重复检查

**代码位置**: [`check_remote_data_freshness()`](file:///workspace/includes/class-pw-admin-promowares-api.php#L1302-L1372)

---

### 4.2 打印方法缓存失效

- 调用 `print-methods/updated-at?ids={ids}` 检查更新
- 对比远程更新时间与本地缓存时间戳

**代码位置**: [`check_print_methods_freshness()`](file:///workspace/includes/class-pw-admin-promowares-api.php#L1768-L1812)

---

### 4.3 自定义颜色缓存失效

- 调用 `custom-colors/{color_list_id}/updated-at` 检查更新
- 对比远程更新时间与本地缓存时间戳

**代码位置**: [`check_custom_colors_freshness()`](file:///workspace/includes/class-pw-admin-promowares-api.php#L1822-L1865)

---

### 4.4 本地TTL（状态显示）

后台缓存状态页面显示的 TTL 为 **30分钟**，用于参考展示：

```php
// 后台状态查询中定义的 TTL
'ttl' => 30, // 单位：分钟
```

**代码位置**: [`class-pw-admin-cache.php`](file:///workspace/modules/admin_cache/includes/class-pwca-admin-cache.php#L137)

---

## 5. 后台缓存管理功能

### 5.1 管理页面入口

后台菜单路径：**PW Dashboard** → **Product Data Cache**

**代码位置**: [`class-pwca-admin-cache.php`](file:///workspace/modules/admin_cache/includes/class-pwca-admin-cache.php#L28-L41)

### 5.2 缓存状态显示

页面展示以下信息：
- **Total Cached**: 总缓存产品数量
- **Expired Cache**: 已过期缓存数量（超过30分钟未更新）
- **Last Updated**: 最后更新时间
- **Cache TTL**: 缓存有效期（30分钟）

**代码位置**: [`main-page.php`](file:///workspace/modules/admin_cache/views/main-page.php#L27-L32)

### 5.3 清除按钮功能

| 按钮 | 功能 | 清除范围 |
|-----|------|---------|
| **Clear Specific Product Cache** | 清除指定产品缓存 | 单个产品的 `_pw_aggregated_data_cache` 和 `_pw_aggregated_data_cache_time` |
| **Clear All Cache** | 清除所有产品缓存 | 所有产品的 `_pw_aggregated_data_cache` 和 `_pw_aggregated_data_cache_time` |

**清除逻辑**:

```php
// 清除单个产品缓存
public function clear_cached_product_data($product_id) {
    // 通过 pw_id 查找 WooCommerce 产品
    // 删除 postmeta: _pw_aggregated_data_cache
    // 删除 postmeta: _pw_aggregated_data_cache_time
}

// 清除所有产品缓存
public function clear_all_cached_product_data() {
    // 直接从 wpdb->postmeta 表删除所有相关记录
}
```

**代码位置**: 
- 单个清除: [`class-pw-admin-promowares-api.php`](file:///workspace/includes/class-pw-admin-promowares-api.php#L1239-L1265)
- 全部清除: [`class-pw-admin-promowares-api.php`](file:///workspace/includes/class-pw-admin-promowares-api.php#L1273-L1291)
- 后台处理: [`class-pwca-admin-cache.php`](file:///workspace/modules/admin_cache/includes/class-pwca-admin-cache.php#L69-L96)

---

### 5.4 缓存测试功能

后台提供缓存测试功能，可验证：
- 第一次调用（API请求）耗时
- 第二次调用（缓存命中）耗时
- 性能提升百分比
- 数据一致性验证

**代码位置**: [`pwca-admin-cache.js`](file:///workspace/modules/admin_cache/assets/js/pwca-admin-cache.js#L134-L190)

---

## 6. 缓存流程示意图

```
┌─────────────────────────────────────────────────────────────────────┐
│                    产品数据请求流程                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  请求: GET /pw/v1/product-data/{id}                                │
│          │                                                          │
│          ▼                                                          │
│  ┌─────────────────────────────────────────┐                        │
│  │         检查本地缓存                     │                        │
│  │  get_cached_product_data(product_id)    │                        │
│  └─────────────────────────────────────────┘                        │
│          │                                                          │
│          ├── 缓存不存在 ────────┐                                   │
│          │                      │                                   │
│          ▼                      ▼                                   │
│  ┌──────────────┐    ┌──────────────────────────────────┐          │
│  │ 缓存命中     │    │ 检查远程更新时间                  │          │
│  │ 返回缓存数据  │    │ check_remote_data_freshness()    │          │
│  └──────────────┘    └──────────────────────────────────┘          │
│                              │                                      │
│          ┌───────────────────┼───────────────────┐                  │
│          ▼                   ▼                   ▼                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │ 远程无更新   │    │ 远程有更新   │    │ 检查失败     │          │
│  │ 返回缓存数据  │    │ 检查数据变化  │    │ 返回错误     │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│                              │                                      │
│              ┌───────────────┴───────────────┐                     │
│              ▼                               ▼                     │
│      ┌──────────────┐               ┌──────────────┐               │
│      │ 无实际变化   │               │ 有实际变化   │               │
│      │ 更新时间戳    │               │ 刷新缓存     │               │
│      │ 返回缓存数据  │               │ 更新WC产品   │               │
│      └──────────────┘               └──────────────┘               │
│                                                              │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ 缓存写入: save_cached_product_data(product_id, data)      │    │
│  │ 存储位置: wp_postmeta (_pw_aggregated_data_cache)         │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Mock 模式对缓存的影响

系统支持 Mock 错误模式，通过 `pw_api_mock_mode` 选项控制：

| Mock 模式值 | 行为 |
|------------|------|
| `0`（默认） | 正常缓存行为 |
| `1` | 模拟 API 错误，**不保存缓存**，强制重新获取数据 |

当 Mock 模式为 1 时：
- 远程新鲜度检查返回 `false`（模拟数据过期）
- 聚合数据 API 调用返回错误
- **不会保存任何缓存数据**

**代码位置**: [`class-pw-admin-promowares-api.php`](file:///workspace/includes/class-pw-admin-promowares-api.php#L861-L877)

---

## 8. 缓存清除范围说明

### 8.1 后台清除按钮清除的内容

| 清除操作 | 清除范围 | 不清除的内容 |
|---------|---------|-------------|
| **单个产品清除** | 该产品的 `_pw_aggregated_data_cache` 和 `_pw_aggregated_data_cache_time` | 打印方法缓存、自定义颜色缓存、Transients |
| **全部清除** | 所有产品的 `_pw_aggregated_data_cache` 和 `_pw_aggregated_data_cache_time` | 打印方法缓存、自定义颜色缓存、Transients |

### 8.2 其他缓存的清除方式

| 缓存类型 | 清除方式 |
|---------|---------|
| 打印方法缓存 | 远程更新触发自动清除 |
| 自定义颜色缓存 | 远程更新触发自动清除 |
| 产品变更缓存 | 1小时自动过期 |
| 产品更新标记 | 5分钟自动过期 |

---

## 9. 总结

### 9.1 缓存数据汇总

| 数据类型 | 存储位置 | 失效机制 | 后台清除支持 |
|---------|---------|---------|-------------|
| 产品聚合数据 | `postmeta` | 远程时间戳对比 | ✅ 支持 |
| 打印方法 | `options` | 远程时间戳对比 | ❌ 不支持 |
| 自定义颜色 | `options` | 远程时间戳对比 | ❌ 不支持 |
| 产品变更信息 | `transients` | 1小时TTL | ❌ 不支持 |
| 产品更新标记 | `transients` | 5分钟TTL | ❌ 不支持 |

### 9.2 缓存设计特点

1. **智能新鲜度检测**: 通过远程时间戳对比，避免无效刷新
2. **数据变化细粒度检测**: 即使时间戳变化，若无实际数据变化仍使用缓存
3. **自动过期机制**: Transients 自动清理，无需手动管理
4. **Mock 模式兼容**: 支持测试场景下的缓存行为控制
5. **前端通知机制**: 产品更新时通过 `X-PW-Product-Updated` 响应头通知前端

---

## 10. 相关代码文件清单

| 文件路径 | 职责 |
|---------|------|
| [`includes/class-pw-admin-promowares-api.php`](file:///workspace/includes/class-pw-admin-promowares-api.php) | 核心缓存逻辑、API调用、缓存读写 |
| [`modules/admin_cache/includes/class-pwca-admin-cache.php`](file:///workspace/modules/admin_cache/includes/class-pwca-admin-cache.php) | 后台缓存管理页面、AJAX处理 |
| [`modules/admin_cache/views/main-page.php`](file:///workspace/modules/admin_cache/views/main-page.php) | 后台缓存管理界面模板 |
| [`modules/admin_cache/assets/js/pwca-admin-cache.js`](file:///workspace/modules/admin_cache/assets/js/pwca-admin-cache.js) | 后台缓存管理前端交互 |