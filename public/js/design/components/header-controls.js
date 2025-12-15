
const { createApp, ref, computed, onMounted } = window.Vue;
// Ensure Pinia is available or wait for it? 
// The init script in template-canvas-display.php creates Pinia. 
// We should import it from the shared store file if possible, or use the global one.
// The file public/js/design/stores/index.js exports pinia instance.
import { useCanvasStore, pinia } from '../stores/index.js';

const HeaderControls = {
    name: 'HeaderControls',
    setup() {
        const store = useCanvasStore();
        const activeTab = ref('viewDesign'); // Default tab

        // Helper to get product name from page title or elsewhere
        const getProductName = () => {
            return document.title.split(' - ')[1] || 'Product';
        };

        const switchTab = async (tab) => {
            activeTab.value = tab;
            
            if (tab === 'viewMockup') {
                // Logic from old renderBtn click listener
                // 1. Clear selection on all canvases
                if (window.CanvasManager && typeof window.CanvasManager.getAllCanvasIds === 'function') {
                    const allCanvasIds = window.CanvasManager.getAllCanvasIds();
                    allCanvasIds.forEach(viewId => {
                        const fc = window.CanvasManager.getCanvas(viewId);
                        if (fc) {
                            try {
                                const active = typeof fc.getActiveObject === 'function' ? fc.getActiveObject() : null;
                                if (active && active.isEditing && typeof active.exitEditing === 'function') active.exitEditing();
                                if (typeof fc.discardActiveObject === 'function') fc.discardActiveObject();
                                fc.renderAll();
                            } catch (e) {
                                console.warn('Error clearing canvas selection:', e);
                            }
                        }
                    });
                }

                // 2. Show Universal View Preview if views exist
                if (store.views && store.views.length > 0) {
                    if (typeof window.showUniversalViewPreview === 'function') {
                        await window.showUniversalViewPreview(store.views);
                    } else {
                        console.error('window.showUniversalViewPreview is not defined');
                    }
                    return;
                }

                // 3. Fallback to captureCanvas and show in new window (Single view or legacy)
                try {
                    // Check if capturePreviewCanvas exists (global)
                    const captureFn = document.querySelector('.preview-canvas-container') && typeof window.capturePreviewCanvas === 'function' 
                        ? window.capturePreviewCanvas 
                        : (typeof window.captureCanvas === 'function' ? window.captureCanvas : null);

                    if (captureFn) {
                        const imageData = await captureFn();
                        const previewWindow = window.open('', '_blank');
                        previewWindow.document.write(`
                            <html>
                            <head>
                                <title>Preview</title>
                                <style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f0f0;}img{max-width:100%;max-height:90vh;box-shadow:0 0 20px rgba(0,0,0,0.1);} </style>
                            </head>
                            <body>
                                <img src="${imageData}" alt="Preview">
                            </body>
                            </html>
                        `);
                        previewWindow.document.close();
                    } else {
                        console.error('Capture function not found');
                    }
                } catch (e) {
                    console.error('Error in single view preview:', e);
                }

            } else {
                // Design tab logic
                // If the modal is open, we might want to close it, but MicroModal handles that.
                // We just set the state to active.
            }
            
            // Dispatch event for compatibility
            document.dispatchEvent(new CustomEvent('tab-switched', { detail: { tab } }));
        };

        const generatePdf = async () => {
            const productName = getProductName();
            
            // Check for Multi-View mode
            if (store.views && store.views.length > 0) {
                if (typeof window.generateMultiViewPDF === 'function') {
                    await window.generateMultiViewPDF(productName, store);
                } else {
                    console.error('generateMultiViewPDF not found');
                }
            } else {
                // Single View mode
                if (typeof window.generateSingleViewPDF === 'function') {
                    await window.generateSingleViewPDF(productName);
                } else {
                    console.error('generateSingleViewPDF not found');
                }
            }
        };

        return {
            store,
            activeTab,
            switchTab,
            generatePdf
        };
    },
    props: {
        productLink: {
            type: String,
            default: '#'
        }
    },
    template: `
        <div class="header_right_content" style="display: contents;">
            <div id="history-controls" class="history-controls">
                <div v-for="view in store.views" :key="view.id" v-show="view.id === store.activeViewId" class="history-btn-group">
                    <button :id="'backward-' + view.id" class="history-btn" style="color: #ccc; background: none; border: none; cursor: default; padding: 0 5px;">
                        <i class="iconfont icon-houtui" style="font-size: 20px;"></i>
                    </button>
                    <button :id="'forward-' + view.id" class="history-btn" style="color: #ccc; background: none; border: none; cursor: default; padding: 0 5px;">
                        <i class="iconfont icon-Icon-forward" style="font-size: 20px;"></i>
                    </button>
                </div>
            </div>
            <div class="design-switch-btn-box">
                <!-- Tab Button 1: Principle -->
                <button 
                    class="design-switch-btn" 
                    :class="{ active: activeTab === 'viewDesign' }" 
                    @click="switchTab('viewDesign')"
                    data-tab="viewDesign">
                    Design
                </button>
                <!-- Tab Button 2: Logic -->
                <button 
                    class="design-switch-btn" 
                    id="renderBtn"
                    :class="{ active: activeTab === 'viewMockup' }" 
                    @click="switchTab('viewMockup')"
                    data-tab="viewMockup">
                    Mockups
                </button>
            </div>    
            <button id="generatePdfBtn" @click="generatePdf">PDF</button>
            <a :href="productLink" class="close-btn" title="返回产品页">
                X
            </a>
        </div>
    `
};

// Auto-mount logic
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('header-controls-app');
    if (container) {
        const productLink = container.dataset.productLink || '#';
        
        // Ensure Pinia is ready
        // We use the imported 'pinia' instance.
        
        const app = createApp(HeaderControls, { productLink });
        app.use(pinia);
        app.mount(container);
        
        console.log('HeaderControls App Mounted');
    }
});

export { HeaderControls };
