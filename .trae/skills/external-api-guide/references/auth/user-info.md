# Auth API

## 获取用户信息

```
GET /api/v1/auth/user-info
```

**内部接口**: `PW_Admin_Promowares_API::get_user_info()`

**用途**: 获取当前认证用户的详细信息，包括用户ID、团队、模式和店铺ID

**响应示例** (成功):
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "user_id": 4,
        "team": "1",
        "mode": 2,
        "shop_id": 2
    }
}
```

**字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| `user_id` | int | 用户ID |
| `team` | string | 团队标识 |
| `mode` | int | 模式: 1=代发货模式, 2=工具模式 |
| `shop_id` | int | 店铺ID |

**响应示例** (失败):
```json
{
    "code": 1,
    "message": "invalid or inactive shop token"
}
```

**注意**: `code` 不为 200 时表示异常