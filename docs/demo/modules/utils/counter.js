/**
 * 计数器模块
 * 展示模块状态管理
 */

// 私有状态 - 完全封装
let count = 0;
let step = 1;
const listeners = new Set();

// 私有函数
function notifyListeners() {
    listeners.forEach(listener => listener(count));
}

// 公开接口
export function increment() {
    count += step;
    notifyListeners();
    return count;
}

export function decrement() {
    count -= step;
    notifyListeners();
    return count;
}

export function reset() {
    count = 0;
    notifyListeners();
    return count;
}

export function getCount() {
    return count;
}

export function setStep(newStep) {
    if (typeof newStep === 'number' && newStep > 0) {
        step = newStep;
    }
    return step;
}

export function onChange(callback) {
    listeners.add(callback);
    // 返回取消订阅函数
    return () => listeners.delete(callback);
}

export function getInfo() {
    return {
        count,
        step,
        listenersCount: listeners.size
    };
}
