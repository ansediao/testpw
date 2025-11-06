# syncPiniaToElement 工具

- 页面：通用工具（`public/js/utils/`）
- 模块路径：`public/js/utils/piniaSync.js`
- 全局访问器：`window.syncPiniaToElement(elementId, storeAccessor, valuePath)`

## 概述
将 Pinia Store 中的某个值（通过路径访问）与页面某个元素的文本内容进行响应式同步；自动等待 Vue/Pinia 与 Store 可用，支持错误重试与深度订阅。

## 参数
- `elementId`: 目标元素ID（`document.getElementById`）
- `storeAccessor`: 返回 Store 实例的函数（例如 `() => window.useProductStore()`）
- `valuePath`: 在 Store 中的路径字符串（如 `productData.name`、`quantity`、`moqSettings.minimum_order_quantity`）

## 行为
- 等待依赖：轮询等待 Vue/Pinia 与 `storeAccessor()` 可用
- 初始化：读取当前值并设置元素文本
- 订阅：通过 `store.$subscribe({ deep: true })` 监听变化并更新元素
- 错误重试：初始化失败时延迟重试

## 控制台测试示例
```js
// 将产品名称同步到页面元素 #product-name
window.syncPiniaToElement('product-name', window.useProductStore, 'productData.name');

// 将折后单价同步到 #unit-price
window.syncPiniaToElement('unit-price', window.useProductStore, 'discountedPrice');

// 将当前视图ID同步到 #active-view
window.syncPiniaToElement('active-view', window.useCanvasStore, 'activeViewId');
```

## 注意事项
- 仅同步文本内容（`textContent`），不做 HTML 解析或样式处理。
- 若元素不存在或依赖未加载，会在控制台输出错误并重试。
- 遵循用户偏好：不创建测试文件、不启动服务，仅在控制台执行。