# 店铺定制设置 — 插件对接说明

面向 WordPress 定制插件 说明：**调哪个接口、返回什么、怎么用、和定制视图数据谁覆盖谁**。

---

## 1. 要解决的问题

店铺绑定后，在线设计器、产品页、下单校验需要一套**店铺级默认配置**（尺寸单位、可用模块、图层操作、是否弹确认框、价格/MOQ 是否展示等）。

- **店铺级默认** → 本文档接口 `GET /store/customization-settings`
- **某个产品某个视图** 可能另有配置 → 产品定制接口里的 `custom_views`（优先级更高，见第 5 节）

---

## 2. 快速开始

### 2.1 请求

```http
GET /api/v1/store/customization-settings
Authorization: Bearer {shop_token}
```

| 要求 | 说明 |
|------|------|
| Token 类型 | **店铺 Token**（绑定店铺后下发，JWT 里带 `shop_id`） |、

### 2.2 成功响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "store_id": 1,
    "sync_mode": "same_as_library",
    "size_unit": "cm",
    "active_modules": ["TEXT", "UPLOAD", "DESIGN"],
    "google_font": "",
    "font_size": 13,
    "single_printing_method_only": "disable",
    "printing_method_restrictions": "enable",
    "print_method_helper_link": "enable",
    "image_format": "jpg,png,svg",
    "layer_depth": -1,
    "scale_mode": "fit",
    "stay_on_top": false,
    "auto_select": true,
    "rotatable": true,
    "removable": true,
    "moveable": true,
    "scalable": true,
    "allow_unproportional_scaling": false,
    "min_scale_limit": 0.2,
    "scale_by": "factor",
    "bitmap_image_consent": false,
    "vector_image_color_compliance": false,
    "fields_visibility": {
      "moq_fields": [],
      "cost_breakdown_fields": [],
      "delivery_time_fields": []
    },
    "sent_print_file_to_customer": true,
    "file_dpi": 300,
    "background_image": ""
  }
}
```

---

## 3. 推荐接入顺序

```
进入定制页
  → ① GET /store/customization-settings          （店铺默认，可缓存）
  → ② GET /products/{id}/customization
        或 GET /custom-views?product_id={id}     （当前产品的视图、图层）
  → ③ 按第 5 节合并「视图配置」与「店铺默认」
  → ④ 需要印刷方式详情时：
        GET /print-methods?ids={printing_method_list_id 逗号拼接}
  → 渲染设计器 / 价格区 / 提交前校验
```

**缓存建议：** 按 `store_id` 缓存 ① 的结果（如 WordPress transient）；换店或运营改设置后再刷新。

---

## 4. 响应字段说明

### 4.1 元信息

| 字段 | 类型 | 说明 |
|------|------|------|
| `store_id` | number | 当前店铺 ID，与 Token 一致 |
| `sync_mode` | string | `same_as_library` \| `set_different`，见 2.4 |

### 4.2 尺寸（#1）

| 字段 | 类型 | 默认 | 插件怎么用 |
|------|------|------|------------|
| `size_unit` | string | `cm` | 全站尺寸展示单位：`cm` 或 `inch`。用于产品/变体长宽高标签、设计器标尺、印刷区域尺寸。换算：`inch = cm / 2.54` |

### 4.3 功能模块（#2）— 会被视图覆盖

| 字段 | 类型 | 默认 | 插件怎么用 |
|------|------|------|------------|
| `active_modules` | string[] | `TEXT`,`UPLOAD`,`DESIGN` | 设计器默认启用的模块。若当前视图有 `selected_modules` 且非空，**以视图为准**（见第 5 节） |

### 4.4 字体（#3–4）

| 字段 | 类型 | 默认 | 插件怎么用 |
|------|------|------|------------|
| `google_font` | string | `""` | 设计器字体族 |
| `font_size` | number | `13` | 文本图层默认字号（px） |

### 4.5 印刷方式 UI 开关（#5–7）

| 字段 | 类型 | 可选值 | 插件怎么用 |
|------|------|--------|------------|
| `single_printing_method_only` | string | `enable` / `disable` | 是否限制「一个视图只能选一种印刷方式」。与视图里的 `single_printing_method_only`（bool）合并，**视图优先** |
| `printing_method_restrictions` | string | `enable` / `disable` | 是否显示印刷方式的动态限制说明 |
| `print_method_helper_link` | string | `enable` / `disable` | 是否显示印刷方式帮助链接；详情来自 `GET /print-methods` 的 `helper_text` / `helper_image` |

印刷方式列表 ID 在视图的 `printing_method_list_id`，详情见第 6 节。

### 4.6 上传与图片（#8–10）

| 字段 | 类型 | 默认 | 插件怎么用 |
|------|------|------|------------|
| `image_format` | string | 如 `jpg,png,svg` | 上传组件 `accept` |
| `layer_depth` | number | `-1` | 用户上传图片默认层级，`-1` 表示在最上层 |
| `scale_mode` | string | `fit` | 图片置入画布方式：`fit` / `cover` / `original`（小写） |

### 4.7 图层交互（#11–19）

| 字段 | 类型 | 默认（多为 true） | 插件怎么用 |
|------|------|-------------------|------------|
| `stay_on_top` | bool | false | 图层是否强制置顶 |
| `auto_select` | bool | true | 点击画布是否选中图层 |
| `rotatable` | bool | true | 是否可旋转 |
| `removable` | bool | true | 是否可删除 |
| `moveable` | bool | true | 是否可拖动 |
| `scalable` | bool | true | 是否可缩放；为 `false` 时见 4.10 |
| `allow_unproportional_scaling` | bool | false | 是否允许非等比缩放 |
| `scale_by` | string | `factor` | `factor`（按图片比例）或 `dimension`（按容器） |
| `min_scale_limit` | number | `0.2` | 最小缩放到原尺寸的倍数 |

### 4.8 下单前校验（#20–21）

| 字段 | 类型 | 插件怎么用 |
|------|------|------------|
| `bitmap_image_consent` | bool | 为 `true`：限色印刷方式 + 存在位图时，提交订单前弹窗让用户确认色差 |
| `vector_image_color_compliance` | bool | 为 `true`：限色印刷方式 + 矢量颜色不符时，要求改色后才能提交 |

### 4.9 前台信息是否展示（#22–27）

`fields_visibility` 下三个数组，**成员字符串在数组内 = 显示该块，不在 = 隐藏**：

| 子字段 | 常见成员 | 控制内容 |
|--------|----------|----------|
| `moq_fields` | `items_design`, `items_color`, `sample_order` | 起订量相关（按印刷方式 / 按颜色 / 样品单） |
| `cost_breakdown_fields` | `blank_item`, `custom_fee` | 基础价、定制费 |
| `delivery_time_fields` | `rts_date`, `arrival_date` | 发货日、到货日 |

具体文案与数值仍来自产品/变体/印刷方式等接口，这里只控制**显不显示**。

### 4.10 输出与背景（#28–30）

| 字段 | 类型 | 默认 | 插件怎么用 |
|------|------|------|------------|
| `sent_print_file_to_customer` | bool | true | 订单邮件是否附带印刷文件下载 |
| `file_dpi` | number | `300` | 导出印刷文件 DPI |
| `background_image` | string | URL | 店铺级效果图背景（四格图、平面图等场景） |

### 4.11 前端联动（接口不校验，插件自己实现）

| 条件 | 插件 UI 行为 |
|------|----------------|
| `scalable === false` | 关闭非等比缩放；隐藏 `scale_by`、`min_scale_limit` |
| `single_printing_method_only === "enable"` | 当前视图印刷方式单选（再结合视图 bool） |

---

## 5. 字段优先级（必做）

规则：**定制视图上的配置 > 店铺定制设置接口返回的配置 > 插件写死的兜底**

### 5.1 合并流程

```
店铺设置 = GET /store/customization-settings 的 data
视图     = 当前 custom_view（来自产品定制接口）

对每个逻辑项：
  若视图有有效值 → 用视图
  否则           → 用店铺设置
  仍为空         → 用插件内置默认
```

### 5.2 必须用视图覆盖的项

| 业务 | 店铺接口字段 | 视图字段 | 合并方式 |
|------|--------------|----------|----------|
| 可用模块 | `active_modules` | `selected_modules` | `selected_modules.length > 0` 则用视图，否则用 `active_modules` |
| 仅一种印刷方式 | `single_printing_method_only`（字符串） | `single_printing_method_only`（布尔） | 视图有配置则用视图 bool；否则 `enable` → true |
| 可选印刷方式 ID 列表 | — | `printing_method_list_id` | **只用视图**，再调 `GET /print-methods?ids=` |

### 5.3 只用店铺接口、不看视图的项

`size_unit`、字体、上传格式、`layer_depth`、`scale_mode`、图层交互 11–19 项、下单校验 20–21、`fields_visibility`、`file_dpi`、`background_image`、印刷限制/帮助**开关**（#6、#7）等——直接读店铺接口即可。


