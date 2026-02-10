# Products API

## 获取单个产品

```
GET /api/v1/products/{id}
```

**内部接口**: `PW_Admin_Promowares_API::get_product($id)`

**响应示例**:
```json
{
    "id": 123,
    "name": "Product Name",
    "sku": "SKU001",
    "price": 99.99,
    ...
}
```