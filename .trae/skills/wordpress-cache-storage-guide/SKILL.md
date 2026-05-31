---
name: "wordpress-cache-storage-guide"
description: "Maps how project data is cached in WordPress DB and how invalidation works. Invoke when tracing cache storage, DB cache keys, transients, options, post meta, or sync persistence."
---

# WordPress 缓存落库指南

## 用途

用于快速判断本项目中哪些数据会写入 WordPress 数据库、哪些属于真正缓存、哪些只是同步后的持久化数据，以及它们分别存在哪类存储中：

- `transient`
- `option`
- `post meta`
- Action Scheduler 调度表

## 何时调用

- 需要分析“哪些数据缓存进了 WordPress 数据库”时
- 需要排查缓存命中、缓存失效、缓存清理逻辑时
- 需要定位某个接口响应最终存进了 `option`、`transient` 还是 `post meta` 时
- 需要区分“短期缓存”与“同步持久化副本”时
- 需要在改造 Promowares 数据读取逻辑前评估缓存影响范围时

## 先看结论

本项目真正的数据库缓存主要有三类：

1. 产品聚合数据缓存到产品 `post meta`
2. 若干短期状态缓存到 `transient`
3. 部分外部接口结果缓存到 `options`

此外还有两类会落库但不应简单视为缓存：

1. 同步产品后的业务元数据，长期保存在 `post meta`
2. Action Scheduler 的异步任务记录，保存在调度相关数据表

## 缓存分类总表

| 类型 | 存储位置 | 典型键名 | 数据内容 | 生命周期 |
|---|---|---|---|---|
| 产品聚合缓存 | `post meta` | `_pw_aggregated_data_cache` / `_pw_aggregated_data_cache_time` | 聚合后的产品、模板、变体、设置等数据 | 依赖远端 `updated_at` 与手动清理 |
| 产品变更缓存 | `transient` | `pw_product_changes_{product_id}` | 本地与远端字段差异结果 | 1 小时 |
| 产品刷新标记 | `transient` | `pw_product_updated_flag_{product_id}` | 前台刷新标记 | 5 分钟 |
| 印刷方式缓存 | `option` | `pw_print_methods_{hash}_data` / `_time` | `print-methods` 响应 | 按远端更新时间判定 |
| 自定义颜色缓存 | `option` | `pw_custom_colors_{id}_data` / `_time` | `custom-colors` 响应 | 按远端更新时间判定 |
| 后台提示消息 | `transient` | `pwca_settings_messages` / `pwca_dashboard_messages` | 短期提示消息 | 30 秒 |
| 导入完成标记 | `transient` | `pwca_import_completed` | 导入完成状态 | 300 秒 |

## 一类：产品聚合数据缓存

### 存储位置

- `wp_postmeta`
- 通过 WooCommerce 产品的 `post_id` 关联

### 关键键名

- `_pw_aggregated_data_cache`
- `_pw_aggregated_data_cache_time`

### 数据来源

聚合接口会组合多个远端接口结果，例如：

- `products/{id}`
- 模板与视图数据
- `plugin/variant_product/{id}`
- `customization-settings`
- `store/customization-settings`
- `points/info`
- 本地 WooCommerce 商品信息

### 设计意图

- 将同一产品的聚合结果挂在本地 WooCommerce 商品上
- 读取时先检查缓存，再根据远端更新时间判断是否继续复用
- 失效后重新拉取并覆盖缓存

### 中文编码规则

- 写入数据库缓存时，JSON 编码应优先保留可读汉字，不要默认把中文转成 `\uXXXX`
- 推荐统一使用 `wp_json_encode( $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES )`
- 适用范围至少包括：
  - 产品聚合缓存 `_pw_aggregated_data_cache`
  - 印刷方式缓存 `pw_print_methods_*`
  - 自定义颜色缓存 `pw_custom_colors_*`
- 如果历史缓存已经是 Unicode 转义串，读取侧仍需保留兼容解码，不能只修写入不修读取

### 实施规则

- 只缓存聚合结果，不直接缓存模拟数据 `mock_data`
- 若远端 `updated_at` 变化但比较后无实际字段差异，则只刷新本地缓存时间戳
- 可以按单产品清理，也可以批量清理全部相关 meta

## 二类：transient 短期缓存

### 产品变更差异

- 键名：`pw_product_changes_{product_id}`
- 用途：暂存本地与远端的字段差异，供后续更新商品时复用
- TTL：`HOUR_IN_SECONDS`

### 产品更新通知

- 键名：`pw_product_updated_flag_{product_id}`
- 用途：同步后给前台一个短期刷新信号
- TTL：`5 * MINUTE_IN_SECONDS`

### 后台 UI 消息

- 键名：
  - `pwca_settings_messages`
  - `pwca_dashboard_messages`
  - `pwca_import_completed`
- 用途：保存页面跳转或刷新后的提示信息、导入完成状态
- 特点：不是业务数据缓存，而是短期状态缓存

### 注意

- 若站点没有持久化对象缓存，`transient` 通常仍会落到 `wp_options`
- 排查数据库时应同时关注 `_transient_*` 与 `_transient_timeout_*`

## 三类：option 缓存

### 印刷方式缓存

- 键模式：
  - `pw_print_methods_{md5(ids)}_data`
  - `pw_print_methods_{md5(ids)}_time`
- 数据：`print-methods?ids=...` 的返回结果
- 失效方式：通过远端 `updated-at` 对比时间戳

### 自定义颜色缓存

- 键模式：
  - `pw_custom_colors_{color_list_id}_data`
  - `pw_custom_colors_{color_list_id}_time`
- 数据：`custom-colors/{color_list_id}` 的返回结果
- 失效方式：通过远端更新时间判断

### 配置项不是缓存

以下 `option` 会落库，但属于配置，不应与缓存混淆：

- `pw_cache_enabled`
- `pw_api_token`
- `pw_store_id`
- `pw_api_mock_mode`
- `pw_disable_ssl`
- `pw_api_key`
- `pw_api_secret`
- `pw_customize_text`
- `pw_customize_color`

## 四类：会落库但属于同步持久化数据

这些数据虽写入 WordPress 数据库，但本质上是同步后的本地业务副本，不属于短期缓存：

- `pw_id`
- `pw_blank_item`
- `pw_inquiry_button`
- `_price`
- `_regular_price`
- `_sku`
- `pw_main_custom_view`
- `pw_sub_custom_view`
- `pw_isSyncProduct`
- `pw_product_type`
- `pw_composite_main_id`
- `pw_composite_main_post_id`
- `pw_composite_related_products`
- `pw_composite_all_product_ids`
- `_children`

使用这个结论时要区分两种语义：

- 如果问题是“哪些数据会写进数据库”，这些都算
- 如果问题是“哪些是缓存”，这些多数不算缓存，而是同步后的持久化业务数据

## 五类：Action Scheduler 数据

### 数据形态

产品同步流程会调度异步任务：

- `import_single_product`
- `import_composite_product_group`
- `process_container_rules`

### 落库位置

通常会进入 Action Scheduler 相关表，例如：

- `actionscheduler_actions`
- `actionscheduler_claims`
- `actionscheduler_groups`
- `actionscheduler_logs`

### 结论

- 这类记录会进数据库
- 但它们属于任务调度持久化，不是接口数据缓存

## 推荐排查顺序

当用户反馈“数据不更新”或“怀疑缓存”时，优先按以下顺序判断：

1. 先看是否命中产品聚合缓存 `_pw_aggregated_data_cache`
2. 再看远端 `updated_at` 是否使缓存失效
3. 如果涉及中文乱码，先确认缓存写入是否保留汉字，再确认读取侧是否做了解码兼容
4. 再看 `pw_print_methods_*` / `pw_custom_colors_*` 这类 `option` 缓存
5. 再看 `transient` 是否只是短期状态残留
6. 最后区分问题是否其实来自同步后的长期 `post meta`

## 中文乱码专项结论

当用户反馈“API 数据缓存后中文乱码”时，优先按下面结论处理：

1. 写入侧：
   - 后端缓存 JSON 应统一走中文不转义编码
   - 不要让缓存层主动把中文变成 `\u4e2d\u6587`
2. 读取侧：
   - 前端产品数据入口应做一次统一标准化
   - 至少覆盖 `templates` 下的视图名、图层文本、嵌套配置字符串
3. 舞台侧：
   - `fabric.Text(...)` 这类渲染点不应承担解码职责
   - 舞台收到的数据应已经是正常中文

## 推荐修复策略

- 第一层：后端缓存写入时统一保留中文
- 第二层：前端读取缓存或实时接口数据时做递归字符串解码
- 第三层：保留对旧缓存的兼容，不要求一次性迁移所有历史数据
- 第四层：若用户仍看到旧乱码，提示清理相关缓存并重新生成

## 实施约束

- 新增外部接口缓存时，优先沿用现有 WordPress 存储方式，不要前端直连外部 API
- 所有外部 API 调用必须通过 `includes/class-pw-admin-promowares-api.php`
- 设计缓存时必须同时定义：
  - 键名规则
  - TTL 或远端更新时间比对规则
  - 失效触发点
  - 清理入口
- 不要把配置项、同步元数据、任务记录全部笼统称为“缓存”

## 回答这类问题时的标准口径

建议按下面结构回答：

1. 先区分真正缓存与持久化数据
2. 再按 `transient` / `option` / `post meta` / 调度表 分类
3. 列出键名模式、数据来源、生命周期
4. 最后补充是否存在批量清理入口和失效逻辑

## 快速结论模板

可以直接复用这段思路：

> 本项目真正的数据库缓存主要在 `post meta`、`transient` 和 `option`。其中产品聚合数据缓存在 `_pw_aggregated_data_cache`，印刷方式和自定义颜色分别缓存在 `pw_print_methods_*`、`pw_custom_colors_*` 这类 `option` 中。同步产品写入的大量 `post meta` 更像本地持久化副本，不属于短期缓存；异步导入任务则会写入 Action Scheduler 表。
