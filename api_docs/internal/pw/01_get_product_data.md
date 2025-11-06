# 获取聚合产品数据（Aggregated Product Data）

* **方法:** `GET`
* **路径:** `/pw/v1/product-data/{id}`
* **认证:** `无需认证（当前配置）；生产建议启用鉴权/Nonce`

---

### 请求 (Request)

* **[类型：路径参数]**
  * `id` (integer, 必需): Promowares 产品唯一 ID

---

### 响应 (Response)

#### ✅ 成功 (200 OK)
```json
{
  "product": {
    "data": {
      "id": 123,
      "name": "Example Product",
      "updated_at": "2025-11-05T10:30:00Z"
    }
  },
  "templates": {
    "views": [
      {
        "view_id": 1,
        "view_name": "Front",
        "layer_config": [
          { "id": "text-1", "type": "text", "x": 100, "y": 120 },
          { "id": "image-1", "type": "image", "x": 80, "y": 60 }
        ],
        "preview_images": ["https://.../front.jpg"],
        "printing_methods": [1, 2]
      }
    ],
    "data": {
      "custom_view": {
        "main_custom_view": { "id": 1, "view_type": "main" },
        "sub_custom_view": []
      }
    }
  },
  "variants": { "data": { "items": [] } },
  "customization_settings": { "data": { "allow_text": true } },
  "points": { "data": { "balance": 50 } },
  "woocommerce": {
    "id": 567,
    "name": "WC Example Product",
    "price": "29.99",
    "price_html": "<span class=\"amount\">$29.99</span>",
    "stock_status": "instock",
    "in_stock": true,
    "permalink": "https://example.com/product/wc-example-product"
  }
}
```

#### ❌ 失败 (401 Unauthorized)
描述：当后端未配置 `pw_api_token` 时。
```json
{
  "error": "API token not configured"
}
```

#### ❌ 失败 (500 Bad Gateway)
描述：上游 Promowares API 返回非 200 状态码。
```json
{
  "error": "API returned status code: 502",
  "endpoint": "products/123"
}
```