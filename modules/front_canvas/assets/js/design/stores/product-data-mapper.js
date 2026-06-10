const PWCA_DEFAULT_ACTIVE_MODULES = ['TEXT', 'UPLOAD', 'DESIGN'];
const PWCA_DEFAULT_TEXT_FONT_FAMILY = 'Arial';
const PWCA_DEFAULT_TEXT_FONT_SIZE = 30;
const PWCA_FALLBACK_TEXT_FONT_OPTIONS = [
    'Arial',
    'Times New Roman',
    'Courier New',
    'SimSun',
    'Microsoft YaHei'
];

const PWCA_DEFAULT_LAYER_CONTROLS = {
    movable: true,
    scalable: true,
    rotatable: true,
    deletable: true,
    exportable: true,
    visibility: true,
    allowUnproportionalScaling: false,
    minScaleLimit: 0.2,
    scaleBy: 'factor'
};

export const pwcaDecodePromowaresUnicodeText = (value) => {
    if (typeof value !== 'string' || value === '') {
        return value;
    }

    try {
        const pwcaDecodeHex = (hex) => String.fromCharCode(parseInt(hex, 16));

        let normalized = value.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) =>
            pwcaDecodeHex(hex)
        );

        return normalized.replace(/(?:u[0-9a-fA-F]{4})+/g, (segment) =>
            segment.replace(/u([0-9a-fA-F]{4})/g, (match, hex) =>
                pwcaDecodeHex(hex)
            )
        );
    } catch (error) {
        return value;
    }
};

const pwcaDeepDecodePromowaresUnicodeStrings = (value, seen = new WeakMap()) => {
    if (typeof value === 'string') {
        return pwcaDecodePromowaresUnicodeText(value);
    }

    if (!value || typeof value !== 'object') {
        return value;
    }

    if (seen.has(value)) {
        return seen.get(value);
    }

    if (Array.isArray(value)) {
        const normalizedArray = [];
        seen.set(value, normalizedArray);

        value.forEach((item, index) => {
            normalizedArray[index] = pwcaDeepDecodePromowaresUnicodeStrings(item, seen);
        });

        return normalizedArray;
    }

    const normalizedObject = {};
    seen.set(value, normalizedObject);

    Object.keys(value).forEach((key) => {
        normalizedObject[key] = pwcaDeepDecodePromowaresUnicodeStrings(
            value[key],
            seen
        );
    });

    return normalizedObject;
};

export const pwcaNormalizePromowaresImageUrl = (value) => {
    if (typeof value !== 'string' || value === '') {
        return value;
    }

    let normalized = value.trim();

    if (
        (normalized.startsWith('"') && normalized.endsWith('"')) ||
        (normalized.startsWith("'") && normalized.endsWith("'")) ||
        (normalized.startsWith('`') && normalized.endsWith('`'))
    ) {
        normalized = normalized.slice(1, -1).trim();
    }

    normalized = pwcaDecodePromowaresUnicodeText(normalized);

    try {
        return encodeURI(normalized);
    } catch (error) {
        return normalized;
    }
};

export const pwcaNormalizeModuleName = (value) => {
    if (typeof value !== 'string') {
        return '';
    }

    return value.trim().toUpperCase();
};

export const pwcaNormalizeModuleList = (modules) => {
    if (!Array.isArray(modules)) {
        return [];
    }

    return Array.from(
        new Set(
            modules
                .map((moduleName) => pwcaNormalizeModuleName(moduleName))
                .filter(Boolean)
        )
    );
};

export const pwcaNormalizeLayerImageUrls = (layers) => {
    if (!Array.isArray(layers)) {
        return layers;
    }

    return layers.map((layer) => {
        if (!layer || typeof layer !== 'object') {
            return layer;
        }

        const imageURL = layer?.layer_data?.content?.imageURL;

        // 即使 imageURL 已存在，仍然尝试清理（处理反引号、空格等情况）
        if (typeof imageURL === 'string' && imageURL.trim()) {
            const cleanedUrl = pwcaNormalizePromowaresImageUrl(imageURL);
            return {
                ...layer,
                layer_data: {
                    ...layer.layer_data,
                    content: {
                        ...layer.layer_data.content,
                        imageURL: cleanedUrl
                    }
                }
            };
        }

        return layer;
    });
};

export const pwcaNormalizeTemplateViewNames = (productData) => {
    if (!productData || !productData.templates) {
        return productData;
    }

    productData.templates = pwcaDeepDecodePromowaresUnicodeStrings(
        productData.templates
    );

    const templates = productData.templates;

    if (Array.isArray(templates.views)) {
        templates.views = templates.views.map((view) => ({
            ...view,
            view_name: pwcaDecodePromowaresUnicodeText(view && view.view_name),
            name: pwcaDecodePromowaresUnicodeText(view && view.name)
        }));
    }

    const customView = templates.data && templates.data.custom_view;
    if (!customView) {
        return productData;
    }

    if (customView.main_custom_view) {
        customView.main_custom_view = {
            ...customView.main_custom_view,
            view_name: pwcaDecodePromowaresUnicodeText(
                customView.main_custom_view.view_name
            )
        };
    }

    if (Array.isArray(customView.sub_custom_view)) {
        customView.sub_custom_view = customView.sub_custom_view.map((view) => ({
            ...view,
            view_name: pwcaDecodePromowaresUnicodeText(view && view.view_name)
        }));
    }

    return productData;
};

export const pwcaNormalizeTemplateImageUrls = (productData) => {
    if (!productData || !productData.templates) {
        return productData;
    }

    const templates = productData.templates;

    if (Array.isArray(templates.views)) {
        templates.views = templates.views.map((view) => ({
            ...view,
            layers: pwcaNormalizeLayerImageUrls(view && view.layers),
            data: view && view.data ? {
                ...view.data,
                layer_config: view.data.layer_config ? {
                    ...view.data.layer_config,
                    layers: pwcaNormalizeLayerImageUrls(view.data.layer_config.layers)
                } : view.data.layer_config
            } : view.data
        }));
    }

    const customView = templates.data && templates.data.custom_view;
    if (!customView) {
        return productData;
    }

    if (customView.main_custom_view) {
        customView.main_custom_view = {
            ...customView.main_custom_view,
            layers: pwcaNormalizeLayerImageUrls(customView.main_custom_view.layers),
            layer_config: customView.main_custom_view.layer_config ? {
                ...customView.main_custom_view.layer_config,
                layers: pwcaNormalizeLayerImageUrls(
                    customView.main_custom_view.layer_config.layers
                )
            } : customView.main_custom_view.layer_config
        };
    }

    if (Array.isArray(customView.sub_custom_view)) {
        customView.sub_custom_view = customView.sub_custom_view.map((view) => ({
            ...view,
            layers: pwcaNormalizeLayerImageUrls(view && view.layers),
            layer_config: view && view.layer_config ? {
                ...view.layer_config,
                layers: pwcaNormalizeLayerImageUrls(view.layer_config.layers)
            } : view.layer_config
        }));
    }

    return productData;
};

export const pwcaExtractStoreCustomizationSettings = (settings) => {
    if (!settings || typeof settings !== 'object') {
        return {};
    }

    if (
        settings.data &&
        typeof settings.data === 'object' &&
        !Array.isArray(settings.data)
    ) {
        return settings.data;
    }

    return settings;
};

export const pwcaNormalizeBooleanLike = (value) => {
    if (value === true || value === false) {
        return value;
    }

    if (value === 1 || value === '1') {
        return true;
    }

    if (value === 0 || value === '0') {
        return false;
    }

    if (typeof value !== 'string') {
        return undefined;
    }

    const normalized = value.trim().toLowerCase();

    if (['true', 'enable', 'enabled', 'yes', 'on'].includes(normalized)) {
        return true;
    }

    if (['false', 'disable', 'disabled', 'no', 'off'].includes(normalized)) {
        return false;
    }

    return undefined;
};

export const pwcaNormalizeLayerControlBoolean = (value, defaultValue) => {
    if (value === true || value === false) {
        return value;
    }

    if (value === 1 || value === '1') {
        return true;
    }

    if (value === 0 || value === '0') {
        return false;
    }

    if (typeof value !== 'string') {
        return defaultValue;
    }

    const normalized = value.trim().toLowerCase();

    if (['true', 'enable', 'enabled', 'yes', 'on'].includes(normalized)) {
        return true;
    }

    if (['false', 'disable', 'disabled', 'no', 'off'].includes(normalized)) {
        return false;
    }

    return defaultValue;
};

export const pwcaBuildMergedLayerControls = (layerControls, storeSettings) => {
    const storeSettingsData = pwcaExtractStoreCustomizationSettings(storeSettings);
    const layerControlsData =
        layerControls && typeof layerControls === 'object' ? layerControls : {};

    const pwcaGetStoreValue = (key, defaultVal) => {
        const storeVal = storeSettingsData[key];
        return storeVal !== undefined && storeVal !== null ? storeVal : defaultVal;
    };

    const pwcaGetLayerValue = (key, defaultVal) => {
        const layerVal = layerControlsData[key];
        return layerVal !== undefined && layerVal !== null ? layerVal : defaultVal;
    };

    const storeMovable = pwcaGetStoreValue(
        'moveable',
        PWCA_DEFAULT_LAYER_CONTROLS.movable
    );
    const layerMovable = pwcaGetLayerValue('movable', undefined);
    const movable = layerMovable !== undefined ? layerMovable : storeMovable;

    const storeScalable = pwcaGetStoreValue(
        'scalable',
        PWCA_DEFAULT_LAYER_CONTROLS.scalable
    );
    const layerScalable = pwcaGetLayerValue('scalable', undefined);
    const scalable = layerScalable !== undefined ? layerScalable : storeScalable;

    const storeRotatable = pwcaGetStoreValue(
        'rotatable',
        PWCA_DEFAULT_LAYER_CONTROLS.rotatable
    );
    const layerRotatable = pwcaGetLayerValue('rotatable', undefined);
    const rotatable = layerRotatable !== undefined ? layerRotatable : storeRotatable;

    const storeDeletable = pwcaGetStoreValue(
        'removable',
        PWCA_DEFAULT_LAYER_CONTROLS.deletable
    );
    const layerDeletable = pwcaGetLayerValue('deletable', undefined);
    const deletable = layerDeletable !== undefined ? layerDeletable : storeDeletable;

    const storeAllowUnproportional = pwcaGetStoreValue(
        'allow_unproportional_scaling',
        PWCA_DEFAULT_LAYER_CONTROLS.allowUnproportionalScaling
    );
    const layerAllowUnproportional = pwcaGetLayerValue(
        'allowUnproportionalScaling',
        undefined
    );
    const allowUnproportionalScaling =
        layerAllowUnproportional !== undefined
            ? layerAllowUnproportional
            : storeAllowUnproportional;

    const storeMinScaleLimit = pwcaGetStoreValue(
        'min_scale_limit',
        PWCA_DEFAULT_LAYER_CONTROLS.minScaleLimit
    );
    const layerMinScaleLimit = pwcaGetLayerValue('minScaleLimit', undefined);
    const minScaleLimit =
        layerMinScaleLimit !== undefined ? layerMinScaleLimit : storeMinScaleLimit;

    const storeScaleBy = pwcaGetStoreValue(
        'scale_by',
        PWCA_DEFAULT_LAYER_CONTROLS.scaleBy
    );
    const layerScaleBy = pwcaGetLayerValue('scaleBy', undefined);
    const scaleBy = layerScaleBy !== undefined ? layerScaleBy : storeScaleBy;

    const storeExportable = PWCA_DEFAULT_LAYER_CONTROLS.exportable;
    const layerExportable = pwcaGetLayerValue('exportable', undefined);
    const exportable =
        layerExportable !== undefined ? layerExportable : storeExportable;

    const storeVisibility = PWCA_DEFAULT_LAYER_CONTROLS.visibility;
    const layerVisibility = pwcaGetLayerValue('visibility', undefined);
    const visibility =
        layerVisibility !== undefined ? layerVisibility : storeVisibility;

    return {
        movable: pwcaNormalizeLayerControlBoolean(
            movable,
            PWCA_DEFAULT_LAYER_CONTROLS.movable
        ),
        scalable: pwcaNormalizeLayerControlBoolean(
            scalable,
            PWCA_DEFAULT_LAYER_CONTROLS.scalable
        ),
        rotatable: pwcaNormalizeLayerControlBoolean(
            rotatable,
            PWCA_DEFAULT_LAYER_CONTROLS.rotatable
        ),
        deletable: pwcaNormalizeLayerControlBoolean(
            deletable,
            PWCA_DEFAULT_LAYER_CONTROLS.deletable
        ),
        exportable: pwcaNormalizeLayerControlBoolean(
            exportable,
            PWCA_DEFAULT_LAYER_CONTROLS.exportable
        ),
        visibility: pwcaNormalizeLayerControlBoolean(
            visibility,
            PWCA_DEFAULT_LAYER_CONTROLS.visibility
        ),
        allowUnproportionalScaling: pwcaNormalizeLayerControlBoolean(
            allowUnproportionalScaling,
            PWCA_DEFAULT_LAYER_CONTROLS.allowUnproportionalScaling
        ),
        minScaleLimit:
            typeof minScaleLimit === 'number' && Number.isFinite(minScaleLimit)
                ? minScaleLimit
                : PWCA_DEFAULT_LAYER_CONTROLS.minScaleLimit,
        scaleBy: ['factor', 'dimension'].includes(scaleBy)
            ? scaleBy
            : PWCA_DEFAULT_LAYER_CONTROLS.scaleBy
    };
};

export const pwcaBuildMergedViewCustomizationSettings = (view, storeSettings) => {
    const normalizedView = view && typeof view === 'object' ? view : {};
    const storeSettingsData = pwcaExtractStoreCustomizationSettings(storeSettings);
    const mergedSettings = {
        ...storeSettingsData,
        ...normalizedView
    };

    const viewSelectedModules = pwcaNormalizeModuleList(
        normalizedView.selected_modules
    );
    const storeActiveModules = pwcaNormalizeModuleList(
        storeSettingsData.active_modules
    );

    if (viewSelectedModules.length > 0) {
        mergedSettings.selected_modules = [...viewSelectedModules];
    } else if (storeActiveModules.length > 0) {
        mergedSettings.selected_modules = [...storeActiveModules];
    } else {
        mergedSettings.selected_modules = [...PWCA_DEFAULT_ACTIVE_MODULES];
    }

    mergedSettings.active_modules =
        storeActiveModules.length > 0
            ? [...storeActiveModules]
            : [...PWCA_DEFAULT_ACTIVE_MODULES];

    const viewSinglePrintMethodOnly = pwcaNormalizeBooleanLike(
        normalizedView.single_printing_method_only
    );
    const storeSinglePrintMethodOnly = pwcaNormalizeBooleanLike(
        storeSettingsData.single_printing_method_only
    );

    if (viewSinglePrintMethodOnly !== undefined) {
        mergedSettings.single_printing_method_only = viewSinglePrintMethodOnly;
    } else if (storeSinglePrintMethodOnly !== undefined) {
        mergedSettings.single_printing_method_only = storeSinglePrintMethodOnly;
    }

    if (
        !Array.isArray(normalizedView.printing_method_list_id) ||
        normalizedView.printing_method_list_id.length === 0
    ) {
        delete mergedSettings.printing_method_list_id;
    }

    mergedSettings.store_customization_settings = storeSettingsData;

    return mergedSettings;
};

export const pwcaIsFieldVisible = (settings, groupName, fieldKey) => {
    const normalizedSettings = settings && typeof settings === 'object'
        ? settings
        : {};
    const fieldsVisibility = normalizedSettings.fields_visibility;

    if (!fieldsVisibility || typeof fieldsVisibility !== 'object') {
        return false;
    }

    const groupFields = fieldsVisibility[groupName];
    return Array.isArray(groupFields) && groupFields.includes(fieldKey);
};

export const pwcaResolveEnabledModules = (settings) => {
    const normalizedSettings = settings && typeof settings === 'object'
        ? settings
        : {};
    const selectedModules = pwcaNormalizeModuleList(
        normalizedSettings.selected_modules
    );
    if (selectedModules.length > 0) {
        return selectedModules;
    }

    const activeModules = pwcaNormalizeModuleList(normalizedSettings.active_modules);
    if (activeModules.length > 0) {
        return activeModules;
    }

    return [...PWCA_DEFAULT_ACTIVE_MODULES];
};

export const pwcaResolveTextFontOptions = (settings) => {
    const normalizedSettings = settings && typeof settings === 'object'
        ? settings
        : {};
    const googleFontValue = normalizedSettings.google_font;

    if (Array.isArray(googleFontValue)) {
        const normalizedFonts = Array.from(
            new Set(
                googleFontValue
                    .map((fontName) => String(fontName || '').trim())
                    .filter(Boolean)
            )
        );
        if (normalizedFonts.length > 0) {
            return normalizedFonts;
        }
    }

    if (typeof googleFontValue === 'string') {
        const normalizedFonts = Array.from(
            new Set(
                googleFontValue
                    .split(',')
                    .map((fontName) => fontName.trim())
                    .filter(Boolean)
            )
        );
        if (normalizedFonts.length > 0) {
            return normalizedFonts;
        }
    }

    return [...PWCA_FALLBACK_TEXT_FONT_OPTIONS];
};

export const pwcaResolveDefaultTextFontFamily = (settings) => {
    const fontOptions = pwcaResolveTextFontOptions(settings);
    return fontOptions[0] || PWCA_DEFAULT_TEXT_FONT_FAMILY;
};

export const pwcaResolveDefaultTextFontSize = (settings) => {
    const normalizedSettings = settings && typeof settings === 'object'
        ? settings
        : {};
    const fontSize = Number(normalizedSettings.font_size);

    if (Number.isFinite(fontSize) && fontSize > 0) {
        return fontSize;
    }

    return PWCA_DEFAULT_TEXT_FONT_SIZE;
};

export const pwcaPrepareCanvasProductData = (productData) => {
    pwcaNormalizeTemplateViewNames(productData);
    pwcaNormalizeTemplateImageUrls(productData);
    return productData;
};

const pwcaIsRenderablePublishedView = (view) => {
    const rawStatus = view?.status;
    
    // 如果没有状态字段，默认为允许渲染（兼容旧数据）
    if (rawStatus === undefined || rawStatus === null || String(rawStatus).trim() === '') {
        return true;
    }

    const normalizedStatus = String(rawStatus).trim().toLowerCase();
    
    // 明确排除草稿状态
    if (normalizedStatus === 'draft') {
        return false;
    }
    
    // 只有已发布状态才允许显示
    return normalizedStatus === 'published';
};

export const pwcaBuildViewsFromProductData = (productData, storeSettings) => {
    if (
        !productData ||
        !productData.templates ||
        !Array.isArray(productData.templates.views)
    ) {
        return {
            mergedViews: [],
            productViewFlow: null,
            activeViewId: null
        };
    }

    const mergedViews = productData.templates.views
        .filter((view) => pwcaIsRenderablePublishedView(view))
        .map((view) => pwcaBuildMergedViewCustomizationSettings(view, storeSettings));

    return {
        mergedViews,
        productViewFlow:
            mergedViews.length > 0 && mergedViews[0].view_flow
                ? mergedViews[0].view_flow
                : null,
        activeViewId:
            mergedViews.length > 0 && mergedViews[0] && mergedViews[0].id
                ? mergedViews[0].id
                : null
    };
};
