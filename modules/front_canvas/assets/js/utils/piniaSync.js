/**
 * Pinia Store 与 DOM 元素同步工具
 *
 * 该工具函数用于将 Pinia Store 中的值与页面 HTML 元素进行响应式同步。
 * 支持自动等待依赖加载、错误重试和深度路径访问。
 *
 * @author PW Canvas Plugin
 * @version 1.0.0
 */

/**
 * 将 Pinia Store 中的某个值与页面上的 HTML 元素内容进行响应式同步。
 * 该函数会自动等待依赖（如 Vue 和 Pinia）加载完成，并持续尝试直到成功或发生不可恢复的错误。
 *
 * @param {string} elementId - 需要同步内容的页面元素 ID。
 * @param {function(): object} storeAccessor - 一个返回 Pinia Store 实例的函数。例如: () => window.useProductStore()。
 * @param {string} valuePath - Store state 中所需值的路径，支持点表示法（例如 'product.name' 或 'user.info.age'）。
 */
function syncPiniaToElement(elementId, storeAccessor, valuePath) {
    // --- 配置（可根据需要调整） ---
    const config = {
        initialCheckInterval: 100, // 初始检查依赖的间隔 (ms)
        retryDelayAfterTimeout: 1000, // 依赖加载超时后的重试间隔 (ms)
        initialTimeout: 5000, // 初始等待的超时时间 (ms)
    };

    // 1. 获取目标元素，如果找不到则提前退出
    const targetElement = document.getElementById(elementId);
    if (!targetElement) {
        return;
    }

    // 将值路径字符串拆分为键数组，以便后续访问
    const pathKeys = valuePath.split(".");
    let checkStoreInterval; // 用于存储检查间隔的ID

    // 2. 检查核心依赖 (Vue, Pinia) 和 Store 访问器是否准备就绪
    function checkDependencies() {
        return new Promise((resolve, reject) => {
            // 检查 Vue 和 Pinia 是否已加载
            if (!window.Vue || !window.Pinia) {
                reject(
                    "[Pinia Sync] Vue or Pinia is not loaded correctly. Please ensure they are included before using Pinia sync."
                );
                return;
            }

            // 确保传入的 storeAccessor 是一个函数
            if (typeof storeAccessor !== "function") {
                reject(`[Pinia Sync] 提供的 storeAccessor 不是一个有效的函数。`);
                return;
            }

            // 清除可能存在的旧计时器
            if (checkStoreInterval) clearInterval(checkStoreInterval);

            // 通过轮询检查 Store 访问器是否能成功返回 Store 实例
            const check = () => {
                try {
                    // 尝试调用访问器以确认 Store 是否已定义
                    if (storeAccessor()) {
                        clearInterval(checkStoreInterval);
                        resolve();
                    }
                } catch (e) {
                    // 如果 storeAccessor() 抛出错误（例如 store 未定义），则忽略并继续等待
                }
            };

            checkStoreInterval = setInterval(
                check,
                config.initialCheckInterval
            );

            // 设置一个超时警告，超时后会降低轮询频率
            setTimeout(() => {
                if (checkStoreInterval) {
                    // 检查计时器是否仍然存在（即尚未成功初始化）
                    clearInterval(checkStoreInterval);
                    checkStoreInterval = setInterval(
                        check,
                        config.retryDelayAfterTimeout
                    );
                }
            }, config.initialTimeout);
        });
    }

    // 3. 从 Store 实例中安全地获取嵌套值
    function getValueFromStore(store) {
        if (!store) return null;

        let currentValue = store;
        for (const key of pathKeys) {
            if (
                currentValue &&
                typeof currentValue === "object" &&
                key in currentValue
            ) {
                currentValue = currentValue[key];
            } else {
                return null; // 如果路径中任何一部分无效，则返回 null
            }
        }
        return currentValue;
    }

    // 4. 更新页面元素的内容
    function updateElementContent(value) {
        const displayValue = value !== undefined && value !== null ? value : "";
        if (targetElement.textContent !== displayValue) {
            targetElement.textContent = displayValue;
        }
    }

    // 5. 核心初始化与同步逻辑
    async function initSync() {
        try {
            // 等待所有依赖准备就绪
            await checkDependencies();

            const store = storeAccessor();
            if (!store) {
                // 理论上 checkDependencies 已确认 store 可用，但作为安全措施保留
                throw new Error("Failed to get Pinia store instance");
            }

            // 首次加载时设置初始值
            updateElementContent(getValueFromStore(store));

            // 订阅 Store 的变化，以实现响应式更新
            store.$subscribe(
                () => {
                    updateElementContent(getValueFromStore(store));
                },
                {
                    deep: true,
                }
            );
        } catch (error) {
            // 如果在初始化过程中发生任何错误，则在延迟后重试
            setTimeout(initSync, config.retryDelayAfterTimeout);
        }
    }

    // --- 启动同步流程 ---
    
    initSync();
}

// 将函数暴露到全局作用域，以便其他脚本使用
window.syncPiniaToElement = syncPiniaToElement;

// 如果在模块环境中，也支持导出
if (typeof module !== "undefined" && module.exports) {
    module.exports = { syncPiniaToElement };
}
