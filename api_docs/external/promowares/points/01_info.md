# 获取积分信息（Points Info）

* **方法:** `GET`
* **路径:** `/points/info`
* **认证:** `需要 Bearer Token`

---

### 请求 (Request)

* 无参数

---

### 响应 (Response)

#### ✅ 成功 (200 OK)
```json
{
  "data": {
    "balance": 50,
    "tier": "Silver"
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