/**
 * 产品数据 API 模块
 * 使用 fetch 从 REST API 获取数据，供 Vue 使用
 */
window.ProductDataAPI = {
    /**
     * 获取产品数据
     * @param {string} pwId - 产品的 pw_id
     * @returns {Promise} 返回产品数据的 Promise
     */
    async fetchProductData(pwId) {
        try {
            const config = window.pwProductConfig;

            const response = await fetch(`${config.restApiUrl}${pwId}`, {
                headers: {
                    'X-WP-Nonce': config.nonce
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            try {
                const headerValue = response.headers.get('x-pw-cache') || response.headers.get('X-PW-Cache');
                if (headerValue && String(headerValue).toUpperCase() === 'HIT') {
                    // eslint-disable-next-line no-console
                    console.info('[PW Product] 使用缓存的产品数据', { pwId });
                }
            } catch (e) {
            }

            // 后台 price 同步：在成功获取产品数据后，基于 products/{id}/updated-at 异步检查并同步价格
            try {
                if (typeof this.syncProductPriceIfNeeded === 'function') {
                    this.syncProductPriceIfNeeded(pwId).catch(() => {
                        // 同步失败在内部已做用户提示，这里静默处理
                    });
                }
            } catch (e) {
            }

            return data;
        } catch (error) {
            if (error.message && error.message.includes('HTTP error')) {
                throw new Error(`API Error: ${error.message}`);
            } else {
                throw new Error('网络请求失败，请检查网络连接');
            }
        }
    },

    /**
     * 检查 products/{product_id}/updated-at，并在价格发生变化时同步 WooCommerce 价格。
     *
     * - 当 updated-at 接口不可用时，前端展示友好错误提示；
     * - 当检测到价格已在后台同步更新时，刷新当前页面以让新价格生效。
     *
     * @param {string|number} pwId
     * @returns {Promise<void>}
     */
    async syncProductPriceIfNeeded(pwId) {
        const config = window.pwProductConfig;
        if (!config || !config.restApiUrl) {
            return;
        }

        try {
            // 从 /pw/v1/product-data/ 派生出 /pw-canvas/v1/product-sync-status/
            const baseUrl = config.restApiUrl.replace('/pw/v1/product-data/', '/pw-canvas/v1/product-sync-status/');
            const syncUrl = `${baseUrl}${pwId}`;

            const response = await fetch(syncUrl, {
                method: 'GET',
                headers: {
                    'X-WP-Nonce': config.nonce
                },
                credentials: 'same-origin'
            });

            let payload;

            if (!response.ok) {
                try {
                    payload = await response.json();
                } catch (e) {
                    payload = null;
                }

                const message = (payload && (payload.error || payload.message))
                    ? String(payload.error || payload.message)
                    : `无法检查产品最新价格（HTTP ${response.status}）`;

                if (typeof window.showErrorMessage === 'function') {
                    window.showErrorMessage(message, 7000);
                } else {
                    window.alert(message);
                }
                return;
            }

            payload = await response.json();
            if (!payload || payload.success === false) {
                const message = (payload && (payload.error || payload.message))
                    ? String(payload.error || payload.message)
                    : '无法检查产品最新价格，请稍后重试。';

                if (typeof window.showErrorMessage === 'function') {
                    window.showErrorMessage(message, 7000);
                } else {
                    window.alert(message);
                }
                return;
            }

            if (payload.price_changed && payload.price_synced) {
                const notice = '该产品的价格已在后台更新，页面将刷新以显示最新价格。';
                if (typeof window.showInfoMessage === 'function') {
                    window.showInfoMessage(notice, 4000);
                } else {
                    window.alert(notice);
                }

                window.setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        } catch (error) {
            const fallbackMessage = '无法检查产品最新价格，请检查网络连接或稍后重试。';
            if (typeof window.showErrorMessage === 'function') {
                window.showErrorMessage(fallbackMessage, 7000);
            } else {
                window.alert(fallbackMessage);
            }
        }
    },

    /**
     * 获取当前产品数据
     * @returns {Promise} 返回当前产品数据的 Promise
     */
    async fetchCurrentProductData() {
        const config = window.pwProductConfig;
        if (!config || !config.pwId) {
            throw new Error('未找到当前产品的 pw_id');
        }

        return this.fetchProductData(config.pwId);
    },

    /**
     * 获取多个产品数据（批量获取）
     * @param {Array} pwIds - pw_id 数组
     * @returns {Promise} 返回产品数据数组的 Promise
     */
    async fetchMultipleProductData(pwIds) {
        try {
            const promises = pwIds.map(pwId => this.fetchProductData(pwId));
            const results = await Promise.allSettled(promises);

            return results.map((result, index) => ({
                pwId: pwIds[index],
                success: result.status === 'fulfilled',
                data: result.status === 'fulfilled' ? result.value : null,
                error: result.status === 'rejected' ? result.reason.message : null
            }));
        } catch (error) {
            throw error;
        }
    },

    /**
     * 检查 API 连接状态
     * @returns {Promise<boolean>} 返回连接状态
     */
    async checkApiConnection() {
        try {
            const config = window.pwProductConfig;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(config.restApiUrl.replace('/product-data/', '/health'), {
                signal: controller.signal,
                headers: {
                    'X-WP-Nonce': config.nonce
                }
            });

            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            return false;
        }
    },

    /**
     * 获取配置信息
     * @returns {Object} 返回当前配置
     */
    getConfig() {
        return window.pwProductConfig || {};
    }
};

// 为 Vue 组件提供全局访问
if (typeof window !== 'undefined') {
    window.productDataAPI = window.ProductDataAPI;

    // ProductDataAPI 已就绪
}
