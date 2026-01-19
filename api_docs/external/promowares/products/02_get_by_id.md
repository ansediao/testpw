# 获取产品详情（Get Product By ID）

* **方法:** `GET`
* **路径:** `/products/{id}`
* **认证:** `需要 Bearer Token`

---

### 请求 (Request)

* **[类型：路径参数]**
  * `id` (integer, 必需): 产品唯一 ID

---

### 响应 (Response)

#### ✅ 成功 (200 OK)
```json
{
  "data": {
    "id": 123,
    "name": "Example Product",
    "category": "Apparel",
    "updated_at": "2025-11-05T10:30:00Z"
  }
}
```

#### ❌ 失败 (404 Not Found)
描述：产品不存在。
```json
{
  "error": "Product not found",
  "code": "NOT_FOUND"
}
```