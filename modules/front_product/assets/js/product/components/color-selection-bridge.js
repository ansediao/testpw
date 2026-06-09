/**
 * 产品页颜色选择副作用桥接层
 * 统一处理 store、产品图、localStorage 与自定义事件。
 */
(function () {
    function persistSelectedColor(colorValue) {
        if (!colorValue || !window.pwcaProductConfig || !window.pwcaProductConfig.productId) {
            return;
        }

        try {
            const storageKey = `pw_product_color_${window.pwcaProductConfig.productId}`;
            localStorage.setItem(storageKey, colorValue);
        } catch (error) {
            console.warn('Failed to save color to localStorage:', error);
        }
    }

    function switchProductImageCanvas(colorValue) {
        if (colorValue && window.pwcaProductImageCanvas) {
            window.pwcaProductImageCanvas.switchToCanvas(colorValue);
        }
    }

    function dispatchVariantSelected(variant) {
        document.dispatchEvent(new CustomEvent('pw-color-variant-selected', {
            detail: { variant }
        }));
    }

    function buildCustomVariant(colorValue, type) {
        return {
            id: `custom-${Date.now()}`,
            variant_color: colorValue,
            type,
            isCustom: true
        };
    }

    function applyVariantSelection(variant, store) {
        if (!variant) {
            return null;
        }

        if (store && typeof store.setSelectedVariant === 'function') {
            store.setSelectedVariant(variant);
        }

        switchProductImageCanvas(variant.variant_color || variant.color || '');
        persistSelectedColor(variant.variant_color || variant.color || '');
        dispatchVariantSelected(variant);

        return variant;
    }

    function applyCustomColorSelection(colorValue, type, store) {
        const customVariant = buildCustomVariant(colorValue, type);
        return applyVariantSelection(customVariant, store);
    }

    function resetSelection(store) {
        if (!store) {
            return;
        }

        if (typeof store.resetCustomColorState === 'function') {
            store.resetCustomColorState();
            return;
        }

        if (typeof store.setSelectedVariant === 'function') {
            store.setSelectedVariant(null);
        }
        if (typeof store.setGradientColorApplied === 'function') {
            store.setGradientColorApplied(false);
        }
    }

    window.pwcaProductColorSelectionBridge = {
        applyVariantSelection,
        applyCustomColorSelection,
        resetSelection
    };
})();
