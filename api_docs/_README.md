# AI 友好的 API 文档创建与使用规程（PW Canvas 项目版）

本规程将项目 API 文档标准化并结构化存放，确保 IDE 中的 AI 助手（如 VS Code、Cursor、JetBrains AI 等）可以精准理解与调用我们的 API。

## 目录结构与命名
- 根目录：`/api_docs`
- 分层：`/internal`（团队内部/WordPress 侧接口）、`/external`（第三方服务）
- 资源维度：每种资源建立子目录，如 `pw`、`pw-canvas`、`products`、`points`
- 端点文件命名：`[序号]_[操作].md`，例如：`01_list.md`、`02_get_by_id.md`、`03_create.md`

示例：
```
/api_docs
  /internal
    /pw
      01_get_product_data.md
    /pw-canvas
      01_print_methods.md
      02_custom_colors.md
    /ajax
      01_proxy_api_request.md
  /external
    /promowares
      _README.md
      /products
        01_list.md
        02_get_by_id.md
        03_get_customization.md
      /plugin
        01_variant_product.md
      /customization-settings
        01_list.md
      /points
        01_info.md
      /custom-templates
        01_get_by_product.md
      /custom-views
        01_get_by_template.md
      /layers
        01_list_by_custom_view_id.md
```

## 写作模板（所有端点必须遵循）

```
# [操作的人类可读名称]

* **方法:** `[GET|POST|PUT|DELETE]`
* **路径:** `[/path/{id}]`
* **认证:** `[Bearer Token / 可选 / 无需认证]`

---

### 请求 (Request)

* **[类型：查询参数]**
  * `page` (integer, 可选): 页码

* **[类型：路径参数]**
  * `id` (integer, 必需): 资源 ID

* **[类型：请求体]** (`application/json`)
  ```json
  {
    "example": true
  }
  ```

---

### 响应 (Response)

#### ✅ 成功 (200 OK)
```json
{ "ok": true }
```

#### ❌ 失败 (400 Bad Request)
```json
{ "error": "message", "code": "ERROR_CODE" }
```
```

## 项目特定约定
- 外部 Promowares API 基础地址：`https://dev.promowares.com/api/v1/`
- 外部 API 认证：`Authorization` 头传入 JWT Token（存储于 WordPress 选项 `pw_api_token`），前端不要硬编码。
- 所有 Promowares 调用统一经由 `includes/class-pw-admin-promowares-api.php`，建议通过 WordPress REST 端点或 admin-ajax 代理调用。
- WordPress REST 命名空间：`/wp-json/pw/v1` 与 `/wp-json/pw-canvas/v1`
- 生产环境建议启用更严格的权限/Nonce 校验；当前部分端点为演示便利采用公开权限。

## 交付与使用（给 AI）
优先使用 IDE 的 `@` 文件引用功能加载上下文：
- 针对单个端点：
  - 例：`@api_docs/internal/pw/01_get_product_data.md`，让 AI 根据文档生成调用代码。
- 针对资源目录：
  - 例：`@api_docs/external/promowares/products/`，让 AI 基于目录内所有端点生成完整客户端。

在 IDE 不支持 `@` 时，复制端点 `.md` 文件的全部内容到聊天窗口，再提出你的指令（如生成代码、写测试、回答问题）。

## 调试建议（不创建测试文件）
请在浏览器开发者工具 Console 中使用 `fetch` 验证接口：
- 检查聚合产品数据：
  ```js
  fetch('/wp-json/pw/v1/product-data/123').then(r=>r.json()).then(console.log)
  ```
- 打印工艺：
  ```js
  fetch('/wp-json/pw-canvas/v1/print-methods', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ printing_method_ids: [1,2,3] })
  }).then(r=>r.json()).then(console.log)
  ```
- 自定义色卡：
  ```js
  fetch('/wp-json/pw-canvas/v1/custom-colors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ color_list_id: 101 })
  }).then(r=>r.json()).then(console.log)
  ```

> 遵循用户偏好：不创建测试/调试文件，不启动 php/node/python 服务。