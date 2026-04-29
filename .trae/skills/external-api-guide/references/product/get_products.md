# 获取产品列表

```
GET /api/v1/products
```

**内部接口**: `PW_Admin_Promowares_API::get_products($params)`

**参数**:

- `page` - 页码
- `per_page` - 每页数量
- `category` - 分类筛选

## 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": {
      "single_products": [
        {
          "id": 28,
          "store_id": 2,
          "product_id": 67,
          "market_coverage": "Global",
          "countries": [],
          "status": "publish",
          "category_id": 2,
          "product_image": "https://promowares-cloud-storage.s3.amazonaws.com/uploads/1769568510393977000-tote-cup.png",
          "product_gallery": [
            "https://promowares-cloud-storage.s3.amazonaws.com/uploads/1769568513827738000-tote-cup.png"
          ],
          "owner": "",
          "product_type": "single",
          "container_id": 0,
          "product_permission": "",
          "dealer": "",
          "name": "保温杯",
          "short_description": "保温杯",
          "description": "保温杯。。。。。。。",
          "price": 1089,
          "anchor_price": 1089,
          "sku": "bwb1_4",
          "quantity_discount": [
            {
              "type": "MOQ",
              "range_from": 1,
              "range_to": 5,
              "discount": 0.09,
              "extra_processing_time": 1
            },
            {
              "type": "MOQ",
              "range_from": 6,
              "range_to": 10,
              "discount": 0.08,
              "extra_processing_time": 2
            },
            {
              "type": "Quantity",
              "range_from": 1,
              "range_to": 20,
              "discount": 0.09,
              "extra_processing_time": 1
            },
            {
              "type": "Quantity",
              "range_from": 21,
              "range_to": 50,
              "discount": 0.08,
              "extra_processing_time": 2
            }
          ],
          "blank_item": true,
          "inquiry_button": true,
          "sample_service": {
            "type": "",
            "enable": true,
            "price": 99,
            "anchor_price": 99
          },
          "sell_in_batch": true,
          "sell_in_batch_info": {
            "batch_quantity": 50,
            "moq_quantity": 1
          },
          "moq_setting": {
            "type": "SetDifferent Value",
            "enable": true,
            "minimum_order_quantity": 50
          },
          "accessories": [
            {
              "name": "杯套",
              "sku": "bk01",
              "price": 33,
              "anchor_price": 33,
              "product_image": "https://promowares-cloud-storage.s3.amazonaws.com/uploads/1770372849895968203-ScreenShot_2026-02-06_181354_703.png"
            }
          ],
          "shipping_info": {
            "weight": 5,
            "width": 20,
            "length": 20,
            "height": 40,
            "ship_from_setting": "Hide",
            "hs_code_setting": "Show",
            "hs_code": "hs01",
            "rts_date_setting": "Set Different Value",
            "rts_for_sample_order": 5,
            "rts_for_bulk_order": 10
          },
          "arrival_date": true,
          "avg_shipping_time": "",
          "rts_enabled": true,
          "rts_date_starts_from": "",
          "attributes": [
            {
              "name": "宽",
              "value": "20",
              "default": false
            },
            {
              "name": "高",
              "value": "40",
              "default": false
            }
          ],
          "variants": [
            {
              "name": "红色",
              "value": "#9F1212",
              "default": false
            },
            {
              "name": "绿色",
              "value": "#08E613",
              "default": false
            }
          ],
          "enable_custom_color": true,
          "enable_gradient_color": false,
          "currency": "USD",
          "sync_time": "2026-01-28 11:43:47",
          "sync_status": "Active",
          "modified_time": "2026-01-28 11:39:18",
          "created_at": "2026-01-28 11:43:25",
          "updated_at": "2026-01-28 11:43:48",
          "deleted_at": null
        }
      ],
      "composite_products": [
        {
          "main_product_id": 39,
          "container_name": "test1",
          "container_label": "size",
          "products": [
            {
              "id": 50,
              "store_id": 16,
              "product_id": 94,
              "market_coverage": "",
              "countries": [],
              "status": "publish",
              "category_id": 23,
              "product_image": "https://promowares-cloud-storage.s3.amazonaws.com/uploads/1773153437146502700-wechat_2025-09-02_053027_364.png",
              "product_gallery": [],
              "owner": "",
              "product_type": "composite",
              "container_id": 8,
              "product_permission": "",
              "dealer": "",
              "name": "test3",
              "short_description": "test3",
              "description": "test3test3test3test3",
              "price": 5.94,
              "anchor_price": 5.94,
              "sku": "test3_14",
              "quantity_discount": [
                {
                  "type": "MOQ",
                  "range_from": 1,
                  "range_to": 1,
                  "discount": 0.9,
                  "extra_processing_time": 0
                },
                {
                  "type": "Quantity",
                  "range_from": 10,
                  "range_to": 100,
                  "discount": 0.1,
                  "extra_processing_time": 0
                }
              ],
              "blank_item": true,
              "inquiry_button": true,
              "sample_service": {
                "type": "",
                "enable": true,
                "price": 20,
                "anchor_price": 20
              },
              "sell_in_batch": false,
              "sell_in_batch_info": {
                "batch_quantity": 0,
                "moq_quantity": 0
              },
              "moq_setting": {
                "type": "Use Global Setting",
                "enable": true,
                "minimum_order_quantity": 1
              },
              "accessories": [],
              "shipping_info": {
                "weight": 6,
                "width": 6,
                "length": 6,
                "height": 6,
                "ship_from_setting": "Use Global Setting",
                "ship_from_value": "China",
                "hs_code_setting": "Use Global Setting",
                "rts_date_setting": "Use Global Setting",
                "rts_for_sample_order": 1,
                "rts_for_bulk_order": 1
              },
              "arrival_date": true,
              "avg_shipping_time": "5",
              "rts_enabled": true,
              "rts_date_starts_from": "",
              "attributes": [
                {
                  "name": "宽",
                  "value": "11",
                  "default": false
                },
                {
                  "name": "高",
                  "value": "11",
                  "default": false
                }
              ],
              "variants": [
                {
                  "name": "红色",
                  "value": "#9F1212",
                  "default": false
                },
                {
                  "name": "绿色",
                  "value": "#08E613",
                  "default": false
                }
              ],
              "enable_custom_color": false,
              "enable_gradient_color": false,
              "currency": "USD",
              "sync_time": "2026-04-11 14:50:15",
              "sync_status": "Active",
              "modified_time": "2026-04-11 14:47:01",
              "created_at": "2026-04-11 14:50:16",
              "updated_at": "2026-04-11 14:50:16",
              "deleted_at": null,
              "label_value": "s"
            },
            {
              "id": 51,
              "store_id": 16,
              "product_id": 95,
              "market_coverage": "",
              "countries": [],
              "status": "publish",
              "category_id": 0,
              "product_image": "",
              "product_gallery": [],
              "owner": "",
              "product_type": "composite",
              "container_id": 8,
              "product_permission": "",
              "dealer": "",
              "name": "test4",
              "short_description": "test4",
              "description": "test4test4test4",
              "price": 6.93,
              "anchor_price": 6.93,
              "sku": "test4_14",
              "quantity_discount": [
                {
                  "type": "MOQ",
                  "range_from": 1,
                  "range_to": 1,
                  "discount": 0.9,
                  "extra_processing_time": 0
                },
                {
                  "type": "Quantity",
                  "range_from": 10,
                  "range_to": 100,
                  "discount": 0.1,
                  "extra_processing_time": 0
                }
              ],
              "blank_item": true,
              "inquiry_button": true,
              "sample_service": {
                "type": "",
                "enable": true,
                "price": 20,
                "anchor_price": 20
              },
              "sell_in_batch": false,
              "sell_in_batch_info": {
                "batch_quantity": 0,
                "moq_quantity": 0
              },
              "moq_setting": {
                "type": "Use Global Setting",
                "enable": true,
                "minimum_order_quantity": 1
              },
              "accessories": [],
              "shipping_info": {
                "weight": 7,
                "width": 7,
                "length": 7,
                "height": 7,
                "ship_from_setting": "Use Global Setting",
                "ship_from_value": "China",
                "hs_code_setting": "Use Global Setting",
                "rts_date_setting": "Use Global Setting",
                "rts_for_sample_order": 1,
                "rts_for_bulk_order": 1
              },
              "arrival_date": true,
              "avg_shipping_time": "5",
              "rts_enabled": true,
              "rts_date_starts_from": "",
              "attributes": [
                {
                  "name": "宽",
                  "value": "7",
                  "default": false
                },
                {
                  "name": "高",
                  "value": "7",
                  "default": false
                }
              ],
              "variants": [
                {
                  "name": "枚红色",
                  "value": "#E16969",
                  "default": false
                }
              ],
              "enable_custom_color": false,
              "enable_gradient_color": false,
              "currency": "USD",
              "sync_time": "2026-04-11 14:50:22",
              "sync_status": "Active",
              "modified_time": "2026-04-11 14:47:11",
              "created_at": "2026-04-11 14:50:23",
              "updated_at": "2026-04-11 14:50:23",
              "deleted_at": null,
              "label_value": "l"
            },
            {
              "id": 52,
              "store_id": 16,
              "product_id": 96,
              "market_coverage": "",
              "countries": [],
              "status": "publish",
              "category_id": 23,
              "product_image": "https://promowares-cloud-storage.s3.amazonaws.com/uploads/1775663896460458400-wechat_2025-09-02_053110_462.png",
              "product_gallery": [],
              "owner": "",
              "product_type": "composite",
              "container_id": 8,
              "product_permission": "",
              "dealer": "",
              "name": "test55",
              "short_description": "test55",
              "description": "test55test55test55",
              "price": 44.53,
              "anchor_price": 44.53,
              "sku": "test55_14",
              "quantity_discount": [
                {
                  "type": "MOQ",
                  "range_from": 1,
                  "range_to": 1,
                  "discount": 0.9,
                  "extra_processing_time": 0
                },
                {
                  "type": "Quantity",
                  "range_from": 10,
                  "range_to": 100,
                  "discount": 0.1,
                  "extra_processing_time": 0
                }
              ],
              "blank_item": true,
              "inquiry_button": true,
              "sample_service": {
                "type": "",
                "enable": true,
                "price": 20,
                "anchor_price": 20
              },
              "sell_in_batch": false,
              "sell_in_batch_info": {
                "batch_quantity": 0,
                "moq_quantity": 0
              },
              "moq_setting": {
                "type": "Use Global Setting",
                "enable": true,
                "minimum_order_quantity": 1
              },
              "accessories": [],
              "shipping_info": {
                "weight": 3,
                "width": 4,
                "length": 3,
                "height": 3,
                "ship_from_setting": "Use Global Setting",
                "ship_from_value": "China",
                "hs_code_setting": "Use Global Setting",
                "rts_date_setting": "Use Global Setting",
                "rts_for_sample_order": 1,
                "rts_for_bulk_order": 1
              },
              "arrival_date": true,
              "avg_shipping_time": "",
              "rts_enabled": true,
              "rts_date_starts_from": "",
              "attributes": [
                {
                  "name": "宽",
                  "value": "2",
                  "default": false
                },
                {
                  "name": "高",
                  "value": "2",
                  "default": false
                }
              ],
              "variants": [
                {
                  "name": "红色",
                  "value": "#9F1212",
                  "default": false
                },
                {
                  "name": "绿色",
                  "value": "#08E613",
                  "default": false
                }
              ],
              "enable_custom_color": false,
              "enable_gradient_color": false,
              "currency": "USD",
              "sync_time": "2026-04-11 14:50:27",
              "sync_status": "Active",
              "modified_time": "2026-04-11 14:47:20",
              "created_at": "2026-04-11 14:50:28",
              "updated_at": "2026-04-11 14:50:28",
              "deleted_at": null,
              "label_value": "m"
            }
          ]
        }
      ]
    },
    "pagination": {
      "page": 1,
      "page_size": 10,
      "total": 2
    }
  }
}
```
