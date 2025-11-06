# 获取产品定制数据（Get Product Customization）

* **方法:** `GET`
* **路径:** `/products/{id}/customization`
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
    "template_id": 9001,
    "views": [
      { "id": 1, "name": "Front", "mockup_images": ["https://.../front.jpg"] },
      { "id": 2, "name": "Back", "mockup_images": ["https://.../back.jpg"] }
    ],
    "layers": {
      "1": [ { "id": "text-1", "type": "text" } ],
      "2": [ { "id": "image-3", "type": "image" } ]
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