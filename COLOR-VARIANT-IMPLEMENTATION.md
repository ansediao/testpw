# 颜色变体 API 集成实现

## 功能概述

本实现为 PW Canvas 插件添加了两个主要功能：

1. **颜色选择器** - 使用 Vue 3 + Pinia 的交互式颜色选择组件
2. **颜色变体数据显示** - 在 `#pw-custom-templates-container` 下方显示 API 数据

## 实现特性

### 1. 颜色选择器 (优先级 10)

- **位置**: 产品页面购物车按钮附近
- **技术栈**: Vue 3 + Pinia + Axios
- **功能**:
  - 显示默认颜色选项 (黑、红、蓝、白)
  - 如果 API 有数据，则显示 API 返回的颜色变体
  - 支持颜色选择和产品颜色更新
  - 响应式设计，支持悬停和选中状态

### 2. 颜色变体数据显示 (优先级 1000)

- **位置**: 在自定义模板容器之后显示
- **样式**: 与自定义模板容器保持一致的折叠面板设计
- **功能**:
  - 显示完整的 API 响应 JSON 数据
  - 支持折叠/展开功能
  - 加载状态指示器
  - 错误处理和显示

## API 集成

### 端点信息
- **URL**: `https://dev.promowares.com/api/v1/plugin/variant_product/{pw_id}`
- **方法**: GET
- **认证**: Bearer Token (从 WordPress 选项获取)

### 数据格式
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "product_id": 1,
      "variant_name": "blue",
      "variant_color": "#479DFD",
      "variant_image": "string",
      "price": 90,
      "anchor_price": 50,
      "sku": "SK-1300",
      "accessories": [...],
      ...
    }
  ]
}
```

## 技术实现

### Pinia Store 结构

#### 颜色选择器 Store
```javascript
const useColorVariantStore = defineStore('colorVariant', {
  state: () => ({
    variants: [],
    loading: false,
    error: null,
    selectedVariant: null,
    defaultColors: [...]
  }),
  getters: {
    displayColors: (state) => state.variants.length > 0 ? state.variants : state.defaultColors
  },
  actions: {
    async fetchVariants(pwId),
    selectVariant(variant),
    generateColorFilter(hexColor)
  }
});
```

#### 数据显示 Store
```javascript
const useColorVariantDisplayStore = defineStore('colorVariantDisplay', {
  state: () => ({
    variants: [],
    loading: false,
    error: null,
    rawApiData: null
  }),
  actions: {
    async fetchVariants(pwId)
  }
});
```

### Vue 组件模板

#### 颜色选择器模板
```html
<div v-for="variant in store.displayColors" 
     :key="variant.id || variant.variant_name"
     class="color-box" 
     :style="{ backgroundColor: variant.variant_color }"
     @click="handleColorClick(variant)">
</div>
```

#### 数据显示模板
```html
<div v-if="store.error" class="pw-api-error">
  <strong>API 错误:</strong> {{ store.error }}
</div>
<div v-else-if="store.rawApiData">
  <pre>{{ JSON.stringify(store.rawApiData, null, 2) }}</pre>
</div>
```

## 文件修改

### 主要修改文件
- `public/modules/class-pw-product-customization.php`
  - 添加了 `add_color_variant_data_display()` 方法
  - 修改了 `add_color_selection_after_cart()` 方法以使用 Vue + Pinia
  - 更新了构造函数以注册新的钩子

### 依赖文件
- `public/modules/class-pw-cdn-loader.php` - CDN 脚本加载器
- `public/class-pw-admin-public.php` - 模块初始化

## 测试文件

创建了 `test-color-variant-api.php` 用于独立测试功能：
- 模拟 WordPress 环境
- 测试 API 调用
- 验证 Vue 组件渲染
- 检查错误处理

## 使用方法

### 1. 确保依赖已加载
- CDN 加载器模块必须正确初始化
- 产品必须设置 `pw_isSyncProduct = '1'`
- 产品必须有有效的 `pw_id` 元数据

### 2. API 配置
- 在 WordPress 管理后台设置 `pw_api_token`
- 确保 API 端点可访问

### 3. 样式自定义
- 颜色框样式可通过 CSS 自定义
- 折叠面板样式与现有模板保持一致

## 错误处理

### 常见错误情况
1. **pw_id 未找到** - 产品元数据缺失
2. **API 认证失败** - Token 无效或过期
3. **网络错误** - API 端点不可访问
4. **数据格式错误** - API 返回格式不符合预期

### 错误显示
- 颜色选择器：显示默认颜色选项
- 数据显示：显示红色错误消息框

## 性能优化

1. **条件加载** - 仅在同步产品页面加载
2. **防重复加载** - CDN 脚本防重复机制
3. **异步加载** - API 调用不阻塞页面渲染
4. **错误回退** - API 失败时使用默认数据

## 扩展建议

1. **缓存机制** - 添加 API 响应缓存
2. **本地化** - 支持多语言界面
3. **动画效果** - 添加颜色切换动画
4. **批量操作** - 支持多个变体同时选择