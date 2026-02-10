# Print Methods API

## 获取印刷方式

```
GET /api/v1/print-methods?ids={ids}
```

**内部接口**: `PW_Admin_Promowares_API::get_print_methods($ids)`

**用途**: 获取产品支持的印刷方式

**响应示例**:
```json
{
    "code": 200,
    "message": "success",
    "data": [
        {
            "id": 1,
            "created_at": "2025-06-17 08:18:48",
            "updated_at": "2025-09-10 20:49:10",
            "deleted_at": null,
            "name": "数码印刷1",
            "code": "PM001",
            "set_as_default": true,
            "use_global_setting": false,
            "moq_enabled": true,
            "moq_quantity": 10,
            "print_cost": 0.58,
            "anchor_price": 0.66,
            "process_time": 3,
            "sample_enabled": true,
            "sample_cost": 3,
            "printable_color": "Color List",
            "color_list_id": 1,
            "size_unit": "cm",
            "discount_enabled": false,
            "ranges": [],
            "crop_mark": true,
            "bleed_mark": true,
            "bleed_value": 3,
            "show_print_area": true,
            "show_content_out": true,
            "size_mark": "Content",
            "helper_text": "test",
            "helper_image": "string",
            "description": "适用于小批量印刷",
            "print_method_area": "https://promowares-cloud-storage.s3.amazonaws.com/uploads/1755256093673732000-print-area.png",
            "print_method_area_width": 7,
            "print_method_area_height": 7,
            "copyable": true,
            "enable_charge_per_copy": true,
            "status": 1
        }
    ]
}
```

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | integer | 印刷方式ID |
| `name` | string | 印刷方式名称 |
| `code` | string | 印刷方式代码 |
| `set_as_default` | boolean | 是否为默认印刷方式 |
| `use_global_setting` | boolean | 是否使用全局设置 |
| `moq_enabled` | boolean | 是否启用最小起订量 |
| `moq_quantity` | integer | 最小起订量数量 |
| `print_cost` | float | 印刷成本 |
| `anchor_price` | float | 锚定价格 |
| `process_time` | integer | 处理时间（天） |
| `sample_enabled` | boolean | 是否启用样品 |
| `sample_cost` | float | 样品成本 |
| `printable_color` | string | 可印刷颜色类型，`Color List` 或 `All Color` |
| `color_list_id` | integer | 颜色列表ID，当 `printable_color` 为 `Color List` 时使用 |
| `size_unit` | string | 尺寸单位 |
| `discount_enabled` | boolean | 是否启用折扣 |
| `ranges` | array | 折扣区间配置 |
| `crop_mark` | boolean | 是否显示裁切标记 |
| `bleed_mark` | boolean | 是否显示出血标记 |
| `bleed_value` | integer | 出血值 |
| `show_print_area` | boolean | 是否显示印刷区域 |
| `show_content_out` | boolean | 是否显示内容超出提示 |
| `size_mark` | string | 尺寸标记类型 |
| `helper_text` | string | 辅助文字 |
| `helper_image` | string | 辅助图片URL |
| `description` | string | 印刷方式描述 |
| `print_method_area` | string | 印刷区域图片URL |
| `print_method_area_width` | float | 印刷区域宽度 |
| `print_method_area_height` | float | 印刷区域高度 |
| `copyable` | boolean | 是否可复制 |
| `enable_charge_per_copy` | boolean | 是否按份收费 |
| `status` | integer | 状态，1为启用 |

## 关联接口

当 `printable_color` 字段值为 `Color List` 且 `color_list_id` 不为 0 时，需要调用以下接口获取颜色列表详情：

```
GET /api/v1/custom-colors/{color_list_id}
```

**内部接口**: `PW_Admin_Promowares_API::get_custom_colors($color_list_id)`

详见 [get_print-method_colorlist_info.md](get_print-method_colorlist_info.md)
