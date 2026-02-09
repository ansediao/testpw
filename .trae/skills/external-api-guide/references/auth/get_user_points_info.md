# User Points Info API

## 获取用户积分信息

```
GET /api/v1/points/info
```

**内部接口**: 通过 `PW_Admin_Promowares_API::call_promowares_api('points/info', $token)` 调用

**用途**: 获取当前认证用户的积分信息，包括当前积分、总积分和货币转换率


**响应示例** (成功):
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "current_points": 0,
        "total_points": 0,
        "currency_conversion_rate": 1
    }
}
```

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `current_points` | int | 当前可用积分余额 |
| `total_points` | int | 累计获得的总积分 |
| `currency_conversion_rate` | int/float | 积分与货币的转换比率 |

**响应示例** (失败):
```json
{
    "code": 1,
    "message": "invalid or inactive shop token"
}
```

**注意**: 
- `code` 不为 200 时表示异常
- 该接口返回的是用户级别的积分信息
- 在聚合产品数据接口 (`/pw/v1/product-data/{id}`) 中，该数据包含在 `points` 字段中
