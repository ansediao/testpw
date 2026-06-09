---
name: "pwca-product-meta-to-vue"
description: "将 WordPress 产品 post_meta 暴露给画布设计页 Vue/Pinia 前端的标准模式。当需要新增产品级别的 UI 开关字段并在前端响应式控制显隐时调用。"
---

# 产品 Meta → Vue/Pinia 前端绑定模式

## 用途

定义从 WordPress `post_meta` 读取产品级别配置 → 注入到画布页 Pinia Store → 响应式控制 DOM 的标准数据流。

## 何时调用

- 需要新增产品级别的 UI 开关（如 `blank_item`、`inquiry_button` 控制按钮/复选框显隐）
- 需要在画布设计页（`front_canvas`）根据产品 meta 控制前端行为
- 需要确保数据流绕过缓存，服务端渲染时即确定值

## 为什么不走聚合 API 的 `computed`

- `get_aggregated_product_data()` 的 `computed` 结果会被缓存到 `_pw_aggregated_data_cache`
- 缓存可能在代码更新后仍然返回旧值，导致 UI 不一致
- `data-*` 属性在服务端渲染时直接读取 `post_meta`，无缓存问题

## 数据流

```
WordPress post_meta (pw_xxx)
  ↓ get_post_meta($product_id, 'pw_xxx', true)
  ↓ PHP Router 读取并传入模板变量
  ↓ canvas-page.php 输出为 #app 上的 data-* 属性
  ↓ page-bootstrap.js 读取 dataset → 注入 store.productData.computed
  ↓ Vue watch 响应式监听 store getters → 控制 DOM 显示/隐藏
```

## 实施步骤

### 1. PHP Router：读取 post_meta

文件：`modules/front_canvas/includes/class-pwca-front-canvas-router.php`

在 `render_canvas_page()` 中，`$product_id` 获取之后读取 meta：

```php
$blank_item     = get_post_meta( $product_id, 'pw_blank_item', true );
$inquiry_button = get_post_meta( $product_id, 'pw_inquiry_button', true );
$show_sample    = ( $blank_item === '1' || $blank_item === 1 || $blank_item === true );
$show_inquiry   = ( $inquiry_button === '1' || $inquiry_button === 1 || $inquiry_button === true );
```

**注意**：WordPress `get_post_meta` 可能返回字符串 `'1'`、整数 `1` 或布尔 `true`，需要做兼容判断。

### 2. 模板：输出 data-* 属性

文件：`modules/front_canvas/views/canvas-page.php`

在 `#app` div 上追加：

```html
<div id="app"
     ...
     data-blank-item="<?php echo esc_attr( $show_sample ? '1' : '0' ); ?>"
     data-inquiry-button="<?php echo esc_attr( $show_inquiry ? '1' : '0' ); ?>"
>
```

命名规范：`data-{kebab-case}` → JS 中通过 `dataset.{camelCase}` 访问。

### 3. Store：添加 Getter

文件：`modules/front_canvas/assets/js/design/stores/index.js`

```js
// 在 getters 中添加
showSampleCheck() {
    const computed = this.productData && this.productData.computed;
    if (!computed) return false;
    return Boolean(computed.blank_item);
},
showInquiryBtn() {
    const computed = this.productData && this.productData.computed;
    if (!computed) return false;
    return Boolean(computed.inquiry_button);
},
```

**设计原则**：每个功能一个独立 getter，便于后续叠加其他控制条件（视图级别覆盖、店铺设置等），不污染其他 getter。

### 4. 启动任务：同步 data-* → Store → DOM

文件：`modules/front_canvas/assets/js/canvas/page-bootstrap.js`

```js
const pwcaStartupTaskSyncFooterVisibility = async (currentContext) => {
  const store = window.useCanvasStore && window.useCanvasStore();
  if (!store) return;

  // 从 #app data-* 读取（绕过缓存，最可靠）
  const appEl = document.getElementById('app');
  const blankItem = appEl?.dataset?.blankItem === '1';
  const inquiryBtn = appEl?.dataset?.inquiryButton === '1';

  // 同步到 store computed，确保 Pinia 值与服务端一致
  if (store.productData?.computed) {
    store.productData.computed.blank_item = blankItem;
    store.productData.computed.inquiry_button = inquiryBtn;
  }

  const { watch } = window.Vue || {};

  const syncVisibility = () => {
    const elSample = document.getElementById('pwca-sample-check');
    const elInquiry = document.getElementById('pwca-inquiry-btn');
    if (elSample) elSample.style.display = store.showSampleCheck ? '' : 'none';
    if (elInquiry) elInquiry.style.display = store.showInquiryBtn ? '' : 'none';
  };

  syncVisibility();  // 立即同步

  if (watch) {
    watch(
      () => [store.showSampleCheck, store.showInquiryBtn],
      () => syncVisibility()
    );
  }
};
```

然后将任务注册到 `buildStartupTasks` 中（在 `fetchProductData` 之后）：

```js
pwcaCreateStartupTask(context, 'syncFooterVisibility', pwcaStartupTaskSyncFooterVisibility),
```

### 5. 模板元素：添加 ID

文件：`modules/front_canvas/views/partials/canvas-operation-panel-footer.php`

```html
<div class="sample-check" id="pwca-sample-check">
    <input type="checkbox" id="sample">
    <label for="sample">Sample Order</label>
</div>
<button class="btn btn-custom" id="pwca-inquiry-btn">Inquiry</button>
```

每个需要控制的元素必须有 `id`，方便 `getElementById` 精准操作。

## 扩展指南

### 新增一个字段

假设要新增 `enable_custom_color` 控制某个面板显示：

1. **PHP Router**：读取 `get_post_meta($product_id, 'pw_enable_custom_color', true)`
2. **模板**：添加 `data-enable-custom-color="..."` 到 `#app`
3. **Store getter**：添加 `showCustomColorPanel()` getter
4. **同步函数**：读取 `dataset.enableCustomColor`，注入 `computed`，watch 同步
5. **元素**：确保目标元素有 `id`

### 叠加多个控制条件

在 getter 中叠加即可，`watch` 会自动追踪所有依赖：

```js
showSampleCheck() {
    // 1. 产品级别开关
    const computed = this.productData?.computed;
    if (!computed?.blank_item) return false;
    // 2. 将来可叠加：视图级别覆盖
    // const view = this.activeView;
    // if (view?.hideSampleOrder) return false;
    // 3. 店铺设置
    // if (this.storeCustomizationSettings?.disableSample) return false;
    return true;
},
```

## 文件索引

| 角色 | 文件路径 |
|------|---------|
| PHP Router | `modules/front_canvas/includes/class-pwca-front-canvas-router.php` |
| 页面模板 | `modules/front_canvas/views/canvas-page.php` |
| Footer 模板 | `modules/front_canvas/views/partials/canvas-operation-panel-footer.php` |
| Pinia Store | `modules/front_canvas/assets/js/design/stores/index.js` |
| 启动任务 | `modules/front_canvas/assets/js/canvas/page-bootstrap.js` |
| Post meta 存储 | `modules/integration_promowares/includes/class-pwca-integration-promowares.php` |

## 注意事项

- `watchEffect` 在 CDN Vue 3 构建中**可能不可用**，使用 `watch` 代替（项目中已验证可用）
- 不要在 `compute_business_logic()` 中依赖聚合 API 响应结构提取值，结构可能因 API 版本变化
- `data-*` 值是字符串，JS 中比较时用 `=== '1'`
- `get_post_meta` 返回值类型不确定，做 `=== '1' || === 1 || === true` 三重兼容
