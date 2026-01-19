# 列出产品（List Products）

* **方法:** `GET`
* **路径:** `/products`
* **认证:** `需要 Bearer Token`

---

### 请求 (Request)

* **[类型：查询参数]**
  * `page` (integer, 可选): 页码
  * `limit` (integer, 可选): 每页数量

---

### 响应 (Response)

#### ✅ 成功 (200 OK)
```json
{
  "data": {
    "list": {
      "single_products": [
        { "id": 101, "name": "T-Shirt", "updated_at": "2025-11-05T10:30:00Z" }
      ],
      "composite_products": [
        { "id": 201, "name": "Gift Set" }
      ]
    }
  }
}
```

#### ❌ 失败 (401 Unauthorized)
描述：缺少或无效的 Token。
```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```