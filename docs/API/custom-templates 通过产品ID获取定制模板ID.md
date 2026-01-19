# 自定义模板产品接口文档

## 接口概述

该接口用于获取指定产品的定制模板ID，是产品定制化功能的核心接口。

**接口地址**: `GET /api/v1/custom-templates/product/{pw_product_id}`

**BASE URL**: `https://dev.promowares.com`

**完整URL**: `https://dev.promowares.com/api/v1/custom-templates/product/{pw_product_id}`

## 请求参数

### 路径参数

| 参数名 | 类型   | 必需 | 说明                    |
| ------ | ------ | ---- | ----------------------- |
| pw_product_id  | number | 是   | 中台产品的唯一标识ID（pw_product_id） |

### 请求头

| 参数名        | 类型   | 必需 | 说明                     |
| ------------- | ------ | ---- | ------------------------ |
| Authorization | string | 是   | JWT认证令牌，格式：Bearer {JWT_TOKEN} |
| Accept        | string | 否   | 接受的内容类型，默认：application/json |

## 请求示例

```bash
curl -X 'GET' \
  'https://dev.promowares.com/api/v1/custom-templates/product/1' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer {JWT_TOKEN}'
```

## 响应数据

### 响应格式

所有响应都遵循统一的格式：

```json
{
  "code": 200,
  "message": "success", 
  "data": {object}
}
```

### 根级别字段

| 字段名    | 类型   | 说明                        |
| --------- | ------ | --------------------------- |
| `code`    | number | 响应状态码，200 表示成功    |
| `message` | string | 响应消息，"success"表示成功 |
| `data`    | object | 定制模板数据对象            |

### 定制模板数据对象 (data)

| 字段名                         | 类型        | 说明                                 |
| ------------------------------ | ----------- | ------------------------------------ |
| `id`                           | number      | 定制模板的唯一标识(template_id) ID                |
| `created_at`                   | string      | 创建时间 (格式: YYYY-MM-DD HH:mm:ss) |
| `updated_at`                   | string      | 更新时间 (格式: YYYY-MM-DD HH:mm:ss) |
| `deleted_at`                   | string/null | 删除时间，null 表示未删除            |
| `product_custom_template_name` | string      | 定制模板名称                         |
| `product_category`             | string      | 产品类别                             |
| `link_product_id`              | number      | 关联的产品 ID                        |

## 响应示例

### 成功响应

```json
{
   "code": 200,
   "message": "success",
   "data": {
      "id": 1,
      "created_at": "2025-01-14 11:15:35",
      "updated_at": "2025-08-07 22:52:32",
      "deleted_at": null,
      "product_custom_template_name": "咖啡杯",
      "product_category": "1",
      "link_product_id": 6
   }
}
```

## 错误处理

### 错误响应格式

```json
{
  "code": {error_code},
  "message": "{error_message}",
  "data": null
}
```

### 错误状态码

| 状态码 | 说明           | 可能原因                         |
| ------ | -------------- | -------------------------------- |
| 200    | 成功           | 请求处理成功                     |
| 400    | 请求参数错误   | pw_product_id 参数格式不正确或缺失       |
| 401    | 未授权         | JWT Token 无效、过期或缺失       |
| 404    | 模板不存在     | 指定的产品ID不存在对应的模板     |
| 500    | 服务器内部错误 | 服务器处理请求时发生内部错误     |

## 在项目中的使用

### WordPress 后端调用

该接口在项目中通过 [`class-pw-admin-promowares-api.php`] 中的 [`get_product_templates`] 方法进行调用：

```php
/**
 * Get custom templates data for a specific product.
 */
public function get_product_templates($pw_product_id, $token = null)
{
    $auth_token = $token ?: $this->hardcoded_token;
    
    if (empty($auth_token)) {
        return new WP_Error('missing_token', 'API token is required');
    }
    
    return $this->call_promowares_api("custom-templates/product/{$pw_product_id}", $auth_token);
}
```

### 数据聚合中的使用

该接口是多步骤数据获取流程的第一步，在 [`get_enhanced_template_data`] 方法中使用：

1. **步骤1**: 调用 `custom-templates/product/{pw_product_id}` 获取定制模板ID
2. **步骤2**: 根据模板ID调用 `custom-views/template/{template_id}` 获取该定制模板的定制视图信息  
3. **步骤3**: 根据视图ID调用 `layers?custom_view_id={custom_view_id}` 获取该定制视图的所有图层详细信息

### 前端使用

通过 [`productDataAPI.js`] 模块间接使用，该模块调用 WordPress REST API 端点 `/wp-json/pw/v1/product-data/{pw_product_id}`，后端聚合多个API数据后返回给前端。

## 注意事项

1. **认证要求**: 所有请求必须包含有效的JWT Token
2. **参数验证**: `pw_product_id` 必须是有效的数字格式
3. **数据格式**: 时间字段统一使用 `YYYY-MM-DD HH:mm:ss` 格式
4. **缓存机制**: 项目中实现了产品数据缓存，避免重复API调用
5. **错误处理**: 项目中对API调用进行了封装，统一处理各种错误情况

## API 版本信息

- **当前版本**: v1
- **API Base URL**: https://dev.promowares.com/api/v1/
- **支持的HTTP方法**: GET
- **响应格式**: JSON