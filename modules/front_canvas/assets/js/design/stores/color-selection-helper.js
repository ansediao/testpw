export const pwcaNormalizeSelectedColorData = (colorData) => {
    if (!colorData || typeof colorData !== 'object' || Array.isArray(colorData)) {
        return null;
    }

    const normalized = { ...colorData };

    if (normalized.selectedColor !== undefined && normalized.selectedColor !== null) {
        normalized.selectedColor = String(normalized.selectedColor).trim();
    }

    return normalized;
};

export const pwcaNormalizeSelectedColorsByView = (selectedColorsByView) => {
    if (
        !selectedColorsByView ||
        typeof selectedColorsByView !== 'object' ||
        Array.isArray(selectedColorsByView)
    ) {
        return {};
    }

    return Object.entries(selectedColorsByView).reduce((result, [viewId, colorData]) => {
        const normalizedColorData = pwcaNormalizeSelectedColorData(colorData);
        if (!normalizedColorData) {
            return result;
        }

        result[viewId] = normalizedColorData;
        return result;
    }, {});
};

export const pwcaGetSelectedColorByView = (selectedColorsByView, viewId) => {
    const normalizedMap = pwcaNormalizeSelectedColorsByView(selectedColorsByView);
    return normalizedMap[viewId] || null;
};

export const pwcaSetSelectedColorByView = (selectedColorsByView, viewId, colorData) => {
    const normalizedMap = pwcaNormalizeSelectedColorsByView(selectedColorsByView);
    const normalizedColorData = pwcaNormalizeSelectedColorData(colorData);

    if (!viewId || !normalizedColorData) {
        return normalizedMap;
    }

    return {
        ...normalizedMap,
        [viewId]: normalizedColorData
    };
};

export const pwcaClearSelectedColorByView = (selectedColorsByView, viewId) => {
    const normalizedMap = pwcaNormalizeSelectedColorsByView(selectedColorsByView);

    if (!viewId || !Object.prototype.hasOwnProperty.call(normalizedMap, viewId)) {
        return normalizedMap;
    }

    const nextMap = { ...normalizedMap };
    delete nextMap[viewId];
    return nextMap;
};

export const pwcaGetTotalSelectedColorRts = (selectedColorsByView, fieldName) => {
    const normalizedMap = pwcaNormalizeSelectedColorsByView(selectedColorsByView);

    return Object.values(normalizedMap).reduce((total, colorData) => {
        const rtsValue = Number(colorData && colorData[fieldName]);
        return Number.isFinite(rtsValue) && rtsValue > 0 ? total + rtsValue : total;
    }, 0);
};
