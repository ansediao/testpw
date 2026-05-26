export function convertApiDataToInternalFormat(apiMethod) {
    return {
        id: apiMethod.id,
        name: apiMethod.name,
        label: apiMethod.name,
        print_method_area_height: apiMethod.print_method_area_height,
        print_method_area_width: apiMethod.print_method_area_width,
        size_unit: apiMethod.size_unit,
        code: apiMethod.code,
        description: apiMethod.description,
        customColors: null,
        features: {
            allowCopy: apiMethod.copyable,
            allowDelete: true,
            allowMove: true,
            allowResize: true,
            allowRotate: true,
            maxLayers: null,
            supportedTypes: ['text', 'image', 'shape'],
            colorLimitations: apiMethod.printable_color === 'All Color' ? null : apiMethod.color_list_id,
            minQuantity: apiMethod.moq_quantity,
            printArea: {
                width: apiMethod.print_method_area_width,
                height: apiMethod.print_method_area_height,
                unit: apiMethod.size_unit
            }
        },
        settings: {
            color: {
                maxColors: apiMethod.printable_color === 'All Color' ? null : apiMethod.color_list_id,
                colorType: apiMethod.printable_color === 'All Color' ? 'full' : 'limited',
                pantoneSupport: true,
                availableColors: null
            },
            moq: {
                minimum: apiMethod.moq_quantity,
                increments: 1
            },
            printArea: {
                maxWidth: apiMethod.print_method_area_width,
                maxHeight: apiMethod.print_method_area_height,
                shape: 'rectangle'
            },
            pricing: {
                printCost: apiMethod.print_cost,
                anchorPrice: apiMethod.anchor_price,
                sampleCost: apiMethod.sample_cost,
                sampleEnabled: apiMethod.sample_enabled
            },
            processing: {
                processTime: apiMethod.process_time,
                discountEnabled: apiMethod.discount_enabled,
                ranges: apiMethod.ranges || []
            },
            marks: {
                cropMark: apiMethod.crop_mark,
                bleedMark: apiMethod.bleed_mark,
                bleedValue: apiMethod.bleed_value,
                showPrintArea: apiMethod.show_print_area,
                showContentOut: apiMethod.show_content_out,
                sizeMark: apiMethod.size_mark
            },
            helper: {
                text: apiMethod.helper_text,
                image: apiMethod.helper_image
            }
        },
        apiData: apiMethod
    };
}

export function attachCustomColorsToMethod(method, customColors) {
    if (!method || !Array.isArray(customColors)) {
        return method;
    }

    return {
        ...method,
        customColors,
        apiData: {
            ...method.apiData,
            customColors
        },
        settings: {
            ...method.settings,
            color: {
                ...method.settings.color,
                availableColors: customColors
            }
        }
    };
}

export function normalizePrintMethodsApiPayload(result) {
    const apiData = result && result.data ? (result.data.data || result.data) : result;

    if (Array.isArray(apiData)) {
        return apiData;
    }

    if (apiData) {
        return [apiData];
    }

    return [];
}
