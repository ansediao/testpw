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

---

## 获取产品列表

```
GET /api/v1/products
```

**内部接口**: `PW_Admin_Promowares_API::get_products($params)`

**参数**:
- `page` - 页码
- `per_page` - 每页数量
- `category` - 分类筛选

---

## 获取产品定制数据

```
GET /api/v1/products/{id}/customization
```

**内部接口**: `PW_Admin_Promowares_API::get_product_customization($id)`

---

## 检查产品更新

```
GET /api/v1/products/{id}/updated-at
```

**内部接口**: `PW_Admin_Promowares_API::check_product_update($id)`

**响应示例**:
```json
{
    "updated_at": "2024-01-15T10:30:00Z"
}
```

---

## 同步产品数据

```
POST /api/v1/products/sync
```

**内部接口**: `PW_Admin_Promowares_API::sync_products($ids)`
