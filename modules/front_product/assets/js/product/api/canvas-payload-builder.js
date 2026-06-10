/**
 * 产品页加购前的画布图片 payload 构建器
 */
(function () {
    const EMPTY_IMAGE_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    function clearCanvasSelections() {
        if (!window.pwcaCanvasManager || typeof window.pwcaCanvasManager.getAllCanvasIds !== 'function') {
            return;
        }

        const allCanvasIds = window.pwcaCanvasManager.getAllCanvasIds();
        allCanvasIds.forEach((viewId) => {
            const fabricCanvas = window.pwcaCanvasManager.getCanvas(viewId);
            if (!fabricCanvas) {
                return;
            }

            try {
                const activeObject = typeof fabricCanvas.getActiveObject === 'function'
                    ? fabricCanvas.getActiveObject()
                    : null;

                if (activeObject && activeObject.isEditing && typeof activeObject.exitEditing === 'function') {
                    activeObject.exitEditing();
                }

                if (typeof fabricCanvas.discardActiveObject === 'function') {
                    fabricCanvas.discardActiveObject();
                }

                fabricCanvas.renderAll();
            } catch (error) {
            }
        });
    }

    async function buildCanvasPayload() {
        clearCanvasSelections();

        const canvasStore = typeof window.pwcaUseCanvasStore === 'function' ? window.pwcaUseCanvasStore() : null;
        const views = canvasStore && Array.isArray(canvasStore.views) ? canvasStore.views : [];
        let viewImagesPayload = [];

        if (views.length > 0 && typeof window.pwcaGenerateUniversalViewImages === 'function') {
            const images = await window.pwcaGenerateUniversalViewImages(views);
            viewImagesPayload = images.map((imgData, index) => {
                const view = views[index] || {};
                const imageArray = Array.isArray(imgData) ? imgData : [imgData];

                return {
                    id: view.id || view.view_id || `view-${index + 1}`,
                    name: view.name || view.view_name || `View ${index + 1}`,
                    images: imageArray
                };
            });
        } else {
            console.error('[PW Canvas] Failed to build canvas payload: No views found or generator missing');
        }

        const firstImageDataUrl =
            viewImagesPayload.length > 0 &&
            Array.isArray(viewImagesPayload[0].images) &&
            viewImagesPayload[0].images.length > 0
                ? viewImagesPayload[0].images[0]
                : EMPTY_IMAGE_DATA_URL;

        return {
            firstImageDataUrl,
            viewImagesPayload
        };
    }

    window.pwcaProductCanvasPayloadBuilder = {
        EMPTY_IMAGE_DATA_URL,
        buildCanvasPayload
    };
})();
