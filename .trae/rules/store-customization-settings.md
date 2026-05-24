# 店铺定制设置规则

## 适用场景

- 当需求涉及 `GET /store/customization-settings`、产品定制数据合并、视图覆盖或印刷方式联动时，必须遵循本规则。

## 接入顺序

进入定制页时，按以下顺序处理：

1. 请求 `GET /store/customization-settings`
2. 请求产品定制数据 `GET /products/{id}/customization`
3. 合并当前视图配置与店铺默认配置
4. 当当前视图存在 `printing_method_list_id` 时，再请求 `GET /print-methods?ids={逗号拼接}`
5. 基于最终合并结果渲染设计器、价格区和提交前校验

## 实施约束

- `/store/customization-settings` 与旧 `/customization-settings` 不是同一个接口，禁止混用或互相替代。
- 所有外部接口调用必须通过 `includes/class-pw-admin-promowares-api.php` 处理。
- 若需给前端使用，优先通过 WordPress REST API 或现有聚合接口代理，禁止前端直连外部接口或暴露 token。
- 合并逻辑必须集中在单一数据入口，避免在多个组件、多个渲染点分散判断。

## 优先级规则

- 最终配置优先级固定为：`custom_view` 视图配置 > `store/customization-settings` 店铺默认配置 > 插件内置默认值。
- `printing_method_list_id` 仅在当前视图存在时触发 `print-methods` 请求，不要提前或全局请求。

## 错误处理

- 接口失败、token 缺失、返回结构异常时，必须提供用户友好的提示信息。
