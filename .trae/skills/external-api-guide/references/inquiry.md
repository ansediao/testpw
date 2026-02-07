# Inquiry API

## 提交产品咨询

```
POST /api/v1/plugin/inquiry
```

**内部接口**: `PW_Admin_Promowares_API::send_inquiry($data)`

**请求体**:
```json
{
    "product_id": 123,
    "name": "Customer Name",
    "email": "customer@example.com",
    "message": "Inquiry message",
    "quantity": 100
}
```

**用途**: 向Promowares发送产品咨询/询价
