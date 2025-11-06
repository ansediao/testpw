# Promowares API 概览

* **Base URL:** `https://dev.promowares.com/api/v1/`
* **认证:** 通过请求头 `Authorization: <JWT Token>`（后端从 WordPress 选项 `pw_api_token` 读取）。
* **调用约定:**
  - 项目所有 Promowares 调用统一经由 `includes/class-pw-admin-promowares-api.php`。
  - 前端通过 WordPress REST 或 Admin AJAX 代理访问，避免在前端暴露 Token。
  - 推荐使用聚合端点：`products/{id}/customization` 获取模板、视图与图层的整合数据。

> 注意：不同环境的 Base URL 可能不同。示例使用开发环境 `dev.promowares.com`。