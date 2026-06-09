/**
 * 产品聚合接口响应映射器
 * 负责把原始 API 数据转换为产品页 store 可消费的标准结构。
 */
(function () {
    function mapProductResponse(apiData) {
        const productApiData = apiData && apiData.product && apiData.product.data
            ? apiData.product.data
            : {};
        const wooData = apiData && apiData.has_woocommerce_product && apiData.woocommerce
            ? apiData.woocommerce
            : null;

        const mappedProduct = wooData
            ? {
                id: wooData.id,
                name: wooData.name,
                price: parseFloat(wooData.price) || 0,
                price_html: wooData.price_html,
                description: wooData.description || '',
                sku: wooData.sku || '',
                stock_status: wooData.stock_status,
                in_stock: wooData.in_stock,
                permalink: wooData.permalink,
                apiData: apiData
            }
            : null;

        const moqSettings = {};
        if (productApiData.sell_in_batch !== undefined) {
            moqSettings.sell_in_batch = productApiData.sell_in_batch;
        }
        if (productApiData.sell_in_batch_info) {
            if (productApiData.sell_in_batch_info.batch_quantity !== undefined) {
                moqSettings.batch_quantity = productApiData.sell_in_batch_info.batch_quantity;
            }
            if (productApiData.sell_in_batch_info.moq_quantity !== undefined) {
                moqSettings.minimum_order_quantity = productApiData.sell_in_batch_info.moq_quantity;
            }
        }
        if (productApiData.moq_setting) {
            Object.assign(moqSettings, productApiData.moq_setting);
        }

        const accessories = Array.isArray(productApiData.accessories)
            ? productApiData.accessories.map((accessory) => ({
                id: accessory.id,
                testname: accessory.testname || accessory.name || 'Unknown Accessory',
                product_image: accessory.product_image || accessory.image || '',
                price: parseFloat(accessory.price) || 0
            }))
            : [];

        return {
            product: mappedProduct,
            moqSettings,
            quantityDiscounts: Array.isArray(productApiData.quantity_discount) ? productApiData.quantity_discount : [],
            quantityDiscountEnabled: productApiData.quantityDiscountEnabled,
            colorSampleService: productApiData.colorSampleService,
            rtsDate: productApiData.rts_date,
            shippingInfo: productApiData.shipping_info || {},
            buySampleChecked: productApiData.buySampleChecked,
            blankProductChecked: productApiData.blankProductChecked,
            blankItem: productApiData.blank_item,
            enableCustomColor: productApiData.enable_custom_color,
            enableGradientColor: productApiData.enable_gradient_color,
            accessories,
            variants: apiData && apiData.has_variants && apiData.variants && Array.isArray(apiData.variants.data)
                ? apiData.variants.data
                : []
        };
    }

    window.pwcaProductResponseMapper = {
        mapProductResponse
    };
})();
