function pwcaNormalizeRestoreItems(items) {
    if (!Array.isArray(items)) {
        return [];
    }

    return items
        .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
        .map((item) => ({ ...item }));
}

export function pwcaNormalizeViewRestorePayload(payload) {
    const normalizedPayload =
        payload && typeof payload === 'object' ? payload : {};

    return {
        layers: pwcaNormalizeRestoreItems(normalizedPayload.layers),
        layerGroups: pwcaNormalizeRestoreItems(normalizedPayload.layerGroups)
    };
}
