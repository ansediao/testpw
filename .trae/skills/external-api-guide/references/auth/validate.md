# Validate Token API

## 验证 Token

```
POST /api/v1/auth/validate
```

**内部接口**: `PW_Admin_Promowares_API::validate_token()`

**用途**: 验证 Token 的有效性并返回用户信息

**响应示例** (成功):
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "valid": true,
        "info": {
            "user_id": 5,
            "team": "",
            "mode": 0,
            "shop_id": 5
        }
    }
}
```

**字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | int | 状态码，200 表示成功 |
| `data.valid` | bool | Token 是否有效，true 表示验证通过 |

**验证通过条件**:
- `code === 200` 且 `data.valid === true`

**响应示例** (失败):
```json
{
    "code": 1,
    "message": "invalid or inactive shop token"
}
```

**注意**: `code` 不为 200 时表示异常
