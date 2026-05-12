# 获取单个产品定制数据

```
GET /api/v1/products/{product_id}/customization
```

**内部接口**: `PW_Admin_Promowares_API::get_single_product_customization($product_id)`

**参数**:
- `product_id` - 产品ID (路径参数)

## 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "product_id": 29,
    "custom_template": {
      "id": 53,
      "created_at": "2026-01-28 11:43:41",
      "updated_at": "2026-02-06 18:39:53",
      "deleted_at": null,
      "product_custom_template_name": "T恤",
      "product_category": "服装类1",
      "link_product_id": 29,
      "store_id": null,
      "product_type": "shop",
      "multi_view_config_type": "Seperated"
    },
    "custom_views": [
      {
        "id": 66,
        "created_at": "2026-01-28 11:43:43",
        "updated_at": "2026-02-06 18:39:56",
        "deleted_at": null,
        "product_custom_template_id": 53,
        "product_id": 29,
        "store_id": null,
        "product_type": "shop",
        "view_type": "main",
        "view_flow": "Flat Flow",
        "core_layer_type": "Base Layer +Overlay LayerCombination",
        "view_name": "主",
        "status": "draft",
        "printing_method_list_id": [9],
        "selected_modules": ["TEXT", "UPLOAD"],
        "assign_design_folders": ["Design", "Specific", "Product"],
        "product_specific_design_only": true,
        "inspiring_photos_url": "https://promowares-cloud-storage.s3.amazonaws.com/uploads/1769569273544322000-底色图层.jpg",
        "view_color_list": [],
        "single_printing_method_only": true,
        "layers": [
          {
            "id": 359,
            "created_at": "2026-01-28 11:43:45",
            "updated_at": "2026-02-06 18:39:58",
            "deleted_at": null,
            "custom_view_id": 66,
            "product_id": 29,
            "store_id": null,
            "product_type": "shop",
            "print_method_id": 1,
            "name": "Background Layer",
            "type": "image",
            "layer_data": {
              "content": {
                "opacity": 100,
                "backgroundColor": "#ffffff"
              },
              "controls": {
                "hide": false,
                "movable": false,
                "scalable": false,
                "deletable": false,
                "fixedSize": false,
                "rotatable": false,
                "stayOnTop": false,
                "exportable": true,
                "visibility": true,
                "excludeInExport": false,
                "allowUnproportionalScaling": false
              },
              "position": {
                "zIndex": {
                  "value": 1,
                  "locked": true
                },
                "rotation": 0,
                "anchorPoint": "bottom-left",
                "coordinates": {
                  "x": 0,
                  "y": 0,
                  "unit": "px"
                }
              },
              "dimensions": {
                "layerSize": {
                  "width": 220,
                  "height": 120
                },
                "contentArea": {
                  "width": 600,
                  "height": 600
                },
                "physicalSize": {
                  "width": 20,
                  "height": 20
                }
              }
            },
            "sort_order": 1,
            "status": 1
          }
        ],
        "printing_methods": [
          {
            "id": 9,
            "created_at": "2026-01-28 11:43:46",
            "updated_at": "2026-02-06 18:40:01",
            "deleted_at": null,
            "custom_view_id": 66,
            "product_id": 29,
            "store_id": null,
            "product_type": "shop",
            "name": "DTF",
            "description": "DTF printing method",
            "colors_count": 1,
            "colors": [
              {
                "name": "白色",
                "value": "#FFFFFF"
              }
            ],
            "settings": {
              "min_resolution": 300,
              "max_file_size": 10485760,
              "supported_formats": ["png", "jpg", "svg"]
            },
 "sort_order": 1,
            "status": 1
          }
        ],
        "design_folders": [
          {
            "id": 1,
            "name": "Design",
            "type": "folder",
            "designs": [
              {
                "id": 101,
                "name": "设计1",
                "thumbnail": "https://example.com/design1.png",
                "type": "template"
              }
            ]
          },
          {
            "id": 2,
            "name": "Specific",
            "type": "folder",
            "designs": []
          },
          {
            "id": 3,
            "name": "Product",
            "type": "folder",
            "designs": []
          }
        ],
        "text_settings": {
          "fonts": ["Arial", "Times New Roman", "Helvetica"],
          "max_length": 100,
          "allow_multiline": true,
          "default_color": "#000000"
        },
        "upload_settings": {
          "max_file_size": 10485760,
          "supported_formats": ["png", "jpg", "svg"],
          "min_resolution": 300,
          "max_resolution": 600
        }
      }
    ],
    "product_settings": {
      "allow_custom_color": true,
      "allow_gradient": false,
      "default_color": "#FFFFFF",
      "color_options": [
        {
          "name": "白色",
          "value": "#FFFFFF"
        },
        {
          "name": "黑色",
          "value": "#000000"
        }
      ]
    },
    "pricing": {
      "base_price": 100,
      "currency": "USD",
      "quantity_discounts": [
        {
          "min_quantity": 10,
          "discount_percentage": 5
        },
        {
          "min_quantity": 50,
          "discount_percentage": 10
        }
      ]
    }
  }
}
```

## 数据结构说明

### custom_template (定制模板)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 模板ID |
| product_custom_template_name | string | 模板名称 |
| product_category | string | 产品分类 |
| link_product_id | int | 关联产品ID |
| product_type | string | 产品类型 (shop) |
| multi_view_config_type | string | 多视图配置类型 |

### custom_views (定制视图)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 视图ID |
| view_type | string | 视图类型 (main/back/side等) |
| view_flow | string | 视图流程 |
| core_layer_type | string | 核心图层类型 |
| view_name | string | 视图名称 |
| status | string | 状态 (draft/published) |
| selected_modules | array | 启用的功能模块 (TEXT/UPLOAD/DESIGN) |
| layers | array | 图层配置 |
| printing_methods | array | 印刷方式配置 |
| design_folders | array | 设计文件夹配置 |

## 已知兼容问题

### `view_name` 可能以 Unicode 转义串返回

- 某些产品的 `custom_views[*].view_name` 不是直接返回中文，而是以下格式之一：
  - `u4e3bu5b9au5236u89c6u56fe`
  - `\u4e3b\u5b9a\u5236\u89c6\u56fe`
  - `主u5b9a制u89c6图`
- 如果前端直接将该值写入按钮文本，在线设计界面会显示乱码样式的转义串，而不是中文。
- 如果页面已经从整串乱码变成“半中文半转义”，通常不是缓存再次写坏，而是前端解码器漏掉了连续或残留的 `uXXXX` 片段。
- 当前项目的推荐处理方式：
  - 在产品数据入口统一标准化 `view_name`
  - 再将标准化后的数据交给视图切换、画布渲染、多视图导出等模块使用
- 当前项目已落地位置：
  - `modules/front_canvas/assets/js/design/stores/index.js`
  - 在 `fetchProductData()` 中对 `templates.views` 与 `templates.data.custom_view` 的相关 `view_name/name` 做统一解码
- 兼容要求：
  - 同时兼容普通中文、`uXXXX`、`\uXXXX`、半解码残留串
  - 建议按顺序处理：先解 `\uXXXX`，再解整串连续 `uXXXX`，最后补解夹在中文中的残留 `uXXXX`
  - 解码失败时回退原值

### layers (图层)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 图层ID |
| name | string | 图层名称 |
| type | string | 图层类型 (image/text/shape) |
| layer_data | object | 图层数据配置 |
| sort_order | int | 排序顺序 |

### layer_data 结构
| 字段 | 类型 | 说明 |
|------|------|------|
| content | object | 内容配置 (opacity, backgroundColor等) |
| controls | object | 控制选项 (movable, scalable, deletable等) |
| position | object | 位置配置 (coordinates, rotation, zIndex等) |
| dimensions | object | 尺寸配置 (layerSize, contentArea, physicalSize) |
