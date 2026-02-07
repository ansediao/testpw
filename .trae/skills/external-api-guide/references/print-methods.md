# Print Methods API

## 获取印刷方式

```
GET /api/v1/print-methods?ids={ids}
```

**内部接口**: `PW_Admin_Promowares_API::get_print_methods($ids)`

**用途**: 获取产品支持的印刷方式

**响应示例**:
```json
[
    {
        "id": 1,
        "name": "Screen Print",
        "code": "SP",
        "colors_available": 6
    }
]
```

---

## 检查印刷方式更新

```
GET /api/v1/print-methods/updated-at
```

**内部接口**: `PW_Admin_Promowares_API::check_print_methods_update()`
