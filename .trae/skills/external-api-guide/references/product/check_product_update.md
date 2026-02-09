# 检查产品更新

```
GET /api/v1/products/{id}/updated-at
```

**内部接口**: `PW_Admin_Promowares_API::check_product_update($id)`

**参数**:
- `id` - 产品ID（路径参数）

## 响应示例

```json
{
	"code": 200,
	"message": "success",
	"data": {
		"product_id": 28,
		"updated_at": "2026-01-28 11:39:18"
	}
}
```

## 关键字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | integer | 状态码，200 表示成功 |
| `data.updated_at` | string | 产品最后更新时间 |
| `data.product_id` | integer | 产品ID |
