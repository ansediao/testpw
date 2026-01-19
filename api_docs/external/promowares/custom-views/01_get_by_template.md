# 通过模板获取视图（Custom Views By Template）

* **方法:** `GET`
* **路径:** `/custom-views/template/{template_id}`
* **认证:** `需要 Bearer Token`

---

### 请求 (Request)

* **[类型：路径参数]**
  * `template_id` (integer, 必需): 定制模板 ID

---

### 响应 (Response)

#### ✅ 成功 (200 OK)
```json
{
  "data": {
    "template_id": 9001,
    "views": [
      { "id": 1, "name": "Front" },
      { "id": 2, "name": "Back" }
    ]
  }
}
```

#### ❌ 失败 (404 Not Found)
```json
{
  "error": "Views not found",
  "code": "NOT_FOUND"
}
```