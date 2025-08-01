# 产品数据缓存实现

## 概述

PW Canvas 插件现在支持产品数据缓存功能，通过在 WordPress 的 `product_meta` 中存储 API 聚合数据，显著提高了产品页面的加载性能。

## 核心功能

### 自动缓存机制
- **触发条件**: 每次成功从 `pw/v1/product-data/{id}` 端点获取数据时
- **缓存位置**: WordPress `postmeta` 表中的产品元数据
- **缓存键名**: 
  - `_pw_aggregated_data_cache`: 存储JSON格式的聚合数据
  - `_pw_aggregated_data_cache_time`: 存储缓存创建时间戳
- **有效期**: 30分钟（1800秒）

### 缓存逻辑流程

1. **请求处理**:
   ```
   用户请求 → 检查缓存 → 缓存有效？
                    ↓           ↓
                  返回缓存    调用API → 保存缓存 → 返回数据
   ```

2. **缓存检查**:
   - 根据 `pw_id` 查找对应的 WooCommerce 产品
   - 检查缓存数据是否存在
   - 验证缓存时间戳是否在有效期内
   - 过期缓存自动清理

## 技术实现

### 核心方法

#### `get_cached_product_data($product_id)`
```php
// 获取缓存数据
private function get_cached_product_data($product_id)
{
    // 查找对应的 WooCommerce 产品
    $woo_products = get_posts(array(
        'post_type' => 'product',
        'meta_query' => array(
            array(
                'key' => 'pw_id',
                'value' => $product_id,
                'compare' => '='
            )
        ),
        'posts_per_page' => 1
    ));

    if (empty($woo_products)) {
        return false;
    }

    $woo_product_id = $woo_products[0]->ID;
    
    // 获取缓存数据和时间戳
    $cached_data = get_post_meta($woo_product_id, '_pw_aggregated_data_cache', true);
    $cache_timestamp = get_post_meta($woo_product_id, '_pw_aggregated_data_cache_time', true);

    // 检查缓存是否存在且未过期（30分钟 = 1800秒）
    if (empty($cached_data) || empty($cache_timestamp)) {
        return false;
    }

    $cache_expiry = 30 * 60; // 30分钟
    if ((time() - intval($cache_timestamp)) > $cache_expiry) {
        // 缓存已过期，删除旧缓存
        delete_post_meta($woo_product_id, '_pw_aggregated_data_cache');
        delete_post_meta($woo_product_id, '_pw_aggregated_data_cache_time');
        return false;
    }

    // 返回缓存的数据
    $decoded_data = json_decode($cached_data, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        return $decoded_data;
    }

    return false;
}
```

#### `save_cached_product_data($product_id, $aggregated_data)`
```php
// 保存缓存数据
private function save_cached_product_data($product_id, $aggregated_data)
{
    // 查找对应的 WooCommerce 产品
    $woo_products = get_posts(array(
        'post_type' => 'product',
        'meta_query' => array(
            array(
                'key' => 'pw_id',
                'value' => $product_id,
                'compare' => '='
            )
        ),
        'posts_per_page' => 1
    ));

    if (empty($woo_products)) {
        return false;
    }

    $woo_product_id = $woo_products[0]->ID;
    
    // 将数据编码为 JSON 并保存
    $encoded_data = wp_json_encode($aggregated_data);
    $current_time = time();

    // 保存缓存数据和时间戳
    $data_saved = update_post_meta($woo_product_id, '_pw_aggregated_data_cache', $encoded_data);
    $time_saved = update_post_meta($woo_product_id, '_pw_aggregated_data_cache_time', $current_time);

    return $data_saved && $time_saved;
}
```

### 修改的核心方法

#### `get_aggregated_product_data($request)`
```php
public function get_aggregated_product_data($request)
{
    $product_id = $request['id'];
    $token = $this->hardcoded_token;

    if (empty($token)) {
        return new WP_REST_Response(array(
            'error' => 'API token not configured'
        ), 401);
    }

    // 检查缓存数据
    $cached_data = $this->get_cached_product_data($product_id);
    if ($cached_data !== false) {
        return new WP_REST_Response($cached_data, 200);
    }

    // 原有的API调用逻辑...
    $aggregated_data = array();
    
    // ... 数据聚合逻辑 ...

    // 保存缓存数据
    $this->save_cached_product_data($product_id, $aggregated_data);

    return new WP_REST_Response($aggregated_data, 200);
}
```

## 管理界面

### 缓存状态监控
在 WordPress 管理后台的 Promoware 主菜单中，新增了"产品数据缓存管理"部分：

- **缓存状态显示**:
  - 总缓存数量
  - 过期缓存数量
  - 最近更新时间
  - 缓存有效期

- **缓存操作**:
  - 清除指定产品缓存
  - 清除所有缓存
  - 测试缓存功能

### AJAX 端点

#### `pw_clear_product_cache`
```javascript
// 清除产品缓存
$.post(ajaxurl, {
    action: 'pw_clear_product_cache',
    product_id: productId, // 可选，不提供则清除所有
    nonce: nonce
}, function(response) {
    // 处理响应
});
```

#### `pw_get_cache_status`
```javascript
// 获取缓存状态
$.post(ajaxurl, {
    action: 'pw_get_cache_status',
    nonce: nonce
}, function(response) {
    // 处理缓存状态数据
});
```

## 性能优化效果

### 预期性能提升
- **首次加载**: 正常API调用时间（通常200-1000ms）
- **缓存命中**: 显著减少响应时间（通常10-50ms）
- **性能提升**: 80-95% 的响应时间减少

### 缓存测试功能
管理界面提供了缓存测试工具：
1. 输入产品ID
2. 点击"测试缓存功能"
3. 系统会进行两次连续调用
4. 显示性能对比和数据一致性验证

## 最佳实践

### 缓存策略
1. **自动缓存**: 无需手动干预，系统自动管理
2. **智能过期**: 30分钟有效期平衡性能和数据新鲜度
3. **按需清理**: 支持手动清除特定或全部缓存

### 监控建议
1. **定期检查**: 通过管理界面监控缓存状态
2. **性能测试**: 使用内置测试工具验证缓存效果
3. **数据一致性**: 确保缓存数据与API数据保持一致

### 故障排除
1. **缓存不生效**: 检查产品是否有对应的 `pw_id` meta
2. **数据不一致**: 手动清除缓存强制重新获取
3. **性能问题**: 检查过期缓存数量，必要时清理

## 技术细节

### 数据库结构
```sql
-- 缓存数据存储在 wp_postmeta 表中
SELECT * FROM wp_postmeta 
WHERE meta_key IN ('_pw_aggregated_data_cache', '_pw_aggregated_data_cache_time');
```

### 缓存键命名规范
- `_pw_aggregated_data_cache`: 下划线前缀表示私有meta，不在自定义字段中显示
- `_pw_aggregated_data_cache_time`: 对应的时间戳字段

### 安全考虑
- 所有AJAX操作都包含nonce验证
- 缓存清理操作需要管理员权限
- 缓存数据使用WordPress标准的JSON编码

## 扩展可能性

### 未来优化方向
1. **缓存预热**: 在产品导入时预先生成缓存
2. **智能失效**: 基于产品更新时间智能失效缓存
3. **分层缓存**: 不同类型数据使用不同的缓存策略
4. **缓存统计**: 更详细的缓存命中率和性能统计

### 配置选项
可考虑添加以下配置选项：
- 缓存有效期设置
- 缓存启用/禁用开关
- 缓存大小限制
- 自动清理策略

## 总结

产品数据缓存功能显著提升了 PW Canvas 插件的性能，通过智能的缓存策略和完善的管理界面，为用户提供了更好的体验。该实现遵循 WordPress 最佳实践，确保了数据安全性和系统稳定性。