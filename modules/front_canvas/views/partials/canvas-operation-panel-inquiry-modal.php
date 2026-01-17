<script>
// Inquiry Modal JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // 初始化 MicroModal
    if (typeof MicroModal !== 'undefined') {
        MicroModal.init({
            disableScroll: true,
            disableFocus: false,
            awaitCloseAnimation: false,
            debugMode: false
        });
    }
    
    // Inquiry 按钮点击事件
    const inquiryBtn = document.getElementById('pwca-inquiry-btn');
    if (inquiryBtn) {
        inquiryBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 获取当前产品ID
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('product_id');
            
            if (!productId) {
                console.error('Product ID not found in URL');
                return;
            }
            
            // 打开弹窗
            if (typeof MicroModal !== 'undefined') {
                MicroModal.show('pwca-inquiry-modal');
            } else {
                console.error('MicroModal not loaded');
            }
        });
    }
    
    // 表单提交处理
    const inquiryForm = document.getElementById('pwca-inquiry-form');
    if (inquiryForm) {
        inquiryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 清除之前的消息
            const messageDiv = document.getElementById('pwca-form-message');
            messageDiv.innerHTML = '';
            messageDiv.className = 'pwca-form-message';
            
            // 获取表单数据
            const formData = new FormData(inquiryForm);
            
            // 获取产品ID
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('product_id');
            
            if (!productId) {
                showMessage('Product ID not found', 'error');
                return;
            }
            
            // 构建请求数据对象
            const requestData = {
                product_id: productId,
                inquiry_first_name: formData.get('inquiry_first_name'),
                inquiry_last_name: formData.get('inquiry_last_name'),
                inquiry_email: formData.get('inquiry_email'),
                inquiry_phone: formData.get('inquiry_phone'),
                inquiry_message: formData.get('inquiry_message')
            };
            
            // 禁用提交按钮
            const submitBtn = document.querySelector('.pwca-inquiry-modal__btn--submit');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            
            const appEl = document.getElementById('app');
            const restBaseUrl = appEl && appEl.dataset && appEl.dataset.restUrl ? String(appEl.dataset.restUrl) : '';
            const restEndpoint = restBaseUrl ? restBaseUrl.replace(/\/?$/, '/') + 'pwca/v1/inquiry' : '/wp-json/pwca/v1/inquiry';

            // 发送REST API请求
            fetch(restEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showMessage(data.message || 'Your inquiry has been sent successfully!', 'success');
                    inquiryForm.reset();
                    
                    // 延迟关闭弹窗
                    setTimeout(() => {
                        if (typeof MicroModal !== 'undefined') {
                            MicroModal.close('pwca-inquiry-modal');
                        }
                    }, 2000);
                } else {
                    showMessage(data.message || 'An error occurred. Please try again.', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('Network error. Please try again.', 'error');
            })
            .finally(() => {
                // 恢复提交按钮
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            });
        });
    }
    
    // 显示消息函数
    function showMessage(message, type) {
        const messageDiv = document.getElementById('pwca-form-message');
        messageDiv.innerHTML = message;
        messageDiv.className = `pwca-form-message pwca-form-message--${type}`;
    }
    
    // 表单验证
    function validateForm() {
        const requiredFields = inquiryForm.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('pwca-form-input--error');
                isValid = false;
            } else {
                field.classList.remove('pwca-form-input--error');
            }
        });
        
        // 验证邮箱格式
        const emailField = document.getElementById('inquiry_email');
        if (emailField.value && !isValidEmail(emailField.value)) {
            emailField.classList.add('pwca-form-input--error');
            isValid = false;
        }
        
        return isValid;
    }
    
    // 邮箱格式验证
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // 实时验证
    const formInputs = inquiryForm.querySelectorAll('.pwca-form-input, .pwca-form-textarea');
    formInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.hasAttribute('required') && !this.value.trim()) {
                this.classList.add('pwca-form-input--error');
            } else {
                this.classList.remove('pwca-form-input--error');
            }
            
            // 特殊处理邮箱验证
            if (this.type === 'email' && this.value && !isValidEmail(this.value)) {
                this.classList.add('pwca-form-input--error');
            }
        });
        
        input.addEventListener('input', function() {
            this.classList.remove('pwca-form-input--error');
        });
    });
});
</script>

<!-- Inquiry Modal - MicroModal Structure -->
<div class="pwca-inquiry-modal modal micromodal-slide" id="pwca-inquiry-modal" aria-hidden="true">
    <div class="pwca-inquiry-modal__overlay modal__overlay" tabindex="-1" data-micromodal-close>
        <div class="pwca-inquiry-modal__container modal__container" role="dialog" aria-modal="true" aria-labelledby="pwca-inquiry-modal-title">
            <header class="pwca-inquiry-modal__header modal__header">
                <h2 class="pwca-inquiry-modal__title modal__title" id="pwca-inquiry-modal-title">
                    Product Inquiry
                </h2>
                <button class="pwca-inquiry-modal__close modal__close" aria-label="Close modal" data-micromodal-close></button>
            </header>
            
            <main class="pwca-inquiry-modal__content modal__content" id="pwca-inquiry-modal-content">
                <form id="pwca-inquiry-form" class="pwca-inquiry-form">
                    <div class="pwca-form-row">
                        <label for="inquiry_first_name" class="pwca-form-label">
                            First Name <span class="pwca-form-required">*</span>
                        </label>
                        <input type="text" id="inquiry_first_name" name="inquiry_first_name" class="pwca-form-input" required>
                    </div>
                    
                    <div class="pwca-form-row">
                        <label for="inquiry_last_name" class="pwca-form-label">
                            Last Name <span class="pwca-form-required">*</span>
                        </label>
                        <input type="text" id="inquiry_last_name" name="inquiry_last_name" class="pwca-form-input" required>
                    </div>
                    
                    <div class="pwca-form-row">
                        <label for="inquiry_email" class="pwca-form-label">
                            Email <span class="pwca-form-required">*</span>
                        </label>
                        <input type="email" id="inquiry_email" name="inquiry_email" class="pwca-form-input" required>
                    </div>
                    
                    <div class="pwca-form-row">
                        <label for="inquiry_phone" class="pwca-form-label">
                            Tel
                        </label>
                        <input type="tel" id="inquiry_phone" name="inquiry_phone" class="pwca-form-input">
                    </div>
                    
                    <div class="pwca-form-row pwca-form-row--textarea">
                        <label for="inquiry_message" class="pwca-form-label">
                            Message <span class="pwca-form-required">*</span>
                        </label>
                        <textarea id="inquiry_message" name="inquiry_message" class="pwca-form-textarea" rows="5" required></textarea>
                    </div>
                    
                    <div class="pwca-form-message" id="pwca-form-message"></div>
                </form>
            </main>
            
            <footer class="pwca-inquiry-modal__footer modal__footer">
                <button class="pwca-inquiry-modal__btn pwca-inquiry-modal__btn--cancel modal__btn" data-micromodal-close>
                    Cancel
                </button>
                <button class="pwca-inquiry-modal__btn pwca-inquiry-modal__btn--submit modal__btn" type="submit" form="pwca-inquiry-form">
                    Submit
                </button>
            </footer>
        </div>
    </div>
</div>
