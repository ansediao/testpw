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
			"composite_products": null
		},
		"pagination": {
			"page": 1,
			"page_size": 10,
			"total": 2
		}
	}
}
```
