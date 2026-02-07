# Custom Colors API

## 获取自定义颜色

```
GET /api/v1/custom-colors/{id}
```

**内部接口**: `PW_Admin_Promowares_API::get_custom_colors($id)`

**用途**: 获取产品可用的自定义颜色

**响应示例**:
```json
{
    "id": 789,
    "name": "Custom Color Set",
    "colors": [
        {
            "name": "Red",
            "hex": "#FF0000",
            "pantone": "185 C"
        }
    ]
}
```

---

## 检查颜色更新

```
GET /api/v1/custom-colors/{id}/updated-at
```

**内部接口**: `PW_Admin_Promowares_API::check_custom_colors_update($id)`
