# Auth API

## 验证Token

```
GET /api/v1/auth/user-info
```

**内部接口**: `PW_Admin_Promowares_API::verify_token()`

**用途**: 验证Promowares API Token是否有效

**响应示例**:
```json
{
    "valid": true,
    "user": {
        "id": 100,
        "name": "API User",
        "email": "api@example.com"
    }
}
```

---

## 检查API状态

```
GET /api/v1/status
```

**内部接口**: `PW_Admin_Promowares_API::check_api_status()`

**用途**: 检查Promowares API服务状态
