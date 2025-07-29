/**
 * 产品数据 API 模块
 * 使用 axios 从 REST API 获取数据，供 Vue 和 Pinia 使用
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
            
            console.log('=== PW Canvas API 调用开始 ===');
            console.log('请求URL:', `${config.restApiUrl}${pwId}`);
            console.log('请求时间:', new Date().toLocaleString());
            console.log('产品ID (pw_id):', pwId);
            console.log('请求配置:', config);
            
            const response = await axios.get(`${config.restApiUrl}${pwId}`, {
                headers: {
                    'X-WP-Nonce': config.nonce
                }
            });
            
            console.log('✅ API请求成功');
            console.log('📊 返回数据:', response.data);
            console.log('📋 完整响应对象:', response);
            console.log('🔢 响应状态码:', response.status);
            console.log('📄 响应头信息:', response.headers);
            console.log('⏱️ 响应时间:', new Date().toLocaleString());
            
            // 详细分析返回的数据结构
            if (response.data) {
                console.log('🎯 数据结构分析:');
                console.log('- 是否有产品数据:', response.data.has_product_data || false);
                console.log('- 是否有模板数据:', response.data.has_templates || false);
                console.log('- 是否有变体数据:', response.data.has_variants || false);
                console.log('- 是否有WooCommerce产品:', response.data.has_woocommerce_product || false);
                console.log('- 是否有Mock数据:', response.data.has_mock_data || false);
                
                if (response.data.computed) {
                    console.log('🧮 计算字段:', response.data.computed);
                }
                
                if (response.data.woocommerce) {
                    console.log('🛒 WooCommerce数据:', response.data.woocommerce);
                }
            }
            
            console.log('=== API 调用结束 ===');
            return response.data;
        } catch (error) {
            console.log('❌ API请求失败');
            console.error('🚫 错误详情:', error);
            
            // 提供更详细的错误信息
            if (error.response) {
                console.error('📄 错误响应数据:', error.response.data);
                console.error('🔢 错误状态码:', error.response.status);
                console.error('📋 错误响应头:', error.response.headers);
                throw new Error(`API 错误 ${error.response.status}: ${error.response.data.message || '未知错误'}`);
            } else if (error.request) {
                console.error('📡 请求未收到响应:', error.request);
                throw new Error('网络请求失败，请检查网络连接');
            } else {
                console.error('⚙️ 请求配置错误:', error.message);
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
            console.error('批量获取产品数据失败:', error);
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
            console.warn('API 连接检查失败:', error);
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
    
    // 页面加载完成后自动测试API调用（如果有产品配置）
    document.addEventListener('DOMContentLoaded', function() {
        console.log('💡 ProductDataAPI 已加载，可通过以下方式调用:');
        console.log('- window.productDataAPI.fetchCurrentProductData()');
        console.log('- window.productDataAPI.fetchProductData(pwId)');
        
        // 如果有产品配置，自动测试API调用
        setTimeout(() => {
            if (window.pwProductConfig && window.pwProductConfig.pwId) {
                console.log('🚀 自动测试当前产品API调用...');
                window.productDataAPI.fetchCurrentProductData()
                    .then(data => {
                        console.log('🎉 自动测试成功完成！');
                    })
                    .catch(error => {
                        console.warn('⚠️ 自动测试失败:', error.message);
                    });
            } else {
                console.log('ℹ️ 未找到产品配置，跳过自动测试');
                console.log('当前页面配置:', window.pwProductConfig);
            }
        }, 1000); // 延迟1秒确保所有依赖加载完成
    });
}