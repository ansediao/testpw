/**
 * 消息提示工具函数
 * 用于在页面上显示成功、错误和信息提示
 */

/**
 * 显示成功消息
 * @param {string} message - 要显示的消息内容
 * @param {number} duration - 显示持续时间（毫秒），默认3000ms
 */
function showSuccessMessage(message, duration = 3000) {
    showMessage(message, 'success', duration);
}

/**
 * 显示错误消息
 * @param {string} message - 要显示的消息内容
 * @param {number} duration - 显示持续时间（毫秒），默认5000ms
 */
function showErrorMessage(message, duration = 5000) {
    showMessage(message, 'error', duration);
}

/**
 * 显示信息消息
 * @param {string} message - 要显示的消息内容
 * @param {number} duration - 显示持续时间（毫秒），默认3000ms
 */
function showInfoMessage(message, duration = 3000) {
    showMessage(message, 'info', duration);
}

/**
 * 通用消息显示函数
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型：'success', 'error', 'info'
 * @param {number} duration - 显示持续时间（毫秒）
 */
function showMessage(message, type = 'info', duration = 3000) {
    // 移除现有的消息提示
    removeExistingMessages();
    
    // 创建消息容器
    const messageContainer = document.createElement('div');
    messageContainer.className = `pw-message pw-message--${type}`;
    messageContainer.innerHTML = `
        <div class="pw-message__content">
            <span class="pw-message__icon"></span>
            <span class="pw-message__text">${escapeHtml(message)}</span>
            <button class="pw-message__close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // 添加样式
    addMessageStyles();
    
    // 插入到页面顶部
    document.body.insertBefore(messageContainer, document.body.firstChild);
    
    // 添加显示动画
    setTimeout(() => {
        messageContainer.classList.add('pw-message--show');
    }, 10);
    
    // 自动移除
    if (duration > 0) {
        setTimeout(() => {
            removeMessage(messageContainer);
        }, duration);
    }
}

/**
 * 移除现有的消息提示
 */
function removeExistingMessages() {
    const existingMessages = document.querySelectorAll('.pw-message');
    existingMessages.forEach(msg => removeMessage(msg));
}

/**
 * 移除指定的消息元素
 * @param {HTMLElement} messageElement - 要移除的消息元素
 */
function removeMessage(messageElement) {
    if (messageElement && messageElement.parentNode) {
        messageElement.classList.add('pw-message--hide');
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 300);
    }
}

/**
 * HTML 转义函数
 * @param {string} text - 要转义的文本
 * @returns {string} 转义后的文本
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 添加消息提示的CSS样式
 */
function addMessageStyles() {
    // 检查是否已经添加过样式
    if (document.getElementById('pw-message-styles')) {
        return;
    }
    
    const style = document.createElement('style');
    style.id = 'pw-message-styles';
    style.textContent = `
        .pw-message {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            min-width: 300px;
            max-width: 500px;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform: translateX(100%);
            transition: all 0.3s ease;
            opacity: 0;
        }
        
        .pw-message--show {
            transform: translateX(0);
            opacity: 1;
        }
        
        .pw-message--hide {
            transform: translateX(100%);
            opacity: 0;
        }
        
        .pw-message--success {
            border-left: 4px solid #4caf50;
        }
        
        .pw-message--error {
            border-left: 4px solid #f44336;
        }
        
        .pw-message--info {
            border-left: 4px solid #2196f3;
        }
        
        .pw-message__content {
            display: flex;
            align-items: center;
            padding: 16px;
            gap: 12px;
        }
        
        .pw-message__icon {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            flex-shrink: 0;
        }
        
        .pw-message--success .pw-message__icon {
            background: #4caf50;
        }
        
        .pw-message--error .pw-message__icon {
            background: #f44336;
        }
        
        .pw-message--info .pw-message__icon {
            background: #2196f3;
        }
        
        .pw-message__icon::after {
            content: '';
            display: block;
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
            margin: 6px auto;
        }
        
        .pw-message__text {
            flex: 1;
            color: #333;
            font-size: 14px;
            line-height: 1.4;
        }
        
        .pw-message__close {
            background: none;
            border: none;
            font-size: 18px;
            color: #999;
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s ease;
        }
        
        .pw-message__close:hover {
            background: #f5f5f5;
            color: #666;
        }
        
        @media (max-width: 768px) {
            .pw-message {
                left: 20px;
                right: 20px;
                min-width: auto;
                max-width: none;
                transform: translateY(-100%);
            }
            
            .pw-message--show {
                transform: translateY(0);
            }
            
            .pw-message--hide {
                transform: translateY(-100%);
            }
        }
    `;
    
    document.head.appendChild(style);
}

// 将函数暴露到全局作用域
window.pwcaShowSuccessMessage = showSuccessMessage;
window.pwcaShowErrorMessage = showErrorMessage;
window.pwcaShowInfoMessage = showInfoMessage;
window.pwcaShowMessage = showMessage;