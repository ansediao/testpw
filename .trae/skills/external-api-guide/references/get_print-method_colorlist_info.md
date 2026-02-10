# Custom Colors API

## 获取自定义颜色列表

```
GET /api/v1/custom-colors/{color_list_id}
```

**内部接口**: `PW_Admin_Promowares_API::get_custom_colors($color_list_id)`

**用途**: 获取指定颜色列表ID的颜色详情，用于印刷方式的颜色配置

**调用时机**: 当 [print-methods.md](print-methods.md) 返回的印刷方式中 `printable_color` 字段值为 `Color List` 且 `color_list_id` 不为 0 时，需要调用此接口获取可用颜色列表。

**请求示例**:
```bash
curl --request GET \
  --url https://dev.promowares.com/api/v1/custom-colors/1 \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer {token}'
```

**响应示例**:
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "id": 1,
        "created_at": "2025-06-17 08:18:48",
        "updated_at": "2025-09-10 20:56:53",
        "deleted_at": null,
        "name": "custom_color",
        "colors": [
            {
                "name": "red",
                "hex_code": "#EF0707"
            },
            {
                "name": "blue",
                "hex_code": "#0080ff"
            }
        ]
    }
}
```

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | integer | 颜色列表ID |
| `created_at` | string | 创建时间 |
| `updated_at` | string | 更新时间 |
| `deleted_at` | string/null | 删除时间，null表示未删除 |
| `name` | string | 颜色列表名称 |
| `colors` | array | 颜色数组 |
| `colors[].name` | string | 颜色名称 |
| `colors[].hex_code` | string | 颜色十六进制代码 |

## 使用流程

1. 调用 `get_print_methods()` 获取产品支持的印刷方式
2. 检查每个印刷方式的 `printable_color` 字段
3. 如果值为 `Color List` 且 `color_list_id` > 0，则调用 `get_custom_colors(color_list_id)` 获取可用颜色
4. 将获取到的颜色列表展示给用户选择
