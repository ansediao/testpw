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
