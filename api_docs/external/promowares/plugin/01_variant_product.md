# 获取变体产品信息（Variant Product）

* **方法:** `GET`
* **路径:** `/plugin/variant_product/{id}`
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
    "variants": [
      { "sku": "TS-RED-S", "attributes": { "color": "Red", "size": "S" } },
      { "sku": "TS-RED-M", "attributes": { "color": "Red", "size": "M" } }
    ]
  }
}
```

#### ❌ 失败 (404 Not Found)
描述：变体数据不存在。
```json
{
  "error": "Variant data not found",
  "code": "NOT_FOUND"
}
```