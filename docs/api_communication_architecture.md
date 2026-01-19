# PW Canvas API 通讯架构规范

## 核心原则
**严禁前台直接与第三方API通讯**

## REST API 防冲突命名规范

为避免与其他插件的REST API端点冲突，项目使用以下命名空间：

### API 命名空间约定
- **主要命名空间**: `pwca/v1` （推荐）
- **兼容命名空间**: `pw-canvas/v1` （现有）
- **产品相关**: `pw/v1` （现有，保持）

```php
// ✅ 正确 - 使用防冲突命名空间
register_rest_route('pwca/v1', '/designs', $args);
register_rest_route('pwca/v1', '/templates', $args);
register_rest_route('pw-canvas/v1', '/print-methods', $args); // 现有兼容

// ❌ 错误 - 通用命名空间容易冲突
register_rest_route('canvas/v1', '/designs', $args);
register_rest_route('api/v1', '/templates', $args);
```

## 正确的API通讯方式

### 1. 架构层次
```
前台 JavaScript → WordPress REST API → includes/class-pw-admin-promowares-api.php → 第三方API
```

### 2. 实现方式

#### 前台调用
前台JavaScript应该调用WordPress REST API端点，而不是直接调用第三方API。项目中使用 **Axios** HTTP客户端：

**使用 Axios（推荐）：**
```javascript
// ✅ 正确方式 - 使用 Axios
const response = await axios.get(`/wp-json/pw/v1/product-data/${pwId}`, {
    headers: {
        'X-WP-Nonce': config.nonce
    }
});

// 或 POST 请求
const response = await axios.post('/wp-json/pw-canvas/v1/print-methods', {
    printing_method_ids: [1, 2, 3]
}, {
    headers: {
        'Content-Type': 'application/json'
    }
});

// ❌ 错误方式 - 禁止直接调用第三方API
axios.get('https://dev.promowares.com/api/v1/products/1', ...)
```



#### 后端代理
所有第三方API调用必须通过 `includes/class-pw-admin-promowares-api.php` 进行：

1. **注册REST API端点**
```php
register_rest_route('pw-canvas/v1', '/print-methods', array(
    'methods' => 'POST',
    'callback' => array($this, 'get_print_methods_data'),
    'permission_callback' => '__return_true',
));
```

2. **实现代理方法**
```php
public function get_print_methods_data($request) {
    $printing_method_ids = $request['printing_method_ids'];
    $token = $this->hardcoded_token;
    
    // 通过内部方法调用第三方API
    $api_response = $this->call_promowares_api("print-methods?ids={$ids_string}", $token);
    
    return new WP_REST_Response($response_data, 200);
}
```

3. **统一API调用方法**
```php
private function call_promowares_api($endpoint, $token) {
    $response = wp_remote_get($this->api_base_url . $endpoint, [
        'headers' => [
            'Accept' => 'application/json',
            'Authorization' => $token
        ],
        'timeout' => 30
    ]);
    // 处理响应...
}
```



### 3. 已实现的API端点

#### Print Methods API
- **端点**: `/wp-json/pw-canvas/v1/print-methods`
- **方法**: POST
- **参数**: `printing_method_ids` (数组)
- **实现**: `get_print_methods_data()` 方法

#### Product Data API
- **端点**: `/wp-json/pw/v1/product-data/{id}`
- **方法**: GET
- **实现**: `get_aggregated_product_data()` 方法

### 4. 安全考虑

1. **认证管理**
   - API token存储在WordPress选项中
   - 前台无法直接访问token
   - 所有认证通过后端处理

2. **权限控制**
   - 可以在REST API端点中实现权限检查
   - 防止未授权访问

3. **数据验证**
   - 后端验证所有输入参数
   - 清理和转义用户输入

### 5. 错误处理

```php
if (is_wp_error($api_response)) {
    return new WP_REST_Response(array(
        'success' => false,
        'error' => $api_response->get_error_message(),
        'requested_ids' => $printing_method_ids
    ), 500);
}
```

### 7. 当前实现状态

#### ✅ 符合规范的实现
- `printMethodStore.js` 中的 `fetchPrintMethods` 方法
- 使用 `/wp-json/pw-canvas/v1/print-methods` 端点
- 通过 `class-pw-admin-promowares-api.php` 代理

#### ⚠️ 需要检查的地方
- 确保所有前台API调用都通过WordPress REST API
- 检查是否有直接调用第三方API的代码
- 验证所有API端点都已正确实现

## 开发指导原则

1. **新增API调用时**
   - 首先在 `class-pw-admin-promowares-api.php` 中添加代理方法
   - 注册对应的WordPress REST API端点
   - 前台通过WordPress REST API调用

3. **修改现有API调用时**
   - 检查是否符合代理架构
   - 如不符合，重构为代理模式
   - 绝不允许前台直接调用第三方API

4. **调试和测试**
   - 监控网络请求，确保无直接第三方API调用
   - 测试API代理功能的正确性
   - 验证错误处理机制