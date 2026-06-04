/**
 * 主入口模块
 * 演示 ES Modules 的使用和作用域隔离
 */

// 使用相对路径导入
import { add, multiply, power, getCircleArea, getHistory, clearHistory } from './utils/math.js';
import { capitalize, reverse, camelCase, kebabCase, truncate, getStats } from './utils/string.js';
import { increment, decrement, reset, getCount, setStep, onChange, getInfo } from './utils/counter.js';
import { createButton, buttonVariants } from './components/button.js';

// ============================================
// 演示 1: 作用域隔离验证
// ============================================

function setupScopeDemo() {
    const btn = document.getElementById('btn-check-scope');
    const result = document.getElementById('scope-result');
    const globalCheck = document.getElementById('global-check');

    // 在模块中定义一些变量
    const modulePrivateVar = '这是模块私有变量';
    let modulePrivateState = 42;

    btn.addEventListener('click', () => {
        const checks = [];
        let allSafe = true;

        // 检查模块私有变量是否泄漏到全局
        const globalVarsToCheck = [
            'modulePrivateVar',
            'modulePrivateState',
            'calculationHistory',  // math.js 的私有变量
            'transformationCount', // string.js 的私有变量
            'count',               // counter.js 的私有变量
            'PI',                  // math.js 的私有常量
            'defaultStyles'        // button.js 的私有变量
        ];

        globalVarsToCheck.forEach(varName => {
            if (window[varName] !== undefined) {
                checks.push(`❌ 泄漏: ${varName} = ${window[varName]}`);
                allSafe = false;
            } else {
                checks.push(`✅ 安全: ${varName} 未暴露到全局`);
            }
        });

        // 检查模块导出的函数是否在全局
        const exportedFunctions = [
            'add',
            'multiply',
            'capitalize',
            'increment',
            'createButton'
        ];

        exportedFunctions.forEach(funcName => {
            if (window[funcName] !== undefined) {
                checks.push(`❌ 泄漏: ${funcName} 暴露到全局`);
                allSafe = false;
            } else {
                checks.push(`✅ 安全: ${funcName} 未暴露到全局`);
            }
        });

        // 显示结果
        result.innerHTML = checks.join('\n');
        result.className = 'result';

        // 更新全局检查状态
        if (allSafe) {
            globalCheck.textContent = '✅ 全局作用域检查通过：所有模块变量都被正确封装！';
            globalCheck.className = 'success';
        } else {
            globalCheck.textContent = '❌ 检测到全局变量泄漏！';
            globalCheck.className = 'error';
        }
    });
}

// ============================================
// 演示 2: 模块功能调用
// ============================================

function setupModuleDemo() {
    const result = document.getElementById('module-result');

    // 数学计算按钮
    document.getElementById('btn-math').addEventListener('click', () => {
        const operations = [
            `10 + 20 = ${add(10, 20)}`,
            `5 × 8 = ${multiply(5, 8)}`,
            `2^10 = ${power(2, 10)}`,
            `圆面积(r=5) = ${getCircleArea(5).toFixed(2)}`,
            `\n计算历史:`,
            ...getHistory().map(h => `  ${h.operation} = ${h.result}`)
        ];
        result.textContent = operations.join('\n');
    });

    // 字符串处理按钮
    document.getElementById('btn-string').addEventListener('click', () => {
        const testStr = 'hello world example';
        const operations = [
            `原始字符串: "${testStr}"`,
            `capitalize: "${capitalize(testStr)}"`,
            `reverse: "${reverse(testStr)}"`,
            `camelCase: "${camelCase(testStr)}"`,
            `kebabCase: "${kebabCase(testStr)}"`,
            `truncate(10): "${truncate(testStr, 10)}"`,
            `\n统计:`,
            `  总转换次数: ${getStats().totalTransformations}`
        ];
        result.textContent = operations.join('\n');
    });

    // 计数器按钮
    document.getElementById('btn-counter').addEventListener('click', () => {
        increment();
        increment();
        increment();
        setStep(5);
        increment();

        const info = getInfo();
        const operations = [
            `执行操作:`,
            `  increment() × 3`,
            `  setStep(5)`,
            `  increment()`,
            `\n当前状态:`,
            `  计数: ${info.count}`,
            `  步长: ${info.step}`,
            `  监听器数量: ${info.listenersCount}`
        ];
        result.textContent = operations.join('\n');
    });

    // 重置计数器按钮
    document.getElementById('btn-reset').addEventListener('click', () => {
        reset();
        result.textContent = '计数器已重置\n当前计数: 0';
    });
}

// ============================================
// 演示 3: Import Map 别名使用
// ============================================

function setupAliasDemo() {
    const btn = document.getElementById('btn-alias');
    const result = document.getElementById('alias-result');

    btn.addEventListener('click', async () => {
        const info = [];

        info.push('=== Import Map 别名导入测试 ===\n');

        // 测试 @utils 别名
        info.push('📦 使用 @utils/math 别名:');
        info.push(`  add(100, 200) = ${add(100, 200)}`);
        info.push(`  multiply(7, 8) = ${multiply(7, 8)}`);

        info.push('\n📦 使用 @utils/string 别名:');
        info.push(`  capitalize("test") = ${capitalize("test")}`);
        info.push(`  camelCase("hello world") = ${camelCase("hello world")}`);

        info.push('\n📦 使用 @components/button 别名:');
        info.push(`  按钮变体: ${buttonVariants.join(', ')}`);

        info.push('\n✅ 所有别名导入正常工作！');

        result.textContent = info.join('\n');
    });
}

// ============================================
// 演示 4: 动态导入
// ============================================

function setupDynamicDemo() {
    const btn = document.getElementById('btn-dynamic');
    const result = document.getElementById('dynamic-result');
    let dynamicModule = null;

    btn.addEventListener('click', async () => {
        result.textContent = '⏳ 正在动态加载模块...';

        try {
            // 动态导入 - 按需加载
            if (!dynamicModule) {
                const startTime = performance.now();

                // 动态导入模块
                const mathModule = await import('./utils/math.js');
                const stringModule = await import('./utils/string.js');

                const endTime = performance.now();

                dynamicModule = {
                    math: mathModule,
                    string: stringModule,
                    loadTime: endTime - startTime
                };
            }

            const info = [
                '⚡ 动态导入成功！',
                `\n加载耗时: ${dynamicModule.loadTime.toFixed(2)} ms`,
                '\n动态加载的模块接口:',
                `  数学模块: ${Object.keys(dynamicModule.math).join(', ')}`,
                `  字符串模块: ${Object.keys(dynamicModule.string).join(', ')}`,
                '\n调用示例:',
                `  dynamic.add(50, 50) = ${dynamicModule.math.add(50, 50)}`,
                `  dynamic.capitalize("dynamic") = ${dynamicModule.string.capitalize("dynamic")}`,
                '\n💡 模块只会加载一次，后续调用使用缓存'
            ];

            result.textContent = info.join('\n');
        } catch (error) {
            result.textContent = `❌ 动态导入失败: ${error.message}`;
        }
    });
}

// ============================================
// 初始化应用
// ============================================

function initApp() {
    console.log('🚀 ES Modules 演示应用已启动');

    // 设置所有演示
    setupScopeDemo();
    setupModuleDemo();
    setupAliasDemo();
    setupDynamicDemo();

    // 注册计数器监听器
    const unsubscribe = onChange((count) => {
        console.log(`计数器更新: ${count}`);
    });

    // 页面卸载时取消订阅
    window.addEventListener('unload', () => {
        unsubscribe();
    });

    console.log('✅ 所有演示已就绪');
    console.log('💡 提示: 打开浏览器控制台查看日志');
}

// 启动应用
initApp();
