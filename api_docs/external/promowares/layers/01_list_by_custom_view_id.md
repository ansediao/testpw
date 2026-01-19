# 通过视图获取图层（Layers By Custom View）

* **方法:** `GET`
* **路径:** `/layers`
* **认证:** `需要 Bearer Token`

---

### 请求 (Request)

* **[类型：查询参数]**
  * `custom_view_id` (integer, 必需): 定制视图 ID

---

### 响应 (Response)

#### ✅ 成功 (200 OK)
```json
{
  "data": {
    "custom_view_id": 1,
    "layers": [
      { "id": "text-1", "type": "text", "x": 100, "y": 120 },
      { "id": "image-3", "type": "image", "x": 80, "y": 60 }
    ]
  }
}
```

#### ❌ 失败 (404 Not Found)
```json
{
  "error": "Layers not found",
  "code": "NOT_FOUND"
}
```