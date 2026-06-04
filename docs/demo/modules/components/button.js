/**
 * 按钮组件模块
 * 展示组件化封装
 */

// 私有样式配置
const defaultStyles = {
    primary: {
        background: '#007bff',
        color: 'white',
        border: 'none'
    },
    secondary: {
        background: '#6c757d',
        color: 'white',
        border: 'none'
    },
    success: {
        background: '#28a745',
        color: 'white',
        border: 'none'
    }
};

// 私有函数
function applyStyles(element, styles) {
    Object.assign(element.style, styles);
}

// 公开接口 - 按钮工厂
export function createButton(text, variant = 'primary', onClick = null) {
    const button = document.createElement('button');
    button.textContent = text;

    // 应用样式
    const styles = defaultStyles[variant] || defaultStyles.primary;
    applyStyles(button, styles);

    // 添加通用样式
    button.style.padding = '8px 16px';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '14px';

    // 绑定事件
    if (onClick && typeof onClick === 'function') {
        button.addEventListener('click', onClick);
    }

    // 返回按钮元素和控制方法
    return {
        element: button,
        setText(newText) {
            button.textContent = newText;
        },
        disable() {
            button.disabled = true;
            button.style.opacity = '0.6';
            button.style.cursor = 'not-allowed';
        },
        enable() {
            button.disabled = false;
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
        },
        destroy() {
            button.remove();
        }
    };
}

// 导出变体列表
export const buttonVariants = Object.keys(defaultStyles);

// 导出配置方法
export function addVariant(name, styles) {
    defaultStyles[name] = { ...defaultStyles.primary, ...styles };
}
