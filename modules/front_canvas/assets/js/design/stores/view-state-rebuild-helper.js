import { pwcaNormalizeViewRestorePayload } from './view-restore-helper.js';

function pwcaGetRestorableCanvasObjects(canvas) {
    if (!canvas || typeof canvas.getObjects !== 'function') {
        return [];
    }

    return canvas
        .getObjects()
        .filter((obj) => obj && !obj.isBackground && obj.name !== 'background');
}

function pwcaBuildLayerNameFromObject(obj, index) {
    if (obj.layerName) {
        return obj.layerName;
    }

    if (
        (typeof window !== 'undefined' &&
            typeof window.pwcaIsTextLikeObject === 'function' &&
            window.pwcaIsTextLikeObject(obj)) ||
        obj.type === 'text' ||
        obj.type === 'i-text' ||
        obj.type === 'textbox'
    ) {
        const text = obj.text || '';
        return text.length > 15 ? `${text.substring(0, 15)}...` : text;
    }

    if (obj.type === 'image') {
        return `Image ${Date.now().toString().slice(-4)}`;
    }

    return `Layer ${index + 1}`;
}

function pwcaBuildLayerTypeFromObject(obj) {
    if (obj.layerType) {
        return obj.layerType;
    }

    if (
        (typeof window !== 'undefined' &&
            typeof window.pwcaIsTextLikeObject === 'function' &&
            window.pwcaIsTextLikeObject(obj)) ||
        obj.type === 'text' ||
        obj.type === 'i-text' ||
        obj.type === 'textbox'
    ) {
        return 'text';
    }

    if (obj.type === 'image') {
        return 'image';
    }

    return 'other';
}

export function pwcaRebuildViewRestorePayload({ layers, layerGroups, canvas }) {
    let layersToRestore = Array.isArray(layers) ? [...layers] : [];
    const layerGroupsToRestore = Array.isArray(layerGroups) ? [...layerGroups] : [];
    const userObjects = pwcaGetRestorableCanvasObjects(canvas);

    if (layersToRestore.length > 0 && userObjects.length > 0) {
        const minLen = Math.min(layersToRestore.length, userObjects.length);
        for (let i = 0; i < minLen; i++) {
            const layer = layersToRestore[i];
            const obj = userObjects[i];

            if (!layer || !obj) {
                continue;
            }

            if (!obj.id) {
                obj.id = layer.id;
            }
            if (!obj.layerName && layer.name) {
                obj.layerName = layer.name;
            }
            if (!obj.layerType && layer.type) {
                obj.layerType = layer.type;
            }
            if (!obj.groupId && layer.groupId) {
                obj.groupId = layer.groupId;
            }
            if (
                typeof layer.groupOrder === 'number' &&
                (obj.groupOrder === undefined || obj.groupOrder === null)
            ) {
                obj.groupOrder = layer.groupOrder;
            }
        }
    }

    if (layersToRestore.length === 0 && userObjects.length > 0) {
        layersToRestore = userObjects
            .map((obj, index) => {
                if (!obj) {
                    return null;
                }

                if (!obj.id) {
                    obj.id = `layer_${index}_${Date.now()}`;
                }

                return {
                    id: obj.id,
                    name: pwcaBuildLayerNameFromObject(obj, index),
                    type: pwcaBuildLayerTypeFromObject(obj),
                    visible: obj.visible !== false,
                    locked: obj.selectable === false,
                    groupId: obj.groupId || null,
                    groupOrder: obj.groupOrder || 0
                };
            })
            .filter((layerItem) => layerItem !== null);
    }

    return pwcaNormalizeViewRestorePayload({
        layers: layersToRestore,
        layerGroups: layerGroupsToRestore
    });
}
