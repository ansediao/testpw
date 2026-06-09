/**
 * 产品数据 API 模块
 * 使用 fetch 从 REST API 获取数据，供 Vue 使用
 */
window.pwcaProductDataAPI = {
    getResponseMeta(response, pwId) {
        const meta = {
            cacheHit: false,
            productUpdated: false,
            reloadGuardKey: `pw_product_reload_guard_${pwId}`
        };

        try {
            const headerValue = response.headers.get('x-pw-cache') || response.headers.get('X-PW-Cache');
            meta.cacheHit = !!(headerValue && String(headerValue).toUpperCase() === 'HIT');
            if (meta.cacheHit) {
                // eslint-disable-next-line no-console
                console.info('[PW Product] 使用缓存的产品数据', { pwId });
            }
        } catch (e) {
        }

        try {
            const updatedFlag = response.headers.get('x-pw-product-updated') || response.headers.get('X-PW-Product-Updated');
            meta.productUpdated = !!(updatedFlag && String(updatedFlag).toLowerCase() === 'true');
        } catch (e) {
        }

        return meta;
    },
    /**
     * 获取产品数据
     * @param {string} pwId - 产品的 pw_id
     * @returns {Promise} 返回产品数据的 Promise
     */
    async fetchProductData(pwId) {
        try {
            const config = window.pwcaProductConfig;

            const response = await fetch(`${config.restApiUrl}${pwId}`, {
                headers: {
                    'X-WP-Nonce': config.nonce
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const meta = this.getResponseMeta(response, pwId);

            return { data, meta };
        } catch (error) {
            if (error.message && error.message.includes('HTTP error')) {
                throw new Error(`API Error: ${error.message}`);
            }

            throw new Error('网络请求失败，请检查网络连接');
        }
    },

    /**
     * 获取当前产品数据
     * @returns {Promise} 返回当前产品数据的 Promise
     */
    async fetchCurrentProductData() {
        const config = window.pwcaProductConfig;
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
                data: result.status === 'fulfilled' ? result.value.data : null,
                meta: result.status === 'fulfilled' ? result.value.meta : null,
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
            const config = window.pwcaProductConfig;
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
        return window.pwcaProductConfig || {};
    }
};

// 为 Vue 组件提供全局访问
if (typeof window !== 'undefined') {
    window.pwcaProductDataAPI = window.pwcaProductDataAPI;

    // ProductDataAPI 已就绪
}
