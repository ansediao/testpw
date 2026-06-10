// src/stores/index.js
// Re-export all stores for backward compatibility

import { useCanvasStore, pinia } from './canvas-state-store.js';
import { useDesignUsageStore } from './design-usage-store.js';
import { usePrintMethodStore } from './print-method-store.js';

export { useCanvasStore, useDesignUsageStore, usePrintMethodStore, pinia };

// Expose stores to global scope for non-module scripts
window.pwcaUsePrintMethodStore = usePrintMethodStore;

// Notify other scripts that stores are ready
let eventTriggered = false;

const triggerReadyEvent = () => {
    if (eventTriggered) {
        return;
    }

    document.dispatchEvent(new CustomEvent('canvasPiniaReady', {
        detail: {
            pinia,
            useCanvasStore: window.pwcaUseCanvasStore,
            usePrintMethodStore: window.pwcaUsePrintMethodStore
        }
    }));

    eventTriggered = true;
};

document.addEventListener('DOMContentLoaded', triggerReadyEvent);

if (document.readyState === 'loading') {
    // DOM still loading, wait for DOMContentLoaded
} else {
    // DOM already loaded, trigger immediately
    setTimeout(triggerReadyEvent, 0);
}
