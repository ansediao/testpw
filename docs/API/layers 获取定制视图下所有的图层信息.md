# 图层管理接口文档

## 接口概述

该接口用于根据定制视图ID获取关联的所有图层信息，是产品画布渲染和图层管理功能的核心接口。通过该接口可以获取指定视图下的所有图层配置数据，包括图层内容、控制属性、位置信息和尺寸数据。

**接口地址**: `GET /api/v1/layers`

**BASE URL**: `https://dev.promowares.com`

**完整URL**: `https://dev.promowares.com/api/v1/layers?custom_view_id={custom_view_id}`

## 请求参数

### 查询参数

| 参数名            | 类型 | 必需 | 说明                               |
| ----------------- | ---- | ---- | ---------------------------------- |
| custom_view_id    | int  | 否*  | 定制视图ID                         |
| print_method_id   | int  | 否*  | 印刷方式ID                         |

**注意**: 至少需要提供 `custom_view_id` 或 `print_method_id` 中的一个参数

### 请求头

| 参数名        | 类型   | 必需 | 说明                     |
| ------------- | ------ | ---- | ------------------------ |
| Authorization | string | 是   | JWT认证令牌，格式：Bearer {JWT_TOKEN} |
| Accept        | string | 否   | 接受的内容类型，默认：application/json |

## 请求示例

```bash
curl -X 'GET' \
  'https://dev.promowares.com/api/v1/layers?custom_view_id=1' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer {JWT_TOKEN}'
```

## 响应数据

### 响应格式

所有响应都遵循统一的格式：

```json
{
  "code": 200,
  "message": "success", 
  "data": [array]
}
```

### 根级别字段

| 字段名    | 类型   | 说明                        |
| --------- | ------ | --------------------------- |
| `code`    | number | 响应状态码，200 表示成功    |
| `message` | string | 响应消息，"success"表示成功 |
| `data`    | array  | 图层数据对象数组            |

### 图层对象字段 (data数组中的对象)

| 字段名            | 类型   | 说明                                  |
| ----------------- | ------ | ------------------------------------- |
| `id`              | number | 图层唯一标识ID                        |
| `custom_view_id`  | number | 关联的定制视图ID                      |
| `print_method_id` | number | 印刷方式ID（可选）                    |
| `name`            | string | 图层名称                              |
| `type`            | string | 图层类型：image/text/shape/background |
| `layer_data`      | object | 图层数据对象                          |
| `sort_order`      | number | 排序顺序                              |
| `status`          | number | 状态：1-启用 2-禁用                   |
| `created_at`      | string | 创建时间 (ISO 8601 格式)              |
| `updated_at`      | string | 更新时间 (ISO 8601 格式)              |

### 图层数据对象字段 (layer_data)

| 字段名       | 类型   | 说明         |
| ------------ | ------ | ------------ |
| `content`    | object | 图层内容配置 |
| `controls`   | object | 图层控制属性 |
| `position`   | object | 图层位置信息 |
| `dimensions` | object | 图层尺寸数据 |

### 图层内容对象字段 (content)

| 字段名            | 类型   | 说明           |
| ----------------- | ------ | -------------- |
| `opacity`         | number | 透明度 (0-100) |
| `backgroundColor` | string | 背景颜色       |
| `text`            | string | 文本内容       |
| `fontSize`        | number | 字体大小       |
| `fontFamily`      | string | 字体族         |
| `fontColor`       | string | 字体颜色       |
| `imageURL`        | string | 图片URL        |

### 图层控制对象字段 (controls)

| 字段名       | 类型    | 说明     |
| ------------ | ------- | -------- |
| `movable`    | boolean | 是否可移动 |
| `scalable`   | boolean | 是否可缩放 |
| `deletable`  | boolean | 是否可删除 |
| `rotatable`  | boolean | 是否可旋转 |
| `exportable` | boolean | 是否可导出 |
| `visibility` | boolean | 是否可见   |

### 图层位置对象字段 (position)

| 字段名        | 类型   | 说明       |
| ------------- | ------ | ---------- |
| `zIndex`      | object | Z轴索引    |
| `rotation`    | number | 旋转角度   |
| `anchorPoint` | string | 锚点位置   |
| `coordinates` | object | 坐标信息   |

### 图层尺寸对象字段 (dimensions)

| 字段名         | 类型   | 说明     |
| -------------- | ------ | -------- |
| `layerSize`    | object | 图层尺寸 |
| `contentArea`  | object | 内容区域 |
| `physicalSize` | object | 物理尺寸 |

## 响应示例

### 成功响应

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "custom_view_id": 1,
      "print_method_id": 1,
      "name": "Background Layer",
      "type": "background",
      "layer_data": {
        "content": {
          "opacity": 100,
          "backgroundColor": "#ffffff",
          "text": "",
          "fontSize": 16,
          "fontFamily": "Arial",
          "fontColor": "#000000",
          "imageURL": ""
        },
        "controls": {
          "movable": true,
          "scalable": true,
          "deletable": true,
          "rotatable": true,
          "exportable": true,
          "visibility": true
        },
        "position": {
          "zIndex": {
            "value": 1,
            "locked": false
          },
          "rotation": 0,
          "anchorPoint": "top-left",
          "coordinates": {
            "x": 0,
            "y": 0,
            "unit": "px"
          }
        },
        "dimensions": {
          "layerSize": {
            "width": 800,
            "height": 600
          },
          "contentArea": {
            "width": 800,
            "height": 600
          },
          "physicalSize": {
            "width": 20,
            "height": 15
          }
        }
      },
      "sort_order": 1,
      "status": 1,
      "created_at": "2025-06-17T08:18:48+08:00",
      "updated_at": "2025-06-17T08:18:48+08:00"
    }
  ]
}
```

## 错误处理

### 错误响应格式

```json
{
  "code": {error_code},
  "message": "{error_message}",
  "data": null
}
```

### 错误状态码

| 状态码 | 说明           | 可能原因                           |
| ------ | -------------- | ---------------------------------- |
| 200    | 成功           | 请求处理成功                       |
| 400    | 请求参数错误   | 缺少必要参数或参数格式不正确       |
| 401    | 未授权         | JWT Token 无效、过期或缺失         |
| 500    | 服务器内部错误 | 服务器处理请求时发生内部错误       |

## 在项目中的使用

### WordPress 后端调用

该接口在项目中通过 [`class-pw-admin-promowares-api.php`] 中的 [`get_enhanced_template_data`] 方法进行调用，作为三步骤数据获取流程的第三步：

```php
/**
 * Get enhanced template data with views and layers.
 * 
 * This method implements the multi-step data fetching logic:
 * 1. Get product template ID from custom-templates/product/{product_id}
 * 2. Get views data from custom-views/template/{template_id}
 * 3. Get layers data for each view from layers?custom_view_id={view_id}  // 此接口
 */
private function get_enhanced_template_data($product_id, $token)
{
    // ... 步骤1和2 ...
    
    // 步骤3: 为每个视图获取图层数据
    error_log("[PW Canvas] Step 3: Fetching layers for each view");
    foreach ($view_data_array as $index => $view) {
        $view_id = $view['id'];
        error_log("[PW Canvas] Fetching layers for view_id: {$view_id}");
        $layer_endpoint = "layers?custom_view_id={$view_id}";
        $layer_response = $this->call_promowares_api($layer_endpoint, $token);
        
        if (!is_wp_error($layer_response) && isset($layer_response['data'])) {
            $layer_data_array = $layer_response['data'];
            error_log("[PW Canvas] Found " . count($layer_data_array) . " layers for view_id: {$view_id}");
            
            // 处理图层数据
            if (!empty($layer_data_array)) {
                $final_data['views'][$index]['layers'] = array();
                $final_data['views'][$index]['data']['layer_config']['layers'] = array();
                
                foreach ($layer_data_array as $layer) {
                    $layer_item = $layer;
                    
                    // 同时添加到layers数组和data结构中
                    $final_data['views'][$index]['layers'][] = $layer_item;
                    $final_data['views'][$index]['data']['layer_config']['layers'][] = $layer_item;
                }
            }
        } else {
            if (is_wp_error($layer_response)) {
                error_log("[PW Canvas] Error fetching layers for view_id {$view_id}: " . $layer_response->get_error_message());
            } else {
                error_log("[PW Canvas] No layer data found for view_id: {$view_id}");
            }
        }
    }
}
```
### 前端状态管理中的使用

在 [`design/stores/index.js`] 中，图层数据用于状态管理：

```javascript
// 按视图管理图层的方法
setViewLayers(viewId, layers) { 
    this.viewLayers[viewId] = layers;
    // 如果是当前激活视图，同时更新全局layers
    if (viewId === this.activeViewId) {
        this.layers = layers;
    }
},

// 获取当前视图的图层
getViewLayers(viewId) {
    return this.viewLayers[viewId] || [];
}
```

### 图层面板组件中的使用

在 [`design/components/layers.js`] 中，图层数据用于构建图层面板UI：

```javascript
// 监听图层刷新事件，同步API数据到图层面板
document.addEventListener('layersRefreshed', (event) => {
    const { viewId, layers } = event.detail;
    if (viewId === store.activeViewId) {
        // 更新当前视图的图层显示
        console.log('Synced layers from API:', layers);
    }
});
```

### 图层渲染和分类

项目中根据图层名称进行特殊处理：

1. **Background Layer**: 用于获取画布默认尺寸
2. **Base Layer**: 渲染到 `colorLayer` 画布
3. **Overlay Layer**: 渲染到 `shadowLayer` 画布  
4. **4-Grid Flow**: 用于四格图布局
5. **文本图层**: 渲染为 Fabric.Text 对象
6. **图像图层**: 渲染为 Fabric.Image 对象

## 数据处理特性

1. **按zIndex排序**: 确保图层正确的堆叠顺序
2. **多画布支持**: 支持将不同图层渲染到不同的画布
3. **图层状态同步**: 自动同步API数据到前端状态管理
4. **缓存机制**: 图层数据会被缓存以提高性能
5. **错误处理**: 完善的错误处理和日志记录

## 注意事项

1. **认证要求**: 所有请求必须包含有效的JWT Token
2. **参数要求**: 至少需要提供 `custom_view_id` 或 `print_method_id` 中的一个
3. **状态过滤**: 只返回状态为启用(status=1)的图层
4. **排序规则**: 按 `sort_order` 升序排列，在前端按 `zIndex` 重新排序
5. **数据关联**: 该接口通常在获取视图数据后调用，依赖于前两步API的返回结果
6. **时间格式**: 时间字段使用 ISO 8601 格式

## API 版本信息

- **当前版本**: v1
- **API Base URL**: https://dev.promowares.com/api/v1/
- **支持的HTTP方法**: GET
- **响应格式**: JSON