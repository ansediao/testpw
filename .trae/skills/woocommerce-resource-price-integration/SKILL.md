---
name: "woocommerce-resource-price-integration"
description: "实现 WooCommerce 自定义资源价格影响购物车和结算的核心功能。当需要在插件中添加类似 Lumise 的资源价格计算并影响 WooCommerce 购物车和真实结算时调用此 Skill。"
---

# WooCommerce 资源价格集成核心

本 Skill 专注于如何让自定义资源价格真实影响 WooCommerce 购物车和结算价格。

## 核心原理

通过三个关键步骤实现价格影响：

1. **计算资源总价格** → 2. **存储到购物车项目数据** → 3. **在 WooCommerce 计算总价前同步价格**

---

## 核心代码

### 步骤 1：计算并存储资源价格

```php
<?php
// 假设你已有 $cart_item 数据，包含资源信息
$cart_item = array(
    'product_id' => 123,
    'qty' => 1,
    'price' => array(
        'resource' => 0,
        'base' => 0
    )
);

// 1. 获取产品基础价格
$product = wc_get_product($cart_item['product_id']);
$cart_item['price']['base'] = $product ? floatval($product->get_price()) : 0;

// 2. 计算所有资源价格总和
// 假设 $resources 是你的资源数组，每个元素有 'price' 字段
$resources = array(
    array('price' => 5.00),
    array('price' => 3.50)
);

foreach ($resources as $res) {
    $cart_item['price']['resource'] += floatval($res['price']);
}

// 3. 计算总价格
$cart_item['price']['total'] = $cart_item['price']['resource'] + $cart_item['price']['base'];
```

### 步骤 2：添加到 WooCommerce 购物车

```php
<?php
// 将计算好的价格数据作为 extra option 添加到购物车
$extra_options = array(
    'your_plugin_data' => $cart_item
);

// 添加到 WooCommerce 购物车
WC()->cart->add_to_cart(
    $cart_item['product_id'],
    $cart_item['qty'],
    0,
    array(),
    $extra_options
);
```

### 步骤 3：同步价格到 WooCommerce（最关键）

```php
<?php
class Your_Plugin_Frontend {
    
    public function __construct() {
        // 注册 WooCommerce 计算总价前的钩子
        add_action(
            'woocommerce_before_calculate_totals',
            array($this, 'sync_custom_price'),
            999,
            1
        );
    }
    
    /**
     * 同步自定义价格到 WooCommerce
     */
    public function sync_custom_price($cart_object) {
        if (!WC()->session->__isset('reload_checkout')) {
            
            foreach ($cart_object->cart_contents as $key => $value) {
                
                // 检查是否有我们的自定义数据
                if (isset($value['your_plugin_data'])) {
                    
                    $cart_data = $value['your_plugin_data'];
                    
                    // 获取我们计算好的总价格
                    $custom_total = isset($cart_data['price']['total']) 
                        ? floatval($cart_data['price']['total']) 
                        : 0;
                    
                    $qty = isset($cart_data['qty']) 
                        ? intval($cart_data['qty']) 
                        : 1;
                    
                    // 关键：设置 WooCommerce 产品单价（总价 ÷ 数量）
                    if (version_compare(WC()->version, '3.0', '<')) {
                        // WooCommerce 3.0 之前
                        $cart_object->cart_contents[$key]['data']->price = $custom_total / $qty;
                    } else {
                        // WooCommerce 3.0 之后
                        $cart_object->cart_contents[$key]['data']->set_price($custom_total / $qty);
                    }
                    
                    // 同步数量
                    $cart_object->cart_contents[$key]['quantity'] = $qty;
                }
            }
        }
    }
}

// 初始化
new Your_Plugin_Frontend();
```

---

## 完整示例：从设计数据到购物车

```php
<?php
/**
 * 处理设计数据并添加到购物车
 */
function your_plugin_process_design($design_data) {
    
    // 1. 解析设计数据，获取资源
    $resources = array();
    if (isset($design_data->design->stages)) {
        foreach ((array)$design_data->design->stages as $stage) {
            $sdata = isset($stage->data) ? $stage->data : new stdClass();
            $objects = isset($sdata->objects) ? (array)$sdata->objects : array();
            
            foreach ($objects as $obj) {
                if (isset($obj->resource_id) && isset($obj->price)) {
                    $resources[] = array(
                        'price' => floatval($obj->price)
                    );
                }
            }
        }
    }
    
    // 2. 构建购物车项目
    $cart_item = array(
        'product_id' => intval($design_data->product_id),
        'qty' => 1,
        'price' => array(
            'resource' => 0,
            'base' => 0
        )
    );
    
    // 3. 获取产品基础价格
    $product = wc_get_product($cart_item['product_id']);
    $cart_item['price']['base'] = $product ? floatval($product->get_price()) : 0;
    
    // 4. 累加资源价格
    foreach ($resources as $res) {
        $cart_item['price']['resource'] += $res['price'];
    }
    
    // 5. 计算总价格
    $cart_item['price']['total'] = $cart_item['price']['resource'] + $cart_item['price']['base'];
    
    // 6. 添加到 WooCommerce 购物车
    $extra = array('your_plugin_data' => $cart_item);
    WC()->cart->add_to_cart(
        $cart_item['product_id'],
        $cart_item['qty'],
        0,
        array(),
        $extra
    );
}
```

---

## 关键点总结

| 步骤 | 说明 | 关键代码 |
|------|------|----------|
| 1 | 计算资源总价格 | `$cart_item['price']['total'] = 资源价 + 产品基础价` |
| 2 | 存储到购物车 | `WC()->cart->add_to_cart(..., array('your_plugin_data' => $cart_item))` |
| 3 | 同步价格 | `$product->set_price($custom_total / $qty)` 在 `woocommerce_before_calculate_totals` 钩子中 |

