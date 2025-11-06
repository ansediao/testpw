# Internal API 概览（WordPress 侧）

* **Base URL:** `/wp-json`
* **命名空间:**
  * `pw/v1`（聚合与项目数据）
  * `pw-canvas/v1`（画布相关数据：工艺、色卡等）
* **认证:**
  * 演示环境部分端点为公开（`permission_callback: __return_true`）。
  * 生产建议：启用鉴权与 `X-WP-Nonce`（从前端通过 `wp_create_nonce('wp_rest')` 获得）。

> 约定：所有前端应通过 WordPress REST 端点或 Admin AJAX 代理调用外部 API，不在前端硬编码第三方 Token。