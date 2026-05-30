(function () {
    const PWCA_DEFAULT_VIEW_FLOW = 'Flat Flow';
    const PWCA_FOUR_GRID_VIEW_FLOW = '4-Grid Flow';

    function pwcaGetCanvasStoreSafe(explicitStore) {
        if (explicitStore) {
            return explicitStore;
        }

        if (typeof window.useCanvasStore === 'function') {
            try {
                return window.useCanvasStore();
            } catch (e) {
                return null;
            }
        }

        return null;
    }

    function pwcaResolveViewFlow(view, explicitStore) {
        const store = pwcaGetCanvasStoreSafe(explicitStore);
        const flow = view && (
            view.view_flow ||
            (view.data && view.data.view_flow)
        );

        if (typeof flow === 'string' && flow.trim()) {
            return flow.trim();
        }

        const productFlow = store && typeof store.getProductViewFlow === 'function'
            ? store.getProductViewFlow()
            : null;

        if (typeof productFlow === 'string' && productFlow.trim()) {
            return productFlow.trim();
        }

        return PWCA_DEFAULT_VIEW_FLOW;
    }

    function pwcaIsFourGridFlow(view, explicitStore) {
        return pwcaResolveViewFlow(view, explicitStore) === PWCA_FOUR_GRID_VIEW_FLOW;
    }

    window.PWCA_DEFAULT_VIEW_FLOW = PWCA_DEFAULT_VIEW_FLOW;
    window.PWCA_FOUR_GRID_VIEW_FLOW = PWCA_FOUR_GRID_VIEW_FLOW;
    window.pwcaResolveViewFlow = pwcaResolveViewFlow;
    window.pwcaIsFourGridFlow = pwcaIsFourGridFlow;
})();
