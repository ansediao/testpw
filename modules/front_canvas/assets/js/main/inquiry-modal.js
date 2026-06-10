(function () {
    'use strict';

    function pwcaGetProductIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('product_id');
    }

    function pwcaGetRestEndpoint() {
        const appEl = document.getElementById('app');
        const restBaseUrl = appEl && appEl.dataset && appEl.dataset.restUrl ? String(appEl.dataset.restUrl) : '';
        if (restBaseUrl) {
            return restBaseUrl.replace(/\/?$/, '/') + 'pwca/v1/inquiry';
        }
        return '/wp-json/pwca/v1/inquiry';
    }

    function pwcaIsValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function pwcaShowMessage(message, type) {
        const messageDiv = document.getElementById('pwca-form-message');
        if (!messageDiv) {
            return;
        }
        messageDiv.innerHTML = message;
        messageDiv.className = 'pwca-form-message pwca-form-message--' + type;
    }

    function pwcaSetupValidation(inquiryForm) {
        if (!inquiryForm) {
            return;
        }

        const formInputs = inquiryForm.querySelectorAll('.pwca-form-input, .pwca-form-textarea');
        formInputs.forEach(function (input) {
            input.addEventListener('blur', function () {
                const requiresValue = input.hasAttribute('required');
                const value = input.value.trim();
                if (requiresValue && !value) {
                    input.classList.add('pwca-form-input--error');
                } else {
                    input.classList.remove('pwca-form-input--error');
                }

                if (input.type === 'email' && value && !pwcaIsValidEmail(value)) {
                    input.classList.add('pwca-form-input--error');
                }
            });

            input.addEventListener('input', function () {
                input.classList.remove('pwca-form-input--error');
            });
        });
    }

    function pwcaValidateForm(inquiryForm) {
        if (!inquiryForm) {
            return false;
        }

        const requiredFields = inquiryForm.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(function (field) {
            const value = field.value.trim();
            if (!value) {
                field.classList.add('pwca-form-input--error');
                isValid = false;
            } else {
                field.classList.remove('pwca-form-input--error');
            }
        });

        const emailField = document.getElementById('inquiry_email');
        if (emailField && emailField.value && !pwcaIsValidEmail(emailField.value)) {
            emailField.classList.add('pwca-form-input--error');
            isValid = false;
        }

        return isValid;
    }

    document.addEventListener('DOMContentLoaded', function () {
        const inquiryModal = document.getElementById('pwca-inquiry-modal');
        const inquiryForm = document.getElementById('pwca-inquiry-form');
        const body = document.body;
        let previousBodyOverflow = '';

        function pwcaOpenInquiryModal() {
            if (!inquiryModal) {
                return;
            }
            previousBodyOverflow = body.style.overflow || '';
            inquiryModal.classList.add('is-open');
            inquiryModal.setAttribute('aria-hidden', 'false');
            body.classList.add('modal-open');

            const firstInput = inquiryModal.querySelector('input, textarea, button');
            if (firstInput) {
                try {
                    firstInput.focus();
                } catch (e) {}
            }
        }

        function pwcaCloseInquiryModal() {
            if (!inquiryModal) {
                return;
            }
            inquiryModal.classList.remove('is-open');
            inquiryModal.setAttribute('aria-hidden', 'true');
            body.classList.remove('modal-open');
            body.style.overflow = previousBodyOverflow || '';
        }

        function pwcaHandleOverlayAndCloseButtons() {
            if (!inquiryModal) {
                return;
            }

            const overlay = inquiryModal.querySelector('.pwca-inquiry-modal__overlay');
            if (overlay) {
                overlay.addEventListener('click', function (e) {
                    if (e.target === overlay && overlay.hasAttribute('data-micromodal-close')) {
                        pwcaCloseInquiryModal();
                    }
                });
            }

            const closeTriggers = inquiryModal.querySelectorAll('[data-micromodal-close]');
            closeTriggers.forEach(function (el) {
                el.addEventListener('click', function (e) {
                    e.preventDefault();
                    pwcaCloseInquiryModal();
                });
            });
        }

        function pwcaHandleEscKey(event) {
            if (event.key === 'Escape' && inquiryModal && inquiryModal.classList.contains('is-open')) {
                pwcaCloseInquiryModal();
            }
        }

        function pwcaSetupInquiryButton() {
            const inquiryBtn = document.getElementById('pwca-inquiry-btn');
            if (!inquiryBtn) {
                return;
            }

            inquiryBtn.addEventListener('click', function (e) {
                e.preventDefault();
                const productId = pwcaGetProductIdFromUrl();
                if (!productId) {
                    // eslint-disable-next-line no-console
                    console.error('Product ID not found in URL');
                    return;
                }
                pwcaOpenInquiryModal();
            });
        }

        function pwcaHandleFormSubmit(event) {
            event.preventDefault();

            if (!inquiryForm) {
                return;
            }

            const productId = pwcaGetProductIdFromUrl();
            if (!productId) {
                pwcaShowMessage('Product ID not found', 'error');
                return;
            }

            if (!pwcaValidateForm(inquiryForm)) {
                pwcaShowMessage('Please fill in all required fields correctly.', 'error');
                return;
            }

            const formData = new FormData(inquiryForm);
            const requestData = {
                product_id: productId,
                inquiry_first_name: formData.get('inquiry_first_name'),
                inquiry_last_name: formData.get('inquiry_last_name'),
                inquiry_email: formData.get('inquiry_email'),
                inquiry_phone: formData.get('inquiry_phone'),
                inquiry_message: formData.get('inquiry_message')
            };

            const submitBtn = document.querySelector('.pwca-inquiry-modal__btn--submit');
            const originalText = submitBtn ? submitBtn.textContent : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitting...';
            }

            const restEndpoint = pwcaGetRestEndpoint();

            window.fetch(restEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    if (data && data.success) {
                        pwcaShowMessage(data.message || 'Your inquiry has been sent successfully!', 'success');
                        inquiryForm.reset();
                        window.setTimeout(function () {
                            pwcaCloseInquiryModal();
                        }, 2000);
                    } else {
                        const msg = data && data.message ? data.message : 'An error occurred. Please try again.';
                        pwcaShowMessage(msg, 'error');
                    }
                })
                .catch(function (error) {
                    // eslint-disable-next-line no-console
                    console.error('Error:', error);
                    pwcaShowMessage('Network error. Please try again.', 'error');
                })
                .finally(function () {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText || 'Submit';
                    }
                });
        }

        pwcaHandleOverlayAndCloseButtons();
        pwcaSetupInquiryButton();
        document.addEventListener('keydown', pwcaHandleEscKey);

        if (inquiryForm) {
            inquiryForm.addEventListener('submit', pwcaHandleFormSubmit);
            pwcaSetupValidation(inquiryForm);
        }

        window.pwcaOpenInquiryModal = pwcaOpenInquiryModal;
        window.pwcaCloseInquiryModal = pwcaCloseInquiryModal;
    });
})();