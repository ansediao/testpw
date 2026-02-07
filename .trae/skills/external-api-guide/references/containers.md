# Containers API

## 获取容器信息

```
GET /api/v1/containers/{id}
```

**内部接口**: `PW_Admin_Promowares_API::get_container($id)`

**用途**: 获取产品容器（包装）信息

**响应示例**:
```json
{
    "id": 456,
    "name": "Container Name",
    "dimensions": {
        "length": 10,
        "width": 10,
        "height": 10
    },
    "weight": 1.5
}
```
