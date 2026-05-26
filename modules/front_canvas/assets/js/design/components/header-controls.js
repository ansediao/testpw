
const { createApp, ref, computed, onMounted, reactive, watch, nextTick } = window.Vue;
// Ensure Pinia is available or wait for it? 
// The init script in template-canvas-display.php creates Pinia. 
// We should import it from the shared store file if possible, or use the global one.
// The file modules/front_canvas/assets/js/design/stores/index.js exports pinia instance.
import { useCanvasStore, pinia } from '../stores/index.js';

// Get useRefHistory from VueUse
const { useRefHistory } = window.VueUse || {};

function pwcaGetUiStateAccess() {
    return window.pwcaUiStateAccess || null;
}

function pwcaGetCanvasByViewId(viewId) {
    const uiStateAccess = pwcaGetUiStateAccess();
    if (uiStateAccess && typeof uiStateAccess.getCanvasByViewId === 'function') {
        return uiStateAccess.getCanvasByViewId(viewId);
    }

    return window.CanvasManager && typeof window.CanvasManager.getCanvas === 'function'
        ? window.CanvasManager.getCanvas(viewId)
        : null;
}

function pwcaGetAllViewCanvases() {
    const uiStateAccess = pwcaGetUiStateAccess();
    if (uiStateAccess && typeof uiStateAccess.getAllViewCanvases === 'function') {
        return uiStateAccess.getAllViewCanvases();
    }

    return [];
}

const HeaderControls = {
    name: 'HeaderControls',
    setup() {
        if (!window.VueUse) {
            console.warn('HeaderControls: VueUse is not available. History features will be disabled.');
        }

        const store = useCanvasStore();
        const activeTab = ref('viewDesign'); // Default tab
        
        // History management per view
        const viewHistories = reactive({});

        const initHistory = (viewId) => {
            if (!window.VueUse) return;
            if (viewHistories[viewId]) return;

            const canvas = pwcaGetCanvasByViewId(viewId);
            if (!canvas) {
                console.warn(`HeaderControls: Canvas not found for view ${viewId} when initializing history.`);
                return;
            }

            // Initial state
            const historyState = ref(canvas.toJSON());
            
            // Initialize useRefHistory
            const { history, undo, redo, canUndo, canRedo, clear, pause, resume } = useRefHistory(historyState, {
                capacity: 20
            });
            
            // Flags to prevent loops
            let isRestoring = false; // Applying history to canvas
            let isSyncingFromCanvas = false; // Updating history from canvas

            // Watch history changes (undo/redo)
            watch(historyState, (val) => {
                if (isSyncingFromCanvas) {
                    return;
                }
                
                isRestoring = true;
                pause(); // Pause history recording during restore to prevent stack corruption
                
                // Deep clone the JSON to avoid reference issues
                const jsonToLoad = JSON.parse(JSON.stringify(val));

                // IMPORTANT: When loading from JSON, we must handle the callback correctly
                // Fabric.js loadFromJSON is async for images
                canvas.loadFromJSON(jsonToLoad, () => {
                    // Force re-render of images
                    const objects = canvas.getObjects();
                    
                    // Helper to restore image element
                    const restoreImage = (obj) => {
                        return new Promise(resolve => {
                            if (!obj.src) {
                                resolve();
                                return;
                            }
                            const img = new Image();
                            img.crossOrigin = 'anonymous';
                            img.onload = () => {
                                obj.setElement(img);
                                obj.setCoords();
                                resolve();
                            };
                            img.onerror = () => {
                                console.warn(`HeaderControls: Failed to reload image src: ${obj.src}`);
                                resolve();
                            };
                            img.src = obj.src;
                        });
                    };

                    if (objects && objects.length) {
                        const restorePromises = objects.map(obj => {
                            if (obj.type === 'image' || obj.type === 'image-filter') {
                                return restoreImage(obj);
                            }
                            return Promise.resolve();
                        });

                        Promise.all(restorePromises).then(() => {
                            canvas.requestRenderAll();
                            // Reset flag only after images are ready
                            setTimeout(() => {
                                isRestoring = false;
                                resume();
                            }, 100);
                        });
                    } else {
                        canvas.requestRenderAll();
                        setTimeout(() => {
                            isRestoring = false;
                            resume();
                        }, 50);
                    }
                });
            }, { flush: 'sync' });

            // Update history from canvas events
            const updateHistory = (e) => {
                if (isRestoring) {
                    return;
                }
                
                const newJson = canvas.toJSON();
                const currentJson = historyState.value;
                
                // Avoid pushing duplicate states
                if (JSON.stringify(newJson) === JSON.stringify(currentJson)) {
                    return;
                }

                isSyncingFromCanvas = true;
                
                // Use a deep clone or new object to ensure the ref updates
                historyState.value = newJson;
                
                // We need to keep isSyncingFromCanvas true until the watcher has fired and returned
                isSyncingFromCanvas = false;

                // 注意：LocalStorage 同步已由 CanvasStateManager 统一管理
                // 不再在此处进行重复的 localStorage 同步
            };

            // Attach listeners
            // Debounce the updateHistory to avoid rapid-fire updates during drag/resize
            // We can use a simple timeout for this
            let updateTimeout;
            const debouncedUpdateHistory = (e) => {
                if (updateTimeout) clearTimeout(updateTimeout);
                updateTimeout = setTimeout(() => {
                    updateHistory(e);
                }, 100); // 100ms debounce
            };

            canvas.on('object:added', debouncedUpdateHistory);
            canvas.on('object:modified', debouncedUpdateHistory);
            canvas.on('object:removed', debouncedUpdateHistory);
            canvas.on('path:created', debouncedUpdateHistory); // For free drawing

            // Store in reactive object
            viewHistories[viewId] = {
                undo,
                redo,
                canUndo,
                canRedo,
                clear
            };
        };

        // Listen for initialization complete
        const startHistory = () => {
            // Wait a bit to ensure everything is settled
            setTimeout(() => {
                if (store.views && store.views.length > 0) {
                    store.views.forEach(view => {
                        initHistory(view.id);
                    });
                }
            }, 500);
        };

        document.addEventListener('multiViewInitComplete', startHistory);
        // Also listen to the system standard event just in case
        // document.addEventListener('canvasInitializationComplete', startHistory);

        // Watch for views changes (e.g. if loaded later)
        watch(() => store.views, (newViews) => {
            if (newViews && newViews.length > 0) {
                nextTick(() => {
                    startHistory();
                });
            }
        }, { deep: true });

        // Check if initialization is already done on mount
        // onMounted(() => {
        //     // Attempt to start history if canvases are already ready
        //     if (window.CanvasManager && typeof window.CanvasManager.getAllCanvasIds === 'function') {
        //         const ids = window.CanvasManager.getAllCanvasIds();
        //         if (ids && ids.length > 0) {
        //             console.log('HeaderControls: CanvasManager already ready, starting history...', ids);
        //             startHistory();
        //         }
        //     }
        // });

        // Helper functions for template
        const handleUndo = (viewId) => {
            if (viewHistories[viewId]) {
                // Check if it's a ref (not unwrapped) or value (unwrapped)
                const canUndo = viewHistories[viewId].canUndo;
                // If viewHistories is reactive, canUndo is likely the value already
                if (canUndo === true || (canUndo && canUndo.value === true)) {
                    viewHistories[viewId].undo();
                }
            }
        };

        const handleRedo = (viewId) => {
            if (viewHistories[viewId]) {
                const canRedo = viewHistories[viewId].canRedo;
                if (canRedo === true || (canRedo && canRedo.value === true)) {
                    viewHistories[viewId].redo();
                }
            }
        };

        const getCanUndo = (viewId) => {
            if (!viewHistories[viewId]) return false;
            // Handle reactive unwrapping
            const val = viewHistories[viewId].canUndo;
            return typeof val === 'boolean' ? val : !!val.value;
        };

        const getCanRedo = (viewId) => {
            if (!viewHistories[viewId]) return false;
            // Handle reactive unwrapping
            const val = viewHistories[viewId].canRedo;
            return typeof val === 'boolean' ? val : !!val.value;
        };

        // Helper to get product name from page title or elsewhere
        const getProductName = () => {
            return document.title.split(' - ')[1] || 'Product';
        };

        const switchTab = async (tab) => {
            activeTab.value = tab;
            
            if (tab === 'viewMockup') {
                // Logic from old renderBtn click listener
                // 1. Clear selection on all canvases
                pwcaGetAllViewCanvases().forEach((fc) => {
                    if (!fc) {
                        return;
                    }

                    try {
                        const active = typeof fc.getActiveObject === 'function' ? fc.getActiveObject() : null;
                        if (active && active.isEditing && typeof active.exitEditing === 'function') active.exitEditing();
                        if (typeof fc.discardActiveObject === 'function') fc.discardActiveObject();
                        fc.renderAll();
                    } catch (e) {
                        console.warn('Error clearing canvas selection:', e);
                    }
                });

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
                // 仅更新状态，具体弹窗关闭由各自组件负责处理。
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
            generatePdf,
            handleUndo,
            handleRedo,
            getCanUndo,
            getCanRedo
        };
    },
    props: {
        productLink: {
            type: String,
            default: '#'
        }
    },
    template: '#pwca-header-controls-template'
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
