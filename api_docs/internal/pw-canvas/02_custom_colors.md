# 获取自定义色卡（Custom Colors）

* **方法:** `POST`
* **路径:** `/pw-canvas/v1/custom-colors`
* **认证:** `无需认证（当前配置）；生产建议启用鉴权/Nonce`

---

### 请求 (Request)

* **[类型：请求体]** (`application/json`)
```json
{
  "color_list_id": 101
}
```

---

### 响应 (Response)

#### ✅ 成功 (200 OK)
```json
{
  "list_id": 101,
  "colors": [
    { "code": "PMS 185", "hex": "#E4002B", "name": "Red" },
    { "code": "PMS 300", "hex": "#005EB8", "name": "Blue" }
  ]
}
```

#### ❌ 失败 (400 Bad Request)
描述：缺少 `color_list_id`。
```json
{
  "error": "color_list_id is required",
  "code": "MISSING_PARAMS"
}
```

#### ❌ 失败 (401 Unauthorized)
描述：后端未配置 `pw_api_token`。
```json
{
  "error": "API token not configured"
}
```