# Shipping API

## 计算运费

```
POST /api/v1/shipping/calculate
```

**内部接口**: `PW_Admin_Promowares_API::calculate_shipping($data)`

**请求体**:
```json
{
    "products": [
        {
            "id": 123,
            "quantity": 10
        }
    ],
    "destination": {
        "country": "US",
        "state": "CA",
        "city": "Los Angeles",
        "zip": "90001"
    }
}
```

**响应示例**:
```json
{
    "options": [
        {
            "method": "express",
            "cost": 25.99,
            "estimated_days": 3
        }
    ]
}
```
