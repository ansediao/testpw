/**
 * 产品页加购提交流程服务
 */
(function () {
    async function checkCartBlankState(isBlankProduct) {
        const precheckForm = new FormData();
        precheckForm.append('action', 'pw_cart_blank_state');
        precheckForm.append('security', window.pwcaAjax?.nonce || '');
        const precheckResp = await fetch(window.pwcaAjax?.ajaxurl || '/wp-admin/admin-ajax.php', {
            method: 'POST',
            body: precheckForm
        });
        const precheckResult = await precheckResp.json();

        if (!(precheckResult && precheckResult.success && precheckResult.data)) {
            return;
        }

        const cartState = precheckResult.data;
        if (isBlankProduct && cartState.non_blank_count > 0) {
            throw new Error('The cart contains customized products; cannot add this item');
        }

        if (!isBlankProduct && cartState.blank_count > 0) {
            throw new Error('The cart already contains blank items; cannot add this item');
        }
    }

    function buildAddToCartFormData(snapshot, canvasPayload) {
        const formData = new FormData();

        formData.append('action', 'add_customized_product_to_cart');
        formData.append('product_id', snapshot.productId);
        formData.append('quantity', snapshot.quantity);
        formData.append('custom_image', canvasPayload.firstImageDataUrl);

        try {
            formData.append('pw_view_images', JSON.stringify(canvasPayload.viewImagesPayload || []));
        } catch (error) {
            formData.append('pw_view_images', '[]');
        }

        formData.append('color_name', snapshot.colorInfo.color_name);
        formData.append('color_value', snapshot.colorInfo.color_value);
        formData.append('variant_id', snapshot.colorInfo.variant_id || '');
        formData.append('color', snapshot.colorInfo.color_value);
        if (snapshot.variant && snapshot.variant.isCustom && snapshot.colorInfo.color_value) {
            formData.append('custom_color', snapshot.colorInfo.color_value);
        }

        formData.append('security', window.pwcaAjax?.nonce || '');
        formData.append('pw_min_order_quantity', String(snapshot.minQuantity));
        formData.append('pw_batch_quantity', String(snapshot.stepQuantity));
        formData.append('pw_sell_in_batch', snapshot.sellInBatch ? '1' : '0');
        formData.append('pw_is_sample', snapshot.isSample ? '1' : '0');
        formData.append('pw_is_blank', snapshot.isBlank ? '1' : '0');
        formData.append('added_from', 'product');
        formData.append('pw_discount_enabled', snapshot.discountEnabled ? '1' : '0');
        formData.append('pw_current_discount', String(snapshot.currentDiscount || 0));
        formData.append('pw_discount_text', snapshot.discountText || '');

        try {
            formData.append('pw_quantity_discounts', JSON.stringify(snapshot.quantityDiscounts || []));
        } catch (error) {
            formData.append('pw_quantity_discounts', '[]');
        }

        if (snapshot.isBlank && Array.isArray(snapshot.selectedAccessoriesNames) && snapshot.selectedAccessoriesNames.length > 0) {
            try {
                formData.append('pw_accessories_names', JSON.stringify(snapshot.selectedAccessoriesNames));
            } catch (error) {
                formData.append('pw_accessories_names', snapshot.selectedAccessoriesNames.join(','));
            }
        }

        return formData;
    }

    async function submitAddToCart(formData) {
        const response = await fetch(window.pwcaAjax?.ajaxurl || '/wp-admin/admin-ajax.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.data || 'Failed to add to cart');
        }

        return result;
    }

    function notifyAddToCartSuccess(quantity) {
        if (typeof showSuccessMessage === 'function') {
            showSuccessMessage(`Successfully added ${quantity} item(s) to the cart!`);
        }

        if (typeof jQuery !== 'undefined' && jQuery(document.body).trigger) {
            jQuery(document.body).trigger('added_to_cart');
        }
    }

    function notifyAddToCartError(message) {
        if (typeof showErrorMessage === 'function') {
            showErrorMessage(message || 'An error occurred while adding to cart');
        }
    }

    window.pwcaProductCartSubmitService = {
        checkCartBlankState,
        buildAddToCartFormData,
        submitAddToCart,
        notifyAddToCartSuccess,
        notifyAddToCartError
    };
})();
