# API集成规范.md

指导外部集成API接口

## 指导原则

- 新增API接口优先考虑使用WordPress REST API
- 所有外部API调用必须通过`class-pw-admin-promowares-api.php`处理
- API认证信息不得硬编码在前端代码中
- 错误处理必须提供用户友好的反馈信息
