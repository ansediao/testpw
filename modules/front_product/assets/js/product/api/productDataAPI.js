/**
 * 产品数据 API 模块
 * 使用 axios 从 REST API 获取数据，供 Vue 使用
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
            
            const response = await axios.get(`${config.restApiUrl}${pwId}`, {
                headers: {
                    'X-WP-Nonce': config.nonce
                }
            });
            
            return response.data;
        } catch (error) {
            if (error.response) {
                throw new Error(`API 错误 ${error.response.status}: ${error.response.data.message || '未知错误'}`);
            } else if (error.request) {
                throw new Error('网络请求失败，请检查网络连接');
            } else {
                throw new Error(`请求错误: ${error.message}`);
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
            await axios.get(config.restApiUrl.replace('/product-data/', '/health'), {
                timeout: 5000,
                headers: {
                    'X-WP-Nonce': config.nonce
                }
            });
            return true;
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
