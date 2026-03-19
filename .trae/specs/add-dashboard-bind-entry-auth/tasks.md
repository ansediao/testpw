# Tasks
- [x] Task 1: 扩展 Dashboard 页面连接表单
  - [x] SubTask 1.1: 在现有 token 输入与 Connect 按钮上方新增密钥输入框
  - [x] SubTask 1.2: 为密钥输入框补齐页面数据读取与基础校验提示文案

- [x] Task 2: 重构 Connect 按钮为签名跳转流程
  - [x] SubTask 2.1: 移除旧 token 验证与即时保存触发逻辑
  - [x] SubTask 2.2: 按规则生成 callback、store_url、timestamp 与签名字符串
  - [x] SubTask 2.3: 计算 HMAC-SHA256 hex 小写 sign 并拼装跳转 URL
  - [x] SubTask 2.4: 执行浏览器跳转并保留必要错误反馈

- [x] Task 3: 实现回跳结果解析与后端保存
  - [x] SubTask 3.1: 解析 success、store_id、token、state、error 参数
  - [x] SubTask 3.2: 成功时后端保存 store_id 与 token
  - [x] SubTask 3.3: 失败时展示错误且禁止 token 保存
  - [x] SubTask 3.4: 确保保存入口具备 nonce/权限校验与用户友好错误信息

- [x] Task 4: 完成联调与回归验证
  - [x] SubTask 4.1: 验证签名参数顺序与签名格式符合要求
  - [x] SubTask 4.2: 验证成功回跳落库路径与页面反馈
  - [x] SubTask 4.3: 验证失败回跳提示与不落库约束
  - [x] SubTask 4.4: 验证 Dashboard 现有相关功能无回归

- [x] Task 5: 修复失败分支的保存条件
  - [x] SubTask 5.1: 当 success=1 且存在 error 时禁止保存 token/store_id
  - [x] SubTask 5.2: 复核回跳成功与失败判定逻辑

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 depends on Task 3
