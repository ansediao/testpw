async function showUniversalViewPreview(views) {
    function pwcaSwitchUniversalPreviewBackToDesign() {
        const designButton = document.querySelector('.design-switch-btn-box .design-switch-btn[data-tab="viewDesign"]');
        if (designButton instanceof HTMLButtonElement) {
            designButton.click();
        }
    }

    const existingModal = document.getElementById('universal-view-preview-modal');
    if (existingModal) { existingModal.remove(); }
    const modalHTML = `
        <div class="modal micromodal-slide" id="universal-view-preview-modal" aria-hidden="true">
            <div class="modal__overlay" tabindex="-1" data-micromodal-close>
                <div class="modal__container modal__container--fullscreen" role="dialog" aria-modal="true" aria-labelledby="universal-view-title">
                    <header class="modal__header">
                        <h2 class="modal__title" id="universal-view-title">Multi-View Preview</h2>
                        <button class="modal__close" aria-label="Close modal" data-micromodal-close></button>
                    </header>
                    <main class="modal__content modal__content--scrollable">
                        <div class="preview-body">
                                 <div class="thumbnail-list">
                                 <div class="loading">Loading views...</div>
                             </div>
                             <div class="main-preview">
                                 <div class="preview-placeholder">Please select a view from the left</div>
                             </div>
                         </div>
                    </main>
                </div>
            </div>
        </div>
    `;
    const style = document.createElement('style');
    style.textContent = `#universal-view-preview-modal{position:fixed!important;top:0!important;left:0!important;width:100%!important;height:100%!important;z-index:99999!important;display:none}
    #universal-view-preview-modal.is-open{display:flex!important}
    #universal-view-preview-modal .modal__overlay{position:fixed!important;top:0!important;left:0!important;right:0!important;bottom:0!important;background:rgba(0,0,0,0.8)!important;display:flex!important;justify-content:center!important;align-items:center!important;z-index:99999!important;width:100%!important;height:100%!important}
    #universal-view-preview-modal .modal__container{background-color:white!important;padding:0!important;border-radius:0!important;box-shadow:none!important;width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;overflow:hidden!important;position:relative!important;z-index:100000!important}
    .modal__container--fullscreen{width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;margin:0!important;border-radius:0!important;display:flex;flex-direction:column}
    .modal__content--scrollable{flex:1;overflow-y:auto;padding:0}
    .modal__header{padding:20px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;background:#f8f9fa;flex-shrink:0}
    .modal__title{margin:0;color:#333;font-size:18px}
    .modal__close{background:none;border:none;font-size:24px;cursor:pointer;color:#666;padding:0;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:4px}
    .modal__close:hover{background:#e9ecef;color:#333}
    .modal__close::before{content:'×'}
    .preview-body{display:flex;height:100%;min-height:calc(100vh - 80px)}
    .thumbnail-list{width:50%;background:#f8f9fa;border-right:1px solid #eee;overflow-y:auto;padding:20px;flex-shrink:0;display:flex;flex-wrap:wrap;gap:15px;align-content:flex-start}
    .thumbnail-item{width:calc(24% - 12px);cursor:pointer;border:2px solid transparent;border-radius:8px;overflow:hidden;transition:all .3s ease;flex-shrink:0}
    .thumbnail-item:hover{border-color:#007bff;transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,123,255,.15)}
    .thumbnail-item.active{border-color:#007bff;box-shadow:0 0 0 1px #007bff}
    .thumbnail-item img{width:100%;height:auto;display:block}
    .thumbnail-label{padding:10px;background:#fff;text-align:center;font-size:14px;color:#333;border-top:1px solid #eee}
    .main-preview{width:50%;display:flex;align-items:center;justify-content:center;background:#fff;overflow:auto;height:100%}
    .main-preview img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.1)}
    .preview-placeholder{color:#666;font-size:16px;text-align:center}
    .loading{text-align:center;color:#666;padding:20px}
    @media (max-width:768px){.preview-body{flex-direction:column}.thumbnail-list{width:100%;max-height:200px;border-right:none;border-bottom:1px solid #eee;gap:8px}.thumbnail-item{width:calc(25% - 6px)}.main-preview{width:100%;height:calc(100% - 200px)}}`;
    document.head.appendChild(style);
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    setTimeout(() => {
        const modal = document.getElementById('universal-view-preview-modal');
        if (!modal) return;

        const overlay = modal.querySelector('.modal__overlay');
        const closeButton = modal.querySelector('.modal__close');

        const close = () => {
            modal.classList.remove('is-open');
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
            document.removeEventListener('keydown', onKeyDown);
            pwcaSwitchUniversalPreviewBackToDesign();
        };

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                close();
            }
        };

        if (overlay) {
            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) {
                    close();
                }
            });
        }

        if (closeButton) {
            closeButton.addEventListener('click', (event) => {
                event.preventDefault();
                close();
            });
        }

        document.body.classList.add('modal-open');
        modal.style.display = 'flex';
        modal.classList.add('is-open');
        document.addEventListener('keydown', onKeyDown);
    }, 10);
    const viewImages = await window.generateUniversalViewImages(views);
    const thumbnailList = document.querySelector('#universal-view-preview-modal .thumbnail-list');
    const mainPreview = document.querySelector('#universal-view-preview-modal .main-preview');
    thumbnailList.innerHTML = '';
    viewImages.forEach((imageData, index) => {
        const view = views[index];
        const isGridView = !!(window.pwcaIsFourGridFlow && window.pwcaIsFourGridFlow(view));
        const configuredPreviewLabels = typeof window.pwcaGetFlowPreviewImageConfigs === 'function'
            ? window.pwcaGetFlowPreviewImageConfigs(view)
                .filter(function (config) { return config.enabled !== false; })
                .map(function (config, configIndex) {
                    return config?.label || config?.key || `Image ${configIndex + 1}`;
                })
            : [];
        if (isGridView && Array.isArray(imageData)) {
            const imageLabels = configuredPreviewLabels.length > 0
                ? configuredPreviewLabels
                : imageData.map((_, imageIndex) => `Image ${imageIndex + 1}`);
            imageData.forEach((gridImageData, gridIndex) => {
                const currentLabel = imageLabels[gridIndex] || `Image ${gridIndex + 1}`;
                const thumbnailItem = document.createElement('div');
                thumbnailItem.className = `thumbnail-item ${thumbnailList.children.length === 0 ? 'active' : ''}`;
                thumbnailItem.innerHTML = `<img src="${gridImageData}" alt="${view.name || `View ${index + 1}`} - ${currentLabel}" /><div class="thumbnail-label">${view.name || `View ${index + 1}`} - ${currentLabel}</div>`;
                thumbnailItem.addEventListener('click', () => {
                    thumbnailList.querySelectorAll('.thumbnail-item').forEach(item => { item.classList.remove('active'); });
                    thumbnailItem.classList.add('active');
                    mainPreview.innerHTML = `<img src="${gridImageData}" alt="${view.name || `View ${index + 1}`} - ${currentLabel}">`;
                });
                thumbnailList.appendChild(thumbnailItem);
            });
        } else {
            const thumbnailItem = document.createElement('div');
            thumbnailItem.className = `thumbnail-item ${thumbnailList.children.length === 0 ? 'active' : ''}`;
            thumbnailItem.innerHTML = `<img src="${imageData}" alt="${view.name || `View ${index + 1}`}" /><div class="thumbnail-label">${view.name || `View ${index + 1}`}</div>`;
            thumbnailItem.addEventListener('click', () => {
                thumbnailList.querySelectorAll('.thumbnail-item').forEach(item => { item.classList.remove('active'); });
                thumbnailItem.classList.add('active');
                mainPreview.innerHTML = `<img src="${imageData}" alt="${view.name || `View ${index + 1}`}">`;
            });
            thumbnailList.appendChild(thumbnailItem);
        }
    });
    if (viewImages.length > 0) {
        const firstView = views[0];
        const firstImageData = viewImages[0];
        if ((window.pwcaIsFourGridFlow && window.pwcaIsFourGridFlow(firstView)) && Array.isArray(firstImageData)) {
            const firstFlowConfig = typeof window.pwcaGetFlowPreviewImageConfigs === 'function'
                ? window.pwcaGetFlowPreviewImageConfigs(firstView).filter(function (c) { return c.enabled !== false; })[0]
                : null;
            const firstLabel = firstFlowConfig?.label || firstFlowConfig?.key || 'Image 1';
            mainPreview.innerHTML = `<img src="${firstImageData[0]}" alt="${firstView.name || 'View 1'} - ${firstLabel}">`;
        }
        else { mainPreview.innerHTML = `<img src="${firstImageData}" alt="${firstView.name || 'View 1'}">`; }
    }
}

window.showUniversalViewPreview = showUniversalViewPreview;
