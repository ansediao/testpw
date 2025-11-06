# 产品页面 Stores 概述

本目录记录产品页（WooCommerce/变体/下单流程相关）使用的 Pinia Store，负责产品数据、数量与折扣、样品/空白商品选项、预计发货时间与加入购物车操作等。

- 页面源码根：`public/js/product/`
- 相关 Store：
  - `useProductStore`（ID: `product`，路径：`public/js/product/stores/productStore.js`）
- 全局访问器：`window.useProductStore()`

注意：加入购物车通过 WordPress Admin AJAX (`add_customized_product_to_cart`) 完成；产品数据优先使用页面注入的 `window.pwProductData`，否则回退调用 `productDataAPI.fetchCurrentProductData()`。