export async function fetchPrintMethodsByIds(printingMethodIds) {
    const response = await fetch('/wp-json/pw-canvas/v1/print-methods', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            printing_method_ids: printingMethodIds
        })
    });

    if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || '获取印刷方式数据失败');
    }

    return result;
}

export async function fetchCustomColorsByListId(colorListId) {
    const response = await fetch('/wp-json/pw-canvas/v1/custom-colors', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            color_list_id: colorListId
        })
    });

    if (!response.ok) {
        throw new Error(`颜色列表请求失败: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || '获取颜色数据失败');
    }

    return result.data || [];
}
