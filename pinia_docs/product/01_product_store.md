# useProductStore（ID: product）

- 页面：产品页（`public/js/product/`）
- 模块路径：`public/js/product/stores/productStore.js`
- 全局访问器：`window.useProductStore()`
- 外部接口：
  - 数据：优先 `window.pwProductData`，否则 `window.productDataAPI.fetchCurrentProductData()`
  - 提交：`POST /wp-admin/admin-ajax.php?action=add_customized_product_to_cart`

## 概述
负责产品基础数据、变体与价格计算、数量与批量销售（MOQ）规则、数量折扣、样品/空白商品开关、预计发货日期计算，以及加入购物车的表单提交。

## State（核心字段）
- 基本：`productId`、`productData`、`loading`、`error`
- 变体：`selectedVariant`、`variants`
- 数量：`quantity`、`minQuantity`、`maxQuantity`、`stepQuantity`
- 选项：`selectedOptions`、`showDetails`、`activeTab`
- 折扣：`quantityDiscounts`、`currentDiscount`、`quantityDiscountEnabled`
- 样品/空白：`buySampleChecked`、`blankProductChecked`
- 价格：`accessoriesPrice`
- MOQ 设置：`moqSettings = { minimum_order_quantity, batch_quantity, sell_in_batch }`
- RTS 配置：`rts_date`、`rts_date_starts_from`、`rts_for_bulk_order`、`rts_for_sample_order`
- 其他：`gradientColorApplied`、`isDataFetched`、`fetchPromise`

## Getters（只做计算）
- 状态：`isLoading`、`hasError`
- 价格：`selectedVariantPrice`、`baseUnitPrice`、`discountedPrice`、`totalPrice`
- 数量：`correctedQuantity(input)`（按批次与最小值修正）、`isValidQuantity`
- 折扣：`hasQuantityDiscounts`、`getCurrentDiscount`（按数量区间选择最高梯度）、`getDiscountText`（如 `10% OFF`）
- 发货：`estimatedShipDate`（基于 `rts_date_starts_from + rts_for_*_order`）
- UI：`canAddToCart`、`hasVariants`、`showAddToCartButton`、`showCustomizeButton`、`showBuySampleCheckbox`、`showBlankProductCheckbox`

## Actions（变更与异步）
- 基本设定：
  - `setProductId(id)`、`setProductData(data)`、`setLoading(bool)`、`setError(err)`
- 数量与步进：
  - `updateQuantity(qty)`（含批次修正）、`setQuantityDirect(qty)`（直接设置，输入框专用）
  - `getNextValidQuantity(current)`、`getPreviousValidQuantity(current)`（按批次增减）
- 选项与视图：
  - `setSelectedOption(key, value)`、`toggleDetails()`、`setActiveTab(tab)`
- 变体与折扣：
  - `setSelectedVariant(variant)`、`setVariants(vars)`
  - `setQuantityDiscountEnabled(enabled)`、`setQuantityDiscounts(discounts)`（排序并标准化）
- 样品/空白与价格：
  - `setBuySampleChecked(checked)`、`setBlankProductChecked(checked)`、`setAccessoriesPrice(price)`
- MOQ/RTS：
  - `setMoqSettings(settings)`（更新最小量与步进，并按需修正当前数量）
  - `setRtsDate(enabled)`、`setRtsDateStartsFrom(days)`、`setRtsForBulkOrder(days)`、`setRtsForSampleOrder(days)`
  - `setColorSampleService(enabled)`、`setQuantityDiscountEnabled(enabled)`
- 数据处理与获取：
  - `processProductData(apiData)`：Woo数据、MOQ、折扣、RTS、配件、变体等解析
  - `fetchProductData()`：优先 `window.pwProductData`，否则调用 `productDataAPI`；带 `isDataFetched`/`fetchPromise` 防抖
- 提交购物车：
  - `addToCart(customQuantity?)`：构造 `FormData` 提交至 Admin AJAX（支持变体颜色信息与安全 nonce）

## 控制台测试示例
- 初始化与获取数据：
  ```js
  const ps = window.useProductStore();
  ps.setProductId(12345); // 替换为真实产品ID
  await ps.fetchProductData();
  ps.productData; // 基础数据
  ps.variants;    // 变体列表
  ```
- 数量与折扣：
  ```js
  ps.updateQuantity(7);       // 批次修正
  ps.getCurrentDiscount;      // 当前折扣系数（0~1）
  ps.getDiscountText;         // "10% OFF" 样式文案
  ps.discountedPrice;         // 折后单价
  ps.totalPrice;              // 总价 = 折后单价 * 数量
  ```
- 发货与UI：
  ```js
  ps.estimatedShipDate;       // 预计发货日期
  ps.showAddToCartButton;     // 加购按钮是否显示
  ps.showCustomizeButton;     // 定制按钮是否显示
  ```
- 加入购物车（演示）：
  ```js
  await ps.addToCart();        // 使用当前数量
  await ps.addToCart(12);      // 指定数量
  ```

## 注意事项
- 数据优先从页面注入变量获取以提升性能，API 为后备。
- Admin AJAX 提交需携带 `nonce`（来自 `window.pwAjax?.nonce`）。
- Getter 只做计算；异步与状态修改统一放在 Actions。