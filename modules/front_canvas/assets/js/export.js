/**
 * PW Canvas Export Module
 * Handles canvas image capturing and exporting
 */
(function() {
    const BOUNDARY_MARGIN = 20;

    /**
     * Capture a specific view image by ID
     * @param {string} viewId 
     * @returns {Promise<string>}
     */
    async function captureViewImage(viewId) {
        if (typeof window.pwcaCaptureViewForPDF === 'function') {
            return window.pwcaCaptureViewForPDF(viewId);
        }
        
        // Fallback if captureViewForPDF is not available
        const canvas = window.pwcaCanvasManager && typeof window.pwcaCanvasManager.getCanvas === 'function' 
            ? window.pwcaCanvasManager.getCanvas(viewId) 
            : null;
            
        if (!canvas) return Promise.resolve(null);
        
        return new Promise((resolve) => {
            try {
                canvas.renderAll();
                resolve(canvas.toDataURL({ format: 'png', quality: 1 }));
            } catch (e) {
                resolve(null);
            }
        });
    }

    // 导出模块接口
    window.captureViewImage = captureViewImage;
})();
