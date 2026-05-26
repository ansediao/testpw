/**
 * 产品页加购前的画布图片 payload 构建器
 */
(function () {
    const EMPTY_IMAGE_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    function clearCanvasSelections() {
        if (!window.CanvasManager || typeof window.CanvasManager.getAllCanvasIds !== 'function') {
            return;
        }

        const allCanvasIds = window.CanvasManager.getAllCanvasIds();
        allCanvasIds.forEach((viewId) => {
            const fabricCanvas = window.CanvasManager.getCanvas(viewId);
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

        const canvasStore = typeof window.useCanvasStore === 'function' ? window.useCanvasStore() : null;
        const views = canvasStore && Array.isArray(canvasStore.views) ? canvasStore.views : [];
        let viewImagesPayload = [];

        if (views.length > 0 && typeof window.generateUniversalViewImages === 'function') {
            const images = await window.generateUniversalViewImages(views);
            viewImagesPayload = images.map((imgData, index) => {
                const view = views[index] || {};
                const imageArray = Array.isArray(imgData) ? imgData : [imgData];

                return {
                    id: view.id || view.view_id || `view-${index + 1}`,
                    name: view.name || view.view_name || `View ${index + 1}`,
                    images: imageArray
                };
            });
        } else if (typeof window.captureCanvas === 'function') {
            const singleImage = await window.captureCanvas();
            viewImagesPayload = [{ id: 'single', name: 'View', images: [singleImage] }];
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

    window.ProductCanvasPayloadBuilder = {
        EMPTY_IMAGE_DATA_URL,
        buildCanvasPayload
    };
})();
