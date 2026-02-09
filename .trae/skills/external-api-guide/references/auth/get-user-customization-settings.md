# User Customization Settings API

## 获取用户定制化设置

```
GET /api/v1/customization-settings
```

**内部接口**: 通过 `PW_Admin_Promowares_Api::call_promowares_api('customization-settings', $token)` 调用

**用途**: 获取当前认证用户的全局定制化设置，包括画布行为、模块开关、打印设置等

**cURL 示例**:
```bash
curl --request GET \
  --url 'https://dev.promowares.com/api/v1/customization-settings' \
  --header 'Accept: application/json' \
  --header 'Accept-Encoding: gzip, deflate, br' \
  --header 'Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  --header 'Connection: keep-alive'
```

**响应示例** (成功):
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "id": 5,
        "created_at": "2026-01-28 11:38:41",
        "updated_at": "2026-01-28 11:38:41",
        "deleted_at": null,
        "user_id": 4,
        "size_unit": "cm",
        "text_module": true,
        "upload_module": true,
        "design_module": true,
        "google_font": "",
        "font_size": 13,
        "single_printing_method_only": true,
        "printing_method_restrictions": true,
        "print_method_helper_link": true,
        "image_format": "PNG",
        "layer_depth": -1,
        "scale_mode": "fit",
        "stay_on_top": false,
        "auto_select": true,
        "rotatable": true,
        "removable": true,
        "moveable": true,
        "scalable": true,
        "allow_unproportional_scaling": false,
        "scale_by": "Factor",
        "min_scale_limit": 0.2,
        "bitmap_image_consent": true,
        "vector_image_color_compliance": true,
        "moq_items_design": true,
        "moq_items_color": true,
        "moq_sample_order": true,
        "cost_blank_item": true,
        "cost_custom_fee": true,
        "delivery_rts_date": true,
        "delivery_arrival_date": false,
        "send_print_file_to_customer": true,
        "file_dpi": 300,
        "background_image_url": ""
    }
}
```

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | int | 设置记录ID |
| `user_id` | int | 用户ID |
| `size_unit` | string | 尺寸单位: `cm` (厘米) 或 `inch` (英寸) |
| `text_module` | bool | 是否启用文字模块 |
| `upload_module` | bool | 是否启用上传模块 |
| `design_module` | bool | 是否启用设计模块 |
| `google_font` | string | Google字体配置（JSON字符串或空） |
| `font_size` | int | 默认字体大小 |
| `single_printing_method_only` | bool | 是否限制单一印刷方式 |
| `printing_method_restrictions` | bool | 是否启用印刷方式限制 |
| `print_method_helper_link` | bool | 是否显示印刷方式帮助链接 |
| `image_format` | string | 图片格式: `PNG`, `JPG`, `PDF` 等 |
| `layer_depth` | int | 图层深度限制 (-1 表示无限制) |
| `scale_mode` | string | 缩放模式: `fit` (适应), `fill` (填充) 等 |
| `stay_on_top` | bool | 元素是否始终置顶 |
| `auto_select` | bool | 是否自动选中新添加元素 |
| `rotatable` | bool | 元素是否可旋转 |
| `removable` | bool | 元素是否可删除 |
| `moveable` | bool | 元素是否可移动 |
| `scalable` | bool | 元素是否可缩放 |
| `allow_unproportional_scaling` | bool | 是否允许非等比缩放 |
| `scale_by` | string | 缩放方式: `Factor` (因子) 或 `Size` (尺寸) |
| `min_scale_limit` | float | 最小缩放限制 (0.2 = 20%) |
| `bitmap_image_consent` | bool | 是否启用位图图片合规检查 |
| `vector_image_color_compliance` | bool | 是否启用矢量图颜色合规检查 |
| `moq_items_design` | bool | 是否显示设计MOQ（最小起订量） |
| `moq_items_color` | bool | 是否显示颜色MOQ |
| `moq_sample_order` | bool | 是否允许样品订单 |
| `cost_blank_item` | bool | 是否显示空白商品成本 |
| `cost_custom_fee` | bool | 是否显示定制费用 |
| `delivery_rts_date` | bool | 是否显示RTS（准备发货）日期 |
| `delivery_arrival_date` | bool | 是否显示到货日期 |
| `send_print_file_to_customer` | bool | 是否向客户发送打印文件 |
| `file_dpi` | int | 文件DPI设置 (默认300) |
| `background_image_url` | string | 背景图片URL |

**响应示例** (失败):
```json
{
    "code": 1,
    "message": "invalid or inactive shop token"
}
```

**注意**: 
- `code` 不为 200 时表示异常
- 该接口返回的是用户级别的全局设置，用于初始化画布设计器的默认行为
- 在聚合产品数据接口 (`/pw/v1/product-data/{id}`) 中，该数据包含在 `customization_settings` 字段中
