---
name: "promowares-bind-entry-connect"
description: "规范后台 Connect/Disconnect 与中台回跳保存 token/store_id。Invoke when implementing or refactoring bind-entry auth flow, disconnect cleanup, and notice display."
---

# Promowares Bind Entry 连接流程

## 用途

用于在 WordPress 后台实现或改造以下完整链路：
- 点击 Connect 跳转中台绑定页
- 回跳后读取 `success/store_id/token/state/error`
- 成功保存 `store_id/token`
- 失败展示错误提示且不保存
- 已连接状态显示 Disconnect，点击后删除 `store_id/token` 并刷新

## 何时调用

- 需要新增或修改 `/wp-admin/admin.php?page=pw-dashboard` 的 Connect 逻辑时
- 需要处理中台回跳参数并保存 token 时
- 需要统一成功/失败提示展示规范时
- 需要增加或调整 Disconnect 行为（清理数据并刷新）时

## 实施基线

### 1) 前端点击 Connect（不暴露密钥）

- Dashboard 页不展示 `#pwca-store-id-input` 与 `#pwca-token-input`
- Dashboard 页仅保留 Connect/Disconnect 按钮，不在页面暴露密钥输入框
- 点击后通过 `admin-ajax.php` 请求后端签名接口获取跳转 URL
- 跳转地址固定：`https://www.promowares.xyz/api/store/bind-entry`
- 仅携带参数：`callback`、`store_url`、`timestamp`、`sign`
- 若数据库已有 `pw_api_token`，按钮文案显示 `Disconnect`

### 2) 后端签名接口

- 入口建议：`wp_ajax_pwca_get_bind_entry_url`
- 必须做：
  - `check_ajax_referer`
  - `current_user_can( 'manage_options' )`
- 密钥建议后端常量化存储（示例：类常量），前端不得可见
- 签名字符串严格为：
  - `callback={callback}&store_url={store_url}&timestamp={timestamp}`
- 签名算法：
  - `HMAC-SHA256(签名字符串, 密钥)`，输出 hex 小写

### 3) 回跳处理

- 在 `admin_init` 解析回跳参数：
  - `success`、`store_id`、`token`、`state`、`error`
- 成功条件：
  - `success` 为真值
  - `error` 为空
  - `store_id` 与 `token` 均非空
- 成功动作：
  - 保存 `pw_store_id`
  - 保存 `pw_api_token`
  - 写入成功 notice
- 失败动作：
  - 写入 error notice
  - 禁止保存 token/store_id
- 回跳后重定向到干净 URL（移除回跳参数）

### 4) Disconnect 处理

- 入口建议：`wp_ajax_pwca_disconnect_store`
- 必须做：
  - `check_ajax_referer`
  - `current_user_can( 'manage_options' )`
- 执行动作（按顺序）：
  1. 删除所有 `pw_isSyncProduct = '1'` 的同步产品（使用 `wp_delete_post` 永久删除）
  2. 删除所有 `pw_is_composite_group = '1'` 的组合产品组
  3. 删除 `pw_store_id` 选项
  4. 删除 `pw_api_token` 选项
  5. 写入成功 notice
- 前端收到成功后刷新当前页面

### 5) 展示规范

- Dashboard 页面使用 notice 区域展示成功/失败信息
- 建议用 transient 在重定向后展示消息
- 失败文案优先显示 `error` 参数，其次显示通用失败文案
- 连接状态按钮文案规则：
  - 有 token：`Disconnect`
  - 无 token：`Connect`

## 项目内参考位置

- Dashboard 主逻辑类：`modules/admin_dashboard/features/feat_dashboard/includes/class-pwca-admin-dashboard-dashboard.php`
- Dashboard 页面模板：`modules/admin_dashboard/features/feat_dashboard/views/main-page.php`
- Dashboard 前端脚本：`modules/admin_dashboard/assets/js/pwca-admin-dashboard.js`

## 验收清单

- Connect 后不再执行旧 token 本地校验链路
- 跳转 URL 仅含四个参数：`callback/store_url/timestamp/sign`
- 签名串与签名算法符合要求
- `success=1` 且无 `error` 时保存 `store_id/token`
- `success=0` 或存在 `error` 时只提示不保存
- 页面不显示 `#pwca-store-id-input` 和 `#pwca-token-input`
- 有 token 时按钮显示 Disconnect，点击后删除两项并刷新

## 常见问题

- 回跳带 `success=1` 但同时有 `error`：
  - 必须按失败处理，不得保存
- 前端直接签名导致密钥暴露：
  - 必须改为后端签名接口
- Disconnect 仅改按钮文案但不清库：
  - 必须实际删除 `pw_store_id` 与 `pw_api_token`
