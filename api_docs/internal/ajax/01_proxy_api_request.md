# 管理端 AJAX 代理调用（Admin AJAX Proxy）

* **方法:** `POST`
* **路径:** `/wp-admin/admin-ajax.php?action=pw_proxy_api_request`
* **认证:** `需要管理员权限（仅登录后台用户可用）`

---

### 请求 (Request)

* **[类型：请求体]** (`application/x-www-form-urlencoded` 或 `multipart/form-data`)
  * `endpoint` (string, 必需): Promowares 相对端点（例如：`products/123`）
  * `token` (string, 必需): JWT Token（后端从 `pw_api_token` 获取或由调用方传入）

---

### 响应 (Response)

#### ✅ 成功 (200 OK)
描述：返回上游 Promowares API 的解码 JSON。
```json
{
  "data": {
    "id": 123,
    "name": "Example Product"
  }
}
```

#### ❌ 失败 (403 Forbidden)
描述：当前用户无管理员权限。
```json
{
  "success": false,
  "data": "Insufficient permissions"
}
```

#### ❌ 失败 (400 Bad Request)
描述：缺少必需参数。
```json
{
  "success": false,
  "data": "Missing required parameters"
}
```