# 获取打印工艺详情（Print Methods）

* **方法:** `POST`
* **路径:** `/pw-canvas/v1/print-methods`
* **认证:** `无需认证（当前配置）；生产建议启用鉴权/Nonce`

---

### 请求 (Request)

* **[类型：请求体]** (`application/json`)
```json
{
  "printing_method_ids": [1, 2, 3]
}
```

---

### 响应 (Response)

#### ✅ 成功 (200 OK)
```json
{
  "methods": [
    { "id": 1, "name": "Screen Print", "supports_layers": true },
    { "id": 2, "name": "DTF", "supports_layers": true }
  ]
}
```

#### ❌ 失败 (400 Bad Request)
描述：当 `printing_method_ids` 非数组或为空时。
```json
{
  "error": "printing_method_ids is required",
  "code": "INVALID_PARAMS"
}
```