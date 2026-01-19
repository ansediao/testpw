# 定制视图管理接口文档

## 接口概述

该接口用于根据产品定制模板ID获取所有关联的定制视图信息，是产品多视图定制功能的核心接口。通过该接口可以获取包括主视图和次视图在内的所有视图配置数据。

**接口地址**: `GET /api/v1/custom-views/template/{template_id}`

**BASE URL**: `https://dev.promowares.com`

**完整URL**: `https://dev.promowares.com/api/v1/custom-views/template/{template_id}`

## 请求参数

### 路径参数

| 参数名      | 类型 | 必需 | 说明                    |
| ----------- | ---- | ---- | ----------------------- |
| template_id | int  | 是   | 产品定制模板的唯一标识ID |

### 请求头

| 参数名        | 类型   | 必需 | 说明                     |
| ------------- | ------ | ---- | ------------------------ |
| Authorization | string | 是   | JWT认证令牌，格式：Bearer {JWT_TOKEN} |
| Accept        | string | 否   | 接受的内容类型，默认：application/json |

## 请求示例

```bash
curl -X 'GET' \
  'https://dev.promowares.com/api/v1/custom-views/template/1' \
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
| `data`    | array  | 定制视图数据对象数组        |

### 定制视图对象字段 (data数组中的对象)

| 字段名                         | 类型    | 说明                           |
| ------------------------------ | ------- | ------------------------------ |
| `id`                           | number  | 定制视图 ID                    |
| `product_custom_template_id`   | number  | 关联的产品定制模板 ID          |
| `view_type`                    | string  | 视图类型：main/sub             |
| `view_flow`                    | string  | 定制视图流程                   |
| `core_layer_type`              | string  | 核心图层类型                   |
| `mockup_base`                  | string  | 效果图主体选项                 |
| `view_name`                    | string  | 视图名称                       |
| `status`                       | string  | 状态：draft/published          |
| `printing_method_list_id`      | array   | 印刷方式ID列表                 |
| `selected_modules`             | array   | 选择的模块                     |
| `assign_design_folders`        | array   | 关联设计文件夹                 |
| `product_specific_design_only` | boolean | 是否仅产品特定设计             |
| `inspiring_photos_url`         | string  | 定制示例图链接                 |
| `view_color_list`              | array   | 视图颜色列表                   |
| `single_printing_method_only`  | boolean | 限制使用一种印刷方式选项       |
| `view_color_option`            | string  | 颜色选项（次视图特有）         |
| `color_combination_mode`       | string  | 颜色组合模式（次视图特有）     |
| `enable_universal_color`       | boolean | 是否启用通用颜色（次视图特有） |
| `gradient_color_type`          | string  | 渐变色类型（次视图特有）       |
| `gradient_color_list`          | array   | 渐变色颜色列表（次视图特有）   |
| `created_at`                   | string  | 创建时间 (ISO 8601 格式)       |
| `updated_at`                   | string  | 更新时间 (ISO 8601 格式)       |

## 响应示例

### 成功响应（找到视图）

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "product_custom_template_id": 1,
      "view_type": "main",
      "view_flow": "4-Grid Flow",
      "core_layer_type": "Physical Image",
      "mockup_base": "Auto",
      "view_name": "Front View",
      "status": "draft",
      "printing_method_list_id": [1, 2, 3],
      "selected_modules": ["TEXT", "UPLOAD"],
      "assign_design_folders": ["product", "specific"],
      "product_specific_design_only": false,
      "inspiring_photos_url": "http://example.com/photo.jpg",
      "view_color_list": ["#FF0000", "#00FF00", "#0000FF"],
      "single_printing_method_only": false,
      "view_color_option": "Use the Same Color as Main View",
      "color_combination_mode": "Free Combination",
      "enable_universal_color": true,
      "gradient_color_type": "ALL color",
      "gradient_color_list": ["#FF0000", "#00FF00"],
      "created_at": "2025-06-17T08:18:48+08:00",
      "updated_at": "2025-06-17T08:18:48+08:00"
    }
  ]
}
```

### 成功响应（未找到视图）

```json
{
  "code": 200,
  "message": "未找到该模板下的定制视图",
  "data": []
}
```

## 字段说明

### 视图流程类型 (view_flow)

| 值                    | 说明       |
| --------------------- | ---------- |
| `4-Grid Flow`         | 四格图     |
| `4-Grid Conical Flow` | 扇形四格图 |
| `2-Grid Flow`         | 二格图     |
| `Flat Flow`           | 平面图     |

### 核心图层类型 (core_layer_type)

| 值                                    | 说明              |
| ------------------------------------- | ----------------- |
| `Physical Image`                      | 实物照片          |
| `Base Layer+Overlay LayerCombination` | 基础层+覆盖层组合 |

### 视图状态 (status)

| 值          | 说明   |
| ----------- | ------ |
| `draft`     | 草稿   |
| `published` | 已发布 |

### 颜色组合模式 (color_combination_mode)

| 值                  | 说明     |
| ------------------- | -------- |
| `Free Combination`  | 自由组合 |
| `Fixed Combination` | 固定组合 |
| `Same Color`        | 相同颜色 |

### 渐变色类型 (gradient_color_type)

| 值              | 说明     |
| --------------- | -------- |
| `ALL color`     | 所有颜色 |
| `partial color` | 部分颜色 |
| `default color` | 默认颜色 |

### 设计文件夹类型 (assign_design_folders)

| 值         | 说明 |
| ---------- | ---- |
| `product`  | 产品 |
| `specific` | 特定 |
| `design`   | 设计 |

### 选择的模块 (selected_modules)

| 值             | 说明   |
| -------------- | ------ |
| `TEXT`         | 文本   |
| `UPLOAD`       | 上传   |
| `DesignLibary` | 设计库 |

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

| 状态码 | 说明           | 可能原因                         |
| ------ | -------------- | -------------------------------- |
| 200    | 成功           | 请求处理成功                     |
| 400    | 请求参数错误   | template_id 参数格式不正确或缺失 |
| 401    | 未授权         | JWT Token 无效、过期或缺失       |
| 500    | 服务器内部错误 | 服务器处理请求时发生内部错误     |

## 在项目中的使用

### WordPress 后端调用

该接口在项目中通过 [`class-pw-admin-promowares-api.php`] 中的 [`get_enhanced_template_data`] 方法进行调用，作为多步骤数据获取流程的第二步：

```php
/**
 * Get enhanced template data with views and layers.
 * 
 * This method implements the multi-step data fetching logic:
 * 1. Get product template ID from custom-templates/product/{product_id}
 * 2. Get views data from custom-views/template/{template_id}  // 此接口
 * 3. Get layers data for each view from layers?custom_view_id={view_id}
 */
private function get_enhanced_template_data($product_id, $token)
{
    // ... 步骤1: 获取产品模板 ...
    
    // 步骤2: 获取定制视图数据
    error_log("[PW Canvas] Step 2: Fetching custom views for template_id: {$product_template_id}");
    $views_response = $this->call_promowares_api("custom-views/template/{$product_template_id}", $token);
    
    if (is_wp_error($views_response)) {
        error_log("[PW Canvas] Error fetching custom views: " . $views_response->get_error_message());
        $final_data['views'] = array();
        $final_data['views_error'] = $views_response->get_error_message();
        return $final_data;
    }
    
    $view_data_array = isset($views_response['data']) ? $views_response['data'] : array();
    error_log("[PW Canvas] Found " . count($view_data_array) . " custom views");
    
    // ... 处理视图数据 ...
}
```

### 数据处理和转换

接口返回的原始视图数据会被处理并转换为项目内部使用的格式：

```php
// 处理视图数据，为每个视图添加标准化字段
foreach ($view_data_array as $index => $view) {
    $final_data['views'][] = array(
        'id' => $index === 0 ? 'main_view' : 'sub_view_' . $index,
        'view_id' => $view['id'],
        'view_type' => $view['view_type'], // 视图类型：main/sub  
        'view_flow' => $view['view_flow'], // 视图流程类型
        'view_name' => $view['view_name'],
        'printing_method_list_id' => isset($view['printing_method_list_id']) ? $view['printing_method_list_id'] : null,
        'layers' => array(), // 初始化空图层数组
        'data' => array(
            'layer_config' => array(
                'layers' => array()
            )
        )
    );
}
```

### 前端 Pinia Store 中的使用

视图数据通过 REST API 聚合后传递给前端，在 [`design/stores/index.js`] 中进行处理：

```javascript
// 从产品数据中提取视图信息
setViewsFromTemplateData(productData) {
    const views = [];
    
    if (productData && productData.templates && productData.templates.data && productData.templates.data.custom_view) {
        const customView = productData.templates.data.custom_view;
        
        // 添加主视图
        if (customView.main_custom_view) {
            views.push({
                id: 'main_view',
                name: customView.main_custom_view.view_name || 'Main View',
                data: customView.main_custom_view
            });
        }
        
        // 添加子视图
        if (Array.isArray(customView.sub_custom_view)) {
            customView.sub_custom_view.forEach((subView, index) => {
                views.push({
                    id: `sub_view_${index}`,
                    name: subView.view_name || `Sub View ${index + 1}`,
                    data: subView
                });
            });
        }
    }
    
    this.setViews(views);
    // 默认激活第一个视图
    if (views.length > 0) {
        this.setActiveViewId(views[0].id);
    }
}
```

### Canvas 渲染中的使用

在 [`canvas-api-renderer.js`] 中，视图数据用于识别不同的数据结构并提取图层配置：

```javascript
// 检查视图数据结构并提取图层配置
function extractLayerConfigFromTemplateData(templateData) {
    let layerConfig = null;
    
    // 尝试从不同的数据结构中获取layer_config
    if (templateData.layer_config) {
        layerConfig = templateData;
    } else if (templateData.custom_view && templateData.custom_view.main_custom_view && templateData.custom_view.main_custom_view.layer_config) {
        layerConfig = templateData.custom_view.main_custom_view;
    } else if (templateData.main_custom_view && templateData.main_custom_view.layer_config) {
        layerConfig = templateData.main_custom_view;
    }
    
    return layerConfig;
}
```

### 多视图系统支持

该接口支持多视图系统，返回的数据包含主视图（main）和多个次视图（sub），项目中据此构建多视图画布系统。

## 技术特性

1. **多视图支持**: 一个模板可以包含多个视图，支持主视图和次视图
2. **丰富的配置**: 包含印刷方式、颜色配置、模块选择等详细配置信息
3. **灵活的数据结构**: 支持复杂的JSON字段，如数组和对象
4. **状态管理**: 支持草稿和发布状态
5. **颜色系统**: 完整的颜色管理，包括普通颜色和渐变色

## 注意事项

1. **认证要求**: 所有请求必须包含有效的JWT Token
2. **参数验证**: `template_id` 必须是有效的数字格式
3. **数据格式**: 时间字段使用 ISO 8601 格式（如：2025-06-17T08:18:48+08:00）
4. **空数据处理**: 未找到视图时返回空数组而非错误
5. **数据关联**: 该接口数据通常与图层数据（layers API）配合使用
6. **缓存机制**: 项目中实现了数据缓存，减少重复API调用

## API 版本信息

- **当前版本**: v1
- **API Base URL**: https://dev.promowares.com/api/v1/
- **支持的HTTP方法**: GET
- **响应格式**: JSON