# 后台 Dashboard 绑定入口鉴权改造 Spec

## Why
当前后台仅支持手动输入 Token 并本地校验后保存，流程依赖人工复制，不利于与 Promowares 统一绑定流程对接。需要改为基于密钥签名跳转绑定并回跳落库的标准化方案。

## What Changes
- 在 `/wp-admin/admin.php?page=pw-dashboard` 的现有 `#pwca-token-input` 与 Connect 按钮上方新增“密钥”输入框。
- 点击 Connect 后移除当前“先校验 token 再 AJAX 保存”的逻辑，改为构造并跳转到：
  - `https://www.promowares.xyz/api/store/bind-entry?callback={callback}&store_url={store_url}&timestamp={timestamp}&sign={sign}`
- 生成参数规则：
  - `store_url` 为当前站点地址（如 `https://mysite.com`）
  - `callback` 为插件后台回跳地址（当前 dashboard 页面地址）
  - `timestamp` 为当前秒级时间戳
  - 签名字符串为按字母序拼接后的：`callback={callback}&store_url={store_url}&timestamp={timestamp}`
  - `sign` 为 `HMAC-SHA256(签名字符串, 密钥)`，输出 hex 小写
- 页面加载时从 URL 读取参数：`success`、`store_id`、`token`、`state`、`error`。
- 成功回跳（`success=1`）时保存 `store_id` 与 `token`。
- 失败回跳（`success=0` 或存在 `error`）时展示错误信息，不保存 token。
- 保存外部绑定回跳数据时，后端统一处理持久化，前端不硬编码认证信息。

## Impact
- Affected specs: 后台账户连接流程、Promowares 集成鉴权流程、Dashboard 交互反馈
- Affected code: `modules/admin_dashboard`（页面与交互脚本）、`modules/integration_promowares`（保存接口扩展）、必要的 WordPress AJAX/REST 入口与 nonce 校验逻辑

## ADDED Requirements
### Requirement: 密钥签名跳转绑定
系统 SHALL 在后台 Dashboard 支持输入密钥，并在点击 Connect 时使用密钥对绑定参数签名后跳转到 Promowares 绑定入口。

#### Scenario: 生成签名并跳转成功
- **WHEN** 管理员在 Dashboard 输入密钥并点击 Connect
- **THEN** 系统使用当前 `callback`、`store_url`、`timestamp` 生成签名字符串
- **AND** 使用 HMAC-SHA256 与密钥计算 `sign`（hex 小写）
- **AND** 浏览器跳转到包含 `callback`、`store_url`、`timestamp`、`sign` 的绑定入口 URL
- **AND** 不再执行旧的 token 本地校验与旧保存流程

### Requirement: 回跳参数解析与落库
系统 SHALL 在 Dashboard 回跳时解析绑定结果参数，并根据成功或失败状态执行对应处理。

#### Scenario: 绑定成功并保存
- **WHEN** 页面 URL 中 `success=1` 且存在 `store_id`、`token`
- **THEN** 系统保存 `store_id` 与 `token`
- **AND** 向管理员展示成功反馈

#### Scenario: 绑定失败并提示
- **WHEN** 页面 URL 中 `success=0` 或存在 `error`
- **THEN** 系统展示用户可理解的错误信息
- **AND** 不保存 `token`

## MODIFIED Requirements
### Requirement: Dashboard Connect 按钮行为
Connect 按钮 SHALL 从“验证输入 token 并保存”改为“基于密钥签名参数并跳转 Promowares 绑定入口，再由回跳结果驱动保存”。

## REMOVED Requirements
### Requirement: Connect 点击后即时 token 验证链路
**Reason**: 新流程以外部绑定入口为唯一授权来源，旧链路会导致双轨逻辑与维护成本上升。  
**Migration**: 移除旧前端 `auth/user-info` 验证 + `pw_save_token` 即时保存触发；改为仅在回跳成功后由后端执行保存。
