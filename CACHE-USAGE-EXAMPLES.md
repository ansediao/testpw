# 缓存功能使用示例

## 前端 JavaScript 使用

### 基础用法

```javascript
// 获取产品数据（自动使用缓存）
async function getProductData(productId) {
    try {
        const response = await fetch(`/wp-json/pw/v1/product-data/${productId}`);
        const data = await response.json();
        
        console.log('产品数据:', data);
        return data;
    } catch (error) {
        console.error('获取产品数据失败:', error);
        return null;
    }
}

// 使用示例
getProductData(123).then(data => {
    if (data) {
        console.log('产品名称:', data.woocommerce?.name);
        console.log('是否可定制:', data.computed?.is_customizable);
    }
});
```

### Vue.js 组件中使用

```javascript
// 在 Vue 组件中使用缓存的产品数据
export default {
    name: 'ProductComponent',
    data() {
        return {
            productData: null,
            loading: true,
            error: null
        }
    },
    
    async mounted() {
        await this.loadProductData();
    },
    
    methods: {
        async loadProductData() {
            try {
                this.loading = true;
                this.error = null;
                
                // 这个调用会自动使用缓存（如果可用）
                const response = await fetch(`/wp-json/pw/v1/product-data/${this.productId}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                this.productData = await response.json();
                
                // 检查数据是否来自缓存（可选）
                console.log('数据获取完成，响应时间:', response.headers.get('X-Response-Time'));
                
            } catch (error) {
                this.error = error.message;
                console.error('加载产品数据失败:', error);
            } finally {
                this.loading = false;
            }
        },
        
        // 强制刷新数据（绕过缓存）
        async forceRefresh() {
            // 先清除缓存（需要管理员权限）
            try {
                await this.clearCache();
                await this.loadProductData();
            } catch (error) {
                console.error('强制刷新失败:', error);
            }
        },
        
        // 清除缓存（仅管理员可用）
        async clearCache() {
            const response = await fetch('/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'pw_clear_product_cache',
                    product_id: this.productId,
                    nonce: window.pwAdminNonce // 需要在页面中提供
                })
            });
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.data || '清除缓存失败');
            }
        }
    },
    
    template: `
        <div class="product-component">
            <div v-if="loading" class="loading">
                加载中...
            </div>
            
            <div v-else-if="error" class="error">
                错误: {{ error }}
                <button @click="loadProductData">重试</button>
            </div>
            
            <div v-else-if="productData" class="product-data">
                <h3>{{ productData.woocommerce?.name || '未知产品' }}</h3>
                <p>价格: {{ productData.woocommerce?.price_html || '暂无价格' }}</p>
                <p>可定制: {{ productData.computed?.is_customizable ? '是' : '否' }}</p>
                
                <button @click="forceRefresh" class="refresh-btn">
                    强制刷新
                </button>
            </div>
        </div>
    `
}
```

### React Hook 使用

```javascript
import { useState, useEffect, useCallback } from 'react';

// 自定义 Hook 用于获取产品数据
function useProductData(productId) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastFetch, setLastFetch] = useState(null);
    
    const fetchData = useCallback(async (forceRefresh = false) => {
        try {
            setLoading(true);
            setError(null);
            
            let url = `/wp-json/pw/v1/product-data/${productId}`;
            
            // 如果强制刷新，可以添加时间戳参数绕过浏览器缓存
            if (forceRefresh) {
                url += `?_t=${Date.now()}`;
            }
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            setData(result);
            setLastFetch(new Date());
            
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [productId]);
    
    useEffect(() => {
        if (productId) {
            fetchData();
        }
    }, [productId, fetchData]);
    
    const refresh = useCallback(() => {
        fetchData(true);
    }, [fetchData]);
    
    return { 
        data, 
        loading, 
        error, 
        refresh, 
        lastFetch 
    };
}

// 在组件中使用
function ProductComponent({ productId }) {
    const { data, loading, error, refresh, lastFetch } = useProductData(productId);
    
    if (loading) {
        return <div className="loading">加载中...</div>;
    }
    
    if (error) {
        return (
            <div className="error">
                <p>错误: {error}</p>
                <button onClick={refresh}>重试</button>
            </div>
        );
    }
    
    if (!data) {
        return <div>无数据</div>;
    }
    
    return (
        <div className="product-component">
            <h3>{data.woocommerce?.name || '未知产品'}</h3>
            <p>价格: {data.woocommerce?.price_html || '暂无价格'}</p>
            <p>可定制: {data.computed?.is_customizable ? '是' : '否'}</p>
            
            <div className="meta-info">
                <small>最后更新: {lastFetch?.toLocaleString()}</small>
                <button onClick={refresh} className="refresh-btn">
                    刷新数据
                </button>
            </div>
        </div>
    );
}
```

## 管理界面使用

### 缓存状态监控

```javascript
// 获取缓存状态
function getCacheStatus() {
    return fetch('/wp-admin/admin-ajax.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            action: 'pw_get_cache_status',
            nonce: window.pwCacheStatusNonce
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.data || '获取缓存状态失败');
        }
    });
}

// 使用示例
getCacheStatus().then(status => {
    console.log('总缓存数量:', status.total_cached);
    console.log('过期缓存数量:', status.expired_count);
    console.log('最近更新时间:', status.latest_cache_time);
});
```

### 缓存清理操作

```javascript
// 清除指定产品缓存
async function clearProductCache(productId) {
    const response = await fetch('/wp-admin/admin-ajax.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            action: 'pw_clear_product_cache',
            product_id: productId,
            nonce: window.pwClearCacheNonce
        })
    });
    
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.data || '清除缓存失败');
    }
    
    return result.data.message;
}

// 清除所有缓存
async function clearAllCache() {
    const response = await fetch('/wp-admin/admin-ajax.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            action: 'pw_clear_product_cache',
            nonce: window.pwClearCacheNonce
        })
    });
    
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.data || '清除所有缓存失败');
    }
    
    return result.data.message;
}

// 使用示例
clearProductCache(123)
    .then(message => console.log('成功:', message))
    .catch(error => console.error('失败:', error));
```

## 性能测试

### 缓存效果测试

```javascript
// 测试缓存性能
async function testCachePerformance(productId, iterations = 5) {
    const results = [];
    
    // 先清除缓存确保第一次是API调用
    try {
        await clearProductCache(productId);
    } catch (error) {
        console.warn('清除缓存失败，可能没有管理员权限');
    }
    
    for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        
        try {
            const response = await fetch(`/wp-json/pw/v1/product-data/${productId}`);
            const data = await response.json();
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            results.push({
                iteration: i + 1,
                duration: Math.round(duration),
                cached: i > 0, // 第一次是API调用，后续是缓存
                dataSize: JSON.stringify(data).length
            });
            
        } catch (error) {
            results.push({
                iteration: i + 1,
                error: error.message
            });
        }
        
        // 短暂延迟避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
}

// 使用示例
testCachePerformance(123).then(results => {
    console.table(results);
    
    const apiCall = results.find(r => !r.cached && !r.error);
    const cacheCall = results.find(r => r.cached && !r.error);
    
    if (apiCall && cacheCall) {
        const improvement = ((apiCall.duration - cacheCall.duration) / apiCall.duration * 100).toFixed(1);
        console.log(`缓存性能提升: ${improvement}%`);
    }
});
```

### 数据一致性验证

```javascript
// 验证缓存数据与API数据的一致性
async function validateCacheConsistency(productId) {
    try {
        // 清除缓存获取新数据
        await clearProductCache(productId);
        const apiResponse = await fetch(`/wp-json/pw/v1/product-data/${productId}`);
        const apiData = await apiResponse.json();
        
        // 再次调用获取缓存数据
        const cacheResponse = await fetch(`/wp-json/pw/v1/product-data/${productId}`);
        const cacheData = await cacheResponse.json();
        
        // 比较数据
        const apiJson = JSON.stringify(apiData);
        const cacheJson = JSON.stringify(cacheData);
        const isConsistent = apiJson === cacheJson;
        
        return {
            consistent: isConsistent,
            apiDataSize: apiJson.length,
            cacheDataSize: cacheJson.length,
            differences: isConsistent ? null : findDifferences(apiData, cacheData)
        };
        
    } catch (error) {
        return {
            error: error.message
        };
    }
}

// 查找数据差异的辅助函数
function findDifferences(obj1, obj2, path = '') {
    const differences = [];
    
    for (const key in obj1) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (!(key in obj2)) {
            differences.push(`缺少键: ${currentPath}`);
        } else if (typeof obj1[key] === 'object' && obj1[key] !== null) {
            differences.push(...findDifferences(obj1[key], obj2[key], currentPath));
        } else if (obj1[key] !== obj2[key]) {
            differences.push(`值不同: ${currentPath} (${obj1[key]} vs ${obj2[key]})`);
        }
    }
    
    for (const key in obj2) {
        const currentPath = path ? `${path}.${key}` : key;
        if (!(key in obj1)) {
            differences.push(`额外键: ${currentPath}`);
        }
    }
    
    return differences;
}

// 使用示例
validateCacheConsistency(123).then(result => {
    if (result.error) {
        console.error('验证失败:', result.error);
    } else if (result.consistent) {
        console.log('✓ 缓存数据一致性验证通过');
    } else {
        console.warn('✗ 缓存数据不一致');
        console.log('差异:', result.differences);
    }
});
```

## 最佳实践

### 1. 错误处理

```javascript
// 带有重试机制的数据获取
async function getProductDataWithRetry(productId, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(`/wp-json/pw/v1/product-data/${productId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
            
        } catch (error) {
            lastError = error;
            console.warn(`获取产品数据失败 (尝试 ${attempt}/${maxRetries}):`, error.message);
            
            if (attempt < maxRetries) {
                // 指数退避延迟
                const delay = Math.pow(2, attempt - 1) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw new Error(`获取产品数据失败，已重试 ${maxRetries} 次: ${lastError.message}`);
}
```

### 2. 缓存预热

```javascript
// 预热多个产品的缓存
async function preloadProductCache(productIds) {
    const results = await Promise.allSettled(
        productIds.map(id => fetch(`/wp-json/pw/v1/product-data/${id}`))
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`缓存预热完成: ${successful} 成功, ${failed} 失败`);
    
    return { successful, failed };
}
```

### 3. 缓存状态监控

```javascript
// 定期监控缓存状态
class CacheMonitor {
    constructor(checkInterval = 60000) { // 默认1分钟检查一次
        this.checkInterval = checkInterval;
        this.isMonitoring = false;
        this.stats = {
            totalRequests: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
    }
    
    start() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.intervalId = setInterval(() => {
            this.checkCacheStatus();
        }, this.checkInterval);
        
        console.log('缓存监控已启动');
    }
    
    stop() {
        if (!this.isMonitoring) return;
        
        clearInterval(this.intervalId);
        this.isMonitoring = false;
        console.log('缓存监控已停止');
    }
    
    async checkCacheStatus() {
        try {
            const status = await getCacheStatus();
            console.log('缓存状态:', status);
            
            // 如果过期缓存过多，发出警告
            if (status.expired_count > status.total_cached * 0.5) {
                console.warn('过期缓存过多，建议清理');
            }
            
        } catch (error) {
            console.error('检查缓存状态失败:', error);
        }
    }
    
    recordRequest(fromCache) {
        this.stats.totalRequests++;
        if (fromCache) {
            this.stats.cacheHits++;
        } else {
            this.stats.cacheMisses++;
        }
    }
    
    getHitRate() {
        if (this.stats.totalRequests === 0) return 0;
        return (this.stats.cacheHits / this.stats.totalRequests * 100).toFixed(2);
    }
}

// 使用示例
const monitor = new CacheMonitor();
monitor.start();

// 在应用关闭时停止监控
window.addEventListener('beforeunload', () => {
    monitor.stop();
});
```

这些示例展示了如何在不同场景下有效使用缓存功能，确保应用性能的同时保持数据的准确性。