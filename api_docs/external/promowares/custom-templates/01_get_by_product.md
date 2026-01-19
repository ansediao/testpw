# 通过产品获取定制模板（Custom Templates By Product）

* **方法:** `GET`
* **路径:** `/custom-templates/product/{product_id}`
* **认证:** `需要 Bearer Token`

---

### 请求 (Request)

* **[类型：路径参数]**
  * `product_id` (integer, 必需): 产品唯一 ID

---

### 响应 (Response)

#### ✅ 成功 (200 OK)
```json
{
  "data": {
    "template_id": 9001,
    "product_id": 123
  }
}
```

#### ❌ 失败 (404 Not Found)
```json
{
  "error": "Template not found",
  "code": "NOT_FOUND"
}
```