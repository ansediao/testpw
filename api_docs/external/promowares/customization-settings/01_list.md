# 获取全局定制设置（Customization Settings）

* **方法:** `GET`
* **路径:** `/customization-settings`
* **认证:** `需要 Bearer Token`

---

### 请求 (Request)

* **[类型：查询参数]**
  * `locale` (string, 可选): 语言区域，如 `en_US`

---

### 响应 (Response)

#### ✅ 成功 (200 OK)
```json
{
  "data": {
    "allow_text": true,
    "max_layers": 10
  }
}
```

#### ❌ 失败 (401 Unauthorized)
```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```